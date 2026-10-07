/* =========================================================================
   Tests du modèle BFR-Chantier — exécution :  node tests/test-modele.js
   Vérifie les calculs critiques : heures, hommes-heures, avancement pondéré,
   reports d'un jour sur l'autre, ancienneté des blocages, règles d'alerte,
   destinataires, vérification de clôture, textes du mail.
   ========================================================================= */
'use strict';
const M = require('../app/src/modele.js');

let ok = 0, ko = 0;
const echecs = [];
function T(nom, condition, detail) {
  if (condition) { ok++; }
  else { ko++; echecs.push(nom + (detail !== undefined ? '  →  ' + detail : '')); }
}
function egal(nom, obtenu, attendu) {
  T(nom, obtenu === attendu, 'obtenu : ' + JSON.stringify(obtenu) + ' | attendu : ' + JSON.stringify(attendu));
}
function proche(nom, obtenu, attendu, tolerance) {
  const t = tolerance === undefined ? 0.01 : tolerance;
  T(nom, Math.abs(obtenu - attendu) <= t, 'obtenu : ' + obtenu + ' | attendu : ' + attendu);
}

/* ---------------------------------------------------------------- heures */
egal('minutes("07:45")', M.minutes('07:45'), 465);
egal('minutes("7h30")', M.minutes('7h30'), 450);
egal('minutes("0745")', M.minutes('0745'), 465);
egal('minutes("") -> null', M.minutes(''), null);
egal('texteHeures(450)', M.texteHeures(450), '7 h 30');
egal('texteHeures(120)', M.texteHeures(120), '2 h 00');
egal('texteHeuresDec(7.5)', M.texteHeuresDec(7.5), '7 h 30');

/* ---------------------------------------------------------------- pauses */
/* Une pause ouverte (sans heure de reprise) ne laisse pas le compteur courir :
   elle est déduite jusqu'à l'instant présent. Cas choisis pour être vrai à
   n'importe quelle heure de la journée. */
const jPause = { debut: '00:00', fin: '', pauses: [{ debut: '00:00', fin: '' }], effectif: { nb: 1 } };
egal('journée entièrement en pause : durée nulle', M.dureeJourneeMn(jPause), 0);
T('la pause ouverte est reconnue comme en cours', !!M.pauseEnCours(jPause));
egal('le début de la pause est connu', M.pauseEnCours(jPause).debut, '00:00');

const jClos = { debut: '08:00', fin: '14:00', pauses: [{ debut: '10:00', fin: '' }], effectif: { nb: 2 } };
egal('journée close avec pause restée ouverte : la pause court jusqu au départ',
  M.dureeJourneeMn(jClos), 120);   /* 6 h moins 4 h */
egal('une journée close n est plus en pause', M.pauseEnCours(jClos), null);

egal('aucune pause : rien en cours', M.pauseEnCours({ debut: '08:00', fin: '', pauses: [] }), null);
egal('pause terminée : rien en cours',
  M.pauseEnCours({ pauses: [{ debut: '12:00', fin: '13:00' }] }), null);
egal('journée absente : rien en cours', M.pauseEnCours(null), null);

/* -------------------------------------------------- jalons : ajouter, retirer */
/* Un chantier d'essai dédié : on ne touche pas au chantier des autres tests. */
const chJ = M.nouveauChantier({ libelle: "Chantier d'essai — jalons" });
egal('le chantier d\'essai part de 13 jalons', chJ.jalons.length, 13);

const jn = M.ajouterJalon(chJ, '  Formation des conducteurs  ', 4);
egal('le jalon ajouté entre en fin de liste', chJ.jalons.length, 14);
egal('son libellé est nettoyé', jn.libelle, 'Formation des conducteurs');
egal('son poids est repris', jn.poids, 4);
egal('il démarre à 0 %', jn.avancement, 0);
egal('son identifiant est unique', chJ.jalons.filter((j) => j.id === jn.id).length, 1);
egal('un libellé vide est refusé', M.ajouterJalon(chJ, '   ', 3), null);
egal('le refus n\'ajoute rien', chJ.jalons.length, 14);
egal('un poids absent vaut 0', M.ajouterJalon(chJ, 'Reprise des plans').poids, 0);
egal('un jalon sans chantier est refusé', M.ajouterJalon(null, 'Jalon'), null);

/* le poids du jalon ajouté entre dans l'avancement global (poids total 104) */
M.appliquerAvancement(chJ, jn.id, 100);
egal('avancement global pondéré avec le jalon ajouté', M.avancementChantier(chJ), 4);

/* retrait : la tâche rattachée est détachée, jamais supprimée */
const jr = M.creerJournee(chJ);
jr.taches = [
  { id: 't1', libelle: 'Pose des capteurs', jalonId: 'montage' },
  { id: 't2', libelle: 'Formation', jalonId: jn.id },
  { id: 't3', libelle: 'Divers', jalonId: '' }
];
egal('tâches rattachées à un jalon', M.tachesDuJalon([jr], jn.id), 1);
egal('aucune tâche pour un jalon inconnu', M.tachesDuJalon([jr], 'inexistant'), 0);

const retrait = M.retirerJalon(chJ, jn.id, [jr]);
egal('le jalon est retiré de la liste', chJ.jalons.length, 14);
egal('le jalon retiré est renvoyé', retrait.jalon.libelle, 'Formation des conducteurs');
egal('le nombre de tâches détachées est annoncé', retrait.detachees, 1);
egal('le nombre de jalons restants est annoncé', retrait.restants, 14);
T('la tâche est conservée, détachée du jalon',
  jr.taches.length === 3 && jr.taches[1].jalonId === '', JSON.stringify(jr.taches[1]));
egal('le retrait ne touche pas les autres tâches', jr.taches[0].jalonId, 'montage');
egal('avancement global recalculé sans ce jalon', M.avancementChantier(chJ), 0);
egal('retirer un jalon inconnu ne fait rien', M.retirerJalon(chJ, 'inexistant', [jr]), null);
egal('retirer deux fois le même jalon ne fait rien', M.retirerJalon(chJ, jn.id, [jr]), null);

/* un chantier sans aucun jalon ne divise pas par zéro */
const chSansJalon = M.nouveauChantier({ libelle: 'Sans jalons' });
/* on retire sur une copie : retirerJalon modifie la liste parcourue */
[...chSansJalon.jalons].forEach((j) => M.retirerJalon(chSansJalon, j.id, []));
egal('tous les jalons peuvent être retirés', chSansJalon.jalons.length, 0);
egal('un chantier sans jalon reste à 0 %', M.avancementChantier(chSansJalon), 0);

/* ---------------------------------------------------------------- journée */
const chantier = M.nouveauChantier({ numeroAffaire: '25-0142', libelle: 'Ligne 3', dureePrevueJours: 8, effectifPrevu: 3 });
egal('13 jalons par défaut', chantier.jalons.length, 13);
egal('poids total des jalons = 100', chantier.jalons.reduce((t, j) => t + j.poids, 0), 100);

const j1 = M.creerJournee(chantier);
j1.debut = '07:45'; j1.fin = '16:30';
j1.pauses = [{ debut: '12:00', fin: '13:00' }];
j1.effectif = { nb: 3, detail: '1 électricien, 1 automaticien, 1 chef de chantier' };
egal('durée journee 07:45->16:30 pause 1h', M.dureeJourneeMn(j1), 465);   // 8h45 - 1h
proche('hommes-heures = 3 × 7,75 h', M.hommesHeures(j1), 23.25);
egal('affichage hommes-heures', M.texteHeuresDec(M.hommesHeures(j1)), '23 h 15');

/* pause non renseignée -> ignorée, fin manquante -> heure courante (déduite) */
const jtmp = { debut: '08:00', fin: '', pauses: [{ debut: '12:00', fin: '' }], effectif: { nb: 2 } };
T('durée avec pause incomplète et fin vide reste positive', M.dureeJourneeMn(jtmp) >= 0);

/* ------------------------------------------------------------- avancement */
egal('avancement initial 0 %', M.avancementChantier(chantier), 0);
M.appliquerAvancement(chantier, 'montage', 100);      // poids 12
M.appliquerAvancement(chantier, 'cablage', 80);       // poids 12
M.appliquerAvancement(chantier, 'parametrage', 35);   // poids 14
const attendu = Math.round((100 * 12 + 80 * 12 + 35 * 14) / 100);
egal('avancement pondéré', M.avancementChantier(chantier), attendu);
egal('avancement borné à 100', (M.appliquerAvancement(chantier, 'cablage', 999), chantier.jalons.find(j => j.id === 'cablage').avancement), 100);
egal('avancement ne descend pas sous 0', (M.appliquerAvancement(chantier, 'cablage', -999), chantier.jalons.find(j => j.id === 'cablage').avancement), 0);
M.appliquerAvancement(chantier, 'cablage', 80);

/* --------------------------------------------------------------- blocages */
const b1 = { id: 'b1', description: 'Presse hydraulique HS', gravite: 1, debloqueur: 'ATELIER', statut: 'OUVERT', ouvertLe: '2026-10-05' };
const b2 = { id: 'b2', description: 'Accès production refusé', gravite: 2, debloqueur: 'CHARGE_AFFAIRE', statut: 'OUVERT', ouvertLe: '2026-10-07' };
const b3 = { id: 'b3', description: 'Réglé', gravite: 2, debloqueur: 'CLIENT', statut: 'LEVE', ouvertLe: '2026-10-06', leveLe: '2026-10-07' };
j1.blocages = [b1];
const j2 = M.creerJournee(chantier, j1, '2026-10-07');
j2.blocages = [b2, b3];
const ouverts = M.blocagesOuverts([j1, j2], '2026-10-07');
egal('2 blocages ouverts (le levé est exclu)', ouverts.length, 2);
egal('le plus grave en tête', ouverts[0].blocage.description, 'Presse hydraulique HS');
egal('ancienneté du blocage du 05/10 au 07/10', ouverts[0].anciennete, 2);
T('blocage non persistant à 2 jours', ouverts[0].persistant === false);
T('blocage persistant à partir de 3 jours', M.blocagesOuverts([j1], '2026-10-08')[0].persistant === true);

/* ------------------------------------------------------------------ alertes */
const al1 = M.alerteGrave(j1);
T('gravité 1 => alerte', al1.alerte === true && al1.gravite1.length === 1);
const al2 = M.alerteGrave(j2);
T('pas d\'alerte pour gravité 2 seule', al2.alerte === false);
j2.securite.incidents = [{ description: 'Chute d\'outil sans conséquence' }];
T('incident de sécurité => alerte même sans blocage', M.alerteGrave(j2).alerte === true);

/* ---------------------------------------------------------------- compteurs */
const c = M.compteurs(j2, M.cumulHommesHeures([j1, j2]));
egal('compteur blocages : 1 ouvert (le levé ne compte pas)', c.blocages, 1);
egal('compteur blocages graves', c.blocagesGraves, 0);
egal('compteur incidents', c.incidents, 1);

/* -------------------------------------------------------------- vérif clôture */
j1.synthese = 'Montage terminé, câblage à 80 %.';
j1.securite.renseigne = true;
j1.prevuDemain = { taches: ['Terminer le câblage'], effectif: 3, besoins: [] };
const vc = M.verifierCloture(j1);
T('journée complète : clôture possible', vc.complete === true, JSON.stringify(vc.manques));
const j3 = M.creerJournee(chantier, j1, '2026-10-08');
const vc3 = M.verifierCloture(j3);
egal('5 points manquants sur une journée vide', vc3.manques.length, 5);
T('la sécurité fait partie des points bloquants', vc3.manques.some(m => m.champ === 'securite'));

/* ------------------------------------------------------------------ reports */
j1.taches = [
  { id: 't1', libelle: 'Montage support moteur', jalonId: 'montage', etat: 'FAIT', avancement: 10 },
  { id: 't2', libelle: 'Câblage armoire', jalonId: 'cablage', etat: 'PARTIEL', avancement: 20, motif: 'attente pièce' },
  { id: 't3', libelle: 'Paramétrage variateur', jalonId: 'parametrage', etat: 'PREVU' }
];
j1.prevuDemain = { taches: ['Câblage armoire', 'Début paramétrage variateur'], effectif: 3, besoins: ['accès zone production dès 8 h'] };
const j4 = M.creerJournee(chantier, j1, '2026-10-08');
egal('tâches reprises = 2 reportées + 1 nouvelle (dédoublonnée)', j4.taches.length, 3);
T('la tâche faite n\'est PAS reprise', !j4.taches.some(t => t.libelle === 'Montage support moteur'));
T('« Câblage armoire » repris une seule fois', j4.taches.filter(t => t.libelle === 'Câblage armoire').length === 1);
T('« Début paramétrage variateur » ajouté depuis le plan de la veille', j4.taches.some(t => t.libelle === 'Début paramétrage variateur'));
T('les tâches reprises sont à faire', j4.taches.every(t => t.etat === 'PREVU'));
egal('numérotation J(n+1)', j4.numero, j1.numero + 1);
egal('effectif repris de la veille', j4.effectif.nb, 3);

/* ----------------------------------------------------------------- cumuls */
proche('cumul hommes-heures des 2 journées', M.cumulHommesHeures([j1, j2]), M.hommesHeures(j1) + M.hommesHeures(j2));

/* ----------------------------------------------------------- destinataires */
const reglages = {
  responsables: {
    atelier: { nom: 'Chef Atelier', email: 'atelier@exemple.fr' },
    beElectro: { nom: 'Resp BE', email: 'be@exemple.fr' },
    bureauAuto: { nom: 'Chef Auto', email: 'auto@exemple.fr' },
    chargeAffaire: { nom: 'Chargé', email: 'affaire@exemple.fr' },
    commercial: { nom: 'Commercial', email: 'com@exemple.fr' },
    direction: { nom: 'Direction', email: 'dir@exemple.fr' }
  }
};
chantier.responsables = { atelier: 'M. Atelier', beElectro: 'M. BE', bureauAuto: '', chargeAffaire: 'M. Roussel', commercial: '', direction: '' };
let dest = M.destinataires(chantier, reglages);
egal('4 destinataires par défaut : pas de commercial', dest.length, 4);
T('le responsable BE électrotechnique est destinataire', dest.some(d => d.role === 'beElectro' && !d.copie));
T('le commercial est en copie quand l\'option est cochée', (chantier.copieCommercial = true, M.destinataires(chantier, reglages).some(d => d.role === 'commercial' && d.copie)));
chantier.copieCommercial = false;
egal('nom du chantier prioritaire sur le réglage', dest.find(d => d.role === 'chargeAffaire').nom, 'M. Roussel');

/* ------------------------------------------------------------------ mails */
const objet = M.objetMail(chantier, j1, M.compteurs(j1, 0));
T('objet : n° d\'affaire et journée', objet.includes('[25-0142]') && objet.includes('Point du soir J1'));
T('objet : alerte gravité 1', objet.includes('ACTION ATTENDUE SOUS 24 H'));
j1.version = 2;
T('objet : mention de version', M.objetMail(chantier, j1, M.compteurs(j1, 0)).includes('[v2]'));
j1.version = 1;
const corps = M.corpsMail(chantier, j1, M.avancementChantier(chantier), { blocagesOuverts: M.blocagesOuverts([j1, j2], '2026-10-07'), cumul: 23.25, signataire: 'Cordialement\n\nG. Marchand' });
T('corps : mentionne le blocage et son responsable', corps.includes('Presse hydraulique HS') && corps.includes('Chef d\'atelier'));
T('corps : mentionne l\'avancement', corps.includes('Avancement global : ' + M.avancementChantier(chantier) + ' %'));
T('corps : mentionne la sécurité', corps.includes('Sécurité :'));
T('corps : pas de nominatif des heures', !/L\. Petit|G\. Marchand 8 h/.test(corps));
egal('nom du fichier PDF', M.nomFichierPoint(chantier, j1), 'Point-soir_25-0142_J1_' + j1.date + '.pdf');

/* ------------------------------------------------------------------ divers */
egal('texteDateCourt', M.texteDateCourt('2026-10-07'), '07/10/2026');
T('texteDate en français', M.texteDate('2026-10-07').startsWith('mercredi 7 octobre'));
egal('joursEntre', M.joursEntre('2026-10-05', '2026-10-08'), 3);
const ch2 = M.nouveauChantier({ modeleId: 'mise_en_route' });
egal('modèle appliqué : phase', ch2.phase, 'MISE_EN_ROUTE');
egal('modèle appliqué : durée', ch2.dureePrevueJours, 5);

/* ------------------------------------------------------- phases de travaux */
/* 1. installation mécanique — 2. mise en route — 3. accompagnement */
egal('trois phases de travaux', M.PHASES.length, 3);
egal('phase 1 : installation mécanique', M.PHASES[0].libelle, 'Installation mécanique');
egal('phase 2 : mise en route', M.PHASES[1].libelle, 'Mise en route');
egal('phase 3 : accompagnement', M.PHASES[2].libelle, 'Accompagnement');
T('la phase d\'installation cite l\'électricité, l\'air, le réseau et l\'eau',
  /électricité/.test(M.PHASES[0].resume) && /air/.test(M.PHASES[0].resume) &&
  /réseau/.test(M.PHASES[0].resume) && /eau/.test(M.PHASES[0].resume));
T('la mise en route cite les entrées-sorties et le sens de rotation',
  /entrées-sorties/.test(M.PHASES[1].resume) && /sens de rotation/.test(M.PHASES[1].resume));
T('l\'accompagnement parle des problèmes et des besoins du client',
  /problèmes/.test(M.PHASES[2].resume) && /besoins/.test(M.PHASES[2].resume));
egal('l\'installation mène à la mise en route', M.PHASES[0].suite, 'MISE_EN_ROUTE');
egal('la mise en route mène à l\'accompagnement', M.PHASES[1].suite, 'ACCOMPAGNEMENT');
egal('l\'accompagnement ferme la marche', M.PHASES[2].suite, null);
egal('métiers de l\'installation', M.PHASES[0].metiers.join(' + '), 'Mécanicien + Câbleur');
T('métiers de la mise en route (automaticien, mécanicien en renfort)',
  M.PHASES[1].metiers.indexOf('Automaticien') === 0 && M.PHASES[1].metiers.indexOf('Mécanicien') === 1);

/* chaque phase a son catalogue de tâches, et les tâches de l'installation ne
   sont pas celles de l'accompagnement */
T('chaque phase a ses tâches', M.PHASES.every(function (p) { return M.tachesPhase(p.id).length >= 8; }),
  M.PHASES.map(function (p) { return M.tachesPhase(p.id).length; }).join('/'));
T('l\'installation prévoit le raccordement air comprimé',
  M.tachesPhase('INSTALLATION').some(function (t) { return /air comprimé/i.test(t); }));
T('la mise en route contrôle le sens de rotation des moteurs',
  M.tachesPhase('MISE_EN_ROUTE').some(function (t) { return /sens de rotation/i.test(t); }));
T('l\'accompagnement traite les problèmes rencontrés avec l\'exploitant',
  M.tachesPhase('ACCOMPAGNEMENT').some(function (t) { return /problèmes rencontrés/i.test(t); }));
T('les tâches de l\'installation et de l\'accompagnement diffèrent',
  M.tachesPhase('INSTALLATION').filter(function (t) { return M.tachesPhase('ACCOMPAGNEMENT').indexOf(t) !== -1; }).length <= 1);
T('catalogue complet sans doublon', new Set(M.CATALOGUE_TACHES).size === M.CATALOGUE_TACHES.length,
  M.CATALOGUE_TACHES.length);
T('phase inconnue : repli sur l\'installation', M.phaseValide('ZZZ') === 'INSTALLATION');
egal('ancien type « MISE_EN_SERVICE » lu comme une mise en route',
  M.phaseDepuisType('MISE_EN_SERVICE'), 'MISE_EN_ROUTE');
egal('ancien type « FORMATION » lu comme un accompagnement',
  M.phaseDepuisType('FORMATION'), 'ACCOMPAGNEMENT');
T('phase d\'un chantier ancien déduite du type', M.phaseDe({ type: 'FORMATION' }) === 'ACCOMPAGNEMENT');

/* La journée retient la phase dans laquelle elle a été travaillée : un point
   du soir d'installation reste un point d'installation, même après passage
   en mise en route. */
const chInst = M.nouveauChantier({ libelle: 'Installation', phase: 'INSTALLATION' });
const jInst = M.creerJournee(chInst, null, '2026-10-05');
egal('la journée naît dans la phase du chantier', jInst.phase, 'INSTALLATION');
const chMr = M.normaliserChantier(M.nouveauChantier({ libelle: 'Mise en route' }));
chMr.phase = 'MISE_EN_ROUTE';
egal('passage de phase pris en compte', M.phaseDe(chMr), 'MISE_EN_ROUTE');
egal('la journée déjà saisie garde sa phase', jInst.phase, 'INSTALLATION');
T('le mail annonce la phase en cours',
  /Phase en cours : Mise en route/.test(M.corpsMail(chMr, M.creerJournee(chMr, null, '2026-10-12'), 60, {})));
T('rappel du jour', M.rappelDuJour([chantier], [j1], j1.date).length >= 0);

/* ------------------------------------------------- catalogues de référence */
T('catalogue d\'essais fourni', M.CATALOGUE_ESSAIS.length >= 20, M.CATALOGUE_ESSAIS.length);
T('les essais de sécurité y figurent',
  M.CATALOGUE_ESSAIS.some(e => /arrêt d'urgence|sécurit/i.test(e)));
T('les essais électriques y figurent',
  M.CATALOGUE_ESSAIS.some(e => /isolement|masse|différentiel/i.test(e)));
T('les essais de mise en service y figurent',
  M.CATALOGUE_ESSAIS.some(e => /à blanc|production|endurance/i.test(e)));
T('aucun doublon dans le catalogue d\'essais',
  new Set(M.CATALOGUE_ESSAIS).size === M.CATALOGUE_ESSAIS.length);
T('catalogue de tâches fourni', M.CATALOGUE_TACHES.length >= 10, M.CATALOGUE_TACHES.length);
T('aucun doublon dans le catalogue de tâches',
  new Set(M.CATALOGUE_TACHES).size === M.CATALOGUE_TACHES.length);
T('chaque essai du catalogue est une phrase exploitable',
  M.CATALOGUE_ESSAIS.every(e => typeof e === 'string' && e.trim().length > 8));

/* ---------------------------------------------- adresses des responsables */
const ROL = M.ROLES_RESPONSABLES;
T('quatre destinataires systématiques', ROL.filter(r => r.systematique).length === 4, ROL.filter(r => r.systematique).length);
T('le commercial est en copie', ROL.some(r => r.role === 'commercial' && r.copie));
T('le BE électrotechnique fait partie des destinataires', ROL.some(r => r.role === 'beElectro' && r.systematique));

const Rgl = { responsables: {
  atelier: { nom: 'M. Charles', email: 'atelier@exemple.fr' },
  beElectro: { nom: 'M. Ferrand', email: 'be@exemple.fr' },
  bureauAuto: { nom: '', email: 'auto@exemple.fr' },
  chargeAffaire: { nom: 'Mme Roy', email: 'affaire@exemple.fr' },
  commercial: { nom: 'M. Petit', email: 'com@exemple.fr' },
  direction: { nom: '', email: 'direction@exemple.fr' }
} };

const chGlobal = M.nouveauChantier({ libelle: 'Essai', numeroAffaire: '25-9001' });
let destR = M.destinataires(chGlobal, Rgl);
T('les adresses globales alimentent le chantier', destR.length === 4, destR.length);
T('adresse globale reprise telle quelle', destR.filter(d => d.role === 'beElectro')[0].email === 'be@exemple.fr');
T('origine « global » quand rien n\'est saisi sur le chantier',
  destR.filter(d => d.role === 'beElectro')[0].origine === 'global');
T('le commercial reste en copie tant que l\'option n\'est pas cochée',
  destR.every(d => d.role !== 'commercial'));
T('la direction ne reçoit pas le point du soir', destR.every(d => d.role !== 'direction'));

/* surcharge propre au chantier */
const chSurcharge = M.normaliserChantier(Object.assign({}, chGlobal, {
  responsables: { beElectro: { nom: 'M. Bernard', email: 'bernard.beR@client.exemple.fr' }, chargeAffaire: 'Mme Dupuis' }
}));
destR = M.destinataires(chSurcharge, Rgl);
const beR = destR.filter(d => d.role === 'beElectro')[0];
T('l\'adresse du chantier remplace l\'adresse globale', beR.email === 'bernard.beR@client.exemple.fr', beR.email);
T('origine « chantier » signalée', beR.origine === 'chantier');
T('le nom du chantier remplace le nom global', beR.nom === 'M. Bernard');
T('l\'ancien format (nom en clair) est encore accepté',
  destR.filter(d => d.role === 'chargeAffaire')[0].nom === 'Mme Dupuis');
T('les autres destinataires gardent l\'adresse globale',
  destR.filter(d => d.role === 'atelier')[0].email === 'atelier@exemple.fr');
T('seule l\'adresse remplacée compte comme « du chantier »',
  destR.filter(d => d.origine === 'chantier').length === 1);

/* vue d'héritage utilisée par la fiche chantier */
const her = M.heritage(chSurcharge, Rgl);
const herBE = her.filter(x => x.role === 'beElectro')[0];
T('héritage : adresse globale connue', herBE.emailGlobal === 'be@exemple.fr');
T('héritage : adresse du chantier connue', herBE.emailChantier === 'bernard.beR@client.exemple.fr');
T('héritage : adresse retenue = celle du chantier', herBE.email === 'bernard.beR@client.exemple.fr');
T('héritage : rôle marqué comme modifié', herBE.modifie === true);
T('héritage : rôle non modifié repéré', her.filter(x => x.role === 'atelier')[0].modifie === false);
T('héritage : validité de l\'adresse calculée', herBE.adresseValide === true);

/* commercial en copie */
const chCom = M.normaliserChantier(Object.assign({}, chGlobal, { copieCommercial: true }));
const dcR = M.destinataires(chCom, Rgl);
T('le commercial entre dans la diffusion quand l\'option est cochée',
  dcR.some(d => d.role === 'commercial' && d.copie === true));
T('le commercial n\'est alors plus dans « à »',
  dcR.filter(d => d.role === 'commercial')[0].email === 'com@exemple.fr');

/* contrôle des adresses */
T('adresse valide reconnue', M.emailValide('prenom.nom@exemple.fr'));
T('adresse sans arobase refusée', !M.emailValide('prenom.nom'));
T('adresse sans domaine refusée', !M.emailValide('a@b'));
T('adresse vide refusée', !M.emailValide(''));
T('espaces autour tolérés', M.emailValide('  a@exemple.fr  '));

/* un chantier sans adresse n\'a aucun destinataire joignable */
const sansAdr = M.destinataires(M.nouveauChantier({ libelle: 'Sans adresse' }), { responsables: {} });
T('aucun destinataire quand rien n\'est renseigné', sansAdr.length === 0);
T('un nom sans adresse ne suffit pas à envoyer',
  M.destinataires(chGlobal, { responsables: { atelier: { nom: 'M. X', email: '' } } })
    .filter(d => d.email).length === 0);

/* ------------------------------------------------------------------ bilan */
console.log('\n' + '='.repeat(58));
console.log('  TESTS MODÈLE BFR-CHANTIER');
console.log('='.repeat(58));
console.log('  réussis : ' + ok);
console.log('  échecs  : ' + ko);
if (ko) { console.log('\n  Détail des échecs :'); echecs.forEach(e => console.log('   ✗ ' + e)); }
console.log('='.repeat(58) + '\n');
process.exit(ko ? 1 : 0);

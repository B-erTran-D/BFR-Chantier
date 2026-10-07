/* =========================================================================
   Test de fumée BFR-Chantier — exécution : node tests/test-app.js
   Charge l'application dans un DOM simulé (jsdom) et déroule un scénario
   complet : création d'un chantier, journée, saisie, clôture, point du soir.
   Objectif : attraper les erreurs d'exécution que la syntaxe ne voit pas.
   ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
require('fake-indexeddb/auto');

const FICHIER = path.join(__dirname, '..', 'BFR-Chantier.html');
const html = fs.readFileSync(FICHIER, 'utf8');

let ok = 0, ko = 0;
const echecs = [];
function T(nom, condition, detail) {
  if (condition) ok++;
  else { ko++; echecs.push(nom + (detail ? '  →  ' + detail : '')); }
}

/* contexte 2D factice (jsdom n'embarque pas de moteur graphique) */
function ctxFactice() {
  const f = () => { };
  return {
    canvas: { width: 800, height: 600 },
    font: '', fillStyle: '', strokeStyle: '', lineWidth: 1, lineCap: '', lineJoin: '', textBaseline: '',
    fillRect: f, strokeRect: f, clearRect: f, beginPath: f, moveTo: f, lineTo: f, stroke: f, fill: f,
    fillText: f, save: f, restore: f, translate: f, scale: f, setTransform: f, drawImage: f,
    measureText: () => ({ width: 42 })
  };
}

const erreurs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => erreurs.push('jsdomError: ' + (e && e.message)));
vc.on('error', (...a) => erreurs.push('console.error: ' + a.map(String).join(' ')));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://exemple.test/',
  virtualConsole: vc,
  beforeParse(w) {
    w.indexedDB = global.indexedDB;
    w.IDBKeyRange = global.IDBKeyRange;
    w.HTMLCanvasElement.prototype.getContext = function () { return ctxFactice(); };
    w.HTMLCanvasElement.prototype.toDataURL = function () { return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB'; };
    w.scrollTo = function () { };
    /* jsdom ne décode pas les images : on simule un chargement immédiat */
    w.Image = function () {
      var self = this;
      self.width = 320; self.height = 200;
      Object.defineProperty(self, 'src', {
        set: function () { setTimeout(function () { if (self.onload) self.onload(); }, 0); },
        get: function () { return ''; }
      });
    };
    if (!w.navigator.vibrate) {
      Object.defineProperty(w.navigator, 'vibrate', { value: () => true, configurable: true });
    }
  }
});

const doc = dom.window.document;
const attente = (ms) => new Promise((r) => setTimeout(r, ms || 60));

function clic(sel) {
  const el = doc.querySelector(sel);
  if (!el) throw new Error('élément introuvable : ' + sel);
  el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  return el;
}
function ecrire(sel, valeur) {
  const el = doc.querySelector(sel);
  if (!el) throw new Error('champ introuvable : ' + sel);
  el.value = valeur;
  el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  el.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  return el;
}
function texteEcran() { return doc.getElementById('app').textContent.replace(/\s+/g, ' '); }
/* Les feuilles s'ouvrent hors de #app et peuvent s'empiler : on travaille
   toujours sur la derniere ouverte (la seule visible pour l'utilisateur). */
function derniereFeuille() {
  const toutes = [...doc.querySelectorAll('.feuille')];
  return toutes.length ? toutes[toutes.length - 1] : null;
}
function texteFeuille() {
  const f = derniereFeuille();
  return f ? f.textContent.replace(/\s+/g, ' ') : '';
}
function boutonsFeuille() {
  const f = derniereFeuille();
  return f ? [...f.querySelectorAll('.feuille-pied .btn')] : [];
}
/* ferme toutes les feuilles ouvertes par les blocs précédents */
function fermerFeuilles() {
  [...doc.querySelectorAll('.feuille-fond')].forEach((ov) => ov.remove());
  doc.body.classList.remove('sans-defilement');
}

(async function deroule() {
  await attente(200);

  /* --- 1. l'écran d'accueil s'affiche (base vide) --- */
  T('écran d\'accueil rendu', texteEcran().includes('Installation'));
  /* La marque officielle BFR Systems ouvre tous les bandeaux : image embarquée
     (donc disponible hors connexion) et identique à la constante de
     l'application (garde-fou contre une image périmée à la construction).
     Une seule forme, jamais recadrée : un « BFR » seul n'est pas le logo
     (retour du 7 octobre 2026). */
  const marqueBandeau = doc.querySelector('.topbar-marque');
  T('marque officielle BFR Systems dans le bandeau',
    !!marqueBandeau && /^data:image\/png;base64,/.test(marqueBandeau.getAttribute('src')),
    marqueBandeau ? String(marqueBandeau.getAttribute('src')).slice(0, 22) : 'absente');
  T('marque du bandeau identique à la constante de l\'application',
    !!marqueBandeau && marqueBandeau.getAttribute('src') === dom.window.MARQUE_BFR_TOPBAR);
  T('marque accessible (BFR Systems annoncé)',
    !!marqueBandeau && marqueBandeau.getAttribute('alt') === 'BFR Systems');
  T('plus de titre texte sur l\'accueil', !doc.querySelector('.topbar-titre'));
  /* Le défaut signalé : « BFR » puis « BFR SYSTEMS » côte à côte. */
  T('une seule marque dans le bandeau de l\'accueil',
    doc.querySelectorAll('header.topbar img').length === 1,
    doc.querySelectorAll('header.topbar img').length + ' image(s)');
  T('plus aucune marque recadrée dans l\'application', !doc.querySelector('.topbar-signet'));
  T('invite à créer le premier chantier', texteEcran().includes('Aucun chantier enregistré'));
  T('les outils sont chargés', !!(dom.window.Modele && dom.window.Store && dom.window.PointSoir && dom.window.App));
  T('le module de mémoire d\'usage est chargé', typeof dom.window.Usage === 'object');

  /* l'utilisateur de l'application : la mémoire de saisie est nominative */
  const App = dom.window.App;
  App.etat.reglages.utilisateur = { prenom: 'Gérard', nom: 'Marchand', fonction: 'Chef de chantier' };

  /* --- 2. création d'un chantier --- */
  clic('[data-a="nouveau"]');
  await attente();
  T('écran nouveau chantier', texteEcran().includes('Nouveau chantier'));
  ecrire('#fNumero', '25-0142');
  ecrire('#fLibelle', 'Ligne 3 — installation armoire et mise en service');
  ecrire('#fClient', 'Client Exemple');
  ecrire('#fVille', 'Bourges');
  ecrire('#fDuree', '8');
  ecrire('#fEffectif', '3');
  ecrire('#fFin', '2026-10-14');
  clic('[data-a="creer-chantier"]');
  await attente(250);

  T('un chantier est enregistré', App.etat.chantiers.length === 1,
    'chantiers = ' + App.etat.chantiers.length);
  const ch = App.etat.chantiers[0];
  T('libellé conservé', !!ch && ch.libelle.startsWith('Ligne 3'));
  T('13 jalons créés', !!ch && ch.jalons.length === 13);
  T('avancement initial 0 %', App.avancementDe(ch) === 0);
  T('écran fiche chantier', texteEcran().includes('Jalons'));
  const titreFiche = doc.querySelector('.topbar-titre');
  T('fiche chantier : le bandeau garde le titre du chantier',
    !!titreFiche && titreFiche.textContent.indexOf('Ligne 3') === 0,
    titreFiche ? titreFiche.textContent.slice(0, 30) : 'aucun titre');
  /* la marque officielle ouvre les écrans de travail, avant le titre */
  const marqueFiche = doc.querySelector('.topbar-marque');
  T('la marque officielle ouvre le bandeau de la fiche chantier',
    !!marqueFiche && marqueFiche.getAttribute('src') === dom.window.MARQUE_BFR_TOPBAR);
  T('la marque précède le titre et le bouton retour',
    !!marqueFiche && !!titreFiche && !!(marqueFiche.compareDocumentPosition(titreFiche) & 4));
  T('une seule marque par bandeau',
    doc.querySelectorAll('header.topbar img').length === 1,
    doc.querySelectorAll('header.topbar img').length + ' image(s)');
  /* et elle est présente sur les autres écrans de travail */
  App.aller('reglages');
  await attente(250);
  T('la marque officielle ouvre le bandeau des réglages', !!doc.querySelector('.topbar-marque'));
  App.aller('fiche', { chantierId: ch.id, onglet: 'synthese' });
  await attente(250);

  /* --- 3. démarrage de la journée --- */
  clic('[data-a="demarrer-journee"]');
  await attente(250);
  T('une journée est créée', App.etat.journees.length === 1,
    'journées = ' + App.etat.journees.length);
  const j = App.etat.journees[0];
  T('journée numérotée J1', j && j.numero === 1);
  T('heure d\'arrivée horodatée', !!(j && j.debut), 'debut = ' + (j && j.debut));
  T('chantier passé en cours', App.chantier(ch.id).statut === 'EN_COURS');
  T('écran de la journée', texteEcran().includes('Effectif'));
  T('l\'effectif est repris du chantier (3)', j.effectif.nb === 3, 'nb = ' + j.effectif.nb);

  /* --- 3 ter. plus de crayon dans le bandeau de la journée --- */
  T('la marque officielle ouvre le bandeau de la journée',
    !!doc.querySelector('.topbar-marque') &&
    doc.querySelector('.topbar-marque').getAttribute('src') === dom.window.MARQUE_BFR_TOPBAR);
  T('bandeau de la journée : une seule marque, et aucune marque recadrée',
    doc.querySelectorAll('header.topbar img').length === 1, 
    doc.querySelectorAll('header.topbar img').length + ' image(s)');
  T('le bandeau de la journée garde le titre de la journée',
    !!doc.querySelector('.topbar-titre') && doc.querySelector('.topbar-titre').textContent.indexOf('J1') === 0,
    (doc.querySelector('.topbar-titre') || {}).textContent);
  T('le bandeau de la journée n a plus de crayon inutile', !doc.querySelector('[data-a="editer-journee"]'));
  /* le code mort ne doit pas subsister dans la page construite : c'est ce
     contrôle qui empêcherait la même erreur de revenir par un autre chemin */
  T('plus aucune trace du crayon dans le code construit', html.indexOf('editer-journee') === -1);

  /* --- 3 bis. pause : le bouton change de libellé et d'icône --- */
  const boutonPause = () => doc.querySelector('[data-a="pause-journee"]');
  T('journée en cours : le bouton propose Pause',
    !!boutonPause() && boutonPause().textContent.indexOf('Pause') === 0, boutonPause() && boutonPause().textContent.trim());
  const iconeAvantPause = boutonPause() ? boutonPause().innerHTML : '';
  clic('[data-a="pause-journee"]');
  await attente(250);
  T('en pause : le bouton propose Reprendre',
    !!boutonPause() && boutonPause().textContent.indexOf('Reprendre') === 0, boutonPause() && boutonPause().textContent.trim());
  T('l icône du bouton change avec l état',
    !!boutonPause() && boutonPause().innerHTML !== iconeAvantPause);
  T('la pause est notée, sans heure de reprise',
    (j.pauses || []).length === 1 && !j.pauses[0].fin, JSON.stringify(j.pauses));
  T('le chrono annonce la pause en cours', texteEcran().includes('en pause depuis'), texteEcran().slice(0, 90));
  T('l écran explique comment reprendre', texteEcran().includes('le décompte reprend'));
  T('le bloc du chrono porte l état en pause', !!doc.querySelector('.chrono-bloc.en-pause'));
  clic('[data-a="pause-journee"]');
  await attente(250);
  T('après reprise : le bouton repart sur Pause',
    !!boutonPause() && boutonPause().textContent.indexOf('Pause') === 0 && boutonPause().textContent.indexOf('Reprendre') < 0,
    boutonPause() && boutonPause().textContent.trim());
  T('la pause est refermée', !!((j.pauses || [])[0] || {}).fin, JSON.stringify(j.pauses));
  T('le chrono repart en cours', texteEcran().includes('→ en cours'));
  T('le bloc ne porte plus l état en pause', !doc.querySelector('.chrono-bloc.en-pause'));

  /* --- 4. ajustement des heures --- */
  clic('[data-a="ajuster-journee"]');
  await attente();
  ecrire('#ajDebut', '07:45');
  ecrire('#ajFin', '16:30');
  ecrire('#ajEff', '3');
  ecrire('#ajDetail', '1 chef de chantier, 1 électricien, 1 automaticien');
  const boutons = [...doc.querySelectorAll('.feuille-pied .btn')];
  boutons[boutons.length - 1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(150);
  T('durée calculée = 8 h 45', dom.window.Modele.dureeJourneeMn(j) === 525,
    dom.window.Modele.dureeJourneeMn(j) + ' min');
  T('hommes-heures = 26 h 15', Math.abs(dom.window.Modele.hommesHeures(j) - 26.25) < 0.01,
    dom.window.Modele.hommesHeures(j));

  /* --- 5. ajout d'une tâche avec avancement sur un jalon --- */
  clic('[data-a="ajouter-tache"]');
  await attente();
  const selTache = doc.querySelector('#taLibSel');
  T('liste déroulante des tâches proposée', !!selTache);
  const optionsTache = [...selTache.querySelectorAll('option')].map((o) => o.value);
  T('le catalogue de tâches est proposé', optionsTache.includes('Montage mécanique de l\'ensemble'));
  selTache.value = '__AUTRE__';
  selTache.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  await attente(80);
  T('la saisie libre de tâche s\'ouvre', !doc.querySelector('#taLibBox').classList.contains('cache'));
  ecrire('#taLib', 'Montage support moteur');
  const selJalon = doc.querySelector('#taJalon');
  selJalon.value = 'montage';
  ecrire('#taAvan', '40');
  const bt2 = [...doc.querySelectorAll('.feuille-pied .btn')];
  bt2[bt2.length - 1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(200);
  T('tâche enregistrée', (j.taches || []).length === 1, 'tâches = ' + (j.taches || []).length);
  T('avancement reporté sur le jalon montage',
    ch.jalons.find((x) => x.id === 'montage').avancement === 40,
    ch.jalons.find((x) => x.id === 'montage').avancement);
  T('avancement global recalculé (5 %)', App.avancementDe(ch) === 5, App.avancementDe(ch) + ' %');
  T('la tâche saisie entre dans la mémoire d\'usage',
    dom.window.Usage.nbUtilisations('tache.libelle', 'Montage support moteur') === 1);

  /* --- 6. tâche réalisée (cycle d'état) --- */
  const idTache = j.taches[0].id;
  clic('[data-a="cycle-tache"][data-id="' + idTache + '"]');
  await attente(120);
  T('état de la tâche passé à « réalisée »', j.taches[0].etat === 'FAIT', j.taches[0].etat);

  /* --- 7. blocage de gravité 1 --- */
  clic('[data-a="ajouter-blocage"]');
  await attente();
  ecrire('#blDesc', 'Presse hydraulique hors service');
  doc.querySelector('#blGrav').value = '1';
  doc.querySelector('#blDeb').value = 'ATELIER';
  ecrire('#blEcheance', 'sous 24 h');
  const bt3 = [...doc.querySelectorAll('.feuille-pied .btn')];
  bt3[bt3.length - 1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(200);
  T('blocage enregistré', (j.blocages || []).length === 1);
  T('gravité 1 conservée', j.blocages[0].gravite === 1);
  T('alerte grave détectée', dom.window.Modele.alerteGrave(j).alerte === true);
  /* l'avertissement de gravité 1 doit se refermer d'un simple appui */
  const btAlerte = [...doc.querySelectorAll('.feuille-pied .btn')];
  if (btAlerte.length) btAlerte[0].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(300);
  T('un bouton sans action referme la feuille', doc.querySelectorAll('.feuille-fond').length === 0,
    doc.querySelectorAll('.feuille-fond').length + ' feuille(s) encore ouverte(s)');

  /* --- 8. matériel, sécurité, essai, prévu demain, synthèse --- */
  clic('[data-a="ajouter-materiel"]');
  await attente();
  ecrire('#mtDes', 'Variateur 15 kW — 400 V');
  ecrire('#mtRef', 'VR-15K-4');
  ecrire('#mtQte', '1');
  ecrire('#mtBesoin', '2026-10-08');
  const bt4 = [...doc.querySelectorAll('.feuille-pied .btn')];
  bt4[bt4.length - 1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(150);
  T('matériel manquant enregistré', (j.materiel || []).length === 1 && j.materiel[0].etat === 'MANQUANT');

  clic('[data-a="securite-ras"]');
  await attente(120);
  T('sécurité renseignée (aucun incident)', j.securite.renseigne === true);

  const Usage = dom.window.Usage;
  T('catalogue d\'essais fourni (au moins 20 essais courants)',
    dom.window.Modele.CATALOGUE_ESSAIS.length >= 20, dom.window.Modele.CATALOGUE_ESSAIS.length + ' essais');
  T('catalogue de tâches fourni', dom.window.Modele.CATALOGUE_TACHES.length >= 10);

  clic('[data-a="ajouter-essai"]');
  await attente(150);
  const selEssai = doc.querySelector('#esLibSel');
  T('liste déroulante des essais proposée', !!selEssai);
  const optionsEssai = [...selEssai.querySelectorAll('option')].map((o) => o.value);
  T('le catalogue est dans la liste', optionsEssai.includes('Essai à blanc (marche à vide)'), optionsEssai.length + ' choix');
  T('un choix « autre (saisie libre) » est prévu', optionsEssai.includes('__AUTRE__'));
  /* on choisit un essai dans la liste */
  selEssai.value = 'Mesure d\'isolement (mégohmmètre)';
  selEssai.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  await attente(80);
  T('la saisie libre reste masquée quand on choisit dans la liste',
    doc.querySelector('#esLibBox').classList.contains('cache'));
  doc.querySelector('#esRes').value = 'NOK';
  ecrire('#esMes', 'Relevé 500 V : 0,8 MΩ — à reprendre');
  let btnEssai = [...doc.querySelectorAll('.feuille-pied .btn')].pop();
  btnEssai.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(200);
  T('essai enregistré depuis la liste',
    (j.essais || []).length === 1 && j.essais[0].libelle === 'Mesure d\'isolement (mégohmmètre)',
    j.essais[0] && j.essais[0].libelle);
  T('résultat NOK conservé', j.essais[0].resultat === 'NOK');

  /* second essai : saisie libre via « Autre » */
  clic('[data-a="ajouter-essai"]');
  await attente(150);
  const sel2 = doc.querySelector('#esLibSel');
  sel2.value = '__AUTRE__';
  sel2.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  await attente(80);
  T('la saisie libre s\'ouvre pour « Autre »', !doc.querySelector('#esLibBox').classList.contains('cache'));
  ecrire('#esLib', 'Contrôle de la hauteur de remplissage');
  btnEssai = [...doc.querySelectorAll('.feuille-pied .btn')].pop();
  btnEssai.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(200);
  T('essai en saisie libre enregistré',
    (j.essais || []).length === 2 && j.essais[1].libelle === 'Contrôle de la hauteur de remplissage');

  /* la saisie libre n'est pas perdue si on ne saisit rien */
  clic('[data-a="ajouter-essai"]');
  await attente(120);
  const sel3 = doc.querySelector('#esLibSel');
  sel3.value = '';
  btnEssai = [...doc.querySelectorAll('.feuille-pied .btn')].pop();
  btnEssai.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(120);
  T('un essai vide est refusé', (j.essais || []).length === 2);
  const fermerF = doc.querySelector('[data-fb="fermer"]');
  if (fermerF) { fermerF.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); await attente(250); }

  /* ------------------- mémoire d'usage, utilisateur par utilisateur ------------------- */
  T('mémoire alimentée par les deux essais', Usage.populaires('essai.libelle', 5).length === 2,
    Usage.populaires('essai.libelle', 5).length);
  Usage.enregistrer('essai.libelle', 'mesure d\'isolement (MÉGOHMMÈTRE)');   /* casse différente */
  T('même essai reconnu quelle que soit la casse',
    Usage.nbUtilisations('essai.libelle', 'Mesure d\'isolement (mégohmmètre)') === 2,
    Usage.nbUtilisations('essai.libelle', 'Mesure d\'isolement (mégohmmètre)'));
  T('l\'essai le plus utilisé passe en tête',
    Usage.populaires('essai.libelle', 3)[0].valeur.toLowerCase() === 'mesure d\'isolement (mégohmmètre)',
    Usage.populaires('essai.libelle', 3)[0].valeur);
  T('le raccourci garde la forme utilisée la dernière fois',
    Usage.populaires('essai.libelle', 3)[0].valeur === 'mesure d\'isolement (MÉGOHMMÈTRE)',
    Usage.populaires('essai.libelle', 3)[0].valeur);

  /* la liste déroulante remonte l'habitude */
  clic('[data-a="ajouter-essai"]');
  await attente(150);
  const groupes = [...doc.querySelectorAll('#esLibSel optgroup')].map((g) => g.label);
  T('un groupe « … plus utilisés » apparaît', groupes.some((g) => g.includes('plus utilisés')), groupes.join(' | '));
  T('l\'essai habituel est pré-proposé',
    [...doc.querySelectorAll('#esLibSel option')].some((o) => o.value === 'Mesure d\'isolement (mégohmmètre)'));
  const fermerF2 = doc.querySelector('[data-fb="fermer"]');
  if (fermerF2) { fermerF2.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); await attente(250); }

  /* raccourcis sur l'écran de la journée */
  const raccourcis = [...doc.querySelectorAll('[data-a="essai-rapide"]')];
  T('raccourcis « vos essais les plus fréquents » sur la journée', raccourcis.length >= 1, raccourcis.length);
  if (raccourcis.length) {
    raccourcis[0].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await attente(200);
    const selR = doc.querySelector('#esLibSel');
    T('le raccourci ouvre l\'essai pré-rempli', !!selR && selR.value === raccourcis[0].getAttribute('data-valeur'),
      selR && selR.value);
    const fermerF3 = doc.querySelector('[data-fb="fermer"]');
    if (fermerF3) { fermerF3.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); await attente(200); }
  }

  /* un autre utilisateur du téléphone : mémoire vierge, puis propre à lui */
  App.etat.reglages.utilisateur = { prenom: 'Paul', nom: 'Martin', fonction: 'Chef de chantier' };
  T('mémoire vierge pour un autre utilisateur', Usage.populaires('essai.libelle', 5).length === 0,
    Usage.populaires('essai.libelle', 5).length);
  Usage.enregistrer('essai.libelle', 'Essai d\'endurance (cycles répétés)');
  T('mémoire propre au nouvel utilisateur',
    Usage.populaires('essai.libelle', 5)[0].valeur === 'Essai d\'endurance (cycles répétés)');
  App.etat.reglages.utilisateur = { prenom: 'Gérard', nom: 'Marchand', fonction: 'Chef de chantier' };
  T('la mémoire du premier utilisateur est intacte', Usage.populaires('essai.libelle', 5).length === 2,
    Usage.populaires('essai.libelle', 5).length);

  /* la liste déroulante reste utilisable quand la journée est déjà saisie */
  T('les essais alimentent aussi le point du soir', (j.essais || []).length === 2);

  ecrire('textarea[data-champ="synthese"]', 'Montage terminé, câblage à 80 %. Blocage presse depuis 2 jours.');
  await attente(200);
  T('synthèse enregistrée', j.synthese.startsWith('Montage terminé'));

  /* prévu demain : la feuille générique */
  clic('[data-a="ajouter-prevision"]');
  await attente();
  ecrire('#ftTexte', 'Terminer le câblage armoire');
  const bt6 = [...doc.querySelectorAll('.feuille-pied .btn')];
  bt6[bt6.length - 1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(150);
  T('prévu demain enregistré', (j.prevuDemain.taches || []).length === 1);

  /* --- 9. vérification de clôture --- */
  const v = dom.window.Modele.verifierCloture(j);
  T('clôture possible : tous les points sont renseignés', v.complete === true,
    JSON.stringify(v.manques.map((m) => m.champ)));

  /* --- 10. contexte du point du soir --- */
  const ctx = App.contextePoint(j);
  T('destinataires calculés', Array.isArray(ctx.destinataires));
  T('blocages ouverts dans le contexte', ctx.blocagesOuverts.length === 1);
  T('avancement dans le contexte', ctx.avancement === 5, ctx.avancement);
  const msg = dom.window.PointSoir.message(ctx);
  T('objet du mail avec n° d\'affaire', msg.objet.includes('25-0142'), msg.objet);
  T('objet du mail avec alerte 24 h', msg.objet.includes('24 H'), msg.objet);
  T('corps du mail avec le blocage', msg.corps.includes('Presse hydraulique hors service'));
  T('corps du mail sans nominatif', !/L\. Petit/.test(msg.corps));

  /* --- 11. génération du PDF (document réel) --- */
  let pdfOk = false, taille = 0;
  try {
    const res = dom.window.PointSoir.document(ctx);
    taille = res.blob.size;
    pdfOk = taille > 4000;
  } catch (e) { erreurs.push('generation PDF : ' + e.message); }
  T('PDF généré', pdfOk, taille + ' octets');
  T('nom du fichier PDF', dom.window.Modele.nomFichierPoint(ch, j) === 'Point-soir_25-0142_J1_' + j.date + '.pdf');

  /* --- 12. aperçu à l'écran (canvas) --- */
  let pages = 0;
  try {
    const doc2 = dom.window.PointSoir.apercu(ctx);
    const canv = await dom.window.Pdf.rendrePages(doc2, { echelle: 1.2 });
    pages = canv.length;
  } catch (e) { erreurs.push('apercu : ' + e.message); }
  T('aperçu dessiné (au moins 1 page)', pages >= 1, pages + ' page(s)');

  /* --- 13. clôture de la journée --- */
  clic('[data-a="cloturer-journee"]');
  await attente(300);
  T('journée clôturée', j.statut === 'CLOTUREE', j.statut);
  T('heure de départ notée', !!j.fin, j.fin);
  T('écran du point du soir', texteEcran().includes('Point du soir'));
  T('aperçu présent dans l\'écran', !!doc.querySelector('#apercuPoint canvas.apercu-page'));

  /* --- 14. démarrage du lendemain : reports automatiques --- */
  j.prevuDemain.taches.push('Début paramétrage variateur');
  j.taches.push({ id: 't-rep', libelle: 'Câblage armoire', jalonId: 'cablage', etat: 'PARTIEL', avancement: 0, motif: 'attente ouvrier' });
  clic('[data-a="fermer-point"]');
  await attente(150);
  const jour2 = dom.window.Modele.creerJournee(ch, j, '2026-10-08');
  const libelles = jour2.taches.map((t) => t.libelle);
  T('report : la tâche partielle revient', libelles.includes('Câblage armoire'));
  T('report : le plan de la veille revient', libelles.includes('Début paramétrage variateur'));
  T('report : la tâche terminée ne revient pas', !libelles.includes('Montage support moteur'));
  T('report : blocage non levé toujours ouvert',
    dom.window.Modele.blocagesOuverts([j], '2026-10-08').length === 1);
  /* ancienneté comptée depuis la date d'ouverture réelle du blocage : le test
     ne dépend pas du jour où il tourne */
  const plus = (n) => {
    const d = new Date(String(j.blocages[0].ouvertLe || j.date) + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  T('report : blocage du jour non signalé persistant',
    dom.window.Modele.blocagesOuverts([j], j.blocages[0].ouvertLe)[0].persistant === false);
  T('report : blocage ancien de 3 jours signalé persistant',
    dom.window.Modele.blocagesOuverts([j], plus(3))[0].persistant === true);

  /* --- 15. réglages : destinataires et persistance --- */
  App.etat.reglages.responsables.beElectro = { nom: 'M. Ferrand', email: 'be@exemple.fr' };
  App.etat.reglages.responsables.atelier = { nom: 'M. Charles', email: 'atelier@exemple.fr' };
  dom.window.Store.ecrireReglages(App.etat.reglages);
  const dest = dom.window.Modele.destinataires(ch, App.etat.reglages);
  T('deux destinataires configurés', dest.length === 2, dest.length);
  T('le responsable BE électrotechnique est destinataire',
    dest.some((d) => d.role === 'beElectro' && d.email === 'be@exemple.fr'));
  ch.copieCommercial = true;
  App.etat.reglages.responsables.commercial = { nom: 'M. Petit', email: 'com@exemple.fr' };
  const dest2 = dom.window.Modele.destinataires(ch, App.etat.reglages);
  T('le commercial est en copie quand l\'option est cochée',
    dest2.some((d) => d.role === 'commercial' && d.copie === true));

  /* --- 15bis. session de formation avec signature d'un participant --- */
  App.aller('journee', { chantierId: ch.id, journeeId: j.id });
  await attente(150);
  const bForm = doc.querySelector('[data-a="editer-formation"]');
  T('bouton de saisie d\'une session présent', !!bForm);
  if (bForm) {
    bForm.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await attente(150);
    ecrire('#foIntitule', 'Prise en main de la ligne 3');
    ecrire('#foDuree', '7');
    /* ajout d'un participant */
    const boutonParticipant = [...doc.querySelectorAll('.feuille [data-pp]')].pop();
    T('bouton d\'ajout de participant présent', !!boutonParticipant);
    boutonParticipant.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await attente(150);
    ecrire('#ppNom', 'M. Dubois');
    ecrire('#ppFonction', 'Chef de ligne');
    const validerParticipant = [...doc.querySelectorAll('.feuille-pied .btn')].pop();
    validerParticipant.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await attente(200);

    /* signature au doigt */
    const boutonSigner = [...doc.querySelectorAll('.feuille [data-sp]')].pop();
    T('bouton de signature présent', !!boutonSigner);
    if (boutonSigner) {
      boutonSigner.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      await attente(250);
      const canvasSig = doc.querySelector('#sigCanvas');
      T('cassette de signature ouverte', !!canvasSig);
      if (canvasSig) {
        canvasSig.dispatchEvent(new dom.window.MouseEvent('mousedown', { bubbles: true, clientX: 20, clientY: 30 }));
        canvasSig.dispatchEvent(new dom.window.MouseEvent('mousemove', { bubbles: true, clientX: 90, clientY: 70 }));
        const validerSig = doc.querySelector('[data-s="valider"]');
        validerSig.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
        await attente(300);
      }
    }
    /* enregistrement de la session */
    const boutonsSession = [...doc.querySelectorAll('.feuille-pied .btn')];
    boutonsSession[boutonsSession.length - 1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await attente(300);

    const ses = App.etat.sessions[0];
    T('session de formation enregistrée', App.etat.sessions.length === 1);
    T('intitulé de la session', !!ses && ses.intitule === 'Prise en main de la ligne 3', ses && ses.intitule);
    T('un participant enregistré', !!ses && ses.participants.length === 1);
    T('signature du participant recueillie', !!ses && !!ses.participants[0].signature,
      ses && String(ses.participants[0].signature).slice(0, 24));
    T('la session est rattachée à la journée', j.formationId === ses.id);
    T('le point du soir reprend la formation', !!(j.formation && (j.formation.participants || []).length === 1));
    T('participant sans nominatif dans le mail',
      !dom.window.Modele.corpsMail(ch, j, App.avancementDe(ch), {}).includes('M. Dubois 8 h'));
  }

  /* --- 16. les réglages s'affichent pré-remplis --- */
  App.aller('reglages');
  await attente(150);
  const champPrenom = doc.querySelector('[data-champ="utilisateur.prenom"]');
  T('champ de réglage présent', !!champPrenom);
  if (champPrenom) {
    champPrenom.value = 'Gérard';
    champPrenom.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await attente(120);
    T('réglage enregistré', App.etat.reglages.utilisateur.prenom === 'Gérard',
      App.etat.reglages.utilisateur.prenom);
    App.aller('reglages');
    await attente(150);
    const reAffiche = doc.querySelector('[data-champ="utilisateur.prenom"]');
    T('réglage réaffiché après actualisation de l\'écran', reAffiche && reAffiche.value === 'Gérard',
      reAffiche && reAffiche.value);
    const champBE = doc.querySelector('[data-champ="responsables.beElectro.email"]');
    T('champ du responsable BE électrotechnique présent', !!champBE);
  }
  const champSecuriteJournee = (App.aller('journee', { chantierId: ch.id, journeeId: j.id }), await attente(150),
    doc.querySelector('[data-champ="securite.remarques"]'));
  T('la synthèse de la journée est réaffichée (pas de champ vide)',
    (doc.querySelector('[data-champ="synthese"]') || {}).value === j.synthese,
    (doc.querySelector('[data-champ="synthese"]') || {}).value);

  /* --- 17. versionnement : un second envoi devient la version 2 --- */
  j.envoiLe = '';
  j.version = 1;
  App.marquerEnvoye(j);
  const v1 = j.version;
  App.marquerEnvoye(j);
  const v2 = j.version;
  T('premier envoi : version 1', v1 === 1, 'v' + v1);
  T('correction après envoi : version 2', v2 === 2, 'v' + v2);
  T('objet du mail marqué [v2]', dom.window.Modele.objetMail(ch, j, dom.window.Modele.compteurs(j, 0)).includes('[v2]'));

  /* --- 18. carte « Mes habitudes de saisie » et réinitialisation --- */
  App.aller('reglages');
  await attente(200);
  T('carte des habitudes de saisie présente', texteEcran().includes('Mes habitudes de saisie'));
  T('l\'utilisateur courant est nommé', texteEcran().includes('Gérard Marchand'));
  T('un essai mémorisé est affiché', texteEcran().toLowerCase().includes('isolement'));
  T('une tâche mémorisée est affichée', texteEcran().includes('Montage support moteur'));
  const boutonOubli = doc.querySelector('[data-a="reinitialiser-habitudes"]');
  T('bouton de réinitialisation présent', !!boutonOubli);

  /* --- 19. une tâche prise dans la liste se souvient du choix --- */
  Usage.reinitialiser('tache.libelle');
  T('réinitialisation par type', Usage.populaires('tache.libelle', 5).length === 0);
  T('les essais ne sont pas touchés par la réinitialisation ciblée',
    Usage.populaires('essai.libelle', 5).length >= 1);

  /* --- 20. adresses des responsables : réglages généraux --- */
  App.etat.reglages.responsables.beElectro = { nom: 'dom.window.Modele. Ferrand', email: 'be@exemple.fr' };
  App.aller('reglages');
  await attente(200);
  const champBE = doc.querySelector('[data-champ="responsables.beElectro.email"]');
  T('le champ d\'adresse globale existe', !!champBE);
  T('l\'adresse globale est pré-remplie', !!champBE && champBE.value === 'be@exemple.fr', champBE && champBE.value);
  T('le contrôle des adresses est affiché', texteEcran().includes('Adresses valides enregistrées'));
  const champsDest = doc.querySelectorAll('[data-champ^="responsables."][data-champ$=".email"][data-cible="reglages"]');
  T('les six responsables ont leur champ e-mail', champsDest.length === 6, champsDest.length);

  /* une adresse mal saisie est signalée tout de suite */
  champBE.value = 'bernard.be-client.fr';
  champBE.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  champBE.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  await attente(250);
  App.aller('reglages');
  await attente(250);
  T('une adresse sans arobase est signalée', texteEcran().includes('à vérifier'));
  /* l'écran a été redessiné : on reprend le champ tel qu'il est affiché */
  const champBE2 = doc.querySelector('[data-champ="responsables.beElectro.email"]');
  champBE2.value = 'be@exemple.fr';
  champBE2.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  champBE2.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  await attente(250);
  T('la correction de l\'adresse est enregistrée',
    App.etat.reglages.responsables.beElectro.email === 'be@exemple.fr',
    App.etat.reglages.responsables.beElectro.email);

  /* --- 21. fiche chantier : les adresses globales en héritage --- */
  const chAdr = App.chantierCourant();
  App.aller('fiche', { chantierId: chAdr.id, onglet: 'reglages' });
  await attente(250);
  const champChantier = doc.querySelector('[data-champ="responsables.beElectro.email"][data-cible="chantier"]');
  T('la fiche du chantier propose une adresse par responsable', !!champChantier);
  T('le champ du chantier est vide (l\'adresse globale s\'applique)',
    !!champChantier && champChantier.value === '', champChantier && champChantier.value);
  T('l\'adresse globale sert d\'indication dans le champ',
    !!champChantier && champChantier.getAttribute('placeholder') === 'be@exemple.fr',
    champChantier && champChantier.getAttribute('placeholder'));
  T('l\'adresse globale est rappelée sous le champ', texteEcran().includes('Adresse globale : be@exemple.fr'));
  T('le nombre de destinataires du chantier est affiché', /Destinataires de ce chantier/.test(texteEcran()));

  /* --- 22. une adresse propre au chantier prend le dessus --- */
  champChantier.value = 'bernard.be@client.exemple.fr';
  champChantier.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  champChantier.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  await attente(400);
  let destBE = dom.window.Modele.destinataires(App.chantierCourant(), App.etat.reglages).filter((d) => d.role === 'beElectro')[0];
  T('l\'adresse du chantier remplace l\'adresse globale', destBE.email === 'bernard.be@client.exemple.fr', destBE.email);
  T('l\'origine « chantier » est signalée', destBE.origine === 'chantier');
  T('le nom global reste utilisé quand le chantier ne dit rien', destBE.nom === 'dom.window.Modele. Ferrand', destBE.nom);

  App.aller('fiche', { chantierId: chAdr.id, onglet: 'reglages' });
  await attente(250);
  T('la fiche prévient que le chantier remplace l\'adresse globale',
    texteEcran().includes('adresse(s) propre(s) à ce chantier'));
  T('le bouton de retour aux adresses globales apparaît',
    !!doc.querySelector('[data-a="adresses-globales"]'));

  /* l'écran du point du soir montre l'adresse réellement utilisée */
  App.aller('point', { chantierId: chAdr.id, journeeId: App.journeeCourante() ? App.journeeCourante().id : '' });
  await attente(300);
  T('le point du soir affiche l\'adresse du chantier', texteEcran().includes('bernard.be@client.exemple.fr'));
  T('l\'origine de l\'adresse est indiquée', texteEcran().includes('adresse du chantier'));
  T('un raccourci vers les réglages généraux existe', !!doc.querySelector('[data-a="reglages"]'));
  T('un raccourci vers les adresses du chantier existe', !!doc.querySelector('[data-a="adresses-chantier"]'));

  /* --- 23. retour aux adresses globales pour ce chantier --- */
  App.aller('fiche', { chantierId: chAdr.id, onglet: 'reglages' });
  await attente(250);
  doc.querySelector('[data-a="adresses-globales"]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(250);
  const btnRetablir = [...doc.querySelectorAll('.feuille-pied .btn')].filter((b) => /tablir/.test(b.textContent))[0];
  T('la confirmation propose de rétablir les adresses globales', !!btnRetablir);
  if (btnRetablir) btnRetablir.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(500);
  destBE = dom.window.Modele.destinataires(App.chantierCourant(), App.etat.reglages).filter((d) => d.role === 'beElectro')[0];
  T('l\'adresse globale reprend la main après rétablissement', destBE.email === 'be@exemple.fr', destBE.email);
  T('le chantier ne porte plus d\'adresse personnelle',
    !(App.chantierCourant().responsables.beElectro || {}).email);

  /* --- 24. charte graphique : aucun émoji, palette BFR --- */
  const emoji = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
  const ecransHTML = ['accueil', 'nouveau', 'fiche', 'journee', 'point', 'reglages'].map((e2) => {
    try { App.aller(e2); } catch (err) { /* écran indisponible sans données */ }
    return doc.getElementById('app').innerHTML;
  }).join('');
  const trouverEmoji = [...new Set(ecransHTML.match(new RegExp(emoji, 'gu')) || [])]
    .filter((c) => !['→', '\u00b7', '\u2014'].includes(c));
  T('aucun émoji dans les écrans', trouverEmoji.length === 0, trouverEmoji.join(' '));
  T('les icônes vectorielles BFR sont utilisées', (ecransHTML.match(/class="bfr-ico/g) || []).length > 20,
    (ecransHTML.match(/class="bfr-ico/g) || []).length + ' icônes');
  T('le jeu d\'icônes expose Icônes de domaine, activité, catégorie et état',
    ['domaine', 'activite', 'categorie', 'etatTache', 'resultat', 'i'].every((f) => typeof dom.window.ICO[f] === 'function'));
  T('chaque icône demandée par le modèle existe',
    [].concat(dom.window.Modele.ACTIVITES, dom.window.Modele.CATEGORIES, dom.window.Modele.ETATS_TACHE)
      .every((x) => typeof dom.window.ICO[x.icone] === 'function'));

  const feuilleStyle = [...doc.querySelectorAll('style')].map((s) => s.textContent).join(' ');
  ['#06baf2', '#332e72', '#1f1c45'].forEach((c) => {
    T('la charte contient ' + c, feuilleStyle.includes(c));
  });
  T('aucune couleur hors charte : pas de #f97316 (orange) dans la feuille de style',
    !/#f97316|#f59e0b|#ffedd5|#c2410c|#b45309|#fef3c7/i.test(feuilleStyle));
  T('aucune couleur hors charte dans les écrans',
    !/#f97316|#f59e0b|#ffedd5|#c2410c|#b45309|#fef3c7/i.test(ecransHTML));

  /* --- 25. phases de travaux : installation, mise en route, accompagnement --- */
  const Modele = dom.window.Modele;
  T('le chantier créé démarre en installation mécanique',
    ch.phase === 'INSTALLATION', String(ch.phase));
  T('la journée retient sa phase', j.phase === 'INSTALLATION', String(j.phase));
  App.aller('fiche', { chantierId: ch.id, onglet: 'synthese' });
  await attente(150);
  T('la fiche annonce la phase', texteEcran().includes('Installation mécanique'));

  /* les tâches proposées sont celles de la phase */
  App.aller('journee', { chantierId: ch.id, journeeId: j.id });
  await attente(200);
  clic('[data-a="ajouter-tache"]');
  await attente(250);
  let choixTaches = [...doc.querySelectorAll('#taLibSel option')].map((o) => o.value);
  T('tâches de l\'installation proposées : raccordement air comprimé',
    choixTaches.some((v) => /air comprimé/i.test(v)), choixTaches.length + ' choix');
  T('les tâches de la mise en route ne sont pas encore proposées',
    !choixTaches.some((v) => /sens de rotation/i.test(v)));
  doc.querySelector('.feuille-pied .btn').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(200);

  /* passage à la phase suivante depuis la fiche du chantier */
  App.aller('fiche', { chantierId: ch.id, onglet: 'synthese' });
  await attente(250);
  T('la fiche propose de passer à la phase suivante',
    !!doc.querySelector('[data-a="phase-suivante"]'));
  clic('[data-a="phase-suivante"]');
  await attente(250);
  T('la confirmation dit ce qu\'apporte la mise en route',
    doc.body.textContent.includes('Mise en route') && doc.body.textContent.includes('entrées-sorties'));
  const boutonsPhase = [...doc.querySelectorAll('.feuille-pied .btn')];
  boutonsPhase[boutonsPhase.length - 1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(300);
  T('le chantier est passé en mise en route', Modele.phaseDe(ch) === 'MISE_EN_ROUTE', String(ch.phase));
  T('le changement de phase est tracé',
    (ch.phaseHistorique || []).some((h) => h.phase === 'MISE_EN_ROUTE' && !!h.le));

  /* la nouvelle journée naît dans la nouvelle phase, l'ancienne ne bouge pas */
  const jour3 = Modele.creerJournee(ch, j, '2026-10-12');
  T('la journée suivante naît en mise en route', jour3.phase === 'MISE_EN_ROUTE', String(jour3.phase));
  T('la journée d\'installation garde sa phase', j.phase === 'INSTALLATION');

  /* les tâches proposées deviennent celles de la mise en route */
  App.etat.journees.push(jour3);
  dom.window.Store.ecrire(dom.window.Store.ST_JOURNEES, jour3);
  await attente(150);
  App.aller('journee', { chantierId: ch.id, journeeId: jour3.id });
  await attente(250);
  clic('[data-a="ajouter-tache"]');
  await attente(250);
  choixTaches = [...doc.querySelectorAll('#taLibSel option')].map((o) => o.value);
  T('tâches de la mise en route proposées : contrôle du sens de rotation des moteurs',
    choixTaches.some((v) => /sens de rotation/i.test(v)));
  T('tâches de la mise en route proposées : contrôle des entrées-sorties',
    choixTaches.some((v) => /entrées-sorties/i.test(v)));
  T('le catalogue porte le nom de la phase',
    [...doc.querySelectorAll('#taLibSel optgroup')].some((g) => /Mise en route/.test(g.label)));
  doc.querySelector('.feuille-pied .btn').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(200);

  /* le point du soir annonce la phase du jour */
  T('le document du point du soir mentionne la phase',
    (function () {
      try {
        const d = dom.window.PointSoir.document({
          chantier: ch, journee: jour3, reglages: App.etat.reglages,
          avancement: 0, cumul: 0, blocagesOuverts: [], photos: [], auteur: 'J. Dupont'
        });
        /* le PDF encode les accents en octal : on lit le flux tel quel */
        const texte = JSON.stringify(d.doc.pages);
        return /Phase : Mise en route/.test(texte) && /Automaticien/.test(texte);
      } catch (e) { return false; }
    })());

  /* --- 26. jalons : en ajouter, en supprimer --- */
  fermerFeuilles();
  const jalonsAvant = ch.jalons.length;
  /* le premier jalon par défaut, avec une tâche rattachée dessus */
  const jalonSupprime = ch.jalons[0];
  const journeeTest = App.etat.journees[0];
  journeeTest.taches.push({ id: 't-jalon', libelle: 'Essai rattaché', jalonId: jalonSupprime.id, avancement: 0, heures: 1, etat: 'FAIT' });

  App.aller('fiche', { chantierId: ch.id, onglet: 'synthese' });
  await attente(250);
  T('la carte Jalons propose d\'ajouter', !!doc.querySelector('[data-a="ajouter-jalon"]'));

  /* --- ajout --- */
  clic('[data-a="ajouter-jalon"]');
  await attente(200);
  T('la feuille d\'ajout s\'ouvre', !!doc.querySelector('#njLib') && !!doc.querySelector('#njPoids'));
  ecrire('#njLib', 'Formation des conducteurs de ligne');
  ecrire('#njPoids', '4');
  let boutonsAjout = boutonsFeuille();
  boutonsAjout[boutonsAjout.length - 1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(350);
  T('le jalon est ajouté au chantier', ch.jalons.length === jalonsAvant + 1, ch.jalons.length);
  const jalonNeuf = ch.jalons[ch.jalons.length - 1];
  T('le jalon ajouté porte son libellé et son poids',
    jalonNeuf.libelle === 'Formation des conducteurs de ligne' && jalonNeuf.poids === 4,
    jalonNeuf.libelle + ' / ' + jalonNeuf.poids);
  T('le jalon ajouté démarre à 0 %', jalonNeuf.avancement === 0);
  T('le jalon ajouté apparaît dans la liste', texteEcran().includes('Formation des conducteurs de ligne'));

  /* un jalon sans libellé est refusé, la feuille reste ouverte */
  clic('[data-a="ajouter-jalon"]');
  await attente(200);
  let boutonsVide = boutonsFeuille();
  boutonsVide[boutonsVide.length - 1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(250);
  T('un jalon sans libellé est refusé', ch.jalons.length === jalonsAvant + 1, ch.jalons.length);
  T('la feuille reste ouverte pour corriger', !!doc.querySelector('#njLib'));
  const fermerJ = derniereFeuille() && derniereFeuille().querySelector('[data-fb="fermer"]');
  if (fermerJ) { fermerJ.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); await attente(250); }

  /* --- curseur d'avancement : glisser ou taper, au choix --- */
  clic('[data-a="editer-jalon"][data-id="' + jalonNeuf.id + '"]');
  await attente(200);
  const pisteC = doc.querySelector('#jaAvanR');
  const chiffreC = doc.querySelector('#jaAvan');
  T('la feuille du jalon propose un curseur ET un champ chiffre', !!pisteC && !!chiffreC);
  T('le curseur et le chiffre sont lies',
    !!pisteC && !!chiffreC && pisteC.getAttribute('data-lie') === 'jaAvan' && chiffreC.getAttribute('data-lie') === 'jaAvanR');
  T('la plage du curseur va de 0 a 100 avec un pas de 5',
    !!pisteC && pisteC.getAttribute('min') === '0' && pisteC.getAttribute('max') === '100' && pisteC.getAttribute('step') === '5');
  T('le curseur est accessible (nom annonce)', !!pisteC && !!pisteC.getAttribute('aria-label'));
  /* glisser met le chiffre a jour, et remplit la piste au prorata */
  pisteC.value = '70';
  pisteC.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await attente(80);
  T('glisser le curseur met le chiffre a jour', chiffreC.value === '70', chiffreC.value);
  T('la piste se remplit au prorata du glissement',
    (pisteC.getAttribute('style') || '').indexOf('70%') >= 0, pisteC.getAttribute('style'));
  /* taper un chiffre met le curseur a jour */
  ecrire('#jaAvan', '25');
  await attente(80);
  T('taper le chiffre met le curseur a jour', pisteC.value === '25', pisteC.value);
  /* une valeur hors bornes est ramenee dans la plage */
  ecrire('#jaAvan', '250');
  await attente(80);
  T('une valeur au-dela de 100 est ramenee a 100', chiffreC.value === '100' && pisteC.value === '100',
    chiffreC.value + ' / ' + pisteC.value);
  /* et l'enregistrement retient la valeur affichee */
  ecrire('#jaAvan', '45');
  let boutonsCurseur = boutonsFeuille();
  boutonsCurseur[boutonsCurseur.length - 1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(350);
  T('le curseur enregistre l\'avancement du jalon', jalonNeuf.avancement === 45, jalonNeuf.avancement);
  T('l\'avancement global du chantier suit', Modele.avancementChantier(ch) > 0, Modele.avancementChantier(ch));

  /* --- renommer un jalon, et refuser un libellé vide --- */
  clic('[data-a="editer-jalon"][data-id="' + jalonNeuf.id + '"]');
  await attente(200);
  T('la feuille du jalon permet de corriger son libellé', !!doc.querySelector('#jaLib'));
  ecrire('#jaLib', 'Formation des conducteurs — niveau 2');
  let boutonsRen = boutonsFeuille();
  boutonsRen[boutonsRen.length - 1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(350);
  T('le jalon est renommé', jalonNeuf.libelle === 'Formation des conducteurs — niveau 2', jalonNeuf.libelle);
  T('le nouveau libellé apparaît dans la liste', texteEcran().includes('niveau 2'));
  clic('[data-a="editer-jalon"][data-id="' + jalonNeuf.id + '"]');
  await attente(200);
  ecrire('#jaLib', '   ');
  let boutonsVideLib = boutonsFeuille();
  boutonsVideLib[boutonsVideLib.length - 1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(300);
  T('un libellé vide n\'écrase pas l\'ancien', jalonNeuf.libelle === 'Formation des conducteurs — niveau 2', jalonNeuf.libelle);
  T('la feuille reste ouverte pour corriger', !!doc.querySelector('#jaLib'));
  const fermerRen = derniereFeuille() && derniereFeuille().querySelector('[data-fb="fermer"]');
  if (fermerRen) { fermerRen.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); await attente(250); }

  /* --- suppression : tâche rattachée, confirmation, détachement --- */
  clic('[data-a="editer-jalon"][data-id="' + jalonSupprime.id + '"]');
  await attente(200);
  const boutonsJalon = boutonsFeuille();
  T('la feuille du jalon propose de le supprimer', boutonsJalon.length === 3, boutonsJalon.length);
  T('elle annonce les tâches rattachées à ce jalon', /1 tâche\(s\)/.test(texteFeuille()), texteFeuille().slice(0, 80));
  boutonsJalon[1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(250);
  T('la suppression demande confirmation', texteFeuille().includes('Supprimer ce jalon ?'), texteFeuille().slice(0, 80));
  T('la confirmation annonce le sort des tâches',
    /restent au journal, détachées/.test(texteFeuille()), texteFeuille().slice(0, 120));
  let boutonsConf = boutonsFeuille();
  boutonsConf[boutonsConf.length - 1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await attente(350);
  T('le jalon est retiré du chantier',
    ch.jalons.length === jalonsAvant && !Modele.parId(ch.jalons, jalonSupprime.id), ch.jalons.length);
  T('la tâche rattachée est conservée, détachée du jalon',
    journeeTest.taches.some((t) => t.id === 't-jalon' && t.jalonId === ''),
    JSON.stringify(journeeTest.taches.filter((t) => t.id === 't-jalon')));
  T('le jalon supprimé n\'est plus listé', !texteEcran().includes(jalonSupprime.libelle));

  /* --- supprimer tous les jalons : plus de pourcentage trompeur --- */
  App.etat.chantiers.push(Modele.nouveauChantier({ libelle: 'Chantier sans jalon' }));
  const chVide = App.etat.chantiers[App.etat.chantiers.length - 1];
  const journalVide = Modele.creerJournee(chVide);
  App.etat.journees.push(journalVide);
  [...chVide.jalons].forEach((x) => Modele.retirerJalon(chVide, x.id, [journalVide]));
  App.aller('fiche', { chantierId: chVide.id, onglet: 'synthese' });
  await attente(250);
  T('la carte Jalons reste utilisable sans aucun jalon',
    texteEcran().includes('Aucun jalon pour ce chantier') && !!doc.querySelector('[data-a="ajouter-jalon"]'));

  /* --- 27. mise en page : une seule largeur pour toute l'interface --- */
  /* Le bandeau, le contenu et la barre du bas doivent partager la meme colonne :
     un bandeau reduit a son contenu (marges automatiques dans un conteneur flex)
     etait le defaut constate sur grand ecran. */
  const feuilleCSS = [...doc.querySelectorAll('style')].map((s2) => s2.textContent).join('\n');
  T('largeur de reference declaree (une seule valeur hors grands ecrans)',
    (feuilleCSS.match(/--app-largeur\s*:/g) || []).length === 2);
  T('contenu borne a la colonne',
    /\.contenu\s*\{[^}]*max-width:\s*var\(--app-largeur\)/.test(feuilleCSS));
  T('bandeau aligne sur la colonne par son remplissage',
    /\.topbar\s*\{[^}]*padding:\s*11px var\(--retrait\)/.test(feuilleCSS));
  T('barre du bas alignee sur la colonne',
    /\.barre-bas\s*\{[^}]*padding:\s*10px var\(--retrait\)/.test(feuilleCSS));
  T('onglets alignes sur la colonne',
    /\.onglets\s*\{[^}]*padding:\s*0 var\(--retrait\)/.test(feuilleCSS));
  T('feuilles contenues dans la colonne',
    /\.feuille\s*\{[^}]*max-width:\s*var\(--app-largeur\)/.test(feuilleCSS));
  T('le curseur est dessine selon la charte (remplissage cyan sur piste claire)',
    /\.champ input\[type="range"\]::-webkit-slider-runnable-track\s*\{[^}]*linear-gradient\(90deg, var\(--bfr-primary\)/.test(feuilleCSS));
  T('le curseur ne reprend pas la bordure des champs',
    /\.champ input\[type="range"\]\s*\{[^}]*border:\s*0/.test(feuilleCSS));
  T('marque dimensionnee par la charte (20 px, non deformee)',
    /\.topbar-marque\s*\{[^}]*height:\s*20px[^}]*width:\s*auto/.test(feuilleCSS) &&
    /\.topbar-marque\s*\{[^}]*object-fit:\s*contain/.test(feuilleCSS));
  T('plus aucune regle de style pour une marque recadree',
    !/\.topbar-signet\s*\{/.test(feuilleCSS));
  T('sous-titre du bandeau non limite a une fraction de la largeur',
    !/\.topbar-sous\s*\{[^}]*max-width:\s*\d+vw/.test(feuilleCSS));
  T('marque resserree sur telephones etroits',
    /@media \(max-width: 400px\) \{[^}]*\.topbar-marque\s*\{[^}]*height:\s*17px/.test(feuilleCSS));
  T('marque agrandie au-dela du telephone',
    /@media \(min-width: 620px\)[\s\S]*?\.topbar-marque\s*\{\s*height:\s*24px/.test(feuilleCSS));
  T('aucune largeur figee en pixels pour les barres',
    !/\.(topbar|barre-bas|onglets)\s*\{[^}]*max-width:\s*\d+px/.test(feuilleCSS));

  /* --- 28. garde-fou : une action ne peut pas utiliser « el » sans le recevoir --- */
  /* C'est le défaut qui a produit « Erreur : el is not defined » sur le crayon
     du bandeau de la journée : une action déclarée « function () » alors que le
     répartiteur lui passe l'élément touché. Contrôle statique sur le code
     effectivement livré (la page construite), donc rien ne peut y échapper. */
  const debutActions = html.indexOf('var actions = {');
  const blocActions = debutActions < 0 ? '' : html.slice(debutActions, html.indexOf('\n  };', debutActions));
  const actionsSuspectes = [...blocActions.matchAll(/'([^']+)':\s*function\s*\(([^)]*)\)([\s\S]*?)(?=\n\s*'[^']+':\s*function|\n\s*};)/g)]
    .filter((m) => !/\bel\b/.test(m[2]) && /\bel\./.test(m[3]))
    .map((m) => m[1]);
  T('les actions trouvent bien le bloc de code', blocActions.length > 100, blocActions.length);
  T('aucune action n utilise « el » sans le recevoir', actionsSuspectes.length === 0, actionsSuspectes.join(' | '));

  /* --- 28. aucune erreur d'exécution --- */
  T('aucune erreur d\'exécution', erreurs.length === 0, erreurs.slice(0, 3).join(' | '));

  console.log('\n' + '='.repeat(60));
  console.log('  TEST DE FUMÉE BFR-CHANTIER (DOM simulé)');
  console.log('='.repeat(60));
  console.log('  réussis : ' + ok);
  console.log('  échecs  : ' + ko);
  if (ko) { console.log('\n  Détail :'); echecs.forEach((e) => console.log('   ✗ ' + e)); }
  console.log('='.repeat(60) + '\n');
  await attente(200);          /* laisse la sortie standard se vider avant de quitter */
  try { dom.window.close(); } catch (e) { }
  process.exit(ko ? 1 : 0);
})().catch((e) => {
  console.error('Échec du déroulé :', e && e.stack ? e.stack : e);
  process.exit(1);
});

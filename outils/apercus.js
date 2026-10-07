/* =========================================================================
   Générateur des aperçus — outils/apercus.js
   -------------------------------------------------------------------------
   Outil de développement : il sert à produire les images de « apercus/ » à
   partir de l'application construite. Il n'est PAS nécessaire pour utiliser
   l'application ni pour la publier.
   Produit les images de « apercus/ » :
     · la planche des icônes BFR (monochromes et duotones) ;
     · les captures d'écran de l'application, en données NEUTRES :
       « Client Exemple », adresses en @exemple.fr, aucune donnée réelle.

   Préparation (une fois) — puppeteer reste optionnel, il n'est utilisé que
   pour régénérer les captures :
     npm install puppeteer @resvg/resvg-js
   Exécution (depuis la racine du projet) :
     node outils/apercus.js
   ========================================================================= */

'use strict';
const fs = require('fs');
const path = require('path');

const NODE_MODULES = process.env.APERCUS_MODULES || '/home/user/testenv/node_modules';
const puppeteer = require(path.join(NODE_MODULES, 'puppeteer'));
const { Resvg } = require(path.join(NODE_MODULES, '@resvg/resvg-js'));

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'BFR-Chantier.html');
const OUT = path.join(ROOT, 'apercus');

/* ----------------------------- données neutres ------------------------- */
/* Tout est fictif : « Client Exemple », adresses en @exemple.fr. Rien de réel
   ne doit apparaître sur une capture publiée. */
const DONNEES = {
  societe: { nom: 'BFR SYSTEMS', cpVille: '01150 BLYES', lieuLettre: 'Blyes' },
  utilisateur: { prenom: 'Jean', nom: 'Dupont', tel: '', email: 'j.dupont@exemple.fr',
    fonction: 'Chef de chantier', signature: '' },
  responsables: {
    atelier: { nom: 'M. Martin', email: 'atelier@exemple.fr' },
    beElectro: { nom: 'Mme Bernard', email: 'be@exemple.fr' },
    bureauAuto: { nom: 'M. Lopez', email: 'automatisme@exemple.fr' },
    chargeAffaire: { nom: 'Mme Roy', email: 'affaire@exemple.fr' },
    commercial: { nom: 'M. Petit', email: 'commercial@exemple.fr' },
    direction: { nom: '', email: 'direction@exemple.fr' }
  },
  chantier: {
    numeroAffaire: '25-0142',
    libelle: 'Ligne 3 — mise en route',
    phase: 'MISE_EN_ROUTE',
    client: { nom: 'Client Exemple', ville: 'Bourg-en-Bresse' },
    dureePrevueJours: 8,
    effectifPrevu: 2,
    equipe: '1 automaticien + 1 mécanicien (réglages)'
  }
};

/* ------------------------------ planche d'icônes ----------------------- */
function plancheIcones() {
  require(path.join(ROOT, 'app', 'src', 'icons.js'));
  const ICO = global.ICO;
  const noms = ['accueil', 'reglages', 'modeEmploi', 'calendrier', 'horloge', 'pointSoir', 'avancement', 'effectif',
    'valide', 'valideCercle', 'refuseCercle', 'demi', 'vide', 'alerte', 'alerteCercle', 'interdit', 'bouclier', 'information',
    'cle', 'eclaire', 'prise', 'automate', 'fiole', 'grue', 'chapeau', 'itineraire', 'sablier', 'reunion', 'colis',
    'document', 'compteRendu', 'signature', 'medaille', 'courriel', 'envoi', 'photo', 'micro', 'crayon', 'corbeille',
    'telecharger', 'televerser', 'copie', 'apercu', 'piece', 'plus', 'plusCercle', 'lecture', 'pause', 'arret', 'cible',
    'verrou', 'etoile', 'aide', 'refaire', 'puce', 'menu', 'retour', 'fermer', 'suivant', 'bas'];

  const parLigne = 9, cote = 92, marge = 16;
  const lignes = Math.ceil(noms.length / parLigne);
  const L = parLigne * cote + marge * 2, H = lignes * cote + marge * 2;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}" viewBox="0 0 ${L} ${H}">
<rect width="${L}" height="${H}" fill="#ffffff"/>`;
  noms.forEach((nom, i) => {
    const c = i % parLigne, r = Math.floor(i / parLigne);
    const x = marge + c * cote, y = marge + r * cote;
    svg += `<g transform="translate(${x + 22},${y + 12}) scale(1.9)" color="#332e72">${ICO[nom](24)}</g>`;
    svg += `<text x="${x + 46}" y="${y + 74}" font-size="9.5" fill="#6b7183" text-anchor="middle" font-family="Helvetica">${nom}</text>`;
    svg += `<rect x="${x + 6}" y="${y + 4}" width="${cote - 12}" height="${cote - 12}" fill="none" stroke="#eceef5"/>`;
  });
  svg += '</svg>';
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1100 } }).render().asPng();
  fs.writeFileSync(path.join(OUT, 'icones-bfr-monochrome-et-duotone.png'), png);
  console.log('  planche d\'icônes :', noms.length, 'icônes');
}

/* ------------------------------- écrans -------------------------------- */
async function ecrans() {
  const navigateur = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'] });
  const page = await navigateur.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push('console: ' + m.text()); });
  await page.goto('file://' + APP, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  /* jeu de données de démonstration — entièrement fictif, au format réel */
  await page.evaluate((D) => {
    const A = window.App, M = window.Modele, U = window.Usage;

    /* réglages : l'utilisateur et les destinataires (aucune adresse réelle) */
    A.etat.reglages.societe = Object.assign(A.etat.reglages.societe || {}, D.societe);
    A.etat.reglages.utilisateur = Object.assign(A.etat.reglages.utilisateur || {}, D.utilisateur);
    A.etat.reglages.responsables = D.responsables;

    /* chantier : jalons pondérés, avancement et statut */
    const ch = M.nouveauChantier(D.chantier);
    ch.statut = 'EN_COURS';
    ch.dateDebutReelle = M.aujourdhui();
    ['prepa', 'expedition', 'montage', 'cablage'].forEach((j) => M.appliquerAvancement(ch, j, 100));
    M.appliquerAvancement(ch, 'raccordement', 100);
    M.appliquerAvancement(ch, 'reseaux', 100);
    M.appliquerAvancement(ch, 'parametrage', 80);
    M.appliquerAvancement(ch, 'essais_blanc', 45);
    M.appliquerAvancement(ch, 'essais_prod', 15);

    /* journée : horaires, tâches, actions, blocages, matériel, essais */
    const j = M.creerJournee(ch, null, M.aujourdhui());
    j.debut = '07:45'; j.fin = '16:30'; j.pauses = [{ minutes: 45 }];
    j.effectif = { nb: 2, detail: '1 automaticien + 1 mécanicien' };
    j.taches = [
      { id: 't1', libelle: 'Contrôle des entrées-sorties', jalonId: 'parametrage', etat: 'FAIT',
        avancement: 8, heures: 3, motif: '', origine: '' },
      { id: 't2', libelle: 'Contrôle du sens de rotation des moteurs', jalonId: 'parametrage', etat: 'PARTIEL',
        avancement: 0, heures: 2, motif: 'moteur M4 à reprendre avec le mécanicien', origine: '' },
      { id: 't3', libelle: 'Premières productions allégées', jalonId: 'essais_prod', etat: 'PREVU',
        avancement: 0, heures: 0, motif: '', origine: '' }
    ];
    j.actions = [
      { id: 'a1', activite: 'PARAMETRAGE', categorie: 'AVANCEMENT', photo: '',
        texte: 'Entrées-sorties vérifiées : 24/24 conformes', heure: '09:15' },
      { id: 'a2', activite: 'ESSAI', categorie: 'INFO', photo: '',
        texte: 'Essai à blanc partiel : cycle de démarrage OK', heure: '11:40' }
    ];
    j.blocages = [
      { id: 'b1', description: 'Accès à la zone presse refusé pour l\'essai', gravite: 1,
        debloqueur: 'CLIENT', action: 'Décaler la production d\'une heure', echeance: 'sous 24 h',
        statut: 'OUVERT', ouvertLe: M.aujourdhui() },
      { id: 'b2', description: 'Voyant de défaut du pupitre 2 à remplacer', gravite: 3,
        debloqueur: 'ATELIER', action: 'Envoyer un voyant avec le prochain déplacement', echeance: 'cette semaine',
        statut: 'OUVERT', ouvertLe: M.aujourdhui() }
    ];
    j.materiel = [
      { id: 'm1', designation: 'Voyant de défaut 24 V (pupitre 2)', reference: 'XB4BVM5',
        etat: 'MANQUANT', qte: 2, besoinLe: M.aujourdhui() }
    ];
    j.securite = { incidents: [], remarques: 'Aucun incident. Port des EPI conforme.', renseigne: true };
    j.essais = [
      { id: 'e1', libelle: "Mesure d'isolement (mégohmmètre)", resultat: 'OK',
        mesures: '> 500 MΩ', contreVisite: false },
      { id: 'e2', libelle: "Essai des arrêts d'urgence", resultat: 'NOK',
        mesures: 'AU2 non câblé', contreVisite: true }
    ];
    j.coactivite = [{ entreprise: 'Entreprise Exemple', effectif: 2, remarque: 'zone local électrique' }];
    j.formation = {
      intitule: 'Conduite et dépannage de la ligne 3', type: 'POSTE',
      dureeH: 2, formateur: 'J. Dupont',
      participants: [
        { nom: 'M. Dubois', fonction: 'Chef de ligne', acquis: 'ACQUIS', signature: true },
        { nom: 'S. Lambert', fonction: 'Conducteur', acquis: 'ACQUIS', signature: true },
        { nom: 'J. Martin', fonction: 'Conducteur', acquis: 'A_CONSOLIDER', signature: false }
      ],
      programme: [
        { libelle: 'Description de l\'installation', duree: '0 h 45', traite: true },
        { libelle: 'Consignes de sécurité et arrêts d\'urgence', duree: '0 h 30', traite: true },
        { libelle: 'Dépannage : défauts courants', duree: '0 h 45', traite: false }
      ]
    };
    j.prevuDemain = {
      taches: ['Reprise du moteur M4 avec le mécanicien', 'Essai à blanc complet',
               'Début de la formation des conducteurs'],
      effectif: 2, besoins: ['Accès zone presse entre 12 h et 14 h']
    };
    j.synthese = "Bonne journée de mise en route : les entrées-sorties sont conformes et le cycle de "
      + 'démarrage tient en essai à blanc. Le moteur M4 tourne à l\'envers (à reprendre avec le '
      + 'mécanicien). L\'accès à la zone presse a été refusé en fin de journée : l\'essai à blanc '
      + 'complet est reporté à demain.';

    A.etat.chantiers = [ch]; A.etat.journees = [j]; A.etat.photosCache = {};

    /* mémoire d'usage : les essais les plus utilisés remontent en tête */
    ["Mesure d'isolement (mégohmmètre)", "Mesure d'isolement (mégohmmètre)",
     "Essai des arrêts d'urgence", 'Contrôle du sens de rotation moteur',
     'Contrôle de la continuité des masses et de la terre']
      .forEach((v) => U.enregistrer('essai.libelle', v));
    ['Contrôle des entrées-sorties', 'Contrôle du sens de rotation des moteurs',
     'Essai à blanc avec l\'équipe', 'Paramétrage des variateurs']
      .forEach((v) => U.enregistrer('tache.libelle', v));

    A.aller('accueil');
  }, DONNEES);
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: path.join(OUT, 'ecran-accueil.png') });
  console.log('  écran accueil');

  /* écran de création : le choix de la phase des travaux */
  await page.evaluate(() => {
    window.App.etat.nouveau = { phase: 'MISE_EN_ROUTE', effectifPrevu: 2, dureePrevueJours: 5,
      dateDebutPrevue: window.Modele.aujourdhui(), client: {}, contacts: {}, contraintes: {} };
    window.App.aller('nouveau');
  });
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: path.join(OUT, 'ecran-nouveau-chantier.png') });
  console.log('  écran nouveau chantier (phases)');

  const vues = [
    ['journee', () => window.App.aller('journee', { chantierId: window.App.etat.chantiers[0].id, journeeId: window.App.etat.journees[0].id })],
    ['point-du-soir', () => window.App.aller('point', { chantierId: window.App.etat.chantiers[0].id, journeeId: window.App.etat.journees[0].id })],
    ['fiche-chantier', () => window.App.aller('fiche', { chantierId: window.App.etat.chantiers[0].id, onglet: 'synthese' })],
    ['reglages', () => window.App.aller('reglages')]
  ];
  for (const [nom, fn] of vues) {
    await page.evaluate(fn);
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: path.join(OUT, 'ecran-' + nom + '.png') });
    console.log('  écran ' + nom);
  }

  /* menu général (feuille) */
  await page.evaluate(() => window.App.aller('accueil'));
  await new Promise((r) => setTimeout(r, 600));
  const boite = await (await page.$('[data-a="menu"]')).boundingBox();
  await page.mouse.click(boite.x + boite.width / 2, boite.y + boite.height / 2);
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT, 'menu-general.png') });
  console.log('  menu général');

  /* feuille d'ajout d'un essai : la liste déroulante */
  await page.evaluate(() => {
    const f = document.querySelector('[data-fb="fermer"]'); if (f) f.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.evaluate(() => window.App.aller('journee', { chantierId: window.App.etat.chantiers[0].id, journeeId: window.App.etat.journees[0].id }));
  await new Promise((r) => setTimeout(r, 600));
  await page.evaluate(() => { const b = document.querySelector('[data-a="ajouter-essai"]'); if (b) b.click(); });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT, 'feuille-essai.png') });
  console.log('  feuille « Ajouter un essai »');
  await page.evaluate(() => { const c = document.querySelector('.feuille-pied .btn'); if (c) c.click(); });

  /* aperçu du point du soir (le PDF tel qu'il sera envoyé) */
  await page.evaluate(() => window.App.aller('point', { chantierId: window.App.etat.chantiers[0].id, journeeId: window.App.etat.journees[0].id }));
  await new Promise((r) => setTimeout(r, 2200));
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('h3')].find((h) => /Aperçu du document/.test(h.textContent));
    if (t) t.scrollIntoView({ block: 'start' });
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT, 'point-du-soir-pdf.png') });
  console.log('  aperçu du PDF');

  console.log('  erreurs d\'exécution :', erreurs.length ? erreurs.join(' | ') : 'aucune');
  await navigateur.close();
  if (erreurs.length) process.exitCode = 1;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  console.log('='.repeat(64));
  console.log('  APERÇUS BFR CHANTIER (données fictives)');
  console.log('='.repeat(64));
  plancheIcones();
  await ecrans();
  console.log('='.repeat(64) + '\n');
})().catch((e) => { console.error('Échec :', e && e.message); process.exit(1); });

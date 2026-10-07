/* =========================================================================
   BFR-CHANTIER — MODÈLE DE DONNÉES
   -------------------------------------------------------------------------
   Fonctions pures : aucune dépendance au navigateur, aucune écriture.
   Tout le calcul du chantier est ici (heures, avancement, reports, alertes),
   ce qui permet de le vérifier automatiquement (tests/test-modele.js).

   Vocabulaire :
     Chantier  — une affaire d'installation / mise en service / formation
     Journée   — une journée de présence sur site (ouverte le matin, clôturée le soir)
     Action    — un fait marquant de la journée (texte, photo, catégorie)
     Blocage   — ce qui empêche ou ralentit ; porte une gravité et un responsable
     Jalon     — une étape d'avancement pondérée
   ========================================================================= */
(function (global) {
  'use strict';

  /* ============================= Référentiels ========================== */

  /* ======================= Phase des travaux ===========================
     Une affaire se déroule en phases : elles ne font pas appel aux mêmes
     métiers, ne se suivent pas au même rythme, et n'attendent pas les mêmes
     documents. Le chef de chantier choisit la phase en cours à la création,
     puis la fait avancer d'un geste quand l'équipe change (« Phase suivante »
     sur la fiche du chantier). Chaque journée retient la phase dans laquelle
     elle a été travaillée : le point du soir dit donc toujours ce qui était
     en cours ce jour-là, même si l'affaire a avancé depuis. */
  var PHASES = [
    {
      id: 'INSTALLATION',
      libelle: 'Installation mécanique',
      court: 'Installation',
      icone: 'cle',
      equipe: 'Mécanicien — un câbleur en renfort selon les cas',
      metiers: ['Mécanicien', 'Câbleur'],
      resume: 'Montage mécanique, puis raccordements : électricité, air comprimé, réseau informatique et eau selon les cas.',
      suite: 'MISE_EN_ROUTE'
    },
    {
      id: 'MISE_EN_ROUTE',
      libelle: 'Mise en route',
      court: 'Mise en route',
      icone: 'automate',
      equipe: 'Automaticien(s) — un mécanicien en renfort pour les réglages',
      metiers: ['Automaticien', 'Mécanicien'],
      resume: 'Démarrage de la ligne : entrées-sorties, sens de rotation des moteurs, essais, premières productions allégées, début de la formation des équipes.',
      suite: 'ACCOMPAGNEMENT'
    },
    {
      id: 'ACCOMPAGNEMENT',
      libelle: 'Accompagnement',
      court: 'Accompagnement',
      icone: 'reunion',
      equipe: 'Automaticien, le plus souvent seul',
      metiers: ['Automaticien'],
      resume: 'La ligne tourne et le client est autonome : nous restons sur site pour prendre en compte ses problèmes et ses besoins.',
      suite: null
    }
  ];

  var PHASE_DEFAUT = 'INSTALLATION';

  function phaseValide(id) {
    return PHASES.some(function (p) { return p.id === id; }) ? id : PHASE_DEFAUT;
  }

  /* Les affaires créées avant les phases portaient un « type » : on le
     traduit une fois pour toutes. */
  function phaseDepuisType(t) {
    if (t === 'MISE_EN_SERVICE') return 'MISE_EN_ROUTE';
    if (t === 'FORMATION') return 'ACCOMPAGNEMENT';
    return PHASE_DEFAUT;
  }

  /* Phase d'un chantier (les données anciennes sont acceptées telles quelles) */
  function phaseDe(chantier) {
    if (!chantier) return PHASE_DEFAUT;
    if (chantier.phase && PHASES.some(function (p) { return p.id === chantier.phase; })) return chantier.phase;
    if (chantier.type) return phaseDepuisType(chantier.type);
    return PHASE_DEFAUT;
  }

  function phase(chantier) { return parId(PHASES, phaseDe(chantier)); }

  /* Phase dans laquelle une journée a été travaillée : elle est figée sur la
     journée, de sorte qu'un point du soir reste fidèle au jour qu'il décrit,
     même si l'affaire est passée à la phase suivante depuis. */
  function phaseJournee(journee, chantier) {
    if (journee && journee.phase && PHASES.some(function (p) { return p.id === journee.phase; })) return journee.phase;
    return phaseDe(chantier);
  }

  function suitePhase(id) { var p = parId(PHASES, phaseValide(id)); return p ? p.suite : null; }

  var STATUTS = [
    { id: 'PREVU', libelle: 'Prévu', couleur: '#64748b' },
    { id: 'EN_COURS', libelle: 'En cours', couleur: '#06baf2' },
    { id: 'ATTENTE', libelle: 'En attente', couleur: '#4a4f6b' },
    { id: 'SUSPENDU', libelle: 'Suspendu', couleur: '#b42318' },
    { id: 'RECEPTIONNE', libelle: 'Réceptionné', couleur: '#1c8676' },
    { id: 'CLOTURE', libelle: 'Clôturé', couleur: '#332e72' }
  ];

  /* Activités du chantier — étape 1 de l'assistant « Ajouter une action » */
  var ACTIVITES = [
    { id: 'MONTAGE', libelle: 'Montage', icone: 'cle' },
    { id: 'CABLAGE', libelle: 'Câblage', icone: 'eclaire' },
    { id: 'RACCORDEMENT', libelle: 'Raccordement', icone: 'prise' },
    { id: 'PARAMETRAGE', libelle: 'Paramétrage', icone: 'automate' },
    { id: 'ESSAI', libelle: 'Essai', icone: 'fiole' },
    { id: 'LEVAGE', libelle: 'Levage / manutention', icone: 'grue' },
    { id: 'FORMATION', libelle: 'Formation', icone: 'chapeau' },
    { id: 'DEPLACEMENT', libelle: 'Déplacement', icone: 'itineraire' },
    { id: 'ATTENTE', libelle: 'Attente / immobilisation', icone: 'sablier' },
    { id: 'REUNION', libelle: 'Réunion / coordination', icone: 'reunion' }
  ];

  /* Catégories — étape 4 de l'assistant : elles pilotent le point du soir */
  var CATEGORIES = [
    { id: 'SECURITE', libelle: 'Sécurité', icone: 'bouclier', couleur: '#332e72', fond: '#e9e8f4' },
    { id: 'BLOCAGE', libelle: 'Blocage chantier', icone: 'interdit', couleur: '#1f1c45', fond: '#e4e3ee' },
    { id: 'RETARD', libelle: 'Retard / dérive', icone: 'alerte', couleur: '#4a4f6b', fond: '#ecebf4' },
    { id: 'APPRO', libelle: 'Approvisionnement', icone: 'colis', couleur: '#0b5f80', fond: '#eef8fd' },
    { id: 'AVANCEMENT', libelle: 'Point d\'avancement', icone: 'valideCercle', couleur: '#1c8676', fond: '#e7f2ef' },
    { id: 'INFO', libelle: 'Informatif', icone: 'information', couleur: '#64748b', fond: '#f1f4f8' }
  ];

  /* Gravités d'un blocage */
  var GRAVITES = [
    { id: 1, libelle: '1 · Bloque l\'équipe', court: '1 · Bloque', couleur: '#b42318', fond: '#fbeceb' },
    { id: 2, libelle: '2 · Ralentit', court: '2 · Ralentit', couleur: '#4a4f6b', fond: '#ecebf4' },
    { id: 3, libelle: '3 · Gêne', court: '3 · Gêne', couleur: '#64748b', fond: '#f1f4f8' }
  ];

  /* Qui peut débloquer — alimente la règle « premier destinataire du mail » */
  var DEBLOQUEURS = [
    { id: 'ATELIER', libelle: 'Chef d\'atelier', role: 'atelier' },
    { id: 'BE_ELECTRO', libelle: 'Responsable BE électrotechnique', role: 'beElectro' },
    { id: 'BUREAU_AUTO', libelle: 'Chef bureau automatisme', role: 'bureauAuto' },
    { id: 'CHARGE_AFFAIRE', libelle: 'Chargé d\'affaire', role: 'chargeAffaire' },
    { id: 'CLIENT', libelle: 'Client', role: null },
    { id: 'FOURNISSEUR', libelle: 'Fournisseur', role: null },
    { id: 'AUTRE_CORPS', libelle: 'Autre corps d\'état', role: null }
  ];

  var ETATS_TACHE = [
    { id: 'FAIT', libelle: 'Réalisée', icone: 'valide' },
    { id: 'PARTIEL', libelle: 'Partielle', icone: 'demi' },
    { id: 'NON_FAIT', libelle: 'Non réalisée', icone: 'fermer' },
    { id: 'PREVU', libelle: 'À faire', icone: 'vide' }
  ];

  var ETATS_MATERIEL = [
    { id: 'MANQUANT', libelle: 'Manquant', couleur: '#b42318', fond: '#fbeceb' },
    { id: 'A_PREVOIR', libelle: 'À prévoir', couleur: '#4a4f6b', fond: '#ecebf4' },
    { id: 'LIVRE', libelle: 'Livré sur site', couleur: '#1c8676', fond: '#e7f2ef' },
    { id: 'RETOUR', libelle: 'Retour atelier', couleur: '#475569', fond: '#f1f4f8' }
  ];

  /* Essais et contrôles les plus courants sur nos chantiers : proposés dans
     la liste déroulante, avant que l'application ne connaisse les habitudes
     de l'utilisateur. */
  var CATALOGUE_ESSAIS = [
    'Contrôle du câblage et du repérage',
    'Contrôle de la continuité des masses et de la terre',
    'Mesure d\'isolement (mégohmmètre)',
    'Contrôle des protections différentielles',
    'Contrôle du sens de rotation moteur',
    'Contrôle du bilan électrique (tensions, intensités)',
    'Réglage et contrôle des paramètres variateur',
    'Contrôle des protections thermiques moteur',
    'Vérification des fins de course et capteurs de position',
    'Essai des arrêts d\'urgence et des sécurités',
    'Vérification des interverrouillages et des portes',
    'Contrôle de l\'IHM, des voyants et de la signalisation',
    'Essai à blanc (marche à vide)',
    'Essai en production / en charge',
    'Essai d\'endurance (cycles répétés)',
    'Contrôle de la cadence et du débit',
    'Vérification des alarmes et défauts (remise à zéro)',
    'Contrôle hydraulique (pression, fuites)',
    'Contrôle pneumatique (pression, étanchéité)',
    'Étalonnage des capteurs de pesage',
    'Relevé des températures et des vibrations',
    'Vérification réseau et communication (Ethernet, bus de terrain)',
    'Essai de coupure et redémarrage (perte d\'énergie)',
    'Contrôle qualité produit en sortie',
    'Contrôle de la propreté et du nettoyage (CIP)',
    'Vérification du dossier machine (plans, plaque, étiquetage)',
    'Réception contradictoire avec le client'
  ];

  /* Tâches de chantier les plus courantes */
  /* Tâches proposées selon la phase : ce sont celles que l'équipe en place
     fait réellement. La saisie libre reste possible (choix « Autre »), et la
     mémoire d'usage remonte les tâches habituelles de chacun. */
  var CATALOGUE_TACHES_PHASE = {
    INSTALLATION: [
      'Préparation du poste de travail et des outillages',
      'Déchargement et mise en place du matériel',
      'Montage mécanique de l\'ensemble',
      'Alignement, calage et fixation au sol',
      'Montage des protecteurs et carters',
      'Raccordement des tubes et flexibles',
      'Raccordement air comprimé',
      'Raccordement eau / fluides',
      'Tirage et raccordement des câbles',
      'Raccordement de l\'armoire électrique',
      'Mise à la terre et continuité des masses',
      'Connexions réseau / informatique',
      'Repérage et étiquetage',
      'Nettoyage et remise en ordre du chantier',
      'Réunion de chantier avec le client'
    ],
    MISE_EN_ROUTE: [
      'Mise sous tension et contrôles de sécurité',
      'Contrôle des entrées-sorties',
      'Contrôle du sens de rotation des moteurs',
      'Paramétrage des variateurs',
      'Programmation de l\'automate',
      'Réglages mécaniques avec le mécanicien',
      'Essais à blanc avec l\'équipe',
      'Premières productions allégées',
      'Essais en production avec le client',
      'Début de la formation des équipes',
      'Formation des opérateurs',
      'Réunion de chantier avec le client'
    ],
    ACCOMPAGNEMENT: [
      'Point avec l\'exploitant sur les problèmes rencontrés',
      'Analyse d\'un défaut ou d\'un arrêt de ligne',
      'Réglage fin / optimisation',
      'Modification du programme',
      'Formation complémentaire des opérateurs',
      'Formation maintenance / dépannage',
      'Demande d\'amélioration transmise au bureau d\'études',
      'Levée des réserves',
      'Réunion de chantier avec le client'
    ]
  };

  /* Catalogue complet (toutes phases) — sert de repli et à la documentation */
  var CATALOGUE_TACHES = (function () {
    var out = [];
    PHASES.forEach(function (p) {
      (CATALOGUE_TACHES_PHASE[p.id] || []).forEach(function (t) {
        if (out.indexOf(t) === -1) out.push(t);
      });
    });
    return out;
  })();

  function tachesPhase(id) {
    return CATALOGUE_TACHES_PHASE[phaseValide(id)] || CATALOGUE_TACHES;
  }

  var RESULTATS_ESSAI = [
    { id: 'OK', libelle: 'OK', couleur: '#1c8676', fond: '#e7f2ef' },
    { id: 'PARTIEL', libelle: 'Partiel', couleur: '#4a4f6b', fond: '#ecebf4' },
    { id: 'NOK', libelle: 'NOK', couleur: '#b42318', fond: '#fbeceb' }
  ];

  var ACQUIS = [
    { id: 'ACQUIS', libelle: 'Acquis' },
    { id: 'A_CONSOLIDER', libelle: 'À consolider' },
    { id: 'NON_ACQUIS', libelle: 'Non acquis' }
  ];

  var TYPES_FORMATION = [
    { id: 'PRISE_EN_MAIN', libelle: 'Prise en main machine' },
    { id: 'CONDUITE', libelle: 'Conduite / exploitation' },
    { id: 'MAINTENANCE', libelle: 'Maintenance niveau 1' },
    { id: 'REGLAGES', libelle: 'Réglages / recettes' },
    { id: 'SECURITE', libelle: 'Sécurité' },
    { id: 'HABILITATION', libelle: 'Habilitation' },
    { id: 'AUTRE', libelle: 'Autre' }
  ];

  /* Jalons par défaut — pondérés (total 100). Modifiables chantier par chantier. */
  var JALONS_DEFAUT = [
    { id: 'prepa', libelle: 'Préparation atelier', poids: 5 },
    { id: 'expedition', libelle: 'Expédition / réception matériel', poids: 5 },
    { id: 'montage', libelle: 'Montage mécanique', poids: 12 },
    { id: 'cablage', libelle: 'Câblage électrique', poids: 12 },
    { id: 'raccordement', libelle: 'Raccordements', poids: 10 },
    { id: 'parametrage', libelle: 'Paramétrage automatisme', poids: 14 },
    { id: 'essais_blanc', libelle: 'Essais à blanc', poids: 10 },
    { id: 'essais_prod', libelle: 'Essais en production', poids: 10 },
    { id: 'reseaux', libelle: 'Connexions réseaux / IT', poids: 5 },
    { id: 'formation', libelle: 'Formation des équipes', poids: 7 },
    { id: 'reserves', libelle: 'Levée des réserves', poids: 5 },
    { id: 'reception', libelle: 'Réception client', poids: 3 },
    { id: 'dossier', libelle: 'Clôture documentaire', poids: 2 }
  ];

  /* Modèles de chantier prêts à l'emploi (2 minutes au lieu de 20) */
  var MODELES = [
    {
      id: 'installation',
      libelle: 'Installation mécanique (montage + raccordements)',
      phase: 'INSTALLATION',
      dureeJours: 8,
      effectifPrevu: 2,
      equipements: [],
      contraintes: 'Accès zone production soumis à autorisation. Coupure d\'énergie à demander la veille.'
    },
    {
      id: 'mise_en_route',
      libelle: 'Mise en route (démarrage, entrées-sorties, essais)',
      phase: 'MISE_EN_ROUTE',
      dureeJours: 5,
      effectifPrevu: 2,
      equipements: [],
      contraintes: 'Machine disponible en dehors des heures de production pour les essais.'
    },
    {
      id: 'accompagnement',
      libelle: 'Accompagnement sur site (ligne en production)',
      phase: 'ACCOMPAGNEMENT',
      dureeJours: 3,
      effectifPrevu: 1,
      equipements: [],
      contraintes: 'Interventions à caler avec l\'exploitant, sans arrêter la production.'
    }
  ];

  /* ============================ Utilitaires ============================ */

  function parId(liste, id) {
    for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
    return null;
  }
  function libelle(liste, id) { var e = parId(liste, id); return e ? e.libelle : (id || ''); }
  function icone(liste, id) { var e = parId(liste, id); return e ? e.icone : ''; }

  function uid(prefixe) {
    return (prefixe || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function vide(v) { return v === undefined || v === null || String(v).trim() === ''; }

  /* « 07:45 » ou « 0745 » -> minutes depuis minuit */
  function minutes(hhmm) {
    if (vide(hhmm)) return null;
    var m = String(hhmm).match(/(\d{1,2})\s*[:hH]?\s*(\d{2})?/);
    if (!m) return null;
    var h = parseInt(m[1], 10);
    var mn = m[2] ? parseInt(m[2], 10) : 0;
    if (isNaN(h) || isNaN(mn)) return null;
    return h * 60 + mn;
  }

  /* minutes -> « 7 h 30 » */
  function texteHeures(mn) {
    if (mn === null || mn === undefined || isNaN(mn)) return '—';
    var signe = mn < 0 ? '-' : '';
    mn = Math.abs(Math.round(mn));
    return signe + Math.floor(mn / 60) + ' h ' + ('0' + (mn % 60)).slice(-2);
  }

  /* heures décimales -> « 7 h 30 » */
  function texteHeuresDec(h) {
    if (h === null || h === undefined || isNaN(h)) return '—';
    return texteHeures(h * 60);
  }

  function texteDate(iso) {
    if (vide(iso)) return '—';
    var d = new Date(iso + (String(iso).length <= 10 ? 'T12:00:00' : ''));
    if (isNaN(d.getTime())) return String(iso);
    var jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    var mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
      'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return jours[d.getDay()] + ' ' + d.getDate() + ' ' + mois[d.getMonth()] + ' ' + d.getFullYear();
  }

  function texteDateCourt(iso) {
    if (vide(iso)) return '—';
    var p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(iso);
  }

  function aujourdhui() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function maintenant() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  /* Nombre de jours entre deux dates ISO (b - a) */
  function joursEntre(a, b) {
    var da = new Date(a + 'T12:00:00'), db = new Date(b + 'T12:00:00');
    if (isNaN(da) || isNaN(db)) return 0;
    return Math.round((db - da) / 86400000);
  }

  /* ====================== Chantier : création et état =================== */

  function nouveauChantier(donnees) {
    var d = donnees || {};
    var modele = d.modeleId ? parId(MODELES, d.modeleId) : null;
    return {
      id: uid('ch'),
      numeroAffaire: d.numeroAffaire || '',
      libelle: d.libelle || '',
      phase: phaseValide(d.phase || (modele && modele.phase) || phaseDepuisType(d.type)),
      statut: 'PREVU',
      client: Object.assign({ nom: '', ville: '', adresse: '', site: '', logo: '' }, d.client || {}),
      contacts: Object.assign({ referent: '', fonction: '', tel: '', email: '', securite: '' }, d.contacts || {}),
      equipements: d.equipements || [],
      effectifPrevu: d.effectifPrevu || 1,
      dureePrevueJours: d.dureePrevueJours || (modele ? modele.dureeJours : 1),
      dateDebutPrevue: d.dateDebutPrevue || aujourdhui(),
      dateFinPrevue: d.dateFinPrevue || '',
      dateDebutReelle: '',
      dateFinReelle: '',
      jalons: jalonsNeufs(),
      responsables: (function () {
        var src = d.responsables || {}, out = {};
        ROLES_RESPONSABLES.forEach(function (r) { out[r.role] = normaliserResponsable(src[r.role]); });
        return out;
      })(),
      copieCommercial: !!d.copieCommercial,
      contraintes: Object.assign({
        horaires: '', acces: '', securite: '', consignes: ''
      }, d.contraintes || {}),
      equipe: d.equipe || '',                 // composition prévue de l'équipe (texte libre)
      phaseHistorique: [],                   // [{ phase, le }] : trace des changements de phase
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function jalonsNeufs(avecValeurs) {
    return JALONS_DEFAUT.map(function (j) {
      var src = avecValeurs ? parId(avecValeurs, j.id) : null;
      return {
        id: j.id,
        libelle: (src && src.libelle) || j.libelle,
        poids: (src && src.poids !== undefined) ? src.poids : j.poids,
        avancement: (src && src.avancement) || 0
      };
    });
  }

  /* Avancement global, pondéré par les poids des jalons (0 à 100) */
  function avancementChantier(chantier) {
    var jalons = (chantier && chantier.jalons) || [];
    var totalPoids = 0, total = 0;
    jalons.forEach(function (j) {
      var p = Number(j.poids) || 0;
      var a = Math.max(0, Math.min(100, Number(j.avancement) || 0));
      totalPoids += p;
      total += p * a;
    });
    if (totalPoids <= 0) return 0;
    return Math.round(total / totalPoids);
  }

  /* Jalon responsable d'un retard éventuel : le plus « en arrière » et pondéré */
  function jalonsEnCours(chantier) {
    return ((chantier && chantier.jalons) || []).filter(function (j) {
      return (Number(j.avancement) || 0) > 0 && (Number(j.avancement) || 0) < 100;
    });
  }

  /* Applique des points d'avancement à un jalon (borné à 100) */
  function appliquerAvancement(chantier, jalonId, points) {
    var j = parId(chantier.jalons || [], jalonId);
    if (!j) return null;
    var avant = Number(j.avancement) || 0;
    j.avancement = Math.max(0, Math.min(100, avant + (Number(points) || 0)));
    return { avant: avant, apres: j.avancement };
  }

  /* ======================= Journée : heures et effectif ================= */

  function dureeJourneeMn(journee) {
    if (!journee) return 0;
    var debut = minutes(journee.debut), fin = minutes(journee.fin);
    if (debut === null) return 0;
    if (fin === null) fin = minutes(maintenant());
    var total = fin - debut;
    if (total < 0) total += 24 * 60;
    (journee.pauses || []).forEach(function (p) {
      var a = minutes(p.debut), b = minutes(p.fin);
      if (a !== null && b !== null && b >= a) total -= (b - a);
    });
    return Math.max(0, total);
  }

  /* Hommes-heures de la journée (effectif × durée) */
  function hommesHeures(journee) {
    if (!journee) return 0;
    var nb = Number(journee.effectif && journee.effectif.nb) || 0;
    return (dureeJourneeMn(journee) / 60) * nb;
  }

  function cumulHommesHeures(journees) {
    return (journees || []).reduce(function (t, j) { return t + hommesHeures(j); }, 0);
  }

  function cumulMinutesSurSite(journees) {
    return (journees || []).reduce(function (t, j) { return t + dureeJourneeMn(j); }, 0);
  }

  /* ========================== Reports automatiques ====================== */

  /* Tâches non terminées d'une journée -> plan du lendemain */
  function tachesNonTerminees(journee) {
    return ((journee && journee.taches) || []).filter(function (t) {
      return t.etat === 'PARTIEL' || t.etat === 'NON_FAIT' || t.etat === 'PREVU';
    });
  }

  /* Blocages encore ouverts, avec leur ancienneté en jours */
  function blocagesOuverts(journees, dateRef) {
    var out = [];
    (journees || []).forEach(function (j) {
      (j.blocages || []).forEach(function (b) {
        if (b.statut === 'LEVE') return;
        var anciennete = dateRef ? Math.max(0, joursEntre(String(b.ouvertLe || j.date).slice(0, 10), dateRef)) : 0;
        out.push({
          blocage: b,
          journeeId: j.id,
          date: j.date,
          jour: j.numero,
          anciennete: anciennete,
          persistant: anciennete >= 3
        });
      });
    });
    out.sort(function (a, b) {
      if (a.blocage.gravite !== b.blocage.gravite) return a.blocage.gravite - b.blocage.gravite;
      return b.anciennete - a.anciennete;
    });
    return out;
  }

  function blocagesDuJour(journee) {
    return (journee && journee.blocages) || [];
  }

  /* Y a-t-il une alerte immédiate à envoyer (gravité 1 ou incident de sécurité) ? */
  function alerteGrave(journee) {
    var g1 = ((journee && journee.blocages) || []).filter(function (b) {
      return Number(b.gravite) === 1 && b.statut !== 'LEVE';
    });
    var secu = ((journee && journee.securite && journee.securite.incidents) || []);
    return { gravite1: g1, securite: secu, alerte: g1.length > 0 || secu.length > 0 };
  }

  /* ====================== Création de la journée suivante =============== */

  function creerJournee(chantier, precedente, date) {
    var d = date || aujourdhui();
    var index = 1;
    if (precedente) index = (Number(precedente.numero) || 0) + 1;
    var taches = [];
    if (precedente) {
      tachesNonTerminees(precedente).forEach(function (t) {
        taches.push({
          id: uid('t'),
          libelle: t.libelle,
          jalonId: t.jalonId || '',
          etat: 'PREVU',
          avancement: 0,
          heures: 0,
          motif: t.motif || '',
          origine: 'report'
        });
      });
      var prevu = (precedente.prevuDemain && precedente.prevuDemain.taches) || [];
      prevu.forEach(function (libelle) {
        if (!libelle) return;
        var doublon = taches.some(function (t) { return t.libelle === libelle; });
        if (!doublon) {
          taches.push({
            id: uid('t'), libelle: libelle, jalonId: '', etat: 'PREVU',
            avancement: 0, heures: 0, motif: '', origine: 'prevu-veille'
          });
        }
      });
    }
    return {
      id: uid('jo'),
      chantierId: chantier.id,
      numero: index,
      date: d,
      debut: '',
      fin: '',
      pauses: [],
      effectif: {
        nb: Number(precedente && precedente.effectif && precedente.effectif.nb) || Number(chantier.effectifPrevu) || 1,
        detail: (precedente && precedente.effectif && precedente.effectif.detail) || ''
      },
      conditions: '',
      taches: taches,
      actions: [],
      blocages: [],
      materiel: [],
      securite: { incidents: [], remarques: '', renseigne: false },
      essais: [],
      coactivite: [],
      formation: null,
      phase: phaseDe(chantier),
      prevuDemain: { taches: [], effectif: null, besoins: [] },
      synthese: '',
      statut: 'OUVERTE',
      version: 1,
      envoiLe: '',
      destinataires: ''
    };
  }

  /* ========================= Vérification de clôture ==================== */

  function verifierCloture(journee) {
    var manques = [];
    if (vide(journee.synthese)) manques.push({ champ: 'synthese', libelle: 'Synthèse du jour' });
    if (vide(journee.debut)) manques.push({ champ: 'debut', libelle: 'Heure d\'arrivée' });
    if (vide(journee.fin)) manques.push({ champ: 'fin', libelle: 'Heure de départ' });
    if (!journee.effectif || !Number(journee.effectif.nb)) manques.push({ champ: 'effectif', libelle: 'Effectif présent' });
    if (!journee.securite || !journee.securite.renseigne) manques.push({ champ: 'securite', libelle: 'Sécurité du jour (à renseigner, même sans incident)' });
    if (!journee.prevuDemain || !(journee.prevuDemain.taches || []).length) manques.push({ champ: 'prevuDemain', libelle: 'Prévu demain' });
    return { complete: manques.length === 0, manques: manques };
  }

  /* ==================== Responsables / destinataires ==================== */

  /* Rôles destinataires du point du soir.
     Les adresses se règlent une fois pour toutes dans ☐ → Réglages ;
     chaque chantier peut les REMPLACER au cas par cas (surcharge). */
  var ROLES_RESPONSABLES = [
    { role: 'atelier', libelle: 'Chef d\'atelier', systematique: true, copie: false },
    { role: 'beElectro', libelle: 'Responsable BE électrotechnique', systematique: true, copie: false },
    { role: 'bureauAuto', libelle: 'Chef bureau automatisme', systematique: true, copie: false },
    { role: 'chargeAffaire', libelle: 'Chargé d\'affaire', systematique: true, copie: false },
    { role: 'commercial', libelle: 'Commercial', systematique: false, copie: true, precision: 'option' },
    { role: 'direction', libelle: 'Direction technique', systematique: false, copie: false, precision: 'alertes' }
  ];

  function responsableVide() { return { nom: '', email: '' }; }

  /* Accepte l'ancien format (une simple chaîne = le nom du responsable)
     comme le format courant { nom, email }. */
  function normaliserResponsable(v) {
    if (!v) return responsableVide();
    if (typeof v === 'string') return { nom: v.trim(), email: '' };
    return { nom: String(v.nom || '').trim(), email: String(v.email || '').trim() };
  }

  /* Remet un chantier au format courant (responsables en objets) */
  function normaliserChantier(ch) {
    if (!ch) return ch;
    var base = Object.assign({}, ch);
    /* affaires créées avant les phases : on rattache la phase au type d'alors */
    base.phase = phaseDe(ch);
    var src = ch.responsables || {};
    var out = {};
    ROLES_RESPONSABLES.forEach(function (r) { out[r.role] = normaliserResponsable(src[r.role]); });
    base.responsables = out;
    return base;
  }

  /* Contrôle simple d'une adresse : assez pour repérer une coquille de saisie */
  function emailValide(adresse) {
    var a = String(adresse || '').trim();
    if (!a) return false;
    return /^[^\s@,;]+@[^\s@,;]+\.[A-Za-z]{2,}$/.test(a);
  }

  /* Pour chaque rôle : l'adresse globale, celle du chantier, et celle qui sera
     utilisée. Sert à l'écran « Diffusion du point du soir » de la fiche. */
  function heritage(chantier, reglages) {
    var R = (reglages && reglages.responsables) || {};
    var C = (chantier && chantier.responsables) || {};
    return ROLES_RESPONSABLES.map(function (r) {
      var g = normaliserResponsable(R[r.role]);
      var c = normaliserResponsable(C[r.role]);
      var email = c.email || g.email;
      var nom = c.nom || g.nom;
      return {
        role: r.role, libelle: r.libelle, copie: !!r.copie,
        systematique: !!r.systematique, precision: r.precision || '',
        nomGlobal: g.nom, emailGlobal: g.email,
        nomChantier: c.nom, emailChantier: c.email,
        nom: nom, email: email,
        modifie: !!(c.nom || c.email),
        origine: c.email ? 'chantier' : (g.email ? 'global' : 'aucun'),
        adresseValide: emailValide(email)
      };
    });
  }

  /* ============================ Destinataires =========================== */

  /* Construit la liste des destinataires du point du soir.
     reglages.responsables = { atelier: {nom,email}, beElectro: {...}, ... }   */
  function destinataires(chantier, reglages) {
    var out = [];
    heritage(chantier, reglages).forEach(function (h) {
      if (h.role === 'direction') return;                       /* ne reçoit que les alertes */
      if (h.copie && !(chantier && chantier.copieCommercial)) return;
      if (!h.email && !h.nom) return;
      out.push({
        role: h.role, libelle: h.libelle, nom: h.nom, email: h.email,
        copie: h.copie, prioritaire: false, origine: h.origine
      });
    });
    return out;
  }

  /* Comptes rendus de la journée, pour l'écran de préparation du point */
  function compteurs(journee, journeesCumul) {
    var j = journee || {};
    var materielManquant = (j.materiel || []).filter(function (m) { return m.etat === 'MANQUANT'; });
    var essaisNok = (j.essais || []).filter(function (e) { return e.resultat === 'NOK'; });
    return {
      blocages: (j.blocages || []).filter(function (b) { return b.statut !== 'LEVE'; }).length,
      blocagesGraves: (j.blocages || []).filter(function (b) { return Number(b.gravite) === 1 && b.statut !== 'LEVE'; }).length,
      manquants: materielManquant.length,
      incidents: ((j.securite && j.securite.incidents) || []).length,
      essais: (j.essais || []).length,
      essaisNok: essaisNok.length,
      actions: (j.actions || []).length,
      photos: (j.actions || []).filter(function (a) { return a.photo; }).length,
      formation: j.formation ? (j.formation.participants || []).length : 0,
      hommesHeures: hommesHeures(j),
      cumulHommesHeures: journeesCumul !== undefined ? journeesCumul : hommesHeures(j)
    };
  }

  /* ============================ Textes du mail ========================== */

  function objetMail(chantier, journee, compteursJ) {
    var alerte = compteursJ && compteursJ.blocagesGraves > 0;
    var parties = [];
    parties.push('[' + (chantier.numeroAffaire || 'sans n°') + ']');
    parties.push('Point du soir J' + journee.numero);
    parties.push(chantier.libelle + (chantier.client && chantier.client.ville ? ' — ' + chantier.client.ville : ''));
    parties.push(texteDateCourt(journee.date));
    if (journee.version > 1) parties.push('[v' + journee.version + ']');
    var t = parties.join(' · ');
    if (compteursJ && compteursJ.blocages > 0) t += '  ' + (alerte ? 'ACTION ATTENDUE SOUS 24 H' : '') +
      ' · ' + compteursJ.blocages + ' blocage' + (compteursJ.blocages > 1 ? 's' : '');
    return t;
  }

  function corpsMail(chantier, journee, chantier_avancement, ctx) {
    var c = compteurs(journee, ctx && ctx.cumul);
    var lignes = [];
    lignes.push('Bonjour,');
    lignes.push('');
    lignes.push('Point du soir du chantier ' + (chantier.numeroAffaire || '') + ' — ' + chantier.libelle +
      (chantier.client && chantier.client.nom ? ' (' + chantier.client.nom + (chantier.client.ville ? ', ' + chantier.client.ville : '') + ')' : '') + '.');
    lignes.push('Phase en cours : ' + libelle(PHASES, phaseDe(chantier)) + ' — ' + (phase(chantier).equipe || '') + '.');
    lignes.push('Journée ' + journee.numero + (chantier.dureePrevueJours ? ' sur ' + chantier.dureePrevueJours + ' prévues' : '') +
      '. Avancement global : ' + chantier_avancement + ' %' + (ctx && ctx.variation ? ' (' + (ctx.variation > 0 ? '+' : '') + ctx.variation + ' points)' : '') + '.');
    lignes.push('Effectif du jour : ' + (journee.effectif.nb || 0) + ' personne(s) — ' + texteHeuresDec(c.hommesHeures) +
      (ctx && ctx.cumul !== undefined ? ' (cumul chantier : ' + texteHeuresDec(ctx.cumul) + ')' : '') + '.');
    lignes.push('');
    lignes.push('Ce qui a avancé : ' + (journee.synthese || '—'));
    lignes.push('');

    var ouverts = (ctx && ctx.blocagesOuverts) || [];
    if (ouverts.length) {
      lignes.push('Blocages en cours (' + ouverts.length + ') :');
      ouverts.forEach(function (o) {
        var b = o.blocage;
        lignes.push(' • [' + libelle(GRAVITES, Number(b.gravite)) + (o.anciennete > 0 ? ' — ' + o.anciennete + ' jour(s)' : '') + '] ' +
          b.description + ' — attend : ' + libelle(DEBLOQUEURS, b.debloqueur) + (b.echeance ? ', ' + b.echeance : ''));
      });
    } else {
      lignes.push('Aucun blocage en cours.');
    }

    var manquants = (journee.materiel || []).filter(function (m) { return m.etat === 'MANQUANT'; });
    if (manquants.length) {
      lignes.push('');
      lignes.push('Matériel manquant (' + manquants.length + ') : ' + manquants.map(function (m) {
        return (m.designation || m.reference) + (m.besoinLe ? ' — besoin le ' + texteDateCourt(m.besoinLe) : '');
      }).join(' · '));
    }

    lignes.push('');
    lignes.push('Sécurité : ' + (c.incidents ? c.incidents + ' incident(s) à signaler — voir le point joint'
      : 'aucun incident signalé.'));
    if (journee.formation) {
      lignes.push('Formation du jour : ' + (journee.formation.intitule || 'session') + ' — ' +
        (journee.formation.participants || []).length + ' participant(s), ' + (journee.formation.dureeH || 0) + ' h.');
    }
    var prevu = (journee.prevuDemain && journee.prevuDemain.taches) || [];
    if (prevu.length) lignes.push('Prévu demain : ' + prevu.join(' · '));
    var besoins = (journee.prevuDemain && journee.prevuDemain.besoins) || [];
    if (besoins.length) {
      lignes.push('');
      lignes.push('Besoins / demandes :');
      besoins.forEach(function (b) { lignes.push(' • ' + b); });
    }
    lignes.push('');
    lignes.push('Point du soir complet en pièce jointe.');
    var signataire = (ctx && ctx.signataire) || '';
    lignes.push(signataire || 'Cordialement');
    return lignes.join('\n');
  }

  function nomFichierPoint(chantier, journee, suffixe) {
    var base = 'Point-soir_' + (chantier.numeroAffaire || 'chantier') + '_J' + journee.numero + '_' + String(journee.date).slice(0, 10);
    if (journee.version > 1) base += '_v' + journee.version;
    return base + (suffixe || '') + '.pdf';
  }

  /* =============================== Alertes ============================== */

  /* Message d'alerte à afficher à l'ouverture, selon l'état de la veille */
  function rappelDuJour(chantiers, journeesDuJour, dateRef) {
    var today = dateRef || aujourdhui();
    var out = [];
    (chantiers || []).forEach(function (ch) {
      if (ch.statut !== 'EN_COURS') return;
      var js = (journeesDuJour || []).filter(function (j) { return j.chantierId === ch.id; });
      var nonCloturee = js.filter(function (j) { return j.statut !== 'CLOTUREE'; });
      if (js.length && nonCloturee.length) {
        out.push({
          type: 'CLOTURE',
          chantier: ch,
          journee: nonCloturee[0],
          message: 'La journée du ' + texteDateCourt(nonCloturee[0].date) + ' n\'est pas clôturée'
        });
      }
    });
    return out;
  }

  /* ============================== Export ================================ */

  var Api = {
    /* référentiels */
    PHASES: PHASES, phaseDe: phaseDe, phase: phase, phaseJournee: phaseJournee, suitePhase: suitePhase,
    phaseValide: phaseValide, phaseDepuisType: phaseDepuisType,
    STATUTS: STATUTS, ACTIVITES: ACTIVITES, CATEGORIES: CATEGORIES,
    GRAVITES: GRAVITES, DEBLOQUEURS: DEBLOQUEURS, ETATS_TACHE: ETATS_TACHE,
    ETATS_MATERIEL: ETATS_MATERIEL, RESULTATS_ESSAI: RESULTATS_ESSAI, ACQUIS: ACQUIS,
    TYPES_FORMATION: TYPES_FORMATION, JALONS_DEFAUT: JALONS_DEFAUT, MODELES: MODELES,
    CATALOGUE_ESSAIS: CATALOGUE_ESSAIS, CATALOGUE_TACHES: CATALOGUE_TACHES,
    CATALOGUE_TACHES_PHASE: CATALOGUE_TACHES_PHASE, tachesPhase: tachesPhase,
    /* utilitaires */
    parId: parId, libelle: libelle, icone: icone, uid: uid, vide: vide,
    minutes: minutes, texteHeures: texteHeures, texteHeuresDec: texteHeuresDec,
    texteDate: texteDate, texteDateCourt: texteDateCourt, aujourdhui: aujourdhui,
    maintenant: maintenant, joursEntre: joursEntre,
    /* chantier */
    nouveauChantier: nouveauChantier, jalonsNeufs: jalonsNeufs,
    avancementChantier: avancementChantier, jalonsEnCours: jalonsEnCours,
    appliquerAvancement: appliquerAvancement,
    /* journée */
    dureeJourneeMn: dureeJourneeMn, hommesHeures: hommesHeures,
    cumulHommesHeures: cumulHommesHeures, cumulMinutesSurSite: cumulMinutesSurSite,
    tachesNonTerminees: tachesNonTerminees, blocagesOuverts: blocagesOuverts,
    blocagesDuJour: blocagesDuJour, alerteGrave: alerteGrave, creerJournee: creerJournee,
    verifierCloture: verifierCloture, compteurs: compteurs, rappelDuJour: rappelDuJour,
    /* diffusion */
    ROLES_RESPONSABLES: ROLES_RESPONSABLES,
    responsableVide: responsableVide, normaliserResponsable: normaliserResponsable,
    normaliserChantier: normaliserChantier, emailValide: emailValide, heritage: heritage,
    destinataires: destinataires, objetMail: objetMail, corpsMail: corpsMail,
    nomFichierPoint: nomFichierPoint
  };

  global.Modele = Api;
  if (typeof module !== 'undefined' && module.exports) module.exports = Api;
})(typeof window !== 'undefined' ? window : globalThis);

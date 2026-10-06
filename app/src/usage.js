/* =========================================================================
   BFR-CHANTIER — MÉMOIRE D'USAGE
   -------------------------------------------------------------------------
   L'application retient, POUR CHAQUE UTILISATEUR de l'application, les
   valeurs qu'il saisit le plus souvent (essais et contrôles, tâches,
   matériel, entreprises sur site, intitulés de formation).

   Au fil des chantiers, ces valeurs remontent en tête des listes déroulantes
   et sous forme de raccourcis : deux appuis au lieu de dix.

   Le compteur est conservé dans le téléphone (localStorage), séparé pour
   chaque utilisateur — il suit donc la personne, pas seulement l'appareil.
   ========================================================================= */
(function (global) {
  'use strict';

  var CLE = 'chantier.usage.v1';
  var LIMITE_PAR_TYPE = 80;      /* nombre d'entrées conservées par type */

  /* Types de saisie mémorisés et leur libellé lisible */
  var LIBELLES = {
    'essai.libelle': 'Essais et contrôles',
    'tache.libelle': 'Tâches',
    'materiel.designation': 'Matériel et pièces',
    'coactivite.entreprise': 'Entreprises présentes sur site',
    'formation.intitule': 'Intitulés de formation',
    'blocage.description': 'Blocages déjà rencontrés'
  };

  function normaliser(v) {
    return String(v === undefined || v === null ? '' : v).replace(/\s+/g, ' ').trim();
  }
  function clefValeur(v) { return normaliser(v).toLowerCase(); }

  /* Utilisateur courant : « Prénom Nom » réglé dans ☰ → Réglages */
  function utilisateurCourant() {
    try {
      var A = global.App;
      var u = (A && A.etat && A.etat.reglages && A.etat.reglages.utilisateur) || {};
      var nom = [u.prenom, u.nom].filter(Boolean).join(' ').trim();
      return nom || '(sans nom)';
    } catch (e) {
      return '(sans nom)';
    }
  }

  function lireTout() {
    try {
      var brut = global.localStorage.getItem(CLE);
      var o = brut ? JSON.parse(brut) : {};
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }

  function ecrireTout(o) {
    try { global.localStorage.setItem(CLE, JSON.stringify(o)); return true; }
    catch (e) { return false; }
  }

  /* --------------------------- Enregistrement --------------------------- */

  function enregistrer(type, valeur, utilisateur) {
    var v = normaliser(valeur);
    if (!type || !v) return false;
    var tout = lireTout();
    var u = utilisateur || utilisateurCourant();
    tout[u] = tout[u] || {};
    tout[u][type] = tout[u][type] || {};
    var k = clefValeur(v);
    var e = tout[u][type][k] || { n: 0 };
    e.n = (Number(e.n) || 0) + 1;
    e.forme = v;                                  /* dernière forme écrite */
    e.le = new Date().toISOString();

    /* plafond : on garde les plus utilisés */
    var fausses = Object.keys(tout[u][type]).filter(function (x) { return x !== k; });
    if (fausses.length + 1 > LIMITE_PAR_TYPE) {
      fausses.sort(function (a, b) {
        return (Number(tout[u][type][b].n) || 0) - (Number(tout[u][type][a].n) || 0);
      });
      fausses.slice(LIMITE_PAR_TYPE - 1).forEach(function (c) { delete tout[u][type][c]; });
    }
    tout[u][type][k] = e;
    return ecrireTout(tout);
  }

  /* Valeurs les plus utilisées par un utilisateur, les plus fréquentes d'abord */
  function populaires(type, limite, utilisateur) {
    var tout = lireTout();
    var u = utilisateur || utilisateurCourant();
    var t = (tout[u] && tout[u][type]) || {};
    return Object.keys(t).map(function (k) {
      return { valeur: t[k].forme || k, n: Number(t[k].n) || 0, le: t[k].le || '' };
    }).sort(function (a, b) {
      if (b.n !== a.n) return b.n - a.n;
      return a.le < b.le ? 1 : -1;              /* à fréquence égale : le plus récent */
    }).slice(0, limite || 8);
  }

  function nbUtilisations(type, valeur, utilisateur) {
    var tout = lireTout();
    var u = utilisateur || utilisateurCourant();
    var t = (tout[u] && tout[u][type]) || {};
    var e = t[clefValeur(valeur)];
    return e ? Number(e.n) || 0 : 0;
  }

  /* Liste à proposer : d'abord ce que l'utilisateur a l'habitude de saisir,
     puis le catalogue de référence (sans doublon). */
  function fusionner(type, catalogue, limite) {
    var vus = {};
    var out = [];
    populaires(type, limite || 8).forEach(function (p) {
      var k = clefValeur(p.valeur);
      if (vus[k]) return;
      vus[k] = 1;
      out.push(p.valeur);
    });
    (catalogue || []).forEach(function (v) {
      var v2 = normaliser(v);
      var k = clefValeur(v2);
      if (!v2 || vus[k]) return;
      vus[k] = 1;
      out.push(v2);
    });
    return out;
  }

  /* ------------------------------- Gestion ------------------------------ */

  function tout(utilisateur) {
    var t = lireTout();
    var u = utilisateur || utilisateurCourant();
    return (t[u] || {});
  }

  function resume(utilisateur) {
    var t = tout(utilisateur);
    return Object.keys(LIBELLES).map(function (type) {
      var entrees = populaires(type, 3, utilisateur);
      var total = Object.keys(t[type] || {}).length;
      return { type: type, libelle: LIBELLES[type], total: total, principaux: entrees };
    }).filter(function (r) { return r.total > 0; });
  }

  function reinitialiser(type, utilisateur) {
    var t = lireTout();
    var u = utilisateur || utilisateurCourant();
    if (!t[u]) return true;
    if (type) delete t[u][type];
    else delete t[u];
    return ecrireTout(t);
  }

  function exporter() { return lireTout(); }

  function importer(donnees) {
    if (!donnees || typeof donnees !== 'object') return false;
    var t = lireTout();
    Object.keys(donnees).forEach(function (u) { t[u] = donnees[u]; });
    return ecrireTout(t);
  }

  global.Usage = {
    LIBELLES: LIBELLES,
    utilisateurCourant: utilisateurCourant,
    enregistrer: enregistrer,
    populaires: populaires,
    nbUtilisations: nbUtilisations,
    fusionner: fusionner,
    tout: tout,
    resume: resume,
    reinitialiser: reinitialiser,
    exporter: exporter,
    importer: importer
  };
})(typeof window !== 'undefined' ? window : globalThis);

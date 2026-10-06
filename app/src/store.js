/* =========================================================================
   BFR-CHANTIER — STOCKAGE
   -------------------------------------------------------------------------
   IndexedDB (chantiers, journées, sessions, photos) + localStorage (réglages).
   Base « bfr_chantier_v1 » : distincte de « bfr_sav_v3 » (BFR-Report) — les
   deux applications cohabitent sur le même téléphone sans se gêner.
   Aucune donnée ne quitte l'appareil.
   ========================================================================= */
(function (global) {
  'use strict';

  var DB_NAME = 'bfr_chantier_v1';
  var DB_VERSION = 1;
  var ST_CHANTIERS = 'chantiers';
  var ST_JOURNEES = 'journees';
  var ST_SESSIONS = 'sessions';
  var ST_PHOTOS = 'photos';

  var _db = null;
  /* Repli sans IndexedDB (aperçu en cadre restreint, navigation privée,
     navigateur ancien) : l'application reste utilisable, les données ne sont
     que temporaires. Un message le signale à l'utilisateur. */
  var _memoire = {
    chantiers: {}, journees: {}, sessions: {}, photos: {}
  };
  var _modeMemoire = false;

  function modeMemoire() { return _modeMemoire; }

  function clef(store) {
    if (store === ST_CHANTIERS) return 'chantiers';
    if (store === ST_JOURNEES) return 'journees';
    if (store === ST_SESSIONS) return 'sessions';
    return 'photos';
  }

  function ouvrirDB() {
    if (_modeMemoire) return Promise.reject(new Error('mode mémoire'));
    if (_db) return Promise.resolve(_db);
    if (!global.indexedDB) { _modeMemoire = true; return Promise.reject(new Error('IndexedDB indisponible')); }
    return new Promise(function (resolve, reject) {
      var req;
      try {
        req = global.indexedDB.open(DB_NAME, DB_VERSION);
      } catch (e) {
        _modeMemoire = true;
        reject(e);
        return;
      }
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(ST_CHANTIERS)) db.createObjectStore(ST_CHANTIERS, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(ST_JOURNEES)) {
          var s = db.createObjectStore(ST_JOURNEES, { keyPath: 'id' });
          s.createIndex('chantierId', 'chantierId', { unique: false });
        }
        if (!db.objectStoreNames.contains(ST_SESSIONS)) {
          var s2 = db.createObjectStore(ST_SESSIONS, { keyPath: 'id' });
          s2.createIndex('chantierId', 'chantierId', { unique: false });
        }
        if (!db.objectStoreNames.contains(ST_PHOTOS)) db.createObjectStore(ST_PHOTOS, { keyPath: 'id' });
      };
      req.onsuccess = function (e) { _db = e.target.result; resolve(_db); };
      req.onerror = function () { _modeMemoire = true; reject(req.error); };
      req.onblocked = function () { _modeMemoire = true; reject(new Error('base verrouillée')); };
    });
  }

  function tr(db, store, mode) { return db.transaction(store, mode || 'readonly').objectStore(store); }

  /* Chaque opération se replie sur la mémoire si IndexedDB est indisponible :
     l'application reste utilisable (les données ne sont alors que temporaires). */
  function ecrire(store, objet) {
    return ouvrirDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = tr(db, store, 'readwrite').put(objet);
        req.onsuccess = function () { resolve(objet); };
        req.onerror = function () { reject(req.error); };
      });
    }, function () {
      _memoire[clef(store)][objet.id] = JSON.parse(JSON.stringify(objet));
      return objet;
    });
  }

  function lire(store, id) {
    return ouvrirDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = tr(db, store).get(id);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    }, function () {
      return _memoire[clef(store)][id] || null;
    });
  }

  function tous(store) {
    return ouvrirDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = tr(db, store).getAll();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror = function () { reject(req.error); };
      });
    }, function () {
      var m = _memoire[clef(store)];
      return Object.keys(m).map(function (k) { return m[k]; });
    });
  }

  function parIndex(store, index, valeur) {
    return ouvrirDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = tr(db, store).index(index).getAll(valeur);
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror = function () { reject(req.error); };
      });
    }, function () {
      return tous(store).then(function (liste) {
        return liste.filter(function (o) { return o[index] === valeur; });
      });
    });
  }

  function supprimer(store, id) {
    return ouvrirDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = tr(db, store, 'readwrite').delete(id);
        req.onsuccess = function () { resolve(true); };
        req.onerror = function () { reject(req.error); };
      });
    }, function () {
      delete _memoire[clef(store)][id];
      return true;
    });
  }

  function vider(store) {
    return ouvrirDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = tr(db, store, 'readwrite').clear();
        req.onsuccess = function () { resolve(true); };
        req.onerror = function () { reject(req.error); };
      });
    }, function () {
      _memoire[clef(store)] = {};
      return true;
    });
  }

  /* ---------------------- Photos : stockage en base -------------------- */

  function sauverPhoto(dataUrl) {
    var id = 'ph-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    return ecrire(ST_PHOTOS, { id: id, dataUrl: dataUrl, le: new Date().toISOString() })
      .then(function () { return id; });
  }

  function lirePhoto(id) {
    if (!id) return Promise.resolve('');
    return lire(ST_PHOTOS, id).then(function (p) { return p ? p.dataUrl : ''; });
  }

  /* ------------------------------ Réglages ---------------------------- */

  var CLE_REGLAGES = 'chantier.reglages';

  var REGLAGES_DEFAUT = {
    societe: {
      nom: 'BFR SYSTEMS',
      adresse: '',
      cpVille: '01150 BLYES',
      tel: '',
      email: '',
      siteWeb: '',
      lieuLettre: 'Blyes',
      logo: ''
    },
    /* Le chef de chantier : seul utilisateur de l'application */
    utilisateur: { prenom: '', nom: '', tel: '', email: '', fonction: 'Chef de chantier', signature: '' },
    /* Destinataires du point du soir (nom + adresse e-mail de chacun) */
    responsables: {
      atelier: { nom: '', email: '' },
      beElectro: { nom: '', email: '' },
      bureauAuto: { nom: '', email: '' },
      chargeAffaire: { nom: '', email: '' },
      commercial: { nom: '', email: '' },
      direction: { nom: '', email: '' }
    },
    mail: {
      objet: '',                 // vide = objet calculé automatiquement
      messagePartage: 'Bonjour, veuillez trouver ci-joint le point du soir du chantier {{numeroAffaire}} ({{chantier}}) — journée {{jour}} du {{date}}. Cordialement.',
      copieCommercialDefaut: false,
      signatureTexte: ''
    },
    rappel: { heure: '16:45', heure2: '18:30', actif: false },
    listes: {
      clients: [],               // liste clients importée (CSV)
      equipements: []            // désignations d'équipements connues
    },
    divers: { afficherEffectifDetail: true }
  };

  function fusion(base, modif) {
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    if (!modif || typeof modif !== 'object') return out;
    Object.keys(modif).forEach(function (k) {
      if (modif[k] && typeof modif[k] === 'object' && !Array.isArray(modif[k]) &&
          base && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        out[k] = fusion(base[k], modif[k]);
      } else if (modif[k] !== undefined) {
        out[k] = modif[k];
      }
    });
    return out;
  }

  function lireReglages() {
    var brut = null;
    try { brut = JSON.parse(global.localStorage.getItem(CLE_REGLAGES) || 'null'); } catch (e) { brut = null; }
    return fusion(REGLAGES_DEFAUT, brut || {});
  }

  function ecrireReglages(r) {
    try { global.localStorage.setItem(CLE_REGLAGES, JSON.stringify(r)); } catch (e) { /* quota */ }
    return r;
  }

  /* --------------------- Sauvegarde / restauration -------------------- */

  function exporterTout() {
    return Promise.all([tous(ST_CHANTIERS), tous(ST_JOURNEES), tous(ST_SESSIONS), tous(ST_PHOTOS)])
      .then(function (r) {
        return {
          application: 'BFR-Chantier',
          version: 1,
          exporteLe: new Date().toISOString(),
          reglages: lireReglages(),
          chantiers: r[0], journees: r[1], sessions: r[2], photos: r[3]
        };
      });
  }

  function importerTout(sauvegarde, options) {
    var opt = options || {};
    if (!sauvegarde || sauvegarde.application !== 'BFR-Chantier') {
      return Promise.reject(new Error('Fichier de sauvegarde BFR-Chantier non reconnu'));
    }
    var etapes = [];
    if (opt.remplacer) {
      etapes.push(vider(ST_CHANTIERS), vider(ST_JOURNEES), vider(ST_SESSIONS), vider(ST_PHOTOS));
    }
    return Promise.all(etapes).then(function () {
      var ecritures = [];
      (sauvegarde.chantiers || []).forEach(function (o) { ecritures.push(ecrire(ST_CHANTIERS, o)); });
      (sauvegarde.journees || []).forEach(function (o) { ecritures.push(ecrire(ST_JOURNEES, o)); });
      (sauvegarde.sessions || []).forEach(function (o) { ecritures.push(ecrire(ST_SESSIONS, o)); });
      (sauvegarde.photos || []).forEach(function (o) { ecritures.push(ecrire(ST_PHOTOS, o)); });
      return Promise.all(ecritures);
    }).then(function () {
      if (sauvegarde.reglages) ecrireReglages(fusion(REGLAGES_DEFAUT, sauvegarde.reglages));
      return true;
    });
  }

  global.Store = {
    ST_CHANTIERS: ST_CHANTIERS, ST_JOURNEES: ST_JOURNEES, ST_SESSIONS: ST_SESSIONS, ST_PHOTOS: ST_PHOTOS,
    ouvrirDB: ouvrirDB, ecrire: ecrire, lire: lire, tous: tous, parIndex: parIndex,
    supprimer: supprimer, vider: vider,
    sauverPhoto: sauverPhoto, lirePhoto: lirePhoto, modeMemoire: modeMemoire,
    REGLAGES_DEFAUT: REGLAGES_DEFAUT, lireReglages: lireReglages, ecrireReglages: ecrireReglages,
    exporterTout: exporterTout, importerTout: importerTout
  };
})(typeof window !== 'undefined' ? window : globalThis);

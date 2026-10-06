/* =========================================================================
   BFR-CHANTIER — APPLICATION
   -------------------------------------------------------------------------
   État, navigation, actions, saisie et enregistrement.
   Une seule utilisatrice ou utilisateur : le chef de chantier.
   ========================================================================= */
(function (global) {
  'use strict';

  /* jeu d'icônes vectorielles BFR — aucun émoji dans l'interface */
  function I(nom, taille, cls) { return (global.ICO && global.ICO.i(nom, taille, cls)) || ''; }

  var M = global.Modele, Store = global.Store, U = global.UI, E = global.Ecrans, PS = global.PointSoir;

  var etat = {
    reglages: null,
    chantiers: [], journees: [], sessions: [],
    vue: { ecran: 'accueil', chantierId: null, journeeId: null, onglet: 'synthese' },
    nouveau: {},
    photosCache: {},
    sauveEnCours: null
  };

  /* =============================== Utilitaires ========================= */

  function setPath(obj, chemin, valeur) {
    var parts = String(chemin).split('.');
    var cible = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (typeof cible[parts[i]] !== 'object' || cible[parts[i]] === null) cible[parts[i]] = {};
      cible = cible[parts[i]];
    }
    cible[parts[parts.length - 1]] = valeur;
  }

  function getPath(obj, chemin) {
    return String(chemin).split('.').reduce(function (o, p) {
      return (o === undefined || o === null) ? undefined : o[p];
    }, obj);
  }

  function trierJournees(a, b) { return (Number(a.numero) || 0) - (Number(b.numero) || 0); }

  var minuteur = null;
  function planifierSauvegarde(fn) {
    clearTimeout(minuteur);
    minuteur = setTimeout(fn, 400);
  }

  /* ============================ Accès aux données ====================== */

  function chantier(id) {
    for (var i = 0; i < etat.chantiers.length; i++) if (etat.chantiers[i].id === id) return etat.chantiers[i];
    return null;
  }
  function journee(id) {
    for (var i = 0; i < etat.journees.length; i++) if (etat.journees[i].id === id) return etat.journees[i];
    return null;
  }
  function session(id) {
    for (var i = 0; i < etat.sessions.length; i++) if (etat.sessions[i].id === id) return etat.sessions[i];
    return null;
  }
  function journeesDe(chantierId) {
    return etat.journees.filter(function (j) { return j.chantierId === chantierId; }).sort(trierJournees);
  }
  function journeeOuverteDe(chantierId) {
    var js = journeesDe(chantierId);
    for (var i = js.length - 1; i >= 0; i--) if (js[i].statut !== 'CLOTUREE') return js[i];
    return null;
  }
  function chantierCourant() { return chantier(etat.vue.chantierId); }
  function journeeCourante() { return journee(etat.vue.journeeId) || journeeOuverteDe(etat.vue.chantierId); }
  function cumulHeures(chantierId) { return M.cumulHommesHeures(journeesDe(chantierId)); }
  function avancementDe(ch) { return M.avancementChantier(ch); }
  function joursEcoules(ch) {
    var js = journeesDe(ch.id);
    return js.length ? (js[js.length - 1].numero) : 0;
  }
  function libelleJalon(ch, id) {
    var j = M.parId(ch.jalons || [], id);
    return j ? j.libelle : '';
  }
  /* Variation d'avancement entre la veille et le jour courant (recalculée
     à partir des points d'avancement saisis dans la journée) */
  function variationVeille(ch) {
    var js = journeesDe(ch.id);
    if (!js.length) return null;
    var j = js[js.length - 1];
    var pts = (j.taches || []).reduce(function (t, x) { return t + (Number(x.avancement) || 0); }, 0);
    return pts || null;
  }

  function contextePoint(j) {
    var ch = chantier(j.chantierId);
    var js = journeesDe(ch.id);
    return {
      chantier: ch,
      journee: j,
      journees: js,
      reglages: etat.reglages,
      avancement: M.avancementChantier(ch),
      variation: variationVeille(ch),
      cumul: M.cumulHommesHeures(js),
      blocagesOuverts: M.blocagesOuverts(js, j.date).filter(function (o) { return o.blocage.statut !== 'LEVE'; }),
      destinataires: M.destinataires(ch, etat.reglages),
      photos: (j.actions || []).filter(function (a) { return a.photo && etat.photosCache[a.photo]; })
        .map(function (a) { return { dataUrl: etat.photosCache[a.photo], legende: a.texte || '' }; }),
      session: j.formationId ? session(j.formationId) : null,
      auteur: nomUtilisateur()
    };
  }

  function nomUtilisateur() {
    var u = etat.reglages.utilisateur || {};
    return [u.prenom, u.nom].filter(Boolean).join(' ');
  }

  /* ============================ Sauvegarde base ======================== */

  function sauverChantier(ch) {
    ch.updatedAt = new Date().toISOString();
    return Store.ecrire(Store.ST_CHANTIERS, ch);
  }
  function sauverJournee(j) { return Store.ecrire(Store.ST_JOURNEES, j); }
  function sauverSession(s) { return Store.ecrire(Store.ST_SESSIONS, s); }
  function sauverReglages() { Store.ecrireReglages(etat.reglages); }

  /* ============================== Navigation =========================== */

  function aller(ecran, options) {
    var o = options || {};
    etat.vue.ecran = ecran;
    if (o.chantierId !== undefined) etat.vue.chantierId = o.chantierId;
    if (o.journeeId !== undefined) etat.vue.journeeId = o.journeeId;
    if (o.onglet !== undefined) etat.vue.onglet = o.onglet;
    rendre();
    global.scrollTo(0, 0);
  }

  function rendre() {
    var html;
    switch (etat.vue.ecran) {
      case 'nouveau': html = E.nouveauChantier(); break;
      case 'fiche': html = E.fiche(); break;
      case 'journee': html = E.journee(); break;
      case 'point': html = E.pointSoir(); break;
      case 'reglages': html = E.reglages(); break;
      default: html = E.accueil();
    }
    document.getElementById('app').innerHTML = html;
    if (etat.vue.ecran === 'point') dessinerApercu();
    if (etat.vue.ecran === 'reglages') afficherVersion();
    majBoutonRetour();
  }

  function afficherVersion() {
    var z = document.getElementById('versionApp');
    if (z) z.textContent = (global.CHANTIER_VERSION || 'développement') + (global.CHANTIER_DATE ? ' · ' + global.CHANTIER_DATE : '');
  }

  function majBoutonRetour() { /* réservé : gestion du bouton retour matériel */ }

  /* ============================ Aperçu du PDF ========================== */

  function dessinerApercu() {
    var zone = document.getElementById('apercuPoint');
    if (!zone) return;
    var j = journeeCourante();
    if (!j) return;
    chargerPhotos(j).then(function () {
      var doc = PS.apercu(contextePoint(j));
      /* garde-fou : si une photo ne se charge pas, l'aperçu ne doit pas
         rester bloqué — on rend la main au bout de 6 secondes. */
      return Promise.race([
        global.Pdf.rendrePages(doc, { echelle: 1.35 }),
        new Promise(function (_, rejeter) {
          setTimeout(function () { rejeter(new Error('chargement des images trop long')); }, 6000);
        })
      ]);
    }).then(function (pages) {
      if (!pages) return;
      zone.innerHTML = '';
      pages.forEach(function (c) { zone.appendChild(c); });
    }).catch(function (e) {
      zone.innerHTML = '<div class="petit rouge">Aperçu indisponible : ' + U.esc(e && e.message ? e.message : 'erreur') + '</div>';
    });
  }

  /* Charge en mémoire les photos d'une journée (stockées dans IndexedDB) */
  function chargerPhotos(j) {
    var ids = (j.actions || []).filter(function (a) { return a.photo; }).map(function (a) { return a.photo; });
    var manquants = ids.filter(function (id) { return !etat.photosCache[id]; });
    if (!manquants.length) return Promise.resolve();
    return Promise.all(manquants.map(function (id) {
      return Store.lirePhoto(id).then(function (d) { if (d) etat.photosCache[id] = d; });
    }));
  }

  /* ============================== Feuilles ============================= */

  function feuilleTexte(titre, libelle, valeur, surValider, multiligne) {
    U.feuille({
      titre: titre,
      contenu: U.blocSaisie({ id: 'ftTexte', libelle: libelle, valeur: valeur, lignes: multiligne, dictee: true, rangees: 3 }),
      boutons: [
        { libelle: 'Annuler', classe: 's' },
        {
          libelle: 'Valider', classe: 'p', action: function (ov, fermer) {
            var v = (document.getElementById('ftTexte').value || '').trim();
            fermer();
            if (v) surValider(v);
          }
        }
      ]
    });
  }

  function feuilleMenu() {
    var lignes = [
      ['accueil', 'accueil', 'Accueil'],
      ['nouveau', 'plusCercle', 'Nouveau chantier'],
      ['reglages', 'reglages', 'Réglages et destinataires'],
      ['mode-emploi', 'modeEmploi', 'Mode d\'emploi'],
      ['exporter', 'telecharger', 'Exporter la sauvegarde']
    ];
    U.feuille({
      titre: 'BFR Chantier',
      contenu: lignes.map(function (l) {
        return '<button type="button" class="jalon-ligne" data-a="' + l[0] + '"><span class="jalon-ic">' + I(l[1], 18) + '</span>' +
          '<span class="jalon-lib">' + U.esc(l[2]) + '</span>' + I('suivant', 16, 'chev-ico') + '</button>';
      }).join('') +
        '<div class="mini" style="margin-top:10px">Chantiers : ' + etat.chantiers.length + ' · Journées : ' + etat.journees.length +
        ' · Version ' + U.esc(global.CHANTIER_VERSION || 'dev') + '</div>'
    });
    var ov = U.feuille.derniere;
    if (ov) ov.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'accueil' || a === 'nouveau' || a === 'reglages') {
        ov.classList.remove('visible');
        setTimeout(function () { ov.remove(); document.body.classList.remove('sans-defilement'); }, 150);
      }
    });
  }

  /* ------------------------------- blocages ---------------------------- */

  function feuilleBlocage(j, id) {
    var b = id ? (j.blocages || []).filter(function (x) { return x.id === id; })[0] : null;
    var neuf = !b;
    b = b || { gravite: 2, statut: 'OUVERT', debloqueur: 'ATELIER', ouvertLe: M.aujourdhui() };
    var contenu =
      U.blocSaisie({ id: 'blDesc', libelle: 'Ce qui bloque', valeur: b.description, lignes: true, rangees: 2, dictee: true, placeholder: 'Presse hydraulique hors service depuis lundi' }) +
      '<label class="champ"><span class="champ-titre">Gravité</span><select id="blGrav">' +
      M.GRAVITES.map(function (g) { return '<option value="' + g.id + '"' + (Number(b.gravite) === g.id ? ' selected' : '') + '>' + U.esc(g.libelle) + '</option>'; }).join('') +
      '</select></label>' +
      '<label class="champ"><span class="champ-titre">Qui peut débloquer</span><select id="blDeb">' +
      M.DEBLOQUEURS.map(function (d) { return '<option value="' + d.id + '"' + (b.debloqueur === d.id ? ' selected' : '') + '>' + U.esc(d.libelle) + '</option>'; }).join('') +
      '</select></label>' +
      '<div class="duo">' +
      U.blocSaisie({ id: 'blImpact', libelle: 'Impact planning (jours)', valeur: b.impactJours, type: 'number', min: 0 }) +
      U.blocSaisie({ id: 'blEcheance', libelle: 'Pour quand', valeur: b.echeance, placeholder: 'sous 24 h' }) +
      '</div>' +
      U.blocSaisie({ id: 'blAction', libelle: 'Action attendue', valeur: b.action, placeholder: 'Décision, réparation, fourniture…' });

    var boutons = [{ libelle: 'Annuler', classe: 's' }];
    if (!neuf) {
      boutons.push({
        libelle: 'Lever le blocage', classe: 'v', action: function (ov, fermer) {
          b.statut = 'LEVE'; b.leveLe = M.aujourdhui();
          fermer(); sauverJournee(j); rendre(); U.toast('Blocage levé', 'ok');
        }
      });
    }
    boutons.push({
      libelle: 'Enregistrer', classe: 'p', action: function (ov, fermer) {
        var desc = (document.getElementById('blDesc').value || '').trim();
        if (!desc) { U.toast('Décrivez ce qui bloque'); return; }
        b.description = desc;
        b.gravite = Number(document.getElementById('blGrav').value);
        b.debloqueur = document.getElementById('blDeb').value;
        b.impactJours = Number(document.getElementById('blImpact').value) || 0;
        b.echeance = (document.getElementById('blEcheance').value || '').trim();
        b.action = (document.getElementById('blAction').value || '').trim();
        if (neuf) {
          b.id = M.uid('bl');
          b.statut = 'OUVERT';
          b.ouvertLe = j.date;
          (j.blocages = j.blocages || []).push(b);
        }
        fermer(); sauverJournee(j); rendre();
        U.toast(neuf ? 'Blocage enregistré' : 'Blocage modifié', 'ok');
        if (Number(b.gravite) === 1) {
          U.feuille({
            titre: 'Blocage de gravité 1',
            contenu: '<p class="texte">Ce blocage est prioritaire : il figurera en tête du point du soir avec la mention « ACTION ATTENDUE SOUS 24 H », et la direction technique sera mise en copie.</p>' +
              '<p class="mini">Pensez à prévenir par téléphone si l\'équipe est à l\'arrêt.</p>',
            boutons: [{ libelle: 'Compris', classe: 'p' }]
          });
        }
      }
    });

    U.feuille({ titre: neuf ? 'Nouveau blocage' : 'Blocage', contenu: contenu, boutons: boutons });
  }

  /* ------------------------------- matériel --------------------------- */

  function feuilleMateriel(j, id) {
    var m = id ? (j.materiel || []).filter(function (x) { return x.id === id; })[0] : null;
    var neuf = !m;
    m = m || { etat: 'MANQUANT' };
    var contenu =
      '<label class="champ"><span class="champ-titre">État</span><select id="mtEtat">' +
      M.ETATS_MATERIEL.map(function (e) { return '<option value="' + e.id + '"' + (m.etat === e.id ? ' selected' : '') + '>' + U.esc(e.libelle) + '</option>'; }).join('') +
      '</select></label>' +
      '<div class="duo">' +
      U.blocSaisie({ id: 'mtRef', libelle: 'Référence', valeur: m.reference }) +
      U.blocSaisie({ id: 'mtQte', libelle: 'Quantité', valeur: m.qte, type: 'number', min: 0 }) +
      '</div>' +
      U.blocSaisie({
        id: 'mtDes', libelle: 'Désignation', valeur: m.designation,
        placeholder: 'Variateur 15 kW — 400 V',
        suggestions: 'materiel.designation', catalogue: []
      }) +
      U.blocSaisie({ id: 'mtBesoin', libelle: 'Besoin le', valeur: m.besoinLe, type: 'date' });
    var boutons = [{ libelle: 'Annuler', classe: 's' }];
    if (!neuf) boutons.push({
      libelle: 'Supprimer', classe: 's danger', action: function (ov, fermer) {
        j.materiel = (j.materiel || []).filter(function (x) { return x.id !== id; });
        fermer(); sauverJournee(j); rendre();
      }
    });
    boutons.push({
      libelle: 'Enregistrer', classe: 'p', action: function (ov, fermer) {
        m.etat = document.getElementById('mtEtat').value;
        m.reference = (document.getElementById('mtRef').value || '').trim();
        m.qte = Number(document.getElementById('mtQte').value) || 0;
        m.designation = (document.getElementById('mtDes').value || '').trim();
        m.besoinLe = document.getElementById('mtBesoin').value;
        if (!m.designation && !m.reference) { U.toast('Renseignez au moins la désignation ou la référence'); return; }
        if (m.designation) global.Usage.enregistrer('materiel.designation', m.designation);
        if (neuf) { m.id = M.uid('mt'); (j.materiel = j.materiel || []).push(m); }
        fermer(); sauverJournee(j); rendre(); U.toast('Matériel enregistré', 'ok');
      }
    });
    U.feuille({ titre: neuf ? 'Ajouter un matériel' : 'Matériel', contenu: contenu, boutons: boutons });
  }

  /* -------------------------------- essais ---------------------------- */

  function feuilleEssai(j, id, libellePredefini) {
    var e = id ? (j.essais || []).filter(function (x) { return x.id === id; })[0] : null;
    var neuf = !e;
    e = e || { resultat: 'OK', libelle: libellePredefini || '' };
    var contenu =
      U.champListe({
        id: 'esLibSel', idLibre: 'esLib',
        libelle: 'Essai ou contrôle réalisé',
        valeur: e.libelle,
        suggestions: 'essai.libelle',
        catalogue: M.CATALOGUE_ESSAIS,
        titrePopulaires: 'essais et contrôles les plus utilisés',
        titreCatalogue: 'Essais et contrôles courants',
        libelleLibre: 'Essai réalisé (saisie libre)',
        dictee: true,
        placeholder: 'Décrivez l\'essai réalisé'
      }) +
      '<label class="champ"><span class="champ-titre">Résultat</span><select id="esRes">' +
      M.RESULTATS_ESSAI.map(function (r) { return '<option value="' + r.id + '"' + (e.resultat === r.id ? ' selected' : '') + '>' + U.esc(r.libelle) + '</option>'; }).join('') +
      '</select></label>' +
      U.blocSaisie({ id: 'esMes', libelle: 'Mesures / observations', valeur: e.mesures, lignes: true, rangees: 2 }) +
      '<label class="case-ligne"><input type="checkbox" id="esCv"' + (e.contreVisite ? ' checked' : '') + '><span>Contre-visite nécessaire</span></label>';
    var boutons = [{ libelle: 'Annuler', classe: 's' }];
    if (!neuf) boutons.push({
      libelle: 'Supprimer', classe: 's danger', action: function (ov, fermer) {
        j.essais = (j.essais || []).filter(function (x) { return x.id !== id; });
        fermer(); sauverJournee(j); rendre();
      }
    });
    boutons.push({
      libelle: 'Enregistrer', classe: 'p', action: function (ov, fermer) {
        var sel = document.getElementById('esLibSel');
        var choix = sel ? sel.value : '__AUTRE__';
        var libre = document.getElementById('esLib');
        e.libelle = (choix === '__AUTRE__' ? (libre ? libre.value : '') : choix).trim();
        if (!e.libelle) { U.toast('Choisissez un essai dans la liste ou saisissez-le'); return; }
        e.resultat = document.getElementById('esRes').value;
        e.mesures = (document.getElementById('esMes').value || '').trim();
        e.contreVisite = document.getElementById('esCv').checked;
        /* Mémoire d'usage : cet essai remontera en tête pour cet utilisateur */
        global.Usage.enregistrer('essai.libelle', e.libelle);
        if (neuf) { e.id = M.uid('es'); (j.essais = j.essais || []).push(e); }
        fermer(); sauverJournee(j); rendre(); U.toast('Essai enregistré', 'ok');
      }
    });
    var ov = U.feuille({ titre: neuf ? 'Ajouter un essai' : 'Essai', contenu: contenu, boutons: boutons });
    /* le champ de saisie libre n'apparaît que si l'essai n'est pas dans la liste */
    ov.addEventListener('change', function (ev) {
      if (ev.target.id !== 'esLibSel') return;
      var box = document.getElementById('esLibBox');
      var libre = document.getElementById('esLib');
      if (!box) return;
      if (ev.target.value === '__AUTRE__') {
        box.classList.remove('cache');
        if (libre) { libre.value = ''; libre.focus(); }
      } else {
        box.classList.add('cache');
      }
    });
  }

  /* -------------------------------- tâches ---------------------------- */

  function feuilleTache(j, id) {
    var ch = chantier(j.chantierId);
    var t = id ? (j.taches || []).filter(function (x) { return x.id === id; })[0] : null;
    var neuf = !t;
    t = t || { etat: 'PREVU', avancement: 0 };
    var contenu =
      U.champListe({
        id: 'taLibSel', idLibre: 'taLib',
        libelle: 'Tâche',
        valeur: t.libelle,
        suggestions: 'tache.libelle',
        catalogue: M.CATALOGUE_TACHES,
        titrePopulaires: 'tâches les plus utilisées',
        titreCatalogue: 'Tâches courantes',
        libelleLibre: 'Tâche (saisie libre)',
        dictee: true,
        placeholder: 'Câblage armoire'
      }) +
      '<label class="champ"><span class="champ-titre">Jalon concerné</span><select id="taJalon"><option value="">—</option>' +
      (ch.jalons || []).map(function (x) { return '<option value="' + x.id + '"' + (t.jalonId === x.id ? ' selected' : '') + '>' + U.esc(x.libelle) + '</option>'; }).join('') +
      '</select></label>' +
      '<label class="champ"><span class="champ-titre">État</span><select id="taEtat">' +
      M.ETATS_TACHE.map(function (x) { return '<option value="' + x.id + '"' + (t.etat === x.id ? ' selected' : '') + '>' + U.esc(x.libelle) + '</option>'; }).join('') +
      '</select></label>' +
      '<div class="duo">' +
      U.blocSaisie({ id: 'taAvan', libelle: 'Avancement apporté (%)', valeur: t.avancement, type: 'number', min: 0, max: 100 }) +
      U.blocSaisie({ id: 'taHeures', libelle: 'Heures passées', valeur: t.heures, type: 'number', min: 0, etape: 0.5 }) +
      '</div>' +
      U.blocSaisie({ id: 'taMotif', libelle: 'Motif si non réalisée', valeur: t.motif });

    var boutons = [{ libelle: 'Annuler', classe: 's' }];
    if (!neuf) boutons.push({
      libelle: 'Supprimer', classe: 's danger', action: function (ov, fermer) {
        var ancien = t.jalonId, ancienPt = t.avancement;
        j.taches = (j.taches || []).filter(function (x) { return x.id !== id; });
        if (ancien && ancienPt) M.appliquerAvancement(ch, ancien, -Number(ancienPt));
        fermer(); sauverJournee(j); sauverChantier(ch); rendre();
      }
    });
    boutons.push({
      libelle: 'Enregistrer', classe: 'p', action: function (ov, fermer) {
        var selT = document.getElementById('taLibSel');
        var choixT = selT ? selT.value : '__AUTRE__';
        var libreT = document.getElementById('taLib');
        var lib = (choixT === '__AUTRE__' ? (libreT ? libreT.value : '') : choixT).trim();
        if (!lib) { U.toast('Choisissez une tâche dans la liste ou saisissez-la'); return; }
        global.Usage.enregistrer('tache.libelle', lib);
        var jalonId = document.getElementById('taJalon').value;
        var etat = document.getElementById('taEtat').value;
        var pts = Number(document.getElementById('taAvan').value) || 0;
        /* applique la différence d'avancement au jalon */
        if (t.jalonId && t.avancement) M.appliquerAvancement(ch, t.jalonId, -Number(t.avancement));
        t.libelle = lib; t.jalonId = jalonId; t.etat = etat;
        t.avancement = pts;
        t.heures = Number(document.getElementById('taHeures').value) || 0;
        t.motif = (document.getElementById('taMotif').value || '').trim();
        if (jalonId && pts) M.appliquerAvancement(ch, jalonId, pts);
        if (neuf) { t.id = M.uid('t'); t.origine = 'saisie'; (j.taches = j.taches || []).push(t); }
        fermer(); sauverJournee(j); sauverChantier(ch); rendre();
        U.toast('Tâche enregistrée' + (pts ? ' (+' + pts + ' %)' : ''), 'ok');
      }
    });
    var ovT = U.feuille({ titre: neuf ? 'Nouvelle tâche' : 'Tâche', contenu: contenu, boutons: boutons });
    ovT.addEventListener('change', function (ev) {
      if (ev.target.id !== 'taLibSel') return;
      var box = document.getElementById('taLibBox');
      if (!box) return;
      if (ev.target.value === '__AUTRE__') { box.classList.remove('cache'); }
      else box.classList.add('cache');
    });
  }

  /* ------------------------- assistant « action » ---------------------- */

  function feuilleAction(j, id) {
    var a = id ? (j.actions || []).filter(function (x) { return x.id === id; })[0] : null;
    var neuf = !a;
    a = a || { activite: 'MONTAGE', categorie: 'INFO', texte: '', photo: '' };

    var contenu =
      '<div class="mini" style="margin-bottom:6px">1. Activité</div>' +
      '<div class="grille-choix" id="acActivite">' +
      M.ACTIVITES.map(function (x) {
        return '<button type="button" class="choix' + (a.activite === x.id ? ' actif' : '') + '" data-v="' + x.id + '">' +
          '<span class="e">' + I(x.icone, 22) + '</span>' + U.esc(x.libelle) + '</button>';
      }).join('') + '</div>' +

      '<div class="mini" style="margin:12px 0 6px">2. Description</div>' +
      U.blocSaisie({ id: 'acTexte', valeur: a.texte, lignes: true, rangees: 3, dictee: true, placeholder: 'Ce qui s\'est passé, factuellement' }) +

      '<div class="mini" style="margin:12px 0 6px">3. Photo (facultatif)</div>' +
      '<div id="acPhoto"></div>' +

      '<div class="mini" style="margin:12px 0 6px">4. Catégorie</div>' +
      '<div class="grille-choix" id="acCategorie">' +
      M.CATEGORIES.map(function (x) {
        return '<button type="button" class="choix' + (a.categorie === x.id ? ' actif' : '') + '" data-v="' + x.id + '">' +
          '<span class="e">' + I(x.icone, 22) + '</span>' + U.esc(x.libelle) + '</button>';
      }).join('') + '</div>';

    var photo = a.photo || '';
    var boutons = [{ libelle: 'Annuler', classe: 's' }];
    if (!neuf) boutons.push({
      libelle: 'Supprimer', classe: 's danger', action: function (ov, fermer) {
        j.actions = (j.actions || []).filter(function (x) { return x.id !== id; });
        fermer(); sauverJournee(j); rendre();
      }
    });
    boutons.push({
      libelle: 'Enregistrer', classe: 'p', action: function (ov, fermer) {
        var texte = (document.getElementById('acTexte').value || '').trim();
        if (!texte && !photo) { U.toast('Ajoutez une description ou une photo'); return; }
        a.texte = texte;
        a.photo = photo;
        if (neuf) {
          a.id = M.uid('ac');
          a.heure = M.maintenant();
          a.le = new Date().toISOString();
          (j.actions = j.actions || []).push(a);
        }
        fermer(); sauverJournee(j); rendre();
        U.toast('Action enregistrée', 'ok');
        if (a.categorie === 'SECURITE') U.toast('Action classée en sécurité — elle figurera dans la rubrique sécurité du point du soir');
      }
    });

    var ov = U.feuille({ titre: neuf ? 'Nouvelle action' : 'Action', contenu: contenu, boutons: boutons, pleine: true });

    /* sélecteurs activité / catégorie */
    ov.addEventListener('click', function (e) {
      var b = e.target.closest('.choix');
      if (!b) return;
      var groupe = b.parentElement.id;
      b.parentElement.querySelectorAll('.choix').forEach(function (x) { x.classList.remove('actif'); });
      b.classList.add('actif');
      if (groupe === 'acActivite') a.activite = b.getAttribute('data-v');
      else a.categorie = b.getAttribute('data-v');
    });

    /* zone photo */
    function rafraichirPhoto() {
      var z = document.getElementById('acPhoto');
      if (!z) return;
      if (photo) {
        Store.lirePhoto(photo).then(function (d) {
          etat.photosCache[photo] = d;
          z.innerHTML = '<img src="' + U.attr(d) + '" style="width:100%;border-radius:10px;border:1px solid #dbe2ea" alt="photo">' +
            '<div class="boutons-ligne">' +
            '<button type="button" class="btn s sm" data-p="annot">' + I('crayon', 15) + 'Annoter</button>' +
            '<button type="button" class="btn s sm" data-p="refaire">' + I('refaire', 15) + 'Refaire</button>' +
            '<button type="button" class="btn s sm danger" data-p="oter">' + I('fermer', 15) + 'Retirer</button>' +
            '</div>';
        });
      } else {
        z.innerHTML = '<button type="button" class="btn s sm" data-p="prendre">' + I('photo', 16) + 'Prendre une photo</button>';
      }
    }
    rafraichirPhoto();
    ov.addEventListener('click', function (e) {
      var b = e.target.closest('[data-p]');
      if (!b) return;
      var act = b.getAttribute('data-p');
      if (act === 'prendre' || act === 'refaire') {
        U.prendrePhoto().then(function (d) {
          if (!d) return;
          Store.sauverPhoto(d).then(function (pid) { photo = pid; rafraichirPhoto(); });
        });
      } else if (act === 'oter') { photo = ''; rafraichirPhoto(); }
      else if (act === 'annot') {
        Store.lirePhoto(photo).then(function (d) {
          if (!global.Annotation) { U.toast('Éditeur d\'annotation indisponible'); return; }
          global.Annotation.ouvrir({ dataUrl: d, annotations: [] }, {
            fin: function (valide, ph) {
              if (!valide) return;
              U.compresser(ph.dataUrl, 1600).then(function (d2) {
                return Store.sauverPhoto(d2);
              }).then(function (pid) { photo = pid; rafraichirPhoto(); U.toast('Photo annotée', 'ok'); });
            }
          });
        });
      }
    });
  }

  /* ------------------------------- formation -------------------------- */

  function feuilleFormation(ch, jSession, journeeId) {
    var s = jSession ? session(jSession) : null;
    var neuf = !s;
    s = s || {
      id: M.uid('se'), chantierId: ch.id, journeeId: journeeId || (journeeCourante() ? journeeCourante().id : ''),
      date: M.aujourdhui(), intitule: '', type: 'PRISE_EN_MAIN', dureeH: 2, lieu: ch.client.site || '',
      formateur: nomUtilisateur(), programme: [{ libelle: 'Sécurité et consignes', duree: 0, traite: false }],
      participants: [], support: { reference: '', qte: 0 }, evaluation: { avis: '', aRevoir: '', complementaire: false }
    };

    function html() {
      var h = '<div class="mini" style="margin-bottom:6px">Session</div>' +
        U.blocSaisie({
          id: 'foIntitule', libelle: 'Intitulé', valeur: s.intitule,
          placeholder: 'Prise en main de la ligne 3',
          suggestions: 'formation.intitule', catalogue: []
        }) +
        '<label class="champ"><span class="champ-titre">Type</span><select id="foType">' +
        M.TYPES_FORMATION.map(function (t) { return '<option value="' + t.id + '"' + (s.type === t.id ? ' selected' : '') + '>' + U.esc(t.libelle) + '</option>'; }).join('') +
        '</select></label>' +
        '<div class="duo">' +
        U.blocSaisie({ id: 'foDate', libelle: 'Date', valeur: s.date, type: 'date' }) +
        U.blocSaisie({ id: 'foDuree', libelle: 'Durée (h)', valeur: s.dureeH, type: 'number', min: 0, etape: 0.5 }) +
        '</div>' +
        U.blocSaisie({ id: 'foLieu', libelle: 'Lieu', valeur: s.lieu, placeholder: 'Atelier client' }) +
        U.blocSaisie({ id: 'foFormateur', libelle: 'Formateur', valeur: s.formateur });

      h += '<div class="mini" style="margin:12px 0 6px">Programme</div><div id="foProgramme">';
      (s.programme || []).forEach(function (m, i) {
        h += '<div class="ligne mat-ligne"><label class="case-ligne" style="flex:1;padding:0">' +
          '<input type="checkbox" data-pm="' + i + '"' + (m.traite ? ' checked' : '') + '>' +
          '<span>' + U.esc(m.libelle) + (m.duree ? ' <span class="mini">(' + m.duree + ' h)</span>' : '') + '</span></label>' +
          '<button type="button" class="mini-btn" data-sm="' + i + '" aria-label="Supprimer">' + I('fermer', 14) + '</button></div>';
      });
      h += '</div><button type="button" class="btn s sm" data-am="1">' + I('plus', 15) + 'Ajouter un thème</button>';

      h += '<div class="mini" style="margin:12px 0 6px">Participants (' + (s.participants || []).length + ')</div><div id="foParticipants">';
      (s.participants || []).forEach(function (p, i) {
        h += '<div class="carte-interne"><div class="ligne"><div><div class="gras">' + U.esc(p.nom || '—') + '</div>' +
          '<div class="mini">' + U.esc([p.fonction, p.entreprise].filter(Boolean).join(' · ')) + '</div></div>' +
          (p.signature ? E.pastille('signé', '#1c8676', '#e7f2ef') : E.pastille('à signer', '#4a4f6b', '#ecebf4')) + '</div>' +
          '<div class="boutons-ligne">' +
          '<button type="button" class="btn s sm" data-sp="' + i + '">' + (p.signature ? 'Voir la signature' : I('signature', 15) + 'Signer') + '</button>' +
          '<button type="button" class="btn s sm" data-ap="' + i + '">Acquis : ' + U.esc(M.libelle(M.ACQUIS, p.acquis || 'ACQUIS')) + '</button>' +
          '<button type="button" class="btn s sm danger" data-dp="' + i + '" aria-label="Supprimer">' + I('fermer', 15) + '</button>' +
          '</div></div>';
      });
      h += '</div><button type="button" class="btn s sm" data-pp="1">' + I('plus', 15) + 'Ajouter un participant</button>';

      h += '<div class="mini" style="margin:12px 0 6px">Support remis et évaluation</div>' +
        '<div class="duo">' +
        U.blocSaisie({ id: 'foSuppRef', libelle: 'Support (référence)', valeur: s.support.reference }) +
        U.blocSaisie({ id: 'foSuppQte', libelle: 'Quantité', valeur: s.support.qte, type: 'number', min: 0 }) +
        '</div>' +
        U.blocSaisie({ id: 'foAvis', libelle: 'Avis à chaud', valeur: s.evaluation.avis, lignes: true, rangees: 2 }) +
        U.blocSaisie({ id: 'foARevoir', libelle: 'Points à revoir', valeur: s.evaluation.aRevoir }) +
        '<label class="case-ligne"><input type="checkbox" id="foCompl"' + (s.evaluation.complementaire ? ' checked' : '') + '><span>Session complémentaire nécessaire</span></label>';
      return h;
    }

    function relireChamps() {
      function v(id) { var el = document.getElementById(id); return el ? el.value : ''; }
      s.intitule = (v('foIntitule') || '').trim();
      s.type = v('foType');
      s.date = v('foDate');
      s.dureeH = Number(v('foDuree')) || 0;
      s.lieu = (v('foLieu') || '').trim();
      s.formateur = (v('foFormateur') || '').trim();
      s.support.reference = (v('foSuppRef') || '').trim();
      s.support.qte = Number(v('foSuppQte')) || 0;
      s.evaluation.avis = (v('foAvis') || '').trim();
      s.evaluation.aRevoir = (v('foARevoir') || '').trim();
      s.evaluation.complementaire = document.getElementById('foCompl') ? document.getElementById('foCompl').checked : false;
    }

    var boutons = [{ libelle: 'Annuler', classe: 's' }];
    if (!neuf) boutons.push({
      libelle: 'Documents', classe: 'v', action: function (ov, fermer) {
        relireChamps();
        sauverSession(s);
        fermer();
        documentGenerationsFormation(s);
      }
    });
    boutons.push({
      libelle: 'Enregistrer la session', classe: 'p', action: function (ov, fermer) {
        relireChamps();
        if (!s.intitule) { U.toast('Indiquez l\'intitulé de la formation'); return; }
        global.Usage.enregistrer('formation.intitule', s.intitule);
        sauverSession(s);
        /* rattache la session à la journée du jour */
        var j = journee(s.journeeId) || journeeCourante();
        if (j && j.chantierId === ch.id) {
          j.formationId = s.id;
          j.formation = {
            intitule: s.intitule, type: s.type, dureeH: s.dureeH, formateur: s.formateur,
            participants: s.participants.map(function (p) {
              return { nom: p.nom, fonction: p.fonction, acquis: p.acquis, signature: !!p.signature };
            }),
            programme: s.programme.map(function (m) { return { libelle: m.libelle, duree: m.duree, traite: !!m.traite }; })
          };
          sauverJournee(j);
        }
        if (etat.sessions.indexOf(s) === -1) etat.sessions.push(s);
        fermer(); rendre(); U.toast('Session de formation enregistrée', 'ok');
      }
    });

    var ov = U.feuille({ titre: neuf ? 'Nouvelle session de formation' : 'Session de formation', contenu: html(), boutons: boutons, pleine: true });

    ov.addEventListener('click', function (e) {
      var b = e.target.closest('[data-am],[data-sm],[data-pp],[data-sp],[data-ap],[data-dp],[data-pm]');
      if (!b) return;
      relireChamps();
      if (b.hasAttribute('data-am')) {
        U.feuille({
          titre: 'Ajouter un thème', contenu:
            U.blocSaisie({ id: 'amLib', libelle: 'Thème', placeholder: 'Changement de recette' }) +
            U.blocSaisie({ id: 'amDur', libelle: 'Durée (h)', type: 'number', min: 0, etape: 0.5 }),
          boutons: [{ libelle: 'Annuler', classe: 's' }, {
            libelle: 'Ajouter', classe: 'p', action: function (ov2, fermer2) {
              var lib = (document.getElementById('amLib').value || '').trim();
              if (!lib) return;
              s.programme.push({ libelle: lib, duree: Number(document.getElementById('amDur').value) || 0, traite: false });
              fermer2(); rafraichir();
            }
          }]
        });
      } else if (b.hasAttribute('data-sm')) {
        s.programme.splice(Number(b.getAttribute('data-sm')), 1); rafraichir();
      } else if (b.hasAttribute('data-pm')) { /* case à cocher : gérée sur change */ }
      else if (b.hasAttribute('data-pp')) {
        U.feuille({
          titre: 'Ajouter un participant', contenu:
            U.blocSaisie({ id: 'ppNom', libelle: 'Nom et prénom' }) +
            U.blocSaisie({ id: 'ppFonction', libelle: 'Fonction' }) +
            U.blocSaisie({ id: 'ppEntreprise', libelle: 'Service / entreprise', valeur: ch.client.nom }),
          boutons: [{ libelle: 'Annuler', classe: 's' }, {
            libelle: 'Ajouter', classe: 'p', action: function (ov2, fermer2) {
              var nom = (document.getElementById('ppNom').value || '').trim();
              if (!nom) { U.toast('Indiquez le nom du participant'); return; }
              s.participants.push({
                nom: nom,
                fonction: (document.getElementById('ppFonction').value || '').trim(),
                entreprise: (document.getElementById('ppEntreprise').value || '').trim(),
                acquis: 'ACQUIS', signature: ''
              });
              fermer2(); rafraichir();
            }
          }]
        });
      } else if (b.hasAttribute('data-sp')) {
        var i = Number(b.getAttribute('data-sp'));
        var p = s.participants[i];
        U.signature('Signature — ' + p.nom, p.signature).then(function (dataUrl) {
          if (dataUrl === null) return;
          p.signature = dataUrl;
          rafraichir();
          U.toast('Signature enregistrée', 'ok');
        });
      } else if (b.hasAttribute('data-ap')) {
        var k = Number(b.getAttribute('data-ap'));
        var ordre = ['ACQUIS', 'A_CONSOLIDER', 'NON_ACQUIS'];
        var idx = ordre.indexOf(s.participants[k].acquis || 'ACQUIS');
        s.participants[k].acquis = ordre[(idx + 1) % 3];
        rafraichir();
      } else if (b.hasAttribute('data-dp')) {
        s.participants.splice(Number(b.getAttribute('data-dp')), 1); rafraichir();
      }
    });
    ov.addEventListener('change', function (e) {
      var c = e.target.closest('[data-pm]');
      if (!c) return;
      relireChamps();
      s.programme[Number(c.getAttribute('data-pm'))].traite = c.checked;
      sauverSession(s);
    });

    function rafraichir() {
      var corps = ov.querySelector('.feuille-corps');
      if (corps) corps.innerHTML = html();
    }
  }

  /* Documents de formation : compte rendu, feuille de présence, attestations */
  function documentGenerationsFormation(s) {
    U.feuille({
      titre: 'Documents de formation',
      contenu: '<p class="texte">Trois documents peuvent être produits à partir de la session :</p>' +
        '<div class="carte-interne"><div class="gras">' + I('compteRendu', 16) + ' Compte rendu de formation</div>' +
        '<div class="mini">Déroulement, programme traité, participants, évaluation — document de synthèse.</div></div>' +
        '<div class="carte-interne"><div class="gras">' + I('signature', 16) + ' Feuille de présence</div>' +
        '<div class="mini">Tableau des participants avec leurs signatures, à conserver au dossier.</div></div>' +
        '<div class="carte-interne"><div class="gras">' + I('medaille', 16) + ' Attestations individuelles</div>' +
        '<div class="mini">Une attestation par participant (à remettre à chacun).</div></div>' +
        '<p class="mini">Ces documents seront produits au lot L4 du développement (documents de formation). Les données de la session sont déjà enregistrées.</p>',
      boutons: [{ libelle: 'Fermer', classe: 's' }]
    });
  }

  /* ------------------------------- ajuster ---------------------------- */

  function feuilleAjuster(j) {
    var contenu = '<div class="duo">' +
      U.blocSaisie({ id: 'ajDebut', libelle: 'Arrivée', valeur: j.debut, type: 'time' }) +
      U.blocSaisie({ id: 'ajFin', libelle: 'Départ', valeur: j.fin, type: 'time' }) +
      '</div>' +
      '<div class="duo">' +
      U.blocSaisie({ id: 'ajEff', libelle: 'Effectif présent', valeur: (j.effectif || {}).nb, type: 'number', min: 0 }) +
      U.blocSaisie({ id: 'ajDate', libelle: 'Date de la journée', valeur: j.date, type: 'date' }) +
      '</div>' +
      U.blocSaisie({ id: 'ajDetail', libelle: 'Répartition (facultatif)', valeur: (j.effectif || {}).detail, placeholder: '1 électricien, 1 automaticien' }) +
      '<div class="mini">Le total hommes-heures est recalculé automatiquement : effectif × durée sur site, pauses déduites.</div>';

    U.feuille({
      titre: 'Ajuster la journée', contenu: contenu,
      boutons: [{ libelle: 'Annuler', classe: 's' }, {
        libelle: 'Enregistrer', classe: 'p', action: function (ov, fermer) {
          j.debut = document.getElementById('ajDebut').value;
          j.fin = document.getElementById('ajFin').value;
          j.date = document.getElementById('ajDate').value || j.date;
          j.effectif = j.effectif || {};
          j.effectif.nb = Number(document.getElementById('ajEff').value) || 0;
          j.effectif.detail = (document.getElementById('ajDetail').value || '').trim();
          fermer(); sauverJournee(j); rendre();
          U.toast('Journée ajustée — ' + M.texteHeures(M.dureeJourneeMn(j)), 'ok');
        }
      }]
    });
  }

  function feuilleJalon(ch, jalonId) {
    var jal = M.parId(ch.jalons || [], jalonId);
    if (!jal) return;
    U.feuille({
      titre: jal.libelle,
      contenu: '<div class="mini">Avancement de ce jalon (0 à 100 %)</div>' +
        U.blocSaisie({ id: 'jaAvan', libelle: 'Avancement', valeur: jal.avancement, type: 'number', min: 0, max: 100 }) +
        U.blocSaisie({ id: 'jaPoids', libelle: 'Poids dans l\'avancement global', valeur: jal.poids, type: 'number', min: 0 }) +
        '<div class="mini">Le poids relatif de tous les jalons doit rester cohérent : il pondère l\'avancement global du chantier.</div>',
      boutons: [{ libelle: 'Annuler', classe: 's' }, {
        libelle: 'Enregistrer', classe: 'p', action: function (ov, fermer) {
          jal.avancement = Math.max(0, Math.min(100, Number(document.getElementById('jaAvan').value) || 0));
          jal.poids = Math.max(0, Number(document.getElementById('jaPoids').value) || 0);
          fermer(); sauverChantier(ch); rendre();
          U.toast('Avancement du chantier : ' + M.avancementChantier(ch) + ' %', 'ok');
        }
      }]
    });
  }

  /* =============================== Actions ============================= */

  var actions = {

    'menu': function () { feuilleMenu(); },
    'accueil': function () { aller('accueil', { chantierId: etat.vue.chantierId }); },

    'nouveau': function () {
      etat.nouveau = { type: 'INSTALLATION', effectifPrevu: 2, dureePrevueJours: 5, dateDebutPrevue: M.aujourdhui(), client: {}, contacts: {}, contraintes: {} };
      aller('nouveau');
    },

    'creer-chantier': function () {
      var d = etat.nouveau;
      if (!d.libelle || !String(d.libelle).trim()) { U.toast('Indiquez le libellé du chantier'); return; }
      var ch = M.nouveauChantier({
        numeroAffaire: d.numeroAffaire, libelle: d.libelle, type: d.type,
        client: d.client, contacts: d.contacts, effectifPrevu: d.effectifPrevu,
        dureePrevueJours: d.dureePrevueJours, dateDebutPrevue: d.dateDebutPrevue,
        dateFinPrevue: d.dateFinPrevue, contraintes: d.contraintes, equipe: d.equipe
      });
      etat.chantiers.push(ch);
      Store.ecrire(Store.ST_CHANTIERS, ch).then(function () {
        U.toast('Chantier créé', 'ok');
        aller('fiche', { chantierId: ch.id, onglet: 'synthese' });
      });
    },

    'ouvrir-chantier': function (el) { aller('fiche', { chantierId: el.getAttribute('data-id'), onglet: 'synthese' }); },

    /* Adresses de ce chantier : retour aux adresses globales des réglages */
    'adresses-globales': function () {
      var ch = chantierCourant();
      if (!ch) return;
      U.feuille({
        titre: 'Adresses de ce chantier',
        contenu: '<p class="texte">Revenir aux adresses globales pour ce chantier ?</p>' +
          '<p class="mini">Les adresses saisies pour ce chantier seront effacées : le point du soir repartira ' +
          'des adresses enregistrées dans Menu → Réglages → Responsables.</p>',
        boutons: [
          { libelle: 'Annuler', classe: 's' },
          {
            libelle: 'Rétablir', classe: 'o',
            action: function (ov, fermer) {
              fermer();
              var vide = {};
              M.ROLES_RESPONSABLES.forEach(function (r) { vide[r.role] = M.responsableVide(); });
              ch.responsables = vide;
              sauverChantier(ch).then(function () {
                rendre();
                U.toast('Adresses globales rétablies pour ce chantier', 'ok');
              });
            }
          }
        ]
      });
    },

    /* ouvre la fiche du chantier sur l'onglet des réglages (adresses) */
    'adresses-chantier': function () { aller('fiche', { chantierId: etat.vue.chantierId, onglet: 'reglages' }); },
    'ouvrir-chantier-retour': function () { aller('fiche', { chantierId: etat.vue.chantierId, onglet: 'synthese' }); },
    'fiche-onglet': function (el) { etat.vue.onglet = el.getAttribute('data-onglet'); rendre(); },
    'editer-chantier': function (el) { etat.vue.onglet = 'reglages'; aller('fiche', { chantierId: el.getAttribute('data-id') }); },

    'demarrer-journee': function (el) {
      var ch = chantier(el.getAttribute('data-id'));
      if (!ch) return;
      var ouverte = journeeOuverteDe(ch.id);
      if (ouverte) { aller('journee', { chantierId: ch.id, journeeId: ouverte.id }); return; }
      var js = journeesDe(ch.id);
      var j = M.creerJournee(ch, js.length ? js[js.length - 1] : null, M.aujourdhui());
      j.debut = M.maintenant();
      ch.statut = 'EN_COURS';
      if (!ch.dateDebutReelle) ch.dateDebutReelle = j.date;
      etat.journees.push(j);
      chargerPhotos(j).then(function () {
        return Promise.all([sauverJournee(j), sauverChantier(ch)]);
      }).then(function () {
        U.toast('Journée J' + j.numero + ' démarrée à ' + j.debut, 'ok');
        aller('journee', { chantierId: ch.id, journeeId: j.id });
      });
    },

    'ouvrir-journee': function (el) {
      var j = journee(el.getAttribute('data-id'));
      if (!j) return;
      chargerPhotos(j).then(function () {
        aller('journee', { chantierId: j.chantierId, journeeId: j.id });
      });
    },

    'demarrer-horloge': function () {
      var j = journeeCourante();
      j.debut = M.maintenant();
      sauverJournee(j); rendre(); U.toast('Arrivée notée à ' + j.debut, 'ok');
    },

    'pause-journee': function () {
      var j = journeeCourante();
      j.pauses = j.pauses || [];
      if (j.pauses.length && !j.pauses[j.pauses.length - 1].fin) {
        j.pauses[j.pauses.length - 1].fin = M.maintenant();
        U.toast('Reprise de l\'activité');
      } else {
        j.pauses.push({ debut: M.maintenant(), fin: '' });
        U.toast('Pause notée à ' + M.maintenant());
      }
      sauverJournee(j); rendre();
    },

    'terminer-journee': function () {
      var j = journeeCourante();
      j.fin = M.maintenant();
      (j.pauses || []).forEach(function (p) { if (!p.fin) p.fin = j.fin; });
      sauverJournee(j); rendre();
      U.toast('Départ noté à ' + j.fin + ' — durée ' + M.texteHeures(M.dureeJourneeMn(j)));
    },

    'ajuster-journee': function () { feuilleAjuster(journeeCourante()); },
    'editer-journee': function () { feuilleAjuster(journee(el.getAttribute('data-id')) || journeeCourante()); },

    /* taches */
    'ajouter-tache': function () { feuilleTache(journeeCourante()); },
    'editer-tache': function (el) { feuilleTache(journeeCourante(), el.getAttribute('data-id')); },
    'cycle-tache': function (el) {
      var j = journeeCourante();
      var ch = chantier(j.chantierId);
      var t = (j.taches || []).filter(function (x) { return x.id === el.getAttribute('data-id'); })[0];
      if (!t) return;
      var ordre = ['PREVU', 'FAIT', 'PARTIEL', 'NON_FAIT'];
      var idx = ordre.indexOf(t.etat || 'PREVU');
      t.etat = ordre[(idx + 1) % ordre.length];
      if (t.etat === 'FAIT' && t.jalonId && !t.avancement) {
        U.toast('Tâche réalisée — pensez au % d\'avancement apporté');
        feuilleTache(j, t.id);
        return;
      }
      sauverJournee(j);
      rendre();
      U.toast(M.libelle(M.ETATS_TACHE, t.etat));
    },

    /* actions */
    'ajouter-action': function () { feuilleAction(journeeCourante()); },
    'editer-action': function (el) { feuilleAction(journeeCourante(), el.getAttribute('data-id')); },

    /* blocages */
    'ajouter-blocage': function () { feuilleBlocage(journeeCourante()); },
    'editer-blocage': function (el) { feuilleBlocage(journeeCourante(), el.getAttribute('data-id')); },
    'lever-blocage': function (el) {
      var parts = String(el.getAttribute('data-id')).split('|');
      var j = journee(parts[0]);
      if (!j) return;
      var b = (j.blocages || []).filter(function (x) { return x.id === parts[1]; })[0];
      if (!b) return;
      U.confirmer('Marquer ce blocage comme levé ?', function () {
        b.statut = 'LEVE'; b.leveLe = M.aujourdhui();
        sauverJournee(j); rendre(); U.toast('Blocage levé', 'ok');
      }, 'Lever');
    },

    /* matériel */
    'ajouter-materiel': function () { feuilleMateriel(journeeCourante()); },
    'editer-materiel': function (el) { feuilleMateriel(journeeCourante(), el.getAttribute('data-id')); },

    /* essais */
    'ajouter-essai': function () { feuilleEssai(journeeCourante()); },
    'editer-essai': function (el) { feuilleEssai(journeeCourante(), el.getAttribute('data-id')); },
    /* essai lancé depuis un raccourci « vos essais les plus fréquents » */
    'essai-rapide': function (el) { feuilleEssai(journeeCourante(), null, el.getAttribute('data-valeur')); },

    /* raccourci de saisie : recopie une valeur mémorisée dans le champ */
    'utiliser-suggestion': function (el) {
      var champ = document.getElementById(el.getAttribute('data-vers'));
      if (!champ) return;
      champ.value = el.getAttribute('data-valeur');
      champ.dispatchEvent(new Event('input', { bubbles: true }));
      champ.focus();
      U.toast('Raccourci appliqué');
    },

    'reinitialiser-habitudes': function () {
      U.confirmer('Oublier les saisies mémorisées pour vous (' + Usage.utilisateurCourant() + ') ?',
        function () {
          Usage.reinitialiser();
          rendre();
          U.toast('Habitudes de saisie réinitialisées', 'ok');
        }, 'Oublier');
    },

    /* sécurité */
    'securite-ras': function () {
      var j = journeeCourante();
      j.securite = j.securite || { incidents: [] };
      j.securite.renseigne = true;
      sauverJournee(j); rendre(); U.toast('Sécurité renseignée : aucun incident', 'ok');
    },
    'ajouter-incident': function () {
      var j = journeeCourante();
      U.feuille({
        titre: 'Incident ou presqu\'accident',
        contenu: U.blocSaisie({ id: 'inDesc', libelle: 'Ce qui s\'est passé', lignes: true, rangees: 2, dictee: true }) +
          U.blocSaisie({ id: 'inGrav', libelle: 'Gravité / suites', placeholder: 'Sans arrêt, soin, arrêt de travail…' }),
        boutons: [{ libelle: 'Annuler', classe: 's' }, {
          libelle: 'Enregistrer', classe: 'p', action: function (ov, fermer) {
            var d = (document.getElementById('inDesc').value || '').trim();
            if (!d) { U.toast('Décrivez l\'incident'); return; }
            j.securite = j.securite || { incidents: [] };
            j.securite.incidents = j.securite.incidents || [];
            j.securite.incidents.push({ description: d, gravite: (document.getElementById('inGrav').value || '').trim(), le: new Date().toISOString() });
            j.securite.renseigne = true;
            fermer(); sauverJournee(j); rendre();
            U.toast('Incident enregistré — copie direction technique au point du soir', 'erreur');
          }
        }]
      });
    },
    'supprimer-incident': function (el) {
      var j = journeeCourante();
      j.securite.incidents.splice(Number(el.getAttribute('data-index')), 1);
      sauverJournee(j); rendre();
    },

    /* coactivité */
    'ajouter-coactivite': function () {
      var j = journeeCourante();
      U.feuille({
        titre: 'Coactivité',
        contenu: U.blocSaisie({
          id: 'coEnt', libelle: 'Entreprise présente',
          suggestions: 'coactivite.entreprise', catalogue: []
        }) +
          U.blocSaisie({ id: 'coEff', libelle: 'Effectif', type: 'number', min: 0 }) +
          U.blocSaisie({ id: 'coRem', libelle: 'Remarque (gêne, coordination)', lignes: true, rangees: 2 }),
        boutons: [{ libelle: 'Annuler', classe: 's' }, {
          libelle: 'Ajouter', classe: 'p', action: function (ov, fermer) {
            var e = (document.getElementById('coEnt').value || '').trim();
            if (!e) { U.toast('Indiquez l\'entreprise'); return; }
            global.Usage.enregistrer('coactivite.entreprise', e);
            j.coactivite = j.coactivite || [];
            j.coactivite.push({
              entreprise: e, effectif: Number(document.getElementById('coEff').value) || 0,
              remarque: (document.getElementById('coRem').value || '').trim()
            });
            fermer(); sauverJournee(j); rendre();
          }
        }]
      });
    },
    'supprimer-coactivite': function (el) {
      var j = journeeCourante();
      j.coactivite.splice(Number(el.getAttribute('data-index')), 1);
      sauverJournee(j); rendre();
    },

    /* formation */
    'editer-formation': function (el) {
      var id = el.getAttribute('data-id');
      var ch = chantierCourant() || chantier(journeeCourante().chantierId);
      feuilleFormation(ch, id, journeeCourante() ? journeeCourante().id : '');
    },
    'documents-formation': function (el) { documentGenerationsFormation(session(el.getAttribute('data-id'))); },
    'detacher-formation': function () {
      var j = journeeCourante();
      j.formation = null; j.formationId = '';
      sauverJournee(j); rendre();
    },

    /* prévu demain */
    'ajouter-prevision': function () {
      var j = journeeCourante();
      feuilleTexte('Prévu demain', 'Tâche prévue demain', '', function (v) {
        j.prevuDemain = j.prevuDemain || { taches: [], besoins: [] };
        j.prevuDemain.taches = j.prevuDemain.taches || [];
        j.prevuDemain.taches.push(v);
        sauverJournee(j); rendre();
      });
    },
    'supprimer-prevision': function (el) {
      var j = journeeCourante();
      j.prevuDemain.taches.splice(Number(el.getAttribute('data-index')), 1);
      sauverJournee(j); rendre();
    },
    'ajouter-besoin': function () {
      var j = journeeCourante();
      feuilleTexte('Besoin', 'Besoin (outillage, accès, renfort, décision)', '', function (v) {
        j.prevuDemain = j.prevuDemain || { taches: [], besoins: [] };
        j.prevuDemain.besoins = j.prevuDemain.besoins || [];
        j.prevuDemain.besoins.push(v);
        sauverJournee(j); rendre();
      });
    },
    'supprimer-besoin': function (el) {
      var j = journeeCourante();
      j.prevuDemain.besoins.splice(Number(el.getAttribute('data-index')), 1);
      sauverJournee(j); rendre();
    },

    /* équipements */
    'ajouter-equipement': function () {
      var ch = chantierCourant();
      U.feuille({
        titre: 'Ajouter un équipement',
        contenu: U.blocSaisie({ id: 'eqDes', libelle: 'Désignation', placeholder: 'Convoyeur d\'alimentation' }) +
          '<div class="duo">' + U.blocSaisie({ id: 'eqMod', libelle: 'Modèle' }) + U.blocSaisie({ id: 'eqSer', libelle: 'N° de série' }) + '</div>' +
          U.blocSaisie({ id: 'eqQte', libelle: 'Quantité', type: 'number', min: 1, valeur: 1 }),
        boutons: [{ libelle: 'Annuler', classe: 's' }, {
          libelle: 'Ajouter', classe: 'p', action: function (ov, fermer) {
            var d = (document.getElementById('eqDes').value || '').trim();
            if (!d) { U.toast('Indiquez la désignation'); return; }
            ch.equipements = ch.equipements || [];
            ch.equipements.push({
              designation: d,
              modele: (document.getElementById('eqMod').value || '').trim(),
              serie: (document.getElementById('eqSer').value || '').trim(),
              qte: Number(document.getElementById('eqQte').value) || 1
            });
            fermer(); sauverChantier(ch); rendre();
          }
        }]
      });
    },
    'supprimer-equipement': function (el) {
      var ch = chantierCourant();
      ch.equipements.splice(Number(el.getAttribute('data-index')), 1);
      sauverChantier(ch); rendre();
    },

    /* jalons */
    'editer-jalon': function (el) { feuilleJalon(chantierCourant(), el.getAttribute('data-id')); },
    'editer-jalons': function () { U.toast('Touchez un jalon pour ajuster son avancement et son poids'); },

    /* clôture et point du soir */
    'cloturer-journee': function () {
      var j = journeeCourante();
      var v = M.verifierCloture(j);
      if (v.complete) { procederCloture(j); return; }
      U.feuille({
        titre: 'Il reste ' + v.manques.length + ' point(s) à renseigner',
        contenu: '<ul class="liste-manques">' + v.manques.map(function (m) { return '<li>' + U.esc(m.libelle) + '</li>'; }).join('') + '</ul>' +
          '<p class="mini">Ces rubriques rendent le point du soir utile aux responsables. Vous pouvez clôturer malgré tout : le document portera la mention « à compléter ».</p>',
        boutons: [
          { libelle: 'Compléter plus tard', classe: 's', action: function (ov, fermer) { fermer(); } },
          { libelle: 'Clôturer quand même', classe: 'o', action: function (ov, fermer) { fermer(); procederCloture(j, true); } }
        ]
      });
    },

    'point-du-soir': function (el) {
      var id = el ? el.getAttribute('data-id') : null;
      var j = id ? journee(id) : null;
      if (!j) {
        /* choisit la journée la plus récente non clôturée */
        var candidates = etat.journees.filter(function (x) { return x.statut !== 'CLOTUREE'; })
          .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
        if (!candidates.length) {
          var cl = etat.journees.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
          if (!cl.length) { U.toast('Aucune journée enregistrée'); return; }
          j = cl[0];
        } else if (candidates.length === 1) {
          j = candidates[0];
        } else {
          U.feuille({
            titre: 'Quel point du soir ?',
            contenu: candidates.map(function (x) {
              return '<button type="button" class="jalon-ligne" data-a="point-du-soir" data-id="' + x.id + '">' +
                '<span class="jalon-ic">' + I('pointSoir', 16) + '</span><span class="jalon-lib">' + U.esc((chantier(x.chantierId) || {}).libelle || '') +
                ' — J' + x.numero + ' · ' + U.esc(M.texteDateCourt(x.date)) + '</span><span class="chev">›</span></button>';
            }).join(''),
            surFermeture: function () { }
          });
          return;
        }
      }
      chargerPhotos(j).then(function () {
        aller('point', { chantierId: j.chantierId, journeeId: j.id });
      });
    },

    'fermer-point': function () { aller('fiche', { chantierId: etat.vue.chantierId, onglet: 'journal' }); },

    'point-pdf': function () {
      var j = journeeCourante();
      chargerPhotos(j).then(function () {
        var ctx = contextePoint(j);
        var res = PS.document(ctx);
        U.telecharger(res.blob, M.nomFichierPoint(ctx.chantier, j));
        U.toast('PDF généré', 'ok');
      });
    },

    'point-copier': function () {
      var j = journeeCourante();
      var msg = PS.message(contextePoint(j));
      U.copier(msg.objet + '\n\n' + msg.corps).then(function (ok) {
        U.toast(ok ? 'Texte copié (objet + corps)' : 'Copie impossible', ok ? 'ok' : 'erreur');
      });
    },

    'point-envoyer': function () {
      var j = journeeCourante();
      var dest = M.destinataires(chantierCourant(), etat.reglages);
      var joignables = dest.filter(function (d) { return M.emailValide(d.email); });
      if (!joignables.length) {
        U.toast('Aucune adresse e-mail valide : complétez les destinataires', 'erreur');
        U.feuille({
          titre: 'Adresses manquantes',
          contenu: '<p class="texte">Le point du soir ne peut pas partir : aucune adresse e-mail valide n\'est enregistrée.</p>' +
            '<p class="mini">Saisissez les adresses une fois pour toutes dans Menu → Réglages → Responsables, ' +
            'ou pour ce chantier seulement dans sa fiche → onglet Réglages → Diffusion du point du soir.</p>',
          boutons: [
            { libelle: 'Réglages généraux', classe: 'p', action: function (ov, fermer) { fermer(); aller('reglages'); } },
            { libelle: 'Ce chantier', action: function (ov, fermer) { fermer(); aller('fiche', { chantierId: etat.vue.chantierId, onglet: 'reglages' }); } }
          ]
        });
        return;
      }
      chargerPhotos(j).then(function () {
        var ctx = contextePoint(j);
        var msg = PS.message(ctx);
        var res = PS.document(ctx);
        var nom = M.nomFichierPoint(ctx.chantier, j);
        return U.partager([{ blob: res.blob, nom: nom }], msg.corps, msg.objet).then(function (r) {
          if (r === 'annule') return;
          if (r === 'indisponible') {
            /* solution de repli : le PDF est téléchargé et le mail s'ouvre préparé */
            U.telecharger(res.blob, nom);
            var adresses = msg.adresses.join(',');
            var lien = 'mailto:' + encodeURIComponent(adresses) +
              '?subject=' + encodeURIComponent(msg.objet) +
              '&body=' + encodeURIComponent(msg.corps);
            global.location.href = lien;
            U.feuille({
              titre: 'Envoi manuel',
              contenu: '<p class="texte">Le PDF a été enregistré dans vos téléchargements et votre messagerie s\'est ouverte avec le texte prêt.</p>' +
                '<p class="mini">Joignez le fichier <b>' + U.esc(nom) + '</b> au message, puis envoyez.</p>',
              boutons: [{ libelle: 'Marquer comme envoyé', classe: 'p', action: function (ov, fermer) { fermer(); marquerEnvoye(j); } }]
            });
            return;
          }
          marquerEnvoye(j);
        });
      });
    },

    /* réglages */
    'reglages': function () { aller('reglages'); },
    'signature-utilisateur': function () {
      U.signature('Ma signature (formateur)', etat.reglages.utilisateur.signature).then(function (d) {
        if (d === null) return;
        etat.reglages.utilisateur.signature = d;
        sauverReglages(); rendre(); U.toast('Signature enregistrée', 'ok');
      });
    },
    'vider-clients': function () {
      U.confirmer('Vider la liste clients importée ?', function () {
        etat.reglages.listes.clients = [];
        sauverReglages(); rendre();
      }, 'Vider');
    },
    'exporter': function () {
      Store.exporterTout().then(function (data) {
        data.usage = Usage.exporter();           /* habitudes de saisie (par utilisateur) */
        var blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
        U.telecharger(blob, 'sauvegarde-BFR-Chantier-' + M.aujourdhui() + '.json');
        U.toast('Sauvegarde exportée', 'ok');
      });
    },
    'mode-emploi': function () {
      U.feuille({
        titre: 'Mode d\'emploi',
        contenu:
          '<p class="texte"><b>Le principe :</b> une journée = une saisie.</p>' +
          '<p class="texte">1. Le matin, touchez <b>Démarrer la journée</b> : l\'heure d\'arrivée est notée et le plan de la veille est repris automatiquement.</p>' +
          '<p class="texte">2. Toute la journée, ajoutez les <b>actions</b> (avec photo si besoin), les <b>tâches</b>, les <b>blocages</b>, le <b>matériel</b> manquant, la <b>sécurité</b> et les <b>essais</b>.</p>' +
          '<p class="texte">3. Le soir, touchez <b>Clôturer la journée</b> : l\'application vérifie les points essentiels, puis produit le <b>Point du soir</b> en PDF.</p>' +
          '<p class="texte">4. <b>Envoyer</b> prépare le mail (destinataires et texte prêts, PDF joint). Sur un téléphone, choisissez Gmail dans la fenêtre de partage.</p>' +
          '<p class="texte">5. Le lendemain, les blocages non levés et les tâches non terminées réapparaissent : rien ne se perd.</p>' +
          '<p class="mini">Les destinataires se règlent une fois pour toutes dans Menu → Réglages → Responsables. Le commercial n\'est en copie que si l\'option est cochée dans les réglages du chantier.</p>',
        boutons: [{ libelle: 'Fermer', classe: 'p' }]
      });
    }
  };

  function procederCloture(j, incomplete) {
    if (!j.fin) j.fin = M.maintenant();
    (j.pauses || []).forEach(function (p) { if (!p.fin) p.fin = j.fin; });
    j.statut = 'CLOTUREE';
    j.clotureeLe = new Date().toISOString();
    j.incomplete = !!incomplete;
    var ch = chantier(j.chantierId);
    if (ch && j.numero >= (Number(ch.dureePrevueJours) || 0) && !ch.dateFinReelle) ch.dateFinReelle = j.date;
    sauverJournee(j);
    if (ch) sauverChantier(ch);
    U.toast('Journée clôturée — ' + M.texteHeures(M.dureeJourneeMn(j)), 'ok');
    chargerPhotos(j).then(function () { aller('point', { chantierId: j.chantierId, journeeId: j.id }); });
  }

  function marquerEnvoye(j) {
    var dejaEnvoye = !!j.envoiLe;                  /* premier envoi ou correction ? */
    j.envoiLe = new Date().toISOString();
    j.nbEnvois = (Number(j.nbEnvois) || 0) + 1;
    if (dejaEnvoye) j.version = (Number(j.version) || 1) + 1;   /* v2, v3… après correction */
    j.statut = 'CLOTUREE';
    sauverJournee(j).then(function () {
      U.feuille({
        titre: 'Point du soir envoyé',
        contenu: '<p class="texte">La journée est verrouillée et le point est dans votre messagerie, prêt à partir.</p>' +
          '<p class="mini">Pour corriger après envoi : rouvrez la journée (Journal → Rouvrir). Le point suivant portera la mention « version 2 ».</p>',
        boutons: [{ libelle: 'Terminer', classe: 'p', action: function (ov, fermer) { fermer(); aller('accueil'); } }]
      });
    });
  }

  /* ============================== Évènements =========================== */

  function surClic(e) {
    var b = e.target.closest('[data-a]');
    if (!b) return;
    var a = b.getAttribute('data-a');
    var fn = actions[a];
    if (!fn) return;
    e.preventDefault();
    U.vibrer();
    try { fn(b); } catch (err) {
      console.error(err);
      U.toast('Erreur : ' + (err && err.message ? err.message : 'action impossible'), 'erreur');
    }
  }

  function cibleSaisie(el) {
    var cible = el.getAttribute('data-cible') || 'journee';
    if (cible === 'journee') return journeeCourante();
    if (cible === 'chantier') return chantierCourant();
    if (cible === 'session') return null;
    if (cible === 'nouveau') return etat.nouveau;
    if (cible === 'reglages') return etat.reglages;
    return null;
  }

  function surSaisie(e) {
    var el = e.target.closest('[data-champ]');
    if (!el) return;
    var chemin = el.getAttribute('data-champ');
    if (!chemin) return;
    var cible = cibleSaisie(el);
    if (!cible) return;
    var valeur = el.type === 'checkbox' ? el.checked : el.value;
    if (el.type === 'number' && valeur !== '') valeur = Number(valeur);
    setPath(cible, chemin, valeur);
    var cible2 = el.getAttribute('data-cible');
    if (cible2 === 'reglages') planifierSauvegarde(sauverReglages);
    else if (cible2 === 'nouveau') { /* rien : brouillon en mémoire */ }
    else planifierSauvegarde(function () {
      sauverJournee(cible);
      if (cible.chantierId) {
        var ch = chantier(cible.chantierId);
        if (ch) sauverChantier(ch);
      }
    });
  }

  function surChangement(e) {
    var el = e.target;
    /* sauvegarde immédiate des cases à cocher et listes */
    if (el.matches('[data-champ]')) {
      surSaisie(e);
      clearTimeout(minuteur);
      var cible = cibleSaisie(el);
      var c = el.getAttribute('data-cible');
      if (cible && c === 'reglages') sauverReglages();
      else if (cible && cible.id && cible.chantierId) { sauverJournee(cible); }
      else if (cible && cible.id && cible.jalons) {
        sauverChantier(cible);
        /* cocher « commercial en copie » fait apparaître ses adresses aussitôt */
        if (el.getAttribute('data-champ') === 'copieCommercial') setTimeout(rendre, 60);
      }
    }
    /* remplissage automatique du client depuis la liste importée */
    if (el.id === 'fClient') {
      var clients = (etat.reglages.listes.clients) || [];
      var trouve = clients.filter(function (x) { return (x.nom || '').toLowerCase() === String(el.value).toLowerCase(); })[0];
      if (trouve) {
        etat.nouveau.client = Object.assign({}, etat.nouveau.client, {
          nom: trouve.nom, ville: trouve.ville || etat.nouveau.client.ville,
          adresse: trouve.adresse || '', logo: ''
        });
        etat.nouveau.contacts = Object.assign({}, etat.nouveau.contacts, {
          referent: trouve.contact || '', fonction: trouve.fonction || '', tel: trouve.tel || ''
        });
        var fv = document.getElementById('fVille'); if (fv) fv.value = etat.nouveau.client.ville || '';
        var fr = document.getElementById('fRef'); if (fr) fr.value = etat.nouveau.contacts.referent || '';
        var ff = document.getElementById('fRefTel'); if (ff) ff.value = etat.nouveau.contacts.tel || '';
        U.toast('Fiche client pré-remplie', 'ok');
      }
    }
    /* import de la liste clients */
    if (el.id === 'fichierClients' && el.files && el.files[0]) {
      var f = el.files[0];
      U.lireFichier(f).then(function (texte) {
        var liste = analyserCSV(texte);
        if (!liste.length) { U.toast('Aucune ligne reconnue dans ce fichier'); return; }
        etat.reglages.listes.clients = liste;
        sauverReglages(); rendre();
        U.toast(liste.length + ' clients importés', 'ok');
      });
    }
    /* import d'une sauvegarde */
    if (el.id === 'fichierSauvegarde' && el.files && el.files[0]) {
      U.lireFichier(el.files[0]).then(function (texte) {
        var data = JSON.parse(texte);
        return Store.importerTout(data, { remplacer: true });
      }).then(function () {
        if (data.usage) Usage.importer(data.usage);
        return chargerTout();
      }).then(function () {
        U.toast('Sauvegarde restaurée', 'ok'); aller('accueil');
      }).catch(function (e2) { U.toast('Import impossible : ' + (e2.message || ''), 'erreur'); });
    }
  }

  function analyserCSV(texte) {
    var lignes = String(texte).replace(/\r/g, '').split('\n').filter(function (l) { return l.trim(); });
    if (!lignes.length) return [];
    var sep = (lignes[0].split(';').length >= lignes[0].split(',').length) ? ';' : ',';
    function decouper(l) { return l.split(sep).map(function (c) { return c.replace(/^"|"$/g, '').trim(); }); }
    var entete = decouper(lignes[0]).map(function (c) { return c.toLowerCase(); });
    function idx(mots) {
      for (var i = 0; i < entete.length; i++) {
        for (var k = 0; k < mots.length; k++) if (entete[i].indexOf(mots[k]) !== -1) return i;
      }
      return -1;
    }
    var iNom = idx(['client', 'nom', 'raison']), iVille = idx(['ville', 'cp', 'commune']),
      iAdr = idx(['adresse', 'rue']), iCont = idx(['contact', 'interlocuteur']),
      iFon = idx(['fonction']), iTel = idx(['tel', 'portable']), iMail = idx(['mail']);
    var out = [];
    for (var i = 1; i < lignes.length; i++) {
      var c = decouper(lignes[i]);
      var nom = iNom >= 0 ? c[iNom] : c[0];
      if (!nom) continue;
      out.push({
        nom: nom,
        ville: iVille >= 0 ? c[iVille] : '',
        adresse: iAdr >= 0 ? c[iAdr] : '',
        contact: iCont >= 0 ? c[iCont] : '',
        fonction: iFon >= 0 ? c[iFon] : '',
        tel: iTel >= 0 ? c[iTel] : '',
        email: iMail >= 0 ? c[iMail] : ''
      });
    }
    return out;
  }

  /* ============================ Chargement ============================= */

  function chargerTout() {
    return Promise.all([
      Store.tous(Store.ST_CHANTIERS), Store.tous(Store.ST_JOURNEES), Store.tous(Store.ST_SESSIONS)
    ]).then(function (r) {
      /* met à jour les chantiers enregistrés avec un ancien format de données */
      etat.chantiers = r[0].map(function (c) { return M.normaliserChantier(c); });
      etat.chantiers.sort(function (a, b) { return (b.updatedAt || '') < (a.updatedAt || '') ? -1 : 1; });
      etat.journees = r[1];
      etat.sessions = r[2];
    });
  }

  function init() {
    etat.reglages = Store.lireReglages();
    chargerTout().then(function () {
      rendre();
      if (Store.modeMemoire && Store.modeMemoire()) {
        U.toast('Stockage local indisponible : mode temporaire (les données ne seront pas conservées)');
      }
      /* rappel du soir */
      var r = etat.reglages.rappel || {};
      if (r.actif) {
        var h = M.maintenant();
        var js = etat.journees.filter(function (j) { return j.date === M.aujourdhui() && j.statut !== 'CLOTUREE'; });
        if (js.length && (h >= (r.heure || '16:45'))) {
          U.toast('Pensez à clôturer la journée et à envoyer le point du soir');
        }
      }
    }).catch(function (e) {
      document.getElementById('app').innerHTML = '<div class="vide">Impossible d\'ouvrir la base locale : ' + U.esc(e.message || '') + '</div>';
    });

    document.addEventListener('click', surClic);
    document.addEventListener('input', surSaisie);
    document.addEventListener('change', surChangement);

    /* dictée : boutons micro générés par les blocs de saisie */
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a="dicter"]');
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      var cible = document.getElementById(b.getAttribute('data-vers'));
      if (!cible) return;
      U.dicter(cible, function (actif) {
        b.innerHTML = actif ? I('micro', 15) + 'Écoute…' : I('micro', 15) + 'Dicter';
      });
    }, true);
  }

  /* ============================== Export App =========================== */

  global.App = {
    etat: etat,
    init: init,
    rendre: rendre,
    aller: aller,
    chantier: chantier, journee: journee, session: session,
    journeesDe: journeesDe, journeeOuverteDe: journeeOuverteDe,
    chantierCourant: chantierCourant, journeeCourante: journeeCourante,
    cumulHeures: cumulHeures, avancementDe: avancementDe, joursEcoules: joursEcoules,
    libelleJalon: libelleJalon, variationVeille: variationVeille,
    contextePoint: contextePoint, nomUtilisateur: nomUtilisateur,
    sauverChantier: sauverChantier, sauverJournee: sauverJournee, sauverSession: sauverSession,
    chargerPhotos: chargerPhotos, marquerEnvoye: marquerEnvoye
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);

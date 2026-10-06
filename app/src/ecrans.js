/* =========================================================================
   BFR-CHANTIER — ÉCRANS
   -------------------------------------------------------------------------
   Chaque fonction renvoie le HTML d'un écran. Les interactions passent par
   des attributs data-a="action" (gérés dans app.js) et data-champ (saisie).
   ========================================================================= */
(function (global) {
  'use strict';

  var M = global.Modele;
  var U = global.UI;
  /* jeu d'icônes vectorielles BFR — aucun émoji dans l'interface */
  function I(nom, taille, cls) { return (global.ICO && global.ICO.i(nom, taille, cls)) || ''; }
  var Usage = global.Usage || { populaires: function () { return []; }, resume: function () { return []; }, utilisateurCourant: function () { return ''; } };

  /* ------------------------------ fragments ---------------------------- */

  function barre(pct, classe) {
    return '<div class="barre ' + (classe || '') + '"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i></div>';
  }

  function pastille(texte, couleur, fond) {
    return '<span class="tag" style="color:' + couleur + ';background:' + fond + ';border-color:' + couleur + '33">' + U.esc(texte) + '</span>';
  }

  function statutTag(id) {
    var s = M.parId(M.STATUTS, id) || { libelle: id, couleur: '#64748b' };
    return pastille(s.libelle, s.couleur, s.couleur + '18');
  }

  function graviteTag(g) {
    var gr = M.parId(M.GRAVITES, Number(g)) || M.GRAVITES[2];
    return pastille(gr.court, gr.couleur, gr.fond);
  }

  function entete(titre, sous, retour, actionDroite) {
    return '<header class="topbar">' +
      '<div class="topbar-gauche">' +
        (retour ? '<button type="button" class="iconbtn" data-a="' + retour + '" aria-label="Retour">' + I('retour', 20) + '</button>' : '') +
        '<div><div class="topbar-titre">' + U.esc(titre) + '</div>' +
        (sous ? '<div class="topbar-sous">' + U.esc(sous) + '</div>' : '') + '</div>' +
      '</div>' +
      (actionDroite || '<button type="button" class="iconbtn" data-a="menu" aria-label="Menu">' + I('menu', 20) + '</button>') +
      '</header>';
  }

  function vide(texte) {
    return '<div class="vide">' + U.esc(texte) + '</div>';
  }

  /* ============================== 1. ACCUEIL =========================== */

  function accueil() {
    var A = global.App;
    var etat = A.etat;
    var today = M.aujourdhui();
    var enCours = etat.chantiers.filter(function (c) { return c.statut === 'EN_COURS' || c.statut === 'ATTENTE' || c.statut === 'SUSPENDU'; });
    var prevus = etat.chantiers.filter(function (c) { return c.statut === 'PREVU'; });
    var clotures = etat.chantiers.filter(function (c) { return c.statut === 'CLOTURE' || c.statut === 'RECEPTIONNE'; });

    var html = entete('BFR Chantier', 'Installation · mise en service · formation', null);

    /* alertes : journées non clôturées */
    var alertes = [];
    etat.chantiers.forEach(function (ch) {
      A.journeesDe(ch.id).forEach(function (j) {
        if (j.statut !== 'CLOTUREE' && j.date === today && (j.actions || []).length + (j.taches || []).length > 0) {
          alertes.push({ chantier: ch, journee: j });
        }
        if (j.statut !== 'CLOTUREE' && j.date < today) {
          alertes.push({ chantier: ch, journee: j, retard: true });
        }
      });
    });

    html += '<main class="contenu">';
    html += '<div class="date-du-jour">' + U.esc(M.texteDate(today)) + '</div>';

    alertes.forEach(function (a) {
      html += '<button type="button" class="carte alerte" data-a="ouvrir-journee" data-id="' + a.journee.id + '">' +
        '<div class="ligne"><div><div class="gras">' + I('alerte', 16) + ' Point du soir à envoyer' + (a.retard ? ' (en retard)' : '') + '</div>' +
        '<div class="petit">' + U.esc(a.chantier.libelle) + ' — journée du ' + U.esc(M.texteDateCourt(a.journee.date)) + '</div></div>' +
        '<span class="chev">›</span></div></button>';
    });

    /* bouton principal : démarrer la journée */
    if (enCours.length) {
      var cible = enCours[0];
      var ouverte = A.journeeOuverteDe(cible.id);
      html += '<button type="button" class="gros-bouton" data-a="' + (ouverte ? 'ouvrir-journee' : 'demarrer-journee') + '" data-id="' + (ouverte ? ouverte.id : cible.id) + '">' +
        '<span class="rond">' + I('lecture', 18) + '</span><span>' + (ouverte ? 'REPRENDRE LA JOURNÉE' : 'DÉMARRER LA JOURNÉE') +
        '<small>' + U.esc((cible.numeroAffaire ? cible.numeroAffaire + ' · ' : '') + cible.libelle) + '</small></span></button>';
    } else {
      html += '<button type="button" class="gros-bouton" data-a="nouveau">' +
        '<span class="rond">' + I('plus', 18) + '</span><span>NOUVEAU CHANTIER<small>Aucun chantier en cours</small></span></button>';
    }

    function carteChantier(ch) {
      var av = A.avancementDe(ch);
      var js = A.journeesDe(ch.id);
      var cumul = M.cumulHommesHeures(js);
      var blocs = M.blocagesOuverts(js, today).filter(function (b) { return b.blocage.statut !== 'LEVE'; });
      var ouverte = A.journeeOuverteDe(ch.id);
      return '<button type="button" class="carte" data-a="ouvrir-chantier" data-id="' + ch.id + '">' +
        '<div class="ligne"><div class="gras">' + U.esc(ch.libelle || 'Chantier') + '</div>' + statutTag(ch.statut) + '</div>' +
        '<div class="petit">' + U.esc((ch.numeroAffaire ? ch.numeroAffaire + ' · ' : '') + (ch.client && ch.client.ville ? ch.client.ville : '')) +
          ' · J' + A.joursEcoules(ch) + '/' + (ch.dureePrevueJours || '?') + ' prévues</div>' +
        barre(av) +
        '<div class="ligne petit"><span>' + I('avancement', 15) + ' ' + av + ' %</span>' +
          '<span>' + I('effectif', 15) + ' ' + (ouverte && ouverte.effectif ? ouverte.effectif.nb : ch.effectifPrevu || 0) + ' pers. · ' + U.esc(M.texteHeuresDec(cumul)) + '</span>' +
          (blocs.length ? '<span class="rouge">' + I('interdit', 14) + ' ' + blocs.length + '</span>' : '<span class="vert">aucun blocage</span>') +
        '</div></button>';
    }

    if (enCours.length) {
      html += '<h2 class="rubrique">En cours (' + enCours.length + ')</h2>';
      enCours.forEach(function (c) { html += carteChantier(c); });
    }
    if (prevus.length) {
      html += '<h2 class="rubrique">Prévus (' + prevus.length + ')</h2>';
      prevus.forEach(function (c) { html += carteChantier(c); });
    }
    if (clotures.length) {
      html += '<h2 class="rubrique">Clôturés récemment</h2>';
      clotures.slice(0, 5).forEach(function (c) { html += carteChantier(c); });
    }
    if (!etat.chantiers.length) {
      html += vide('Aucun chantier enregistré. Créez le premier avec le bouton ci-dessus.');
    }
    html += '</main>';
    html += '<div class="barre-bas">' +
      '<button type="button" class="btn s" data-a="nouveau">' + I('plus', 16) + 'Nouveau chantier</button>' +
      '<button type="button" class="btn o" data-a="point-du-soir">' + I('pointSoir', 18) + 'Point du soir</button>' +
      '</div>';
    return html;
  }

  /* ========================= 2. NOUVEAU CHANTIER ======================= */

  function nouveauChantier() {
    var A = global.App;
    var clients = (A.etat.reglages.listes && A.etat.reglages.listes.clients) || [];
    var options = clients.map(function (c) {
      return '<option value="' + U.attr(c.nom || '') + '">' + U.esc((c.ville ? c.ville + ' — ' : '') + (c.contact || '')) + '</option>';
    }).join('');

    var html = entete('Nouveau chantier', '2 minutes avec un modèle', 'accueil');
    html += '<main class="contenu">';

    html += '<div class="carte">' +
      '<label class="champ"><span class="champ-titre">Modèle de chantier</span>' +
      '<select id="fModele" data-champ="modeleId" data-cible="nouveau">' +
      '<option value="">— aucun (chantier libre) —</option>' +
      M.MODELES.map(function (m) { return '<option value="' + m.id + '">' + U.esc(m.libelle) + '</option>'; }).join('') +
      '</select></label>' +
      '<label class="champ"><span class="champ-titre">N° d\'affaire</span>' +
      '<input id="fNumero" data-champ="numeroAffaire" data-cible="nouveau" placeholder="25-0142"></label>' +
      '<label class="champ"><span class="champ-titre">Libellé du chantier *</span>' +
      '<input id="fLibelle" data-champ="libelle" data-cible="nouveau" placeholder="Ligne 3 — installation armoire et mise en service"></label>' +
      '<label class="champ"><span class="champ-titre">Type</span><select id="fType" data-champ="type" data-cible="nouveau">' +
      M.TYPES.map(function (t) { return '<option value="' + t.id + '">' + U.esc(t.libelle) + '</option>'; }).join('') +
      '</select></label>' +
      '</div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('cible', 16) + ' Client et site</h3>' +
      '<label class="champ"><span class="champ-titre">Client *</span>' +
      '<input id="fClient" list="listeClients" data-champ="client.nom" data-cible="nouveau" placeholder="3 lettres suffisent si la liste est importée">' +
      (options ? '<datalist id="listeClients">' + options + '</datalist>' : '') + '</label>' +
      (clients.length ? '<div class="petit">Liste clients : ' + clients.length + ' entrées importées.</div>'
        : '<div class="petit">Astuce : importez votre liste clients dans Menu → Réglages pour remplir cette fiche d\'un coup.</div>') +
      '<label class="champ"><span class="champ-titre">Ville</span><input id="fVille" data-champ="client.ville" data-cible="nouveau"></label>' +
      '<label class="champ"><span class="champ-titre">Lieu d\'intervention (bâtiment, ligne, atelier)</span><input id="fSite" data-champ="client.site" data-cible="nouveau"></label>' +
      '<label class="champ"><span class="champ-titre">Référent technique sur site</span><input id="fRef" data-champ="contacts.referent" data-cible="nouveau"></label>' +
      '<div class="duo">' +
      '<label class="champ"><span class="champ-titre">Fonction</span><input id="fRefFonction" data-champ="contacts.fonction" data-cible="nouveau"></label>' +
      '<label class="champ"><span class="champ-titre">Téléphone</span><input id="fRefTel" data-champ="contacts.tel" data-cible="nouveau" inputmode="tel"></label>' +
      '</div></div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('calendrier', 16) + ' Déroulement prévu</h3>' +
      '<div class="duo">' +
      '<label class="champ"><span class="champ-titre">Effectif prévu</span><input type="number" min="1" id="fEffectif" data-champ="effectifPrevu" data-cible="nouveau" value="2"></label>' +
      '<label class="champ"><span class="champ-titre">Durée prévue (jours)</span><input type="number" min="1" id="fDuree" data-champ="dureePrevueJours" data-cible="nouveau" value="5"></label>' +
      '</div>' +
      '<div class="duo">' +
      '<label class="champ"><span class="champ-titre">Début prévu</span><input type="date" id="fDebut" data-champ="dateDebutPrevue" data-cible="nouveau" value="' + M.aujourdhui() + '"></label>' +
      '<label class="champ"><span class="champ-titre">Fin prévue</span><input type="date" id="fFin" data-champ="dateFinPrevue" data-cible="nouveau"></label>' +
      '</div>' +
      '<label class="champ"><span class="champ-titre">Équipe prévue (chef de chantier, monteurs)</span><input id="fEquipe" data-champ="equipe" data-cible="nouveau"></label>' +
      '</div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('bouclier', 16) + ' Contraintes de site</h3>' +
      U.blocSaisie({ libelle: 'Horaires autorisés', champ: 'contraintes.horaires', cible: 'nouveau' }) +
      U.blocSaisie({ libelle: 'Accès, badge, plan de prévention', champ: 'contraintes.acces', cible: 'nouveau' }) +
      U.blocSaisie({ libelle: 'Consignes de sécurité', champ: 'contraintes.securite', cible: 'nouveau', lignes: true }) +
      '</div>';

    html += '</main>';
    html += '<div class="barre-bas">' +
      '<button type="button" class="btn s" data-a="accueil">Annuler</button>' +
      '<button type="button" class="btn v" data-a="creer-chantier">Créer le chantier</button>' +
      '</div>';
    return html;
  }

  /* ============================ 3. FICHE CHANTIER ====================== */

  function fiche() {
    var A = global.App;
    var ch = A.chantierCourant();
    if (!ch) return accueil();
    var onglet = A.etat.vue.onglet || 'synthese';
    var html = entete(ch.libelle || 'Chantier', (ch.numeroAffaire ? ch.numeroAffaire + ' · ' : '') + M.libelle(M.TYPES, ch.type), 'accueil',
      '<button type="button" class="iconbtn" data-a="editer-chantier" data-id="' + ch.id + '" aria-label="Modifier">' + I('crayon', 18) + '</button>');

    html += '<nav class="onglets">' +
      [['synthese', 'Synthèse'], ['journal', 'Journal'], ['materiel', 'Matériel'], ['formation', 'Formation'], ['reglages', 'Réglages']]
        .map(function (o) {
          return '<button type="button" class="onglet' + (onglet === o[0] ? ' actif' : '') + '" data-a="fiche-onglet" data-onglet="' + o[0] + '">' + o[1] + '</button>';
        }).join('') + '</nav>';

    html += '<main class="contenu">';
    if (onglet === 'synthese') html += ongletSynthese(ch);
    else if (onglet === 'journal') html += ongletJournal(ch);
    else if (onglet === 'materiel') html += ongletMateriel(ch);
    else if (onglet === 'formation') html += ongletFormation(ch);
    else html += ongletReglagesChantier(ch);
    html += '</main>';

    var ouverte = A.journeeOuverteDe(ch.id);
    html += '<div class="barre-bas">' +
      (ouverte
        ? '<button type="button" class="btn v" data-a="ouvrir-journee" data-id="' + ouverte.id + '">' + I('lecture', 16) + 'Reprendre la journée</button>'
        : '<button type="button" class="btn v" data-a="demarrer-journee" data-id="' + ch.id + '">' + I('lecture', 16) + 'Démarrer la journée</button>') +
      '</div>';
    return html;
  }

  function ongletSynthese(ch) {
    var A = global.App;
    var today = M.aujourdhui();
    var js = A.journeesDe(ch.id);
    var av = A.avancementDe(ch);
    var ouverts = M.blocagesOuverts(js, today).filter(function (b) { return b.blocage.statut !== 'LEVE'; });
    var derniere = js.length ? js[js.length - 1] : null;

    var html = '<div class="carte">' +
      '<div class="ligne"><span class="petit">' + U.esc((ch.client && ch.client.nom ? ch.client.nom : 'Client non renseigné') +
        (ch.client && ch.client.ville ? ' — ' + ch.client.ville : '')) + '</span>' + statutTag(ch.statut) + '</div>' +
      '<div class="ligne avancement-ligne"><span class="gros-chiffre">' + av + ' %</span>' +
      '<span class="petit">avancement global' + (A.variationVeille(ch) !== null ? ' (' + (A.variationVeille(ch) > 0 ? '+' : '') + A.variationVeille(ch) + ' pts)' : '') + '</span></div>' +
      barre(av, 'barre-grande') +
      '<div class="ligne petit"><span>Journée ' + A.joursEcoules(ch) + ' / ' + (ch.dureePrevueJours || '?') + '</span>' +
      '<span>' + js.length + ' journée(s) saisie(s)</span>' +
      '<span>' + U.esc(M.texteHeuresDec(M.cumulHommesHeures(js))) + '</span></div>' +
      '</div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('avancement', 16) + ' Jalons <button type="button" class="mini-btn" data-a="editer-jalons">Modifier</button></h3>';
    (ch.jalons || []).forEach(function (j) {
      var a = Number(j.avancement) || 0;
      html += '<button type="button" class="jalon-ligne" data-a="editer-jalon" data-id="' + j.id + '">' +
        '<span class="jalon-ic">' + (a >= 100 ? I('valideCercle', 18) : (a > 0 ? I('demi', 18) : I('vide', 18))) + '</span>' +
        '<span class="jalon-lib">' + U.esc(j.libelle) + '</span>' +
        '<span class="jalon-pct">' + a + ' %</span></button>';
    });
    html += '</div>';

    if (ouverts.length) {
      html += '<div class="carte bord-rouge"><h3 class="carte-titre rouge">' + I('interdit', 16) + ' Blocages ouverts (' + ouverts.length + ')</h3>';
      ouverts.forEach(function (o) {
        html += '<div class="ligne blocage-ligne">' + graviteTag(o.blocage.gravite) +
          '<div class="blocage-texte"><div>' + U.esc(o.blocage.description) + '</div>' +
          '<div class="mini">' + U.esc(M.libelle(M.DEBLOQUEURS, o.blocage.debloqueur)) +
          (o.anciennete ? ' · ' + o.anciennete + ' jour(s)' : '') + (o.persistant ? ' · ' + I('alerte', 13) + ' persistant' : '') + '</div></div>' +
          '<button type="button" class="mini-btn" data-a="lever-blocage" data-id="' + o.journeeId + '|' + o.blocage.id + '">Lever</button>' +
          '</div>';
      });
      html += '</div>';
    }

    if (derniere && derniere.prevuDemain && (derniere.prevuDemain.taches || []).length) {
      html += '<div class="carte"><h3 class="carte-titre">' + I('calendrier', 16) + ' Prochaines étapes (prévu ' + U.esc(M.texteDateCourt(derniere.date)) + ')</h3>';
      derniere.prevuDemain.taches.forEach(function (t) { html += '<div class="petit">' + I('puce', 11) + U.esc(t) + '</div>'; });
      html += '</div>';
    }

    if (derniere && derniere.synthese) {
      html += '<div class="carte"><h3 class="carte-titre">' + I('crayon', 16) + ' Dernière synthèse (' + U.esc(M.texteDateCourt(derniere.date)) + ')</h3>' +
        '<p class="texte">' + U.esc(derniere.synthese) + '</p></div>';
    }
    return html;
  }

  function ongletJournal(ch) {
    var A = global.App;
    var js = A.journeesDe(ch.id);
    if (!js.length) return vide('Aucune journée saisie pour ce chantier.');
    var today = M.aujourdhui();
    var html = '';
    js.slice().reverse().forEach(function (j) {
      var ouverts = (j.blocages || []).filter(function (b) { return b.statut !== 'LEVE'; });
      html += '<div class="carte">' +
        '<div class="ligne"><div><span class="gras">J' + j.numero + ' — ' + U.esc(M.texteDateCourt(j.date)) + '</span>' +
        '<div class="petit">' + (j.effectif && j.effectif.nb ? j.effectif.nb + ' pers. · ' : '') +
        U.esc(M.texteHeures(M.dureeJourneeMn(j))) + ' · ' + U.esc(M.texteHeuresDec(M.hommesHeures(j))) + '</div></div>' +
        pastille(j.statut === 'CLOTUREE' ? 'Clôturée' : 'En cours', j.statut === 'CLOTUREE' ? '#1c8676' : '#4a4f6b', j.statut === 'CLOTUREE' ? '#e7f2ef' : '#ecebf4') +
        '</div>' +
        (j.synthese ? '<p class="texte petit">' + U.esc(j.synthese) + '</p>' : '') +
        (ouverts.length ? '<div class="mini rouge">' + I('interdit', 12) + ' ' + ouverts.length + ' blocage(s) : ' + U.esc(ouverts.map(function (b) { return b.description; }).join(' · ')) + '</div>' : '') +
        '<div class="boutons-ligne">' +
        '<button type="button" class="btn s sm" data-a="' + (j.statut === 'CLOTUREE' ? 'rouvrir-journee' : 'ouvrir-journee') + '" data-id="' + j.id + '">' +
        (j.statut === 'CLOTUREE' ? 'Rouvrir' : 'Continuer') + '</button>' +
        '<button type="button" class="btn p sm" data-a="point-du-soir" data-id="' + j.id + '">Point du soir</button>' +
        '</div></div>';
    });
    return html;
  }

  function ongletMateriel(ch) {
    var A = global.App;
    var lignes = [];
    A.journeesDe(ch.id).forEach(function (j) {
      (j.materiel || []).forEach(function (m) { lignes.push({ m: m, j: j }); });
    });
    var html = '<div class="carte"><h3 class="carte-titre">' + I('colis', 16) + ' Matériel et approvisionnement</h3>';
    if (!lignes.length) html += '<div class="petit">Aucun élément enregistré.</div>';
    lignes.slice().reverse().forEach(function (o) {
      var e = M.parId(M.ETATS_MATERIEL, o.m.etat) || { libelle: o.m.etat, couleur: '#64748b', fond: '#f1f4f8' };
      html += '<div class="ligne mat-ligne">' + pastille(e.libelle, e.couleur, e.fond) +
        '<div class="blocage-texte"><div>' + U.esc(o.m.designation || o.m.reference || '—') + '</div>' +
        '<div class="mini">' + U.esc(o.m.reference || '') + (o.m.qte ? ' · qté ' + o.m.qte : '') +
        (o.m.besoinLe ? ' · besoin le ' + U.esc(M.texteDateCourt(o.m.besoinLe)) : '') +
        ' · J' + o.j.numero + '</div></div></div>';
    });
    html += '<button type="button" class="btn s sm" data-a="ajouter-materiel">' + I('plus', 15) + 'Ajouter un matériel</button></div>';
    return html;
  }

  function ongletFormation(ch) {
    var A = global.App;
    var sessions = A.etat.sessions.filter(function (s) { return s.chantierId === ch.id; });
    var html = '<div class="carte"><h3 class="carte-titre">' + I('chapeau', 16) + ' Sessions de formation</h3>';
    if (!sessions.length) html += '<div class="petit">Aucune session. Le compte rendu de formation est produit à partir de la session saisie ici.</div>';
    sessions.forEach(function (s) {
      var signes = (s.participants || []).filter(function (p) { return p.signature; }).length;
      html += '<div class="carte-interne">' +
        '<div class="ligne"><div><div class="gras">' + U.esc(s.intitule || 'Session') + '</div>' +
        '<div class="petit">' + U.esc(M.libelle(M.TYPES_FORMATION, s.type)) + ' · ' + U.esc(M.texteDateCourt(s.date)) +
        ' · ' + (s.dureeH || 0) + ' h</div></div>' +
        pastille('Faite', '#1c8676', '#e7f2ef') + '</div>' +
        '<div class="ligne petit"><span>' + I('effectif', 15) + ' ' + (s.participants || []).length + ' participant(s) · ' + signes + ' signé(s)</span>' +
        '<span>' + U.esc(s.lieu || '') + '</span></div>' +
        '<div class="boutons-ligne">' +
        '<button type="button" class="btn s sm" data-a="editer-formation" data-id="' + s.id + '">Modifier</button>' +
        '<button type="button" class="btn p sm" data-a="documents-formation" data-id="' + s.id + '">Documents</button>' +
        '</div></div>';
    });
    html += '<button type="button" class="btn s sm" data-a="editer-formation">' + I('plus', 15) + 'Nouvelle session de formation</button></div>';
    return html;
  }

  function ongletReglagesChantier(ch) {
    var html = '<div class="carte"><h3 class="carte-titre">' + I('reglages', 16) + ' Chantier</h3>' +
      U.blocSaisie({ libelle: 'N° d\'affaire', champ: 'numeroAffaire', cible: 'chantier' }) +
      U.blocSaisie({ libelle: 'Libellé', champ: 'libelle', cible: 'chantier' }) +
      '<label class="champ"><span class="champ-titre">Statut</span><select data-champ="statut" data-cible="chantier">' +
      M.STATUTS.map(function (s) {
        return '<option value="' + s.id + '"' + (ch.statut === s.id ? ' selected' : '') + '>' + U.esc(s.libelle) + '</option>';
      }).join('') + '</select></label>' +
      '<div class="duo">' +
      U.blocSaisie({ libelle: 'Effectif prévu', champ: 'effectifPrevu', cible: 'chantier', type: 'number', min: 1 }) +
      U.blocSaisie({ libelle: 'Durée prévue (jours)', champ: 'dureePrevueJours', cible: 'chantier', type: 'number', min: 1 }) +
      '</div>' +
      '<div class="duo">' +
      U.blocSaisie({ libelle: 'Début réel', champ: 'dateDebutReelle', cible: 'chantier', type: 'date' }) +
      U.blocSaisie({ libelle: 'Fin réelle', champ: 'dateFinReelle', cible: 'chantier', type: 'date' }) +
      '</div>' +
      U.blocSaisie({ libelle: 'Équipe prévue', champ: 'equipe', cible: 'chantier' }) +
      '</div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('cible', 16) + ' Client</h3>' +
      U.blocSaisie({ libelle: 'Client', champ: 'client.nom', cible: 'chantier' }) +
      U.blocSaisie({ libelle: 'Ville', champ: 'client.ville', cible: 'chantier' }) +
      U.blocSaisie({ libelle: 'Lieu d\'intervention', champ: 'client.site', cible: 'chantier' }) +
      U.blocSaisie({ libelle: 'Référent sur site', champ: 'contacts.referent', cible: 'chantier' }) +
      U.blocSaisie({ libelle: 'Téléphone du référent', champ: 'contacts.tel', cible: 'chantier' }) +
      '</div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('bouclier', 16) + ' Contraintes de site</h3>' +
      U.blocSaisie({ libelle: 'Horaires autorisés', champ: 'contraintes.horaires', cible: 'chantier' }) +
      U.blocSaisie({ libelle: 'Accès', champ: 'contraintes.acces', cible: 'chantier' }) +
      U.blocSaisie({ libelle: 'Consignes de sécurité', champ: 'contraintes.securite', cible: 'chantier', lignes: true }) +
      '</div>';

    /* Équipements */
    html += '<div class="carte"><h3 class="carte-titre">' + I('cle', 16) + ' Équipements concernés</h3>';
    (ch.equipements || []).forEach(function (e, i) {
      html += '<div class="ligne equip-ligne"><div><div>' + U.esc(e.designation || '—') + '</div>' +
        '<div class="mini">' + U.esc([e.modele, e.serie ? 'n° ' + e.serie : '', e.qte ? 'qté ' + e.qte : ''].filter(Boolean).join(' · ')) + '</div></div>' +
        '<button type="button" class="mini-btn" data-a="supprimer-equipement" data-index="' + i + '" aria-label="Supprimer">' + I('fermer', 15) + '</button></div>';
    });
    html += '<button type="button" class="btn s sm" data-a="ajouter-equipement">' + I('plus', 15) + 'Ajouter un équipement</button></div>';

    /* Diffusion du point du soir : adresses globales, remplaçables pour ce chantier */
    var diff = M.heritage(ch, global.App.etat.reglages);   /* adresses globales de référence */
    var propres = diff.filter(function (d) { return d.modifie; });
    var joignables = diff.filter(function (d) {
      return d.email && d.role !== 'direction' && (!d.copie || ch.copieCommercial);
    });
    html += '<div class="carte"><h3 class="carte-titre">' + I('courriel', 16) + ' Diffusion du point du soir</h3>' +
      '<div class="petit">Les adresses viennent des <b>réglages généraux</b> (Menu → Réglages → Responsables). ' +
      'Un champ rempli ici <b>remplace l\'adresse globale pour ce chantier seulement</b> : utile quand le chargé d\'affaire ' +
      'ou le référent change sur cette affaire. Laissez vide pour garder l\'adresse globale.</div>' +
      '<div class="ligne"><span class="petit">Destinataires de ce chantier</span>' +
      pastille(joignables.length ? joignables.length + ' adresse(s)' : 'aucune adresse',
        joignables.length ? '#1c8676' : '#4a4f6b', joignables.length ? '#e7f2ef' : '#ecebf4') + '</div>' +
      (propres.length ? '<div class="petit attention">' + propres.length + ' adresse(s) propre(s) à ce chantier.</div>' : '');

    M.ROLES_RESPONSABLES.forEach(function (r) {
      if (r.role === 'direction') return;                       /* la direction ne reçoit que les alertes */
      if (r.copie && !ch.copieCommercial) return;               /* commercial : seulement si l'option est cochée */
      var l = diff.filter(function (d) { return d.role === r.role; })[0];
      html += '<div class="bloc-dest">' +
        '<div class="champ-titre">' + U.esc(r.libelle) + (r.copie ? ' — en copie' : '') + '</div>' +
        U.blocSaisie({ libelle: 'Nom', champ: 'responsables.' + r.role + '.nom', cible: 'chantier', placeholder: l.nomGlobal }) +
        U.blocSaisie({
          libelle: 'E-mail', champ: 'responsables.' + r.role + '.email', cible: 'chantier',
          type: 'email', placeholder: l.emailGlobal
        }) +
        '<div class="mini">' + (l.emailGlobal
          ? 'Adresse globale : ' + U.esc(l.emailGlobal) + (l.emailChantier ? ' — <b>remplacée par celle ci-dessus</b>' : '')
          : 'Aucune adresse globale : renseignez-la ici ou dans Menu → Réglages') + '</div></div>';
    });

    html += '<label class="case-ligne"><input type="checkbox" data-champ="copieCommercial" data-cible="chantier" data-booleen="1"' +
      (ch.copieCommercial ? ' checked' : '') + '><span>Mettre le commercial en copie du point du soir (affaire par affaire)</span></label>';
    if (propres.length) {
      html += '<button type="button" class="btn s sm" data-a="adresses-globales">' + I('retour', 16) + 'Revenir aux adresses globales</button>';
    }
    html += '<div class="mini">La direction technique (alertes) se règle dans Menu → Réglages.</div></div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('alerteCercle', 16) + ' Zone sensible</h3>' +
      '<button type="button" class="btn s sm danger" data-a="supprimer-chantier" data-id="' + ch.id + '">Supprimer ce chantier et ses journées</button></div>';
    return html;
  }

  /* ============================== 4. JOURNÉE =========================== */

  function journee() {
    var A = global.App;
    var j = A.journeeCourante();
    if (!j) return accueil();
    var ch = A.chantierCourant();
    var enCours = j.statut !== 'CLOTUREE';
    var today = M.aujourdhui();

    var html = entete('J' + j.numero + ' / ' + (ch.dureePrevueJours || '?'), U.esc((ch.numeroAffaire ? ch.numeroAffaire + ' · ' : '') + ch.libelle) + ' · ' + U.esc(M.texteDateCourt(j.date)),
      'ouvrir-chantier-retour', '<button type="button" class="iconbtn" data-a="editer-journee" data-id="' + j.id + '" aria-label="Modifier la journée">' + I('crayon', 18) + '</button>');

    html += '<main class="contenu">';

    /* chrono */
    var duree = M.dureeJourneeMn(j);
    html += '<div class="chrono-bloc">' +
      '<div class="ligne"><span>' + (j.debut ? I('horloge', 15) + ' ' + U.esc(j.debut) + (j.fin ? ' → ' + U.esc(j.fin) : ' → en cours') : I('horloge', 15) + ' Journée non démarrée') + '</span>' +
      '<b>' + U.esc(M.texteHeures(duree)) + '</b></div>' +
      '<div class="boutons-ligne">' +
      (j.debut && !j.fin ? '<button type="button" class="btn s sm" data-a="pause-journee">' + I('pause', 15) + 'Pause</button>' : '') +
      (j.debut && !j.fin ? '<button type="button" class="btn o sm" data-a="terminer-journee">' + I('arret', 15) + 'Fin de journée</button>' : '') +
      (!j.debut ? '<button type="button" class="btn v sm" data-a="demarrer-horloge">' + I('lecture', 15) + 'Démarrer</button>' : '') +
      '<button type="button" class="btn s sm" data-a="ajuster-journee">' + I('crayon', 15) + 'Ajuster</button>' +
      '</div>' +
      (j.debut && !j.fin ? '<div class="mini">Heure d\'arrivée horodatée — l\'heure de départ est prise au clic sur « Fin de journée ».</div>' : '') +
      '</div>';

    /* effectif & heures */
    html += '<div class="carte"><h3 class="carte-titre">' + I('effectif', 16) + ' Effectif &amp; heures <button type="button" class="mini-btn" data-a="ajuster-journee">Modifier</button></h3>' +
      '<div class="ligne"><span>Effectif présent</span><b>' + ((j.effectif && j.effectif.nb) || 0) + ' personne(s)</b></div>' +
      (j.effectif && j.effectif.detail ? '<div class="mini">' + U.esc(j.effectif.detail) + '</div>' : '') +
      '<div class="ligne"><span>Heures de la journée</span><b>' + U.esc(M.texteHeures(duree)) + '</b></div>' +
      '<div class="ligne"><span>Total hommes-heures du jour</span><b>' + U.esc(M.texteHeuresDec(M.hommesHeures(j))) + '</b></div>' +
      '<div class="ligne petit"><span>Cumul chantier</span><span>' + U.esc(M.texteHeuresDec(A.cumulHeures(ch.id))) + '</span></div>' +
      '</div>';

    /* tâches */
    html += '<div class="carte"><h3 class="carte-titre">' + I('valideCercle', 16) + ' Tâches du jour <button type="button" class="mini-btn" data-a="ajouter-tache">' + I('plus', 14) + 'Ajouter</button></h3>';
    if (!(j.taches || []).length) html += '<div class="petit">Aucune tâche. Ajoutez ce qui est prévu ou réalisé aujourd\'hui.</div>';
    (j.taches || []).forEach(function (t) {
      var etat = M.parId(M.ETATS_TACHE, t.etat) || M.ETATS_TACHE[3];
      html += '<div class="tache-ligne etat-' + t.etat + '">' +
        '<button type="button" class="case-etat" data-a="cycle-tache" data-id="' + t.id + '">' + I(etat.icone || 'vide', 16) + '</button>' +
        '<button type="button" class="tache-corps" data-a="editer-tache" data-id="' + t.id + '">' +
        '<span class="tache-lib">' + U.esc(t.libelle) + '</span>' +
        '<span class="mini">' + U.esc([A.libelleJalon(ch, t.jalonId), t.avancement ? '+' + t.avancement + ' %' : '', t.origine === 'report' ? 'reprise de la veille' : '', t.motif].filter(Boolean).join(' · ')) + '</span>' +
        '</button></div>';
    });
    html += '</div>';

    /* actions / photos */
    html += '<div class="carte"><h3 class="carte-titre">' + I('photo', 16) + ' Actions et photos <button type="button" class="mini-btn" data-a="ajouter-action">' + I('plus', 14) + 'Ajouter</button></h3>';
    if (!(j.actions || []).length) html += '<div class="petit">Aucune action saisie. Une action = ce qui s\'est passé, avec photo si utile.</div>';
    (j.actions || []).forEach(function (a) {
      var c = M.parId(M.CATEGORIES, a.categorie) || M.CATEGORIES[5];
      html += '<button type="button" class="action-ligne" data-a="editer-action" data-id="' + a.id + '">' +
        '<span class="action-ico" style="background:' + c.fond + '">' + I(c.icone, 18) + '</span>' +
        '<span class="action-corps"><span>' + U.esc(a.texte || '(sans texte)') + '</span>' +
        '<span class="mini">' + U.esc(M.libelle(M.ACTIVITES, a.activite)) + (a.heure ? ' · ' + U.esc(a.heure) : '') + (a.photo ? ' · ' + I('photo', 13) : '') + '</span>' +
        '</span></button>';
    });
    html += '</div>';

    /* blocages */
    var blocs = j.blocages || [];
    html += '<div class="carte' + (blocs.filter(function (b) { return b.statut !== 'LEVE'; }).length ? ' bord-rouge' : '') + '">' +
      '<h3 class="carte-titre">' + I('interdit', 16) + ' Blocages <button type="button" class="mini-btn" data-a="ajouter-blocage">' + I('plus', 14) + 'Ajouter</button></h3>';
    if (!blocs.length) html += '<div class="petit">Rien ne bloque aujourd\'hui ? C\'est une bonne nouvelle — le point du soir l\'indiquera.</div>';
    blocs.forEach(function (b) {
      html += '<button type="button" class="blocage-ligne2" data-a="editer-blocage" data-id="' + b.id + '">' + graviteTag(b.gravite) +
        '<span class="blocage-texte"><span>' + U.esc(b.description) + '</span>' +
        '<span class="mini">' + U.esc(M.libelle(M.DEBLOQUEURS, b.debloqueur)) + (b.echeance ? ' · ' + U.esc(b.echeance) : '') +
        (b.statut === 'LEVE' ? ' · levé' : '') + '</span></span></button>';
    });
    html += '</div>';

    /* reports des jours précédents encore ouverts */
    var reports = M.blocagesOuverts(A.journeesDe(ch.id).filter(function (x) { return x.id !== j.id; }), j.date)
      .filter(function (o) { return o.blocage.statut !== 'LEVE'; });
    if (reports.length) {
      html += '<div class="carte bord-attention"><h3 class="carte-titre attention">Blocages encore ouverts des jours précédents</h3>';
      reports.forEach(function (o) {
        html += '<div class="ligne blocage-ligne">' + graviteTag(o.blocage.gravite) +
          '<div class="blocage-texte"><div>' + U.esc(o.blocage.description) + '</div>' +
          '<div class="mini">ouvert le ' + U.esc(M.texteDateCourt(o.blocage.ouvertLe || o.date)) + ' · ' + o.anciennete + ' jour(s)' +
          (o.persistant ? ' · ' + I('alerte', 13) + ' persistant' : '') + '</div></div>' +
          '<button type="button" class="mini-btn" data-a="lever-blocage" data-id="' + o.journeeId + '|' + o.blocage.id + '">Lever</button></div>';
      });
      html += '<div class="mini">Ils figurent en tête du point du soir tant qu\'ils ne sont pas levés.</div></div>';
    }

    /* matériel */
    html += '<div class="carte"><h3 class="carte-titre">' + I('colis', 16) + ' Matériel <button type="button" class="mini-btn" data-a="ajouter-materiel">' + I('plus', 14) + 'Ajouter</button></h3>';
    if (!(j.materiel || []).length) html += '<div class="petit">Manquant, livré, à prévoir, retour atelier…</div>';
    (j.materiel || []).forEach(function (m) {
      var e = M.parId(M.ETATS_MATERIEL, m.etat) || { libelle: m.etat, couleur: '#64748b', fond: '#f1f4f8' };
      html += '<button type="button" class="ligne mat-ligne" data-a="editer-materiel" data-id="' + m.id + '">' +
        pastille(e.libelle, e.couleur, e.fond) +
        '<span class="blocage-texte"><span>' + U.esc(m.designation || '—') + '</span>' +
        '<span class="mini">' + U.esc([m.reference, m.qte ? 'qté ' + m.qte : '', m.besoinLe ? 'besoin le ' + M.texteDateCourt(m.besoinLe) : ''].filter(Boolean).join(' · ')) + '</span></span></button>';
    });
    html += '</div>';

    /* sécurité */
    var secu = j.securite || { incidents: [], remarques: '', renseigne: false };
    html += '<div class="carte' + (secu.renseigne ? '' : ' bord-attention') + '">' +
      '<h3 class="carte-titre">' + I('bouclier', 16) + ' Sécurité <button type="button" class="mini-btn" data-a="ajouter-incident">' + I('plus', 14) + 'Incident</button></h3>';
    if (!secu.incidents.length) {
      html += '<div class="petit">' + (secu.renseigne ? I('valideCercle', 15) + ' Aucun incident ni presqu\'accident signalé.' : 'À renseigner avant la clôture.') + '</div>';
      if (!secu.renseigne) html += '<button type="button" class="btn s sm" data-a="securite-ras">Aucun incident ce jour</button>';
    } else {
      secu.incidents.forEach(function (i, idx) {
        html += '<div class="ligne blocage-ligne"><span class="rouge">' + I('bouclier', 18) + '</span><div class="blocage-texte"><div>' + U.esc(i.description) + '</div>' +
          (i.gravite ? '<div class="mini">' + U.esc(i.gravite) + '</div>' : '') + '</div>' +
          '<button type="button" class="mini-btn" data-a="supprimer-incident" data-index="' + idx + '" aria-label="Supprimer">' + I('fermer', 15) + '</button></div>';
      });
    }
    html += U.blocSaisie({ libelle: 'Remarques sécurité', champ: 'securite.remarques', cible: 'journee', lignes: true, rangees: 2 }) +
      '</div>';

    /* essais */
    html += '<div class="carte"><h3 class="carte-titre">' + I('fiole', 16) + ' Essais et contrôles <button type="button" class="mini-btn" data-a="ajouter-essai">' + I('plus', 14) + 'Ajouter</button></h3>';
    if (!(j.essais || []).length) html += '<div class="petit">Essais à blanc, essais en production, contrôles…</div>';
    /* raccourcis appris au fil des chantiers, pour cet utilisateur */
    var essaisFrequents = Usage.populaires('essai.libelle', 4);
    if (essaisFrequents.length) {
      html += '<div class="suggestion-titre">Vos essais les plus fréquents</div><div class="suggestions">' +
        essaisFrequents.map(function (p) {
          return '<button type="button" class="suggestion" data-a="essai-rapide" data-valeur="' + U.attr(p.valeur) + '">' +
            U.esc(p.valeur) + ' <span class="n">×' + p.n + '</span></button>';
        }).join('') + '</div>';
    } else {
      html += '<div class="mini">La liste déroulante propose les essais et contrôles courants ; ensuite l\'application retiendra les vôtres.</div>';
    }
    (j.essais || []).forEach(function (e) {
      var r = M.parId(M.RESULTATS_ESSAI, e.resultat) || { libelle: e.resultat, couleur: '#64748b', fond: '#f1f4f8' };
      html += '<button type="button" class="ligne mat-ligne" data-a="editer-essai" data-id="' + e.id + '">' + pastille(r.libelle, r.couleur, r.fond) +
        '<span class="blocage-texte"><span>' + U.esc(e.libelle || '—') + '</span>' +
        (e.mesures ? '<span class="mini">' + U.esc(e.mesures) + '</span>' : '') + '</span></button>';
    });
    html += '</div>';

    /* coactivité */
    html += '<div class="carte"><h3 class="carte-titre">' + I('reunion', 16) + ' Coactivité <button type="button" class="mini-btn" data-a="ajouter-coactivite">' + I('plus', 14) + 'Ajouter</button></h3>';
    if (!(j.coactivite || []).length) html += '<div class="petit">Autres entreprises présentes sur site.</div>';
    (j.coactivite || []).forEach(function (co, idx) {
      html += '<div class="ligne mat-ligne"><div class="blocage-texte"><div>' + U.esc(co.entreprise || '—') +
        (co.effectif ? ' · ' + U.esc(co.effectif) + ' pers.' : '') + '</div>' +
        (co.remarque ? '<div class="mini">' + U.esc(co.remarque) + '</div>' : '') + '</div>' +
        '<button type="button" class="mini-btn" data-a="supprimer-coactivite" data-index="' + idx + '" aria-label="Supprimer">' + I('fermer', 15) + '</button></div>';
    });
    html += '</div>';

    /* formation du jour */
    html += '<div class="carte"><h3 class="carte-titre">' + I('chapeau', 16) + ' Formation du jour</h3>';
    if (j.formation) {
      html += '<div class="ligne"><div><div class="gras">' + U.esc(j.formation.intitule || 'Session') + '</div>' +
        '<div class="petit">' + (j.formation.participants || []).length + ' participant(s) · ' + (j.formation.dureeH || 0) + ' h · ' +
        U.esc(j.formation.formateur || '') + '</div></div>' +
        '<button type="button" class="mini-btn" data-a="detacher-formation">Détacher</button></div>' +
        '<div class="mini">' + (j.formation.participants || []).filter(function (p) { return p.signature; }).length + ' signature(s) recueillie(s).</div>';
    } else {
      html += '<div class="petit">Aucune formation ce jour.</div>' +
        '<button type="button" class="btn s sm" data-a="editer-formation">' + I('plus', 15) + 'Saisir une session</button>';
    }
    html += '</div>';

    /* prévu demain */
    var pd = j.prevuDemain || { taches: [], besoins: [] };
    html += '<div class="carte"><h3 class="carte-titre">' + I('calendrier', 16) + ' Prévu demain <button type="button" class="mini-btn" data-a="ajouter-prevision">' + I('plus', 14) + 'Tâche</button></h3>';
    if (!(pd.taches || []).length) html += '<div class="petit">Indispensable : c\'est ce qui sera repris demain matin et lu par les responsables.</div>';
    (pd.taches || []).forEach(function (t, idx) {
      html += '<div class="ligne mat-ligne"><span>' + I('puce', 11) + U.esc(t) + '</span>' +
        '<button type="button" class="mini-btn" data-a="supprimer-prevision" data-index="' + idx + '" aria-label="Supprimer">' + I('fermer', 15) + '</button></div>';
    });
    html += '<div class="duo">' +
      U.blocSaisie({ libelle: 'Effectif prévu demain', champ: 'prevuDemain.effectif', cible: 'journee', type: 'number', min: 0 }) +
      '</div>';
    html += '<h4 class="sous-titre">Besoins (outillage, accès, renfort, décision)</h4>';
    (pd.besoins || []).forEach(function (b, idx) {
      html += '<div class="ligne mat-ligne"><span>' + I('puce', 11) + U.esc(b) + '</span>' +
        '<button type="button" class="mini-btn" data-a="supprimer-besoin" data-index="' + idx + '" aria-label="Supprimer">' + I('fermer', 15) + '</button></div>';
    });
    html += '<button type="button" class="btn s sm" data-a="ajouter-besoin">' + I('plus', 15) + 'Ajouter un besoin</button></div>';

    /* synthèse */
    html += '<div class="carte"><h3 class="carte-titre">' + I('crayon', 16) + ' Synthèse du jour</h3>' +
      U.blocSaisie({
        libelle: 'L\'essentiel en quelques lignes (ou dicté)', champ: 'synthese', cible: 'journee',
        lignes: true, rangees: 4, dictee: true, placeholder: 'Montage terminé, câblage à 80 %…'
      }) + '</div>';

    html += '</main>';

    html += '<div class="barre-bas">' +
      '<button type="button" class="btn s sm" data-a="ajouter-action">' + I('plus', 15) + 'Action</button>' +
      '<button type="button" class="btn s sm" data-a="ajouter-blocage">' + I('interdit', 15) + 'Blocage</button>' +
      (enCours
        ? '<button type="button" class="btn o" data-a="cloturer-journee">' + I('pointSoir', 17) + 'Clôturer</button>'
        : '<button type="button" class="btn p" data-a="point-du-soir" data-id="' + j.id + '">' + I('document', 17) + 'Point du soir</button>') +
      '</div>';
    return html;
  }

  /* =========================== 5. POINT DU SOIR ======================== */

  function pointSoir() {
    var A = global.App;
    var j = A.journeeCourante();
    if (!j) return accueil();
    var ch = A.chantierCourant();
    var ctx = A.contextePoint(j);
    var dest = ctx.destinataires;
    var c = M.compteurs(j, ctx.cumul);
    var msg = global.PointSoir.message(ctx);

    var html = entete('Point du soir — J' + j.numero, U.esc(ch.libelle) + ' · ' + U.esc(M.texteDateCourt(j.date)), 'fermer-point',
      '<button type="button" class="iconbtn" data-a="ouvrir-journee" data-id="' + j.id + '" aria-label="Modifier la journée">' + I('crayon', 18) + '</button>');

    html += '<main class="contenu">';
    html += '<div class="carte info">Tout est construit à partir de la journée. Complétez la synthèse si besoin, vérifiez les destinataires, puis envoyez.</div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('crayon', 16) + ' Synthèse du jour</h3>' +
      U.blocSaisie({
        libelle: 'Lu par les responsables — 3 à 5 lignes', champ: 'synthese', cible: 'journee',
        lignes: true, rangees: 4, dictee: true, valeur: j.synthese
      }) + '</div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('document', 16) + ' Ce que dit le point</h3>' +
      '<div class="ligne"><span>' + I('avancement', 15) + ' Avancement global</span><b>' + ctx.avancement + ' %' +
      (ctx.variation !== null ? ' (' + (ctx.variation > 0 ? '+' : '') + ctx.variation + ' pts)' : '') + '</b></div>' +
      '<div class="ligne"><span>' + I('effectif', 15) + ' Effectif</span><b>' + ((j.effectif && j.effectif.nb) || 0) + ' pers. · ' + U.esc(M.texteHeuresDec(c.hommesHeures)) + '</b></div>' +
      '<div class="ligne"><span>' + I('interdit', 15) + ' Blocages ouverts</span>' + (c.blocages ? pastille(String(c.blocages), '#b42318', '#fbeceb') : pastille('aucun', '#1c8676', '#e7f2ef')) + '</div>' +
      '<div class="ligne"><span>' + I('colis', 15) + ' Matériel manquant</span>' + (c.manquants ? pastille(String(c.manquants), '#4a4f6b', '#ecebf4') : pastille('aucun', '#1c8676', '#e7f2ef')) + '</div>' +
      '<div class="ligne"><span>' + I('bouclier', 15) + ' Sécurité</span>' + (c.incidents ? pastille(c.incidents + ' incident(s)', '#b42318', '#fbeceb') : pastille('aucun incident', '#1c8676', '#e7f2ef')) + '</div>' +
      (c.essais ? '<div class="ligne"><span>' + I('fiole', 15) + ' Essais</span>' + pastille(c.essais + ' dont ' + c.essaisNok + ' NOK', c.essaisNok ? '#4a4f6b' : '#1c8676', c.essaisNok ? '#ecebf4' : '#e7f2ef') + '</div>' : '') +
      (c.formation ? '<div class="ligne"><span>' + I('chapeau', 15) + ' Formation</span>' + pastille(c.formation + ' participant(s)', '#0b5f80', '#eef8fd') + '</div>' : '') +
      '</div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('courriel', 16) + ' Destinataires (' + dest.length + ')' +
      '<button type="button" class="mini-btn" data-a="reglages">Général</button>' +
      '<button type="button" class="mini-btn" data-a="adresses-chantier">Ce chantier</button></h3>';
    if (!dest.length) {
      html += '<div class="petit attention">Aucun destinataire enregistré : renseignez les adresses dans Menu → Réglages → Responsables, ' +
        'ou pour ce chantier seulement dans sa fiche → onglet Réglages.</div>';
    }
    dest.forEach(function (d) {
      html += '<div class="ligne dest-ligne"><span>' + U.esc(d.libelle) + (d.nom ? ' — ' + U.esc(d.nom) : '') +
        (d.email ? '<br><span class="mini">' + U.esc(d.email) + '</span>' : '') + '</span>' +
        (d.copie ? pastille('en copie', '#64748b', '#f1f4f8') : (d.email ? pastille('à', '#0b5f80', '#eef8fd') : pastille('sans e-mail', '#4a4f6b', '#ecebf4'))) +
        (d.origine === 'chantier' ? pastille('adresse du chantier', '#332e72', '#e9e8f4') : '') + '</div>';
    });
    html += '<div class="mini">Les adresses viennent des réglages généraux ; celles marquées « adresse du chantier » ' +
      'ont été remplacées dans la fiche de ce chantier. Le commercial n\'est en copie que si l\'option est cochée pour ce chantier.</div></div>';

    var alertes = M.alerteGrave(j);
    if (alertes.alerte) {
      html += '<div class="carte bord-rouge"><h3 class="carte-titre rouge">' + I('alerteCercle', 16) + ' Escalade déclenchée</h3>' +
        '<div class="petit">' + (alertes.gravite1.length ? alertes.gravite1.length + ' blocage(s) de gravité 1 — objet du mail : « ACTION ATTENDUE SOUS 24 H ». ' : '') +
        (alertes.securite.length ? alertes.securite.length + ' incident(s) de sécurité — copie direction technique. ' : '') + '</div></div>';
    }

    html += '<div class="carte"><h3 class="carte-titre">' + I('courriel', 16) + ' Objet du mail</h3><div class="texte">' + U.esc(msg.objet) + '</div></div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('apercu', 16) + ' Aperçu du document</h3>' +
      '<div id="apercuPoint" class="apercu"><div class="petit">Génération de l\'aperçu…</div></div></div>';

    html += '</main>';

    html += '<div class="barre-bas">' +
      '<button type="button" class="btn s sm" data-a="point-pdf">' + I('telecharger', 16) + 'PDF</button>' +
      '<button type="button" class="btn s sm" data-a="point-copier">' + I('copie', 16) + 'Texte</button>' +
      '<button type="button" class="btn p" data-a="point-envoyer">' + I('envoi', 17) + 'Envoyer</button>' +
      '</div>';
    return html;
  }

  /* ============================= 6. RÉGLAGES =========================== */

  function reglages() {
    var A = global.App;
    var S = A.etat.reglages;
    var html = entete('Réglages', 'Société, responsables, sauvegarde', 'accueil');

    html += '<main class="contenu">';

    html += '<div class="carte"><h3 class="carte-titre">' + I('effectif', 16) + ' Chef de chantier (utilisateur)</h3>' +
      '<div class="duo">' + U.blocSaisie({ libelle: 'Prénom', champ: 'utilisateur.prenom', cible: 'reglages' }) +
      U.blocSaisie({ libelle: 'Nom', champ: 'utilisateur.nom', cible: 'reglages' }) + '</div>' +
      U.blocSaisie({ libelle: 'Fonction', champ: 'utilisateur.fonction', cible: 'reglages' }) +
      U.blocSaisie({ libelle: 'Téléphone', champ: 'utilisateur.tel', cible: 'reglages', inputmode: 'tel' }) +
      U.blocSaisie({ libelle: 'E-mail', champ: 'utilisateur.email', cible: 'reglages', type: 'email' }) +
      '<div class="ligne"><span class="petit">Signature (utilisée sur les attestations de formation)</span>' +
      '<button type="button" class="mini-btn" data-a="signature-utilisateur">' + (S.utilisateur.signature ? 'Modifier' : 'Signer') + '</button></div>' +
      (S.utilisateur.signature ? '<img class="signature-apercu" src="' + U.attr(S.utilisateur.signature) + '" alt="signature">' : '') +
      '</div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('courriel', 16) + ' Responsables (destinataires du point du soir)</h3>' +
      '<div class="petit">Adresses <b>enregistrées une fois pour toutes</b> : elles servent à tous les chantiers. ' +
      'Sur un chantier précis, vous pouvez les remplacer depuis sa fiche → onglet <b>Réglages</b> → « Diffusion du point du soir ». ' +
      'Le responsable BE électrotechnique figure toujours dans les destinataires.</div>';
    M.ROLES_RESPONSABLES.forEach(function (r) {
      html += U.blocSaisie({ libelle: r.libelle + ' — nom', champ: 'responsables.' + r.role + '.nom', cible: 'reglages' }) +
        U.blocSaisie({
          libelle: r.libelle + ' — e-mail' + (r.precision ? ' (' + r.precision + ')' : ''),
          champ: 'responsables.' + r.role + '.email', cible: 'reglages', type: 'email'
        });
    });
    /* contrôle des adresses : un oubli ou une coquille se voit tout de suite */
    var adressesOk = 0, soucis = [];
    M.ROLES_RESPONSABLES.forEach(function (r) {
      var v = ((S.responsables || {})[r.role] || {}).email || '';
      if (!v) { if (r.systematique) soucis.push('à renseigner : ' + r.libelle); return; }
      if (!M.emailValide(v)) soucis.push('à vérifier : ' + r.libelle);
      else adressesOk++;
    });
    html += '<div class="ligne"><span class="petit">Adresses valides enregistrées</span>' +
      pastille(adressesOk + ' / ' + M.ROLES_RESPONSABLES.length, adressesOk ? '#1c8676' : '#4a4f6b',
        adressesOk ? '#e7f2ef' : '#ecebf4') + '</div>';
    if (soucis.length) html += '<div class="petit attention">' + U.esc(soucis.join(' · ')) + '</div>';
    html += '</div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('accueil', 16) + ' Société</h3>' +
      U.blocSaisie({ libelle: 'Raison sociale', champ: 'societe.nom', cible: 'reglages' }) +
      '<div class="duo">' + U.blocSaisie({ libelle: 'Adresse', champ: 'societe.adresse', cible: 'reglages' }) +
      U.blocSaisie({ libelle: 'Code postal et ville', champ: 'societe.cpVille', cible: 'reglages' }) + '</div>' +
      '<div class="duo">' + U.blocSaisie({ libelle: 'Téléphone', champ: 'societe.tel', cible: 'reglages' }) +
      U.blocSaisie({ libelle: 'Site web', champ: 'societe.siteWeb', cible: 'reglages' }) + '</div>' +
      U.blocSaisie({ libelle: 'E-mail', champ: 'societe.email', cible: 'reglages', type: 'email' }) +
      '</div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('alerte', 16) + ' Rappel du soir</h3>' +
      '<label class="case-ligne"><input type="checkbox" data-champ="rappel.actif" data-cible="reglages" data-booleen="1"' +
      (S.rappel.actif ? ' checked' : '') + '><span>Me rappeler de clôturer la journée</span></label>' +
      '<div class="duo">' + U.blocSaisie({ libelle: 'Premier rappel', champ: 'rappel.heure', cible: 'reglages', type: 'time' }) +
      U.blocSaisie({ libelle: 'Second rappel', champ: 'rappel.heure2', cible: 'reglages', type: 'time' }) + '</div>' +
      '<div class="mini">Le rappel s\'affiche à l\'ouverture de l\'application après l\'heure choisie.</div></div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('effectif', 16) + ' Liste clients</h3>' +
      '<div class="petit">' + ((S.listes.clients || []).length ? (S.listes.clients.length + ' entrée(s) importée(s) — l\'autocomplétion fonctionne dans la fiche chantier.') : 'Importez l\'export CSV de votre liste clients pour remplir les fiches en 3 lettres.') + '</div>' +
      '<label class="btn s sm" style="display:inline-block">Importer un CSV<input type="file" accept=".csv,text/csv" id="fichierClients" style="display:none"></label>' +
      ((S.listes.clients || []).length ? '<button type="button" class="btn s sm danger" data-a="vider-clients">Vider la liste</button>' : '') +
      '</div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('etoile', 16) + ' Mes habitudes de saisie</h3>';
    var qui = Usage.utilisateurCourant();
    if (!qui || qui === '(sans nom)') {
      html += '<div class="petit attention">Renseignez votre prénom et votre nom ci-dessus : l\'application mémorisera alors, pour vous, les essais, tâches et matériels que vous saisissez le plus souvent.</div>';
    } else {
      html += '<div class="petit">Utilisateur : <b>' + U.esc(qui) + '</b>. Les raccourcis sont mémorisés dans ce téléphone, <b>utilisateur par utilisateur</b>.</div>';
    }
    var habitudes = Usage.resume();
    if (!habitudes.length) {
      html += '<div class="mini">Rien de mémorisé pour l\'instant. Au fil des saisies, vos essais et contrôles habituels remonteront en tête de la liste déroulante, et vos tâches, matériels et entreprises sur site seront proposés automatiquement.</div>';
    } else {
      habitudes.forEach(function (r) {
        html += '<div class="habitudes-ligne"><div class="gras" style="font-size:13px">' + U.esc(r.libelle) +
          ' <span class="mini">— ' + r.total + ' valeur' + (r.total > 1 ? 's' : '') + ' mémorisée' + (r.total > 1 ? 's' : '') + '</span></div>' +
          '<div class="suggestions">' + r.principaux.map(function (p2) {
            return '<span class="suggestion">' + U.esc(p2.valeur) + ' <span class="n">×' + p2.n + '</span></span>';
          }).join('') + '</div></div>';
      });
      html += '<button type="button" class="btn s sm danger" data-a="reinitialiser-habitudes">Oublier mes saisies mémorisées</button>';
    }
    html += '</div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('telecharger', 16) + ' Sauvegarde</h3>' +
      '<div class="petit">Tout est enregistré dans le téléphone. Exportez régulièrement le fichier de sauvegarde.</div>' +
      '<div class="boutons-ligne">' +
      '<button type="button" class="btn p sm" data-a="exporter">' + I('telecharger', 16) + 'Exporter la sauvegarde</button>' +
      '<label class="btn s sm" style="display:inline-block">' + I('televerser', 16) + 'Importer<input type="file" accept=".json,application/json" id="fichierSauvegarde" style="display:none"></label>' +
      '</div></div>';

    html += '<div class="carte"><h3 class="carte-titre">' + I('aide', 16) + ' Application</h3>' +
      '<div class="ligne petit"><span>Version</span><span id="versionApp">—</span></div>' +
      '<div class="ligne petit"><span>Chantiers enregistrés</span><span>' + A.etat.chantiers.length + '</span></div>' +
      '<div class="ligne petit"><span>Journées enregistrées</span><span>' + A.etat.journees.length + '</span></div>' +
      '<div class="ligne petit"><span>Sessions de formation</span><span>' + A.etat.sessions.length + '</span></div>' +
      '<button type="button" class="btn s sm" data-a="mode-emploi">Mode d\'emploi</button>' +
      '</div>';

    html += '</main>';
    html += '<div class="barre-bas"><button type="button" class="btn s" data-a="accueil">Retour</button></div>';
    return html;
  }

  global.Ecrans = {
    accueil: accueil, nouveauChantier: nouveauChantier, fiche: fiche, journee: journee,
    pointSoir: pointSoir, reglages: reglages,
    barre: barre, pastille: pastille, statutTag: statutTag, graviteTag: graviteTag,
    entete: entete, vide: vide
  };
})(window);

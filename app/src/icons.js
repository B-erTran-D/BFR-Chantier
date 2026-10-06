/* =========================================================================
   ICÔNES BFR SYSTEMS — jeu vectoriel monochrome et duotone
   -------------------------------------------------------------------------
   Aucun émoji dans l'interface : toutes les vignettes sont des tracés SVG
   dessinés sur une grille de 24 px, à la couleur du texte (currentColor).
   Deux versions :
     · monochrome — trait seul, pour les listes, les champs et les boutons ;
     · duotone    — même tracé, avec une forme de fond à 14 % d'opacité,
                    réservée aux en-têtes de carte et aux états.
   Usage : ICO.nom(taille, classe)  ·  ICO.texte(nom, libellé, taille)
   Les fonctions « domaine / activite / categorie / etatTache / resultat /
   jalon » traduisent les identifiants du modèle en icônes.
   ========================================================================= */

(function (root) {
  'use strict';

  var OUVERT = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

  /* --- fabriques -------------------------------------------------------- */

  function svg(trace, sz, cls) {
    var s = sz || 18;
    return '<svg class="' + (cls || 'bfr-ico') + '" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" ' +
      'aria-hidden="true" ' + OUVERT + '>' + trace + '</svg>';
  }

  /* duotone : forme de fond discrète + tracé net */
  function duo(fond, trace, sz, cls) {
    var s = sz || 20;
    return '<svg class="' + (cls || 'bfr-ico bfr-ico-duo') + '" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" ' +
      'aria-hidden="true" ' + OUVERT + '>' +
      '<g fill="currentColor" stroke="none" opacity=".14">' + fond + '</g>' +
      '<g>' + trace + '</g></svg>';
  }

  /* disque plein : sert aux formes de fond du duotone */
  function disque(cx, cy, r) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>'; }

  var ICO = {
    /* ------------------------------ navigation ------------------------- */
    menu: function (sz, cls) {
      return svg('<line x1="3.5" y1="7" x2="20.5" y2="7"/><line x1="3.5" y1="12" x2="20.5" y2="12"/><line x1="3.5" y1="17" x2="20.5" y2="17"/>', sz || 22, cls);
    },
    retour: function (sz, cls) {
      return svg('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="11 18 5 12 11 6"/>', sz || 20, cls);
    },
    fermer: function (sz, cls) {
      return svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>', sz || 18, cls);
    },
    suivant: function (sz, cls) {
      return svg('<polyline points="9 18 15 12 9 6"/>', sz || 18, cls);
    },
    bas: function (sz, cls) {
      return svg('<polyline points="6 9 12 15 18 9"/>', sz || 18, cls);
    },
    /* compatibilité avec l'éditeur photo */
    close: function (sz, cls) { return ICO.fermer(sz || 20, cls); },

    /* ------------------------------- repères --------------------------- */
    accueil: function (sz, cls) {
      return duo(disque(12, 12, 11),
        '<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/><polyline points="9.5 20.5 9.5 14 14.5 14 14.5 20.5"/>', sz || 20, cls);
    },
    reglages: function (sz, cls) {
      return svg('<line x1="5" y1="20" x2="5" y2="13"/><line x1="5" y1="9.5" x2="5" y2="4"/>' +
        '<line x1="12" y1="20" x2="12" y2="15.5"/><line x1="12" y1="12" x2="12" y2="4"/>' +
        '<line x1="19" y1="20" x2="19" y2="11"/><line x1="19" y1="7.5" x2="19" y2="4"/>' +
        '<circle cx="5" cy="11.2" r="1.8"/><circle cx="12" cy="13.7" r="1.8"/><circle cx="19" cy="9.2" r="1.8"/>', sz || 20, cls);
    },
    modeEmploi: function (sz, cls) {
      return duo('<path d="M2.5 4.5h6.5a4 4 0 0 1 3 1.4 4 4 0 0 1 3-1.4h6.5v13H15a3 3 0 0 0-3 1.5 3 3 0 0 0-3-1.5H2.5z"/>',
        '<path d="M2.5 4.5h6.5a4 4 0 0 1 3 1.4 4 4 0 0 1 3-1.4h6.5v13H15a3 3 0 0 0-3 1.5 3 3 0 0 0-3-1.5H2.5z"/><line x1="12" y1="6.5" x2="12" y2="17.5"/>', sz || 20, cls);
    },
    calendrier: function (sz, cls) {
      return svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><line x1="3.5" y1="10" x2="20.5" y2="10"/>' +
        '<line x1="8" y1="3" x2="8" y2="6.5"/><line x1="16" y1="3" x2="16" y2="6.5"/>', sz || 20, cls);
    },
    horloge: function (sz, cls) {
      return svg('<circle cx="12" cy="12" r="8.5"/><polyline points="12 7.5 12 12.2 15.5 14"/>', sz || 18, cls);
    },
    pointSoir: function (sz, cls) {
      return duo('<path d="M20.5 14.2A8.7 8.7 0 0 1 9.8 3.5 9.2 9.2 0 1 0 20.5 14.2z"/>',
        '<path d="M20.5 14.2A8.7 8.7 0 0 1 9.8 3.5 9.2 9.2 0 1 0 20.5 14.2z"/>', sz || 20, cls);
    },
    avancement: function (sz, cls) {
      return svg('<polyline points="3.5 17 9 11.5 13 15.5 20.5 8"/><polyline points="15.5 8 20.5 8 20.5 13"/>', sz || 18, cls);
    },
    effectif: function (sz, cls) {
      return svg('<circle cx="9" cy="8.5" r="3.5"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/>' +
        '<path d="M16 5.2a3.3 3.3 0 0 1 0 6.6"/><path d="M17.5 14.8c2.1.6 3.5 2.3 3.5 4.7"/>', sz || 18, cls);
    },

    /* -------------------------------- états ---------------------------- */
    valide: function (sz, cls) {
      return svg('<polyline points="19.5 7 9.5 17.5 4.5 12.5"/>', sz || 18, cls);
    },
    valideCercle: function (sz, cls) {
      return duo(disque(12, 12, 10.5), '<circle cx="12" cy="12" r="9"/><polyline points="16 9 10.8 15 8 12.2"/>', sz || 20, cls);
    },
    refuseCercle: function (sz, cls) {
      return duo(disque(12, 12, 10.5), '<circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>', sz || 20, cls);
    },
    demi: function (sz, cls) {
      return svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/>', sz || 20, cls);
    },
    vide: function (sz, cls) {
      return svg('<circle cx="12" cy="12" r="9"/>', sz || 20, cls);
    },
    alerte: function (sz, cls) {
      return duo('<path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
        '<path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9.5" x2="12" y2="13.5"/><line x1="12" y1="17" x2="12.01" y2="17"/>', sz || 20, cls);
    },
    alerteCercle: function (sz, cls) {
      return duo(disque(12, 12, 10.5), '<circle cx="12" cy="12" r="9"/><line x1="12" y1="7.5" x2="12" y2="12.5"/><line x1="12" y1="16" x2="12.01" y2="16"/>', sz || 20, cls);
    },
    interdit: function (sz, cls) {
      return duo(disque(12, 12, 10.5), '<circle cx="12" cy="12" r="9"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/>', sz || 20, cls);
    },
    bouclier: function (sz, cls) {
      return duo('<path d="M12 21.5s8-3.8 8-9.5V5.4l-8-2.9-8 2.9V12c0 5.7 8 9.5 8 9.5z"/>',
        '<path d="M12 21.5s8-3.8 8-9.5V5.4l-8-2.9-8 2.9V12c0 5.7 8 9.5 8 9.5z"/><line x1="12" y1="8.5" x2="12" y2="12.5"/><line x1="12" y1="15.5" x2="12.01" y2="15.5"/>', sz || 20, cls);
    },
    information: function (sz, cls) {
      return duo(disque(12, 12, 10.5), '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/>', sz || 20, cls);
    },

    /* ---------------------------- chantier / matériel ------------------- */
    cle: function (sz, cls) { /* montage */
      return svg('<path d="M14.6 6.4a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.7-3.7a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>', sz || 20, cls);
    },
    eclaire: function (sz, cls) { /* câblage */
      return duo('<polygon points="13.5 2.5 4.5 13.5 11.5 13.5 10.5 21.5 19.5 10.5 12.5 10.5"/>',
        '<polygon points="13.5 2.5 4.5 13.5 11.5 13.5 10.5 21.5 19.5 10.5 12.5 10.5"/>', sz || 20, cls);
    },
    prise: function (sz, cls) { /* raccordement */
      return svg('<line x1="9" y1="3" x2="9" y2="8"/><line x1="15" y1="3" x2="15" y2="8"/>' +
        '<path d="M6.5 8h11v2.5a5.5 5.5 0 0 1-11 0z"/><line x1="12" y1="16" x2="12" y2="21"/>', sz || 20, cls);
    },
    automate: function (sz, cls) { /* paramétrage / automatisme */
      return duo('<rect x="7.5" y="7.5" width="9" height="9" rx="1.6"/>',
        '<rect x="7.5" y="7.5" width="9" height="9" rx="1.6"/><rect x="10.4" y="10.4" width="3.2" height="3.2" rx=".6"/>' +
        '<line x1="10" y1="3.5" x2="10" y2="7.5"/><line x1="14" y1="3.5" x2="14" y2="7.5"/>' +
        '<line x1="10" y1="16.5" x2="10" y2="20.5"/><line x1="14" y1="16.5" x2="14" y2="20.5"/>' +
        '<line x1="3.5" y1="10" x2="7.5" y2="10"/><line x1="3.5" y1="14" x2="7.5" y2="14"/>' +
        '<line x1="16.5" y1="10" x2="20.5" y2="10"/><line x1="16.5" y1="14" x2="20.5" y2="14"/>', sz || 20, cls);
    },
    fiole: function (sz, cls) { /* essais et contrôles */
      return duo('<path d="M9.5 3h5v6.6l5 8a2 2 0 0 1-1.7 3H6.2a2 2 0 0 1-1.7-3l5-8z"/>',
        '<path d="M9.5 3h5v6.6l5 8a2 2 0 0 1-1.7 3H6.2a2 2 0 0 1-1.7-3l5-8z"/>' +
        '<line x1="9.5" y1="3" x2="14.5" y2="3"/><line x1="6.6" y1="14.5" x2="17.4" y2="14.5"/>', sz || 20, cls);
    },
    grue: function (sz, cls) { /* levage / manutention */
      return svg('<line x1="5.5" y1="20.5" x2="5.5" y2="4.5"/><line x1="2.5" y1="20.5" x2="8.5" y2="20.5"/>' +
        '<line x1="5.5" y1="4.5" x2="20" y2="4.5"/><line x1="5.5" y1="4.5" x2="3.2" y2="8.2"/>' +
        '<rect x="14.6" y="7.6" width="4.4" height="3.6" rx=".8"/>' +
        '<line x1="17.8" y1="4.5" x2="17.8" y2="7.6"/><line x1="17.8" y1="11.2" x2="17.8" y2="13.6"/>' +
        '<path d="M16 13.6h3.6"/>', sz || 20, cls);
    },
    chapeau: function (sz, cls) { /* formation */
      return duo('<path d="M12 5 2.5 9.5 12 14l9.5-4.5z"/>',
        '<path d="M12 5 2.5 9.5 12 14l9.5-4.5z"/><path d="M6.5 11.5v4.8c0 1.5 2.5 2.7 5.5 2.7s5.5-1.2 5.5-2.7v-4.8"/><line x1="21.5" y1="9.5" x2="21.5" y2="14"/>', sz || 20, cls);
    },
    itineraire: function (sz, cls) { /* déplacement */
      return svg('<path d="M7 3.5A3.5 3.5 0 0 1 10.5 7c0 2.5-3.5 6.5-3.5 6.5S3.5 9.5 3.5 7A3.5 3.5 0 0 1 7 3.5z"/><circle cx="7" cy="7" r="1.2"/>' +
        '<path d="M14.5 8h4A2.5 2.5 0 0 1 18.5 13h-6A2.5 2.5 0 0 0 10 15.5a2.5 2.5 0 0 0 2.5 2.5h4.5"/>' +
        '<path d="M17 15.5 18.8 18l3.2-2.5z"/>', sz || 20, cls);
    },
    sablier: function (sz, cls) { /* attente */
      return svg('<path d="M7 2.5h10v3.2a5 5 0 0 1-2.2 4.2L12 11.5l-2.8-1.6A5 5 0 0 1 7 5.7z"/>' +
        '<path d="M7 21.5h10v-3.2a5 5 0 0 0-2.2-4.2L12 12.5l-2.8 1.6A5 5 0 0 0 7 18.3z"/>', sz || 20, cls);
    },
    reunion: function (sz, cls) { /* réunion / coordination */
      return duo('<path d="M4.6 4.5h8.4a1.8 1.8 0 0 1 1.8 1.8v3.4a1.8 1.8 0 0 1-1.8 1.8H8.6l-3.2 2.6v-2.6h-.8A1.8 1.8 0 0 1 2.8 9.7V6.3a1.8 1.8 0 0 1 1.8-1.8z"/>',
        '<path d="M4.6 4.5h8.4a1.8 1.8 0 0 1 1.8 1.8v3.4a1.8 1.8 0 0 1-1.8 1.8H8.6l-3.2 2.6v-2.6h-.8A1.8 1.8 0 0 1 2.8 9.7V6.3a1.8 1.8 0 0 1 1.8-1.8z"/>' +
        '<path d="M17.2 9.6h2a1.8 1.8 0 0 1 1.8 1.8v3.4a1.8 1.8 0 0 1-1.8 1.8h-.6v2.6l-3.2-2.6h-3.6"/>', sz || 20, cls);
    },
    colis: function (sz, cls) {
      return duo('<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4z"/>',
        '<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4z"/><polyline points="3.5 7.5 12 11.5 20.5 7.5"/><line x1="12" y1="11.5" x2="12" y2="20.5"/>', sz || 20, cls);
    },
    /* compatibilité : ancien nom */
    package: function (sz, cls) { return ICO.colis(sz, cls); },

    /* ------------------------------- documents ------------------------- */
    document: function (sz, cls) {
      return duo('<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"/>',
        '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"/><polyline points="13.8 3.5 13.8 8.7 19 8.7"/>' +
        '<line x1="8.5" y1="12.5" x2="15.5" y2="12.5"/><line x1="8.5" y1="16" x2="13.5" y2="16"/>', sz || 20, cls);
    },
    compteRendu: function (sz, cls) {
      return svg('<rect x="4.5" y="3.5" width="15" height="17" rx="2.2"/><line x1="8" y1="8.5" x2="16" y2="8.5"/>' +
        '<line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="15.5" x2="12.5" y2="15.5"/>', sz || 20, cls);
    },
    signature: function (sz, cls) {
      return duo('<rect x="3.5" y="3.5" width="17" height="17" rx="2.4"/>',
        '<rect x="3.5" y="3.5" width="17" height="17" rx="2.4"/><line x1="6.5" y1="10.5" x2="17.5" y2="10.5"/>' +
        '<path d="M7.2 15.8c1.2-1.4 2.3 1.4 3.5 0s2.3 1.4 3.5 0 2.3 1.4 3.4.2"/>' +
        '<path d="M15.2 5.4l2.6 1.6-.6 1-2.7-1.6z" fill="currentColor" stroke="none"/>', sz || 20, cls);
    },
    medaille: function (sz, cls) {
      return svg('<circle cx="12" cy="9" r="5.5"/><polyline points="8.6 13.6 7 21 12 18.3 17 21 15.4 13.6"/>', sz || 20, cls);
    },
    courriel: function (sz, cls) {
      return duo('<rect x="2.5" y="5" width="19" height="14" rx="2.4"/>',
        '<rect x="2.5" y="5" width="19" height="14" rx="2.4"/><polyline points="3.2 6.5 12 12.5 20.8 6.5"/>', sz || 20, cls);
    },
    envoi: function (sz, cls) {
      return svg('<line x1="21" y1="3" x2="11" y2="13"/><polygon points="21 3 14.5 21 11 13 3 9.5"/>', sz || 18, cls);
    },
    photo: function (sz, cls) {
      return duo('<rect x="2.5" y="6.5" width="19" height="13.5" rx="2.4"/>',
        '<path d="M8.5 6.5 10 4h4l1.5 2.5"/><rect x="2.5" y="6.5" width="19" height="13.5" rx="2.4"/><circle cx="12" cy="13.2" r="3.4"/>', sz || 20, cls);
    },
    micro: function (sz, cls) {
      return svg('<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><line x1="12" y1="18" x2="12" y2="21.5"/>', sz || 18, cls);
    },
    crayon: function (sz, cls) {
      return svg('<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/><line x1="14.8" y1="5.2" x2="18" y2="8.4"/>', sz || 18, cls);
    },
    corbeille: function (sz, cls) {
      return svg('<line x1="4" y1="6.5" x2="20" y2="6.5"/><path d="M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7"/>' +
        '<path d="M6.5 6.5 7.4 20a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-13.5"/><line x1="10.5" y1="10.5" x2="10.5" y2="17"/><line x1="13.5" y1="10.5" x2="13.5" y2="17"/>', sz || 18, cls);
    },
    telecharger: function (sz, cls) {
      return svg('<line x1="12" y1="3.5" x2="12" y2="15"/><polyline points="7.5 10.5 12 15 16.5 10.5"/>' +
        '<path d="M4.5 17.5v1.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5"/>', sz || 18, cls);
    },
    televerser: function (sz, cls) {
      return svg('<line x1="12" y1="15.5" x2="12" y2="4"/><polyline points="7.5 8.5 12 4 16.5 8.5"/>' +
        '<path d="M4.5 17.5v1.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5"/>', sz || 18, cls);
    },
    copie: function (sz, cls) {
      return svg('<rect x="9" y="9" width="11.5" height="11.5" rx="2"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>', sz || 18, cls);
    },
    apercu: function (sz, cls) {
      return duo('<circle cx="12" cy="12" r="3.2"/>',
        '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3.2"/>', sz || 18, cls);
    },
    piece: function (sz, cls) { /* fichier joint */
      return svg('<path d="M20 11.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h6"/><polyline points="14 4 20 4 20 10"/>' +
        '<line x1="14" y1="4" x2="19.4" y2="9.4"/>', sz || 18, cls);
    },

    /* -------------------------------- actions -------------------------- */
    plus: function (sz, cls) {
      return svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', sz || 18, cls);
    },
    plusCercle: function (sz, cls) {
      return duo(disque(12, 12, 10.5), '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>', sz || 20, cls);
    },
    lecture: function (sz, cls) {
      return svg('<polygon points="6 3.5 19.5 12 6 20.5"/>', sz || 18, cls);
    },
    pause: function (sz, cls) {
      return svg('<line x1="9.5" y1="5" x2="9.5" y2="19"/><line x1="14.5" y1="5" x2="14.5" y2="19"/>', sz || 18, cls);
    },
    arret: function (sz, cls) {
      return svg('<rect x="6.5" y="6.5" width="11" height="11" rx="1.6"/>', sz || 18, cls);
    },
    refaire: function (sz, cls) { /* recommencer / rétablir */
      return svg('<path d="M20.2 12a8.2 8.2 0 1 1-2.7-6.1"/><polyline points="20.6 3.4 20.6 8.6 15.4 8.6"/>', sz || 18, cls);
    },
    puce: function (sz, cls) {
      return svg('<circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none"/>', sz || 12, cls);
    },
    cible: function (sz, cls) {
      return svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1" fill="currentColor"/>', sz || 18, cls);
    },
    verrou: function (sz, cls) {
      return svg('<rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/>', sz || 18, cls);
    },
    etoile: function (sz, cls) {
      return svg('<polygon points="12 3.2 14.9 9.2 21.3 10.1 16.6 14.6 17.8 21 12 18 6.2 21 7.4 14.6 2.7 10.1 9.1 9.2"/>', sz || 16, cls);
    },
    aide: function (sz, cls) {
      return duo(disque(12, 12, 10.5), '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7"/><line x1="12" y1="17" x2="12.01" y2="17"/>', sz || 18, cls);
    },

    /* ------------------------ fabriques d'identifiants ------------------ */
    domaine: function (id, sz) {
      var s = sz || 20, str = String(id || '').toUpperCase();
      if (str.indexOf('MECAN') !== -1) return ICO.cle(s);
      if (str.indexOf('ELEC') !== -1) return ICO.eclaire(s);
      if (str.indexOf('AUTO') !== -1) return ICO.automate(s);
      return ICO.cle(s);
    },
    activite: function (id, sz) {
      var s = sz || 18, str = String(id || '').toUpperCase();
      if (str.indexOf('MONTAGE') !== -1) return ICO.cle(s);
      if (str.indexOf('CABLAGE') !== -1) return ICO.eclaire(s);
      if (str.indexOf('RACCORD') !== -1) return ICO.prise(s);
      if (str.indexOf('PARAM') !== -1) return ICO.automate(s);
      if (str.indexOf('ESSAI') !== -1) return ICO.fiole(s);
      if (str.indexOf('LEVAGE') !== -1) return ICO.grue(s);
      if (str.indexOf('FORMATION') !== -1) return ICO.chapeau(s);
      if (str.indexOf('DEPLAC') !== -1) return ICO.itineraire(s);
      if (str.indexOf('ATTENTE') !== -1) return ICO.sablier(s);
      if (str.indexOf('REUNION') !== -1) return ICO.reunion(s);
      return ICO.cible(s);
    },
    categorie: function (id, sz) {
      var s = sz || 18, str = String(id || '').toUpperCase();
      if (str.indexOf('SECURITE') !== -1) return ICO.bouclier(s);
      if (str.indexOf('BLOCAGE') !== -1) return ICO.interdit(s);
      if (str.indexOf('RETARD') !== -1) return ICO.alerte(s);
      if (str.indexOf('APPRO') !== -1) return ICO.colis(s);
      if (str.indexOf('AVANCEMENT') !== -1) return ICO.valideCercle(s);
      return ICO.information(s);
    },
    etatTache: function (etat, sz) {
      var s = sz || 16, e = String(etat || '').toUpperCase();
      if (e === 'FAIT') return ICO.valide(s);
      if (e === 'PARTIEL') return ICO.demi(s - 2);
      if (e === 'NON_FAIT') return ICO.fermer(s);
      return ICO.vide(s - 2);
    },
    resultat: function (resultat, sz) {
      var s = sz || 16, r = String(resultat || '').toUpperCase();
      if (r === 'OK') return ICO.valideCercle(s);
      if (r === 'NOK') return ICO.refuseCercle(s);
      return ICO.demi(s - 2);
    },

    /* icône suivie d'un libellé, alignée sur le texte */
    texte: function (nom, libelle, sz, cls) {
      var f = ICO[nom];
      if (!f) return String(libelle || '');
      return '<span class="ico-texte ' + (cls || '') + '">' + f(sz || 17) + '<span>' + (libelle || '') + '</span></span>';
    },
    /* accès générique : ICO.i('crayon', 18) */
    i: function (nom, sz, cls) {
      return ICO[nom] ? ICO[nom](sz, cls) : '';
    }
  };

  root.ICO = ICO;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

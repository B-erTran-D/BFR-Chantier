/* =========================================================================
   BFR-CHANTIER — OUTILS D'INTERFACE
   -------------------------------------------------------------------------
   Petits utilitaires réutilisés par tous les écrans : messages, feuilles
   du bas, blocs de saisie, signature au doigt, dictée, photos compressées,
   partage du PDF. Aucune dépendance.
   ========================================================================= */
(function (global) {
  'use strict';

  /* rendu d'une icône BFR : ICO('nom', taille) */
  function ICO(nom, taille) { return (global.ICO && global.ICO.i(nom, taille)) || ''; }

  function $(sel, racine) { return (racine || document).querySelector(sel); }
  function $$(sel, racine) { return Array.prototype.slice.call((racine || document).querySelectorAll(sel)); }

  /* Échappe le texte destiné au HTML */
  function esc(t) {
    return String(t === undefined || t === null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  /* Échappe pour un attribut entre guillemets doubles */
  function attr(t) { return esc(t); }

  function vibrer(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 18); } catch (e) { } }

  var minuterie = null;
  function toast(message, type) {
    var z = document.getElementById('toast');
    if (!z) return;
    z.innerHTML = '<div class="toast ' + (type || '') + '">' + esc(message) + '</div>';
    z.classList.add('visible');
    clearTimeout(minuterie);
    minuterie = setTimeout(function () { z.classList.remove('visible'); }, 3200);
  }

  /* ------------------------------- Feuilles ---------------------------- */

  /* Feuille du bas : formulaire ou choix. Renvoie l'élément créé.
     opts : { titre, contenu (HTML), boutons:[{libelle, classe, action(el)}],
              pleine (bool), surFermeture(fn) } */
  function feuille(opts) {
    var o = opts || {};
    var ov = document.createElement('div');
    ov.className = 'feuille-fond';
    var boutons = (o.boutons || []).map(function (b, i) {
      return '<button type="button" class="btn ' + (b.classe || 's') + '" data-fb="' + i + '">' + esc(b.libelle) + '</button>';
    }).join('');
    ov.innerHTML =
      '<div class="feuille ' + (o.pleine ? 'pleine' : '') + '" role="dialog">' +
        '<div class="feuille-tete">' +
          '<h3>' + esc(o.titre || '') + '</h3>' +
          '<button type="button" class="iconbtn" data-fb="fermer" aria-label="Fermer">' + ICO('fermer', 18) + '</button>' +
        '</div>' +
        '<div class="feuille-corps">' + (o.contenu || '') + '</div>' +
        (boutons ? '<div class="feuille-pied">' + boutons + '</div>' : '') +
      '</div>';
    document.body.appendChild(ov);
    document.body.classList.add('sans-defilement');
    requestAnimationFrame(function () { ov.classList.add('visible'); });

    function fermer() {
      ov.classList.remove('visible');
      setTimeout(function () {
        ov.remove();
        document.body.classList.remove('sans-defilement');
        if (o.surFermeture) o.surFermeture();
      }, 160);
    }
    ov.addEventListener('click', function (e) {
      if (e.target === ov) { fermer(); return; }
      var b = e.target.closest('[data-fb]');
      if (!b) return;
      var idx = b.getAttribute('data-fb');
      if (idx === 'fermer') { fermer(); return; }
      var def = (o.boutons || [])[Number(idx)];
      if (!def) { fermer(); return; }
      /* un bouton sans action (Compris, Fermer, Ok…) referme la feuille */
      if (def.action) def.action(ov, fermer);
      else fermer();
    });
    feuille.derniere = ov;
    return ov;
  }

  function confirmer(question, surOui, libelleOui) {
    feuille({
      titre: 'Confirmation',
      contenu: '<p class="texte">' + esc(question) + '</p>',
      boutons: [
        { libelle: 'Annuler', classe: 's' },
        { libelle: libelleOui || 'Confirmer', classe: 'o', action: function (ov, fermer) { fermer(); surOui(); } }
      ]
    });
  }

  /* ------------------------------ Dictée ------------------------------- */

  function dicteeDisponible() {
    return !!(global.SpeechRecognition || global.webkitSpeechRecognition);
  }

  /* Dicte dans le champ texte ciblé. cible = textarea/input */
  function dicter(cible, surEtat) {
    var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
    if (!SR) { toast('Dictée indisponible sur ce navigateur'); return; }
    var rec = new SR();
    rec.lang = 'fr-FR';
    rec.continuous = true;
    rec.interimResults = false;
    var base = cible.value ? cible.value + ' ' : '';
    if (surEtat) surEtat(true);
    rec.onresult = function (e) {
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) base += e.results[i][0].transcript + ' ';
      }
      cible.value = base.replace(/\s+/g, ' ').trim();
      cible.dispatchEvent(new Event('input', { bubbles: true }));
    };
    rec.onerror = function () { if (surEtat) surEtat(false); };
    rec.onend = function () { if (surEtat) surEtat(false); };
    try { rec.start(); } catch (e) { if (surEtat) surEtat(false); }
    return rec;
  }

  function lire(texte) {
    if (!('speechSynthesis' in global)) { toast('Relecture vocale indisponible'); return; }
    global.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(texte);
    u.lang = 'fr-FR';
    global.speechSynthesis.speak(u);
  }

  /* ---------------------------- Signature ------------------------------ */

  /* Cassette de signature au doigt. Renvoie une promesse de dataURL PNG
     (ou null si annulé). */
  function signature(titre, signatureExistante) {
    return new Promise(function (resolve) {
      var ov = document.createElement('div');
      ov.className = 'feuille-fond';
      ov.innerHTML =
        '<div class="feuille pleine" role="dialog">' +
          '<div class="feuille-tete"><h3>' + esc(titre || 'Signature') + '</h3>' +
          '<button type="button" class="iconbtn" data-s="fermer" aria-label="Fermer">' + ICO('fermer', 18) + '</button></div>' +
          '<div class="feuille-corps">' +
            '<p class="mini">Signez avec le doigt dans le cadre ci-dessous.</p>' +
            '<div class="signature-zone"><canvas id="sigCanvas"></canvas>' +
            '<div class="signature-vide" id="sigVide">Signer ici</div></div>' +
          '</div>' +
          '<div class="feuille-pied">' +
            '<button type="button" class="btn s" data-s="effacer">Effacer</button>' +
            '<button type="button" class="btn p" data-s="valider">Valider la signature</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(ov);
      document.body.classList.add('sans-defilement');
      requestAnimationFrame(function () { ov.classList.add('visible'); });

      var cv = $('#sigCanvas', ov);
      var ctx = cv.getContext('2d');
      var dessine = false, trace = false;

      function dimensionner() {
        var r = cv.parentElement.getBoundingClientRect();
        var dpr = Math.min(2.5, global.devicePixelRatio || 1);
        cv.width = Math.round(r.width * dpr);
        cv.height = Math.round(r.height * dpr);
        cv.style.width = r.width + 'px';
        cv.style.height = r.height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1e3a8a';
        if (signatureExistante && !dessine) {
          var img = new Image();
          img.onload = function () { ctx.drawImage(img, 0, 0, r.width, r.height); dessine = true; };
          img.src = signatureExistante;
        }
      }
      setTimeout(dimensionner, 30);
      global.addEventListener('resize', dimensionner);

      function pos(e) {
        var r = cv.getBoundingClientRect();
        var p = e.touches ? e.touches[0] : e;
        return { x: p.clientX - r.left, y: p.clientY - r.top };
      }
      function debut(e) { e.preventDefault(); trace = true; var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
      function move(e) {
        if (!trace) return;
        e.preventDefault();
        var p = pos(e);
        ctx.lineTo(p.x, p.y); ctx.stroke();
        dessine = true;
        var v = $('#sigVide', ov); if (v) v.style.display = 'none';
      }
      function fin() { trace = false; }

      cv.addEventListener('touchstart', debut, { passive: false });
      cv.addEventListener('touchmove', move, { passive: false });
      cv.addEventListener('touchend', fin);
      cv.addEventListener('mousedown', debut);
      cv.addEventListener('mousemove', move);
      global.addEventListener('mouseup', fin);

      function fermer(valeur) {
        ov.classList.remove('visible');
        setTimeout(function () {
          ov.remove();
          document.body.classList.remove('sans-defilement');
          resolve(valeur);
        }, 160);
      }
      ov.addEventListener('click', function (e) {
        var b = e.target.closest('[data-s]');
        if (!b) { if (e.target === ov) fermer(null); return; }
        var a = b.getAttribute('data-s');
        if (a === 'fermer') fermer(null);
        else if (a === 'effacer') { ctx.clearRect(0, 0, cv.width, cv.height); dessine = false; var v = $('#sigVide', ov); if (v) v.style.display = ''; }
        else if (a === 'valider') {
          if (!dessine) { toast('Signez dans le cadre avant de valider'); return; }
          fermer(cv.toDataURL('image/png'));
        }
      });
    });
  }

  /* ------------------------------ Photos ------------------------------- */

  function lireFichier(fichier) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = reject;
      fr.readAsDataURL(fichier);
    });
  }

  /* Réduit la photo (max 1600 px, JPEG 80 %) pour tenir dans le téléphone */
  function compresser(dataUrl, maxCote) {
    var max = maxCote || 1600;
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height;
        var echelle = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * echelle); h = Math.round(h * echelle);
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        var ctx = cv.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        try { resolve(cv.toDataURL('image/jpeg', 0.8)); }
        catch (e) { resolve(dataUrl); }
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;
    });
  }

  /* Prend une photo (appareil ou galerie) et renvoie un dataURL compressé */
  function prendrePhoto() {
    return new Promise(function (resolve) {
      var inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.setAttribute('capture', 'environment');
      inp.style.display = 'none';
      document.body.appendChild(inp);
      inp.addEventListener('change', function () {
        var f = inp.files && inp.files[0];
        inp.remove();
        if (!f) { resolve(null); return; }
        lireFichier(f).then(function (d) { return compresser(d); }).then(resolve).catch(function () { resolve(null); });
      });
      inp.addEventListener('cancel', function () { inp.remove(); resolve(null); });
      inp.click();
    });
  }

  /* ------------------------- Téléchargement / partage ------------------ */

  function telecharger(blob, nom) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nom;
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 1500);
  }

  /* Partage natif du téléphone (Gmail, WhatsApp…) avec la pièce jointe */
  function partager(fichiers, texte, objet) {
    var fichiersNatifs = (fichiers || []).map(function (f) {
      return new File([f.blob], f.nom, { type: 'application/pdf' });
    });
    if (global.navigator && navigator.canShare && navigator.canShare({ files: fichiersNatifs })) {
      return navigator.share({ files: fichiersNatifs, text: texte, title: objet || '' })
        .then(function () { return 'partage'; })
        .catch(function () { return 'annule'; });
    }
    return Promise.resolve('indisponible');
  }

  function copier(texte) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texte).then(function () { return true; }).catch(function () { return false; });
    }
    try {
      var ta = document.createElement('textarea');
      ta.value = texte; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
      return Promise.resolve(true);
    } catch (e) { return Promise.resolve(false); }
  }

  /* Valeur courante d'un champ : lue dans l'objet visé (journée, chantier,
     réglages, brouillon) quand elle n'est pas fournie explicitement. */
  function valeurCourante(o) {
    if (o.valeur !== undefined && o.valeur !== null) return o.valeur;
    var A = global.App;
    if (!A || !o.champ || !o.cible) return '';
    var obj = null;
    if (o.cible === 'journee') obj = A.journeeCourante && A.journeeCourante();
    else if (o.cible === 'chantier') obj = A.chantierCourant && A.chantierCourant();
    else if (o.cible === 'reglages') obj = A.etat && A.etat.reglages;
    else if (o.cible === 'nouveau') obj = A.etat && A.etat.nouveau;
    if (!obj) return '';
    var v = String(o.champ).split('.').reduce(function (x, p) {
      return (x === undefined || x === null) ? undefined : x[p];
    }, obj);
    return v === undefined || v === null ? '' : v;
  }

  /* Bloc de saisie réutilisable */
  function blocSaisie(o) {
    var o2 = o || {};
    var id = o2.id || ('c' + Math.random().toString(36).slice(2, 8));
    var valeur = valeurCourante(o2);
    var balise = o2.lignes ? 'textarea' : 'input';
    var attrs = 'id="' + id + '" data-champ="' + attr(o2.champ || '') + '" data-cible="' + attr(o2.cible || 'journee') + '"';

    /* Suggestions : ce que l'utilisateur a l'habitude de saisir d'abord,
       puis le catalogue de référence (Usage.fusionner). */
    var propositions = [];
    if (o2.suggestions && global.Usage) {
      propositions = global.Usage.fusionner(o2.suggestions, o2.catalogue || [], o2.limiteSuggestions || 40);
      if (propositions.length) {
        attrs += ' list="dl-' + id + '" autocomplete="off"';
      }
    }
    var listeSuggestions = propositions.length
      ? '<datalist id="dl-' + id + '">' + propositions.map(function (v) {
          return '<option value="' + attr(v) + '"></option>';
        }).join('') + '</datalist>'
      : '';

    /* Raccourcis : les plus utilisés par cet utilisateur, en un appui */
    var raccourcis = '';
    if (o2.suggestions && global.Usage) {
      var pop = global.Usage.populaires(o2.suggestions, o2.limiteChips || 4);
      if (pop.length) {
        raccourcis = '<div class="suggestion-titre">' + (o2.titreRaccourcis || 'Vos saisies les plus fréquentes') + '</div>' +
          '<div class="suggestions">' + pop.map(function (p2) {
            return '<button type="button" class="suggestion" data-a="utiliser-suggestion" data-vers="' + id + '" ' +
              'data-valeur="' + attr(p2.valeur) + '">' + esc(p2.valeur) + ' <span class="n">×' + p2.n + '</span></button>';
          }).join('') + '</div>';
      }
    }
    if (o2.type) attrs += ' type="' + o2.type + '"';
    if (o2.inputmode) attrs += ' inputmode="' + o2.inputmode + '"';
    if (o2.placeholder) attrs += ' placeholder="' + attr(o2.placeholder) + '"';
    if (o2.min !== undefined) attrs += ' min="' + o2.min + '"';
    if (o2.max !== undefined) attrs += ' max="' + o2.max + '"';
    if (o2.etape !== undefined) attrs += ' step="' + o2.etape + '"';
    var corps = balise === 'textarea'
      ? '<textarea ' + attrs + ' rows="' + (o2.rangees || 3) + '">' + esc(valeur) + '</textarea>'
      : '<input ' + attrs + ' value="' + attr(valeur) + '">';
    return '<label class="champ' + (o2.classe ? ' ' + o2.classe : '') + '">' +
      (o2.libelle ? '<span class="champ-titre">' + esc(o2.libelle) +
        (o2.dictee ? '<button type="button" class="mini-btn" data-a="dicter" data-vers="' + id + '">' + ICO('micro', 15) + 'Dicter</button>' : '') +
        '</span>' : '') +
      corps + listeSuggestions + '</label>' + raccourcis;
  }

  /* Liste déroulante construite sur un catalogue, avec un choix « Autre »
     qui ouvre la saisie libre. Renvoie du HTML ; l'affichage du champ libre
     est piloté par l'appelant (classe « cache »). */
  function champListe(o) {
    var o2 = o || {};
    var id = o2.id;
    var idLibre = o2.idLibre || (id + 'Libre');
    var pop = (global.Usage && o2.suggestions) ? global.Usage.populaires(o2.suggestions, o2.limitePopulaires || 6) : [];
    var valeur = o2.valeur === undefined || o2.valeur === null ? '' : String(o2.valeur);
    var dansCatalogue = (o2.catalogue || []).some(function (v) { return v === valeur; }) ||
      pop.some(function (p2) { return p2.valeur === valeur; });
    var choixAutre = valeur !== '' && !dansCatalogue;

    function options(liste) {
      return liste.map(function (v) {
        var val = (typeof v === 'string') ? v : v.valeur;
        var suppl = (typeof v === 'string') ? '' : ' <span class="mini">×' + v.n + '</span>';
        return '<option value="' + attr(val) + '"' + (val === valeur ? ' selected' : '') + '>' + esc(val) + suppl + '</option>';
      }).join('');
    }

    var h = '<label class="champ"><span class="champ-titre">' + esc(o2.libelle || '') + '</span>' +
      '<select id="' + id + '">' +
      '<option value=""' + (valeur === '' ? ' selected' : '') + '>— choisir dans la liste —</option>' +
      (pop.length ? '<optgroup label="Vos ' + esc(o2.titrePopulaires || 'choix les plus fréquents') + '">' + options(pop) + '</optgroup>' : '') +
      (o2.catalogue && o2.catalogue.length ? '<optgroup label="' + esc(o2.titreCatalogue || 'Liste courante') + '">' + options(o2.catalogue) + '</optgroup>' : '') +
      '<option value="__AUTRE__"' + (choixAutre ? ' selected' : '') + '>Autre (saisie libre)</option>' +
      '</select></label>';

    h += '<div id="' + idLibre + 'Box"' + (choixAutre ? '' : ' class="cache"') + '>' +
      blocSaisie({
        id: idLibre, libelle: o2.libelleLibre || 'Saisie libre', valeur: valeur,
        dictee: o2.dictee, placeholder: o2.placeholder
      }) + '</div>';
    return h;
  }

  global.UI = {
    $: $, $$: $$, esc: esc, attr: attr, toast: toast, vibrer: vibrer,
    feuille: feuille, confirmer: confirmer,
    dicter: dicter, dicteeDisponible: dicteeDisponible, lire: lire,
    signature: signature,
    lireFichier: lireFichier, compresser: compresser, prendrePhoto: prendrePhoto,
    telecharger: telecharger, partager: partager, copier: copier,
    blocSaisie: blocSaisie, valeurCourante: valeurCourante, champListe: champListe
  };
})(window);

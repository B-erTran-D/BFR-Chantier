/* =========================================================================
   BFR-CHANTIER — POINT DU SOIR (document PDF et aperçu à l'écran)
   -------------------------------------------------------------------------
   Même mise en page pour le PDF (Pdf.Doc) et pour l'aperçu (Pdf.Apercu) :
   une seule fonction de dessin, appelée avec l'un ou l'autre.
   Document INTERNE : il n'est pas adressé au client et ne porte aucune
   signature de client.
   ========================================================================= */
(function (global) {
  'use strict';

  var M = global.Modele;

  var NOIR = [0.16, 0.16, 0.19];
  var GRIS = [0.39, 0.46, 0.55];
  var NAVY = [0.20, 0.18, 0.45];      // #332e72
  var CYAN = [0.02, 0.73, 0.95];      // #06baf2
  var CYAN_PALE = [0.92, 0.97, 0.99];
  var GRIS_PALE = [0.96, 0.97, 0.98];
  var ROUGE = [0.73, 0.11, 0.11];
  var ARDOISE = [0.29, 0.31, 0.42];      /* bleu ardoise BFR — aucune couleur hors charte */
  var VERT = [0.01, 0.47, 0.34];
  var BORD = [0.86, 0.89, 0.92];

  function police(gras) { return gras ? 'F2' : 'F1'; }

  /* ---------------------------------------------------------------- outils */

  function titreSection(doc, texte) {
    doc.ensure(30);
    doc.rect(doc.margin, doc.y, doc.contentWidth, 14, { fill: NAVY });
    doc.text(texte.toUpperCase(), doc.margin + 6, doc.y + 10.4, { size: 8.6, font: 'F2', color: [1, 1, 1] });
    doc.y += 14 + 3.4;      /* espacement resserré : la journée tient sur une page */
  }

  function sousTitre(doc, texte) {
    doc.ensure(14);
    doc.text(texte, doc.margin, doc.y + 8, { size: 8.4, font: 'F2', color: NAVY });
    doc.y += 12;
  }

  function ligne(doc, texte, opts) {
    opts = opts || {};
    var size = opts.size || 8.6;
    var h = doc.paragraphHeight(texte, doc.contentWidth - (opts.retrait || 0), size);
    doc.ensure(h + 2);
    doc.y = doc.paragraph(texte, doc.margin + (opts.retrait || 0), doc.y, doc.contentWidth - (opts.retrait || 0), {
      size: size, color: opts.color || NOIR, bold: !!opts.bold, lineHeight: size * 1.35
    }) + 2;
  }

  /* Tableau simple : entetes[], lignes[][] (chaque cellule = texte) */
  function tableau(doc, entetes, lignes, largeurs, opts) {
    opts = opts || {};
    var size = opts.size || 8;
    var lh = size * 1.35;
    var total = largeurs.reduce(function (a, b) { return a + b; }, 0);
    var dispo = doc.contentWidth;
    var cols = largeurs.map(function (l) { return (l / total) * dispo; });

    function hauteurLigne(cellules) {
      var h = 0;
      cellules.forEach(function (c, i) {
        var hauteur = doc.paragraphHeight(String(c == null ? '' : c), cols[i] - 8, size);
        if (hauteur > h) h = hauteur;
      });
      return h + 5;
    }

    /* en-tête */
    var hEntete = hauteurLigne(entetes);
    doc.ensure(hEntete + 14);
    doc.rect(doc.margin, doc.y, dispo, hEntete, { fill: [0.93, 0.96, 0.98] });
    var x = doc.margin;
    entetes.forEach(function (c, i) {
      doc.text(String(c), x + 4, doc.y + size + 1.5, { size: size, font: 'F2', color: NAVY });
      x += cols[i];
    });
    doc.y += hEntete;

    /* lignes */
    lignes.forEach(function (l, index) {
      var h = hauteurLigne(l);
      if (doc.y + h > doc.H - doc.margin - 24) {
        doc.newPage();
        doc.ensure(hEntete + 10);
        doc.rect(doc.margin, doc.y, dispo, hEntete, { fill: [0.93, 0.96, 0.98] });
        var xx = doc.margin;
        entetes.forEach(function (c, i) {
          doc.text(String(c), xx + 4, doc.y + size + 1.5, { size: size, font: 'F2', color: NAVY });
          xx += cols[i];
        });
        doc.y += hEntete;
      }
      if (index % 2 === 1) doc.rect(doc.margin, doc.y, dispo, h, { fill: GRIS_PALE });
      var x2 = doc.margin;
      l.forEach(function (c, i) {
        doc.paragraph(String(c == null ? '' : c), x2 + 4, doc.y + 3, cols[i] - 8, { size: size, color: NOIR });
        x2 += cols[i];
      });
      doc.line(doc.margin, doc.y + h, doc.margin + dispo, doc.y + h, { color: BORD, width: 0.5 });
      doc.y += h;
    });
    doc.y += 6;
  }

  /* =========================== Dessin du document ====================== */

  function dessiner(doc, ctx) {
    var ch = ctx.chantier, j = ctx.journee, S = ctx.reglages || {};
    var c = M.compteurs(j, ctx.cumul);
    var avancement = ctx.avancement;

    /* ------------------------------ en-tête --------------------------- */
    var y0 = doc.margin;
    var logo = (S.societe && S.societe.logo) || global.LOGO_BFR || '';
    var largeurTexte = doc.contentWidth;
    if (logo) {
      try {
        var octets = Pdf.dataUrlToBytes(logo);
        var dim = (global.Pdf.jpegDims ? Pdf.jpegDims(octets) : null);
        var h = 26, w = 92;
        if (dim && dim.h) { w = 26 * (dim.w / dim.h); if (w > 130) { w = 130; h = 130 / (dim.w / dim.h); } }
        doc.image(octets, doc.margin, y0, w, h);
        largeurTexte = doc.contentWidth - (w + 12);
      } catch (e) { /* logo illisible : on continue sans */ }
    }
    var xDroite = doc.margin + doc.contentWidth;
    doc.text('POINT DU SOIR', xDroite, y0 + 9, { size: 14, font: 'F2', color: NAVY, align: 'right' });
    doc.text((S.societe && S.societe.nom) || 'BFR SYSTEMS', xDroite, y0 + 19, { size: 7.6, color: GRIS, align: 'right' });
    doc.rect(doc.margin, y0 + 30, doc.contentWidth, 1.4, { fill: CYAN });
    doc.y = y0 + 40;

    /* identification du chantier */
    var titre = (ch.numeroAffaire ? ch.numeroAffaire + ' · ' : '') + (ch.libelle || 'Chantier');
    ligne(doc, titre, { size: 12, bold: true, color: NAVY });
    var sous = [];
    if (ch.client && ch.client.nom) sous.push(ch.client.nom + (ch.client.ville ? ' — ' + ch.client.ville : ''));
    if (ch.client && ch.client.site) sous.push('Site : ' + ch.client.site);
    sous.push('Journée ' + j.numero + (ch.dureePrevueJours ? ' sur ' + ch.dureePrevueJours + ' prévues' : ''));
    sous.push(M.texteDate(j.date));
    if (ctx.auteur) sous.push('Établi par : ' + ctx.auteur);
    ligne(doc, sous.join('   ·   '), { size: 8.4, color: GRIS });
    if (j.version > 1) ligne(doc, 'Version ' + j.version + ' (corrigée après envoi)', { size: 8, color: ARDOISE, bold: true });

    /* ------------------------- l'essentiel ---------------------------- */
    var synth = j.synthese || '—';
    var hSynth = doc.paragraphHeight(synth, doc.contentWidth - 18, 9.6, false) + 16;
    doc.ensure(hSynth + 20);
    doc.rect(doc.margin, doc.y, doc.contentWidth, hSynth, { fill: CYAN_PALE });
    doc.rect(doc.margin, doc.y, 3, hSynth, { fill: CYAN });
    doc.text('L\'ESSENTIEL', doc.margin + 9, doc.y + 11, { size: 7.4, font: 'F2', color: NAVY });
    doc.paragraph(synth, doc.margin + 9, doc.y + 14, doc.contentWidth - 18, { size: 9.6, color: NOIR });
    doc.y += hSynth + 10;

    /* -------------------------- 1. avancement ------------------------- */
    titreSection(doc, '1. Avancement du chantier');
    doc.ensure(30);
    doc.text(avancement + ' %', doc.margin, doc.y + 14, { size: 20, font: 'F2', color: NAVY });
    var xBarre = doc.margin + 70;
    var largeurBarre = doc.contentWidth - 70;
    doc.rect(xBarre, doc.y + 6, largeurBarre, 8, { fill: [0.91, 0.94, 0.96] });
    var rempli = Math.max(0, Math.min(1, avancement / 100)) * largeurBarre;
    if (rempli > 0) doc.rect(xBarre, doc.y + 6, rempli, 8, { fill: CYAN });
    if (ctx.variation) {
      doc.text((ctx.variation > 0 ? '+ ' : '') + ctx.variation + ' points par rapport à la veille',
        xBarre, doc.y + 24, { size: 7.6, color: GRIS });
    }
    doc.y += 30;
    var termines = [], enCours = [], aVenir = [];
    (ch.jalons || []).forEach(function (jal) {
      var a = Number(jal.avancement) || 0;
      if (a >= 100) termines.push(jal.libelle);
      else if (a > 0) enCours.push(jal.libelle + ' (' + a + ' %)');
      else aVenir.push(jal.libelle);
    });
    if (termines.length) ligne(doc, 'Terminé : ' + termines.join(' · '), { size: 8.2 });
    if (enCours.length) ligne(doc, 'En cours : ' + enCours.join(' · '), { size: 8.2 });
    if (aVenir.length) ligne(doc, 'À venir : ' + aVenir.join(' · '), { size: 8.2, color: GRIS });

    /* ------------------------ 2. effectif et heures ------------------- */
    titreSection(doc, '2. Effectif et heures');
    var detail = (j.effectif && j.effectif.detail) ? j.effectif.detail : '';
    tableau(doc, ['Effectif sur site', 'Heures'], [
      [(j.effectif && j.effectif.nb ? j.effectif.nb : 0) + ' personne(s)' + (detail ? ' — ' + detail : ''),
        M.texteHeures(M.dureeJourneeMn(j))],
      ['Total hommes-heures du jour', M.texteHeuresDec(c.hommesHeures)],
      ['Cumul hommes-heures du chantier', M.texteHeuresDec(ctx.cumul === undefined ? c.hommesHeures : ctx.cumul)]
    ], [70, 30]);

    /* ------------------------- 3. travaux réalisés -------------------- */
    var faits = (j.taches || []).filter(function (t) { return t.etat === 'FAIT' || t.etat === 'PARTIEL'; });
    if (faits.length || (j.actions || []).length) {
      titreSection(doc, '3. Travaux réalisés');
      faits.forEach(function (t) {
        var txt = (t.etat === 'FAIT' ? '✓ ' : '◐ ') + t.libelle;
        if (t.avancement) txt += '  (+' + t.avancement + ' % sur ' + (libelleJalon(ch, t.jalonId) || 'le jalon') + ')';
        ligne(doc, txt, { size: 8.4 });
      });
      (j.actions || []).filter(function (a) { return a.categorie === 'AVANCEMENT' && a.texte; })
        .forEach(function (a) { ligne(doc, '· ' + a.texte, { size: 8.4, color: GRIS }); });
    }

    /* ---------------------- 4. prévu et non réalisé ------------------- */
    var nonFaits = (j.taches || []).filter(function (t) { return t.etat === 'NON_FAIT'; });
    if (nonFaits.length) {
      titreSection(doc, '4. Prévu et non réalisé');
      nonFaits.forEach(function (t) {
        ligne(doc, '✕ ' + t.libelle + (t.motif ? ' — motif : ' + t.motif : ''), { size: 8.4 });
      });
    }

    /* --------------------- 5. blocages et écarts ---------------------- */
    titreSection(doc, '5. Blocages et écarts');
    var ouverts = ctx.blocagesOuverts || [];
    if (!ouverts.length) {
      ligne(doc, 'Aucun blocage à signaler.', { size: 8.4, color: VERT });
    } else {
      var lignesBlocages = ouverts.map(function (o) {
        var b = o.blocage;
        var grav = M.parId(M.GRAVITES, Number(b.gravite));
        var desc = b.description;
        if (o.anciennete > 0) desc += '  (ouvert le ' + M.texteDateCourt(b.ouvertLe || o.date) + ' — ' + o.anciennete + ' j)';
        if (o.persistant) desc += '  — bloque depuis ' + o.anciennete + ' jours';
        return [
          (grav ? grav.court : b.gravite),
          desc,
          M.libelle(M.DEBLOQUEURS, b.debloqueur) + (b.impactJours ? ' · impact ' + b.impactJours + ' j' : ''),
          b.echeance || '—'
        ];
      });
      tableau(doc, ['Gravité', 'Description', 'Qui peut débloquer', 'Pour quand'], lignesBlocages, [16, 46, 24, 14]);
      var graves = ouverts.filter(function (o) { return Number(o.blocage.gravite) === 1; });
      if (graves.length) ligne(doc, '!' + ' ' + graves.length + ' blocage(s) de gravité 1 : action attendue sous 24 h.', { size: 8.4, bold: true, color: ROUGE });
    }

    /* ---------------------- 6. approvisionnement --------------------- */
    var mat = j.materiel || [];
    if (mat.length) {
      titreSection(doc, '6. Approvisionnement et matériel');
      tableau(doc, ['État', 'Référence', 'Désignation', 'Qté', 'Besoin le'], mat.map(function (m) {
        return [
          M.libelle(M.ETATS_MATERIEL, m.etat),
          m.reference || '—',
          m.designation || '—',
          m.qte || '',
          m.etat === 'MANQUANT' && m.besoinLe ? M.texteDateCourt(m.besoinLe) : '—'
        ];
      }), [16, 16, 40, 8, 14]);
    }

    /* --------------------------- 7. sécurité ------------------------- */
    titreSection(doc, '7. Sécurité');
    var incidents = (j.securite && j.securite.incidents) || [];
    if (!incidents.length) {
      ligne(doc, 'Aucun incident ni presqu\'accident signalé ce jour.', { size: 8.4, color: VERT });
    } else {
      incidents.forEach(function (i) {
        ligne(doc, '• ' + (i.description || '') + (i.gravite ? '  [' + i.gravite + ']' : ''), { size: 8.4, color: ROUGE });
      });
    }
    if (j.securite && j.securite.remarques) ligne(doc, 'Remarques : ' + j.securite.remarques, { size: 8.2, color: GRIS });

    /* ----------------------- 8. essais et contrôles ------------------ */
    if ((j.essais || []).length) {
      titreSection(doc, '8. Essais et contrôles');
      tableau(doc, ['Essai', 'Résultat', 'Mesures / observation'], (j.essais || []).map(function (e) {
        return [e.libelle || '—', M.libelle(M.RESULTATS_ESSAI, e.resultat), (e.mesures || '') + (e.contreVisite ? '  (contre-visite nécessaire)' : '')];
      }), [30, 14, 56]);
    }

    /* ---------------------------- 9. formation ----------------------- */
    if (j.formation && (j.formation.participants || []).length) {
      titreSection(doc, '9. Formation du jour');
      var f = j.formation;
      ligne(doc, (f.intitule || 'Session') + ' · ' + M.libelle(M.TYPES_FORMATION, f.type) +
        ' · ' + (f.dureeH || 0) + ' h · formateur : ' + (f.formateur || ctx.auteur || '—'), { size: 8.4, bold: true });
      tableau(doc, ['Participant', 'Fonction', 'Acquis', 'Signature'], (f.participants || []).map(function (p) {
        return [p.nom || '—', p.fonction || '', M.libelle(M.ACQUIS, p.acquis), p.signature ? 'signé' : 'non signé'];
      }), [30, 30, 20, 20]);
      var traites = (f.programme || []).filter(function (m) { return m.traite; });
      if (traites.length) ligne(doc, 'Thèmes traités : ' + traites.map(function (m) { return m.libelle; }).join(' · '), { size: 8.2, color: GRIS });
    }

    /* -------------------------- 10. coactivité ----------------------- */
    if ((j.coactivite || []).length) {
      titreSection(doc, '10. Coactivité et sous-traitants');
      (j.coactivite || []).forEach(function (co) {
        ligne(doc, '· ' + (co.entreprise || '—') + (co.effectif ? ' (' + co.effectif + ' pers.)' : '') + (co.remarque ? ' — ' + co.remarque : ''), { size: 8.4 });
      });
    }

    /* -------------------------- 11. prévu demain --------------------- */
    titreSection(doc, '11. Prévu demain');
    var prevu = (j.prevuDemain && j.prevuDemain.taches) || [];
    if (prevu.length) {
      prevu.forEach(function (t) { ligne(doc, '→ ' + t, { size: 8.4 }); });
    } else {
      ligne(doc, '—', { size: 8.4, color: GRIS });
    }
    if (j.prevuDemain && j.prevuDemain.effectif) ligne(doc, 'Effectif prévu : ' + j.prevuDemain.effectif + ' personne(s)', { size: 8.2, color: GRIS });
    var besoins = (j.prevuDemain && j.prevuDemain.besoins) || [];
    if (besoins.length) ligne(doc, 'Besoins : ' + besoins.join(' · '), { size: 8.2, color: GRIS });

    /* --------------------- 12. demandes aux responsables ------------- */
    if (besoins.length || ouverts.length) {
      titreSection(doc, '12. Demandes aux responsables');
      ouverts.forEach(function (o) {
        var b = o.blocage;
        /* action attendue, puis le blocage concerné : les deux sont lisibles
           séparément (l'action est une demande, la description un constat) */
        var demande = (b.action || '').trim();
        ligne(doc, '• ' + M.libelle(M.DEBLOQUEURS, b.debloqueur) + ' — ' +
          (demande ? demande + ' : ' : '') + b.description +
          (b.echeance ? ' (' + b.echeance + ')' : ''), { size: 8.4 });
      });
      besoins.forEach(function (b2) { ligne(doc, '• ' + b2, { size: 8.4 }); });
    }

    /* ----------------------------- 13. photos ------------------------ */
    var photos = ctx.photos || [];
    if (photos.length) {
      titreSection(doc, '13. Photos');
      var parLigne = 3;
      var largeur = (doc.contentWidth - 8 * (parLigne - 1)) / parLigne;
      var i = 0;
      while (i < photos.length) {
        var hauteurMax = 0;
        var lot = [];
        for (var k = 0; k < parLigne && i + k < photos.length; k++) {
          var ph = photos[i + k];
          try {
            var oct = Pdf.dataUrlToBytes(ph.dataUrl);
            var d = Pdf.jpegDims ? Pdf.jpegDims(oct) : null;
            var hh = d && d.w ? largeur * (d.h / d.w) : largeur * 0.7;
            if (hh > hauteurMax) hauteurMax = hh;
            lot.push({ octets: oct, h: hh, legende: ph.legende || '' });
          } catch (e) { /* photo illisible : ignorée */ }
        }
        if (!lot.length) break;
        hauteurMax = Math.min(hauteurMax, 150);
        var hauteurTotale = hauteurMax + 14;
        doc.ensure(hauteurTotale + 6);
        var xp = doc.margin;
        lot.forEach(function (l) {
          doc.image(l.octets, xp, doc.y, largeur, Math.min(l.h, hauteurMax));
          if (l.legende) doc.text(l.legende.slice(0, 60), xp, doc.y + Math.min(l.h, hauteurMax) + 8, { size: 6.8, color: GRIS });
          xp += largeur + 8;
        });
        doc.y += hauteurTotale;
        i += parLigne;
      }
    }

    /* ---------------------------- 14. diffusion ---------------------- */
    /* la section reste d'un seul bloc : jamais de titre orphelin en bas de page */
    doc.ensure(58);
    titreSection(doc, '14. Diffusion et visas internes');
    var dest = ctx.destinataires || [];
    var destTxt = dest.filter(function (d) { return !d.copie; }).map(function (d) {
      return d.libelle + (d.nom ? ' (' + d.nom + ')' : '');
    }).join(' · ');
    var copieTxt = dest.filter(function (d) { return d.copie; }).map(function (d) { return d.libelle + (d.nom ? ' (' + d.nom + ')' : ''); }).join(' · ');
    var alertes = M.alerteGrave(j);
    if (alertes.alerte) ligne(doc, 'Alerte du jour : ' + (alertes.gravite1.length ? alertes.gravite1.length + ' blocage(s) de gravité 1' : '') +
      (alertes.securite.length ? (alertes.gravite1.length ? ' · ' : '') + alertes.securite.length + ' incident(s) de sécurité' : '') +
      ' — direction technique en copie.', { size: 8.2, bold: true, color: ROUGE });
    ligne(doc, 'Destinataires : ' + (destTxt || '—'), { size: 8.2 });
    if (copieTxt) ligne(doc, 'En copie : ' + copieTxt, { size: 8.2, color: GRIS });
    ligne(doc, 'Document interne BFR Systems — non adressé au client.', { size: 7.8, color: GRIS });

    /* ----------------------------- pied de page ---------------------- */
    var reference = (ch.numeroAffaire ? ch.numeroAffaire + ' · ' : '') + 'Point du soir — J' + j.numero + ' — ' + M.texteDateCourt(j.date);
    doc.addFooters(function (doc2, page, total) {
      doc2.line(doc2.margin, doc2.H - doc2.margin + 4, doc2.margin + doc2.contentWidth, doc2.H - doc2.margin + 4, { color: BORD, width: 0.6 });
      doc2.text(reference, doc2.margin, doc2.H - doc2.margin + 13, { size: 6.8, color: GRIS });
      var soc = S.societe || {};
      doc2.text([soc.nom, soc.cpVille, soc.tel].filter(Boolean).join(' · ') + '   |   Document interne — diffusion restreinte',
        doc2.margin + doc2.contentWidth, doc2.H - doc2.margin + 13, { size: 6.8, color: GRIS, align: 'right' });
      doc2.text('Page ' + page + ' / ' + total, doc2.margin + doc2.contentWidth, doc2.H - doc2.margin + 4, { size: 6.8, color: GRIS, align: 'right' });
    });

    return doc;
  }

  /* Libellé d'un jalon (utilitaire local, tolérant) */
  function libelleJalon(chantier, jalonId) {
    if (!jalonId) return '';
    var j = M.parId(chantier.jalons || [], jalonId);
    return j ? j.libelle : '';
  }

  var Pdf = global.Pdf;

  /* ------------------------------- Fabriques --------------------------- */

  function document(ctx) {
    var doc = new Pdf.Doc({ margin: 36 });
    dessiner(doc, ctx);
    return { blob: doc.blob(), doc: doc };
  }

  function apercu(ctx) {
    var doc = new Pdf.Apercu({ margin: 36 });
    dessiner(doc, ctx);
    return doc;
  }

  /* ------------------------------ Textes mail -------------------------- */

  function message(ctx) {
    var S = ctx.reglages || {};
    var u = S.utilisateur || {};
    var signataire = (S.mail && S.mail.signatureTexte) ||
      ['Cordialement', '', [u.prenom, u.nom].filter(Boolean).join(' ') + (u.fonction ? ' — ' + u.fonction : ''),
        (S.societe && S.societe.nom) || '', u.tel || ''].filter(Boolean).join('\n');
    var destinataires = ctx.destinataires || [];
    var adresses = destinataires.filter(function (d) { return d.email; }).map(function (d) { return d.email; });
    return {
      objet: (S.mail && S.mail.objet) ? S.mail.objet
        .replace(/\{\{numeroAffaire\}\}/g, ctx.chantier.numeroAffaire || '')
        .replace(/\{\{chantier\}\}/g, ctx.chantier.libelle || '')
        .replace(/\{\{jour\}\}/g, String(ctx.journee.numero))
        .replace(/\{\{date\}\}/g, M.texteDateCourt(ctx.journee.date))
        : M.objetMail(ctx.chantier, ctx.journee, M.compteurs(ctx.journee, ctx.cumul)),
      corps: M.corpsMail(ctx.chantier, ctx.journee, ctx.avancement, {
        cumul: ctx.cumul,
        blocagesOuverts: ctx.blocagesOuverts,
        signataire: signataire
      }),
      destinataires: destinataires,
      adresses: adresses,
      messagePartage: (S.mail && S.mail.messagePartage) || ''
    };
  }

  global.PointSoir = {
    dessiner: dessiner,
    document: document,
    apercu: apercu,
    message: message
  };
})(window);

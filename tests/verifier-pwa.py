#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vérification de l'application installable — BFR Chantier
=======================================================================
Contrôle ce qui décide de l'installation sur un téléphone : l'identité de
l'application et ses fichiers.

Le point délicat : plusieurs applications publiées sous le même compte GitHub
(…github.io/BFR-Report/ et …github.io/BFR-Chantier/) partagent la **même
origine**. Chrome distingue deux applications par l'identifiant du manifeste
(`id`) : s'il est absent, identique, ou calculé de la même façon, Chrome croit
que l'application est déjà installée et refuse de l'installer.

    python3 tests/verifier-pwa.py

Sortie : code 0 si l'identité est nette, 1 sinon.
"""

import json
import os
import re
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(RACINE, 'docs')

# Identifiant du manifeste : chemin absolu, propre au projet, jamais réutilisé.
ID_ATTENDU = '/BFR-Chantier/'
ID_DU_SAV = 'bfr-sav-v3-bleu-petrole'      # projet BFR-Report (source : son manifeste)

FICHIERS_ATTENDUS = ['index.html', 'manifest.json', 'sw.js', 'diagnostic.html',
                     'icon-192.png', 'icon-512.png', 'favicon.png',
                     'apple-touch-icon.png', '.nojekyll']


def main():
    problemes = []
    avis = []

    # ------------------------------------------------------ 1. le manifeste
    chemin = os.path.join(DOCS, 'manifest.json')
    if not os.path.isfile(chemin):
        print('Manifeste absent : lancez python3 build.py')
        return 1
    with open(chemin, encoding='utf-8') as f:
        mf = json.load(f)

    ident = mf.get('id', '')
    if not ident:
        problemes.append('manifeste : « id » absent (Chrome calculerait l\'identité depuis start_url)')
    elif ident == ID_DU_SAV:
        problemes.append('manifeste : identifiant identique à celui du projet SAV (conflit d\'installation)')
    elif not ident.startswith('/'):
        avis.append('manifeste : « id » relatif (%r) — un chemin absolu est plus sûr : %s' % (ident, ID_ATTENDU))
    elif ident != ID_ATTENDU:
        avis.append('manifeste : « id » = %r (attendu %r)' % (ident, ID_ATTENDU))

    if mf.get('start_url') != './':
        problemes.append('manifeste : start_url = %r (attendu « ./ »)' % mf.get('start_url'))
    if mf.get('scope') != './':
        problemes.append('manifeste : scope = %r (attendu « ./ »)' % mf.get('scope'))
    if mf.get('display') not in ('standalone', 'fullscreen', 'minimal-ui'):
        problemes.append('manifeste : display = %r' % mf.get('display'))
    if str(mf.get('theme_color', '')).lower() != '#332e72':
        problemes.append('manifeste : theme_color = %r (charte BFR : #332e72)' % mf.get('theme_color'))
    if len(mf.get('icons') or []) < 2:
        problemes.append('manifeste : moins de deux icônes déclarées')
    if not any((i.get('purpose') or '').find('maskable') >= 0 for i in (mf.get('icons') or [])):
        avis.append('manifeste : aucune icône « maskable » (icône rognée sur Android)')
    if mf.get('name', '').startswith('BFR SAV'):
        problemes.append('manifeste : nom de l\'application SAV')

    # ---------------------------------------- 2. les fichiers du site publié
    for nom in FICHIERS_ATTENDUS:
        if not os.path.isfile(os.path.join(DOCS, nom)):
            problemes.append('fichier manquant dans docs/ : ' + nom)

    index = os.path.join(DOCS, 'index.html')
    if os.path.isfile(index):
        with open(index, encoding='utf-8') as f:
            html = f.read()
        if '<link rel="manifest" href="manifest.json">' not in html:
            problemes.append('index.html : lien vers le manifeste absent')
        if "serviceWorker.register('sw.js')" not in html:
            problemes.append('index.html : enregistrement du service worker absent')
        if 'noindex' not in html:
            problemes.append('index.html : pas de « noindex » (site privé)')
        if len(html) < 100000:
            problemes.append('index.html : application non assemblée (%d octets)' % len(html))

    # ------------------------------------------- 3. version et cohérence du cache
    sw = os.path.join(DOCS, 'sw.js')
    if os.path.isfile(sw):
        with open(sw, encoding='utf-8') as f:
            code = f.read()
        m = re.search(r"const CACHE = '([^']+)'", code)
        if not m:
            problemes.append('sw.js : nom de cache introuvable')
        else:
            nombre = m.group(1)
            if os.path.isfile(os.path.join(DOCS, 'index.html')):
                with open(index, encoding='utf-8') as f:
                    html = f.read()
                v = re.search(r'window\.BFR_VERSION="([a-f0-9]+)"', html)
                if not v:
                    v = re.search(r'BFR_VERSION="([a-f0-9]+)"', html)
                if v and v.group(1) not in nombre:
                    problemes.append('sw.js : cache %r et version %r désaccordés'
                                     % (nombre, v.group(1)))
        if 'diagnostic.html' in code:
            avis.append('sw.js : la page de diagnostic est mise en cache (à éviter)')

    # --------------------------------------------------------------- bilan
    print('=' * 64)
    print('  APPLICATION INSTALLABLE — BFR Chantier')
    print('=' * 64)
    print('  identifiant de l\'application : %s' % (ident or '(absent)'))
    print('  identifiant du projet SAV    : %s' % ID_DU_SAV)
    if problemes:
        print('  À CORRIGER : %d' % len(problemes))
        for p in problemes:
            print('   ✗ ' + p)
        for a in avis:
            print('   · ' + a)
        print('=' * 64 + '\n')
        return 1
    print('  → identité nette : Chrome peut installer cette application')
    print('    indépendamment de BFR SAV, sur le même téléphone.')
    for a in avis:
        print('   · ' + a)
    print('=' * 64 + '\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())

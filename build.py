#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BFR-CHANTIER — assemblage de l'application
-----------------------------------------------------------------------------
Produit :
  • BFR-Chantier.html   : l'application complète en un seul fichier (dépannage)
  • docs/               : le site publiable (GitHub Pages), installable et
                          fonctionnant hors connexion (service worker)

Usage :  python3 build.py                 build de travail (tout embarqué)
         python3 build.py --sans-donnees   build PUBLIABLE sur GitHub :
                                           aucune adresse, aucun nom de client

Le mode --sans-donnees vérifie le projet avec tests/verifier-publication.py
ET refuse de construire si une donnée nominative y subsiste. C'est ce mode qui
sert à préparer le dépôt public (voir preparer-depot-public.py).

Aucune dépendance : les icônes PNG sont dessinées par ce script.
"""

import datetime
import hashlib
import json
import os
import re
import shutil
import struct
import sys
import zlib

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'app', 'src')
APP = os.path.join(ROOT, 'app')
SITE = os.path.join(ROOT, 'docs')
OUT_SINGLE = os.path.join(ROOT, 'BFR-Chantier.html')

# ---------------------------------------------------------------------------
# Dépôt public : l'application est publiée SANS les adresses des responsables
# (ni celles de la société). Chaque utilisateur les saisit une fois dans
# Menu → Réglages → Responsables, sur son téléphone. Voir PUBLIER-SUR-GITHUB.md
# ---------------------------------------------------------------------------
SANS_DONNEES = ('--sans-donnees' in sys.argv) or ('--sans-liste' in sys.argv)


def verifier_publication():
    """Empêche la construction d'une version publique si une donnée
    nominative subsiste (adresse e-mail réelle, téléphone, nom de client)."""
    import subprocess
    controle = os.path.join(ROOT, 'tests', 'verifier-publication.py')
    if not os.path.isfile(controle):
        raise SystemExit('Contrôle manquant : ' + controle)
    resultat = subprocess.call([sys.executable, controle])
    if resultat != 0:
        raise SystemExit('\nBuild public interrompu : retirez les données nominatives ci-dessus.')


# Ordre de chargement : le modèle d'abord, l'application en dernier
MODULES = [
    ('MODELE', 'modele.js'),
    ('STORE', 'store.js'),
    ('USAGE', 'usage.js'),
    ('PDF', 'pdf.js'),
    ('ICONS', 'icons.js'),
    ('ANNOT', 'annotate.js'),
    ('LOGO', 'logo-bfr.js'),
    ('MARQUE', 'marque-bfr.js'),
    ('UI', 'ui.js'),
    ('POINTSOIR', 'pointsoir.js'),
    ('ECRANS', 'ecrans.js'),
    ('APP', 'app.js'),
]

VERSION_APP = '1.0.0'


# --------------------------------------------------------------------------
# Icônes PNG (aucune dépendance) : fond cyan arrondi, engrenage/bâtiment stylisé
# --------------------------------------------------------------------------
def png_icon(size):
    """Icône « chantier » : dégradé cyan -> bleu nuit, arête de toit + crochet."""
    haut, bas = (6, 186, 242), (31, 28, 69)
    blanc = (255, 255, 255)
    r = size * 0.22

    def seg_dist(px, py, ax, ay, bx, by):
        vx, vy = bx - ax, by - ay
        wx, wy = px - ax, py - ay
        t = 0.0
        if vx * vx + vy * vy > 0:
            t = max(0.0, min(1.0, (wx * vx + wy * vy) / (vx * vx + vy * vy)))
        dx, dy = wx - t * vx, wy - t * vy
        return (dx * dx + dy * dy) ** 0.5

    # toit du bâtiment (deux pentes) + base
    A = (size * 0.20, size * 0.50)
    B = (size * 0.50, size * 0.26)
    C = (size * 0.80, size * 0.50)
    D = (size * 0.20, size * 0.76)
    E2 = (size * 0.80, size * 0.76)
    ep = size * 0.062

    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            cx, cy = x + 0.5, y + 0.5
            dx, dy = min(cx, size - cx), min(cy, size - cy)
            dedans = True
            if dx < r and dy < r:
                dedans = ((r - dx) ** 2 + (r - dy) ** 2) ** 0.5 <= r
            if not dedans:
                row += bytes((0, 0, 0, 0))
                continue
            t = (cx + cy) / (2 * size)
            col = tuple(int(haut[i] + (bas[i] - haut[i]) * t) for i in range(3))
            d = min(seg_dist(cx, cy, A[0], A[1], B[0], B[1]),
                    seg_dist(cx, cy, B[0], B[1], C[0], C[1]),
                    seg_dist(cx, cy, D[0], D[1], E2[0], E2[1]))
            if d < ep:
                a = 1.0 if d < ep - 1 else max(0.0, (ep - d))
                col = tuple(int(col[i] + (blanc[i] - col[i]) * a) for i in range(3))
            row += bytes(col + (255,))
        rows.append(bytes(row))
    raw = b''.join(rows)

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) +
            chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


def ecrire_icones(dossier):
    os.makedirs(dossier, exist_ok=True)
    icons_src = os.path.join(APP, 'icons')
    if os.path.isdir(icons_src) and any(f.endswith('.png') for f in os.listdir(icons_src)):
        for f in os.listdir(icons_src):
            if f.endswith('.png'):
                shutil.copy2(os.path.join(icons_src, f), os.path.join(dossier, f))
        return
    for nom, taille in {'icon-192.png': 192, 'icon-512.png': 512,
                        'apple-touch-icon.png': 180, 'favicon.png': 64}.items():
        with open(os.path.join(dossier, nom), 'wb') as f:
            f.write(png_icon(taille))


# --------------------------------------------------------------------------
# Assemblage
# --------------------------------------------------------------------------
def lire(chemin):
    with open(chemin, encoding='utf-8') as f:
        return f.read()


def marque_du_bandeau():
    """Le logo officiel BFR Systems, lu dans app/src/marque-bfr.js : source
    unique de l'image (app/src/marque-bfr.js est produit par
    outils/preparer-marque.py)."""
    trouve = re.search(r"window\.MARQUE_BFR_TOPBAR\s*=\s*'([^']+)'",
                       lire(os.path.join(SRC, 'marque-bfr.js')))
    if not trouve:
        raise SystemExit('Marque introuvable dans app/src/marque-bfr.js')
    return trouve.group(1)


def construire_single_file(avec_pwa=True):
    html = lire(os.path.join(APP, 'index.html'))
    # le bandeau s'affiche avant l'exécution des scripts : la marque est posée ici
    if '<!--LOGO-BANDEAU-->' not in html:
        raise SystemExit('Marqueur introuvable dans app/index.html : LOGO-BANDEAU')
    html = html.replace('<!--LOGO-BANDEAU-->',
                        '<img class="topbar-marque" src="%s" alt="BFR Chantier" title="BFR Systems">'
                        % marque_du_bandeau())
    html = html.replace('<style>/*<!--CSS-->*/</style>',
                        '<style>\n' + lire(os.path.join(SRC, 'style.css')) + '\n</style>')
    for marqueur, fichier in MODULES:
        balise = '<script>/*<!--%s-->*/</script>' % marqueur
        if balise not in html:
            raise SystemExit('Marqueur introuvable dans app/index.html : ' + marqueur)
        html = html.replace(balise, '<script>\n/* ===== %s ===== */\n%s\n</script>' % (fichier, lire(os.path.join(SRC, fichier))))
    if not avec_pwa:
        # fichier unique : pas de service worker ni de manifeste externe
        html = html.replace('<link rel="manifest" href="manifest.json">', '')
        html = html.replace("if ('serviceWorker' in navigator && location.protocol === 'https:')",
                            "if (false)")
    return html


def injecter_version(html, version, date_build):
    balise = ('<script>window.CHANTIER_VERSION="%s";window.CHANTIER_DATE="%s";</script></body>'
              % (version, date_build))
    if html.count('</body>') != 1:
        raise SystemExit('Balise </body> attendue une seule fois dans app/index.html')
    return html.replace('</body>', balise)


SW = """/* Service worker BFR-Chantier — application hors connexion.
   Stratégie : réseau d'abord (la nouvelle version est prise dès la prochaine
   ouverture avec du réseau), puis le cache. Si le réseau met plus de 3,5 s,
   le cache est servi sans attendre. Le nom du cache contient l'empreinte du
   build : chaque publication remplace la précédente. */
const CACHE = 'bfr-chantier-__VERSION__';
const FICHIERS = ['./', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './favicon.png', './apple-touch-icon.png'];
const DELAI_RESEAU = 3500;

const delai = (ms) => new Promise((ok) => setTimeout(ok, ms));

function servir(requete, estPage) {
  const optionsFetch = (estPage || requete.url.includes('manifest')) ? { cache: 'no-cache' } : {};
  const reseau = fetch(requete, optionsFetch).then((rep) => {
    if (rep && rep.ok) {
      const copie = rep.clone();
      caches.open(CACHE).then((c) => c.put(requete, copie)).catch(() => {});
    }
    return rep && rep.ok ? rep : null;
  }).catch(() => null);

  return Promise.race([reseau, delai(DELAI_RESEAU)]).then((vite) =>
    vite || caches.match(requete)
      .then((c) => c || (estPage ? caches.match('./') : null))
      .then((c) => c || reseau)
      .then((c) => c || new Response('Hors connexion', { status: 503 }))
  );
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((noms) => Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.action === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(servir(e.request, e.request.mode === 'navigate'));
});
"""

# L'identifiant de l'application (id) est ce qui la distingue, sur le téléphone,
# d'une autre application installée depuis le même domaine. Deux applications
# publiées sous le même compte GitHub (…github.io/BFR-Report/ et
# …github.io/BFR-Chantier/) partagent l'origine : l'identifiant doit donc être
# explicite, en chemin absolu, et n'être jamais réutilisé pour une autre
# application. Voir diagnostic.html et PUBLIER-SUR-GITHUB.md (§ 7).
# L'identité de l'application (champ « id ») est ce qui la distingue, pour
# Chrome, d'une autre application servie depuis le même domaine (b-ertran-d.github.io
# héberge aussi BFR-Report, l'application SAV).
#
# ATTENTION — si Chrome répond « cette application est déjà installée » alors
# qu'aucune application BFR Chantier ne figure dans les applications du
# téléphone, c'est que Chrome garde un enregistrement d'installation périmé.
# Le remède est de CHANGER, ENSEMBLE :
#   · l'identifiant  (id)         → ici « …-2 », puis « …-3 » ;
#   · l'adresse de démarrage (start_url) → « ./index.html », puis « ./index.html?s=3 ».
# Changer l'identifiant seul ne suffit pas toujours : l'enregistrement périmé est
# retrouvé par l'adresse de démarrage. Les deux doivent donc changer en même temps
# (constaté le 7 octobre 2026 : identifiant neuf publié, message persistant).
# Les données, elles, appartiennent au site : elles ne bougent pas. La portée
# (scope) « ./ » couvre tout le dossier, l'application s'ouvre donc normalement.
# Voir PUBLIER-SUR-GITHUB.md (§ 7).
MANIFEST = {
    "id": "bfr-chantier-installation-2",
    "name": "BFR Chantier — suivi des installations et formations",
    "short_name": "BFR Chantier",
    "description": "Suivi des journées de chantier, point du soir envoyé aux responsables, sessions de formation. Fonctionne hors connexion.",
    "lang": "fr",
    # start_url : identité de l'installation, au même titre que « id ».
    # Deux applications du même domaine (BFR Chantier, BFR SAV) doivent avoir
    # des start_url différentes — et un enregistrement périmé se retrouve par
    # cette adresse : la changer est le geste qui débloque.
    "start_url": "./index.html",
    "scope": "./",
    "display": "standalone",
    "orientation": "portrait",
    "background_color": "#ffffff",
    "theme_color": "#332e72",
    "icons": [
        {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
        {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
        {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
    ],
    # Permet à la page de diagnostic de savoir si Chrome considère
    # l'application comme installée (navigator.getInstalledRelatedApps).
    "related_applications": [
        {"platform": "webapp", "url": "./manifest.json"}
    ]
}


def main():
    if SANS_DONNEES:
        verifier_publication()

    version = hashlib.sha256(construire_single_file(avec_pwa=True).encode('utf-8')).hexdigest()[:10]
    date_build = datetime.date.today().strftime('%d/%m/%Y')

    # 1) fichier unique (dépannage : un seul fichier à ouvrir dans Chrome)
    html_unique = injecter_version(construire_single_file(avec_pwa=False), version, date_build)
    with open(OUT_SINGLE, 'w', encoding='utf-8') as f:
        f.write(html_unique)

    # 2) site publiable
    os.makedirs(SITE, exist_ok=True)
    html_pwa = injecter_version(construire_single_file(avec_pwa=True), version, date_build)
    # le site publié vit dans docs/ (GitHub Pages) ; l'application en un seul
    # fichier (BFR-Chantier.html) est écrite plus haut. Pas de copie à la racine :
    # une seule source de vérité.
    with open(os.path.join(SITE, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html_pwa)

    ecrire_icones(SITE)
    # page de diagnostic de l'installation (à ouvrir sur le téléphone)
    diag = os.path.join(APP, 'diagnostic.html')
    if os.path.isfile(diag):
        shutil.copyfile(diag, os.path.join(SITE, 'diagnostic.html'))
    for nom, contenu in (('sw.js', SW.replace('__VERSION__', version)), ):
        with open(os.path.join(SITE, nom), 'w', encoding='utf-8') as f:
            f.write(contenu)
    with open(os.path.join(SITE, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(MANIFEST, f, ensure_ascii=False, indent=2)
    open(os.path.join(SITE, '.nojekyll'), 'w').close()

    for p in (OUT_SINGLE, os.path.join(SITE, 'index.html')):
        print('%-34s %9.0f Ko' % (os.path.relpath(p, ROOT), os.path.getsize(p) / 1024))
    print('version du build : ' + version + '  (application ' + VERSION_APP + ')')
    if SANS_DONNEES:
        print('DÉPÔT PUBLIC : aucune adresse embarquée — les destinataires se saisissent')
        print('               dans Menu → Réglages → Responsables (une fois par téléphone).')
    print('docs/ : ' + ' '.join(sorted(os.listdir(SITE))))


if __name__ == '__main__':
    main()

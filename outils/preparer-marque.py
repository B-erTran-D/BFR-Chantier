#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BFR-CHANTIER — préparation de la marque officielle BFR Systems
-----------------------------------------------------------------------------
Transforme le logo officiel (assets/logo-bfr-topbar.png) en image embarquée
dans l'application (app/src/marque-bfr.js), pour que le bandeau du haut
affiche la marque BFR Systems même hors connexion.

    python3 outils/preparer-marque.py [source.png]

Ce que fait le script :

  1. ouvre le logo officiel et retire ses marges transparentes ;
  2. l'agrandit ×3 (l'original est petit : 200 × 23 px utiles) : l'image
     servie est nette sur les écrans à haute densité ;
  3. l'enregistre en PNG à 64 couleurs — la marque n'utilise que deux
     teintes (blanc et cyan #06baf2) : 5 Ko au lieu de 30 Ko ;
  4. écrit app/src/marque-bfr.js avec DEUX images :
       • MARQUE_BFR_TOPBAR  : le logo complet (« BFR SYSTEMS »), pour le
         bandeau d'accueil, où il remplace le titre ;
       • MARQUE_BFR_SIGNET  : la marque « BFR » seule, sans le bloc « SYSTEMS »,
         pour la barre du haut des écrans de travail, où le logo complet ne
         laisserait plus assez de place au nom du chantier.

Pourquoi embarquée : l'application doit afficher sa marque sans réseau, et un
fichier unique (BFR-Chantier.html) ne peut pas dépendre d'une image voisine.

Dépendance : Pillow (python3 -m pip install Pillow). Rien d'autre.
"""

import base64
import io
import os
import sys

try:
    from PIL import Image
except ImportError:
    raise SystemExit('Pillow est nécessaire : python3 -m pip install Pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'assets', 'logo-bfr-topbar.png')
CIBLE = os.path.join(ROOT, 'app', 'src', 'marque-bfr.js')

FACTEUR = 3          # agrandissement : net sur écrans 2× et 3×
COULEURS = 64        # PNG-8 : la marque tient en deux teintes
SEUIL_ALPHA = 8      # marge transparente ignorée


ENTETE = """/* Marque officielle BFR Systems — bandeau du haut de l'application.
   Source : assets/logo-bfr-topbar.png (fichier officiel, repris à l'identique
   du dépôt BFR-Report), recadré et agrandi x%d par outils/preparer-marque.py.
   Il s'agit de la variante « fond foncé » du logo : lettres blanches et bloc
   cyan, prévue pour le bandeau bleu nuit. Ne pas modifier à la main.
   Mise à jour du logo : remplacer assets/logo-bfr-topbar.png puis relancer
   python3 outils/preparer-marque.py ; les règles d'usage sont dans
   assets/README.md. */
window.MARQUE_BFR_TOPBAR = '%s';
"""


SIGNET = """/* Marque « BFR » seule (sans le bloc « SYSTEMS ») : la barre du haut des écrans
   de travail, où le logo complet ne laisserait plus assez de place au nom du
   chantier. Même source officielle, recadrée avant le bloc cyan et agrandie
   x%d par outils/preparer-marque.py. */
window.MARQUE_BFR_SIGNET = '%s';
"""


def main():
    source = sys.argv[1] if len(sys.argv) > 1 else SOURCE
    if not os.path.isfile(source):
        raise SystemExit('Logo officiel introuvable : ' + source)

    logo = Image.open(source).convert('RGBA')
    boite = logo.split()[3].point(lambda v: 255 if v > SEUIL_ALPHA else 0).getbbox()
    if not boite:
        raise SystemExit('Logo vide : ' + source)
    marque = logo.crop(boite)
    print('source      : %s (%d x %d, contenu utile %d x %d)'
          % (os.path.relpath(source, ROOT), logo.width, logo.height, marque.width, marque.height))
    print('rapport     : %.2f:1  →  à 22 px de haut, la marque mesure %d px de large'
          % (marque.width / marque.height, round(22 * marque.width / marque.height)))

    # --- signet « BFR » : tout ce qui précède le bloc cyan « SYSTEMS » -----
    def colonne_du_bloc(image):
        """Première colonne occupée par le bloc cyan (l'élément le plus large
        et le plus coloré du logo) : c'est là que s'arrête la marque « BFR »."""
        px = image.load()
        for x in range(image.width):
            cyan = 0
            for y in range(image.height):
                r, v, b, a = px[x, y]
                if a > 200 and b > 150 and v > 120 and r < 120:
                    cyan += 1
            if cyan > image.height * 0.4:      # colonne franchement dans le bloc
                return x
        return image.width
    fin = colonne_du_bloc(marque)
    signet = marque.crop((0, 0, max(1, fin - 4), marque.height))
    print('signet      : « BFR » seul, %d x %d px (le bloc cyan commence à x=%d)'
          % (signet.width, signet.height, fin))

    grand = marque.resize((marque.width * FACTEUR, marque.height * FACTEUR), Image.LANCZOS)
    tampon = io.BytesIO()
    grand.quantize(colors=COULEURS, method=Image.FASTOCTREE).save(tampon, 'PNG', optimize=True)
    octets = tampon.getvalue()
    base64_image = 'data:image/png;base64,' + base64.b64encode(octets).decode('ascii')

    grand_signet = signet.resize((signet.width * FACTEUR, signet.height * FACTEUR), Image.LANCZOS)
    tampon2 = io.BytesIO()
    grand_signet.quantize(colors=COULEURS, method=Image.FASTOCTREE).save(tampon2, 'PNG', optimize=True)
    octets2 = tampon2.getvalue()
    base64_signet = 'data:image/png;base64,' + base64.b64encode(octets2).decode('ascii')
    print('signet x%d   : %d x %d px, %.1f Ko'
          % (FACTEUR, grand_signet.width, grand_signet.height, len(octets2) / 1024))

    with open(CIBLE, 'w', encoding='utf-8') as f:
        f.write(ENTETE % (FACTEUR, base64_image))
        f.write(SIGNET % (FACTEUR, base64_signet))

    print('image       : %d x %d px, %.1f Ko (base64 %.1f Ko)'
          % (grand.width, grand.height, len(octets) / 1024, len(base64_image) / 1024))
    print('écrit       : %s (%.1f Ko)' % (os.path.relpath(CIBLE, ROOT),
                                          os.path.getsize(CIBLE) / 1024))
    print('\nÉtape suivante : python3 build.py --sans-donnees')


if __name__ == '__main__':
    main()

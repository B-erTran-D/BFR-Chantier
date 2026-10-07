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
  2. l'agrandit ×3 (l'original est petit : 180 × 21 px utiles) : l'image
     servie est nette sur les écrans à haute densité ;
  3. l'enregistre en PNG à 64 couleurs — la marque n'utilise que deux
     teintes (blanc et cyan #06baf2) : 5 Ko au lieu de 30 Ko ;
  4. écrit app/src/marque-bfr.js avec UNE seule image :

       MARQUE_BFR_TOPBAR : le logo complet (« BFR SYSTEMS »), tel quel.

     C'est la seule forme de marque de l'application : elle ouvre le bandeau
     du haut de tous les écrans. Un « BFR » recadré n'est pas le logo BFR
     Systems — il ne doit pas être fabriqué ni affiché (décision du 7 oct.
     2026 : le bandeau de la journée n'a plus sa marque courte).

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


def main():
    source = sys.argv[1] if len(sys.argv) > 1 else SOURCE
    if not os.path.isfile(source):
        raise SystemExit('Logo officiel introuvable : ' + source)

    logo = Image.open(source).convert('RGBA')
    boite = logo.split()[3].point(lambda v: 255 if v > SEUIL_ALPHA else 0).getbbox()
    if not boite:
        raise SystemExit('Logo vide : ' + source)
    marque = logo.crop(boite)
    rapport = marque.width / marque.height
    print('source      : %s (%d x %d, contenu utile %d x %d)'
          % (os.path.relpath(source, ROOT), logo.width, logo.height, marque.width, marque.height))
    print('rapport     : %.2f:1  →  à 20 px de haut, la marque mesure %d px de large'
          % (rapport, round(20 * rapport)))
    print('                (17 px sur téléphone étroit, 24 px au-delà de 620 px)')

    grand = marque.resize((marque.width * FACTEUR, marque.height * FACTEUR), Image.LANCZOS)
    tampon = io.BytesIO()
    grand.quantize(colors=COULEURS, method=Image.FASTOCTREE).save(tampon, 'PNG', optimize=True)
    octets = tampon.getvalue()
    base64_image = 'data:image/png;base64,' + base64.b64encode(octets).decode('ascii')

    with open(CIBLE, 'w', encoding='utf-8') as f:
        f.write(ENTETE % (FACTEUR, base64_image))

    print('image       : %d x %d px, %.1f Ko (base64 %.1f Ko)'
          % (grand.width, grand.height, len(octets) / 1024, len(base64_image) / 1024))
    print('écrit       : %s (%.1f Ko)' % (os.path.relpath(CIBLE, ROOT),
                                          os.path.getsize(CIBLE) / 1024))
    print('\nÉtape suivante : python3 build.py --sans-donnees')


if __name__ == '__main__':
    main()

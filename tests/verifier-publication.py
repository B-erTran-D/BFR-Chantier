#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Garde-fou de publication — BFR Chantier
=======================================================================
Vérifie qu'AUCUNE donnée nominative ne peut partir dans le dépôt public :
adresses e-mail réelles, numéros de téléphone, liste de clients, noms de
personnes. À lancer avant chaque publication, et appelé automatiquement
par « preparer-depot-public.py ».

    python3 tests/verifier-publication.py            # vérifie tout le projet
    python3 tests/verifier-publication.py dossier... # vérifie un dossier

Principe : une adresse e-mail n'est tolérée que sur un domaine de
documentation réservé (exemple.fr, example.com, .test, .invalid…), c'est-à-dire
un domaine qui ne peut pas exister pour de vrai. Tout le reste est refusé.

Sortie : code 0 si tout est propre, 1 sinon (avec la liste des fichiers fautifs).
"""

import os
import re
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------- périmètre
# Ce qui est publié (le reste n'est pas concerné : dossier de travail, builds…)
DOSSIERS_PUBLIES = ['app', 'tests', 'outils', 'docs', 'apercus']
FICHIERS_PUBLIES = ['build.py', 'README.md', 'MODE-EMPLOI.md',
                    'INSTALLATION-COLLEAGUES.md', 'CHARTE-INTERFACE.md']
FICHIERS_TEXTE = ('.js', '.py', '.md', '.html', '.json', '.css', '.txt', '.sh')
IGNORES = ('.git', 'node_modules', '__pycache__', 'depot-public', '.venv')

# ------------------------------------------------------- domaines autorisés
# Domaines de documentation : impossible qu'une adresse y soit réelle.
DOMAINES_AUTORISES = (
    'exemple.fr', 'exemple.com', 'exemple.org', 'exemple.net',
    'example.com', 'example.org', 'example.net', 'example.fr',
    'test', 'invalid', 'localhost', 'example',
)

# --------------------------------------------------------- formes interdites
ADRESSES = re.compile(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}')
TELEPHONES = re.compile(r'(?<![\d.])(?:\+33|0)[1-9](?:[\s.\-]?\d{2}){4}(?![\d.])')
# Noms à ne jamais publier (clients, partenaires). Écrits en morceaux pour que
# ce fichier de contrôle ne se signale pas lui-même.
NOMS_PROPRES = [
    'Lacta' + 'lis',        # client industriel — exemple réel d'affaire
    'SO' + 'TRAM',          # entreprise sur site
    'Del' + 'ko',           # client équipé
]


def fichiers_a_verifier(racine):
    """Liste des fichiers texte du périmètre publié."""
    liste = []
    for nom in FICHIERS_PUBLIES:
        chemin = os.path.join(racine, nom)
        if os.path.isfile(chemin):
            liste.append(chemin)
    for dossier in DOSSIERS_PUBLIES:
        base = os.path.join(racine, dossier)
        for chemin, sous_dossiers, fichiers in os.walk(base):
            sous_dossiers[:] = [d for d in sous_dossiers if d not in IGNORES]
            for f in fichiers:
                if f.endswith(FICHIERS_TEXTE):
                    liste.append(os.path.join(chemin, f))
    return sorted(set(liste))


def verifier_fichier(chemin, racine):
    """Renvoie la liste des problèmes trouvés dans un fichier."""
    try:
        with open(chemin, 'r', encoding='utf-8') as f:
            texte = f.read()
    except (UnicodeDecodeError, OSError):
        return []
    problemes = []

    for adresse in set(ADRESSES.findall(texte)):
        domaine = adresse.rsplit('@', 1)[1].lower()
        if not any(domaine == d or domaine.endswith('.' + d) for d in DOMAINES_AUTORISES):
            problemes.append(u'adresse e-mail à retirer : %s' % adresse)

    for telephone in set(TELEPHONES.findall(texte)):
        if telephone.replace(' ', '') not in ('0000000000', '000000000', '00000000000'):
            problemes.append(u'numéro de téléphone à retirer : %s' % telephone)

    for nom in NOMS_PROPRES:
        if nom in texte:
            problemes.append(u'nom à retirer : %s' % nom)

    return [(os.path.relpath(chemin, racine), p) for p in problemes]


def main():
    racine = sys.argv[1] if len(sys.argv) > 1 else RACINE
    racine = os.path.abspath(racine)

    problemes = []
    fichiers = fichiers_a_verifier(racine)
    for chemin in fichiers:
        problemes += verifier_fichier(chemin, racine)

    # les fichiers construits (livrables) sont vérifiés aussi, s'ils existent
    for livrable in ['BFR-Chantier.html', os.path.join('docs', 'index.html')]:
        chemin = os.path.join(racine, livrable)
        if os.path.isfile(chemin):
            problemes += verifier_fichier(chemin, racine)

    print('=' * 64)
    print(u'  CONTRÔLE AVANT PUBLICATION — BFR Chantier')
    print('=' * 64)
    print(u'  fichiers vérifiés : %d' % len(fichiers))
    if problemes:
        print(u'  À RETIRER AVANT PUBLICATION : %d' % len(problemes))
        for fichier, probleme in problemes:
            print(u'   ✗ %s : %s' % (fichier, probleme))
        print('=' * 64)
        print(u'  Publication bloquée : aucune donnée nominative ne doit partir sur GitHub.')
        return 1
    print(u'  adresses e-mail réelles : 0')
    print(u'  numéros de téléphone     : 0')
    print(u'  noms de clients          : 0')
    print(u'  → le dépôt est propre : rien de nominatif ne sera publié.')
    print('=' * 64 + '\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())

# assets/ — marque officielle BFR Systems

Ce dossier contient le **logo officiel BFR Systems** tel qu'il est fourni par la
société. Il n'est pas dessiné par le projet : il est repris à l'identique du
dépôt `B-erTran-D/BFR-Report` (`assets/logo-bfr-topbar.png`), afin que les deux
applications affichent exactement la même marque.

| Fichier | Contenu | Usage |
|---|---|---|
| `logo-bfr-topbar.png` | Logo « BFR SYSTEMS », 200 × 48 px, fond transparent, variante **fond foncé** (lettres blanches, bloc cyan) | bandeau du haut de l'application |

De ce fichier, l'outil tire **deux images** :

| Constante produite | Contenu | Où elle s'affiche |
|---|---|---|
| `MARQUE_BFR_TOPBAR` | le logo complet « BFR SYSTEMS » | écran d'accueil (à la place du titre) |
| `MARQUE_BFR_SIGNET` | la marque « BFR » seule, avant le bloc « SYSTEMS » | tous les autres bandeaux, avant la flèche de retour |

Le fichier `logo-bfr-topbar.png` est la **source** : il sert à produire
`app/src/marque-bfr.js` (image embarquée dans l'application, pour fonctionner
hors connexion).

## Mettre à jour le logo

1. Remplacer `assets/logo-bfr-topbar.png` par la nouvelle version officielle
   (variante « fond foncé » — c'est celle du bandeau bleu nuit) ;
2. relancer `python3 outils/preparer-marque.py` ;
3. reconstruire : `python3 build.py` puis `NODE_PATH=… sh tests/run.sh`.

## Règles d'usage de la marque

- **Ne jamais recolorer, déformer ni détourner** le logo ; il est utilisé tel quel.
- La variante « fond foncé » (blanche) se place **uniquement** sur le bandeau
  bleu nuit. Sur fond clair, utiliser la variante « fond clair » du logo
  (`logo-bfr.png`, lettres anthracite) — non embarquée aujourd'hui.
- Le logo remplace le titre texte **sur l'écran d'accueil** seulement ; les
  écrans de travail (chantier, journée, réglages) gardent leur titre écrit, plus
  utile au quotidien.

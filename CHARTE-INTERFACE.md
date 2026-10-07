# Charte d'interface — BFR Chantier

> Règle unique : **on ne sort pas de la charte BFR Systems**. Cyan, bleu nuit, bleu ardoise, gris. Aucun émoji coloré, aucune couleur d'alerte orangée.

## 1. Couleurs

| Rôle | Valeur | Usage |
|---|---|---|
| **Cyan BFR** | `#06baf2` | actions principales, jauges, icônes de carte, accents |
| **Cyan profond** | `#0b5f80` | texte sur fond cyan pâle (lisibilité) |
| **Bleu nuit BFR** | `#332e72` | barre du haut, boutons pleins, titres de carte |
| **Encre** | `#1f1c45` | dégradés, textes forts |
| **Bleu ardoise** | `#4a4f6b` | état « à surveiller » — **remplace l'orange** |
| **Gris neutre** | `#64748b` / `#f1f4f8` | état « sans importance », fonds de pastille |
| **Rouge sourd** | `#b42318` | dangers uniquement : blocage grave, incident, suppression |
| **Vert d'état** | `#1c8676` | réussite, confirmation |
| Fonds | `#f5f6f9` page · `#ffffff` carte · `#eef8fd` information | |

Aucune teinte orange, ambre ou violette ne subsiste dans l'application, ni à l'écran, ni dans le PDF du point du soir.

## 2. Marque officielle BFR Systems

Le **logo officiel** figure dans le bandeau du haut, sur l'écran d'accueil : il y remplace le titre texte « BFR Chantier ».

- **Source** : `assets/logo-bfr-topbar.png` — fichier officiel repris **tel quel** du dépôt BFR-Report. C'est la variante « fond foncé » du logo (lettres blanches, bloc cyan `#06baf2`), prévue pour un fond bleu nuit ; la variante « fond clair » (lettres anthracite) ne s'emploie que sur fond blanc.
- **Embarquée** dans l'application (`data:image/png;base64`) pour rester disponible **hors connexion** et dans le fichier unique de dépannage. Elle est produite par `outils/preparer-marque.py` → `app/src/marque-bfr.js` (recadrée, ×3, PNG-8 à 64 couleurs : 5 Ko).
- **Hauteur** : 22 px sur téléphone, 24 px au-delà de 620 px, 20 px sous 360 px. La largeur suit, l'image n'est **jamais étirée** (`object-fit: contain`).
- **Place** : l'accueil uniquement. Les écrans de travail (chantier, journée, point du soir, réglages) gardent leur **titre écrit** — le nom du chantier est plus utile au quotidien qu'un logo. La page `docs/diagnostic.html` porte aussi la marque.
- **Intouchable** : jamais recolorée, jamais déformée, jamais détournée. Nom accessible « BFR Chantier ».

Mise à jour du logo : remplacer `assets/logo-bfr-topbar.png`, relancer `python3 outils/preparer-marque.py`, puis reconstruire. Le détail des règles est dans [`assets/README.md`](assets/README.md).

## 3. Icônes

Toutes les vignettes sont **dessinées** (SVG, grille de 24 px), jamais empruntées à la police d'émojis. Deux déclinaisons :

- **monochrome** — trait seul, pour les listes, champs et boutons ;
- **duotone** — même tracé, avec une forme de fond à 14 % d'opacité, réservée aux en-têtes de carte et aux pastilles d'état.

Elles prennent la couleur du texte (`currentColor`) et s'adaptent donc aux fonds clairs comme à la barre bleu nuit. Jeu complet : [`apercus/icones-bfr-monochrome-et-duotone.png`](apercus/icones-bfr-monochrome-et-duotone.png) (67 icônes).

Les domaines, activités, catégories, états de tâche et résultats d'essai du modèle pointent vers ces icônes par leur nom (`cle`, `eclaire`, `prise`, `automate`, `fiole`, `grue`, `chapeau`, `itineraire`, `sablier`, `reunion`, `bouclier`, `interdit`, `alerte`, `colis`, `valideCercle`, `information`…), et non plus vers des émojis.

## 4. Typographie et rythme

- **Poppins** pour les titres, boutons et chiffres clés ; **Open Sans** pour le texte.
- Titres de carte : 12 px, capitales, interlettrage `0.05em`, bleu nuit, précédés de leur icône.
- Cibles tactiles : 48 px minimum pour les boutons, 40 px pour les boutons secondaires.
- Rayons : 14 px pour les cartes, 13 px pour les boutons, 20 px pour les feuilles modales.
- Ombres discrètes (deux couches très légères) — la hiérarchie vient de l'espace et du contraste, pas des effets.

## 5. Mise en page — une seule largeur pour toute l'interface

L'application se dessine sur **une colonne unique**, la même du haut en bas de l'écran.

| | Téléphone (< 620 px) | Tablette, ordinateur (≥ 620 px) |
|---|---|---|
| Largeur de la colonne | toute la largeur disponible | **760 px** (880 px au-delà de 1080 px), centrée |
| Marge intérieure | 16 px | 22 px |
| Bandeau du haut | pleine largeur, contenu aligné sur la colonne | idem, plus haut (13 px), titre 18 px |
| Onglets | bandeau blanc pleine largeur, onglets alignés | idem, onglets plus aérés |
| Barre du bas | pleine largeur, boutons alignés | idem |
| Feuilles (menu, formulaires) | montent du bas, toute la largeur | centrées sur la colonne, arrondies en bas, détachées de 18 px du bord |

**Ce qui est aligné** : le titre du bandeau, les cartes du contenu, les onglets, les boutons de
la barre du bas et les feuilles partagent **le même bord gauche et le même bord droit**
(`--app-largeur`, `--app-marge`, et la variable `--retrait` qui se calcule à partir des deux).

**Ce qui ne doit jamais arriver** : un bandeau plus étroit que le contenu, une barre du bas
plus large que les cartes, ou un contenu collé à gauche sur grand écran. Le bandeau et les
barres gardent un **fond pleine largeur** (comme sur iPad) ; c'est leur *contenu* qui s'aligne.

Contrôle : `tests/verifier-pwa.py` vérifie l'identité de l'application, et la mesure
d'alignement se refait en une commande (voir `outils/apercus.js` et la capture
`apercus/ecran-grand-ecran.png`).

---

## 6. Comportements

- **Barre du haut** bleu nuit dégradée, titre + sous-titre, une seule action à droite.
- **Feuilles modales** montées du bas (esprit iOS), poignée de fermeture implicite, fond assombri et flouté.
- **Barre d'action** en bas, translucide (`blur`), deux à trois boutons maximum.
- **Onglets** soulignés d'un trait cyan, jamais de pastilles colorées.
- État vide toujours expliqué : ce qu'il faut faire, pas seulement « aucun élément ».

## 7. Vérification

`python3 build.py` puis `sh tests/run.sh` — **120 tests de calcul**, **168 tests d'interface** et **5 étapes de contrôle** (publication, application installable). Ces tests vérifient qu'aucun émoji ne subsiste dans les écrans, que la palette reste dans la charte, que **la marque officielle est bien celle embarquée** (image identique à la constante de l'application, texte de remplacement présent) et que le bandeau partage la même largeur que le contenu.

Aperçus : [`apercus/`](apercus/) (accueil, journée, point du soir, fiche chantier, réglages, menu, feuille de saisie, PDF).

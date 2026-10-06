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

## 2. Icônes

Toutes les vignettes sont **dessinées** (SVG, grille de 24 px), jamais empruntées à la police d'émojis. Deux déclinaisons :

- **monochrome** — trait seul, pour les listes, champs et boutons ;
- **duotone** — même tracé, avec une forme de fond à 14 % d'opacité, réservée aux en-têtes de carte et aux pastilles d'état.

Elles prennent la couleur du texte (`currentColor`) et s'adaptent donc aux fonds clairs comme à la barre bleu nuit. Jeu complet : [`apercus/icones-bfr-monochrome-et-duotone.png`](apercus/icones-bfr-monochrome-et-duotone.png) (67 icônes).

Les domaines, activités, catégories, états de tâche et résultats d'essai du modèle pointent vers ces icônes par leur nom (`cle`, `eclaire`, `prise`, `automate`, `fiole`, `grue`, `chapeau`, `itineraire`, `sablier`, `reunion`, `bouclier`, `interdit`, `alerte`, `colis`, `valideCercle`, `information`…), et non plus vers des émojis.

## 3. Typographie et rythme

- **Poppins** pour les titres, boutons et chiffres clés ; **Open Sans** pour le texte.
- Titres de carte : 12 px, capitales, interlettrage `0.05em`, bleu nuit, précédés de leur icône.
- Cibles tactiles : 48 px minimum pour les boutons, 40 px pour les boutons secondaires.
- Rayons : 14 px pour les cartes, 13 px pour les boutons, 20 px pour les feuilles modales.
- Ombres discrètes (deux couches très légères) — la hiérarchie vient de l'espace et du contraste, pas des effets.

## 4. Comportements

- **Barre du haut** bleu nuit dégradée, titre + sous-titre, une seule action à droite.
- **Feuilles modales** montées du bas (esprit iOS), poignée de fermeture implicite, fond assombri et flouté.
- **Barre d'action** en bas, translucide (`blur`), deux à trois boutons maximum.
- **Onglets** soulignés d'un trait cyan, jamais de pastilles colorées.
- État vide toujours expliqué : ce qu'il faut faire, pas seulement « aucun élément ».

## 5. Vérification

`python3 build.py` puis `sh tests/run.sh` — **94 tests de calcul** et **130 tests d'interface**, dont le contrôle qu'aucun émoji ne subsiste dans les écrans et que la palette reste dans la charte.

Aperçus : [`apercus/`](apercus/) (accueil, journée, point du soir, fiche chantier, réglages, menu, feuille de saisie, PDF).

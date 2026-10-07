# BFR-Chantier

**Application terrain de suivi des chantiers d'installation, de mise en route et d'accompagnement**
Dérivée de [BFR-Report](https://github.com/B-erTran-D/BFR-Report) (fiche d'intervention S.A.V.) — même architecture, mêmes principes, autre métier.

> **État du projet : première version fonctionnelle.** Les lots **L0 à L3** du dossier de conception sont développés et vérifiés (socle PWA hors connexion, chantiers, journées, point du soir en PDF). Les lots **L4 (documents de formation : CR, feuille de présence, attestations)** et **L5 (compte rendu de chantier multi-jours, rappels, sauvegardes) restent à faire.

## Essayer tout de suite

```bash
python3 build.py                       # assemble l'application
python3 -m http.server 8000 --directory docs --bind 0.0.0.0
# puis ouvrir http://localhost:8000/  (ou l'aperçu du workspace)
```

`BFR-Chantier.html` est l'application complète **en un seul fichier** (dépannage : à envoyer par mail ou copier sur un téléphone).

**Vérifications** : `sh tests/run.sh` — 120 tests de calcul (heures, avancement pondéré, reports, escalades, destinataires, héritage des adresses, **phases de travaux**) + 155 tests de fumée qui déroulent un chantier complet dans un DOM simulé et génèrent réellement le PDF + le **contrôle avant publication**. Les tests vérifient aussi la **charte** : aucun pictogramme dans les écrans, aucune couleur hors palette.

> **Dépôt public, adresses à part.** Cette image de l'application est publiée **sans aucune adresse e-mail** : ni celles des responsables, ni celles de la société — ni dans les fichiers, ni dans l'historique du dépôt. Chaque utilisateur renseigne les destinataires du point du soir **une fois sur son téléphone** (Menu → Réglages → Responsables) ; elles peuvent ensuite être remplacées chantier par chantier. Les chantiers, photos et signatures, eux, ne quittent jamais le téléphone.
>
> Pour préparer le dossier à publier : **`python3 preparer-depot-public.py`** — il contrôle qu'aucune donnée nominative ne subsiste, construit le site (`--sans-donnees`) et assemble `depot-public/`, prêt à déposer sur GitHub. La marche à suivre complète est dans `PUBLIER-SUR-GITHUB.md` (conservé hors de ce dépôt).

### Préparer la version publiable

```bash
python3 preparer-depot-public.py       # contrôle + build public + dossier depot-public/
python3 build.py --sans-donnees        # seulement le build public (avec contrôle)
python3 tests/verifier-publication.py  # seulement le contrôle des données nominatives
```

### Tests et captures d'écran

```bash
sh tests/run.sh                        # build + tests du modèle + test de fumée + contrôle
npm i jsdom fake-indexeddb             # nécessaire au seul test de fumée (DOM simulé)
node outils/apercus.js                 # régénère apercus/ (nécessite puppeteer, optionnel)
```

Les tests et les captures ne contiennent **que des données fictives** (« Client
Exemple », adresses en `@exemple.fr`) : c'est ce qui permet de publier les
captures dans le dépôt.

---

## Les documents

| Fichier | Contenu |
|---|---|
| **[`docs/index.html`](docs/index.html)** | **L'application** (site installable, fonctionne hors connexion) |
| **[`MODE-EMPLOI.md`](MODE-EMPLOI.md)** | Le mode d'emploi du chef de chantier (également accessible dans l'application : Menu → Mode d'emploi) |
| **[`INSTALLATION-COLLEAGUES.md`](INSTALLATION-COLLEAGUES.md)** | Installation sur un téléphone, réglages initiaux, dépannage |
| **[`docs/01-DOSSIER-CONCEPTION.md`](docs/01-DOSSIER-CONCEPTION.md)** | Le dossier de conception complet : contexte, périmètre, rôles, modèle fonctionnel, écrans, point du soir, documents, réutilisation du code existant, architecture, lots de développement |
| **[`docs/02-MAQUETTES.html`](docs/02-MAQUETTES.html)** | Les maquettes d'écrans et les aperçus de PDF (document à montrer aux responsables) |
| **[`CHARTE-INTERFACE.md`](CHARTE-INTERFACE.md)** | La charte appliquée à l'interface : couleurs BFR, icônes monochromes et duotones, typographie, comportements |
| **[`apercus/`](apercus/)** | Captures réelles de l'application (accueil, création avec les phases, journée, point du soir, fiche chantier, réglages, menu) et la planche des 67 icônes — toutes générées avec des **données de démonstration neutres** |
| `PUBLIER-SUR-GITHUB.md` *(conservé hors du dépôt public)* | Préparer, publier et mettre à jour la version GitHub Pages |

## Ce qui fonctionne aujourd'hui (lots L0 à L3)

| | |
|---|---|
| **Socle** | PWA installable, hors connexion, base locale `bfr_chantier_v1`, réglages mémorisés, sauvegarde/restauration JSON, import de la liste clients (CSV) |
| **Phases de travaux** | **Installation mécanique** (mécanicien, câbleur en renfort : montage, raccordements électricité / air / réseau / eau) → **Mise en route** (automaticien, mécanicien pour les réglages : entrées-sorties, sens de rotation, essais, productions allégées, début de formation) → **Accompagnement** (ligne en production, problèmes et besoins du client). Les tâches proposées suivent la phase ; **chaque journée garde la sienne**, et le point du soir indique la phase et l'équipe attendue |
| **Chantiers** | Création (modèles prêts), client par autocomplétion, équipements, contraintes de site, 13 jalons pondérés et ajustables, statuts, onglets Synthèse / Journal / Matériel / Formation / Réglages |
| **Journées** | Chrono (arrivée, pause, départ, durée, ajustement), **effectif et heures sans nominatif**, tâches avec avancement sur les jalons (catalogue selon la phase), actions (assistant 4 étapes + **photo annotée** + dictée), **blocages** (gravité, qui peut débloquer, échéance), matériel, sécurité, **essais et contrôles par liste déroulante**, coactivité, session de formation (participants **signés au doigt**), prévu demain, synthèse dictée |
| **Destinataires** | Adresses des responsables **saisies une fois par téléphone** (Menu → Réglages → Responsables ; **aucune adresse n'est livrée avec l'application**) : chef d'atelier, responsable BE électrotechnique, chef bureau automatisme, chargé d'affaire, + commercial en copie (option). **Remplaçables chantier par chantier** (fiche → onglet Réglages → Diffusion du point du soir), avec contrôle des adresses et retour aux adresses globales en un geste |
| **Interface** | Charte BFR Systems appliquée strictement : **cyan `#06baf2` et bleu nuit `#332e72`**, bleu ardoise pour les états à surveiller, **aucun émoji coloré** — toutes les vignettes sont des **icônes vectorielles monochromes ou duotones** dessinées pour l'application |
| **Mémoire d'usage** | L'application apprend, **utilisateur par utilisateur**, les saisies les plus fréquentes (essais et contrôles, tâches, matériel, entreprises, formations) : elles remontent en tête des listes déroulantes et en **raccourcis sur l'écran de la journée**. Catalogue de départ : 27 essais et contrôles courants, plus les tâches de chaque phase |
| **Point du soir** | Calcul de l'avancement, reports automatiques, vérification de clôture, aperçu à l'écran, **PDF** respectant la charte BFR, mail pré-rempli (destinataires + escalades), verrouillage et versionnage |
| **Reste à faire** | L4 : documents de formation (CR, feuille de présence, **attestations individuelles**). L5 : compte rendu de chantier multi-jours, rappel du soir par notification, export CSV des heures, CR de réception |

---

## L'idée en trois lignes

Le chef de chantier ouvre la journée le matin sur le chantier et la clôture le soir. L'affaire avance par **trois phases** — installation mécanique, mise en route, accompagnement — et l'application suit ce découpage : les tâches proposées, l'équipe attendue et la lecture du point du soir changent avec la phase, chaque journée gardant la sienne. L'application produit alors, **en un geste**, le **Point du soir** : un PDF d'une page — avancement, travaux réalisés, effectif et heures, blocages, matériel manquant, sécurité, prévu demain — envoyé automatiquement aux bons responsables (chef d'atelier, responsable BE électrotechnique, chef bureau automatisme, chargé d'affaire). Le lendemain, le plan de la veille est déjà là et les blocages non levés sont en tête.

Les formations dispensées aux équipes client sont tracées de la même façon : participants signés au doigt sur le téléphone du chef de chantier, compte rendu de formation, feuille de présence et **attestation individuelle** générée à la demande. C'est le seul moment où une signature est recueillie : **le point du soir, lui, reste un document interne et n'est jamais soumis au client**.

---

## Décisions déjà actées

| Décision | Choix retenu |
|---|---|
| Ordre des travaux | Conception validée **avant** développement |
| Usage | Application **interne** : remontée d'information vers les responsables, et suivi des **formations** des équipes client |
| Utilisateur | **Le chef de chantier uniquement** — pas de comptes, pas de saisie par les compagnons, **pas de nominatif** (l'effectif est saisi en nombre de personnes, le détail des heures reste au pointage) |
| Envoi du point du soir | **E-mail depuis le téléphone** (PDF en pièce jointe) — **aucun serveur**, comme BFR-Report |
| Forme du point du soir | **Un bilan par chantier, chaque soir** |
| Destinataires | Chef d'atelier · **responsable BE électrotechnique** · chef bureau automatisme · chargé d'affaire — **commercial en copie (option)** |
| Signature du client | **Aucune au quotidien.** Les seules signatures recueillies sont celles des **participants aux formations** |
| Formation | **CR de formation systématique** + feuille de présence et **attestation en option** |
| Hors connexion | Complet — chantiers en zone sans réseau |
| Données clients | **Jamais sur un serveur** : tout reste dans les téléphones |

---

## Prochaines étapes

1. Valider le dossier de conception — les 12 points du **§ 12** (vocabulaire, jalons, catégories, destinataires, heures, attestations…).
2. Développer les 6 lots du **§ 11** (≈ 6,5 jours), testables un par un.
3. Mettre en ligne (GitHub Pages, `docs/`), installer sur les téléphones, former l'équipe.

---

## Structure du projet

```
BFR-Chantier/
├── app/
│   ├── index.html            gabarit (marqueurs d'assemblage du build)
│   └── src/
│       ├── style.css         charte BFR Systems (aucun écart de palette)
│       ├── icons.js          67 icônes vectorielles monochromes et duotones
│       ├── modele.js         modèle de données : chantier, journée, formation, calculs
│       ├── store.js          base locale IndexedDB, réglages, sauvegarde
│       ├── usage.js          mémoire d'usage (les saisies les plus fréquentes par utilisateur)
│       ├── pdf.js            moteur PDF maison (repris de BFR-Report)
│       ├── logo-bfr.js       logo embarqué
│       ├── annotate.js       annotation de photo au doigt (repris)
│       ├── pointsoir.js      mise en page du point du soir + textes du mail
│       ├── ui.js             composants d'interface (feuilles, champs, confirmations)
│       ├── ecrans.js         écrans (accueil, chantier, journée, point du soir, réglages)
│       └── app.js            navigation, actions, sauvegardes
├── docs/                     site publié (GitHub Pages) + dossier de conception et maquettes
├── apercus/                  captures d'écran et planche d'icônes
├── tests/                    test-modele.js · test-app.js · verifier-publication.py · run.sh
├── outils/                   outil interne : génération des captures (données fictives)
├── BFR-Chantier.html         application complète en 1 fichier (dépannage)
├── build.py                  assemble le fichier unique et docs/
└── preparer-depot-public.py  contrôle et assemble depot-public/ (dépôt GitHub)
```

**Base de données locale : `bfr_chantier_v1`** — distincte de `bfr_sav_v3` : les deux applications cohabitent sur le même téléphone sans se gêner.

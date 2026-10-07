# Aperçus — captures d'écran de l'application

Ce dossier est **publié** (il part dans le dépôt GitHub). Il ne doit donc
contenir que des **données fictives**.

## Comment ces images sont produites

Toutes les captures de l'application sont générées par l'outil de
développement, qui installe un jeu de données **entièrement neutre**
(« Client Exemple », Bourg-en-Bresse, `25-0142`, adresses en `@exemple.fr`) :

    node outils/apercus.js

Le script déclare ces données en tête de fichier (`DONNEES`) et refuse tout
élément nominatif.

## Si vous ajoutez une capture à la main

**Ne capturez jamais un écran rempli avec de vraies données.** Un nom de
client, un numéro d'affaire réel, un nom de personne ou une adresse e-mail
publié ici l'est définitivement (l'historique Git conserve les images même
après suppression).

Marche à suivre : lancer l'application, vider le jeu de démonstration, saisir
les données neutres ci-dessus, puis capturer.

## Contenu

| Fichier | Ce qu'il montre |
|---|---|
| `ecran-accueil.png` | l'accueil, ses alertes et ses chantiers |
| `ecran-nouveau-chantier.png` | la création d'un chantier et les trois phases |
| `ecran-journee.png` | la journée en cours : chrono, effectif, tâches |
| `ecran-point-du-soir.png` | le point du soir avant envoi |
| `ecran-fiche-chantier.png` | la fiche chantier et ses jalons |
| `ecran-journal.png` | l'onglet Journal : journée en cours et journées clôturées (Continuer / Rouvrir) |
| `ecran-reglages.png` | les réglages, dont les destinataires |
| `ecran-grand-ecran.png` | la même application sur tablette / ordinateur |
| `bandeau-marque-journee.png` | le bandeau du haut : la marque officielle, puis le titre |
| `chrono-en-cours.png`, `chrono-en-pause.png` | le bouton du chrono selon l'état (Pause / Reprendre) |
| `carte-jalons.png`, `feuille-jalon.png`, `feuille-ajouter-jalon.png`, `feuille-jalon-curseur.png` | la carte Jalons et sa feuille de réglage |
| `feuille-tache-curseur.png` | le curseur d'avancement d'une tâche |
| `feuille-essai.png` | la feuille « Ajouter un essai » (liste déroulante) |
| `menu-general.png` | le menu général |
| `point-du-soir-pdf.png`, `point-du-soir-entete-pdf.png` | l'aperçu du PDF et l'en-tête du document envoyé |
| `icones-bfr-monochrome-et-duotone.png` | la planche des icônes (monochromes, duo-tones) |

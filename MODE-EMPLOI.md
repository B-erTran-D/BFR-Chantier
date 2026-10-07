# BFR Chantier — mode d'emploi

**Pour le chef de chantier.** Application de suivi des installations, mises en service et formations.
Tout se fait dans le téléphone, **hors connexion**. Seul l'envoi du mail demande du réseau.

---

## 1. Avant la première utilisation (5 minutes, une seule fois)

1. **Installer l'application sur le téléphone** — voir `INSTALLATION-COLLEAGUES.md`.
2. Ouvrir **Menu → Réglages** et renseigner :
  - **Chef de chantier** : prénom, nom, fonction, téléphone, e-mail (vos coordonnées, utilisées dans les mails et sur les attestations) ;
  - **Responsables** : le nom et **l'adresse e-mail** du chef d'atelier, du **responsable BE électrotechnique**, du chef bureau automatisme et du chargé d'affaire. C'est cette liste qui reçoit le point du soir chaque soir.
   Ces adresses sont **enregistrées une fois pour toutes** : elles servent à **tous** les chantiers. Vous pouvez les **remplacer sur un chantier précis** (voir § 5) sans toucher aux réglages généraux. **L'application est livrée sans aucune adresse** : c'est vous qui les saisissez ici, une seule fois (elles restent dans le téléphone). Un compteur « Adresses valides enregistrées » et un message d'alerte vous signalent une adresse oubliée ou mal écrite ;
  - **Commercial** : son adresse peut être enregistrée ici ; il ne sera en copie que si vous cochez l'option **sur le chantier** (Réglages du chantier → « Mettre le commercial en copie ») ;
  - **Signature** (facultative) : elle sert de signature du formateur sur les attestations de formation.
3. *(Facultatif mais très utile)* **Menu → Réglages → Liste clients** : importez l'export CSV de votre liste clients. Ensuite, 3 lettres suffisent pour pré-remplir une fiche chantier.

---

## 2. Créer un chantier (2 minutes)

1. **Nouveau chantier** (accueil, en bas).
2. Choisissez un **modèle** si l'un correspond (**installation mécanique, mise en route, accompagnement**) : la phase, l'effectif et la durée sont pré-remplis.
3. Vérifiez la **phase des travaux** : elle décide des tâches proposées pendant les journées (voir § 3). L'écran rappelle en dessous qui est attendu sur site.
4. Renseignez le **n° d'affaire**, le **libellé**, le **client** (3 lettres → la liste propose), la ville, le lieu d'intervention, le référent sur site.
5. Précisez l'**effectif prévu**, la **durée prévue (jours)** et les **dates**.
6. Ajoutez si besoin les **contraintes de site** (horaires, accès, consignes de sécurité).
7. **Créer le chantier**.

> Les **13 jalons** d'avancement (préparation atelier, montage, câblage, raccordements, paramétrage, essais, formation, réception…) sont créés automatiquement, avec leur poids. Vous pouvez ajuster l'avancement de chacun d'un simple appui, dans l'onglet **Synthèse**.

---

### Les trois phases d'une affaire

Une affaire passe par trois moments, et l'application le sait :

| Phase | Qui vient | Ce qu'on y fait |
|---|---|---|
| **Installation mécanique** | un **mécanicien**, un **câbleur** en renfort selon les cas | montage, puis raccordements : électricité, air comprimé, réseau informatique et eau |
| **Mise en route** | un ou des **automaticiens**, un **mécanicien** pour les réglages | démarrage de la ligne : entrées-sorties, sens de rotation des moteurs, essais, premières productions allégées, début de la formation |
| **Accompagnement** | l'équipe technique, le plus souvent seule | la ligne tourne et le client est autonome : on reste sur site pour ses problèmes et ses besoins |

**Quand l'équipe change, dites-le à l'application** : fiche du chantier → onglet **Synthèse** → bouton
**Passer à…** (par exemple « Passer à mise en route »). Cela ne réécrit rien :

- les **journées déjà saisies gardent leur phase** — un point du soir d'installation reste un point
  d'installation, même consulté des semaines plus tard ;
- les **tâches proposées** deviennent celles de la nouvelle phase : en mise en route, la liste parle
  de mise sous tension, d'entrées-sorties, de sens de rotation et d'essais à blanc ;
- le **point du soir** porte la mention de la phase et de l'équipe attendue.

---

## 3. La journée : le cœur de l'application

### Le matin — 2 minutes
Sur l'accueil, touchez **Reprendre DÉMARRER LA JOURNÉE** : l'heure d'arrivée est notée et **le plan de la veille est repris automatiquement** (tâches non terminées + « prévu demain »). Vous pouvez commencer à travailler.

### Toute la journée — au fil de l'eau
| Ce que vous voulez noter | Où |
|---|---|
| Ce qui s'est passé (avec photo si besoin) | **Action** — assistant : activité → description (ou **dictée vocale « Dicter »**) → **photo annotée** → catégorie |
| Ce qui était prévu / réalisé | **Tâches du jour** — cochez, mettez un **% d'avancement** sur le jalon concerné |
| Ce qui vous empêche d'avancer | **Blocage** — description, **gravité** (1 bloque l'équipe), **qui peut débloquer**, échéance, impact en jours |
| Ce qui manque | **Matériel** — manquant / à prévoir / livré / retour atelier, avec la date de besoin |
| La sécurité | **Sécurité** — bouton « aucun incident ce jour » (à renseigner avant la clôture), ou décrivez l'incident |
| Les essais | **Essais et contrôles** — **choix dans la liste déroulante** (essais et contrôles courants) ou saisie libre, résultat (OK / partiel / NOK), mesures |
| Les autres entreprises sur site | **Coactivité** |
| Une formation dispensée | **Formation du jour** (voir § 5) |

**Un blocage de gravité 1** déclenche un avertissement immédiat : il figurera en tête du point du soir avec la mention **« ACTION ATTENDUE SOUS 24 H »** et la direction technique sera mise en copie. Si l'équipe est à l'arrêt, prévenez aussi par téléphone.

**Les photos** : « Prendre une photo » ouvre l'appareil ; **Annoter Annoter** permet de tracer une flèche, un cercle, du texte — pratique pour montrer un point précis à distance.

### Le soir — 5 minutes
1. Complétez **Prévu demain** : les tâches et l'effectif (indispensable : c'est ce qui sera repris demain matin et lu par les responsables).
2. Ajoutez les **besoins** (outillage, accès, renfort, décision attendue).
3. Rédigez la **Synthèse du jour** — 3 à 5 lignes, ou dictez-la « Dicter » : « Montage terminé, câblage à 80 %, blocage presse depuis 2 jours, essai à blanc NOK capteur de sécurité. »
4. Touchez **Clôturer la journée**. L'application vérifie les points essentiels (synthèse, heures, effectif, sécurité, prévu demain) : elle vous signale ce qui manque, sans jamais vous bloquer.

### Essais et contrôles : la liste qui apprend de vous

En touchant **Essais → Ajouter**, le champ « Essai ou contrôle réalisé » est une **liste déroulante** :

1. **Vos essais et contrôles les plus utilisés** — ce que *vous* saisissez le plus souvent, avec le nombre de fois (l'application les compte pour vous) ;
2. **Essais et contrôles courants** — une liste de référence d'une trentaine d'essais : contrôle du câblage et du repérage, mesure d'isolement, contrôle du sens de rotation moteur, essai des arrêts d'urgence, essai à blanc, essai en production, contrôle de la cadence, étalonnage du pesage, contrôle hydraulique, pneumatique, réseau, dossier machine, réception contradictoire… ;
3. **Autre (saisie libre)** — pour tout ce qui n'est pas dans la liste (vous pouvez aussi **dicter** le texte).

**L'application apprend au fil des chantiers.** Chaque essai que vous validez est compté : dès la deuxième utilisation, il remonte dans le groupe en tête de liste. Sur l'écran de la journée, vos **essais les plus fréquents** apparaissent aussi en **raccourcis** sous la carte « Essais et contrôles » : un appui ouvre la saisie déjà remplie — il ne reste qu'à donner le résultat.

**Ces habitudes sont propres à chaque utilisateur.** Elles sont enregistrées dans le téléphone, séparément pour chaque personne (*Prénom Nom* renseigné dans Menu → Réglages → Chef de chantier). Si un collègue utilise votre téléphone, il retrouve ses propres raccourcis, pas les vôtres. Vous pouvez les consulter et les effacer à tout moment : **Menu → Réglages → Mes habitudes de saisie**.

La même mémoire s'applique aux **tâches** (liste des tâches courantes + vos habitudes), aux **désignations de matériel**, aux **entreprises présentes sur site** et aux **intitulés de formation**.

---

## 4. Le point du soir

L'écran **Point du soir** affiche :

- la **synthèse** (modifiable),
- ce que le document va dire : avancement (%), effectif et heures, blocages, matériel manquant, sécurité, essais, formation,
- les **destinataires** (et l'escalade éventuelle) : chacun avec **son adresse**, la mention *adresse du chantier* quand elle a été remplacée pour cette affaire, et deux boutons — **Général** (Menu → Réglages) et **Ce chantier** (fiche du chantier) — pour corriger une adresse à la dernière minute,
- l'**objet du mail**,
- l'**aperçu du document** (les pages sont dessinées à l'écran, exactement comme le PDF).

Puis, en bas :

| Bouton | Ce qu'il fait |
|---|---|
| **PDF** | enregistre le PDF dans les téléchargements du téléphone |
| **Texte** | copie l'objet et le corps du mail (pour un SMS ou une messagerie d'équipe) |
| **Envoyer** | ouvre le partage du téléphone avec le **PDF déjà joint**, le texte et l'objet prêts : choisissez **Gmail** et envoyez |

*Sans partage natif* (navigateur ancien), l'application télécharge le PDF et ouvre la messagerie avec le texte ; il ne reste qu'à joindre le fichier — un bouton « Marquer comme envoyé » clôture alors la journée.

**Après envoi**, la journée est verrouillée. Pour corriger : **Journal → Rouvrir**, corrigez, renvoyez — le point portera la mention **version 2**.

**Le lendemain matin**, les **blocages non levés** réapparaissent en tête (avec leur ancienneté, « Attention : bloque depuis 3 jours ») et les **tâches non terminées** reviennent dans la journée. Rien ne se perd.

---

### Où se règlent les adresses des responsables ?

| Où | Ce que ça fait |
|---|---|
| **Menu → Réglages → Responsables** | Les adresses **générales**, valables pour tous les chantiers. C'est ici qu'on les renseigne au départ, **une seule fois par téléphone** (aucune adresse n'est livrée avec l'application). |
| **Chantier → onglet Réglages → Diffusion du point du soir** | Les adresses **propres à ce chantier**. Un champ rempli ici **remplace** l'adresse générale *pour ce chantier uniquement* ; laissé vide, l'adresse générale s'applique. Le bouton **Revenir à Revenir aux adresses globales** efface d'un coup les remplacements. |

Cas typiques : le chargé d'affaire change sur une affaire, le responsable BE électrotechnique est remplacé pendant les congés, le référent du client suit le chantier et doit être mis en copie. Dans tous les cas, **le point du soir du soir même part avec la bonne adresse**, sans rien changer aux autres chantiers.

---

## 5. Formation des équipes client

Depuis la journée (**Formation du jour → Saisir une session**) ou depuis la fiche chantier (**onglet Formation**) :

1. **Intitulé, type, date, durée, lieu, formateur**.
2. **Programme** : ajoutez les thèmes (durée indicative) et cochez-les au fur et à mesure — c'est le conducteur du formateur *et* la preuve de ce qui a été traité.
3. **Participants** : nom, fonction, service. Chacun **signe au doigt** sur votre téléphone (bouton Synthèse Signer). Vous pouvez aussi indiquer l'acquis : *acquis · à consolider · non acquis* (un appui fait défiler les trois).
4. **Support remis** (référence, quantité) et **évaluation** (avis à chaud, points à revoir, session complémentaire).
5. **Enregistrer la session** : elle est rattachée à la journée et apparaît dans le point du soir.

Les **documents de formation** — compte rendu de formation, feuille de présence signée, attestations individuelles — se génèrent depuis le bouton **Documents** de la session *(lot L4 en cours de développement)*.

---

## 6. Suivre le chantier (fiche chantier)

| Onglet | Ce qu'on y trouve |
|---|---|
| **Synthèse** | **Phase des travaux en cours** avec le bouton *Passer à…*, avancement global (barre + %), **jalons** (touchez pour ajuster avancement et poids), **blocages ouverts** avec bouton *Lever*, prochaines étapes, dernière synthèse |
| **Journal** | Toutes les journées : date, effectif, heures, synthèse, blocages. Boutons *Continuer / Rouvrir* et *Point du soir* |
| **Matériel** | Tout le matériel du chantier : manquants, livrés, à prévoir, retours atelier |
| **Formation** | Les sessions, leurs participants et leurs documents |
| **Réglages** | Client, contraintes, **équipements**, **diffusion du point du soir** (nom et adresse de chaque destinataire, remplaçant au besoin les adresses générales), **option commercial en copie**, statut du chantier, suppression |

---

## 7. Rouvrir un chantier terminé, en créer un nouveau

- Un chantier dont le statut est **Réceptionné** ou **Clôturé** reste consultable : son journal, ses points du soir et ses documents sont conservés.
- **Fin de chantier** : passez le statut à *Réceptionné* dans Réglages du chantier. *(Le « Compte rendu de chantier » qui rassemble tous les points du soir est prévu au lot L5.)*

---

## 8. Conseils d'usage et sauvegarde

- **Rien à retaper le soir** : plus vous saisissez au fil de la journée, plus le point du soir est complet. Le soir, il ne reste que la synthèse et « prévu demain ».
- **Hors connexion** : tout fonctionne sans réseau, sauf l'envoi du mail.
- **Sauvegarde** : Menu → **Exporter la sauvegarde** produit un fichier `.json` (chantiers, journées, photos, réglages **et habitudes de saisie**). Faites-le **au moins une fois par semaine**, et avant toute mise à jour du téléphone. Pour restaurer : Réglages → **Importer Importer**.
- **Deux applications sur le même téléphone** : *BFR Chantier* et *BFR SAV* cohabitent sans se gêner (chacune a sa base et son icône).
- **Aucune donnée client n'est envoyée** à un serveur : tout reste dans le téléphone, et les documents partent par votre messagerie.

---

## 9. En cas de problème

| Symptôme | Que faire |
|---|---|
| Le point du soir n'a pas été généré | Ouvrez la journée (**Journal → Continuer**), vérifiez la synthèse, retouchez **Clôturer la journée** |
| Un destinataire ne reçoit rien | Menu → Réglages → Responsables : son adresse est-elle renseignée (compteur « Adresses valides ») ? Vérifiez aussi la fiche du chantier → onglet **Réglages** → « Diffusion du point du soir » : une adresse du chantier remplace celle des réglages |
| « Aucune adresse e-mail valide » à l'envoi | L'application ouvre d'elle-même les deux écrans possibles : **Réglages généraux** (tous les chantiers) ou **Ce chantier** (pour cette affaire seulement) |
| Le bouton Envoyer propose autre chose que Gmail | Le partage du téléphone s'ouvre : choisissez Gmail (ou « Enregistrer dans Fichiers » puis joignez le PDF) |
| La liste clients ne propose rien | Menu → Réglages → Liste clients : réimportez l'export CSV |
| L'appli ne reprend pas la nouvelle version | Rouvrez-la **avec du réseau**, deux fois de suite (mise à jour du cache) |

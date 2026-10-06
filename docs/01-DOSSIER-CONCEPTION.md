# BFR-Chantier — Dossier de conception

**Application terrain de suivi des installations, mises en service et formations client**

| | |
|---|---|
| **Version du document** | 1.0 — 6 octobre 2026 |
| **Objet** | Spécification fonctionnelle de la 2ᵉ application BFR, dérivée de BFR-Report (fiche d'intervention S.A.V.) |
| **Statut** | À valider par la direction technique — le développement démarre après validation du § 14 |
| **Décisions déjà prises** | ① Conception avant développement ② Envoi par **mail depuis le téléphone** (aucun serveur) ③ **Un bilan par chantier chaque soir** ④ **CR de formation systématique + attestation en option** |

---

## 0. En une page

**Le problème.** Aujourd'hui, l'activité S.A.V. est couverte par BFR-Report : une intervention, un rapport. L'activité d'**installation / mise en service / formation** est d'une autre nature : elle s'étale sur **plusieurs jours ou plusieurs semaines**, avec une équipe, des jalons, du matériel qui manque, des corps d'état qui se gênent, et surtout un besoin d'**information quotidienne** des responsables (chef d'atelier, chef bureau automatisme, **responsable BE électrotechnique**, chargé d'affaire) — aujourd'hui assurée par téléphone, SMS et bouts de papier.

**La réponse.** Une application mobile unique, **BFR-Chantier**, qui suit le chantier **jour par jour** et produit **chaque soir**, en un geste, le **Point du soir** : un PDF d'une page, envoyé aux responsables concernés, qui dit où en est le chantier, ce qui bloque, ce qui manque, et ce qui est prévu demain.

**Trois idées structurantes :**

1. **L'unité de travail est la journée.** On ouvre le chantier le matin, on le referme le soir. Le soir, le point se génère à partir de ce qui a été saisi pendant la journée : rien à retaper, rien à recopier d'un carnet.
2. **Le point du soir est un contrat de communication.** Toujours la même forme, toujours les mêmes rubriques, toujours les mêmes destinataires selon le type de problème. Les responsables savent où regarder ; le chef de chantier sait quoi remonter.
3. **Aucun serveur, comme BFR-Report.** Tout est calculé dans le téléphone, l'application fonctionne **hors connexion** sur le chantier, et l'envoi se fait par le mail du téléphone avec le PDF en pièce jointe. Rien à héberger, rien à maintenir, aucune donnée client sur un serveur.

**Ce que l'application produit :** Point du soir (PDF) · Compte rendu de chantier multi-jours · Compte rendu de formation · Feuille de présence signée · Attestation de formation (option) · PV de réception (option, v1.1).

---

## 1. Contexte et objectif

### 1.1 Situation actuelle
- Le suivi de chantier repose sur la mémoire, le téléphone et, au mieux, un tableau Excel tenu en retard.
- Les responsables découvrent les problèmes **le lendemain ou plus tard** : matériel manquant signalé trop tard, blocage qui immobilise une équipe une journée de plus, client mécontent dont personne n'a été informé.
- Le temps passé sur site (heures × effectif) est reconstitué de mémoire en fin de semaine.
- Les formations dispensées chez le client ne laissent qu'une trace informelle : pas de feuille de présence signée, pas d'attestation, donc pas de preuve en cas de litige ou d'audit.

### 1.2 Objectif de BFR-Chantier
| Objectif | Indicateur de réussite |
|---|---|
| Remonter l'information le soir même | ≥ 90 % des journées de chantier clôturées le jour même |
| Supprimer les appels de synchronisation | Le responsable a l'information sans appeler le chef de chantier |
| Rendre visible ce qui bloque | Tout blocage a un responsable désigné et un délai souhaité |
| Tracer les formations | 100 % des sessions avec feuille de présence signée + attestation disponible |
| Garder une trace du chantier | Un dossier PDF complet par chantier, exportable à la livraison |

### 1.3 Ce qui distingue BFR-Chantier de BFR-Report
| | BFR-Report (S.A.V.) | BFR-Chantier (installation / formation) |
|---|---|---|
| Unité de travail | L'intervention (1 jour, 1 rapport) | **La journée dans un chantier** (n journées, n points) |
| Durée typique | 1 journée | 1 jour à plusieurs semaines |
| Équipe | 1 technicien (+ collègues accompagnants) | **1 chef de chantier** — seul utilisateur ; l'effectif est saisi en nombre de personnes, sans nominatif |
| Nature du document | Compte rendu de dépannage | **Point d'avancement quotidien** + CR de formation |
| Destinataire principal | Client + responsable SAV | **Responsables internes** (chef d'atelier, resp. BE électrotechnique, chef bureau automatisme, chargé d'affaire ; commercial en copie en option) |
| Suivi dans le temps | Historique de rapports indépendants | **Un chantier qui se construit** : jalons, avancement, plan du lendemain repris le lendemain |
| Traçabilité de la formation | — | Participants, heures, programme, **signature et attestation** |
| Signature sur l'écran | Validation du rapport, par le client | **Participants de formation** uniquement — **aucun visa client au quotidien** |

---

## 2. Périmètre

### 2.1 Dans la v1
- **Un utilisateur unique : le chef de chantier.** Pas de comptes, pas de saisie par les compagnons, pas de suivi nominatif des heures.
- Création et suivi d'un **chantier** (client, site, équipements, effectif, jalons, dates).
- **Journée de chantier** : chrono, effectif et heures, tâches réalisées, avancement, blocages, matériel, sécurité, essais.
- **Photos annotées** au doigt (reprise de BFR-Report).
- **Point du soir** : PDF + e-mail pré-rempli aux responsables, avec règles de diffusion et d'escalade.
- **Plan du lendemain** repris automatiquement le lendemain matin.
- **Formation** : session, participants, **signature sur écran**, programme traité, CR de formation, feuille de présence, **attestation individuelle** générée à la demande.
- **Signature sur écran pour la formation** : les participants formés signent au doigt (le point du soir, lui, ne demande **aucun visa client**).
- **Hors connexion** complet, **sauvegarde JSON**, historique des chantiers.
- **Multi-langue** des libellés du PDF (héritage BFR-Report) pour les chantiers hors France.

### 2.2 Hors périmètre de la v1 (feuille de route)
- Tableau de bord web partagé entre responsables (§ 15.1).
- Chiffrage / facturation des heures et des fournitures sur le chantier.
- Gestion de planning et affectation prévisionnelle des équipes.
- Gestion de stock / commandes fournisseurs.
- Signature électronique à valeur probante (l'attestation reste un document interne signé à la main ou scanné).

---

## 3. Utilisateurs et rôles

L'application n'a **ni compte ni mot de passe** : chaque téléphone est autonome (comme BFR-Report). Elle est **interne** et **utilisée par le chef de chantier uniquement** : c'est lui qui saisit la journée pour l'équipe présente. On distingue donc *qui saisit* (une seule personne) de *qui reçoit*.

### 3.1 L'utilisateur : le chef de chantier

| | |
|---|---|
| **Qui** | Le chef de chantier (ou le monteur qui mène l'affaire), présent sur site |
| **Ce qu'il fait** | Ouvre et clôture la journée, saisit les tâches, les actions et photos, les blocages, le matériel, la sécurité, les essais, les sessions de formation |
| **Ce qu'il ne saisit pas** | **Aucun détail nominatif** : ni la liste des compagnons, ni les heures individuelles. Il indique seulement l'**effectif présent** (nombre de personnes, et si utile la répartition par corps de métier) et les **heures de la journée**. Le suivi individuel des heures reste au pointage |
| **Pourquoi c'est plus simple** | Une seule saisie par chantier au lieu d'une par personne ; l'application reste rapide, et personne n'a à « faire ses heures » sur son téléphone |
| **Sa signature** | Elle ne sert que de **signature de formateur** sur les attestations de formation (enregistrée une fois dans Menu → Mes informations) |

### 3.1 bis Charte graphique de l'interface

L'application applique la charte BFR Systems **sans exception** : cyan `#06baf2`, bleu nuit `#332e72`, encre `#1f1c45`, bleu ardoise `#4a4f6b` pour ce qui doit être surveillé, rouge sourd uniquement pour le danger. **Aucune couleur hors charte** (pas d'orange, pas de violet). Les vignettes ne sont pas des émojis mais des **icônes vectorielles** dessinées sur une grille de 24 px, en deux déclinaisons — **monochrome** (listes, champs, boutons) et **duotone** (en-têtes de carte, pastilles d'état). Le détail figure dans `CHARTE-INTERFACE.md`, avec la planche d'icônes et les captures d'écran (`apercus/`).

### 3.2 Les destinataires du point du soir

| Rôle | Ce qu'il reçoit | Quand |
|---|---|---|
| **Chef d'atelier** | Point du soir — moyens, main-d'œuvre, outillage, atelier | **Systématique** |
| **Responsable BE électrotechnique** | Point du soir — schémas, câblage, armoires, conformité électrique | **Systématique** |
| **Chef bureau automatisme** | Point du soir — automatisme, paramétrage, programmes, plans | **Systématique** |
| **Chargé d'affaire** | Point du soir — interface client, planning, avenants | **Systématique** sur ses chantiers |
| **Commercial** | Point du soir, **en copie** | **Option** — globalement ou chantier par chantier |
| **Direction technique** | Alertes graves + future synthèse hebdomadaire | Blocage de gravité 1, incident de sécurité |

> **Règle de conception.** Le chef de chantier ne choisit pas ses destinataires chaque soir : ils sont définis **une fois pour toutes dans les réglages** de l'application (nom + adresse e-mail de chaque rôle). Chaque **chantier peut remplacer** une ou plusieurs de ces adresses (changement de chargé d'affaire, remplacement temporaire, copie supplémentaire) : l'adresse saisie sur le chantier prend alors le dessus, **pour ce chantier seulement**, et un bouton rend la main aux adresses globales. Le point du soir part donc toujours **sans choix à faire le soir même**.

---

## 4. Le principe directeur : la journée

Le chantier se déroule en **journées**, et chaque journée suit le même cycle en 5 temps :

```
   MATIN                PENDANT LA JOURNÉE              SOIR
┌──────────┐   ┌──────────────────────────────┐   ┌────────────────┐
│ Ouverture│   │ Saisie au fil de l'eau :     │   │ Clôture        │
│ du jour  │ → │ • actions réalisées          │ → │ • plan demain  │
│ • plan   │   │ • photos annotées            │   │ • prévu demain │
│   repris │   │ • blocages, matériel manquant│   │ • POINT DU SOIR│
│ • effectif│  │ • essais, incidents sécu.    │   │   PDF + mail   │
│ • chrono │   │ • formation du jour          │   │                │
└──────────┘   └──────────────────────────────┘   └────────────────┘
```

**Deux boutons structurent tout :** « Démarrer la journée » (arrivée sur site, horodatée) et « Clôturer la journée » (génère le point du soir). Entre les deux, on saisit sans ordre imposé — comme on travaille réellement.

**Le plan du lendemain se recopie tout seul.** Ce que le chef de chantier écrit dans « Prévu demain » le soir réapparaît le lendemain matin dans « Tâches prévues du jour », à cocher au fur et à mesure. C'est ce qui donne au chantier sa continuité : le chantier *se souvient*.

---

## 5. Modèle fonctionnel

### 5.1 Le chantier

| Bloc | Champs |
|---|---|
| **Identification** | N° d'affaire (ex. `25-0142`, généré ou saisi), référence devis/commande, libellé du chantier, type : **Installation · Mise en service · Formation · Mixte**, statut : *Prévu · En cours · En attente · Suspendu · Réceptionné · Clôturé* |
| **Client** | Nom, ville, adresse du site, lieu d'intervention précis (bâtiment, ligne, atelier), logo (facultatif) — **autocomplétion sur 3 lettres** depuis la liste clients importée (reprise de `clients.js`) |
| **Contacts** | Référent technique sur site (nom, fonction, téléphone), contact réception/mail, contact sécurité si différent |
| **Équipements** | Liste des machines concernées : désignation, modèle, n° de série, quantité, emplacement *(reprise du principe « multi-machines » du SAV)* |
| **Effectif affecté** | Chef de chantier, effectif prévu (nombre de personnes, corps de métier) et durée prévisionnelle |
| **Jalons d'avancement** | Liste ordonnée et paramétrable, chacun avec un **poids** en % : préparation atelier · expédition · réception matériel sur site · montage mécanique · câblage électrique · raccordements · paramétrage automatisme · essais à blanc · essais en production · connexions réseaux/IT · formation · levée des réserves · réception client |
| **Planning** | Date de début prévue / réelle, date de fin prévue / réelle, durée prévisionnelle (jours-homme) |
| **Responsables internes** | Chef d'atelier, **responsable BE électrotechnique**, chef bureau automatisme, chargé d'affaire, **commercial en copie (option)** — hérités des réglages, modifiables chantier par chantier |
| **Contraintes de site** | Horaires autorisés, accès, badge, consignes sécurité, plan de prévention, présence obligatoire d'un accompagnant, coupure d'énergie, coactivité |
| **Consignes particulières** | Zone ATEX, travail en hauteur, habilitations requises, essais avec production |

> **Un chantier « type »** peut être enregistré comme modèle (ex. *Installation armoire + mise en service ligne*). Créer un chantier revient alors à choisir le modèle, le client, les dates et l'effectif : 2 minutes au lieu de 20.

### 5.2 La journée

| Bloc | Contenu |
|---|---|
| **Horaires** | Heure d'arrivée / de départ (horodatées par le chrono), pauses, **heures sur site**, **heures productives**, heures supplémentaires. Mode multi-jours rétroactif (comme le SAV) pour régulariser une journée oubliée. |
| **Effectif et heures** | Nombre de personnes présentes (et répartition par corps de métier si utile), heure d'arrivée / de départ. **Le total hommes-heures du jour et le cumul du chantier sont calculés.** Absents ou prévus non venus (avec motif). **Aucun nominatif.** |
| **Conditions** | Météo / conditions d'accès (facultatif, une ligne) : *« site fermé le matin »*, *« production en cours »*. |
| **Tâches du jour** | Chaque tâche : intitulé, jalon concerné, **état** (réalisée · partielle · non réalisée), **avancement apporté** (en points de %) sur le jalon, heures passées, difficulté rencontrée. |
| **Actions / évènements** | Journal horodaté des faits marquants — **assistant en 4 étapes** (voir § 6.3). |
| **Blocages et écarts** | Blocages et dérives (voir § 5.4). **Rubrique la plus importante du point du soir.** |
| **Matériel et pièces** | Manquant, livré, à prévoir, retour atelier (voir § 5.5). |
| **Sécurité** | Incidents, presqu'accidents, remarques : **remontée obligatoire** (blocage de la clôture si non renseigné). |
| **Essais et contrôles** | Essai réalisé **choisi dans une liste déroulante** (catalogue de 27 essais courants : isolement, masses, arrêts d'urgence, sens de rotation, essai à blanc, essai en production, cadence, pesage, hydraulique, pneumatique, réseau, dossier machine, réception contradictoire…) ou en saisie libre, résultat **OK / NOK / Partiel**, mesures relevées, contre-visite nécessaire. |
| **Sous-traitants / coactivité** | Entreprise présente, effectif, gêne ou coordination constatée. |
| **Formation du jour** | Si une session a eu lieu (voir § 5.6). |
| **Plan du lendemain** | Tâches prévues, effectif prévu, besoins (outillage, pièce, accès, renfort, décision), demande d'intervention d'un autre service. |
| **Photos** | Photos annotées prises dans la journée, classées par moment (avant / après / anomalie / repère). |
| **Synthèse du jour** | 3 à 5 lignes rédigées par le chef de chantier (ou dictées) : « l'essentiel en une phrase ». Elle ouvre le point du soir. |

### 5.3 L'action (assistant en 4 étapes)

Reprise directe de l'assistant BFR-Report, adapté au vocabulaire du chantier :

| Étape | SAV (existant) | Chantier (nouveau) |
|---|---|---|
| **1. Domaine** | Mécanique / Électrique / Automatisme | **Activité** : Montage · Câblage · Raccordement · Paramétrage · Essai · Levage/manutention · Management/réunion · Formation · Déplacement · Attente/immobilisation |
| **2. Annotation** | écrit ou **dicté**, relecture vocale | idem |
| **3. Photo** | prise + **annotation au doigt** (flèche, cercle, crayon, texte, 5 couleurs) | idem |
| **4. Catégorie** | Sécurité · Urgent · Priorité haute · Priorité basse · Informatif | **Sécurité** · **Blocage chantier** · **Retard / dérive planning** · **Approvisionnement** · **Point d'avancement** · Informatif |

Les catégories pilotent l'ordre et la couleur des rubriques du point du soir, exactement comme elles pilotent le rapport SAV.

### 5.3 bis Mémoire d'usage — l'application apprend de chaque utilisateur

L'application retient, **utilisateur par utilisateur** (clé « Prénom Nom » des réglages), les valeurs qu'il saisit le plus souvent, et les restitue :

| Effet | Où c'est visible |
|---|---|
| Un groupe **met vos saisies les plus utilisées** en tête de la liste déroulante | Essais et contrôles, tâches |
| Des **raccourcis** (un appui) des essais les plus fréquents | Écran de la journée, carte « Essais et contrôles » |
| Des propositions de complétion (historique + catalogue) | Désignations de matériel, entreprises sur site, intitulés de formation |
| Un écran de transparence : ce qui est mémorisé, et un bouton pour l'oublier | Menu → Réglages → Mes habitudes de saisie |

**Principes retenus :** compteur de fréquence (avec la date de dernière utilisation pour départager les égalités), insensible à la casse et aux espaces, plafonné à 80 valeurs par type, conservé dans le téléphone (aucun envoi), **inclus dans la sauvegarde JSON**, et effaçable par l'utilisateur. L'objectif : que le geste répété (l'essai que *ce* technicien fait systématiquement) demande **deux appuis au lieu de dix**.

### 5.4 Blocages et écarts — le cœur du dispositif

Chaque blocage relevé porte obligatoirement :

| Champ | Pourquoi |
|---|---|
| **Description** | Ce qui bloque, factuellement |
| **Gravité** | `1 – Bloque l'équipe` (arrêt de travail) · `2 – Ralentit` (travail dégradé) · `3 – Gêne` (contournement possible) |
| **Impact planning** | Aucun · Retard estimé en jours |
| **Qui peut débloquer** | Chef d'atelier · **Responsable BE électrotechnique** · Chef bureau automatisme · Chargé d'affaire · Client · Fournisseur · Autre corps d'état |
| **Action attendue et pour quand** | Décision, fourniture, information, intervention |
| **Statut** | Nouveau · En cours · **Levé** (avec date et comment) |

**Règle d'or :** un blocage de gravité 1 déclenche une **alerte immédiate** (e-mail + SMS/appel suggéré) sans attendre le soir, et il figure en tête du point du soir tant qu'il n'est pas levé. Un blocage non levé **se reporte automatiquement** d'un jour sur l'autre : impossible de l'oublier.

### 5.5 Matériel et pièces

| État | Traitement |
|---|---|
| **Manquant** (bloque ou bloquera) | Remonté au point du soir, avec jalon impacté et date de besoin |
| **Livré sur site** | Journalisé (qui a réceptionné, réserves éventuelles) |
| **À prévoir** (pour la suite) | Alimente la demande d'approvisionnement |
| **Retour atelier / à réexpédier** | Suivi et motif |

### 5.6 Formation et participants

**Session de formation** (rattachée au chantier, ou autonome) :

| Bloc | Champs |
|---|---|
| **Identification** | Intitulé, type (*Prise en main machine · Conduite · Maintenance niveau 1 · Réglages/recettes · Sécurité · Habilitation*), date(s), durée (h), lieu, formateur (interne BFR ou externe), langue de la session |
| **Participants** | Nom, prénom, **fonction**, entreprise/service, e-mail (facultatif), **signature au doigt sur le téléphone du chef de chantier**, présence/absence, évaluation (acquis : *acquis · à consolider · non acquis*), remarque |
| **Programme** | Liste de modules/thèmes avec durée, **coché « traité »** au fil de la session — sert à la fois de conducteur au formateur et de preuve de contenu |
| **Moyens** | Support remis (référence, quantité), machine/équipement utilisé, salle ou atelier |
| **Évaluation** | Avis à chaud (note ou appréciation globale), points à revoir, besoin d'une session complémentaire |
| **Attestation** | **Activée à la demande** : génération d'**une attestation par participant** (nom, intitulé, dates, durée, programme, acquis, lieu, date, signature du formateur + cachet société) |

**Trois documents possibles :**
1. **Compte rendu de formation** — document de synthèse de la session (contenu, participants, déroulement, évaluation) → version par défaut, systématique.
2. **Feuille de présence** — tableau des participants avec signatures, à conserver au dossier, signée aussi par le client → généré avec le CR, ou seul.
3. **Attestation individuelle de formation** — un PDF par participant, généré **à la demande** (bouton dédié), pour répondre à une demande du client ou à un audit.

---

## 6. Les écrans

### 6.1 Accueil — « Aujourd'hui »

```
┌─────────────────────────────────────────┐
│ BFR SYSTEMS                        Menu │  ← barre cyan/navy (charte BFR)
│ ─────────────────────────────────────── │
│ Aujourd'hui — mardi 6 octobre           │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ DÉMARRER LA JOURNÉE                 │ │
│ │ 25-0142  Ligne 3 — Client Exemple   │ │  ← gros bouton, horodate l'arrivée
│ └─────────────────────────────────────┘ │
│                                         │
│ EN COURS (3)                            │
│ ┌─────────────────────────────────────┐ │
│ │ 25-0142  Ligne 3 — Client Exemple   │ │
│ │ Bourges · J4/8 · ██████░░ 72 %      │ │
│ │ 3 pers. · 24 h · 2 blocages         │ │
│ │ Point du soir à envoyer             │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 25-0138  Armoire TGBT — Client Nord │ │
│ │ Lille · J2/3 · ████████░ 88 %       │ │
│ │ 2 pers. · 16 h · 0 blocage          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ PRÉVUS CETTE SEMAINE (2)              > │
│ CLÔTURÉS RÉCEMMENT                    > │
│ ─────────────────────────────────────── │
│ [+ Nouveau chantier]    [Point du soir] │
└─────────────────────────────────────────┘
```

Objectifs de cet écran : **en 5 secondes, le chef de chantier sait quoi faire** (démarrer la journée, ou envoyer le point de la veille oublié), et **le chef voit l'état de tous les chantiers** sans ouvrir autre chose.

### 6.2 Fiche chantier (onglets)

| Onglet | Contenu |
|---|---|
| **Synthèse** | Avancement global (barre + %), jalons avec leur état, jours écoulés / prévus, blocages ouverts, prochaines étapes, dernières photos |
| **Journal** | Liste des journées déjà clôturées (J1, J2, J3…) : date, effectif, heures, résumé. Ouvre le point du soir correspondant (PDF déjà généré, regénérable) |
| **Effectif** | Effectif prévu et effectif réel jour par jour, heures cumulées sur le chantier *(pas de nominatif)* |
| **Formation** | Sessions de formation avec leur état (prévue / faite), participants, documents |
| **Matériel** | Manquants, livrés, à prévoir, retours atelier |
| **Documents** | Tous les PDF produits : points du soir, CR de chantier, CR et feuilles de présence de formation, attestations, PV |
| **Réglages du chantier** | Contacts, contraintes de site, destinataires du point du soir, canevas du point, langue du client |

### 6.3 La journée en cours

```
┌─────────────────────────────────────────┐
│ ← 25-0142 · J4/8 · mercredi 7 oct.      │
│ ─────────────────────────────────────── │
│ 07:45 → en cours   · Sur site 3h20      │  ← bandeau chrono (reprise du SAV)
│ [Pause]   [Ajuster]                     │
│ ─────────────────────────────────────── │
│ EFFECTIF & HEURES            [Modifier] │
│ 3 personnes · 24 h 00 cumulées          │
│ dont 1 électricien, 1 automaticien      │
│ ─────────────────────────────────────── │
│ TÂCHES DU JOUR  (reprises d'hier)       │
│ [x] Montage support moteur    +10 % MEC │
│ [ ] Câblage armoire                ELEC │
│ [ ] Paramétrage variateur   AUTOMATISME │
│ + Ajouter une tâche                     │
│ ─────────────────────────────────────── │
│ BLOCAGES (1)                            │
│ Gravité 1 · Presse hydraulique HS       │
│ Attend : chef d'atelier — sous 24 h     │
│ ─────────────────────────────────────── │
│ PHOTOS (4)                   ESSAIS (1) │
│ ─────────────────────────────────────── │
│ FORMATION DU JOUR — 3 participants      │
│ ─────────────────────────────────────── │
│ CLÔTURER LA JOURNÉE → POINT DU SOIR     │
│ ─────────────────────────────────────── │
│ [+ Action]  [+ Photo]  [+ Blocage]      │  ← barre d'actions fixe
└─────────────────────────────────────────┘
```

### 6.4 Assistant « Ajouter une action » (4 étapes)

Identique à BFR-Report : **① activité** (choix unique parmi 10) → **② description** écrite ou **dictée avec relecture vocale** → **③ photo** prise au téléphone puis **annotée au doigt** → **④ catégorie** (gravité/typologie). Une action est **modifiable à tout moment** : on appuie dessus, l'assistant se rouvre.

### 6.5 Point du soir — écran de préparation

```
┌─────────────────────────────────────────┐
│ ← POINT DU SOIR — 25-0142 · J4          │
│ ─────────────────────────────────────── │
│ Rédigé à partir de la journée.          │
│ Tout est modifiable avant envoi.        │
│ ─────────────────────────────────────── │
│ Synthèse du jour               [dictée] │
│ ┌─────────────────────────────────────┐ │
│ │ Montage terminé, câblage à 80 %…    │ │
│ └─────────────────────────────────────┘ │
│ ─────────────────────────────────────── │
│ 2 blocages · 1 manquant ·               │
│ 0 incident                              │
│ ─────────────────────────────────────── │
│ 3 personnes · 24 h 00 hommes-heures     │
│ Avancement 72 % (+10 pts / hier)        │
│ ─────────────────────────────────────── │
│ Destinataires (5)            [modifier] │
│ Chef d'atelier — Resp. BE élec.         │
│ Chef B. automatisme — Ch. affaire       │
│ Commercial (en copie, option)           │
│ ─────────────────────────────────────── │
│ [APERÇU]                      [ENVOYER] │
└─────────────────────────────────────────┘
```

Après envoi : la journée est **verrouillée** (modifiable en la rouvrant explicitement, avec mention « version 2 » sur le PDF).

### 6.6 Écrans secondaires
- **Formation** : session, programme coché au fil de l'eau, participants avec **signature au doigt**, génération des documents.
- **Documents** : tous les PDF du chantier, réouvrables et renvoyables.
- **Historique / recherche** : par client, n° d'affaire, date, chef de chantier.
- **Réglages** : société, identité du chef de chantier, **destinataires par rôle — adresses générales, valables pour tous les chantiers, contrôlées à la saisie**, canevas du point du soir, catégories, jalons, modèles de chantier, rappels, liste clients (import CSV), sauvegarde JSON. Chaque chantier peut **remplacer** ces adresses dans sa propre fiche (onglet Réglages → « Diffusion du point du soir »).

---

## 7. Le point du soir

### 7.1 Contenu (PDF A4, 1 à 2 pages)

| # | Rubrique | Source | Affichée si |
|---|---|---|---|
| — | **En-tête** : logo BFR, *Point du soir — {libellé chantier}*, n° affaire, client + ville, date, **J{n} sur {total prévu}**, auteur (chef de chantier), n° de version | chantier + journée | toujours |
| 1 | **L'essentiel** (synthèse 3-5 lignes, encadré) | saisie du soir | toujours |
| 2 | **Avancement** : barre globale %, variation depuis la veille, jalons terminés / en cours / à venir | calcul | toujours |
| 3 | **Effectif et heures** : nombre de personnes présentes, heures sur site, heures de la journée, total **hommes-heures** du jour et cumul chantier | journée | toujours |
| 4 | **Travaux réalisés** : tâches réalisées + actions de type « point d'avancement » | journée | si non vide |
| 5 | **Prévu et non réalisé** : tâche + motif | journée | si non vide |
| 6 | **Blocages et écarts** : tableau gravité / description / qui peut débloquer / pour quand / statut. **Les blocages non levés des jours précédents figurent en tête avec leur ancienneté.** | journée + report | toujours (même vide → « Aucun blocage à signaler ») |
| 7 | **Approvisionnement** : manquants (avec date de besoin), livrés, à prévoir, retours | journée | si non vide |
| 8 | **Sécurité** : incidents, presqu'accidents, remarques, port des EPI | journée | toujours |
| 9 | **Essais et contrôles** : essai, résultat, mesures | journée | si non vide |
| 10 | **Formation** : session du jour, participants, heures, thèmes traités, acquis | session | si session |
| 11 | **Coactivité / sous-traitants** | journée | si non vide |
| 12 | **Prévu demain** : tâches, effectif, besoins | journée | toujours |
| 13 | **Demandes aux responsables** : décision attendue, fourniture, renfort, ou information — avec destinataire | journée | si non vide |
| 14 | **Photos** : planche de 4 à 6 vignettes légendées | journée | si photos |
| 15 | **Pied de page** : coordonnées BFR, mentions, *Document interne — diffusion restreinte* | réglages | toujours |

> **Document interne.** Le point du soir n'est **pas soumis au visa du client** et ne lui est pas adressé : il sert à informer les responsables BFR de l'avancement et des difficultés. Les seules signatures recueillies par l'application sont celles des **participants aux formations** (§ 5.6).

> **Principe de rédaction.** Le point du soir doit se lire **en 60 secondes dans un ascenseur**. D'où : l'essentiel en haut, l'avancement en une barre, les blocages en tableau, et rien d'autre que ce qui appelle une décision.

### 7.2 Règles de production
- **Déclenchement** : bouton « Clôturer la journée ». La clôture est **guidée** : si la synthèse, la sécurité ou le plan de demain ne sont pas renseignés, l'application le signale et propose de les compléter (elle n'interdit pas, sauf pour la sécurité).
- **Rappel** : notification à l'heure paramétrée (défaut **16 h 45**) si la journée du jour n'est pas clôturée. Deuxième rappel à 18 h 30.
- **Report automatique** : blocages ouverts, tâches non réalisées et plan du lendemain alimentent la journée suivante.
- **Point manqué** : si la journée n'est pas clôturée, l'application le signale à l'ouverture suivante (« la journée du 6 octobre n'a pas été clôturée — la clôturer maintenant ? ») et permet de la produire rétroactivement avec la mention *point établi le … pour la journée du …*.
- **Versionnage** : toute correction après envoi produit une **version 2** clairement identifiée sur le PDF et dans l'objet du mail (`[v2]`).
- **Fin de chantier** : « Clôturer le chantier » agrège tous les points du soir dans un **Compte rendu de chantier** (PDF complet, du premier au dernier jour) — la mémoire du chantier, à joindre au dossier de réception.

### 7.3 Diffusion

| Destinataire | Quand |
|---|---|
| **Chef d'atelier** | Systématiquement (réglage global, ajustable par chantier) |
| **Responsable BE électrotechnique** | Systématiquement |
| **Chef bureau automatisme** | Systématiquement |
| **Chargé d'affaire** | Systématiquement sur ses chantiers |
| **Commercial** | **En copie, en option** — activé chantier par chantier (le commercial suit son affaire, prépare une visite ou une extension) |
| **Direction technique** | En copie si un blocage de gravité 1 a été ouvert dans la journée |

**Le point du soir reste interne** : il n'est pas adressé au client. Seuls les documents de formation (compte rendu, feuille de présence, attestations) sont remis aux équipes formées du client.

**Règles d'escalade (paramétrables)** — exemples par défaut :
- Blocage **gravité 1** → destinataires immédiats + mention **« ACTION ATTENDUE SOUS 24 H »** dans l'objet.
- **Nature du blocage** → le destinataire « qui peut débloquer » passe en premier destinataire du mail (blocage électrique → **responsable BE électrotechnique** ; blocage automatisme → chef bureau automatisme ; matériel → chef d'atelier).
- **Incident de sécurité** → copie Direction technique et responsable sécurité, **le soir même**.
- **3ᵉ jour consécutif** avec le même blocage non levé → alerte « blocage persistant » au chargé d'affaire.
- **Dérive planning > 2 jours** sur la date de fin prévue → information du chargé d'affaire.

### 7.4 Formes de diffusion
1. **Envoyer** — le PDF est généré puis partagé (Gmail ou autre application, pièce jointe prête, destinataires et texte du mail pré-remplis). *Mode principal.*
2. **Aperçu** — contrôle à l'écran avant envoi (mêmes pages, dessinées dans l'application).
3. **PDF** — téléchargement / envoi par un autre canal (WhatsApp, clé USB…).
4. **Copier le texte** — version texte du point, à coller dans un SMS ou un message d'équipe.
5. **Imprimer** — pour affichage en atelier ou au bureau.

### 7.5 Modèle d'e-mail
```
Objet :   [25-0142] Point du soir J4 — Client Exemple Bourges — 7 octobre 2026  (2 blocages)
Corps :   Bonjour,

          Point du soir du chantier 25-0142 — Ligne 3 (Client Exemple, Bourges).
          Journée 4 sur 8 prévues. Avancement global : 72 % (+10 points).
          Effectif du jour : 3 personnes — 24 h 00 (cumul chantier : 90 h 00)

          Ce qui a avancé : <synthèse du jour>

          Blocages en cours (2) :
           • [gravité 1 — 2 jours] Presse hydraulique hors service — attend : chef d'atelier, sous 24 h
           • [gravité 2] Accès zone production refusé le matin — attend : chargé d'affaire

          Matériel manquant (1) : variateur 15 kW — besoin le 8/10
          Sécurité : aucun incident signalé.
          Prévu demain : câblage terminé, début paramétrage variateur (3 personnes)

          Point du soir complet en pièce jointe.
          <signature>  J. Dupont — Chef de chantier — BFR Systems — 06 xx xx xx xx

Pièces :  Point-soir_25-0142_J4_2026-10-07.pdf
Destinataires : chef d'atelier, resp. BE électrotechnique, chef bureau automatisme, chargé d'affaire
          Cc : commercial (option) · direction technique (si alerte)

Variables disponibles : {{numeroAffaire}}, {{chantier}}, {{client}}, {{ville}}, {{date}}, {{jour}},
          {{avancement}}, {{blocages}}, {{manquants}}, {{securite}}, {{prevuDemain}}, {{auteur}},
          {{synthèse}}, {{formateur}}, {{participants}}…
```

---

## 8. Les documents produits

| Document | Quand | Format | Remis à |
|---|---|---|---|
| **Point du soir** | Chaque soir de chantier | PDF 1-2 p. | **Responsables internes** : chef d'atelier, resp. BE électrotechnique, chef bureau automatisme, chargé d'affaire (+ commercial en copie, option). *Pas d'envoi au client.* |
| **Compte rendu de chantier** | À la demande / à la clôture | PDF multi-pages (tous les points + synthèse par jalon) | Chargé d'affaire, dossier de réception |
| **Compte rendu de formation** | Après chaque session | PDF 1-2 p. | Client + dossier interne |
| **Feuille de présence signée** | Après chaque session | PDF 1 p. | Client + dossier interne |
| **Attestation individuelle de formation** | À la demande | PDF 1 p. par participant | Chaque participant |
| **PV de réception avec levée des réserves** | Clôture | PDF 2 p. | Client, chargé d'affaire *(v1.1)* |
| **Version Word** | À la demande | DOCX | Pour retouche par le bureau |

Tous les documents reprennent la **charte BFR Systems** : logo, bandeaux cyan, typographies Poppins/Open Sans, pied de page des sites — comme le modèle « Compte rendu d'intervention » du SAV.

---

## 9. Réutilisation de BFR-Report (analyse de code)

Le dépôt BFR-Report a été analysé : **environ 70 % de la mécanique est réutilisable**.

| Module existant | Taille | Réutilisation pour BFR-Chantier |
|---|---|---|
| `pdf.js` — moteur PDF maison (aucune dépendance) | 23 Ko | **Réutilisé tel quel** (texte, tableaux, images, aperçu à l'écran) |
| `docx.js` — génération Word | 28 Ko | **Réutilisé tel quel** |
| `annotate.js` — annotation photo au doigt | 12 Ko | **Réutilisé tel quel** |
| `clients.js` — autocomplétion 3 lettres + import CSV | 14 Ko | **Réutilisé**, étendu aux contacts de site |
| `wizard.js` — assistant 4 étapes + dictée + relecture vocale | 26 Ko | **Adapté** (10 activités, 6 catégories au lieu de 3 domaines / 5 catégories) |
| `langues.js` + `traduction.js` — 6 langues hors connexion | 54 Ko | **Réutilisé** (chantiers hors France, équipes néerlandophones) |
| `logo-bfr.js` — logo vectoriel | 45 Ko | **Réutilisé** |
| `icons.js`, `icones-data.js` — icônes SVG | 68 Ko | **Réutilisé**, complété (chantier, formation, jalon) |
| `correcteur-fr.js`, `glossaire-bfr.js` | 29 Ko | **Réutilisé** |
| `style.css` — charte BFR, tactile, gros boutons | 12 Ko | **Réutilisé et étendu** (barres d'avancement, onglets, tableaux) |
| `report.js` — mise en page du rapport + textes de mail | 95 Ko | **Forké** : le canevas est propre au chantier (§ 7.1) |
| `app.js` — interface, IndexedDB, signature, photos, envoi | 225 Ko | **Repris architecturalement** (Store/DB, signature, photos, partage, sauvegarde JSON), **réécrit pour le modèle chantier/journée** |
| `build.py` — assemblage fichier unique + site PWA | 15 Ko | **Adapté** (noms, icônes, manifeste) |
| `sw.js` — service worker réseau d'abord | 2 Ko | **Réutilisé** |

**Point d'attention technique.** BFR-Report stocke dans IndexedDB (`bfr_sav_v3`) et localStorage. BFR-Chantier utilise une **base et un préfixe distincts** (`bfr_chantier_v1`) : vérifié, **les deux applications peuvent cohabiter sur le même téléphone** sans interférer (installées comme deux icônes distinctes, avec deux entrées d'écran d'accueil, deux caches de service worker séparés par l'URL).

---

## 10. Architecture technique

```
BFR-Chantier/
├── app/
│   ├── index.html            gabarit
│   ├── icons/                icônes PWA (générées par build.py, sans dépendance)
│   └── src/
│       ├── pdf.js            moteur PDF (repris)
│       ├── docx.js           moteur Word (repris)
│       ├── annotate.js       annotation photo (repris)
│       ├── wizard.js         assistant d'action (adapté)
│       ├── clients.js        clients + contacts (étendu)
│       ├── langues.js        libellés 6 langues (étendu)
│       ├── traduction.js     traduction des commentaires (repris)
│       ├── style.css         charte BFR (étendue)
│       ├── modele.js         NOUVEAU — modèle de données chantier/journée/session
│       ├── avancement.js     NOUVEAU — calcul jalons, % , heures, reports
│       ├── pointsoir.js      NOUVEAU — mise en page du point du soir + textes de mail
│       ├── formation.js      NOUVEAU — sessions, participants, attestations
│       └── chantier.js       NOUVEAU — interface (liste, fiche, journée, écrans)
├── modele/                   modèles de référence (PDF d'exemple à valider)
├── exemples/                 points du soir / CR de formation de démonstration
├── docs/                     site publié (GitHub Pages) — installable, hors connexion
├── BFR-Chantier.html         application complète en 1 fichier (dépannage)
└── build.py                  assemble le fichier unique et docs/
```

**Choix techniques (alignés sur l'existant)**
| Sujet | Décision |
|---|---|
| Langage / cadre | **JavaScript pur, zéro dépendance à l'exécution** — un seul code source, aucun paquet à maintenir |
| Stockage | **IndexedDB** : `chantiers`, `journees`, `sessions`, `photos`, `documents` ; **localStorage** : réglages, identité, modèles |
| Hors connexion | **Service worker** (réseau d'abord, cache en secours, 3,5 s de délai) — identique au SAV |
| Installation | **PWA** via GitHub Pages, ajout à l'écran d'accueil (Android/iOS) |
| Mise à jour | Version = empreinte du code, injectée dans `sw.js` → chaque téléphone prend la nouvelle version à sa prochaine ouverture avec du réseau |
| Données | **Aucune donnée client ne quitte le téléphone** ; aucun serveur ; liste clients importée à la main (dépôt public sans données clients) |
| Sauvegarde | **Export / import JSON** (régulier), plus export PDF des documents |
| Photos | Compressées et stockées dans IndexedDB, jamais envoyées ailleurs qu'en pièce jointe du PDF |

**Robustesse terrain** : boutons ≥ 44 px, saisie à une main, contrastes élevés (lisibilité en atelier), fonctionne écran éteint/allumé, pertes de réseau tolérées, aucune donnée perdue si le téléphone redémarre en pleine saisie (enregistrement continu).

---

## 11. Lots de développement

| Lot | Contenu | Livrable vérifiable |
|---|---|---|
| **L0 — Socle** (0,5 j) | `build.py`, charte, PWA, service worker, stockage, navigation, réglages, identité du chef de chantier, sauvegarde JSON | L'application s'installe, se lance hors connexion, mémorise les réglages |
| **L1 — Chantiers** (1 j) | Liste, création (modèle), fiche chantier, client par autocomplétion, équipements, effectif, jalons & pondérations, statuts | Créer un chantier complet, le retrouver, l'archiver |
| **L2 — Journée** (1,5 j) | Ouverture/clôture, chrono, effectif/heures, tâches, actions (assistant 4 étapes), photos annotées, blocages avec gravité et responsable, matériel, sécurité, essais | Saisir une journée complète sur le terrain, tout est conservé |
| **L3 — Point du soir** (1,5 j) | Mise en page PDF, synthèse, avancement calculé, reports automatiques, aperçu, e-mail pré-rempli, règles d'escalade, historique, verrouillage/versionnage | Générer et envoyer un point du soir depuis le téléphone |
| **L4 — Formation** (1 j) | Sessions, programme coché, participants + signature, CR de formation, feuille de présence, attestations individuelles | Produire les 3 documents de formation |
| **L5 — Synthèses & finitions** (1 j) | CR de chantier multi-jours, documents du chantier, rappels/notifications, recherche, multi-langue, tests hors connexion | Dossier de chantier complet + mode d'emploi |

**Total ≈ 6,5 jours de développement**, livrés lot par lot (vous pouvez tester à chaque étape).

**Tests prévus** : jeu de vérifications automatisées sur le calcul d'avancement, les reports, les heures, les règles d'escalade et le rendu page à page des PDF — dans l'esprit des ~170 vérifications de BFR-Report.

---

## 12. Ce que je vous demande de valider (avant de coder)

| N° | Sujet | Proposition par défaut | Qui tranche |
|---|---|---|---|
| 1 | **Vocabulaire** | « Chantier », « Journée », « Point du soir », « Chef de chantier », « Effectif », « Jalon » | Direction |
| 2 | **N° d'affaire** | Format `AANN-NNN` (ex. `25-0142`), saisissable ou généré | Admin / chargé d'affaire |
| 3 | **Jalons standard** | La liste de 13 jalons proposée en § 5.1 (+ poids respectifs) | Chef d'atelier + resp. BE électrotechnique + chef bureau automatisme |
| 4 | **Activités** (étape 1 de l'assistant) | Les 10 proposées en § 5.3 | Chefs de chantier |
| 5 | **Catégories / gravités** | Les 6 catégories et 3 gravités de § 5.3 et § 5.4 | Chef d'atelier |
| 6 | **Destinataires par défaut** | Chef d'atelier + **responsable BE électrotechnique** + chef bureau automatisme + chargé d'affaire ; **commercial en copie (option)** | Direction |
| 7 | **Effectif et heures** | Effectif (nombre de personnes) + heures de la journée, **sans nominatif**. Faut-il un **export CSV des heures par chantier** pour le pointage ou la paie ? | Admin / RH |
| 8 | **Rappel du soir** | Notification à 16 h 45 puis 18 h 30 | Direction |
| 9 | **Commercial en copie** | **Désactivé par défaut**, activable chantier par chantier | Direction / commercial |
| 10 | **Attestations** | Modèle à valider (mentions, cachet, signature) — un exemplaire est fourni en exemple | Direction / RH |
| 11 | **Langues** | Français par défaut ; anglais/néerlandais/allemand sur les chantiers concernés | Chargé d'affaire |
| 12 | **Modèles de chantier** | 3 modèles à définir : *installation neuve*, *mise en service / retrofit*, *formation seule* | Chef d'atelier |

**Rien de bloquant** : ces points peuvent être ajustés pendant et après le développement, mais les trancher d'abord évite de refaire.

---

## 13. Feuille de route après la v1

1. **Point de semaine** — synthèse automatique du lundi (5 points du soir consolidés, une page par chantier + une vue tous chantiers).
2. **Tableau de bord des responsables** (page web) — tous les chantiers en cours, blocages ouverts, avancements, sans passer par les mails. Suppose un hébergement (la première brique vers le point 3).
3. **Envoi automatique par le serveur (SMTP)** + archivage central de tous les points, copie au SAV, historique par client et par machine.
4. **Planning prévisionnel** — affectation des équipes, vision des chantiers à venir, comparaison prévu/réalisé.
5. **Chiffrage** — heures et fournitures valorisées, base de facturation et d'analyse de rentabilité par chantier.
6. **Référentiel clients/équipements partagé** — parc machines par client, historique des interventions BFR-Report *et* des chantiers dans un même dossier client.

---

## 14. Annexes

### 14.1 Comparaison des deux applications

| | BFR-Report | BFR-Chantier |
|---|---|---|
| Icône / nom | *SAV* | *Chantier* |
| Base locale | `bfr_sav_v3` | `bfr_chantier_v1` |
| Site publié | `…/BFR-Report/` | `…/BFR-Chantier/` |
| Unité | Rapport (1 intervention) | Journée (n par chantier) |
| Document principal | Compte rendu d'intervention | Point du soir |
| Diffusion | Client + SAV | **Responsables internes** (+ commercial en copie, option) |
| Signature sur écran | Client, une fois | **Participants de formation** (équipes client) — pas de visa quotidien |
| Cohabitation | Les deux applications s'installent côte à côte sur le même téléphone sans se gêner | |

### 14.2 Glossaire
- **Chantier** — une affaire d'installation / mise en service / formation, identifiée par un n° d'affaire.
- **Journée** — une journée de présence sur le chantier, ouverte le matin et clôturée le soir.
- **Action** — un fait marquant saisi dans la journée (photo annotée, commentaire, catégorie).
- **Blocage** — ce qui empêche ou ralentit l'équipe ; porte une gravité et un responsable.
- **Jalon** — une étape d'avancement du chantier, avec un poids dans l'avancement global.
- **Point du soir** — le bilan quotidien du chantier, en PDF, envoyé aux responsables.
- **Effectif** — le nombre de personnes présentes sur le chantier, saisi **sans nominatif** ; il sert au calcul des hommes-heures.
- **Destinataires** — les responsables internes BFR qui reçoivent le point du soir chaque soir.
- **Session** — une séquence de formation, avec ses participants et son programme.

### 14.3 Livrables produits par le développement
1. L'application installable (site PWA) et le fichier unique `BFR-Chantier.html`.
2. Un jeu de **documents de démonstration** : point du soir, CR de chantier, CR de formation, feuille de présence, attestation.
3. Un **mode d'emploi** pour l'équipe (`MODE-EMPLOI.md` + écran « Mode d'emploi » dans l'application).
4. Une **note d'installation pour les collègues** (comme `INSTALLATION-COLLEAGUES.md` du SAV).
5. Les **modèles de chantier** prêts à l'emploi.

# Installer BFR Chantier sur un téléphone

**Application interne BFR Systems** — suivi des installations, mises en service et formations.
À faire **une fois par téléphone** (5 minutes). Ensuite l'application s'ouvre depuis son icône et fonctionne **hors connexion**.

> **Aucune donnée client ni aucune adresse e-mail ne se trouve dans le dépôt** ni sur un serveur : tout reste dans le téléphone. L'application arrive donc **sans les adresses des responsables** — c'est le § 2 ci-dessous qui les renseigne, une fois par téléphone.

---

## 1. Installer l'application

1. Ouvrir l'adresse du site dans **Chrome** (elle vous a été communiquée par le bureau) :
  `https://<compte>.github.io/BFR-Chantier/`
2. Menu **⋮** → **Installer et créer un raccourci** → **Installer**
  *(sur les versions plus anciennes : **Ajouter à l'écran d'accueil** → **Installer**).*
3. Fermer Chrome et ouvrir **BFR Chantier** depuis l'icône : l'application démarre même sans réseau.

*Sur iPhone* : ouvrir l'adresse dans **Safari** → **Partager** → **Sur l'écran d'accueil**.

> Si Chrome affiche l'adresse comme dangereuse, c'est uniquement parce qu'elle n'est pas référencée dans les moteurs de recherche (`noindex`) : l'application est privée, ce qui est voulu.

---

## 2. Premiers réglages (une seule fois)

Ouvrir **Menu → Réglages** :

| À renseigner | Pourquoi |
|---|---|
| **Chef de chantier** : prénom, nom, fonction, téléphone, e-mail | Figure dans les mails et dans l'en-tête du point du soir |
| **Responsables** : nom **et adresse e-mail** du chef d'atelier, du **responsable BE électrotechnique**, du chef bureau automatisme, du chargé d'affaire — **à saisir ici : l'application n'en contient aucune** | Ce sont eux qui reçoivent le point du soir **chaque soir**. L'adresse est vérifiée au fur et à mesure de la frappe. Ces adresses valent pour tous les chantiers ; elles peuvent être remplacées chantier par chantier (fiche du chantier → onglet Réglages) |
| **Commercial** : adresse e-mail (facultatif) | Il ne sera mis en copie que si l'option est cochée sur un chantier |
| **Société** : raison sociale, adresse, téléphone, e-mail | Pied de page des documents |
| **Signature** (facultatif) | Signature du formateur sur les attestations de formation |
| **Liste clients** : importer l'export CSV | L'autocomplétion en 3 lettres pour créer un chantier |

Puis **Menu → Réglages → Liste clients → Importer un CSV** : le fichier est conservé dans le téléphone et reste disponible hors connexion.

---

## 3. Vérifier que tout fonctionne

1. **Nouveau chantier** : tapez le nom d'un client connu, 3 lettres → la liste propose la fiche, elle se remplit toute seule.
2. **Démarrer la journée** : l'heure d'arrivée s'affiche ; ajoutez une tâche, un blocage, une photo.
3. **Clôturer la journée** : l'aperçu du point du soir s'affiche à l'écran.
4. **Envoyer** : le partage du téléphone s'ouvre avec le PDF joint — choisissez Gmail et envoyez-vous le message à vous-même pour vérifier.
5. **Supprimez le chantier de test** (fiche chantier → Réglages → Supprimer) une fois l'essai concluant.

---

## 4. Bon à savoir

- **Hors connexion** : saisie, photos, PDF et signature fonctionnent sans réseau. **Seul l'envoi du mail** a besoin de réseau.
- **Mise à jour de l'application** : rien à faire. À la prochaine ouverture avec du réseau, la nouvelle version se charge toute seule. Le numéro de version est visible dans Menu → Réglages → Application.
- **Sauvegarde** : Menu → **Exporter la sauvegarde** (fichier `.json`). À faire au moins **une fois par semaine**, et avant de changer de téléphone. Restauration : Menu → Réglages → **Importer**.
- **BFR Chantier et BFR SAV cohabitent** sur le même téléphone : deux icônes, deux bases de données séparées, aucun risque de mélange.
- **Photos** : elles sont réduites automatiquement (1600 px) pour ne pas saturer le téléphone.

---

## 5. Dépannage

| Symptôme | Que faire |
|---|---|
| L'application ne s'installe pas | Vérifiez que vous êtes bien dans **Chrome** (Android) ou **Safari** (iPhone) et que l'adresse est en `https://`. Ouvrez la page `/diagnostic.html` du site : elle affiche ce que le navigateur voit |
| L'écran reste sur « Chargement… » | Fermez l'application, ouvrez-la avec du réseau (Wi-Fi) une première fois |
| Le bouton Envoyer ne propose pas Gmail | Choisissez « Partager » puis Gmail dans la liste ; à défaut, enregistrez le PDF et joignez-le au message |
| Rien ne s'affiche après une mise à jour | Rouvrez l'application avec du réseau une seconde fois (le cache se met à jour) |
| **Chrome dit « application déjà installée »** alors qu'elle ne l'est pas | Les deux applications BFR (SAV et Chantier) sont publiées sous le même domaine : Chrome conserve un **enregistrement d'installation périmé** et croit l'application présente. Voir la marche à suivre détaillée ci-dessous |
| **Avant de désinstaller une application BFR** | Faites **Menu → Exporter la sauvegarde** dans *chaque* application : la désinstallation efface les données du téléphone (chantiers, clients, photos) |
| Chrome dit « application déjà installée » puis « impossible d'ouvrir l'application » | même cause. Ouvrez **`/diagnostic.html`** : la **carte 4** confirme ce que Chrome croit installé, et la **carte 6** permet de nous envoyer le rapport d'un seul bouton. Puis suivez « Application fantôme » ci-dessous |
| Le mail s'ouvre sans destinataire | Les adresses ne sont pas encore saisies sur ce téléphone : Menu → Réglages → Responsables (§ 2) |
| Une adresse est refusée | Vérifiez la forme (`vous@exemple.fr`) : l'application indique les adresses invalides en rouge |
| Le téléphone a été changé | Installez l'application, puis Menu → Réglages → **Importer** le fichier de sauvegarde `.json` |

---

## 6. Application fantôme : « déjà installée », mais introuvable

Chrome garde la trace d'une installation qui n'a jamais abouti (ou qui a été
supprimée) et **refuse alors d'installer** : il propose « Ouvrir l'application »,
puis échoue, ou affiche « impossible d'ouvrir l'application ». La trace est
interne à Chrome : l'application n'existe plus sur le téléphone.

**À faire dans cet ordre.**

0. **Si aucune application ne figure sur le téléphone** alors que Chrome dit
   « déjà installée » : c'est le signe que Chrome garde une trace sans
   application derrière. Dans ce cas, il n'y a **rien à désinstaller** : passez
   directement au point 2, puis réinstallez. Le projet a changé l'identité
   d'installation le 7 octobre 2026 (identifiant **et** adresse de démarrage) :
   Chrome doit donc voir une application neuve.

1. **Cherchez l'application sur le téléphone** — c'est la voie officielle :
   **Réglages** (Android) → **Applications** → **Voir toutes les applications** →
   cherchez **BFR Chantier** → si elle apparaît, **Désinstallez-la**.
   Regardez aussi l'**écran d'accueil** et le **tiroir d'applications** :
   appui long sur l'icône → **Informations sur l'application** → **Désinstaller**.
   *Un ancien raccourci porte parfois le même nom.*

2. **Vérifiez ce que Chrome voit.** Ouvrez
   `https://<compte>.github.io/BFR-Chantier/diagnostic.html` dans Chrome :
   la **carte 4** dit si Chrome croit une application installée, et la
   **carte 6 → « Copier le rapport »** produit un texte à nous transmettre.
   Le rapport ne contient **aucune donnée de chantier**.

3. **Réinstallez** depuis la page de l'application : menu **⋮** →
   **Installer et créer un raccourci** → **Installer**.

4. **Si Chrome refuse toujours**, installez depuis **un autre navigateur** :
   **Edge** ou **Samsung Internet** (Android). Chacun gère ses propres
   installations, sans la trace laissée dans Chrome : l'application est
   identique, hors connexion comprise. Attention : les données saisies dans
   Chrome et dans Edge sont **séparées** (même téléphone, deux bases distinctes) —
   ce n'est gênant que si vous saisissez dans les deux.

> **Ne faites jamais « Effacer les données du site »** pour ce domaine dans
> Chrome : **BFR SAV est publié sous le même domaine** et vous effaceriez ses
> chantiers et ses rapports en même temps.

> **Avant toute désinstallation** d'une application BFR qui contient des
> données : **Menu → Exporter la sauvegarde**, dans *chaque* application.

---

*BFR Chantier — application interne. Les données clients ne quittent jamais le téléphone.*

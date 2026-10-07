# Installer BFR Chantier sur un téléphone

**Application interne BFR Systems** — suivi des installations, mises en service et formations.
À faire **une fois par téléphone** (5 minutes). Ensuite l'application s'ouvre depuis son icône et fonctionne **hors connexion**.

> **Aucune donnée client ni aucune adresse e-mail ne se trouve dans le dépôt** ni sur un serveur : tout reste dans le téléphone. L'application arrive donc **sans les adresses des responsables** — c'est le § 2 ci-dessous qui les renseigne, une fois par téléphone.

---

## 1. Installer l'application

1. Ouvrir l'adresse du site dans **Chrome** (elle vous a été communiquée par le bureau) :
  `https://<compte>.github.io/BFR-Chantier/`
2. Menu **⋮** → **Ajouter à l'écran d'accueil** → **Installer**.
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
| **Chrome dit « application déjà installée »** alors qu'elle ne l'est pas | Les deux applications BFR (SAV et Chantier) sont publiées sous le même domaine : Chrome mélange parfois leurs installations. Ouvrez **https://&lt;compte&gt;.github.io/BFR-Chantier/diagnostic.html** sur le téléphone : la page dit ce que Chrome voit, et propose le bouton d'installation si l'invite est disponible. Sinon : menu **⋮** → *Ajouter à l'écran d'accueil*, ou installez depuis un autre navigateur (Edge, Samsung Internet) |
| **Avant de désinstaller une application BFR** | Faites **Menu → Exporter la sauvegarde** dans *chaque* application : la désinstallation efface les données du téléphone (chantiers, clients, photos) |
| Le mail s'ouvre sans destinataire | Les adresses ne sont pas encore saisies sur ce téléphone : Menu → Réglages → Responsables (§ 2) |
| Une adresse est refusée | Vérifiez la forme (`vous@exemple.fr`) : l'application indique les adresses invalides en rouge |
| Le téléphone a été changé | Installez l'application, puis Menu → Réglages → **Importer** le fichier de sauvegarde `.json` |

---

*BFR Chantier — application interne. Les données clients ne quittent jamais le téléphone.*

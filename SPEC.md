# Cahier des charges – AGRIKEY PME (MVP pour le concours PIATE)

> À placer à la racine du projet (par exemple sous le nom `SPEC.md`) et à donner à Claude Code au début de chaque session.

## 1. Objectif

Construire en 5 jours un outil de gestion **tout-en-un, simple et en français**, pour les petites entreprises maliennes. Une seule application, un seul tableau de bord, quatre modules : **Caisse**, **Projets**, **Documents**, **Mon entreprise**. Un cinquième module, **Affiches et logos IA**, est visible mais marqué « Bientôt disponible ».

Échéance : démonstration en ligne fonctionnelle le **samedi 17 octobre 2026**, pour un envoi du dossier le 18 octobre.

## 2. Principes de simplicité (priorité absolue)

- **Mobile d'abord.** Tout doit être utilisable sur un téléphone d'entrée de gamme.
- **Français uniquement**, vocabulaire courant, sans jargon comptable : « Argent reçu » et « Argent dépensé », pas « crédit » et « débit ».
- **Trois touches maximum** pour ajouter une opération de caisse, une tâche ou générer un document.
- **Un tableau de bord unique** avec de gros boutons : Caisse, Projets, Documents, Mon entreprise.
- **Aucune configuration obligatoire** : l'utilisateur peut commencer à saisir dès son inscription.
- **Pages légères** : pas de grosses images ni de bibliothèques lourdes, pour fonctionner avec une connexion lente.
- **Messages d'erreur clairs**, en une phrase, qui disent quoi faire.

## 3. Utilisateurs et parcours

Utilisateur type : gérant d'une boutique, d'un atelier ou d'une petite entreprise de services, peu à l'aise avec l'informatique.

Parcours principal :

1. Il s'inscrit (e-mail et mot de passe, ou numéro de téléphone si c'est faisable en moins d'une journée).
2. Il saisit le nom de son entreprise (seul champ obligatoire).
3. Il arrive sur le tableau de bord et choisit un module.

## 4. Modules

### 4.1 Tableau de bord

- Salutation avec le nom de l'entreprise.
- Quatre grosses cartes : **Caisse** (solde du mois), **Projets** (nombre de tâches à faire), **Documents**, **Mon entreprise**.
- Carte grisée « Affiches et logos IA – Bientôt ».
- Raccourci permanent « + Ajouter » (opération de caisse ou tâche).

### 4.2 Caisse (journal de caisse)

Fonctions :

- Ajouter une opération : **type** (Argent reçu / Argent dépensé), **montant en FCFA**, **catégorie**, **note** facultative, **date** (aujourd'hui par défaut).
- Liste des opérations, de la plus récente à la plus ancienne, avec filtre par mois.
- Résumé du mois : total reçu, total dépensé, **solde**.
- Catégories par défaut (modifiables) : Ventes, Salaires, Loyer, Transport, Achats, Électricité et eau, Communication, Autres.
- Modifier ou supprimer une opération (avec confirmation).
- Export du mois en **PDF** (impression du navigateur avec une mise en page propre) et en **CSV**.

Règles :

- Le montant est un entier positif ; le type détermine le signe.
- Affichage du montant avec séparateur de milliers : `1 250 000 FCFA`.

### 4.3 Projets (agenda des projets)

Fonctions :

- Créer un projet : nom, description courte, date de début, date de fin.
- Dans un projet, ajouter des **tâches** : titre, responsable (texte libre), échéance, statut (À faire / En cours / Terminé).
- Vue **« À faire cette semaine »** regroupant les tâches proches de leur échéance, tous projets confondus.
- Tâches en retard signalées en rouge.
- Cocher une tâche pour la terminer en un geste.
- Barre de progression par projet (tâches terminées sur total).

Hors périmètre : diagrammes de Gantt, notifications, travail à plusieurs utilisateurs.

### 4.4 Documents (modèles administratifs)

Fonctions :

- Bibliothèque de **10 modèles** (liste ci-dessous).
- L'utilisateur choisit un modèle, remplit un court formulaire, voit l'**aperçu** et le télécharge en **PDF** ; export Word si le temps le permet.
- Les informations de l'entreprise (nom, adresse, téléphone, e-mail, logo, ville) sont **remplies automatiquement** depuis « Mon entreprise ».
- En-tête avec logo et couleur de l'entreprise.
- Historique des documents créés (titre, date, nouveau téléchargement).

Modèles du MVP :

1. Lettre de demande de rendez-vous
2. Lettre de relance de paiement
3. Devis
4. Facture simple
5. Reçu de paiement
6. Bon de commande
7. Attestation de travail
8. Demande de congé
9. Convocation à une réunion
10. Compte rendu de réunion

Règles :

- Chaque modèle est un objet de données (titre, champs, texte avec variables comme `{{nom_client}}`), pas du code spécifique : ajouter un modèle doit demander peu d'effort.
- Les devis et les factures calculent automatiquement les totaux à partir des lignes saisies.
- Mise en page A4 propre, polices lisibles, prête à imprimer.

### 4.5 Mon entreprise (profil)

- Champs : nom (obligatoire), activité, adresse, ville, téléphone, e-mail, numéro RCCM (facultatif), logo (image, 1 Mo maximum), couleur principale.
- Ces informations alimentent les documents.

### 4.6 Affiches et logos IA (phase 2)

- Pour le MVP : page de présentation « Bientôt disponible » avec un bouton **« Me prévenir »** qui enregistre l'e-mail de l'utilisateur.
- Ne pas développer la génération réelle avant le dépôt du dossier.

## 5. Données (Supabase / Postgres)

Toutes les tables ont `id` (uuid), `user_id` (référence à l'utilisateur) et `created_at`. **Row Level Security activée partout** : chaque utilisateur ne voit que ses propres lignes.

| Table | Champs principaux |
| --- | --- |
| `entreprises` | `nom`, `activite`, `adresse`, `ville`, `telephone`, `email`, `rccm`, `logo_url`, `couleur` |
| `categories_caisse` | `nom`, `type` (recu / depense) |
| `operations_caisse` | `type`, `montant` (entier), `categorie_id`, `note`, `date` |
| `projets` | `nom`, `description`, `date_debut`, `date_fin` |
| `taches` | `projet_id`, `titre`, `responsable`, `echeance`, `statut` |
| `modeles_documents` | `code`, `titre`, `champs` (json), `contenu` (texte avec variables) — données communes à tous |
| `documents` | `modele_code`, `titre`, `donnees` (json), `created_at` |
| `liste_attente_ia` | `email` |

Le logo est stocké dans Supabase Storage, dans un dossier par utilisateur.

## 6. Technique

- **Base de départ** : réutiliser le projet AGRIKEY Learning (Next.js, Supabase, Vercel) pour l'authentification, la base de données et le déploiement. Créer une nouvelle section ou un nouveau projet selon ce qui est le plus rapide, sans casser la plateforme de formation.
- **Style** : couleurs Agrikey (bleu marine et vert), composants simples, grands boutons (hauteur minimale 48 px), texte d'au moins 16 px.
- **Génération PDF** : impression du navigateur avec feuille de style dédiée (`@media print`) pour aller vite ; une bibliothèque PDF seulement si nécessaire.
- **Pas de paiement dans le MVP.** L'intégration PayDunya est prévue pour la version 1 ; ne pas la développer maintenant.
- **Sécurité** : RLS sur toutes les tables, validation des saisies côté serveur, aucun secret dans le code.
- **Performance** : pages chargées en moins de 3 secondes sur une connexion 3G ; pas de dépendance lourde inutile.

## 7. Critères d'acceptation du MVP

Le MVP est prêt quand une personne qui n'a jamais utilisé l'outil peut, **sans aide, depuis son téléphone** :

- [ ] créer un compte et renseigner le nom de son entreprise en moins de 2 minutes ;
- [ ] enregistrer une entrée et une dépense d'argent, et voir le solde du mois ;
- [ ] créer un projet avec 3 tâches et en terminer une ;
- [ ] générer un devis avec le logo de son entreprise et le télécharger en PDF ;
- [ ] retrouver ses données après s'être déconnecté puis reconnecté ;
- [ ] constater qu'un autre compte ne voit pas ses données.

## 8. Ordre de construction

| Jour | Travail | Résultat attendu |
| --- | --- | --- |
| Mercredi 14 | Squelette : authentification, tableau de bord, profil entreprise, base de données et RLS | On peut s'inscrire et voir le tableau de bord |
| Jeudi 15 | Caisse complète, puis Projets | Deux modules utilisables de bout en bout |
| Vendredi 16 | Documents (4 modèles d'abord : devis, facture, lettre de relance, reçu), puis les 6 autres si le temps le permet | Génération PDF fonctionnelle |
| Samedi 17 | Page « Affiches IA – Bientôt », test sur téléphone, corrections, déploiement, captures d'écran | Lien de démonstration stable |

Si le retard s'accumule, couper dans cet ordre : modèles de documents au-delà de 4, export Word, export CSV, vue « À faire cette semaine ». **Ne jamais couper** : authentification, RLS, caisse, un document PDF.

## 9. Hors périmètre du MVP

Application mobile native, mode hors connexion, paiement en ligne, génération d'images par IA, multi-utilisateurs par entreprise, comptabilité complète, factures conformes aux normes fiscales, notifications.

## 10. Prompt de démarrage pour Claude Code

```
Lis SPEC.md en entier. Nous construisons AGRIKEY PME, un outil de gestion tout-en-un
pour les PME maliennes, en français, mobile d'abord, extrêmement simple.

Commence par le jour 1 de la section 8 : authentification, tableau de bord,
profil entreprise, schéma de base de données avec Row Level Security.
Propose d'abord un court plan, puis implémente. Respecte les principes de
simplicité de la section 2 et ne développe rien de la section 9.
À la fin, dis-moi comment tester sur mon téléphone.
```

Pour les jours suivants, remplacer « jour 1 » par le jour en cours et rappeler les critères de la section 7.

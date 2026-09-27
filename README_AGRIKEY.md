# AGRIKEY Learning — Documentation de passation

## 1. Présentation

AGRIKEY Learning est une plateforme SaaS/LMS développée avec Next.js, TypeScript, Tailwind CSS et Supabase.

Objectifs :
- proposer des formations en ligne ;
- organiser les formations en modules et leçons ;
- proposer vidéos, PDF et quiz ;
- suivre la progression ;
- délivrer des certificats ;
- administrer les formations ;
- préparer progressivement le paiement.

Le propriétaire est débutant en développement web. Les modifications doivent être expliquées simplement.

## 2. Environnement

Projet Windows :

`C:\Users\USER\agrikey-learning`

Technologies :
- Next.js 16.3.6
- TypeScript
- Tailwind CSS
- Supabase
- Next.js App Router
- PowerShell
- Node.js v26.10.0
- npm v11.19.1

Le SWC natif est bloqué par Windows Application Control.

Lancement :

```powershell
npm run dev -- --webpack
```

Port habituel : 3000, parfois 3001.

## 3. Règles de travail

Le propriétaire est débutant.

Toujours :
1. expliquer brièvement ce qui va être fait ;
2. privilégier 3 actions cohérentes maximum ;
3. tester après une modification importante ;
4. ne pas casser une fonctionnalité existante ;
5. vérifier le code réel avant une modification importante ;
6. fournir le fichier complet lorsqu'un fichier doit être remplacé ;
7. pour PowerShell, privilégier `[System.IO.File]::WriteAllText(...)` ;
8. éviter les longues séries de commandes de diagnostic.

Ne pas recréer Supabase ou les tables existantes sans nécessité.

## 4. Architecture

```text
app
├── page.tsx
├── globals.css
├── formations
│   ├── page.tsx
│   ├── gestion-financiere
│   │   ├── page.tsx
│   │   └── lecons/[id]
│   │       ├── page.tsx
│   │       └── CompleteLessonButton.tsx
│   └── [id]
│       ├── page.tsx
│       └── lecons/[lessonId]
│           ├── page.tsx
│           └── quiz/page.tsx
├── inscription/page.tsx
├── connexion/page.tsx
├── mon-espace/page.tsx
├── paiement/page.tsx
├── certificat/[courseId]/page.tsx
├── verifier-certificat/page.tsx
└── admin
    ├── page.tsx
    └── formations/[id]
        ├── page.tsx
        └── modules/[moduleId]
            ├── page.tsx
            └── lessons/[lessonId]/quiz/page.tsx

lib
├── supabase.ts
└── supabase-server.ts

components/Navbar.tsx
data/courses/gestion-financiere.ts
proxy.ts
```

## 5. Supabase

`lib/supabase.ts` utilise `createBrowserClient` de `@supabase/ssr`.

Variables :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

L'authentification Supabase fonctionne.

## 6. Authentification

Compte de test/admin :

Email : `nossta10@gmail.com`

UID : `d765607b-a2ba-4e91-b498-8ea8a8f8b9d7`

Profil :
- full_name : Adama KEITA
- role : admin

Table `profiles` :
- id
- created_at
- user_id
- full_name
- role

RLS activé.

Inscription, connexion et déconnexion fonctionnent.

## 7. Formations

Table `courses` :
- id
- created_at
- title
- category
- level
- price
- duration
- description
- published
- is_free

### Formation 1

**Gestion financière pour entrepreneurs**
- catégorie : Gestion d'entreprise
- niveau : Débutant
- prix : 25 000 FCFA
- durée : 4 heures
- publiée : oui
- gratuite : non

### Formation 2

**Les bases de l'entrepreneuriat**
- catégorie : Gestion d'entreprise
- niveau : Débutant
- prix : 0 FCFA
- durée : 2 heures
- publiée : oui
- gratuite : oui

Formations de test :
- ID 6 : Test formation AGRIKEY
- ID 7 : Module test 2

Elles sont non publiées.

## 8. Modules

Formation 1 :
1. Comprendre les finances de son entreprise
2. Gérer ses recettes et ses dépenses
3. Calculer ses coûts
4. Fixer ses prix
5. Mesurer sa rentabilité
6. Construire son plan financier

Formation 2 :
7. Comprendre l'entrepreneuriat
8. Construire son idée d'activité
9. Organiser son activité

IMPORTANT : la table `modules` ne possède pas `order_number`. Ne pas utiliser `.order("order_number")` sur `modules`. L'ordre actuel utilise l'id.

## 9. Leçons

Table `lessons` :
- id
- created_at
- module_id
- title
- content
- type
- video_url
- pdf_url
- order_number

Formation 1 / module 1 :
1. Comprendre les notions financières de base
2. Identifier les recettes et les dépenses
3. Comprendre les coûts fixes et variables
4. Comprendre la trésorerie de son activité
5. Comprendre la différence entre chiffre d'affaires et bénéfice
6. Les indicateurs financiers essentiels à suivre

Formation 2 / module 7 :
- Qu'est-ce que l'entrepreneuriat ?
- Les qualités d'un entrepreneur

## 10. Progression

Table `lesson_progress` :
- id
- created_at
- user_id
- lesson_id
- completed

Contrainte unique : `(user_id, lesson_id)`.

La progression fonctionne.

Les quiz peuvent également marquer une leçon comme terminée lorsque le score est >= 70 %.

## 11. Enrollments

Table `enrollments` :
- id
- created_at
- user_id
- course_id
- status

Contrainte unique : `(user_id, course_id)`.

Les utilisateurs n'ont plus de permission directe INSERT. Les inscriptions passent par les mécanismes sécurisés existants.

## 12. Paiements

Table `payments` :
- id
- created_at
- user_id
- course_id
- amount
- method
- status
- transaction_id

Fonctions existantes :
- `create_pending_payment`
- `confirm_payment`

Un trigger crée une inscription lorsque le paiement passe à `paid`.

Le paiement réel n'est pas encore complètement intégré.

Ne pas modifier cette partie sauf demande explicite.

## 13. Quiz

Tables :
- `quizzes`
- `questions`
- `answers`

Les bonnes réponses ne sont pas exposées aux apprenants.

Vue publique : `quiz_answer_options`

Elle expose :
- id
- question_id
- answer
- order_number

Elle n'expose pas `is_correct`.

Scoring serveur avec `submit_quiz_attempt`.

Score >= 70 % : quiz réussi et leçon pouvant être terminée.

## 14. Quiz actuel

Formation 2 / module 7 / leçon 7 :

**Qu'est-ce que l'entrepreneuriat ?**

Quiz ID : 1

Questions :
1. Qu'est-ce qu'un entrepreneur ?
   - bonne réponse : Une personne qui crée ou développe une activité

2. Quel est l'objectif principal d'une activité entrepreneuriale ?
   - bonne réponse : Créer de la valeur et développer une activité viable

3. La création d'une activité nécessite-t-elle une organisation ?
   - bonne réponse : Oui

La gestion du quiz et la modification des questions fonctionnent.

## 15. Administration

`/admin` : gestion des formations.

`/admin/formations/[id]` : gestion des modules.

`/admin/formations/[id]/modules/[moduleId]` : gestion des leçons.

Fonctions :
- créer ;
- modifier ;
- supprimer ;
- titre ;
- contenu ;
- type ;
- vidéo ;
- PDF ;
- ordre ;
- accès au quiz.

`/admin/formations/[id]/modules/[moduleId]/lessons/[lessonId]/quiz` : gestion du quiz.

Ces parties fonctionnent actuellement.

## 16. PDF

Bucket Supabase :

`course-pdfs`

Le bucket est public.

L'upload PDF fonctionne.

Le chemin ressemble à :

`courseId/moduleId/timestamp-nom.pdf`

Le champ `lessons.pdf_url` contient l'URL publique.

Côté apprenant :
- PDF affiché dans un iframe ;
- bouton pour ouvrir dans un nouvel onglet.

Le problème `Bucket not found` a été résolu en créant le bucket `course-pdfs`.

Ne pas modifier cette partie si elle fonctionne.

## 17. Certificats

Table `certificates` :
- id
- created_at
- user_id
- course_id
- certificate_number
- issued_at

Contrainte unique : `(user_id, course_id)`.

Fonction : `issue_course_certificate`.

Page : `/certificat/[courseId]`.

Elle affiche :
- certificat ;
- numéro ;
- participant ;
- formation ;
- date ;
- impression/enregistrement ;
- QR code.

Le QR code pointe vers `/verifier-certificat?numero=...`.

Fonction publique : `verify_certificate`.

La vérification valide/faux fonctionne.

Amélioration restante : `/verifier-certificat` ne récupère pas encore automatiquement `numero` depuis l'URL après scan du QR code.

## 18. Mon espace

`/mon-espace` fonctionne.

Il détecte l'utilisateur connecté et affiche les formations/progression.

Fonction `get_course_completion_status` :
- total des leçons ;
- leçons terminées ;
- total des quiz ;
- quiz réussis ;
- état de complétion.

## 19. État UX/UI actuel

Identité visuelle :
- vert AGRIKEY ;
- blanc ;
- gris/slate ;
- cartes arrondies ;
- boutons verts ;
- responsive.

La page d'accueil et la navbar ont été améliorées.

L'administration formations/modules/leçons a été améliorée.

La page `/inscription` reste à professionnaliser : elle fonctionne mais son apparence est encore trop basique.

## 20. Prochaines étapes

Ordre envisagé :
1. améliorer `/inscription` ;
2. améliorer `/connexion` ;
3. améliorer `/mon-espace` ;
4. améliorer le parcours d'une formation ;
5. ajouter précédent/suivant entre les leçons ;
6. améliorer la progression ;
7. améliorer le certificat ;
8. faire fonctionner la vérification automatique depuis le QR code ;
9. améliorer le mobile ;
10. passe UX/UI globale ;
11. paiement réel.

## 21. Instruction pour Claude

Avant de modifier :
- lire le code réel ;
- comprendre l'existant ;
- ne pas recréer ce qui existe ;
- ne pas supprimer une fonctionnalité fonctionnelle.

Pour chaque étape :
1. expliquer brièvement ;
2. donner maximum 3 actions ;
3. fournir les fichiers complets lorsque pertinent ;
4. faire tester avant de continuer.

Commencer par analyser le projet réel sans modifier de fichier.

Présenter :
- ce qui est compris ;
- les fonctionnalités existantes ;
- les fichiers importants ;
- les problèmes détectés ;
- les 3 prochaines actions proposées.

Puis attendre la validation avant une modification importante.

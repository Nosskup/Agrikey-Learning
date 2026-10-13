-- =====================================================================
-- AGRIKEY PME — schéma de base de données (jour 1)
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.
-- Le script est ré-exécutable sans risque (IF NOT EXISTS / DROP ... IF EXISTS).
-- Il ne touche à aucune table d'AGRIKEY Learning.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

create table if not exists public.entreprises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  nom text not null check (char_length(trim(nom)) between 1 and 120),
  activite text check (char_length(activite) <= 120),
  adresse text check (char_length(adresse) <= 200),
  ville text check (char_length(ville) <= 80),
  telephone text check (char_length(telephone) <= 30),
  email text check (char_length(email) <= 120),
  rccm text check (char_length(rccm) <= 60),
  logo_url text check (char_length(logo_url) <= 500),
  couleur text not null default '#16834b' check (couleur ~ '^#[0-9a-fA-F]{6}$')
);

create table if not exists public.categories_caisse (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  nom text not null check (char_length(trim(nom)) between 1 and 60),
  type text not null check (type in ('recu', 'depense', 'tous'))
);

create table if not exists public.operations_caisse (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('recu', 'depense')),
  montant bigint not null check (montant > 0),
  categorie_id uuid references public.categories_caisse (id) on delete set null,
  note text check (char_length(note) <= 300),
  date date not null default current_date
);

create table if not exists public.projets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  nom text not null check (char_length(trim(nom)) between 1 and 120),
  description text check (char_length(description) <= 500),
  date_debut date,
  date_fin date
);

create table if not exists public.taches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  projet_id uuid not null references public.projets (id) on delete cascade,
  titre text not null check (char_length(trim(titre)) between 1 and 200),
  responsable text check (char_length(responsable) <= 120),
  echeance date,
  statut text not null default 'a_faire' check (statut in ('a_faire', 'en_cours', 'termine'))
);

-- Modèles communs à tous les utilisateurs (lecture seule côté application).
create table if not exists public.modeles_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  code text not null unique,
  titre text not null,
  champs jsonb not null default '[]'::jsonb,
  contenu text not null default ''
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  modele_code text not null,
  titre text not null check (char_length(trim(titre)) between 1 and 200),
  donnees jsonb not null default '{}'::jsonb
);

create table if not exists public.liste_attente_ia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  email text not null check (char_length(email) <= 120)
);

create index if not exists operations_caisse_user_date_idx on public.operations_caisse (user_id, date desc);
create index if not exists categories_caisse_user_idx on public.categories_caisse (user_id);
create index if not exists projets_user_idx on public.projets (user_id);
create index if not exists taches_user_echeance_idx on public.taches (user_id, echeance);
create index if not exists taches_projet_idx on public.taches (projet_id);
create index if not exists documents_user_idx on public.documents (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2. Row Level Security : chaque utilisateur ne voit que ses lignes
-- ---------------------------------------------------------------------

alter table public.entreprises enable row level security;
alter table public.categories_caisse enable row level security;
alter table public.operations_caisse enable row level security;
alter table public.projets enable row level security;
alter table public.taches enable row level security;
alter table public.modeles_documents enable row level security;
alter table public.documents enable row level security;
alter table public.liste_attente_ia enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'entreprises', 'categories_caisse', 'operations_caisse',
    'projets', 'taches', 'documents', 'liste_attente_ia'
  ]
  loop
    execute format('drop policy if exists "pme_select_own" on public.%I', t);
    execute format('drop policy if exists "pme_insert_own" on public.%I', t);
    execute format('drop policy if exists "pme_update_own" on public.%I', t);
    execute format('drop policy if exists "pme_delete_own" on public.%I', t);

    execute format(
      'create policy "pme_select_own" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "pme_insert_own" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "pme_update_own" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "pme_delete_own" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- Une tâche ne peut être rattachée qu'à un projet de son propriétaire.
drop policy if exists "pme_insert_own" on public.taches;
drop policy if exists "pme_update_own" on public.taches;

create policy "pme_insert_own" on public.taches for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.projets p where p.id = projet_id and p.user_id = (select auth.uid()))
  );

create policy "pme_update_own" on public.taches for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.projets p where p.id = projet_id and p.user_id = (select auth.uid()))
  );

-- Une opération ne peut utiliser qu'une catégorie de son propriétaire.
drop policy if exists "pme_insert_own" on public.operations_caisse;
drop policy if exists "pme_update_own" on public.operations_caisse;

create policy "pme_insert_own" on public.operations_caisse for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (categorie_id is null or exists (
      select 1 from public.categories_caisse c where c.id = categorie_id and c.user_id = (select auth.uid())))
  );

create policy "pme_update_own" on public.operations_caisse for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (categorie_id is null or exists (
      select 1 from public.categories_caisse c where c.id = categorie_id and c.user_id = (select auth.uid())))
  );

-- Modèles de documents : lecture pour tout utilisateur connecté, aucune écriture.
drop policy if exists "pme_modeles_lecture" on public.modeles_documents;
create policy "pme_modeles_lecture" on public.modeles_documents
  for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- 3. Catégories de caisse par défaut, créées avec l'entreprise
-- ---------------------------------------------------------------------

create or replace function public.pme_creer_categories_par_defaut()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.categories_caisse where user_id = new.user_id) then
    insert into public.categories_caisse (user_id, nom, type) values
      (new.user_id, 'Ventes', 'recu'),
      (new.user_id, 'Salaires', 'depense'),
      (new.user_id, 'Loyer', 'depense'),
      (new.user_id, 'Transport', 'depense'),
      (new.user_id, 'Achats', 'depense'),
      (new.user_id, 'Électricité et eau', 'depense'),
      (new.user_id, 'Communication', 'depense'),
      (new.user_id, 'Autres', 'tous');
  end if;
  return new;
end;
$$;

revoke execute on function public.pme_creer_categories_par_defaut() from public, anon, authenticated;

drop trigger if exists pme_entreprise_creee on public.entreprises;
create trigger pme_entreprise_creee
  after insert on public.entreprises
  for each row execute function public.pme_creer_categories_par_defaut();

-- ---------------------------------------------------------------------
-- 4. Stockage des logos : un dossier par utilisateur, 1 Mo maximum
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos-entreprises', 'logos-entreprises', true, 1048576,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "pme_logos_insert" on storage.objects;
drop policy if exists "pme_logos_update" on storage.objects;
drop policy if exists "pme_logos_delete" on storage.objects;

create policy "pme_logos_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'logos-entreprises' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "pme_logos_update" on storage.objects for update to authenticated
  using (bucket_id = 'logos-entreprises' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "pme_logos_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'logos-entreprises' and (storage.foldername(name))[1] = (select auth.uid())::text);

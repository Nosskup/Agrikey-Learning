-- =====================================================================
-- AGRIKEY PME — Opportunités : offres d'emploi, appels d'offres, actualités
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.
-- Ré-exécutable sans risque. Suppose le script 20261017 exécuté (pme_est_admin).
--
-- Les annonces des sources automatiques (flux en ligne) ne sont pas stockées.
-- La base garde seulement :
--   - les domaines suivis par chaque membre ;
--   - les annonces qu'il a enregistrées (favoris) ;
--   - les annonces ajoutées à la main par un administrateur (journaux,
--     DGMP, réseaux…), visibles par tous les membres connectés.
-- =====================================================================

-- Domaines suivis (codes de lib/opportunites/domaines.ts).
create table if not exists public.opportunites_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  domaines text[] not null default '{}',
  mots_cles text check (char_length(mots_cles) <= 200)
);

-- Annonces enregistrées par un membre (copie de l'annonce au moment de l'enregistrement).
create table if not exists public.opportunites_favoris (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('emploi', 'appel_offres', 'actualite')),
  titre text not null check (char_length(titre) <= 300),
  -- Lien externe, ou page d'une annonce ajoutée par un administrateur.
  lien text not null check (char_length(lien) <= 1000 and lien ~ '^(https?://|/pme/opportunites/annonce/)'),
  source text check (char_length(source) <= 120),
  date_publication timestamptz,
  date_limite date,
  unique (user_id, lien)
);

-- Annonces ajoutées par un administrateur.
create table if not exists public.opportunites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('emploi', 'appel_offres', 'actualite')),
  titre text not null check (char_length(titre) between 1 and 300),
  organisme text check (char_length(organisme) <= 150),
  description text check (char_length(description) <= 2000),
  lien text check (lien is null or (char_length(lien) <= 1000 and lien ~ '^https?://')),
  lieu text check (char_length(lieu) <= 100),
  domaine text check (char_length(domaine) <= 40),
  date_limite date
);

create index if not exists opportunites_favoris_user_idx on public.opportunites_favoris (user_id, created_at desc);
create index if not exists opportunites_created_idx on public.opportunites (created_at desc);

alter table public.opportunites_preferences enable row level security;
alter table public.opportunites_favoris enable row level security;
alter table public.opportunites enable row level security;

-- Préférences et favoris : chacun ne voit et ne modifie que les siens.
do $$
declare
  t text;
begin
  foreach t in array array['opportunites_preferences', 'opportunites_favoris']
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
end;
$$;

-- Annonces manuelles : lecture pour tout membre connecté, écriture réservée aux administrateurs.
drop policy if exists "opportunites_select" on public.opportunites;
drop policy if exists "opportunites_insert_admin" on public.opportunites;
drop policy if exists "opportunites_update_admin" on public.opportunites;
drop policy if exists "opportunites_delete_admin" on public.opportunites;

create policy "opportunites_select" on public.opportunites
  for select to authenticated using (true);
create policy "opportunites_insert_admin" on public.opportunites
  for insert to authenticated with check (public.pme_est_admin() and (select auth.uid()) = user_id);
create policy "opportunites_update_admin" on public.opportunites
  for update to authenticated using (public.pme_est_admin()) with check (public.pme_est_admin());
create policy "opportunites_delete_admin" on public.opportunites
  for delete to authenticated using (public.pme_est_admin());

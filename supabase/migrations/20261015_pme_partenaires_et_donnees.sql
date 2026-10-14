-- =====================================================================
-- AGRIKEY PME — partenaires, consentement et gestion des données
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.
-- Ré-exécutable sans risque. Suppose que 20261014_agrikey_pme.sql a été exécuté.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Code partenaire (ex. LIGUE) et date d'acceptation des conditions
-- ---------------------------------------------------------------------

alter table public.entreprises
  add column if not exists code_partenaire text,
  add column if not exists conditions_acceptees_le timestamptz;

alter table public.entreprises
  drop constraint if exists entreprises_code_partenaire_format;
alter table public.entreprises
  add constraint entreprises_code_partenaire_format
  check (code_partenaire is null or code_partenaire ~ '^[A-Z0-9-]{2,20}$');

create index if not exists entreprises_code_partenaire_idx
  on public.entreprises (code_partenaire);

-- ---------------------------------------------------------------------
-- 2. Statistiques par partenaire, réservées aux administrateurs
--    (rôle « admin » dans la table profiles d'AGRIKEY Learning).
--    Ne renvoie que des nombres, jamais les données des entreprises.
-- ---------------------------------------------------------------------

create or replace function public.pme_statistiques_partenaires()
returns table (
  code_partenaire text,
  entreprises bigint,
  actives_30_jours bigint,
  documents bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'Accès réservé aux administrateurs.';
  end if;

  return query
  select
    coalesce(e.code_partenaire, 'AUCUN') as code_partenaire,
    count(*)::bigint as entreprises,
    count(*) filter (where exists (
      select 1 from public.operations_caisse o
      where o.user_id = e.user_id and o.created_at > now() - interval '30 days'
    ))::bigint as actives_30_jours,
    coalesce(sum((select count(*) from public.documents d where d.user_id = e.user_id)), 0)::bigint as documents
  from public.entreprises e
  group by coalesce(e.code_partenaire, 'AUCUN')
  order by entreprises desc;
end;
$$;

revoke execute on function public.pme_statistiques_partenaires() from public, anon;
grant execute on function public.pme_statistiques_partenaires() to authenticated;

-- ---------------------------------------------------------------------
-- 3. Logos : chaque utilisateur peut lister ses propres fichiers
--    (nécessaire pour les supprimer avec ses données).
-- ---------------------------------------------------------------------

drop policy if exists "pme_logos_select" on storage.objects;
create policy "pme_logos_select" on storage.objects for select to authenticated
  using (bucket_id = 'logos-entreprises' and (storage.foldername(name))[1] = (select auth.uid())::text);

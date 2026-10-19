-- =====================================================================
-- AGRIKEY PME — affiches et logos IA, avec un nombre de créations par mois
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.
-- Ré-exécutable sans risque. Suppose les scripts 20261017 et 20261018 exécutés (indépendant de 20261019 et 20261020).
--
-- Limite par mois : celle du membre si elle est définie, sinon celle de son
-- code, sinon 10. 0 = module fermé pour ce membre ou ce code.
-- =====================================================================

alter table public.codes_invitation add column if not exists quota_ia integer;
alter table public.entreprises add column if not exists quota_ia integer;

alter table public.codes_invitation drop constraint if exists codes_invitation_quota_ia_positif;
alter table public.codes_invitation add constraint codes_invitation_quota_ia_positif
  check (quota_ia is null or quota_ia between 0 and 1000);
alter table public.entreprises drop constraint if exists entreprises_quota_ia_positif;
alter table public.entreprises add constraint entreprises_quota_ia_positif
  check (quota_ia is null or quota_ia between 0 and 1000);

-- ---------------------------------------------------------------------
-- 1. Les créations (une ligne par affiche ou logo)
-- ---------------------------------------------------------------------

create table if not exists public.creations_ia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('affiche', 'logo')),
  format text not null,
  titre text,
  demande jsonb not null default '{}'::jsonb,
  svg text,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'pret')),
  created_at timestamptz not null default now()
);

create index if not exists creations_ia_user_idx on public.creations_ia (user_id, created_at desc);

alter table public.creations_ia enable row level security;

drop policy if exists "creations_ia_select" on public.creations_ia;
create policy "creations_ia_select" on public.creations_ia for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "creations_ia_insert" on public.creations_ia;
create policy "creations_ia_insert" on public.creations_ia for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "creations_ia_delete" on public.creations_ia;
create policy "creations_ia_delete" on public.creations_ia for delete to authenticated
  using (user_id = (select auth.uid()));

-- Pas de modification directe : le résultat est enregistré par pme_terminer_creation_ia.

-- ---------------------------------------------------------------------
-- 2. Le compteur du mois (une ligne par création lancée).
--    Il est séparé des créations : supprimer une affiche ne rend pas le crédit.
-- ---------------------------------------------------------------------

create table if not exists public.utilisations_ia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  creation_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists utilisations_ia_user_idx on public.utilisations_ia (user_id, created_at);

alter table public.utilisations_ia enable row level security;
-- Aucune policy : seules les fonctions ci-dessous y écrivent et la lisent.

-- Limite et nombre de créations du mois pour l'utilisateur connecté.
create or replace function public.pme_mon_quota_ia()
returns table (limite integer, utilisees integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(e.quota_ia, c.quota_ia, 10),
    (select count(*)::integer from public.utilisations_ia u
      where u.user_id = auth.uid() and u.created_at >= date_trunc('month', now()))
  from public.entreprises e
  left join public.codes_invitation c on c.code = e.code_partenaire
  where e.user_id = auth.uid();
$$;
revoke execute on function public.pme_mon_quota_ia() from public, anon;
grant execute on function public.pme_mon_quota_ia() to authenticated;

-- À chaque nouvelle création : vérifie la limite du mois et la compte.
create or replace function public.pme_compter_creation_ia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  q record;
begin
  new.statut := 'en_cours';
  new.svg := null;

  -- Un seul calcul à la fois par membre, pour qu'on ne dépasse pas la limite
  -- en lançant plusieurs créations en même temps.
  perform pg_advisory_xact_lock(hashtext('pme_ia_' || new.user_id::text));

  if not exists (select 1 from public.entreprises e where e.user_id = new.user_id and e.statut = 'valide') then
    raise exception 'Inscription pas encore validée.' using errcode = 'P0001';
  end if;

  select * into q from public.pme_mon_quota_ia();
  if q.limite is null or q.utilisees >= q.limite then
    raise exception 'Limite de créations atteinte.' using errcode = 'P0002';
  end if;

  insert into public.utilisations_ia (user_id, creation_id) values (new.user_id, new.id);
  return new;
end;
$$;
revoke execute on function public.pme_compter_creation_ia() from public, anon, authenticated;

drop trigger if exists pme_creation_ia_compteur on public.creations_ia;
create trigger pme_creation_ia_compteur
  before insert on public.creations_ia
  for each row execute function public.pme_compter_creation_ia();

-- Enregistre le résultat d'une création en cours.
create or replace function public.pme_terminer_creation_ia(p_creation uuid, p_titre text, p_svg text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_svg is null or length(p_svg) > 4000000 then
    raise exception 'Image invalide.';
  end if;
  update public.creations_ia
    set svg = p_svg, titre = left(p_titre, 120), statut = 'pret'
    where id = p_creation and user_id = auth.uid() and statut = 'en_cours';
end;
$$;
revoke execute on function public.pme_terminer_creation_ia(uuid, text, text) from public, anon;
grant execute on function public.pme_terminer_creation_ia(uuid, text, text) to authenticated;

-- Création qui a échoué : on la retire et on rend le crédit.
create or replace function public.pme_annuler_creation_ia(p_creation uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.utilisations_ia u
    using public.creations_ia c
    where c.id = p_creation and c.user_id = auth.uid() and c.statut = 'en_cours'
      and u.creation_id = c.id;
  delete from public.creations_ia
    where id = p_creation and user_id = auth.uid() and statut = 'en_cours';
end;
$$;
revoke execute on function public.pme_annuler_creation_ia(uuid) from public, anon;
grant execute on function public.pme_annuler_creation_ia(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3. Seul un administrateur change la limite d'un membre.
-- ---------------------------------------------------------------------

create or replace function public.pme_proteger_entreprise()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.pme_est_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.code_partenaire is null or not public.pme_code_valide(new.code_partenaire) then
      raise exception 'Code d''invitation invalide.' using errcode = 'P0001';
    end if;
    new.statut := 'en_attente';
    new.modeles_autorises := null;
    new.quota_ia := null;
  else
    new.statut := old.statut;
    new.code_partenaire := old.code_partenaire;
    new.modeles_autorises := old.modeles_autorises;
    new.quota_ia := old.quota_ia;
  end if;

  return new;
end;
$$;

-- Définir la limite d'un membre (administrateurs ; NULL = suivre son code).
create or replace function public.pme_definir_quota_entreprise(p_entreprise uuid, p_quota integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.pme_est_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;
  update public.entreprises set quota_ia = p_quota where id = p_entreprise;
end;
$$;
revoke execute on function public.pme_definir_quota_entreprise(uuid, integer) from public, anon;
grant execute on function public.pme_definir_quota_entreprise(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Liste des entreprises : ajoute la limite et les créations du mois.
-- ---------------------------------------------------------------------

drop function if exists public.pme_liste_entreprises();
create function public.pme_liste_entreprises()
returns table (
  entreprise_id uuid,
  nom text,
  email text,
  ville text,
  activite text,
  code_partenaire text,
  statut text,
  inscrite_le timestamptz,
  active_30_jours boolean,
  documents bigint,
  modeles_autorises text[],
  quota_ia integer,
  creations_ia_mois bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.pme_est_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;

  return query
  select
    e.id,
    e.nom,
    u.email::text,
    e.ville,
    e.activite,
    e.code_partenaire,
    e.statut,
    e.created_at,
    exists (
      select 1 from public.operations_caisse o
      where o.user_id = e.user_id and o.created_at > now() - interval '30 days'
    ),
    (select count(*) from public.documents d where d.user_id = e.user_id)::bigint,
    e.modeles_autorises,
    e.quota_ia,
    (select count(*) from public.utilisations_ia ui
      where ui.user_id = e.user_id and ui.created_at >= date_trunc('month', now()))::bigint
  from public.entreprises e
  left join auth.users u on u.id = e.user_id
  order by (e.statut = 'en_attente') desc, e.created_at desc;
end;
$$;
revoke execute on function public.pme_liste_entreprises() from public, anon;
grant execute on function public.pme_liste_entreprises() to authenticated;

notify pgrst, 'reload schema';

-- =====================================================================
-- AGRIKEY PME — archives : comptes désactivés et codes d'invitation
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.
-- Ré-exécutable sans risque. Suppose les scripts 20261017, 20261018 et
-- 20261021 exécutés.
--
-- Archiver = ranger : l'entreprise ou le code disparaît des listes de
-- l'administration mais reste consultable dans « Archives » et peut être
-- restauré. Supprimer définitivement n'est possible que depuis les archives.
-- =====================================================================

alter table public.entreprises add column if not exists archivee_le timestamptz;
alter table public.codes_invitation add column if not exists archive_le timestamptz;

-- ---------------------------------------------------------------------
-- 1. Seul un administrateur archive une entreprise.
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
    new.archivee_le := null;
  else
    new.statut := old.statut;
    new.code_partenaire := old.code_partenaire;
    new.modeles_autorises := old.modeles_autorises;
    new.quota_ia := old.quota_ia;
    new.archivee_le := old.archivee_le;
  end if;

  return new;
end;
$$;

-- Archiver (p_archiver = true) ou restaurer une entreprise. Un compte validé
-- doit d'abord être suspendu : on n'archive que des comptes désactivés.
create or replace function public.pme_archiver_entreprise(p_entreprise uuid, p_archiver boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.pme_est_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;
  if p_archiver then
    update public.entreprises set archivee_le = now()
      where id = p_entreprise and statut <> 'valide';
  else
    update public.entreprises set archivee_le = null where id = p_entreprise;
  end if;
end;
$$;
revoke execute on function public.pme_archiver_entreprise(uuid, boolean) from public, anon;
grant execute on function public.pme_archiver_entreprise(uuid, boolean) to authenticated;

-- Supprimer définitivement les données AGRIKEY PME d'une entreprise archivée.
-- Le compte de connexion (partagé avec AGRIKEY Learning) et la trace des
-- paiements (comptabilité) sont conservés.
create or replace function public.pme_supprimer_entreprise(p_entreprise uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if not public.pme_est_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;

  select user_id into v_user from public.entreprises
    where id = p_entreprise and archivee_le is not null;
  if v_user is null then
    raise exception 'Archivez d''abord cette entreprise.';
  end if;

  delete from public.documents where user_id = v_user;
  delete from public.taches where user_id = v_user;
  delete from public.projets where user_id = v_user;
  delete from public.operations_caisse where user_id = v_user;
  delete from public.categories_caisse where user_id = v_user;
  delete from public.liste_attente_ia where user_id = v_user;
  if to_regclass('public.creations_ia') is not null then
    execute 'delete from public.creations_ia where user_id = $1' using v_user;
  end if;
  if to_regclass('public.opportunites_favoris') is not null then
    execute 'delete from public.opportunites_favoris where user_id = $1' using v_user;
  end if;
  if to_regclass('public.opportunites_preferences') is not null then
    execute 'delete from public.opportunites_preferences where user_id = $1' using v_user;
  end if;
  delete from public.entreprises where id = p_entreprise;
end;
$$;
revoke execute on function public.pme_supprimer_entreprise(uuid) from public, anon;
grant execute on function public.pme_supprimer_entreprise(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 2. Codes d'invitation : un code archivé est toujours désactivé.
--    Suppression définitive seulement si aucune entreprise ne l'a utilisé.
-- ---------------------------------------------------------------------

create or replace function public.pme_supprimer_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.pme_est_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;
  if exists (select 1 from public.entreprises where code_partenaire = p_code) then
    raise exception 'Ce code a été utilisé par des entreprises : gardez-le dans les archives.' using errcode = 'P0001';
  end if;
  delete from public.codes_invitation where code = p_code and archive_le is not null;
end;
$$;
revoke execute on function public.pme_supprimer_code(text) from public, anon;
grant execute on function public.pme_supprimer_code(text) to authenticated;

-- ---------------------------------------------------------------------
-- 3. Liste des entreprises : ajoute la date d'archivage.
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
  creations_ia_mois bigint,
  archivee_le timestamptz
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
      where ui.user_id = e.user_id and ui.created_at >= date_trunc('month', now()))::bigint,
    e.archivee_le
  from public.entreprises e
  left join auth.users u on u.id = e.user_id
  order by (e.statut = 'en_attente') desc, e.created_at desc;
end;
$$;
revoke execute on function public.pme_liste_entreprises() from public, anon;
grant execute on function public.pme_liste_entreprises() to authenticated;

notify pgrst, 'reload schema';

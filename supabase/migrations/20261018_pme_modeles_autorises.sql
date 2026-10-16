-- =====================================================================
-- AGRIKEY PME — modèles de documents autorisés, par code et par membre
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.
-- Ré-exécutable sans risque. Suppose le script 20261017 exécuté.
--
-- Règle : liste du membre si elle est définie, sinon liste de son code,
-- sinon tous les modèles. NULL ou '*' dans la liste = tous les modèles.
-- =====================================================================

alter table public.codes_invitation add column if not exists modeles_autorises text[];
alter table public.entreprises add column if not exists modeles_autorises text[];

-- La protection des entreprises couvre aussi les modèles autorisés :
-- seul un administrateur peut les changer.
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
  else
    new.statut := old.statut;
    new.code_partenaire := old.code_partenaire;
    new.modeles_autorises := old.modeles_autorises;
  end if;

  return new;
end;
$$;

-- Modèles autorisés pour l'utilisateur connecté (NULL = tous).
create or replace function public.pme_mes_modeles()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(e.modeles_autorises, c.modeles_autorises)
  from public.entreprises e
  left join public.codes_invitation c on c.code = e.code_partenaire
  where e.user_id = auth.uid();
$$;
revoke execute on function public.pme_mes_modeles() from public, anon;
grant execute on function public.pme_mes_modeles() to authenticated;

create or replace function public.pme_modele_autorise(p_modele text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select m is null or '*' = any(m) or p_modele = any(m)
  from (select public.pme_mes_modeles() as m) x;
$$;
revoke execute on function public.pme_modele_autorise(text) from public, anon;
grant execute on function public.pme_modele_autorise(text) to authenticated;

-- Vérification dans la base à la création d'un document.
create or replace function public.pme_verifier_modele_document()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.pme_modele_autorise(new.modele_code) then
    raise exception 'Modèle de document non autorisé.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.pme_verifier_modele_document() from public, anon, authenticated;

drop trigger if exists pme_document_modele on public.documents;
create trigger pme_document_modele
  before insert or update of modele_code on public.documents
  for each row execute function public.pme_verifier_modele_document();

-- Définir les modèles d'un membre (administrateurs ; NULL = suivre son code).
create or replace function public.pme_definir_modeles_entreprise(p_entreprise uuid, p_modeles text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.pme_est_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;
  update public.entreprises set modeles_autorises = p_modeles where id = p_entreprise;
end;
$$;
revoke execute on function public.pme_definir_modeles_entreprise(uuid, text[]) from public, anon;
grant execute on function public.pme_definir_modeles_entreprise(uuid, text[]) to authenticated;

-- Liste des entreprises : ajoute les modèles propres au membre.
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
  modeles_autorises text[]
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
    e.modeles_autorises
  from public.entreprises e
  left join auth.users u on u.id = e.user_id
  order by (e.statut = 'en_attente') desc, e.created_at desc;
end;
$$;
revoke execute on function public.pme_liste_entreprises() from public, anon;
grant execute on function public.pme_liste_entreprises() to authenticated;

notify pgrst, 'reload schema';

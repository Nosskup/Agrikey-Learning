-- =====================================================================
-- AGRIKEY PME — période gratuite, puis abonnement (sinon accès bloqué)
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.
-- Ré-exécutable sans risque. Suppose les scripts 20261017, 20261020,
-- 20261022 et 20261024 exécutés.
--
-- Règle :
--   - après validation de l'inscription, période gratuite : mois offerts par
--     le code d'invitation (LIJEMA : 3), 1 mois par défaut ; un administrateur
--     peut fixer une autre date de fin pour un membre ;
--   - ensuite, accès complet tant que l'abonnement payé est en cours ;
--   - sinon, ACCÈS BLOQUÉ : l'application n'affiche plus que la page d'abonnement
--     et « Mon compte » (télécharger ou supprimer ses données). Ses données sont
--     conservées et réapparaissent dès le paiement.
-- =====================================================================

alter table public.codes_invitation add column if not exists mois_offerts integer;
alter table public.codes_invitation drop constraint if exists codes_invitation_mois_offerts_valide;
alter table public.codes_invitation add constraint codes_invitation_mois_offerts_valide
  check (mois_offerts is null or mois_offerts between 0 and 60);

alter table public.entreprises add column if not exists valide_le timestamptz;
alter table public.entreprises add column if not exists fin_essai timestamptz;

-- Les membres déjà validés commencent leur période gratuite aujourd'hui.
update public.entreprises set valide_le = now() where statut = 'valide' and valide_le is null;

-- Offre LIJEMA : 3 mois (si rien n'a encore été réglé pour ce code).
update public.codes_invitation set mois_offerts = 3 where code = 'LIJEMA' and mois_offerts is null;

-- ---------------------------------------------------------------------
-- 1. Validation : on retient la date de la première validation.
-- ---------------------------------------------------------------------

create or replace function public.pme_changer_statut(p_entreprise uuid, p_statut text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.pme_est_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;
  if p_statut not in ('en_attente', 'valide', 'refuse') then
    raise exception 'Statut invalide.';
  end if;
  update public.entreprises
    set statut = p_statut,
        valide_le = case when p_statut = 'valide' then coalesce(valide_le, now()) else valide_le end
    where id = p_entreprise;
end;
$$;

-- Seul un administrateur change la date de validation ou de fin d'essai.
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
    new.valide_le := null;
    new.fin_essai := null;
  else
    new.statut := old.statut;
    new.code_partenaire := old.code_partenaire;
    new.modeles_autorises := old.modeles_autorises;
    new.quota_ia := old.quota_ia;
    new.archivee_le := old.archivee_le;
    new.valide_le := old.valide_le;
    new.fin_essai := old.fin_essai;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Calcul de l'accès d'un membre.
-- ---------------------------------------------------------------------

-- Fin de la période gratuite d'un membre (null si pas encore validé).
create or replace function public.pme_fin_essai(p_user uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    e.fin_essai,
    e.valide_le + make_interval(months => coalesce(c.mois_offerts, 1))
  )
  from public.entreprises e
  left join public.codes_invitation c on c.code = e.code_partenaire
  where e.user_id = p_user;
$$;
revoke execute on function public.pme_fin_essai(uuid) from public, anon, authenticated;

-- Vrai si le membre peut ajouter et modifier (essai ou abonnement en cours).
create or replace function public.pme_acces_actif(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.profiles p where p.user_id = p_user and p.role = 'admin')
    or coalesce(public.pme_fin_essai(p_user) > now(), false)
    or exists (select 1 from public.pme_abonnements a where a.user_id = p_user and a.actif_jusqua > now());
$$;
revoke execute on function public.pme_acces_actif(uuid) from public, anon, authenticated;

-- Pour l'application : l'accès du membre connecté.
create or replace function public.pme_mon_acces()
returns table (actif boolean, fin_essai timestamptz, abonnement_jusqua timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select
    public.pme_acces_actif(auth.uid()),
    public.pme_fin_essai(auth.uid()),
    (select a.actif_jusqua from public.pme_abonnements a where a.user_id = auth.uid());
$$;
revoke execute on function public.pme_mon_acces() from public, anon;
grant execute on function public.pme_mon_acces() to authenticated;

-- ---------------------------------------------------------------------
-- 3. Filet de sécurité dans la base : sans accès actif, pas d'ajout ni de
--    modification (l'application bloque déjà les pages). Les suppressions restent
--    possibles : les données appartiennent au membre. Les opérations du serveur
--    (clé service_role, sans utilisateur) ne sont pas concernées.
-- ---------------------------------------------------------------------

create or replace function public.pme_exiger_acces()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.pme_acces_actif(auth.uid()) then
    raise exception 'Accès terminé : abonnement nécessaire.' using errcode = 'P0003';
  end if;
  return new;
end;
$$;
revoke execute on function public.pme_exiger_acces() from public, anon, authenticated;

do $$
declare
  t text;
begin
  -- Les catégories de caisse ne sont pas concernées : la base les crée toute seule à
  -- l'inscription, avant la validation (donc avant le début de la période gratuite).
  drop trigger if exists pme_lecture_seule on public.categories_caisse;
  foreach t in array array['operations_caisse', 'projets', 'taches', 'documents', 'creations_ia'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists pme_lecture_seule on public.%I', t);
      execute format(
        'create trigger pme_lecture_seule before insert or update on public.%I for each row execute function public.pme_exiger_acces()',
        t
      );
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Abonnement : un paiement pendant la période gratuite s'ajoute après
--    la fin de celle-ci (le membre ne perd aucun jour offert).
-- ---------------------------------------------------------------------

create or replace function public.pme_activer_abonnement(p_paiement uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.pme_paiements%rowtype;
  duree interval;
  debut timestamptz;
begin
  select * into p from public.pme_paiements where id = p_paiement for update;
  if not found then
    raise exception 'Paiement introuvable.' using errcode = 'P0001';
  end if;
  if p.statut = 'paye' then
    return;
  end if;

  duree := case p.formule
    when 'premium_mois' then interval '1 month'
    when 'premium_an' then interval '1 year'
    when 'essai_admin' then interval '1 day'
  end;
  if duree is null then
    raise exception 'Formule inconnue.' using errcode = 'P0001';
  end if;

  update public.pme_paiements set statut = 'paye', paye_le = now() where id = p.id;

  debut := greatest(
    now(),
    coalesce(public.pme_fin_essai(p.user_id), now()),
    coalesce((select a.actif_jusqua from public.pme_abonnements a where a.user_id = p.user_id), now())
  );

  insert into public.pme_abonnements (user_id, formule, actif_jusqua, mode)
  values (p.user_id, p.formule, debut + duree, p.mode)
  on conflict (user_id) do update
    set formule = excluded.formule,
        actif_jusqua = excluded.actif_jusqua,
        mode = excluded.mode,
        updated_at = now();
end;
$$;
revoke execute on function public.pme_activer_abonnement(uuid) from public, anon, authenticated;
grant execute on function public.pme_activer_abonnement(uuid) to service_role;

-- ---------------------------------------------------------------------
-- 5. Administration : fin d'essai d'un membre, et accès dans la liste.
-- ---------------------------------------------------------------------

create or replace function public.pme_definir_fin_essai(p_entreprise uuid, p_fin timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.pme_est_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;
  update public.entreprises set fin_essai = p_fin where id = p_entreprise;
end;
$$;
revoke execute on function public.pme_definir_fin_essai(uuid, timestamptz) from public, anon;
grant execute on function public.pme_definir_fin_essai(uuid, timestamptz) to authenticated;

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
  archivee_le timestamptz,
  fin_essai timestamptz,
  fin_essai_personnalisee boolean,
  abonnement_jusqua timestamptz
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
    e.archivee_le,
    public.pme_fin_essai(e.user_id),
    e.fin_essai is not null,
    (select a.actif_jusqua from public.pme_abonnements a where a.user_id = e.user_id)
  from public.entreprises e
  left join auth.users u on u.id = e.user_id
  order by (e.statut = 'en_attente') desc, e.created_at desc;
end;
$$;
revoke execute on function public.pme_liste_entreprises() from public, anon;
grant execute on function public.pme_liste_entreprises() to authenticated;

notify pgrst, 'reload schema';

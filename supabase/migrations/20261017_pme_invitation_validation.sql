-- =====================================================================
-- AGRIKEY PME — inscription sur invitation et validation par l'administrateur
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.
-- Ré-exécutable sans risque. Suppose les scripts 20261014 et 20261015 exécutés.
-- Remplace aussi la fonction de liste du script 20261016.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Statut de chaque entreprise : en attente, validée ou refusée.
--    Les entreprises déjà inscrites sont validées.
-- ---------------------------------------------------------------------
alter table public.entreprises add column if not exists statut text;
update public.entreprises set statut = 'valide' where statut is null;
alter table public.entreprises alter column statut set default 'en_attente';
alter table public.entreprises alter column statut set not null;
alter table public.entreprises drop constraint if exists entreprises_statut_valeurs;
alter table public.entreprises add constraint entreprises_statut_valeurs
  check (statut in ('en_attente', 'valide', 'refuse'));

-- ---------------------------------------------------------------------
-- 2. Est-ce que l'utilisateur connecté est administrateur ?
-- ---------------------------------------------------------------------
create or replace function public.pme_est_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;
revoke execute on function public.pme_est_admin() from public, anon;
grant execute on function public.pme_est_admin() to authenticated;

-- ---------------------------------------------------------------------
-- 3. Codes d'invitation, gérés par les administrateurs
-- ---------------------------------------------------------------------
create table if not exists public.codes_invitation (
  code text primary key check (code ~ '^[A-Z0-9-]{2,20}$'),
  libelle text not null default '' check (char_length(libelle) <= 120),
  actif boolean not null default true,
  max_inscriptions integer check (max_inscriptions is null or max_inscriptions > 0),
  created_at timestamptz not null default now()
);
alter table public.codes_invitation enable row level security;

drop policy if exists "pme_codes_admin" on public.codes_invitation;
create policy "pme_codes_admin" on public.codes_invitation for all to authenticated
  using (public.pme_est_admin()) with check (public.pme_est_admin());

insert into public.codes_invitation (code, libelle)
values ('LIGUE', 'Ligue des jeunes entrepreneurs du Mali')
on conflict (code) do nothing;

-- Un code est valide s'il existe, est actif et n'a pas atteint son maximum.
create or replace function public.pme_code_valide(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.codes_invitation c
    where c.code = upper(trim(p_code))
      and c.actif
      and (
        c.max_inscriptions is null
        or (select count(*) from public.entreprises e where e.code_partenaire = c.code) < c.max_inscriptions
      )
  );
$$;
revoke execute on function public.pme_code_valide(text) from public;
grant execute on function public.pme_code_valide(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Protection dans la base : à l'inscription, un code valide est exigé
--    et le statut est forcé à « en attente » ; ensuite, seul un
--    administrateur peut changer le statut ou le code.
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
  else
    new.statut := old.statut;
    new.code_partenaire := old.code_partenaire;
  end if;

  return new;
end;
$$;
revoke execute on function public.pme_proteger_entreprise() from public, anon, authenticated;

drop trigger if exists pme_entreprise_protection on public.entreprises;
create trigger pme_entreprise_protection
  before insert or update on public.entreprises
  for each row execute function public.pme_proteger_entreprise();

-- ---------------------------------------------------------------------
-- 5. Valider ou refuser une entreprise (administrateurs)
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
  update public.entreprises set statut = p_statut where id = p_entreprise;
end;
$$;
revoke execute on function public.pme_changer_statut(uuid, text) from public, anon;
grant execute on function public.pme_changer_statut(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 6. Liste des entreprises pour les administrateurs : identité, e-mail du
--    compte, code, statut, date et usage. Jamais la caisse, les projets
--    ni le contenu des documents.
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
  documents bigint
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
    (select count(*) from public.documents d where d.user_id = e.user_id)::bigint
  from public.entreprises e
  left join auth.users u on u.id = e.user_id
  order by (e.statut = 'en_attente') desc, e.created_at desc;
end;
$$;
revoke execute on function public.pme_liste_entreprises() from public, anon;
grant execute on function public.pme_liste_entreprises() to authenticated;

-- Prise en compte immédiate des nouvelles fonctions par l'API.
notify pgrst, 'reload schema';

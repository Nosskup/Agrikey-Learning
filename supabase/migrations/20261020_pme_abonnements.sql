-- =====================================================================
-- AGRIKEY PME — abonnement Premium payé par PayDunya (Orange Money, Moov…)
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.
-- Ré-exécutable sans risque. Indépendant des paiements des formations
-- (tables payments / enrollments), qui ne sont pas modifiés.
--
-- Sécurité : un membre peut seulement LIRE ses paiements et son abonnement.
-- Toutes les écritures sont faites par le serveur (clé service_role),
-- après vérification du paiement directement auprès de PayDunya.
-- =====================================================================

create table if not exists public.pme_paiements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  formule text not null check (formule in ('premium_mois', 'premium_an')),
  montant integer not null check (montant > 0),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'paye', 'annule', 'echoue')),
  -- Jeton de la facture PayDunya.
  token text unique,
  -- 'test' (bac à sable PayDunya, aucun argent réel) ou 'live'.
  mode text not null check (mode in ('test', 'live')),
  paye_le timestamptz
);

create index if not exists pme_paiements_user_idx on public.pme_paiements (user_id, created_at desc);

create table if not exists public.pme_abonnements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  formule text not null,
  actif_jusqua timestamptz not null,
  mode text not null check (mode in ('test', 'live')),
  updated_at timestamptz not null default now()
);

alter table public.pme_paiements enable row level security;
alter table public.pme_abonnements enable row level security;

drop policy if exists "pme_select_own" on public.pme_paiements;
create policy "pme_select_own" on public.pme_paiements
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "pme_select_own" on public.pme_abonnements;
create policy "pme_select_own" on public.pme_abonnements
  for select to authenticated using ((select auth.uid()) = user_id);

-- Les administrateurs voient tous les paiements (suivi des ventes).
drop policy if exists "pme_select_admin" on public.pme_paiements;
create policy "pme_select_admin" on public.pme_paiements
  for select to authenticated using (public.pme_est_admin());

-- ---------------------------------------------------------------------
-- Activation : marque le paiement comme payé et prolonge l'abonnement.
-- Sans effet si le paiement est déjà payé (le webhook et la page de retour
-- peuvent l'appeler tous les deux). Réservée au serveur.
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
  end;

  update public.pme_paiements set statut = 'paye', paye_le = now() where id = p.id;

  insert into public.pme_abonnements (user_id, formule, actif_jusqua, mode)
  values (p.user_id, p.formule, now() + duree, p.mode)
  on conflict (user_id) do update
    set formule = excluded.formule,
        -- Un renouvellement avant la fin s'ajoute au temps restant.
        actif_jusqua = greatest(public.pme_abonnements.actif_jusqua, now()) + duree,
        mode = excluded.mode,
        updated_at = now();
end;
$$;
revoke execute on function public.pme_activer_abonnement(uuid) from public, anon, authenticated;
grant execute on function public.pme_activer_abonnement(uuid) to service_role;

-- Vrai si l'utilisateur connecté a un abonnement Premium en cours.
create or replace function public.pme_est_premium()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pme_abonnements
    where user_id = auth.uid() and actif_jusqua > now()
  );
$$;
revoke execute on function public.pme_est_premium() from public, anon;
grant execute on function public.pme_est_premium() to authenticated;

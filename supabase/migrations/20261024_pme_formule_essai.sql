-- =====================================================================
-- AGRIKEY PME — formule « Essai de paiement » à 100 FCFA (administrateurs)
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.
-- Ré-exécutable sans risque. Suppose le script 20261020 exécuté.
--
-- Sert à tester un vrai paiement (LigdiCash n'a pas de bac à sable) sans
-- payer une formule complète. Donne un jour de Premium.
-- =====================================================================

alter table public.pme_paiements drop constraint if exists pme_paiements_formule_check;
alter table public.pme_paiements add constraint pme_paiements_formule_check
  check (formule in ('premium_mois', 'premium_an', 'essai_admin'));

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
    when 'essai_admin' then interval '1 day'
  end;
  if duree is null then
    raise exception 'Formule inconnue.' using errcode = 'P0001';
  end if;

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

notify pgrst, 'reload schema';

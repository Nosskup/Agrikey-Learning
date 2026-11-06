-- =====================================================================
-- AGRIKEY PME — paiement de l'abonnement par LigdiCash
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.
-- Ré-exécutable sans risque. Suppose le script 20261020 exécuté.
--
-- Ajoute le service de paiement utilisé pour chaque paiement
-- (PayDunya pour les paiements déjà enregistrés, LigdiCash ensuite).
-- =====================================================================

alter table public.pme_paiements
  add column if not exists fournisseur text not null default 'paydunya';

alter table public.pme_paiements drop constraint if exists pme_paiements_fournisseur_valide;
alter table public.pme_paiements add constraint pme_paiements_fournisseur_valide
  check (fournisseur in ('paydunya', 'ligdicash'));

notify pgrst, 'reload schema';

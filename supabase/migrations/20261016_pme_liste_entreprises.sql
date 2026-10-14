-- =====================================================================
-- AGRIKEY PME — liste des entreprises inscrites, pour les administrateurs
-- À exécuter une seule fois dans Supabase : SQL Editor > New query > Run.
-- Ré-exécutable sans risque.
-- Ne renvoie que l'identité de l'entreprise (nom, ville, activité), son code
-- partenaire, sa date d'inscription et des indicateurs d'usage : jamais la
-- caisse, les projets ni le contenu des documents.
-- =====================================================================

create or replace function public.pme_liste_entreprises()
returns table (
  nom text,
  ville text,
  activite text,
  code_partenaire text,
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
  if not exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'Accès réservé aux administrateurs.';
  end if;

  return query
  select
    e.nom,
    e.ville,
    e.activite,
    e.code_partenaire,
    e.created_at as inscrite_le,
    exists (
      select 1 from public.operations_caisse o
      where o.user_id = e.user_id and o.created_at > now() - interval '30 days'
    ) as active_30_jours,
    (select count(*) from public.documents d where d.user_id = e.user_id)::bigint as documents
  from public.entreprises e
  order by e.created_at desc;
end;
$$;

revoke execute on function public.pme_liste_entreprises() from public, anon;
grant execute on function public.pme_liste_entreprises() to authenticated;

import type { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Creation } from "@/lib/pme/creations";

type ClientSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type Quota = { limite: number; utilisees: number; restantes: number };

/** Créations du mois pour l'utilisateur connecté, ou null si la base n'est pas à jour. */
export async function lireQuota(supabase: ClientSupabase): Promise<Quota | null> {
  const { data, error } = await supabase.rpc("pme_mon_quota_ia");
  const ligne = (data as { limite: number; utilisees: number }[] | null)?.[0];
  if (error || !ligne) return null;
  return { ...ligne, restantes: Math.max(0, ligne.limite - ligne.utilisees) };
}

// Au-delà, une création « en cours » a été interrompue (page fermée, délai dépassé).
const DELAI_ABANDON_MS = 6 * 60 * 1000;

/** Retire les créations interrompues et rend leur crédit. Renvoie celles qui ont été retirées. */
export async function retirerAbandonnees(supabase: ClientSupabase, creations: Creation[]): Promise<Creation[]> {
  const limite = Date.now() - DELAI_ABANDON_MS;
  const abandonnees = creations.filter((c) => c.statut === "en_cours" && new Date(c.created_at).getTime() < limite);
  for (const c of abandonnees) {
    await supabase.rpc("pme_annuler_creation_ia", { p_creation: c.id });
  }
  return abandonnees;
}

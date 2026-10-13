import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type Entreprise = {
  id: string;
  user_id: string;
  nom: string;
  activite: string | null;
  adresse: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  rccm: string | null;
  logo_url: string | null;
  couleur: string;
};

/**
 * Exige un utilisateur connecté qui a déjà renseigné son entreprise.
 * Sinon, redirige vers la connexion ou vers la saisie du nom.
 */
export async function exigerEntreprise() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/pme/connexion");
  }

  const { data: entreprise } = await supabase
    .from("entreprises")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Entreprise>();

  if (!entreprise) {
    redirect("/pme/bienvenue");
  }

  return { supabase, user, entreprise };
}

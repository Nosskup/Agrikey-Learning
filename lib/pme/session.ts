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

/** Client Supabase et utilisateur connecté (null si déconnecté), pour les actions. */
export async function utilisateurConnecte() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export type Categorie = {
  id: string;
  nom: string;
  type: "recu" | "depense" | "tous";
};

export type Operation = {
  id: string;
  type: "recu" | "depense";
  montant: number;
  categorie_id: string | null;
  note: string | null;
  date: string;
};

export type Projet = {
  id: string;
  nom: string;
  description: string | null;
  date_debut: string | null;
  date_fin: string | null;
};

export type StatutTache = "a_faire" | "en_cours" | "termine";

export type Tache = {
  id: string;
  projet_id: string;
  titre: string;
  responsable: string | null;
  echeance: string | null;
  statut: StatutTache;
};

export const LIBELLES_STATUT: Record<StatutTache, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
};

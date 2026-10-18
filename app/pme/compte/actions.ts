"use server";

import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/pme/session";
import { lireTexte } from "@/lib/pme/validation";
import type { EtatFormulaire } from "../actions";

// Tables d'AGRIKEY PME, dans un ordre qui respecte les liens entre elles.
const TABLES_PME = [
  "opportunites_favoris",
  "opportunites_preferences",
  "documents",
  "taches",
  "projets",
  "operations_caisse",
  "categories_caisse",
  "liste_attente_ia",
  "entreprises",
] as const;

/** Supprime toutes les données AGRIKEY PME de l'utilisateur (le compte AGRIKEY est conservé). */
export async function supprimerDonneesPme(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  if (lireTexte(formData, "confirmation").toUpperCase() !== "SUPPRIMER") {
    return { erreur: "Écrivez SUPPRIMER en majuscules pour confirmer." };
  }

  for (const table of TABLES_PME) {
    const { error } = await supabase.from(table).delete().eq("user_id", user.id);
    // Table absente (script SQL des opportunités pas encore exécuté) : rien à supprimer.
    if (error && error.code !== "PGRST205" && error.code !== "42P01") {
      return { erreur: "La suppression n'a pas pu aller au bout. Réessayez dans un instant ; vos autres données sont intactes." };
    }
  }

  // Logos stockés dans le dossier de l'utilisateur.
  const { data: fichiers } = await supabase.storage.from("logos-entreprises").list(user.id, { limit: 1000 });
  if (fichiers?.length) {
    await supabase.storage.from("logos-entreprises").remove(fichiers.map((f) => `${user.id}/${f.name}`));
  }

  await supabase.auth.signOut();
  redirect("/pme");
}

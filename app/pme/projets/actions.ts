"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { utilisateurConnecte } from "@/lib/pme/session";
import { dateValide, lireTexte, uuidValide } from "@/lib/pme/validation";
import type { EtatFormulaire } from "../actions";

/** Date facultative : vide -> null, invalide -> undefined. */
function lireDate(formData: FormData, nom: string): string | null | undefined {
  const valeur = lireTexte(formData, nom);
  if (!valeur) return null;
  return dateValide(valeur) ? valeur : undefined;
}

// ---------------------------------------------------------------------
// Projets
// ---------------------------------------------------------------------

function lireProjet(formData: FormData) {
  const nom = lireTexte(formData, "nom");
  const description = lireTexte(formData, "description");
  const date_debut = lireDate(formData, "date_debut");
  const date_fin = lireDate(formData, "date_fin");

  if (!nom || nom.length > 120) return { erreur: "Écrivez le nom du projet (120 caractères maximum)." };
  if (description.length > 500) return { erreur: "La description est trop longue (500 caractères maximum)." };
  if (date_debut === undefined || date_fin === undefined) return { erreur: "Choisissez des dates valides." };
  if (date_debut && date_fin && date_fin < date_debut) {
    return { erreur: "La date de fin doit être après la date de début." };
  }

  return { donnees: { nom, description: description || null, date_debut, date_fin } };
}

export async function creerProjet(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  const projet = lireProjet(formData);
  if ("erreur" in projet) return projet;

  const { data, error } = await supabase
    .from("projets")
    .insert({ user_id: user.id, ...projet.donnees })
    .select("id")
    .single();

  if (error || !data) return { erreur: "La création a échoué. Réessayez dans un instant." };

  redirect(`/pme/projets/${data.id}`);
}

export async function modifierProjet(
  id: string,
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (!uuidValide(id)) return { erreur: "Ce projet n'existe plus." };

  const projet = lireProjet(formData);
  if ("erreur" in projet) return projet;

  const { error } = await supabase.from("projets").update(projet.donnees).eq("id", id);
  if (error) return { erreur: "La modification a échoué. Réessayez dans un instant." };

  refresh();
  return { succes: "Projet enregistré." };
}

export async function supprimerProjet(id: string) {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  // Les tâches du projet sont supprimées avec lui (on delete cascade).
  if (uuidValide(id)) {
    await supabase.from("projets").delete().eq("id", id);
  }

  redirect("/pme/projets");
}

// ---------------------------------------------------------------------
// Tâches
// ---------------------------------------------------------------------

function lireTache(formData: FormData) {
  const projet_id = lireTexte(formData, "projet_id");
  const titre = lireTexte(formData, "titre");
  const responsable = lireTexte(formData, "responsable");
  const echeance = lireDate(formData, "echeance");
  const statut = lireTexte(formData, "statut") || "a_faire";

  if (!uuidValide(projet_id)) return { erreur: "Choisissez le projet de cette tâche." };
  if (!titre || titre.length > 200) return { erreur: "Écrivez ce qu'il faut faire (200 caractères maximum)." };
  if (responsable.length > 120) return { erreur: "Le nom du responsable est trop long." };
  if (echeance === undefined) return { erreur: "Choisissez une date d'échéance valide." };
  if (statut !== "a_faire" && statut !== "en_cours" && statut !== "termine") {
    return { erreur: "Choisissez un statut dans la liste." };
  }

  return { donnees: { projet_id, titre, responsable: responsable || null, echeance, statut } };
}

export async function ajouterTache(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  const tache = lireTache(formData);
  if ("erreur" in tache) return tache;

  // La RLS refuse une tâche rattachée au projet d'un autre utilisateur.
  const { error } = await supabase.from("taches").insert({ user_id: user.id, ...tache.donnees });
  if (error) return { erreur: "L'ajout a échoué. Vérifiez votre connexion et réessayez." };

  refresh();
  return { succes: `Tâche « ${tache.donnees.titre} » ajoutée.` };
}

export async function modifierTache(
  id: string,
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (!uuidValide(id)) return { erreur: "Cette tâche n'existe plus." };

  const tache = lireTache(formData);
  if ("erreur" in tache) return tache;

  const { data, error } = await supabase.from("taches").update(tache.donnees).eq("id", id).select("id");
  if (error || !data?.length) return { erreur: "La modification a échoué. Réessayez dans un instant." };

  redirect(`/pme/projets/${tache.donnees.projet_id}`);
}

/** Coche ou décoche une tâche en un geste. */
export async function basculerTache(id: string, terminee: boolean) {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (!uuidValide(id)) return;

  await supabase
    .from("taches")
    .update({ statut: terminee ? "termine" : "a_faire" })
    .eq("id", id);

  refresh();
}

export async function supprimerTache(id: string, projetId: string) {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  if (uuidValide(id)) {
    await supabase.from("taches").delete().eq("id", id);
  }

  redirect(uuidValide(projetId) ? `/pme/projets/${projetId}` : "/pme/projets");
}

const STATUTS_TACHE = ["a_faire", "en_cours", "termine"] as const;

/** Déplace une tâche dans une autre colonne du tableau (à faire, en cours, terminé). */
export async function changerStatutTache(id: string, statut: string) {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (!uuidValide(id) || !STATUTS_TACHE.includes(statut as (typeof STATUTS_TACHE)[number])) return;

  await supabase.from("taches").update({ statut }).eq("id", id);
  refresh();
}

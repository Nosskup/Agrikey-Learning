"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { estAdmin, utilisateurConnecte } from "@/lib/pme/session";
import { lireCodePartenaire, lireTexte, uuidValide } from "@/lib/pme/validation";
import type { EtatFormulaire } from "../actions";

async function exigerAdmin() {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (!(await estAdmin(supabase, user.id))) redirect("/pme/admin");
  return supabase;
}

/** Valide, refuse ou remet en attente une entreprise. */
export async function changerStatut(entrepriseId: string, statut: "valide" | "refuse" | "en_attente") {
  const supabase = await exigerAdmin();
  if (uuidValide(entrepriseId)) {
    await supabase.rpc("pme_changer_statut", { p_entreprise: entrepriseId, p_statut: statut });
  }
  refresh();
}

export async function creerCode(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const supabase = await exigerAdmin();

  const code = lireCodePartenaire(formData, "code");
  if (!code) {
    return { erreur: "Le code doit faire 2 à 20 caractères : lettres, chiffres ou tirets, par exemple LIGUE." };
  }
  const libelle = lireTexte(formData, "libelle");
  if (libelle.length > 120) {
    return { erreur: "Le nom de l'organisation est trop long (120 caractères maximum)." };
  }
  const maxTexte = lireTexte(formData, "max_inscriptions");
  const max = maxTexte ? Number(maxTexte) : null;
  if (max !== null && (!Number.isInteger(max) || max < 1 || max > 100000)) {
    return { erreur: "Le nombre maximum d'inscriptions doit être un nombre entier, ou rester vide." };
  }

  const { error } = await supabase.from("codes_invitation").insert({ code, libelle, max_inscriptions: max });
  if (error?.code === "23505") {
    return { erreur: `Le code ${code} existe déjà.` };
  }
  if (error) {
    return { erreur: "Le code n'a pas pu être créé. Réessayez dans un instant." };
  }

  refresh();
  return { succes: `Code ${code} créé. Lien à partager : /pme/inscription?code=${code}` };
}

export async function basculerCode(code: string, actif: boolean) {
  const supabase = await exigerAdmin();
  await supabase.from("codes_invitation").update({ actif }).eq("code", code);
  refresh();
}

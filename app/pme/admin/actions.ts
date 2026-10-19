"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { estAdmin, utilisateurConnecte } from "@/lib/pme/session";
import { lireCodePartenaire, lireTexte, uuidValide } from "@/lib/pme/validation";
import type { EtatFormulaire } from "../actions";
import { MODELES } from "@/lib/pme/modeles";

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

/** Lit le choix de modèles d'un formulaire : null = suivre le code, ["*"] = tous, sinon la liste cochée. */
function lireChoixModeles(formData: FormData): string[] | null {
  const mode = formData.get("mode");
  if (mode === "code") return null;
  if (mode === "tous") return ["*"];
  const codesConnus = new Set(MODELES.map((m) => m.code));
  return formData
    .getAll("modeles")
    .map(String)
    .filter((c) => codesConnus.has(c));
}

export async function definirModelesCode(code: string, formData: FormData) {
  const supabase = await exigerAdmin();
  const choix = lireChoixModeles(formData);
  // Pour un code, « tous » est enregistré comme NULL (aucune restriction).
  const valeur = choix === null || choix.includes("*") ? null : choix;
  await supabase.from("codes_invitation").update({ modeles_autorises: valeur }).eq("code", code);
  redirect("/pme/admin");
}

export async function definirModelesEntreprise(entrepriseId: string, formData: FormData) {
  const supabase = await exigerAdmin();
  if (uuidValide(entrepriseId)) {
    await supabase.rpc("pme_definir_modeles_entreprise", {
      p_entreprise: entrepriseId,
      p_modeles: lireChoixModeles(formData),
    });
  }
  redirect("/pme/admin");
}

/** Lit la limite de créations IA : null = suivre le code (ou valeur par défaut), sinon un nombre entre 0 et 1000. */
function lireChoixQuota(formData: FormData): number | null {
  if (formData.get("mode") !== "nombre") return null;
  const brut = String(formData.get("quota") ?? "").trim();
  const quota = Number(brut);
  return brut && Number.isInteger(quota) ? Math.min(1000, Math.max(0, quota)) : null;
}

export async function definirQuotaCode(code: string, formData: FormData) {
  const supabase = await exigerAdmin();
  await supabase.from("codes_invitation").update({ quota_ia: lireChoixQuota(formData) }).eq("code", code);
  redirect("/pme/admin");
}

export async function definirQuotaEntreprise(entrepriseId: string, formData: FormData) {
  const supabase = await exigerAdmin();
  if (uuidValide(entrepriseId)) {
    await supabase.rpc("pme_definir_quota_entreprise", {
      p_entreprise: entrepriseId,
      p_quota: lireChoixQuota(formData),
    });
  }
  redirect("/pme/admin");
}

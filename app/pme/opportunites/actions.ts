"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { estAdmin, utilisateurConnecte } from "@/lib/pme/session";
import { dateValide, lireTexte, uuidValide } from "@/lib/pme/validation";
import { codesValides, domaineParCode } from "@/lib/opportunites/domaines";
import type { Annonce, TypeAnnonce } from "@/lib/opportunites/flux";
import type { EtatFormulaire } from "../actions";

const TYPES: TypeAnnonce[] = ["emploi", "appel_offres", "actualite"];

const MESSAGE_BASE =
  "L'enregistrement n'a pas fonctionné. Réessayez dans un instant ; si cela continue, prévenez AGRIKEY.";

function lienValide(lien: string): boolean {
  return lien.length <= 1000 && (/^https?:\/\/\S+$/.test(lien) || /^\/pme\/opportunites\/annonce\/[0-9a-f-]{36}$/.test(lien));
}

// ---------------------------------------------------------------------
// Domaines suivis
// ---------------------------------------------------------------------

export async function enregistrerDomaines(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  const domaines = codesValides(formData.getAll("domaines").map(String));
  const motsCles = lireTexte(formData, "mots_cles");

  if (domaines.length === 0 && !motsCles) {
    return { erreur: "Cochez au moins un domaine, ou écrivez quelques mots-clés." };
  }
  if (motsCles.length > 200) {
    return { erreur: "Les mots-clés sont trop longs (200 caractères maximum)." };
  }

  const { error } = await supabase
    .from("opportunites_preferences")
    .upsert({ user_id: user.id, domaines, mots_cles: motsCles || null });

  if (error) {
    console.error("Domaines non enregistrés :", error.message);
    return { erreur: MESSAGE_BASE };
  }

  redirect("/pme/opportunites");
}

// ---------------------------------------------------------------------
// Annonces enregistrées
// ---------------------------------------------------------------------

/** Enregistre une annonce dans « Mes annonces ». Les données sont vérifiées ici, pas dans le navigateur. */
export async function enregistrerAnnonce(annonce: Annonce): Promise<void> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  const titre = String(annonce.titre ?? "").trim().slice(0, 300);
  const lien = String(annonce.lien ?? "").trim();
  if (!titre || !lienValide(lien) || !TYPES.includes(annonce.type)) return;

  const datePublication = annonce.date && !Number.isNaN(Date.parse(annonce.date)) ? annonce.date : null;
  const dateLimite = annonce.dateLimite && dateValide(annonce.dateLimite) ? annonce.dateLimite : null;

  await supabase.from("opportunites_favoris").upsert(
    {
      user_id: user.id,
      type: annonce.type,
      titre,
      lien,
      source: String(annonce.source ?? "").slice(0, 120) || null,
      date_publication: datePublication,
      date_limite: dateLimite,
    },
    { onConflict: "user_id,lien", ignoreDuplicates: true }
  );
  refresh();
}

export async function retirerAnnonce(lien: string): Promise<void> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  if (lienValide(lien)) {
    await supabase.from("opportunites_favoris").delete().eq("user_id", user.id).eq("lien", lien);
  }
  refresh();
}

// ---------------------------------------------------------------------
// Annonces ajoutées par un administrateur
// ---------------------------------------------------------------------

async function exigerAdmin() {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (!(await estAdmin(supabase, user.id))) redirect("/pme/opportunites");
  return { supabase, user };
}

export async function ajouterAnnonce(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await exigerAdmin();

  const type = lireTexte(formData, "type") as TypeAnnonce;
  if (!TYPES.includes(type)) {
    return { erreur: "Choisissez le type d'annonce." };
  }

  const titre = lireTexte(formData, "titre");
  if (!titre || titre.length > 300) {
    return { erreur: "Écrivez le titre de l'annonce (300 caractères maximum)." };
  }

  const organisme = lireTexte(formData, "organisme");
  const lieu = lireTexte(formData, "lieu");
  const description = lireTexte(formData, "description");
  if (organisme.length > 150 || lieu.length > 100 || description.length > 2000) {
    return { erreur: "Un des textes est trop long. Raccourcissez la description (2 000 caractères maximum)." };
  }

  const lien = lireTexte(formData, "lien");
  if (lien && !/^https?:\/\/\S+$/.test(lien)) {
    return { erreur: "Le lien doit commencer par https:// (ou laissez la case vide)." };
  }

  const domaine = lireTexte(formData, "domaine");
  if (domaine && !domaineParCode(domaine)) {
    return { erreur: "Choisissez un domaine dans la liste." };
  }

  const dateLimite = lireTexte(formData, "date_limite");
  if (dateLimite && !dateValide(dateLimite)) {
    return { erreur: "Choisissez une date limite valide, ou laissez la case vide." };
  }

  const { error } = await supabase.from("opportunites").insert({
    user_id: user.id,
    type,
    titre,
    organisme: organisme || null,
    lieu: lieu || null,
    description: description || null,
    lien: lien || null,
    domaine: domaine || null,
    date_limite: dateLimite || null,
  });

  if (error) {
    console.error("Annonce non enregistrée :", error.message);
    return { erreur: MESSAGE_BASE };
  }

  const onglet = type === "emploi" ? "emplois" : type === "appel_offres" ? "appels" : "actualites";
  redirect(`/pme/opportunites?onglet=${onglet}`);
}

export async function supprimerAnnonce(id: string): Promise<void> {
  const { supabase } = await exigerAdmin();
  if (uuidValide(id)) {
    await supabase.from("opportunites").delete().eq("id", id);
  }
  refresh();
}

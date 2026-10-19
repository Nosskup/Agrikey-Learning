"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { exigerEntreprise, utilisateurConnecte } from "@/lib/pme/session";
import { lireTexte, uuidValide } from "@/lib/pme/validation";
import { trouverFormat, type Demande, type TypeCreation } from "@/lib/pme/creations";
import { creerVisuel, ErreurCreation, iaDisponible } from "@/lib/pme/ia";
import type { EtatFormulaire } from "../actions";

const LIMITES = { idee: 600, titre: 80, details: 400, slogan: 80 };

export async function creerCreation(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const { supabase, entreprise } = await exigerEntreprise();

  if (!iaDisponible()) {
    return { erreur: "Le service de création n'est pas encore configuré. Prévenez AGRIKEY." };
  }

  const type: TypeCreation = formData.get("type") === "logo" ? "logo" : "affiche";
  const format = trouverFormat(type, lireTexte(formData, "format"));
  if (!format) {
    return { erreur: "Choisissez un format." };
  }

  const demande: Demande = {
    idee: lireTexte(formData, "idee"),
    titre: lireTexte(formData, "titre"),
    details: lireTexte(formData, "details"),
    slogan: lireTexte(formData, "slogan"),
    avecPhoto: formData.get("avec_photo") === "on",
    avecLogo: formData.get("avec_logo") === "on",
    avecContact: formData.get("avec_contact") === "on",
    avecCouleur: formData.get("avec_couleur") === "on",
  };

  if (!demande.idee || demande.idee.length < 5) {
    return {
      erreur:
        type === "logo"
          ? "Décrivez en quelques mots votre activité et le style que vous aimez."
          : "Écrivez en quelques mots ce que vous voulez annoncer.",
    };
  }
  for (const [champ, max] of Object.entries(LIMITES)) {
    if ((demande[champ as keyof typeof LIMITES] ?? "").length > max) {
      return { erreur: `Un des textes est trop long (${max} caractères maximum).` };
    }
  }

  const titre = (type === "logo" ? demande.titre || entreprise.nom : demande.titre || demande.idee).slice(0, 120);

  // Réserve un crédit (la base vérifie la limite du mois) avant d'appeler l'IA.
  const { data: creation, error } = await supabase
    .from("creations_ia")
    .insert({ type, format: format.code, titre, demande })
    .select("id")
    .single();

  if (error?.code === "P0002") {
    return { erreur: "Vous avez utilisé toutes vos créations de ce mois-ci. Elles reviennent le 1er du mois prochain." };
  }
  if (error || !creation) {
    console.error("Création IA non enregistrée :", error?.message);
    return { erreur: "La création n'a pas pu démarrer. Réessayez dans un instant." };
  }

  let photoManquante = false;
  try {
    const resultat = await creerVisuel(type, format, demande, entreprise);
    photoManquante = resultat.photoManquante;
    const { error: erreurFin } = await supabase.rpc("pme_terminer_creation_ia", {
      p_creation: creation.id,
      p_titre: titre,
      p_svg: resultat.svg,
    });
    if (erreurFin) throw new Error(erreurFin.message);
  } catch (erreur) {
    // Échec : la création est retirée et le crédit rendu.
    await supabase.rpc("pme_annuler_creation_ia", { p_creation: creation.id });
    if (erreur instanceof ErreurCreation) return { erreur: `${erreur.message} Elle ne vous a pas été décomptée.` };
    console.error("Création IA échouée :", erreur);
    return { erreur: "La création n'a pas abouti. Réessayez dans un instant ; elle ne vous a pas été décomptée." };
  }

  redirect(`/pme/affiches/${creation.id}${photoManquante ? "?photo=absente" : ""}`);
}

export async function supprimerCreation(id: string) {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (uuidValide(id)) {
    await supabase.from("creations_ia").delete().eq("id", id);
  }
  redirect("/pme/affiches");
}

/** Utilise un logo créé (déjà converti en PNG et envoyé par le navigateur) comme logo de l'entreprise. */
export async function utiliserCommeLogo(logoUrl: string): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  const prefixe = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos-entreprises/${user.id}/`;
  if (!logoUrl.startsWith(prefixe)) {
    return { erreur: "Le logo n'a pas pu être enregistré. Réessayez." };
  }

  const { error } = await supabase.from("entreprises").update({ logo_url: logoUrl }).eq("user_id", user.id);
  if (error) {
    return { erreur: "Le logo n'a pas pu être enregistré. Réessayez." };
  }
  refresh();
  return { succes: "C'est fait : ce logo apparaît maintenant sur vos devis, factures et affiches." };
}

"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { utilisateurConnecte } from "@/lib/pme/session";
import {
  dateValide,
  lireMontant,
  lireTexte,
  uuidValide,
} from "@/lib/pme/validation";
import type { EtatFormulaire } from "../actions";

type DonneesOperation = {
  type: "recu" | "depense";
  montant: number;
  categorie_id: string | null;
  note: string | null;
  date: string;
};

/** Lit et vérifie le formulaire d'opération. Renvoie un message d'erreur ou les données. */
async function lireOperation(
  formData: FormData,
  supabase: Awaited<ReturnType<typeof utilisateurConnecte>>["supabase"]
): Promise<{ erreur: string } | { donnees: DonneesOperation }> {
  const type = lireTexte(formData, "type");
  if (type !== "recu" && type !== "depense") {
    return { erreur: "Choisissez « Argent reçu » ou « Argent dépensé »." };
  }

  const montant = lireMontant(formData, "montant");
  if (montant === null) {
    return { erreur: "Écrivez un montant entier en chiffres, par exemple 25000." };
  }

  const date = lireTexte(formData, "date");
  if (!dateValide(date)) {
    return { erreur: "Choisissez une date valide." };
  }

  const note = lireTexte(formData, "note");
  if (note.length > 300) {
    return { erreur: "La note est trop longue (300 caractères maximum)." };
  }

  const categorieId = lireTexte(formData, "categorie_id");
  if (categorieId) {
    if (!uuidValide(categorieId)) {
      return { erreur: "Choisissez une catégorie dans la liste." };
    }
    const { data: categorie } = await supabase
      .from("categories_caisse")
      .select("type")
      .eq("id", categorieId)
      .maybeSingle();

    if (!categorie || (categorie.type !== "tous" && categorie.type !== type)) {
      return { erreur: "Cette catégorie ne correspond pas au type choisi. Choisissez-en une autre." };
    }
  }

  return {
    donnees: { type, montant, date, note: note || null, categorie_id: categorieId || null },
  };
}

export async function ajouterOperation(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  const resultat = await lireOperation(formData, supabase);
  if ("erreur" in resultat) return resultat;

  const { error } = await supabase
    .from("operations_caisse")
    .insert({ user_id: user.id, ...resultat.donnees });

  if (error) {
    return { erreur: "L'enregistrement a échoué. Vérifiez votre connexion et réessayez." };
  }

  refresh();
  return { succes: resultat.donnees.type === "recu" ? "Argent reçu enregistré." : "Dépense enregistrée." };
}

export async function modifierOperation(
  id: string,
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (!uuidValide(id)) return { erreur: "Cette opération n'existe plus." };

  const resultat = await lireOperation(formData, supabase);
  if ("erreur" in resultat) return resultat;

  const { data, error } = await supabase
    .from("operations_caisse")
    .update(resultat.donnees)
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    return { erreur: "La modification a échoué. Réessayez dans un instant." };
  }

  redirect(`/pme/caisse?mois=${resultat.donnees.date.slice(0, 7)}`);
}

export async function supprimerOperation(id: string, mois: string) {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  if (uuidValide(id)) {
    await supabase.from("operations_caisse").delete().eq("id", id);
  }

  redirect(/^\d{4}-\d{2}$/.test(mois) ? `/pme/caisse?mois=${mois}` : "/pme/caisse");
}

// ---------------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------------

function lireCategorie(formData: FormData) {
  const nom = lireTexte(formData, "nom");
  const type = lireTexte(formData, "type");

  if (!nom || nom.length > 60) {
    return { erreur: "Écrivez un nom de catégorie (60 caractères maximum)." };
  }
  if (type !== "recu" && type !== "depense" && type !== "tous") {
    return { erreur: "Choisissez le type de la catégorie." };
  }
  return { nom, type };
}

export async function ajouterCategorie(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  const categorie = lireCategorie(formData);
  if ("erreur" in categorie) return categorie;

  const { error } = await supabase
    .from("categories_caisse")
    .insert({ user_id: user.id, ...categorie });

  if (error) return { erreur: "L'ajout a échoué. Réessayez dans un instant." };

  refresh();
  return { succes: `Catégorie « ${categorie.nom} » ajoutée.` };
}

export async function modifierCategorie(
  id: string,
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (!uuidValide(id)) return { erreur: "Cette catégorie n'existe plus." };

  const categorie = lireCategorie(formData);
  if ("erreur" in categorie) return categorie;

  const { error } = await supabase
    .from("categories_caisse")
    .update(categorie)
    .eq("id", id);

  if (error) return { erreur: "La modification a échoué. Réessayez dans un instant." };

  refresh();
  return { succes: "Enregistré." };
}

export async function supprimerCategorie(id: string) {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  // Les opérations de cette catégorie sont conservées, sans catégorie.
  if (uuidValide(id)) {
    await supabase.from("categories_caisse").delete().eq("id", id);
  }

  refresh();
}

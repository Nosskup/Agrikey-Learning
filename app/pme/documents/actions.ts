"use server";

import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/pme/session";
import { trouverModele, type Modele } from "@/lib/pme/modeles";
import { titreDocument, type DonneesDocument, type LigneArticle } from "@/lib/pme/documents";
import { dateValide, lireMontant, lireTexte, uuidValide } from "@/lib/pme/validation";
import type { EtatFormulaire } from "../actions";

const LONGUEUR_MAX = { texte: 200, texte_long: 2000 } as const;
const LIGNES_MAX = 30;

function lireLignes(formData: FormData): LigneArticle[] | string {
  let brutes: unknown;
  try {
    brutes = JSON.parse(String(formData.get("lignes") ?? "[]"));
  } catch {
    return "Les articles n'ont pas pu être lus. Réessayez.";
  }
  if (!Array.isArray(brutes)) return "Les articles n'ont pas pu être lus. Réessayez.";

  const lignes: LigneArticle[] = [];
  for (const brute of brutes) {
    const designation = String(brute?.designation ?? "").trim();
    const quantiteTexte = String(brute?.quantite ?? "").trim().replace(",", ".");
    const prixTexte = String(brute?.prix_unitaire ?? "").replace(/[\s.  ]/g, "");

    // Ligne laissée vide : on l'ignore.
    if (!designation && !quantiteTexte && !prixTexte) continue;

    const numero = lignes.length + 1;
    if (!designation || designation.length > 200) return `Article ${numero} : écrivez la désignation.`;
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(quantiteTexte) || Number(quantiteTexte) <= 0) {
      return `Article ${numero} : écrivez une quantité, par exemple 2 ou 1,5.`;
    }
    if (!/^\d{1,12}$/.test(prixTexte)) return `Article ${numero} : écrivez le prix unitaire en chiffres.`;

    lignes.push({ designation, quantite: Number(quantiteTexte), prix_unitaire: Number(prixTexte) });
  }

  if (lignes.length === 0) return "Ajoutez au moins un article.";
  if (lignes.length > LIGNES_MAX) return `${LIGNES_MAX} articles maximum par document.`;
  return lignes;
}

/** Lit et vérifie le formulaire selon les champs du modèle. */
function lireDonnees(modele: Modele, formData: FormData): DonneesDocument | string {
  const champs: Record<string, string> = {};

  for (const champ of modele.champs) {
    const cle = `champ_${champ.nom}`;
    let valeur = lireTexte(formData, cle);

    if (!valeur) {
      if (champ.obligatoire) return `Remplissez le champ « ${champ.label} ».`;
      champs[champ.nom] = "";
      continue;
    }

    if (champ.type === "date" && !dateValide(valeur)) {
      return `Choisissez une date valide pour « ${champ.label} ».`;
    }
    if (champ.type === "montant") {
      const montant = lireMontant(formData, cle);
      if (montant === null) return `« ${champ.label} » : écrivez un montant entier en chiffres, par exemple 25000.`;
      valeur = String(montant);
    }
    if ((champ.type === "texte" || champ.type === "texte_long") && valeur.length > LONGUEUR_MAX[champ.type]) {
      return `« ${champ.label} » est trop long (${LONGUEUR_MAX[champ.type]} caractères maximum).`;
    }

    champs[champ.nom] = valeur;
  }

  let lignes: LigneArticle[] = [];
  if (modele.lignes) {
    const resultat = lireLignes(formData);
    if (typeof resultat === "string") return resultat;
    lignes = resultat;
  }

  return { champs, lignes };
}

export async function creerDocument(
  code: string,
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  const modele = trouverModele(code);
  if (!modele) return { erreur: "Ce modèle n'existe pas. Retournez à la liste des documents." };

  const { data: autorise } = await supabase.rpc("pme_modele_autorise", { p_modele: modele.code });
  if (autorise === false) {
    return { erreur: "Ce modèle n'est pas ouvert pour votre compte. Contactez votre association ou AGRIKEY." };
  }

  const donnees = lireDonnees(modele, formData);
  if (typeof donnees === "string") return { erreur: donnees };

  const { data, error } = await supabase
    .from("documents")
    .insert({ user_id: user.id, modele_code: modele.code, titre: titreDocument(modele, donnees), donnees })
    .select("id")
    .single();

  if (error || !data) return { erreur: "L'enregistrement a échoué. Vérifiez votre connexion et réessayez." };

  redirect(`/pme/documents/${data.id}`);
}

export async function modifierDocument(
  id: string,
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (!uuidValide(id)) return { erreur: "Ce document n'existe plus." };

  const { data: document } = await supabase.from("documents").select("modele_code").eq("id", id).maybeSingle();
  const modele = document && trouverModele(document.modele_code);
  if (!modele) return { erreur: "Ce document n'existe plus." };

  const donnees = lireDonnees(modele, formData);
  if (typeof donnees === "string") return { erreur: donnees };

  const { error } = await supabase
    .from("documents")
    .update({ titre: titreDocument(modele, donnees), donnees })
    .eq("id", id);

  if (error) return { erreur: "L'enregistrement a échoué. Vérifiez votre connexion et réessayez." };

  redirect(`/pme/documents/${id}`);
}

export async function supprimerDocument(id: string) {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  if (uuidValide(id)) {
    await supabase.from("documents").delete().eq("id", id);
  }

  redirect("/pme/documents");
}

// Remplissage des modèles de documents (utilisable côté serveur et navigateur).

import type { Entreprise } from "./session";
import type { Modele } from "./modeles";
import { dateNumerique, formatFCFA } from "./format";
import { nombreEnLettres } from "./lettres";

export type LigneArticle = {
  designation: string;
  quantite: number;
  prix_unitaire: number;
};

export type DonneesDocument = {
  champs: Record<string, string>;
  lignes: LigneArticle[];
};

export function montantLigne(ligne: LigneArticle): number {
  return Math.round(ligne.quantite * ligne.prix_unitaire);
}

export function totalLignes(lignes: LigneArticle[]): number {
  return lignes.reduce((total, ligne) => total + montantLigne(ligne), 0);
}

/** Valeur de chaque {{variable}} du modèle, déjà mise en forme pour l'affichage. */
export function variablesDocument(
  modele: Modele,
  donnees: DonneesDocument,
  entreprise: Entreprise
): Record<string, string> {
  const variables: Record<string, string> = {
    entreprise_nom: entreprise.nom,
    entreprise_activite: entreprise.activite ?? "",
    entreprise_adresse: entreprise.adresse ?? "",
    entreprise_ville: entreprise.ville ?? "",
    entreprise_telephone: entreprise.telephone ?? "",
    entreprise_email: entreprise.email ?? "",
    entreprise_rccm: entreprise.rccm ?? "",
  };

  for (const champ of modele.champs) {
    const valeur = donnees.champs[champ.nom] ?? "";

    if (champ.type === "date") {
      variables[champ.nom] = valeur ? dateNumerique(valeur) : "";
    } else if (champ.type === "montant") {
      const montant = Number(valeur);
      variables[champ.nom] = valeur ? formatFCFA(montant) : "";
      variables[`${champ.nom}_lettres`] = valeur ? nombreEnLettres(montant) : "";
    } else {
      variables[champ.nom] = valeur;
    }
  }

  const date = variables.date_document ?? "";
  variables.lieu_date = date ? (entreprise.ville ? `${entreprise.ville}, le ${date}` : `Le ${date}`) : "";

  if (modele.lignes) {
    const total = totalLignes(donnees.lignes);
    variables.total = formatFCFA(total);
    variables.total_lettres = nombreEnLettres(total);
  }

  return variables;
}

/** Titre affiché dans l'historique : « Devis – Boutique Diallo ». */
export function titreDocument(modele: Modele, donnees: DonneesDocument): string {
  const complement = donnees.champs[modele.champTitre]?.trim();
  return (complement ? `${modele.titre} – ${complement}` : modele.titre).slice(0, 200);
}

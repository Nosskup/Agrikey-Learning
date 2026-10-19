// Formules d'abonnement d'AGRIKEY PME.
//
// Le prix payé est toujours lu ici, côté serveur, jamais envoyé par le navigateur.
// Pour changer un prix, modifier « montant » (en FCFA). La durée est fixée dans
// la fonction SQL pme_activer_abonnement (1 mois ou 1 an).

export type CodeFormule = "premium_mois" | "premium_an";

export type Formule = {
  code: CodeFormule;
  titre: string;
  montant: number;
  periode: string;
  /** Petit texte mis en avant (économie, conseil…). */
  accroche?: string;
};

export const FORMULES: Formule[] = [
  { code: "premium_mois", titre: "Premium mensuel", montant: 2500, periode: "par mois" },
  { code: "premium_an", titre: "Premium annuel", montant: 25000, periode: "par an", accroche: "2 mois offerts" },
];

/** Ce que comprend Premium (texte affiché ; à ajuster selon les fonctions réservées). */
export const AVANTAGES_PREMIUM = [
  "Documents illimités avec votre logo",
  "Alertes sur les nouvelles opportunités de vos domaines",
  "Exports PDF et CSV de la caisse",
  "Assistance prioritaire par WhatsApp",
];

export function formuleParCode(code: string | null | undefined): Formule | undefined {
  return FORMULES.find((f) => f.code === code);
}

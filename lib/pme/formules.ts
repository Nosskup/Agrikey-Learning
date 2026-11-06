// Formules d'abonnement d'AGRIKEY PME.
//
// Le prix payé est toujours lu ici, côté serveur, jamais envoyé par le navigateur.
// Pour changer un prix, modifier « montant » (en FCFA). La durée est fixée dans
// la fonction SQL pme_activer_abonnement (1 mois ou 1 an).

/**
 * Abonnements visibles dans l'application (bandeau « Passez à Premium », page Abonnement,
 * lien dans Mon compte). Masqués pour l'instant : passer à true pour les afficher.
 */
export const ABONNEMENTS_VISIBLES = false;

export type CodeFormule = "premium_mois" | "premium_an" | "essai_admin";

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

/**
 * Formule de test à 100 FCFA, réservée aux administrateurs : LigdiCash n'ayant pas de
 * bac à sable, elle permet de vérifier un vrai paiement à petit prix (1 jour de Premium,
 * durée fixée dans pme_activer_abonnement).
 */
export const FORMULE_ESSAI: Formule = {
  code: "essai_admin",
  titre: "Essai de paiement (admins)",
  montant: 100,
  periode: "1 jour",
};

/** Ce que comprend Premium (texte affiché ; à ajuster selon les fonctions réservées). */
export const AVANTAGES_PREMIUM = [
  "Documents illimités avec votre logo",
  "Alertes sur les nouvelles opportunités de vos domaines",
  "Exports PDF et CSV de la caisse",
  "Assistance prioritaire par WhatsApp",
];

export function formuleParCode(code: string | null | undefined): Formule | undefined {
  return [...FORMULES, FORMULE_ESSAI].find((f) => f.code === code);
}

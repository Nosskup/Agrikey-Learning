// Formules d'abonnement d'AGRIKEY PME.
//
// Le prix payé est toujours lu ici, côté serveur, jamais envoyé par le navigateur.
// Pour changer un prix, modifier « montant » (en FCFA). La durée est fixée dans
// la fonction SQL pme_activer_abonnement (1 mois ou 1 an). Un paiement fait pendant
// la période gratuite commence à la fin de celle-ci.

/**
 * Abonnements visibles dans l'application (page Abonnement, lien dans Mon compte,
 * rappel de fin de période gratuite). Après la période gratuite offerte par le code
 * d'invitation, l'abonnement est nécessaire pour continuer à utiliser l'outil.
 */
export const ABONNEMENTS_VISIBLES = true;

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
  { code: "premium_mois", titre: "Abonnement mensuel", montant: 2500, periode: "par mois" },
  { code: "premium_an", titre: "Abonnement annuel", montant: 25000, periode: "par an", accroche: "2 mois offerts" },
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

/** Ce que comprend l'abonnement (texte affiché). */
export const AVANTAGES_PREMIUM = [
  "Accès complet : caisse, projets, documents et opportunités",
  "Devis, factures et reçus en PDF avec votre logo",
  "Affiches et logos IA, selon votre nombre de créations",
  "Vos données conservées et téléchargeables à tout moment",
];

export function formuleParCode(code: string | null | undefined): Formule | undefined {
  return [...FORMULES, FORMULE_ESSAI].find((f) => f.code === code);
}

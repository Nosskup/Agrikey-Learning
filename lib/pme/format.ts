// Petits utilitaires d'affichage pour AGRIKEY PME.

/** 1250000 -> "1 250 000 FCFA" (espaces comme séparateur de milliers). */
export function formatFCFA(montant: number): string {
  const signe = montant < 0 ? "-" : "";
  const chiffres = Math.abs(Math.round(montant))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return `${signe}${chiffres} FCFA`;
}

/** Premier et dernier jour du mois au format AAAA-MM-JJ. */
export function bornesDuMois(reference = new Date()) {
  const annee = reference.getFullYear();
  const mois = reference.getMonth();
  const dernierJour = new Date(annee, mois + 1, 0).getDate();
  const mm = String(mois + 1).padStart(2, "0");

  return {
    debut: `${annee}-${mm}-01`,
    fin: `${annee}-${mm}-${String(dernierJour).padStart(2, "0")}`,
  };
}

export function nomDuMois(reference = new Date()): string {
  return reference.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

// Validation des saisies côté serveur pour AGRIKEY PME.

/** Lit un champ texte d'un formulaire, sans espaces superflus. */
export function lireTexte(formData: FormData, nom: string): string {
  const valeur = formData.get(nom);
  return typeof valeur === "string" ? valeur.trim() : "";
}

export function emailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 120;
}

export function couleurValide(couleur: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(couleur);
}

/** "1 250 000" -> 1250000. Renvoie null si ce n'est pas un entier positif. */
export function lireMontant(formData: FormData, nom: string): number | null {
  const texte = lireTexte(formData, nom);
  // Séparateurs de milliers acceptés seulement par groupes de 3 : « 1 250 000 », « 12.500 ».
  if (!/^\d+$/.test(texte) && !/^\d{1,3}([\s.,\u00a0\u202f]\d{3})+$/.test(texte)) return null;

  const chiffres = texte.replace(/\D/g, "");
  if (chiffres.length > 12) return null;

  const montant = Number(chiffres);
  return montant > 0 ? montant : null;
}

export function dateValide(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));
}

export function uuidValide(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Code partenaire facultatif (ex. « ligue » -> « LIGUE »).
 * Renvoie "" si vide, null si le format est invalide.
 */
export function lireCodePartenaire(formData: FormData, nom = "code_partenaire"): string | null {
  const code = lireTexte(formData, nom).toUpperCase().replace(/\s+/g, "");
  if (!code) return "";
  return /^[A-Z0-9-]{2,20}$/.test(code) ? code : null;
}

/** Vrai si la case d'acceptation des conditions est cochée. */
export function conditionsAcceptees(formData: FormData): boolean {
  return formData.get("conditions") === "oui";
}

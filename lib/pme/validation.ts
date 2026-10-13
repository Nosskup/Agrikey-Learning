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

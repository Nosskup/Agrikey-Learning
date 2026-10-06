/**
 * Couvertures des formations : logique partagée (sans affichage).
 *
 * Les deux formations les plus anciennes ont une image fournie avec le site ;
 * toutes les autres utilisent la photo téléversée depuis l'administration
 * (colonne image_url), ou, à défaut, un visuel aux couleurs d'AGRIKEY.
 */
export const KNOWN_COVERS: Record<number, string> = {
  1: "/images/gestion-financiere.webp?v=2",
  2: "/images/gestion-entreprise.webp?v=2",
};

/** Retourne l'adresse de l'image de couverture, ou null s'il n'y en a pas. */
export function coverSource(
  courseId: number,
  imageUrl?: string | null
): string | null {
  return imageUrl || KNOWN_COVERS[courseId] || null;
}

/** Vrai si la formation possède une vraie photo (et pas seulement le visuel de marque). */
export function hasCoverImage(
  courseId: number,
  imageUrl?: string | null
): boolean {
  return coverSource(courseId, imageUrl) !== null;
}

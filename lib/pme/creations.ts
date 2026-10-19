// Affiches et logos IA : formats et données partagés entre le serveur et le navigateur.

export type TypeCreation = "affiche" | "logo";

export type Format = {
  code: string;
  libelle: string;
  largeur: number;
  hauteur: number;
  /** Taille de la photo demandée au générateur d'images. */
  taillePhoto: "1024x1024" | "1024x1536";
};

export const FORMATS_AFFICHE: Format[] = [
  { code: "carre", libelle: "Carré – WhatsApp, Facebook", largeur: 1080, hauteur: 1080, taillePhoto: "1024x1024" },
  { code: "portrait", libelle: "Portrait – Facebook, Instagram", largeur: 1080, hauteur: 1350, taillePhoto: "1024x1536" },
  { code: "story", libelle: "Statut WhatsApp", largeur: 1080, hauteur: 1920, taillePhoto: "1024x1536" },
  { code: "a4", libelle: "Affiche A4 à imprimer", largeur: 1240, hauteur: 1754, taillePhoto: "1024x1536" },
];

export const FORMAT_LOGO: Format = {
  code: "logo",
  libelle: "Logo carré",
  largeur: 1024,
  hauteur: 1024,
  taillePhoto: "1024x1024",
};

export function trouverFormat(type: TypeCreation, code: string): Format | undefined {
  return type === "logo" ? FORMAT_LOGO : FORMATS_AFFICHE.find((f) => f.code === code);
}

/** Ce que le membre a demandé (enregistré pour pouvoir recommencer). */
export type Demande = {
  idee: string;
  titre?: string;
  details?: string;
  slogan?: string;
  avecPhoto?: boolean;
  avecLogo?: boolean;
  avecContact?: boolean;
  avecCouleur?: boolean;
};

export type Creation = {
  id: string;
  type: TypeCreation;
  format: string;
  titre: string | null;
  demande: Demande;
  statut: "en_cours" | "pret";
  created_at: string;
};

/** Limite par défaut quand ni le membre ni son code n'en ont. */
export const QUOTA_IA_DEFAUT = 10;

export function resumerQuota(quota: number | null): string {
  if (quota === null) return `${QUOTA_IA_DEFAUT} créations IA / mois`;
  if (quota === 0) return "Créations IA fermées";
  return `${quota} création${quota > 1 ? "s" : ""} IA / mois`;
}

// Petits utilitaires d'affichage pour AGRIKEY PME.

/** 1250000 -> "1 250 000 FCFA" (espaces insécables : le montant ne se coupe pas). */
export function formatFCFA(montant: number): string {
  const signe = montant < 0 ? "-" : "";
  const chiffres = Math.abs(Math.round(montant))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");

  return `${signe}${chiffres}\u00a0FCFA`;
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

/** Date du jour au format AAAA-MM-JJ (heure de Bamako = UTC). */
export function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "2026-10-14" -> "mar. 14 oct." */
export function dateCourte(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** "2026-10-14" -> "14/10/2026" */
export function dateNumerique(date: string): string {
  const [annee, mois, jour] = date.split("-");
  return `${jour}/${mois}/${annee}`;
}

export type Mois = {
  cle: string; // "2026-10"
  libelle: string; // "octobre 2026"
  debut: string;
  fin: string;
  precedent: string;
  suivant: string;
};

/** Mois lu dans l'URL (?mois=2026-10), ou mois courant si absent ou invalide. */
export function lireMois(param: string | string[] | undefined): Mois {
  const texte = typeof param === "string" ? param : "";
  const correspondance = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(texte);
  const reference = correspondance
    ? new Date(Number(correspondance[1]), Number(correspondance[2]) - 1, 1)
    : new Date();

  const annee = reference.getFullYear();
  const mois = reference.getMonth();
  const cle = (a: number, m: number) => {
    const d = new Date(a, m, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  return {
    cle: cle(annee, mois),
    libelle: nomDuMois(reference),
    ...bornesDuMois(reference),
    precedent: cle(annee, mois - 1),
    suivant: cle(annee, mois + 1),
  };
}

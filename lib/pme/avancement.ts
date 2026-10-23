// Calculs d'avancement d'un projet (partagés par les visuels de la rubrique Projets).

import type { Projet, StatutTache, Tache } from "./session";

export type Compte = { a_faire: number; en_cours: number; termine: number; enRetard: number; total: number };

/** Couleurs des statuts : gris = pas commencé, bleu = en cours, vert = terminé, rouge = en retard. */
export const COULEURS_STATUT: Record<StatutTache, string> = {
  a_faire: "#64748b",
  en_cours: "#0284c7",
  termine: "#16834b",
};
export const COULEUR_RETARD = "#dc2626";

export function estEnRetard(tache: Tache, jour: string): boolean {
  return tache.statut !== "termine" && tache.echeance !== null && tache.echeance < jour;
}

export function compterTaches(taches: Tache[], jour: string): Compte {
  const compte: Compte = { a_faire: 0, en_cours: 0, termine: 0, enRetard: 0, total: taches.length };
  for (const t of taches) {
    compte[t.statut] += 1;
    if (estEnRetard(t, jour)) compte.enRetard += 1;
  }
  return compte;
}

function jours(debut: string, fin: string): number {
  return Math.round((Date.parse(`${fin}T12:00:00Z`) - Date.parse(`${debut}T12:00:00Z`)) / 86_400_000);
}

export type Rythme = {
  /** Part du temps prévu déjà écoulée, de 0 à 100. */
  temps: number;
  /** Part des tâches terminées, de 0 à 100. */
  travail: number;
  joursRestants: number;
  verdict: "avance" | "temps" | "retard" | "termine" | "depasse";
};

/**
 * Compare le temps écoulé au travail fait. Null sans date de début et de fin
 * (ou sans tâche) : on ne peut pas juger le rythme.
 */
export function calculerRythme(projet: Projet, compte: Compte, jour: string): Rythme | null {
  if (!projet.date_debut || !projet.date_fin || compte.total === 0) return null;

  const duree = Math.max(1, jours(projet.date_debut, projet.date_fin));
  const ecoules = Math.min(duree, Math.max(0, jours(projet.date_debut, jour)));
  const temps = Math.round((ecoules / duree) * 100);
  const travail = Math.round((compte.termine / compte.total) * 100);
  const joursRestants = jours(jour, projet.date_fin);

  let verdict: Rythme["verdict"];
  if (travail === 100) verdict = "termine";
  else if (joursRestants < 0) verdict = "depasse";
  // Marge de 10 points : un petit écart n'est pas un retard.
  else if (travail >= temps + 10) verdict = "avance";
  else if (travail + 10 >= temps) verdict = "temps";
  else verdict = "retard";

  return { temps, travail, joursRestants, verdict };
}

export const VERDICTS: Record<Rythme["verdict"], { icone: string; libelle: string; classe: string }> = {
  avance: { icone: "🚀", libelle: "En avance", classe: "bg-green-50 text-agri-fonce" },
  temps: { icone: "✅", libelle: "Dans les temps", classe: "bg-sky-50 text-sky-800" },
  retard: { icone: "⚠️", libelle: "En retard sur le planning", classe: "bg-red-50 text-red-800" },
  termine: { icone: "🎉", libelle: "Projet terminé", classe: "bg-green-50 text-agri-fonce" },
  depasse: { icone: "⏰", libelle: "Date de fin dépassée", classe: "bg-red-50 text-red-800" },
};

// Lecture des données « Opportunités » stockées dans Supabase.

import type { createSupabaseServerClient } from "@/lib/supabase-server";
import { codesValides, DOMAINES_PAR_DEFAUT, domaineParCode } from "./domaines";
import { contientUnMot, type Annonce, type TypeAnnonce } from "./flux";

type ClientSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type Preferences = {
  domaines: string[];
  motsCles: string[];
  /** Faux tant que le membre n'a jamais enregistré ses domaines. */
  choisies: boolean;
};

/** « riz, karité ; maraîchage » -> ["riz", "karité", "maraîchage"] */
export function decouperMotsCles(texte: string | null | undefined): string[] {
  return (texte ?? "")
    .split(/[,;\n]/)
    .map((mot) => mot.trim())
    .filter((mot) => mot.length >= 2)
    .slice(0, 10);
}

export async function lirePreferences(supabase: ClientSupabase): Promise<Preferences> {
  const { data } = await supabase
    .from("opportunites_preferences")
    .select("domaines, mots_cles")
    .maybeSingle<{ domaines: string[]; mots_cles: string | null }>();

  if (!data) return { domaines: DOMAINES_PAR_DEFAUT, motsCles: [], choisies: false };
  return { domaines: codesValides(data.domaines ?? []), motsCles: decouperMotsCles(data.mots_cles), choisies: true };
}

type LigneOpportunite = {
  id: string;
  created_at: string;
  type: TypeAnnonce;
  titre: string;
  organisme: string | null;
  description: string | null;
  lien: string | null;
  lieu: string | null;
  domaine: string | null;
  date_limite: string | null;
};

/** Annonces ajoutées par un administrateur, pour les domaines choisis (sans domaine = pour tous). */
export async function annoncesManuelles(
  supabase: ClientSupabase,
  type: TypeAnnonce,
  preferences: Preferences,
  tousDomaines: boolean
): Promise<Annonce[]> {
  const { data, error } = await supabase
    .from("opportunites")
    .select("id, created_at, type, titre, organisme, description, lien, lieu, domaine, date_limite")
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<LigneOpportunite[]>();

  // Base pas encore mise à jour : pas d'annonce manuelle, les sources automatiques restent visibles.
  if (error || !data) return [];

  return data
    .filter(
      (o) =>
        tousDomaines ||
        !o.domaine ||
        preferences.domaines.includes(o.domaine) ||
        contientUnMot(`${o.titre} ${o.description ?? ""}`, preferences.motsCles)
    )
    .map((o) => ({
      type: o.type,
      titre: o.titre,
      // Sans lien, l'annonce s'ouvre sur sa propre page.
      lien: o.lien ?? `/pme/opportunites/annonce/${o.id}`,
      source: o.organisme || "AGRIKEY",
      resume: [o.lieu, domaineParCode(o.domaine)?.libelle, o.description].filter(Boolean).join(" · ") || undefined,
      date: o.created_at,
      dateLimite: o.date_limite ?? undefined,
      idManuelle: o.id,
    }));
}

export type Favori = {
  id: string;
  type: TypeAnnonce;
  titre: string;
  lien: string;
  source: string | null;
  date_publication: string | null;
  date_limite: string | null;
};

export async function lireFavoris(supabase: ClientSupabase): Promise<Favori[]> {
  const { data } = await supabase
    .from("opportunites_favoris")
    .select("id, type, titre, lien, source, date_publication, date_limite")
    .order("created_at", { ascending: false })
    .returns<Favori[]>();
  return data ?? [];
}

// Lecture des sources automatiques d'« Opportunités » : flux RSS et API publiques.
//
// Chaque source est interrogée au plus une fois par heure (cache de Next.js) :
// les pages restent rapides, même sur une connexion lente.
// Une source en panne n'empêche jamais les autres de s'afficher.

import { DOMAINES, type Domaine } from "./domaines";

export type TypeAnnonce = "emploi" | "appel_offres" | "actualite";

export type Annonce = {
  type: TypeAnnonce;
  titre: string;
  lien: string;
  source: string;
  resume?: string;
  /** Date de publication, au format ISO. */
  date?: string;
  /** Date limite de candidature ou de dépôt, AAAA-MM-JJ. */
  dateLimite?: string;
  /** Identifiant d'une annonce ajoutée par un administrateur. */
  idManuelle?: string;
};

export type ResultatSource = {
  nom: string;
  annonces: Annonce[];
  erreur?: boolean;
};

const DUREE_CACHE = 3600; // secondes
const DELAI_MAX = 8000; // millisecondes

// ---------------------------------------------------------------------
// Texte
// ---------------------------------------------------------------------

/** Minuscules sans accents, pour comparer des mots. */
export function normaliser(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Vrai si l'un des mots commence un mot du texte (« agric » trouve « agricole »). */
export function contientUnMot(texte: string, mots: string[]): boolean {
  const t = normaliser(texte);
  return mots.some((mot) => {
    const m = normaliser(mot).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return m && new RegExp(`(^|[^a-z0-9])${m}`).test(t);
  });
}

const ENTITES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  eacute: "é", egrave: "è", ecirc: "ê", agrave: "à", acirc: "â", ccedil: "ç",
  ocirc: "ô", ucirc: "û", ugrave: "ù", icirc: "î", iuml: "ï", euml: "ë",
  rsquo: "’", lsquo: "‘", laquo: "«", raquo: "»", hellip: "…", ndash: "–", mdash: "—",
};

function decoderEntites(texte: string): string {
  return texte.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (tout, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : "";
    }
    return ENTITES[code.toLowerCase()] ?? tout;
  });
}

/** Texte brut d'un fragment XML ou HTML : sans CDATA, balises ni entités. */
export function texteBrut(fragment: string): string {
  const sansCdata = fragment.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  // Les flux encodent souvent le HTML du résumé : on décode, on retire les balises, on décode encore.
  const html = decoderEntites(sansCdata);
  return decoderEntites(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function couper(texte: string, longueur: number): string {
  return texte.length <= longueur ? texte : `${texte.slice(0, longueur - 1).trimEnd()}…`;
}

function dateIso(texte: string | undefined): string | undefined {
  if (!texte) return undefined;
  const temps = Date.parse(texte);
  return Number.isNaN(temps) ? undefined : new Date(temps).toISOString();
}

function lienValide(lien: string): boolean {
  return /^https?:\/\/\S+$/.test(lien) && lien.length <= 1000;
}

// ---------------------------------------------------------------------
// Flux RSS et Atom
// ---------------------------------------------------------------------

export type ElementFlux = {
  titre: string;
  lien: string;
  resume: string;
  date?: string;
  source?: string;
};

function balise(bloc: string, nom: string): string | undefined {
  const m = bloc.match(new RegExp(`<${nom}(?:\\s[^>]*)?>([\\s\\S]*?)</${nom}>`, "i"));
  return m?.[1];
}

/** Lit les éléments d'un flux RSS 2.0 ou Atom, sans bibliothèque. */
export function lireFlux(xml: string): ElementFlux[] {
  const blocs = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];

  const elements: ElementFlux[] = [];
  for (const bloc of blocs) {
    const titre = texteBrut(balise(bloc, "title") ?? "");
    let lien = texteBrut(balise(bloc, "link") ?? "");
    if (!lien) {
      // Atom : <link href="..."/>
      lien = decoderEntites(bloc.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? "");
    }
    if (!titre || !lienValide(lien)) continue;

    elements.push({
      titre,
      lien,
      resume: texteBrut(balise(bloc, "description") ?? balise(bloc, "summary") ?? balise(bloc, "content") ?? ""),
      date: dateIso(texteBrut(balise(bloc, "pubDate") ?? balise(bloc, "published") ?? balise(bloc, "updated") ?? balise(bloc, "dc:date") ?? "")),
      source: texteBrut(balise(bloc, "source") ?? "") || undefined,
    });
  }
  return elements;
}

async function telecharger(url: string): Promise<string> {
  const reponse = await fetch(url, {
    headers: { "User-Agent": "AGRIKEY-PME/1.0 (veille opportunites Mali)" },
    next: { revalidate: DUREE_CACHE },
    signal: AbortSignal.timeout(DELAI_MAX),
  });
  if (!reponse.ok) throw new Error(`${url} : HTTP ${reponse.status}`);
  return reponse.text();
}

/** Interroge une source sans jamais lever d'erreur : une panne donne une liste vide. */
async function sansPanne(nom: string, lecture: () => Promise<Annonce[]>): Promise<ResultatSource> {
  try {
    return { nom, annonces: await lecture() };
  } catch (erreur) {
    console.error(`Opportunités — source « ${nom} » indisponible :`, erreur instanceof Error ? erreur.message : erreur);
    return { nom, annonces: [], erreur: true };
  }
}

// ---------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------

const REQUETES: Record<TypeAnnonce, string> = {
  emploi: '("avis de recrutement" OR "offre d\'emploi" OR recrute OR recrutement OR "appel à candidatures")',
  appel_offres: '("appel d\'offres" OR "avis d\'appel" OR "manifestation d\'intérêt" OR "demande de cotation")',
  actualite: "",
};

/** Google Actualités : recherche en français, sur le Mali, des 30 derniers jours. */
function googleActualites(type: TypeAnnonce, domaines: Domaine[], motsLibres: string[]) {
  const sujets = [...domaines.flatMap((d) => d.recherche), ...motsLibres]
    .map((mot) => (mot.includes(" ") ? `"${mot}"` : mot));
  const parties = [REQUETES[type], "Mali", sujets.length ? `(${sujets.join(" OR ")})` : "", "when:30d"];
  const q = parties.filter(Boolean).join(" ");
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=fr&gl=ML&ceid=ML:fr`;

  return sansPanne("Google Actualités", async () =>
    lireFlux(await telecharger(url)).map((e) => {
      // Les titres finissent par « - Nom du journal » : on garde le nom à part.
      const fin = e.titre.match(/\s[-–]\s([^-–]+)$/);
      const source = e.source ?? fin?.[1]?.trim() ?? "Presse";
      const titre = fin && fin[1].trim() === source ? e.titre.slice(0, fin.index).trim() : e.titre;
      return {
        type,
        titre: couper(titre, 300),
        lien: e.lien,
        source: couper(source, 120),
        date: e.date,
        dateLimite: dateLimiteDansTexte(titre),
        // Le résumé de Google Actualités ne fait que répéter le titre.
      };
    })
  );
}

type AvisBanqueMondiale = {
  id?: string;
  bid_description?: string;
  project_name?: string;
  notice_type?: string;
  notice_status?: string;
  contact_organization?: string;
  submission_deadline_date?: string;
  noticedate?: string;
  submission_date?: string;
};

/** Banque mondiale : avis de passation de marchés des projets au Mali. */
function banqueMondiale() {
  const champs = [
    "id", "bid_description", "project_name", "notice_type", "notice_status", "contact_organization",
    "submission_deadline_date", "noticedate", "submission_date",
  ].join(",");
  const url =
    `https://search.worldbank.org/api/v2/procnotices?format=json&rows=50&os=0` +
    `&countryshortname_exact=Mali&srt=submission_date&order=desc&fl=${champs}`;

  return sansPanne("Banque mondiale", async () => {
    const donnees = JSON.parse(await telecharger(url)) as { procnotices?: AvisBanqueMondiale[] };
    const avis = Array.isArray(donnees.procnotices) ? donnees.procnotices : [];
    const annonces: Annonce[] = [];
    for (const a of avis) {
      if (!a.id || !/^[\w-]+$/.test(a.id)) continue;
      // Les avis d'attribution ne sont plus des opportunités.
      if (/award|attribution/i.test(a.notice_type ?? "")) continue;
      const titre = texteBrut(a.bid_description || a.project_name || "");
      if (!titre) continue;
      annonces.push({
        type: "appel_offres",
        titre: couper(titre, 300),
        lien: `https://projects.worldbank.org/fr/projects-operations/procurement-detail/${a.id}`,
        source: "Banque mondiale",
        resume: couper(
          [a.notice_type, a.project_name, a.contact_organization].map((t) => texteBrut(t ?? "")).filter(Boolean).join(" · "),
          400
        ),
        date: dateIso(a.submission_date ?? a.noticedate),
        dateLimite: dateIso(a.submission_deadline_date)?.slice(0, 10),
      });
    }
    return annonces;
  });
}

const MOIS: Record<string, number> = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8,
  septembre: 9, octobre: 10, novembre: 11, decembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
};

/** Cherche « Closing date: 12 Nov 2026 » ou « date limite : 12 novembre 2026 » dans un texte. */
export function dateLimiteDansTexte(texte: string): string | undefined {
  const t = normaliser(texte);
  const m = t.match(/(?:closing date|date limite|deadline|date de cloture)\s*:?\s*(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})/);
  if (!m) return undefined;
  const nomMois = Object.keys(MOIS).find((nom) => nom.startsWith(m[2]) && m[2].length >= 3);
  if (!nomMois) return undefined;
  return `${m[3]}-${String(MOIS[nomMois]).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

// ---------------------------------------------------------------------
// Assemblage
// ---------------------------------------------------------------------

/**
 * Annonces automatiques d'un type, pour les domaines choisis.
 * tousDomaines : ne pas filtrer par domaine (afficher tout ce qui concerne le Mali).
 */
export async function annoncesAutomatiques(
  type: TypeAnnonce,
  codesDomaines: string[],
  motsLibres: string[],
  tousDomaines: boolean
): Promise<ResultatSource[]> {
  const domaines = tousDomaines ? [] : DOMAINES.filter((d) => codesDomaines.includes(d.code));
  const libres = tousDomaines ? [] : motsLibres;
  const motsCles = [...domaines.flatMap((d) => d.motsCles), ...libres];

  // Les annonces des sources non filtrées à la recherche sont triées ici par domaine.
  const garderDomaine = (annonces: Annonce[]) =>
    motsCles.length === 0 ? annonces : annonces.filter((a) => contientUnMot(`${a.titre} ${a.resume ?? ""}`, motsCles));

  const sources: Promise<ResultatSource>[] = [googleActualites(type, domaines, libres)];
  if (type === "appel_offres") sources.push(banqueMondiale().then((r) => ({ ...r, annonces: garderDomaine(r.annonces) })));

  return Promise.all(sources);
}

/** Une annonce sans date limite est considérée comme valable ce nombre de jours après sa publication. */
export const JOURS_VALIDITE = 30;

/**
 * Vrai si l'annonce est encore valable :
 * - avec une date limite : jusqu'à cette date incluse ;
 * - sinon : publiée il y a moins de JOURS_VALIDITE jours (sans date du tout : écartée).
 */
export function estValable(annonce: Annonce, aujourdhui: string): boolean {
  if (annonce.dateLimite) return annonce.dateLimite >= aujourdhui;
  if (!annonce.date) return false;
  const age = Date.parse(`${aujourdhui}T23:59:59Z`) - Date.parse(annonce.date);
  return age <= JOURS_VALIDITE * 86_400_000;
}

/** Fusionne, retire les doublons et les annonces périmées, et trie (les plus récentes d'abord). */
export function fusionner(listes: Annonce[][], aujourdhui: string): Annonce[] {
  const vues = new Set<string>();
  const resultat: Annonce[] = [];
  for (const annonce of listes.flat()) {
    const cle = normaliser(annonce.titre).replace(/[^a-z0-9]/g, "").slice(0, 80);
    if (vues.has(annonce.lien) || vues.has(cle)) continue;
    if (!estValable(annonce, aujourdhui)) continue;
    vues.add(annonce.lien);
    vues.add(cle);
    resultat.push(annonce);
  }
  return resultat.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

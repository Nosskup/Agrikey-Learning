// Génération des affiches et logos (serveur uniquement : utilise les clés secrètes).
//  - Claude dessine l'affiche ou le logo en SVG : textes exacts, net à toute taille.
//  - Un générateur d'images (OpenAI) fournit, si demandé, une photo de fond.

import Anthropic from "@anthropic-ai/sdk";
import type { Entreprise } from "./session";
import type { Demande, Format, TypeCreation } from "./creations";

const MODELE_CLAUDE = "claude-opus-5-5";
const MODELE_IMAGE = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

// Marqueurs que Claude place dans le SVG ; remplacés ensuite par les vraies images.
const MARQUEUR_PHOTO = "PHOTO_FOND";
const MARQUEUR_LOGO = "LOGO_ENTREPRISE";

const TAILLE_MAX_LOGO = 1_500_000;

export function iaDisponible(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function photoDisponible(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Erreur dont le message peut être montré tel quel au membre. */
export class ErreurCreation extends Error {}

const SYSTEME = `Tu es le graphiste d'AGRIKEY PME, un outil pour les petites entreprises du Mali (boutiques, ateliers, restaurants, coopératives, prestataires).
Tu dessines des affiches publicitaires et des logos en SVG, prêts à partager sur WhatsApp et Facebook ou à imprimer.

Ce que tu rends :
- Uniquement le code SVG, de <svg à </svg>, sans explication ni bloc de code autour.
- Racine : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 L H" width="L" height="H"> avec les dimensions demandées.

Règles techniques (le SVG est converti en image dans le navigateur du téléphone) :
- Aucun script, aucun lien externe, aucune police à télécharger, pas de <foreignObject>.
- Police : font-family="Arial, Helvetica, sans-serif" partout (gras avec font-weight="700" ou "900").
- Pas d'émoji : dessine les icônes avec des formes (cercles, chemins, polygones).
- Les dégradés, ombres simples (filtres feDropShadow) et motifs sont permis.
- Chaque texte doit tenir dans l'image avec une marge d'au moins 6 % sur les bords. Coupe les lignes longues en plusieurs <text> ou <tspan>, et estime la largeur (environ 0,6 × taille de police par caractère en gras) pour qu'aucun mot ne déborde.

Règles de contenu :
- Recopie à l'identique, en français, les textes fournis (nom, titre, prix, dates, téléphone) : orthographe, accents, chiffres et montants en FCFA exacts. N'invente ni prix, ni date, ni numéro, ni adresse.
- Tu peux ajouter une courte accroche en français correct si elle sert le message, jamais une fausse promesse.
- Les visuels doivent parler à une clientèle malienne : couleurs vives et chaleureuses, lisibles de loin, contraste fort entre le texte et le fond.

Affiche :
- Une hiérarchie claire : un titre très gros, puis les détails, puis le nom de l'entreprise et le contact en bas.
- Si une photo est fournie : place-la avec <image href="${MARQUEUR_PHOTO}" x="0" y="0" width="L" height="H" preserveAspectRatio="xMidYMid slice"/> tout au fond, au-dessus d'un rectangle de couleur qui sert de secours, puis ajoute des bandes ou dégradés semi-opaques pour que les textes restent lisibles.
- Si un logo est fourni : place-le une seule fois avec <image href="${MARQUEUR_LOGO}" ... preserveAspectRatio="xMidYMid meet"/> dans un carré d'au moins 12 % de la largeur, sur un fond clair arrondi.

Logo :
- Un symbole simple et mémorable lié à l'activité, plus le nom de l'entreprise (et le slogan s'il est fourni), sur fond blanc.
- Formes plates et nettes, 2 ou 3 couleurs, lisible même tout petit. Pas de photo ni de dégradé complexe.`;

function lignes(entrees: [string, string | null | undefined][]): string {
  return entrees
    .filter(([, valeur]) => valeur && valeur.trim())
    .map(([cle, valeur]) => `- ${cle} : ${valeur!.trim()}`)
    .join("\n");
}

function consigne(
  type: TypeCreation,
  format: Format,
  demande: Demande,
  entreprise: Entreprise,
  avecPhoto: boolean,
  avecLogo: boolean
): string {
  const dimensions = `Dimensions : ${format.largeur} × ${format.hauteur} pixels (${format.libelle}).`;
  const couleur = demande.avecCouleur ? entreprise.couleur : null;

  if (type === "logo") {
    return [
      "Dessine un logo.",
      dimensions,
      lignes([
        ["Nom à écrire", demande.titre || entreprise.nom],
        ["Slogan", demande.slogan],
        ["Activité", entreprise.activite],
        ["Idée, style souhaité", demande.idee],
        ["Couleur principale à utiliser", couleur],
      ]),
    ].join("\n\n");
  }

  return [
    "Dessine une affiche.",
    dimensions,
    lignes([
      ["Ce qu'il faut annoncer", demande.idee],
      ["Titre principal", demande.titre],
      ["Détails (prix, date, lieu…)", demande.details],
      ["Entreprise", entreprise.nom],
      ["Activité", entreprise.activite],
      ["Téléphone", demande.avecContact ? entreprise.telephone : null],
      ["Adresse", demande.avecContact ? [entreprise.adresse, entreprise.ville].filter(Boolean).join(", ") : null],
      ["Couleur principale de l'entreprise", couleur],
    ]),
    avecPhoto
      ? `Une photo de fond est fournie : utilise <image href="${MARQUEUR_PHOTO}" .../> comme indiqué.`
      : "Pas de photo : compose avec des formes, des couleurs et des illustrations vectorielles.",
    avecLogo
      ? `Le logo de l'entreprise est fourni : utilise <image href="${MARQUEUR_LOGO}" .../> comme indiqué.`
      : "Pas de logo fourni : écris simplement le nom de l'entreprise.",
  ].join("\n\n");
}

async function dessinerSvg(texte: string): Promise<string> {
  const client = new Anthropic({ timeout: 240_000, maxRetries: 1 });

  let message;
  try {
    const flux = client.beta.messages.stream({
      model: MODELE_CLAUDE,
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: SYSTEME,
      messages: [{ role: "user", content: texte }],
    });
    message = await flux.finalMessage();
  } catch (erreur) {
    if (erreur instanceof Anthropic.RateLimitError) {
      throw new ErreurCreation("Le service de création est très demandé en ce moment. Réessayez dans une minute.");
    }
    if (erreur instanceof Anthropic.AuthenticationError || erreur instanceof Anthropic.PermissionDeniedError) {
      console.error("Clé Anthropic refusée :", erreur.message);
      throw new ErreurCreation("Le service de création n'est pas encore configuré. Prévenez AGRIKEY.");
    }
    if (erreur instanceof Anthropic.APIError) {
      console.error(`Erreur Anthropic ${erreur.status} :`, erreur.message);
    } else {
      console.error("Erreur Anthropic :", erreur);
    }
    throw new ErreurCreation("La création n'a pas abouti. Réessayez dans un instant.");
  }

  if (message.stop_reason === "refusal") {
    throw new ErreurCreation("Cette demande ne peut pas être réalisée. Reformulez votre idée et réessayez.");
  }

  const texteRendu = message.content
    .map((bloc) => (bloc.type === "text" ? bloc.text : ""))
    .join("");
  return texteRendu;
}

/** Photo de fond (JPEG en base64), ou null si elle n'a pas pu être créée. */
async function genererPhoto(demande: Demande, format: Format): Promise<string | null> {
  const consignePhoto = [
    `Photographie publicitaire réaliste et lumineuse pour une affiche : ${demande.idee}.`,
    demande.details ? `Contexte : ${demande.details}.` : "",
    "Scène au Mali, en Afrique de l'Ouest, personnes et décor locaux si des personnes apparaissent.",
    "Aucun texte, aucune lettre, aucun chiffre, aucun logo dans l'image.",
    "Laisser des zones calmes en haut et en bas pour y écrire des textes.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const reponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELE_IMAGE,
        prompt: consignePhoto,
        size: format.taillePhoto,
        quality: "medium",
        output_format: "jpeg",
        output_compression: 80,
        n: 1,
      }),
      signal: AbortSignal.timeout(180_000),
    });
    if (!reponse.ok) {
      console.error(`Erreur OpenAI ${reponse.status} :`, (await reponse.text()).slice(0, 500));
      return null;
    }
    const donnees = (await reponse.json()) as { data?: { b64_json?: string }[] };
    return donnees.data?.[0]?.b64_json ?? null;
  } catch (erreur) {
    console.error("Photo non générée :", erreur);
    return null;
  }
}

/** Logo de l'entreprise en data URI, seulement s'il vient de notre stockage. */
async function lireLogo(entreprise: Entreprise): Promise<string | null> {
  const prefixe = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos-entreprises/${entreprise.user_id}/`;
  if (!entreprise.logo_url?.startsWith(prefixe)) return null;
  try {
    const reponse = await fetch(entreprise.logo_url, { signal: AbortSignal.timeout(15_000) });
    const type = reponse.headers.get("content-type") ?? "";
    if (!reponse.ok || !/^image\/(png|jpeg|webp)$/.test(type)) return null;
    const contenu = Buffer.from(await reponse.arrayBuffer());
    if (contenu.length > TAILLE_MAX_LOGO) return null;
    return `data:${type};base64,${contenu.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Garde uniquement un SVG inoffensif : pas de script, pas d'événement, pas de lien
 * vers l'extérieur (seuls les liens internes « # » et nos marqueurs sont conservés).
 */
export function nettoyerSvg(brut: string, format: Format): string | null {
  const trouve = brut.match(/<svg[\s\S]*<\/svg>/i);
  if (!trouve) return null;

  let svg = trouve[0]
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script[^>]*\/>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<!ENTITY[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/@import[^;]*;?/gi, "")
    .replace(/url\(\s*(?!['"]?\s*#)[^)]*\)/gi, "none")
    .replace(/\s(?:xlink:)?href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, (tout, a?: string, b?: string) => {
      const valeur = (a ?? b ?? "").trim();
      return valeur.startsWith("#") || valeur === MARQUEUR_PHOTO || valeur === MARQUEUR_LOGO ? tout : "";
    });

  // Dimensions fixes sur la racine : sans elles, le navigateur dessinerait l'image floue.
  svg = svg.replace(/<svg\b[^>]*>/i, (racine) => {
    let attributs = racine
      .slice(4, -1)
      .replace(/\s(width|height|xmlns)\s*=\s*("[^"]*"|'[^']*')/gi, "")
      .replace(/\/\s*$/, "");
    const viewBox = /\sviewBox\s*=/i.test(attributs) ? "" : ` viewBox="0 0 ${format.largeur} ${format.hauteur}"`;
    attributs = ` xmlns="http://www.w3.org/2000/svg"${viewBox} width="${format.largeur}" height="${format.hauteur}"${attributs}`;
    return `<svg${attributs}>`;
  });

  if (!/xmlns:xlink=/.test(svg) && /xlink:href/.test(svg)) {
    svg = svg.replace(/<svg\b/i, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }
  return svg;
}

/** Remplace un marqueur par l'image, ou retire les éléments <image> qui l'utilisent. */
function placerImage(svg: string, marqueur: string, dataUri: string | null): string {
  if (dataUri) {
    return svg.replaceAll(`"${marqueur}"`, `"${dataUri}"`).replaceAll(`'${marqueur}'`, `'${dataUri}'`);
  }
  return svg
    .replace(new RegExp(`<image\\b[^>]*${marqueur}[^>]*>\\s*</image>`, "gi"), "")
    .replace(new RegExp(`<image\\b[^>]*${marqueur}[^>]*/?>`, "gi"), "");
}

export type Resultat = { svg: string; photoManquante: boolean };

/** Crée une affiche ou un logo et renvoie le SVG final, images comprises. */
export async function creerVisuel(
  type: TypeCreation,
  format: Format,
  demande: Demande,
  entreprise: Entreprise
): Promise<Resultat> {
  const avecPhoto = type === "affiche" && Boolean(demande.avecPhoto) && photoDisponible();
  const logo = type === "affiche" && demande.avecLogo ? await lireLogo(entreprise) : null;

  const [brut, photo] = await Promise.all([
    dessinerSvg(consigne(type, format, demande, entreprise, avecPhoto, Boolean(logo))),
    avecPhoto ? genererPhoto(demande, format) : Promise.resolve(null),
  ]);

  const nettoye = nettoyerSvg(brut, format);
  if (!nettoye) {
    throw new ErreurCreation("La création n'a pas abouti. Réessayez dans un instant.");
  }

  const svg = placerImage(
    placerImage(nettoye, MARQUEUR_PHOTO, photo ? `data:image/jpeg;base64,${photo}` : null),
    MARQUEUR_LOGO,
    logo
  );
  return { svg, photoManquante: avecPhoto && !photo };
}

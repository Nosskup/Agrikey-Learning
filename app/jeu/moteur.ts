// Moteur du jeu « Sira, une vie au Mali ».
// Le jeu est entièrement décrit par des données (voir evenements.ts) :
// chaque tour correspond à un âge, et à chaque âge un événement est tiré.

export type Sexe = "fille" | "garcon";
export type Milieu = "ville" | "village";
export type Origine = "pauvre" | "modeste" | "aisee";

export type CleJauge =
  | "sante"
  | "savoir"
  | "moyens"
  | "moral"
  | "famille"
  | "respect";

export type Jauges = Record<CleJauge, number>;

export const LIBELLES_JAUGES: Record<CleJauge, { nom: string; icone: string }> =
  {
    sante: { nom: "Santé", icone: "❤️" },
    savoir: { nom: "Savoir", icone: "📚" },
    moyens: { nom: "Moyens", icone: "💰" },
    moral: { nom: "Moral", icone: "🙂" },
    famille: { nom: "Famille", icone: "🏠" },
    respect: { nom: "Respect (danbe)", icone: "🤝" },
  };

export type Valeur = string | number | boolean;

export type Etat = {
  prenom: string;
  nomFamille: string;
  sexe: Sexe;
  region: string;
  milieu: Milieu;
  origine: Origine;
  age: number;
  tour: number;
  jauges: Jauges;
  drapeaux: Record<string, Valeur>;
  vus: string[];
  journal: { age: number; texte: string }[];
  fini: boolean;
};

export type Consequence = {
  effets?: Partial<Jauges>;
  drapeaux?: Record<string, Valeur>;
  resultat: string | ((e: Etat) => string);
};

export type Choix = Consequence & {
  texte: string | ((e: Etat) => string);
  condition?: (e: Etat) => boolean;
  // Si « alea » est présent, la réussite dépend d'une probabilité
  // et les effets/résultat de base sont remplacés par ceux de l'issue.
  alea?: {
    chance: (e: Etat) => number;
    succes: Consequence;
    echec: Consequence;
  };
};

export type Evenement = {
  id: string;
  ages: [number, number];
  // Un événement « clé » est une étape obligatoire de la vie
  // (rentrée, DEF, Bac...). Les autres sont tirés au hasard.
  cle?: boolean;
  repetable?: boolean;
  condition?: (e: Etat) => boolean;
  titre: string;
  texte: string | ((e: Etat) => string);
  choix: Choix[];
};

// Âges auxquels le joueur doit faire un choix.
export const AGES_DES_TOURS = [
  6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
];

export const AGE_FINAL = 25;

// ---------- Utilitaires ----------

export function borner(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function txt(valeur: string | ((e: Etat) => string), e: Etat): string {
  return genrer(e, typeof valeur === "function" ? valeur(e) : valeur);
}

// Accorde les formes inclusives selon le sexe du personnage :
// « admis·e » → « admis » / « admise », « trésorier·ère » → « trésorier » /
// « trésorière », « sérieux·se » → « sérieux » / « sérieuse ».
export function genrer(e: Etat, texte: string): string {
  return texte.replace(/([\p{L}-]+)·(ère|se|e)\b/gu, (_, base: string, suffixe: string) => {
    if (e.sexe !== "fille") return base;
    if (suffixe === "ère") return base.replace(/er$/, "ère");
    if (suffixe === "se") return base.replace(/x$/, "se");
    return base + "e";
  });
}

export const estFille = (e: Etat) => e.sexe === "fille";
export const accord = (e: Etat, masc: string, fem: string) =>
  e.sexe === "fille" ? fem : masc;
export const d = (e: Etat, cle: string) => e.drapeaux[cle];

function hasard<T>(liste: T[]): T {
  return liste[Math.floor(Math.random() * liste.length)];
}

// ---------- Création du personnage ----------

export const REGIONS: { nom: string; milieu: Milieu; description: string }[] = [
  {
    nom: "Bamako",
    milieu: "ville",
    description: "La capitale, ses SOTRAMA, ses embouteillages et ses grins.",
  },
  {
    nom: "un village près de Ségou",
    milieu: "village",
    description: "Le long du fleuve Niger, terre de riz et de mil.",
  },
  {
    nom: "Sikasso",
    milieu: "ville",
    description: "Le grenier du Mali : mangues, coton et maraîchage.",
  },
  {
    nom: "un village du cercle de Kayes",
    milieu: "village",
    description:
      "Pays soninké, où beaucoup d'hommes sont partis à l'aventure en France.",
  },
  {
    nom: "Sévaré, près de Mopti",
    milieu: "ville",
    description: "Carrefour du centre, entre fleuve, élevage et insécurité.",
  },
  {
    nom: "un village de la région de Koulikoro",
    milieu: "village",
    description: "Champs de mil, de sorgho et d'arachide, à quelques heures de Bamako.",
  },
];

export const PRENOMS: Record<Sexe, string[]> = {
  fille: [
    "Aminata", "Fatoumata", "Kadiatou", "Mariam", "Oumou", "Awa",
    "Assitan", "Djeneba", "Rokia", "Hawa", "Nana", "Salimata",
  ],
  garcon: [
    "Moussa", "Bakary", "Seydou", "Oumar", "Mamadou", "Adama",
    "Drissa", "Souleymane", "Lassana", "Boubacar", "Modibo", "Issa",
  ],
};

export const NOMS = [
  "Traoré", "Coulibaly", "Diarra", "Keïta", "Konaté", "Sangaré",
  "Diallo", "Touré", "Cissé", "Sidibé", "Dembélé", "Camara", "Doumbia",
];

export function prenomAuHasard(sexe: Sexe) {
  return hasard(PRENOMS[sexe]);
}
export function nomAuHasard() {
  return hasard(NOMS);
}

export function nouvellePartie(
  prenom: string,
  nomFamille: string,
  sexe: Sexe,
  regionIndex: number,
): Etat {
  const region = REGIONS[regionIndex];
  const tirage = Math.random();
  const origine: Origine =
    tirage < 0.4 ? "pauvre" : tirage < 0.85 ? "modeste" : "aisee";

  const base: Jauges = {
    sante: 70,
    savoir: 20,
    moyens: origine === "pauvre" ? 10 : origine === "modeste" ? 30 : 60,
    moral: 60,
    famille: 60,
    respect: 40,
  };

  const metierParent = hasard(
    region.milieu === "village"
      ? ["cultivateur", "éleveur", "pêcheur", "forgeron"]
      : ["commerçant", "chauffeur de SOTRAMA", "fonctionnaire", "tailleur"],
  );

  const etat: Etat = {
    prenom,
    nomFamille,
    sexe,
    region: region.nom,
    milieu: region.milieu,
    origine,
    age: 0,
    tour: 0,
    jauges: base,
    drapeaux: {
      metierParent,
      freres: 2 + Math.floor(Math.random() * 5),
      polygamie: Math.random() < 0.35,
    },
    vus: [],
    journal: [],
    fini: false,
  };

  etat.journal.push({ age: 0, texte: recitNaissance(etat) });
  return etat;
}

export function recitNaissance(e: Etat) {
  const famille =
    e.origine === "pauvre"
      ? "une famille qui vit au jour le jour"
      : e.origine === "modeste"
        ? "une famille modeste"
        : "une famille plutôt à l'aise";
  const concession = e.drapeaux.polygamie
    ? "Ton père a deux épouses, et la concession est pleine d'enfants."
    : "La concession est animée par les oncles, les tantes et les cousins.";
  return (
    `Tu es ${accord(e, "né", "née")} à ${e.region}, dans ${famille}. ` +
    `Ton père est ${e.drapeaux.metierParent}. ${concession} ` +
    `Le septième jour, lors du baptême, l'imam t'a ${accord(e, "nommé", "nommée")} ` +
    `${e.prenom} ${e.nomFamille}. Tu as ${e.drapeaux.freres} frères et sœurs.`
  );
}

// ---------- Déroulement ----------

export function evenementDuTour(e: Etat, tous: Evenement[]): Evenement {
  const eligibles = tous.filter(
    (ev) =>
      e.age >= ev.ages[0] &&
      e.age <= ev.ages[1] &&
      (ev.repetable || !e.vus.includes(ev.id)) &&
      (!ev.condition || ev.condition(e)),
  );

  // Les étapes clés passent en priorité, la plus ancienne d'abord.
  const cles = eligibles
    .filter((ev) => ev.cle)
    .sort((a, b) => a.ages[0] - b.ages[0]);
  if (cles.length > 0) return cles[0];

  const autres = eligibles.filter((ev) => !ev.cle);
  if (autres.length > 0) return hasard(autres);

  return ANNEE_CALME;
}

export function choixDisponibles(ev: Evenement, e: Etat) {
  return ev.choix.filter((c) => !c.condition || c.condition(e));
}

export type Issue = {
  etat: Etat;
  resultat: string;
  variations: Partial<Jauges>;
  reussite?: boolean;
};

export function appliquerChoix(e: Etat, ev: Evenement, choix: Choix): Issue {
  let consequence: Consequence = choix;
  let reussite: boolean | undefined;

  if (choix.alea) {
    const p = Math.max(0.05, Math.min(0.95, choix.alea.chance(e)));
    reussite = Math.random() < p;
    consequence = reussite ? choix.alea.succes : choix.alea.echec;
  }

  const jauges = { ...e.jauges };
  const variations: Partial<Jauges> = {};
  for (const [cle, delta] of Object.entries(consequence.effets ?? {})) {
    const k = cle as CleJauge;
    const avant = jauges[k];
    jauges[k] = borner(avant + (delta ?? 0));
    variations[k] = jauges[k] - avant;
  }

  const drapeaux = { ...e.drapeaux, ...(choix.drapeaux ?? {}), ...(consequence.drapeaux ?? {}) };

  let suivant: Etat = {
    ...e,
    jauges,
    drapeaux,
    vus: ev.repetable ? e.vus : [...e.vus, ev.id],
  };

  let resultat = txt(consequence.resultat, suivant);

  // Filet de sécurité : la santé ne tombe jamais à zéro sans conséquence.
  if (suivant.jauges.sante <= 5) {
    suivant.jauges = {
      ...suivant.jauges,
      sante: 30,
      moyens: borner(suivant.jauges.moyens - 15),
      famille: borner(suivant.jauges.famille + 5),
    };
    resultat +=
      " Épuisé, ton corps lâche : tu passes plusieurs semaines à l'hôpital. " +
      "La famille se cotise pour payer les ordonnances, et tu t'en sors.";
  }

  suivant.journal = [
    ...e.journal,
    { age: e.age, texte: `${ev.titre} — ${resultat}` },
  ];

  suivant = avancer(suivant);
  return { etat: suivant, resultat, variations, reussite };
}

function avancer(e: Etat): Etat {
  const tour = e.tour + 1;
  if (tour >= AGES_DES_TOURS.length) {
    return { ...e, tour, age: AGE_FINAL, fini: true };
  }
  return { ...e, tour, age: AGES_DES_TOURS[tour] };
}

export function demarrer(e: Etat): Etat {
  return { ...e, tour: 0, age: AGES_DES_TOURS[0] };
}

const ANNEE_CALME: Evenement = {
  id: "annee-calme",
  ages: [0, 99],
  repetable: true,
  titre: "Une année ordinaire",
  texte:
    "Les saisons passent : l'harmattan, la chaleur d'avril, puis l'hivernage. Comment occupes-tu ton temps libre ?",
  choix: [
    {
      texte: "Aider à la maison et rendre visite aux anciens",
      effets: { famille: 6, respect: 4 },
      resultat: "Les vieux te bénissent : « Allah ka nɛɛma caya ! »",
    },
    {
      texte: "Lire et apprendre par toi-même",
      effets: { savoir: 6, moral: 2 },
      resultat: "Tu empruntes des livres et regardes des tutoriels. Ta tête se remplit.",
    },
    {
      texte: "Faire de petits boulots",
      effets: { moyens: 7, sante: -2 },
      resultat: "Quelques billets en poche, un peu de fatigue en plus.",
    },
  ],
};

// ---------- Fin de partie ----------

export type Bilan = {
  titre: string;
  paragraphes: string[];
  score: number;
};

export function bilanDeVie(e: Etat, metier?: string): Bilan {
  const j = e.jauges;
  const p: string[] = [];
  const etudes = e.drapeaux.etudes as string | undefined;

  p.push(
    `À 25 ans, ${e.prenom} ${e.nomFamille} regarde le chemin parcouru depuis ${e.region}.`,
  );

  if (etudes) p.push(`Côté études : ${etudes}.`);
  if (metier) p.push(`Aujourd'hui, tu es ${metier}.`);
  else
    p.push(
      "Tu n'as pas encore trouvé de situation stable, comme beaucoup de jeunes de ton âge. Mais rien n'est figé.",
    );

  if (e.drapeaux.marie)
    p.push(
      `Tu es ${accord(e, "marié", "mariée")}${e.drapeaux.enfants ? " et tu as un enfant" : ""}.`,
    );
  if (e.drapeaux.migrant)
    p.push(
      `Tu vis loin du pays (${e.drapeaux.migrant}) et tu envoies de l'argent à la famille dès que tu peux.`,
    );
  if (e.drapeaux.association)
    p.push("Dans ton quartier, on te connaît pour ton engagement associatif.");

  if (j.famille >= 80)
    p.push(`La famille est fière de toi : tu es ${accord(e, "devenu", "devenue")} un pilier de la concession.`);
  else if (j.famille <= 30)
    p.push("Les liens avec la famille se sont distendus. Il faudra du temps pour les retisser.");

  if (j.moral >= 70) p.push("Tu te sens en paix avec tes choix.");
  else if (j.moral <= 30)
    p.push("Tu portes beaucoup de fatigue et de doutes. Prends soin de toi.");

  const paragraphes = p.map((x) => genrer(e, x));
  const score = Math.round(
    (j.sante + j.savoir + j.moyens + j.moral + j.famille + j.respect) / 6,
  );

  let titre: string;
  if (metier && j.moyens >= 60 && j.respect >= 70) titre = "Une réussite reconnue";
  else if (j.famille >= 90 && j.respect >= 80) titre = "Le pilier de la famille";
  else if (j.savoir >= 75) titre = "L'esprit savant";
  else if (e.drapeaux.migrant) titre = accord(e, "L'aventurier", "L'aventurière");
  else if (j.moral >= 70) titre = "Une vie simple et heureuse";
  else if (score >= 45) titre = "Un chemin en construction";
  else titre = "Une jeunesse difficile";

  return { titre, paragraphes, score };
}

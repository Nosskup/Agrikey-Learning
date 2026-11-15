// Moteur du jeu « Dakan : destin ».
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

// ---------- Traits de caractère ----------
// Les traits naissent de tes choix et pèsent ensuite sur toute ta vie :
// ils modifient tes chances de réussite et tes jauges chaque année.

export type Domaine = "etudes" | "affaires" | "risque" | "social";

export type CleTrait =
  | "studieux"
  | "debrouillard"
  | "pieux"
  | "solidaire"
  | "audacieux"
  | "integre"
  | "rebelle"
  | "prevoyant"
  | "resilient";

export const TRAITS: Record<
  CleTrait,
  {
    nom: [string, string];
    icone: string;
    effet: string;
    bonus?: Partial<Record<Domaine, number>>;
    parAn?: Partial<Jauges>;
  }
> = {
  studieux: {
    nom: ["Studieux", "Studieuse"],
    icone: "📖",
    effet: "+12 % de réussite aux examens et concours, +1 Savoir par an",
    bonus: { etudes: 0.12 },
    parAn: { savoir: 1 },
  },
  debrouillard: {
    nom: ["Débrouillard", "Débrouillarde"],
    icone: "🛠️",
    effet: "+12 % de réussite dans les affaires, +1 Moyens par an",
    bonus: { affaires: 0.12 },
    parAn: { moyens: 1 },
  },
  pieux: {
    nom: ["Pieux", "Pieuse"],
    icone: "🕌",
    effet: "+1 Respect et +1 Moral par an",
    parAn: { respect: 1, moral: 1 },
  },
  solidaire: {
    nom: ["Solidaire", "Solidaire"],
    icone: "🤲",
    effet: "+10 % quand tu as besoin des autres, +1 Famille par an",
    bonus: { social: 0.1 },
    parAn: { famille: 1 },
  },
  audacieux: {
    nom: ["Audacieux", "Audacieuse"],
    icone: "🔥",
    effet: "+12 % de réussite quand tu prends des risques",
    bonus: { risque: 0.12 },
  },
  integre: {
    nom: ["Intègre", "Intègre"],
    icone: "⚖️",
    effet: "+2 Respect par an : ta parole a de la valeur",
    parAn: { respect: 2 },
  },
  rebelle: {
    nom: ["Rebelle", "Rebelle"],
    icone: "✊",
    effet: "+2 Moral mais -1 Famille par an : tu suis ta propre voie",
    parAn: { moral: 2, famille: -1 },
  },
  prevoyant: {
    nom: ["Prévoyant", "Prévoyante"],
    icone: "🧮",
    effet: "+2 Moyens par an grâce à l'épargne",
    parAn: { moyens: 2 },
  },
  resilient: {
    nom: ["Résilient", "Résiliente"],
    icone: "🌱",
    effet: "Né des échecs : +8 % de réussite partout, +1 Moral par an",
    bonus: { etudes: 0.08, affaires: 0.08, risque: 0.08, social: 0.08 },
    parAn: { moral: 1 },
  },
};

export function nomTrait(e: { sexe: Sexe }, t: CleTrait) {
  return TRAITS[t].nom[e.sexe === "fille" ? 1 : 0];
}

// Domaine par défaut des événements existants (pour les bonus de traits).
const DOMAINE_PAR_EVENEMENT: Record<string, Domaine> = {
  "premier-classe": "etudes",
  def: "etudes",
  "apres-def-echec": "etudes",
  bac: "etudes",
  "bac-echec": "etudes",
  "apres-bac": "etudes",
  diplome: "etudes",
  entreprise: "affaires",
  agriculture: "affaires",
  orpaillage: "risque",
  aventure: "risque",
  "exode-fille": "risque",
  "accident-moto": "risque",
  pretendant: "social",
};

export type NomScene =
  | "village"
  | "ville"
  | "ecole"
  | "classe"
  | "mosquee"
  | "champ"
  | "fleuve"
  | "marche"
  | "sante"
  | "nuit"
  | "desert"
  | "fete"
  | "mine"
  | "concession"
  | "pluie"
  | "diplome"
  | "atelier";

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
  journal: EntreeJournal[];
  traits: CleTrait[];
  echecs: number;
  fini: boolean;
};

export type EntreeJournal = {
  age: number;
  texte: string;
  titre?: string;
  majeur?: boolean;
  scene?: NomScene;
};

export type Consequence = {
  effets?: Partial<Jauges>;
  // Pour les décisions qui changent le lieu de vie.
  demenager?: { region: string; milieu: Milieu };
  drapeaux?: Record<string, Valeur>;
  resultat: string | ((e: Etat) => string);
};

export type Choix = Consequence & {
  texte: string | ((e: Etat) => string);
  // Traits de caractère gagnés en faisant ce choix.
  traits?: CleTrait[];
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
  // Une décision majeure change durablement la trajectoire de vie.
  majeur?: boolean;
  // Un écho est la conséquence, des années plus tard, d'un choix passé.
  echo?: boolean;
  domaine?: Domaine;
  scene?: NomScene | ((e: Etat) => NomScene);
};

// Âges auxquels le joueur doit faire un choix.
export const AGES_DES_TOURS = [
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
];

export const AGE_FINAL = 25;

// ---------- Utilitaires ----------

export function borner(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Rendements décroissants : au-dessus de 70, les gains comptent pour moitié.
// Plus on est haut, plus il est difficile de monter encore.
export function ajouterA(valeur: number, delta: number) {
  if (delta > 0 && valeur >= 70) return borner(valeur + Math.ceil(delta / 2));
  return borner(valeur + delta);
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
    traits: [],
    echecs: 0,
    fini: false,
  };

  etat.journal.push({
    age: 0,
    titre: "La naissance",
    texte: recitNaissance(etat),
    scene: "concession",
  });
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

  // Les étapes clés et les échos du passé passent en priorité,
  // la plus ancienne d'abord.
  const cles = eligibles
    .filter((ev) => ev.cle || ev.echo)
    .sort((a, b) => a.ages[0] - b.ages[0]);
  if (cles.length > 0) return cles[0];

  const autres = eligibles.filter((ev) => !ev.cle && !ev.echo);
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
  chance?: number;
  nouveauxTraits: CleTrait[];
  // Ce qui a changé dans ta situation (métier, mariage, lieu de vie…).
  changements: string[];
  // Les effets du temps qui passe jusqu'au prochain tour.
  annee: string[];
};

export function domaineDe(ev: Evenement): Domaine | undefined {
  return ev.domaine ?? DOMAINE_PAR_EVENEMENT[ev.id];
}

export function bonusTraits(e: Etat, domaine?: Domaine) {
  if (!domaine) return 0;
  return (e.traits ?? []).reduce(
    (total, t) => total + (TRAITS[t].bonus?.[domaine] ?? 0),
    0,
  );
}

export function probabilite(e: Etat, ev: Evenement, choix: Choix) {
  if (!choix.alea) return undefined;
  const p = choix.alea.chance(e) + bonusTraits(e, domaineDe(ev));
  return Math.max(0.05, Math.min(0.95, p));
}

export function sceneDe(ev: Evenement, e: Etat): NomScene {
  if (ev.scene) return typeof ev.scene === "function" ? ev.scene(e) : ev.scene;
  return e.milieu === "village" ? "village" : "ville";
}

export function appliquerChoix(e: Etat, ev: Evenement, choix: Choix): Issue {
  let consequence: Consequence = choix;
  let reussite: boolean | undefined;
  const chance = probabilite(e, ev, choix);

  if (choix.alea && chance !== undefined) {
    reussite = Math.random() < chance;
    consequence = reussite ? choix.alea.succes : choix.alea.echec;
  }

  const jauges = { ...e.jauges };
  const variations: Partial<Jauges> = {};
  for (const [cle, delta] of Object.entries(consequence.effets ?? {})) {
    const k = cle as CleJauge;
    const avant = jauges[k];
    jauges[k] = ajouterA(avant, delta ?? 0);
    variations[k] = jauges[k] - avant;
  }

  const drapeaux = { ...e.drapeaux, ...(choix.drapeaux ?? {}), ...(consequence.drapeaux ?? {}) };

  // Traits gagnés : ceux du choix, plus « résilient » après deux échecs.
  const traitsAvant = e.traits ?? [];
  const echecs = (e.echecs ?? 0) + (reussite === false ? 1 : 0);
  const gagnes = [...(choix.traits ?? [])];
  if (echecs >= 2) gagnes.push("resilient");
  const nouveauxTraits = [...new Set(gagnes)].filter(
    (t) => !traitsAvant.includes(t),
  );

  const suivant: Etat = {
    ...e,
    jauges,
    drapeaux,
    traits: [...traitsAvant, ...nouveauxTraits],
    echecs,
    vus: ev.repetable ? e.vus : [...e.vus, ev.id],
  };
  const demenagement = consequence.demenager ?? choix.demenager;
  if (demenagement) {
    suivant.drapeaux.regionNatale = e.region;
    suivant.region = demenagement.region;
    suivant.milieu = demenagement.milieu;
  }

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
    {
      age: e.age,
      titre: genrer(e, ev.titre),
      texte: resultat,
      majeur: ev.majeur,
      scene: sceneDe(ev, e),
    },
  ];

  const changements = changementsDeSituation(e, suivant);
  const { etat: vieilli, messages } = avancer(suivant);
  return {
    etat: vieilli,
    resultat,
    variations,
    reussite,
    chance,
    nouveauxTraits,
    changements,
    annee: messages,
  };
}

function changementsDeSituation(avant: Etat, apres: Etat): string[] {
  const c: string[] = [];
  const a = avant.drapeaux;
  const b = apres.drapeaux;
  const f = (m: string, w: string) => accord(apres, m, w);
  if (b.metier && b.metier !== a.metier) c.push("💼 Tu as désormais un métier.");
  if (b.marie && !a.marie) c.push(`💍 Tu es ${f("marié", "mariée")}.`);
  if (b.enfants && !a.enfants) c.push("👶 Tu es devenu·e parent.");
  if (b.migrant && b.migrant !== a.migrant) c.push(`✈️ Tu vis désormais ${b.migrant}.`);
  if (!b.migrant && a.migrant) c.push("🏠 Tu es de retour au pays.");
  if (apres.milieu !== avant.milieu) c.push(`🏙️ Tu vis désormais à ${apres.region}.`);
  if (a.enEcole && !b.enEcole && !b.metier) c.push("🎒 Ta scolarité s'arrête ici.");
  if (b.bac === true && a.bac !== true) c.push("🎓 Tu es bachelier·ère.");
  if (b.ami && !a.ami) c.push(`🤝 ${b.ami} entre dans ta vie.`);
  if (b.mentor && !a.mentor) c.push("🧑🏿‍🏫 Tu as un mentor.");
  return c.map((x) => genrer(apres, x));
}

// Les effets du temps : ta situation pèse sur tes jauges chaque année.
function passifs(e: Etat): { effets: Partial<Jauges>; messages: string[] } {
  const effets: Partial<Jauges> = {};
  const messages: string[] = [];
  const ajouter = (delta: Partial<Jauges>, message?: string) => {
    for (const [k, v] of Object.entries(delta)) {
      const cle = k as CleJauge;
      effets[cle] = (effets[cle] ?? 0) + (v ?? 0);
    }
    if (message) messages.push(message);
  };
  const dr = e.drapeaux;

  if (dr.enEcole) ajouter({ savoir: 1 }, "🎒 L'école te fait progresser (+1 Savoir).");
  if (dr.metier) ajouter({ moyens: 3 }, "💼 Ton travail te fait vivre (+3 Moyens).");
  if (dr.migrant)
    ajouter({ famille: 2, moral: -2 }, "✈️ Tes transferts aident la famille, mais l'exil pèse (+2 Famille, -2 Moral).");
  if (dr.enfants) ajouter({ moyens: -3, moral: 2 }, "👶 Élever un enfant coûte cher, mais quel bonheur (-3 Moyens, +2 Moral).");
  if (dr.mariagePrecoce && e.age < 21)
    ajouter({ savoir: -1, sante: -2 }, "💔 Le mariage précoce freine ta jeunesse (-1 Savoir, -2 Santé).");
  if (e.age >= 17)
    ajouter({ moyens: -4, sante: -1 }, "🧾 La vie d'adulte coûte cher et fatigue (-4 Moyens, -1 Santé).");
  if (e.jauges.moyens < 12)
    ajouter({ sante: -3 }, "🍚 La pauvreté pèse sur ta santé (-3 Santé).");
  if (e.jauges.moral < 20)
    ajouter({ sante: -2 }, "🌧️ Le découragement use ton corps (-2 Santé).");

  const parTraits: Partial<Jauges> = {};
  for (const t of e.traits ?? []) {
    for (const [k, v] of Object.entries(TRAITS[t].parAn ?? {})) {
      const cle = k as CleJauge;
      parTraits[cle] = (parTraits[cle] ?? 0) + (v ?? 0);
    }
  }
  if (Object.keys(parTraits).length > 0) ajouter(parTraits, "✨ Ton caractère façonne ta vie (effets de tes traits).");

  return { effets, messages };
}

function avancer(e: Etat): { etat: Etat; messages: string[] } {
  const tour = e.tour + 1;
  if (tour >= AGES_DES_TOURS.length) {
    return { etat: { ...e, tour, age: AGE_FINAL, fini: true }, messages: [] };
  }
  const { effets, messages } = passifs(e);
  const jauges = { ...e.jauges };
  for (const [k, v] of Object.entries(effets)) {
    const cle = k as CleJauge;
    jauges[cle] = ajouterA(jauges[cle], v ?? 0);
  }
  return {
    etat: { ...e, jauges, tour, age: AGES_DES_TOURS[tour] },
    messages: messages.map((m) => genrer(e, m)),
  };
}

export function demarrer(e: Etat): Etat {
  return { ...e, tour: 0, age: AGES_DES_TOURS[0], traits: e.traits ?? [], echecs: e.echecs ?? 0 };
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
    `À 25 ans, ${e.prenom} ${e.nomFamille} regarde le chemin parcouru depuis ${e.drapeaux.regionNatale ?? e.region}.`,
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
  if (e.drapeaux.ami)
    p.push(
      e.drapeaux.amiDestin
        ? `${e.drapeaux.ami}, ton ami·e d'enfance : ${e.drapeaux.amiDestin}`
        : `${e.drapeaux.ami}, ton ami·e d'enfance, est toujours à tes côtés.`,
    );
  if (e.drapeaux.triche)
    p.push("Au fond de toi, le souvenir des sujets achetés au Bac ne s'efface pas tout à fait.");
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

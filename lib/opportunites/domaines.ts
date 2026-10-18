// Domaines suivis dans « Opportunités ».
//
// Pour ajouter un domaine, ajouter un objet à la liste DOMAINES :
//   - code      : identifiant court, sans espace ni accent (enregistré dans la base) ;
//   - libelle   : nom affiché ;
//   - recherche : 2 ou 3 mots envoyés à la recherche d'actualités (Google Actualités) ;
//   - motsCles  : début de mots cherchés dans le titre et le résumé des annonces des
//                 autres sources (« agric » trouve « agriculture » et « agricole » ;
//                 accents et majuscules ignorés ; français et anglais, car certaines
//                 annonces des bailleurs sont en anglais).

export type Domaine = {
  code: string;
  libelle: string;
  icone: string;
  recherche: string[];
  motsCles: string[];
};

export const DOMAINES: Domaine[] = [
  {
    code: "agriculture",
    libelle: "Agriculture et élevage",
    icone: "🌾",
    recherche: ["agriculture", "élevage", "agricole"],
    motsCles: [
      "agric", "agro", "élevage", "éleveur", "pastoral", "bétail", "semence",
      "engrais", "irrigation", "maraîch", "riz", "coton", "céréale", "pêche", "pisciculture",
      "aviculture", "vétérinaire", "farm", "livestock", "crop", "seed", "fertilizer", "food security",
      "sécurité alimentaire", "rural",
    ],
  },
  {
    code: "agroalimentaire",
    libelle: "Transformation et agroalimentaire",
    icone: "🥫",
    recherche: ["agroalimentaire", "transformation agricole"],
    motsCles: [
      "agroalimentaire", "agro-alimentaire", "transformation", "chaîne de valeur", "chaine de valeur",
      "filière", "karité", "mangue", "anacarde", "lait", "value chain", "agribusiness", "agro-industr",
    ],
  },
  {
    code: "environnement",
    libelle: "Environnement, eau et climat",
    icone: "💧",
    recherche: ["environnement", "climat", "eau potable"],
    motsCles: [
      "environnement", "climat", "eau potable", "assainissement", "forêt", "forestier",
      "reboisement", "désertification", "biodiversité", "énergie solaire", "solaire", "wash",
      "water", "climate", "environment", "sanitation", "resilien", "résilien",
    ],
  },
  {
    code: "entrepreneuriat",
    libelle: "Entrepreneuriat et PME",
    icone: "🏪",
    recherche: ["entrepreneuriat", "PME", "jeunes entrepreneurs"],
    motsCles: [
      "entrepreneur", "pme", "start-up", "startup", "incubat", "auto-emploi", "insertion",
      "emploi des jeunes", "financement", "subvention", "secteur privé", "private sector", "sme",
      "small business", "business",
    ],
  },
  {
    code: "formation",
    libelle: "Formation et éducation",
    icone: "🎓",
    recherche: ["formation professionnelle", "éducation"],
    motsCles: [
      "formation", "formateur", "éducation", "enseignement", "école", "apprentissage", "renforcement des capacités",
      "training", "education", "capacity building", "bourse",
    ],
  },
  {
    code: "finance",
    libelle: "Finance et microfinance",
    icone: "🏦",
    recherche: ["microfinance", "banque", "finance"],
    motsCles: [
      "finance", "microfinance", "banque", "crédit", "comptab", "audit", "fiscal", "inclusion financière",
      "accountant", "financial", "banking", "credit",
    ],
  },
  {
    code: "numerique",
    libelle: "Numérique et informatique",
    icone: "💻",
    recherche: ["numérique", "informatique", "digital"],
    motsCles: [
      "numérique", "informatique", "digital", "logiciel", "développeur", "data", "télécom", "internet",
      "système d'information", "software", "it officer", "ict", "technolog",
    ],
  },
  {
    code: "btp",
    libelle: "BTP et infrastructures",
    icone: "🏗️",
    recherche: ["BTP", "travaux", "infrastructures"],
    motsCles: [
      "btp", "travaux", "construction", "réhabilitation", "route", "piste", "bâtiment", "génie civil",
      "infrastructure", "barrage", "forage", "works", "civil engineering", "rehabilitation",
    ],
  },
  {
    code: "sante",
    libelle: "Santé et nutrition",
    icone: "🩺",
    recherche: ["santé", "nutrition"],
    motsCles: [
      "santé", "médical", "nutrition", "hôpital", "pharmac", "infirmier", "health",
      "malnutrition", "médecin",
    ],
  },
  {
    code: "humanitaire",
    libelle: "Humanitaire et développement",
    icone: "🤝",
    recherche: ["ONG", "humanitaire", "développement"],
    motsCles: [
      "ong", "humanitaire", "humanitarian", "développement", "development", "suivi-évaluation",
      "suivi et évaluation", "monitoring", "protection", "cohésion sociale", "relèvement",
    ],
  },
];

/** Domaines proposés tant que le membre n'a rien choisi (cœur de métier d'AGRIKEY). */
export const DOMAINES_PAR_DEFAUT = ["agriculture", "agroalimentaire", "entrepreneuriat"];

const PAR_CODE = new Map(DOMAINES.map((d) => [d.code, d]));

export function domaineParCode(code: string | null | undefined): Domaine | undefined {
  return code ? PAR_CODE.get(code) : undefined;
}

/** Garde seulement les codes connus, sans doublon. */
export function codesValides(codes: string[]): string[] {
  return [...new Set(codes.filter((c) => PAR_CODE.has(c)))];
}

// Sites à consulter directement : sources utiles sans flux automatique.
// Pour en ajouter un, ajouter un objet à la liste.

export type SiteUtile = {
  nom: string;
  description: string;
  lien: string;
};

export const SITES_UTILES: { titre: string; sites: SiteUtile[] }[] = [
  {
    titre: "Offres d'emploi",
    sites: [
      { nom: "ANPE Mali", description: "Agence nationale pour l'emploi", lien: "https://www.anpe-mali.org" },
      { nom: "ReliefWeb — Mali", description: "Emplois des ONG et agences de l'ONU", lien: "https://reliefweb.int/jobs?search=Mali" },
    ],
  },
  {
    titre: "Appels d'offres",
    sites: [
      { nom: "L'Essor", description: "Quotidien national : annonces légales et appels d'offres", lien: "https://www.lessormali.com" },
      {
        nom: "Banque mondiale — Mali",
        description: "Avis de passation de marchés des projets",
        lien: "https://projects.worldbank.org/fr/projects-operations/procurement?srce=both&countrycode_exact=ML",
      },
      { nom: "Banque africaine de développement", description: "Acquisitions des projets", lien: "https://www.afdb.org/fr/projects-and-operations/procurement" },
      { nom: "UNGM", description: "Marchés des agences des Nations unies", lien: "https://www.ungm.org/Public/Notice" },
    ],
  },
  {
    titre: "Actualités",
    sites: [
      { nom: "Studio Tamani", description: "Radio d'information du Mali", lien: "https://www.studiotamani.org" },
      { nom: "L'Essor", description: "Quotidien national", lien: "https://www.lessormali.com" },
    ],
  },
];

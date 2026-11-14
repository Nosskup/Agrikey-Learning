// Contenu du jeu : les événements de la vie, de 6 à 25 ans.
// Pour ajouter un événement, il suffit d'ajouter un objet à la liste.

import { accord, d, estFille, genrer, type Etat, type Evenement } from "./moteur";

const enEcole = (e: Etat) => d(e, "enEcole") === true;
const auVillage = (e: Etat) => e.milieu === "village";
const sansMetier = (e: Etat) => !d(e, "metier");
const ici = (e: Etat) => !d(e, "migrant");
const A_SON_COMPTE = "à son compte";

// Probabilité de réussite basée sur une jauge (0 à 100).
const selon = (e: Etat, cle: keyof Etat["jauges"], bonus = 0) =>
  e.jauges[cle] / 100 + bonus;

export const EVENEMENTS: Evenement[] = [
  // ==================== ENFANCE (6 - 11 ans) ====================
  {
    id: "rentree",
    cle: true,
    ages: [6, 6],
    titre: "L'âge d'aller à l'école",
    texte: (e) =>
      auVillage(e)
        ? `Tu as 6 ans. L'école publique la plus proche est à 4 km, à pied. Il y a aussi un maître coranique dans le village, et ton père a besoin de bras ${e.drapeaux.metierParent === "éleveur" ? "pour les troupeaux" : "aux champs"}. Que décide la famille ?`
        : "Tu as 6 ans. Dans le quartier, il y a l'école publique (classes de 80 élèves), une médersa franco-arabe et une école privée qui coûte cher. Que décide la famille ?",
    choix: [
      {
        texte: "L'école publique, en français",
        effets: { savoir: 10, moyens: -3, moral: 3 },
        drapeaux: { scolarite: "ecole", enEcole: true },
        resultat: (e) =>
          auVillage(e)
            ? "Chaque matin tu marches avec ton ardoise sous le bras. Le maître est sévère mais juste."
            : "Tu découvres l'uniforme kaki, les cahiers et la grande cour pleine de poussière.",
      },
      {
        texte: "La médersa (français et arabe)",
        effets: { savoir: 8, respect: 5, moyens: -3 },
        drapeaux: { scolarite: "medersa", enEcole: true },
        resultat:
          "Tu apprends à lire l'arabe et le français. Les anciens apprécient que tu connaisses les sourates.",
      },
      {
        texte: "L'école privée (la famille fait un gros effort)",
        condition: (e) => e.origine !== "pauvre",
        effets: { savoir: 15, moyens: -15, famille: 3 },
        drapeaux: { scolarite: "ecole", enEcole: true, prive: true },
        resultat:
          "Petites classes, cantine, ordinateurs : tu pars avec une longueur d'avance, mais la famille se serre la ceinture.",
      },
      {
        texte: "Chez le maître coranique",
        effets: { savoir: 4, respect: 8, sante: -5 },
        drapeaux: { scolarite: "coranique", enEcole: false },
        resultat:
          "Tu apprends le Coran sur une planchette de bois. La discipline est dure, mais tu gagnes le respect des anciens.",
      },
      {
        texte: "Rester aider la famille",
        effets: { famille: 8, moyens: 4, savoir: -5 },
        drapeaux: { scolarite: "aucune", enEcole: false },
        resultat: (e) =>
          estFille(e)
            ? "Tu aides ta mère : piler le mil, chercher l'eau, garder les petits. Tes journées commencent avant l'aube."
            : "Tu suis ton père aux champs et tu gardes les chèvres. Tu deviens fort, mais tu ne sais pas lire.",
      },
    ],
  },
  {
    id: "paludisme",
    ages: [6, 12],
    titre: "La fièvre de l'hivernage",
    texte:
      "C'est la saison des pluies. Une nuit, tu te réveilles brûlant de fièvre, avec des frissons. Tout le monde pense au palu.",
    choix: [
      {
        texte: "Aller au CSCOM (centre de santé communautaire)",
        effets: { sante: 8, moyens: -6 },
        resultat:
          "Test rapide positif. L'infirmier donne le traitement. Trois jours plus tard, tu es sur pied.",
      },
      {
        texte: "Se soigner avec les feuilles de la grand-mère",
        alea: {
          chance: (e) => selon(e, "sante", -0.2),
          succes: {
            effets: { sante: -5, famille: 4 },
            resultat: "La décoction amère et beaucoup de repos : la fièvre finit par tomber.",
          },
          echec: {
            effets: { sante: -25, moyens: -10 },
            resultat:
              "La fièvre empire. Il faut finalement courir au centre de santé en urgence. Tu as eu très peur.",
          },
        },
        resultat: "",
      },
    ],
  },
  {
    id: "moustiquaire",
    ages: [7, 11],
    titre: "Distribution de moustiquaires",
    texte:
      "Une campagne distribue des moustiquaires imprégnées. Ton oncle propose d'en utiliser une pour protéger sa pépinière de salades.",
    choix: [
      {
        texte: "Insister pour dormir dessous",
        effets: { sante: 10, respect: -2 },
        resultat: "L'oncle grogne, mais cette année, personne ne fait le palu dans ta chambre.",
      },
      {
        texte: "Laisser l'oncle s'en servir",
        effets: { respect: 4, sante: -6 },
        resultat: "Ses salades sont belles. Mais les moustiques, eux, se régalent la nuit.",
      },
    ],
  },
  {
    id: "corvee-eau",
    ages: [7, 10],
    condition: auVillage,
    titre: "Le puits est tari",
    texte:
      "En saison sèche, le puits du quartier ne donne plus. Il faut aller au forage, à une heure de marche, avant l'école ou les travaux.",
    choix: [
      {
        texte: "Y aller chaque matin avant le lever du soleil",
        effets: { famille: 8, sante: -4, savoir: -2 },
        resultat: "Le seau sur la tête, tu croises les autres enfants. Ta mère est fière de toi.",
      },
      {
        texte: "Proposer de s'organiser par tours avec les voisins",
        effets: { respect: 8, famille: 3 },
        resultat:
          "Ton idée plaît : les familles se relaient avec une charrette et un âne. On dit que tu as la tête bien faite.",
      },
    ],
  },
  {
    id: "conte",
    ages: [6, 9],
    titre: "Les contes du soir",
    texte:
      "Le soir, sous le manguier, la grand-mère raconte l'épopée de Soundiata Keïta. Tes cousins jouent au ballon juste à côté.",
    choix: [
      {
        texte: "Écouter la grand-mère jusqu'au bout",
        effets: { savoir: 4, famille: 6, moral: 3 },
        resultat:
          "Tu retiens l'histoire du roi lion et de Sogolon. Tu la raconteras un jour à tes propres enfants.",
      },
      {
        texte: "Rejoindre le match de foot",
        effets: { sante: 5, moral: 6 },
        resultat: "Un ballon de chiffons, deux tongs comme poteaux : la meilleure soirée de la semaine.",
      },
    ],
  },
  {
    id: "fournitures",
    ages: [8, 12],
    condition: enEcole,
    titre: "Les fournitures scolaires",
    texte:
      "La rentrée approche. Il faut des cahiers, des stylos et payer la cotisation de l'APE. L'argent manque à la maison.",
    choix: [
      {
        texte: "Vendre des sachets d'eau glacée après l'école",
        effets: { moyens: 8, sante: -3, respect: 4 },
        resultat: "« Ji suma ! Ji suma ! » Tu cries dans la chaleur et tu paies toi-même tes cahiers.",
      },
      {
        texte: "Demander à un oncle de Bamako ou de l'extérieur",
        effets: { famille: 3, moyens: 4 },
        resultat:
          "L'oncle envoie un peu d'argent par Orange Money, accompagné de conseils : « Il faut travailler dur. »",
      },
      {
        texte: "Faire avec de vieux cahiers",
        effets: { savoir: -4, moral: -3 },
        resultat: "Tu écris en tout petit dans les marges. Certains camarades se moquent.",
      },
    ],
  },
  {
    id: "premier-classe",
    ages: [8, 12],
    condition: enEcole,
    titre: "Le classement du trimestre",
    texte:
      "Le maître annonce le classement. Avant, il propose à quelques élèves de venir aux cours du soir, payants.",
    choix: [
      {
        texte: "Réviser seul sous le lampadaire de la rue",
        alea: {
          chance: (e) => selon(e, "savoir", 0.2),
          succes: {
            effets: { savoir: 10, moral: 8, respect: 5 },
            resultat: "Tu finis dans les trois premiers ! Ton père le répète à tout le grin.",
          },
          echec: {
            effets: { savoir: 4, moral: -4 },
            resultat: "Tu restes au milieu du classement, mais tu as progressé.",
          },
        },
        resultat: "",
      },
      {
        texte: "Payer les cours du soir",
        condition: (e) => e.jauges.moyens >= 20,
        effets: { savoir: 12, moyens: -8 },
        resultat: "Le maître répète les leçons lentement. Tu comprends enfin les fractions.",
      },
      {
        texte: "Ne pas s'en soucier",
        effets: { moral: 4, savoir: -3 },
        resultat: "Tu préfères jouer aux billes. L'école, c'est pour plus tard…",
      },
    ],
  },
  {
    id: "troupeau",
    ages: [7, 12],
    condition: (e) => auVillage(e) && !enEcole(e),
    titre: "Garder le troupeau",
    texte:
      "On te confie les chèvres et quelques bœufs. Un jour, une bête s'égare dans le champ d'un voisin et piétine son mil.",
    choix: [
      {
        texte: "Aller s'excuser au voisin avec ton père",
        effets: { respect: 8, moyens: -4 },
        resultat: "Le voisin accepte les excuses et un petit dédommagement. L'honneur est sauf.",
      },
      {
        texte: "Rentrer en silence et espérer que personne n'a vu",
        alea: {
          chance: () => 0.4,
          succes: { effets: { moral: 2 }, resultat: "Personne n'a rien remarqué… cette fois." },
          echec: {
            effets: { respect: -10, famille: -6 },
            resultat: (e) => `Le voisin vient se plaindre au chef de famille. Tu es sévèrement ${accord(e, "grondé", "grondée")}.`,
          },
        },
        resultat: "",
      },
    ],
  },
  {
    id: "alphabetisation",
    ages: [10, 14],
    condition: (e) => !enEcole(e),
    titre: "Le centre d'alphabétisation",
    texte:
      "Une ONG ouvre un centre d'alphabétisation en bambara le soir, et des cours de rattrapage pour entrer à l'école (stratégie de scolarisation accélérée).",
    choix: [
      {
        texte: "S'inscrire au rattrapage pour rejoindre l'école",
        effets: { savoir: 12, moral: 5, famille: -3 },
        drapeaux: { enEcole: true, scolarite: "ecole", rattrapage: true },
        resultat:
          "En neuf mois, tu apprends à lire et à compter. L'année suivante, tu entres directement en 4e année !",
      },
      {
        texte: "Suivre les cours du soir en bambara",
        effets: { savoir: 8, respect: 3 },
        resultat: "Tu sais maintenant lire, écrire et compter en bambara. Plus personne ne te trompera au marché.",
      },
      {
        texte: "Pas le temps, il y a trop de travail",
        effets: { moyens: 4, moral: -3 },
        resultat: "Tu restes aux tâches de la maison. La lecture attendra.",
      },
    ],
  },
  {
    id: "tabaski",
    ages: [7, 24],
    titre: "La Tabaski approche",
    texte: (e) =>
      e.age < 15
        ? "C'est bientôt la Tabaski. Tous tes amis auront des habits neufs en bazin. Les prix des moutons ont flambé."
        : "C'est bientôt la Tabaski. Le prix des moutons a explosé et tout le monde compte sur toi pour participer.",
    choix: [
      {
        texte: (e) =>
          e.age < 15 ? "Réclamer un habit neuf à tes parents" : "Participer à l'achat du mouton",
        effets: { moyens: -10, famille: 6, moral: 5 },
        resultat:
          "Le jour de la fête, toute la famille est belle. Tu fais le tour du quartier pour souhaiter « Sambè sambè ! ».",
      },
      {
        texte: "Rester simple cette année",
        effets: { moral: -3, moyens: 3 },
        resultat: "Tu portes ton habit de l'an dernier, bien repassé. La fête est belle quand même.",
      },
      {
        texte: "Profiter de la fête pour gagner de l'argent",
        effets: { moyens: 12, sante: -3, respect: 2 },
        resultat: (e) =>
          estFille(e)
            ? "Tu tresses les cheveux des petites voisines toute la nuit avant la fête."
            : "Tu aides au marché aux moutons et tu touches une commission sur chaque vente.",
      },
    ],
  },

  // ==================== ADOLESCENCE (12 - 17 ans) ====================
  {
    id: "telephone",
    ages: [12, 15],
    titre: "Le premier téléphone",
    texte:
      "Un cousin revenu de Côte d'Ivoire t'offre un vieux smartphone. TikTok, WhatsApp, Facebook… tout un monde s'ouvre.",
    choix: [
      {
        texte: "L'utiliser pour apprendre (cours, vidéos, Wikipédia)",
        effets: { savoir: 10, moral: 3 },
        drapeaux: { numerique: true },
        resultat: "Tu découvres qu'on peut tout apprendre en ligne, même avec peu de forfait.",
      },
      {
        texte: "Passer tes nuits sur les réseaux",
        effets: { moral: 6, savoir: -6, sante: -4 },
        resultat: "Tu connais toutes les chansons à la mode, mais tu t'endors en classe.",
      },
      {
        texte: "Le revendre pour aider la famille",
        effets: { moyens: 8, famille: 6, moral: -4 },
        resultat: "Ta mère te bénit. Le téléphone rejoint quelqu'un d'autre.",
      },
    ],
  },
  {
    id: "greve",
    ages: [12, 20],
    condition: enEcole,
    titre: "Grève des enseignants",
    texte:
      "Les enseignants sont en grève pour leurs salaires. Les cours s'arrêtent pendant des semaines. On parle d'année blanche.",
    choix: [
      {
        texte: "Organiser un groupe d'étude avec les camarades",
        effets: { savoir: 8, respect: 6 },
        resultat: "Chaque soir, vous révisez ensemble dans une salle prêtée par la mairie. Tu restes à niveau.",
      },
      {
        texte: "Profiter des vacances forcées",
        effets: { moral: 6, savoir: -8 },
        resultat: "Grin, foot, séries : quand les cours reprennent, tu as tout oublié.",
      },
      {
        texte: "Travailler en attendant",
        effets: { moyens: 10, savoir: -3 },
        resultat: "Tu donnes un coup de main dans une boutique. Un peu d'argent, et tu découvres le commerce.",
      },
    ],
  },
  {
    id: "delestage",
    ages: [13, 20],
    condition: enEcole,
    titre: "Délestages",
    texte:
      "L'électricité est coupée presque toute la soirée. Impossible de réviser à la maison, et les examens approchent.",
    choix: [
      {
        texte: "Réviser à la lampe torche du téléphone",
        effets: { savoir: 6, sante: -4 },
        resultat: "Tes yeux piquent, mais tu avances dans le programme.",
      },
      {
        texte: "Aller réviser à la station-service éclairée",
        effets: { savoir: 8, respect: 3 },
        resultat: "Vous êtes une dizaine d'élèves sous les néons de la station. Ambiance studieuse.",
      },
      {
        texte: "Abandonner les révisions du soir",
        effets: { moral: 3, savoir: -5 },
        resultat: "Tu dors tôt. Au moins, tu es reposé·e.",
      },
    ],
  },
  {
    id: "grin",
    ages: [14, 22],
    titre: "Le grin et la tontine",
    texte: (e) =>
      estFille(e)
        ? "Tes amies veulent créer une tontine : chacune met 1 000 F par semaine, et à tour de rôle l'une d'elles prend tout."
        : "Les jeunes du quartier t'invitent au grin : thé à trois services, débats sur la politique et le foot jusqu'à tard.",
    choix: [
      {
        texte: (e) => (estFille(e) ? "Rejoindre la tontine" : "Devenir un pilier du grin"),
        effets: { respect: 8, moral: 6, savoir: -2 },
        drapeaux: { reseau: true },
        resultat: (e) =>
          estFille(e)
            ? "Quand vient ton tour, tu reçois une belle somme d'un coup. Et surtout, tu as des sœurs pour la vie."
            : "Au grin, on parle de tout. Tu y apprends la débrouille et tu te fais des contacts précieux.",
      },
      {
        texte: "Préférer rester avec la famille",
        effets: { famille: 6, moral: -2 },
        resultat: "Tu restes à la maison. Certains te trouvent trop sérieux·se.",
      },
    ],
  },
  {
    id: "def",
    cle: true,
    ages: [15, 16],
    condition: (e) => enEcole(e) && d(e, "def") === undefined,
    titre: "L'examen du DEF",
    texte:
      "C'est le Diplôme d'Études Fondamentales. Toute la famille attend les résultats, affichés devant l'académie.",
    choix: [
      {
        texte: "Passer l'examen",
        alea: {
          chance: (e) => selon(e, "savoir", 0.25),
          succes: {
            effets: { savoir: 8, moral: 10, famille: 8, respect: 6 },
            drapeaux: { def: true },
            resultat: "Ton nom est sur la liste ! Ta mère pousse des youyous et distribue des colas aux voisins.",
          },
          echec: {
            effets: { moral: -10, famille: -4 },
            drapeaux: { def: false },
            resultat: "Ton nom n'y est pas. Le silence à la maison est lourd.",
          },
        },
        resultat: "",
      },
    ],
  },
  {
    id: "apres-def-echec",
    cle: true,
    ages: [15, 17],
    condition: (e) => d(e, "def") === false && enEcole(e),
    titre: "Après l'échec au DEF",
    texte: "Il faut décider de la suite. Redoubler ? Apprendre un métier ?",
    choix: [
      {
        texte: "Redoubler et retenter",
        alea: {
          chance: (e) => selon(e, "savoir", 0.35),
          succes: {
            effets: { savoir: 6, moral: 8 },
            drapeaux: { def: true },
            resultat: "La deuxième fois est la bonne : tu as ton DEF !",
          },
          echec: {
            effets: { moral: -8 },
            drapeaux: { enEcole: false },
            resultat: "Nouvel échec. L'école s'arrête là pour toi.",
          },
        },
        resultat: "",
      },
      {
        texte: "Quitter l'école et chercher un apprentissage",
        effets: { moyens: 3 },
        drapeaux: { enEcole: false },
        resultat: "Tu ranges tes cahiers. Une autre école commence : celle de la vie.",
      },
    ],
  },
  {
    id: "orientation",
    cle: true,
    ages: [15, 17],
    condition: (e) => d(e, "def") === true && enEcole(e) && !d(e, "orientation"),
    titre: "L'orientation",
    texte: "Avec ton DEF, plusieurs portes s'ouvrent. Laquelle choisis-tu ?",
    choix: [
      {
        texte: "Le lycée général (vers le Bac)",
        effets: { savoir: 8 },
        drapeaux: { orientation: "lycee", lycee: true },
        resultat: "Série sciences ou lettres : tu entres au lycée, la tête pleine d'ambitions.",
      },
      {
        texte: "Un lycée technique ou une école de santé",
        effets: { savoir: 6, moyens: -3 },
        drapeaux: { orientation: "technique", lycee: true, technique: true },
        resultat: "Électricité, génie civil, santé : tu apprends un savoir concret.",
      },
      {
        texte: "Un centre de formation professionnelle (CAP)",
        effets: { savoir: 4, moyens: 4 },
        drapeaux: { orientation: "cap", enEcole: false, apprenti: "en formation professionnelle" },
        resultat: "Deux ans pour apprendre un métier avec un diplôme reconnu. Rapide et pratique.",
      },
    ],
  },
  {
    id: "pretendant",
    cle: true,
    ages: [14, 16],
    condition: (e) => estFille(e) && (!enEcole(e) || e.origine === "pauvre" || auVillage(e)),
    titre: "Un prétendant se présente",
    texte: (e) =>
      `Un homme de 35 ans, commerçant ${auVillage(e) ? "installé en ville" : "du grand marché"}, a envoyé des colas à ta famille pour demander ta main. Tu as ${e.age} ans. Ton père semble tenté : la dot aiderait la famille.`,
    choix: [
      {
        texte: "Demander à ta tante ou à une enseignante de plaider pour toi",
        condition: (e) => e.jauges.famille >= 35 || enEcole(e),
        alea: {
          chance: (e) => selon(e, "famille", 0.2) + (enEcole(e) ? 0.15 : 0),
          succes: {
            effets: { famille: 2, moral: 10, respect: 5 },
            drapeaux: { refusMariagePrecoce: true },
            resultat:
              "Ta tante parle longuement avec ton père : « Laisse-la grandir et apprendre. » Il finit par renvoyer les colas avec respect.",
          },
          echec: {
            effets: { moral: -18, savoir: -6 },
            drapeaux: { marie: true, mariagePrecoce: true, enEcole: false },
            resultat:
              "Malgré tout, la décision est prise. Tu es mariée et tu quittes la concession familiale. Une nouvelle vie, difficile, commence.",
          },
        },
        resultat: "",
      },
      {
        texte: "Refuser fermement devant toute la famille",
        effets: { moral: 6, famille: -15, respect: -6 },
        drapeaux: { refusMariagePrecoce: true },
        resultat:
          "Ton refus fait scandale, mais les grands-parents finissent par te soutenir. Il faudra du temps pour apaiser ton père.",
      },
      {
        texte: "Accepter pour ne pas décevoir",
        effets: { famille: 10, moyens: 8, moral: -15, savoir: -8, sante: -6 },
        drapeaux: { marie: true, mariagePrecoce: true, enEcole: false },
        resultat:
          "Tu deviens épouse très jeune. Ta famille est soulagée, mais toi, tu as dû grandir d'un coup.",
      },
    ],
  },
  {
    id: "aventure",
    cle: true,
    ages: [15, 18],
    condition: (e) => !estFille(e) && !enEcole(e) && ici(e),
    titre: "L'appel de l'aventure",
    texte: (e) =>
      `Ton ami ${e.region.includes("Kayes") ? "Samba" : "Daouda"} part « à l'aventure ». Il parle de la Côte d'Ivoire, de l'Algérie… ou de l'Europe. Il te propose de venir. Il faut payer le passeur.`,
    choix: [
      {
        texte: "Partir en Côte d'Ivoire, par la route légale",
        effets: { moyens: 10, famille: -6, moral: 2 },
        drapeaux: { migrant: "à Abidjan", metier: "vendeur au marché d'Adjamé, à Abidjan" },
        resultat:
          "Après deux jours de car, tu arrives à Abidjan. Un cousin t'héberge et te trouve une place au marché.",
      },
      {
        texte: "Tenter la route du désert vers l'Europe",
        alea: {
          chance: () => 0.25,
          succes: {
            effets: { moyens: 15, moral: -15, sante: -20, famille: 4 },
            drapeaux: { migrant: "en Espagne", metier: "ouvrier agricole en Andalousie" },
            resultat:
              "Après des mois terribles en Algérie et au Maroc, tu arrives en Espagne. Tu as vu des compagnons mourir. Tu ne parles presque jamais de ce voyage.",
          },
          echec: {
            effets: { moyens: -25, sante: -25, moral: -20, respect: -5 },
            drapeaux: { retourne: true },
            resultat:
              "Racketté, emprisonné en Libye, tu es rapatrié à Bamako après un an. Tout l'argent de la famille est perdu. Tu es vivant, c'est l'essentiel.",
          },
        },
        resultat: "",
      },
      {
        texte: "Rester et construire quelque chose ici",
        effets: { famille: 6, respect: 5, moral: -2 },
        drapeaux: { resteAuPays: true },
        resultat: "Tu regardes le car partir. « Mon aventure sera ici. »",
      },
    ],
  },
  {
    id: "exode-fille",
    cle: true,
    ages: [13, 17],
    condition: (e) => estFille(e) && auVillage(e) && !enEcole(e) && !d(e, "marie"),
    titre: "Partir travailler en ville",
    texte:
      "Plusieurs filles du village partent en saison sèche à Bamako comme aides-ménagères, pour préparer leur trousseau de mariage. On te propose une place.",
    choix: [
      {
        texte: "Partir à Bamako",
        alea: {
          chance: () => 0.55,
          succes: {
            effets: { moyens: 12, savoir: 4, famille: -3 },
            drapeaux: { bamako: true },
            resultat:
              "Ta patronne est correcte et t'inscrit même aux cours du soir. Tu reviens avec des pagnes, des ustensiles et de l'expérience.",
          },
          echec: {
            effets: { moyens: 3, moral: -15, sante: -8 },
            drapeaux: { bamako: true },
            resultat:
              "On te fait travailler de 5 h à minuit, et on te paie à peine. Tu rentres au village épuisée, mais plus forte.",
          },
        },
        resultat: "",
      },
      {
        texte: "Rester et apprendre la teinture ou la transformation du karité",
        effets: { moyens: 6, respect: 5, savoir: 3 },
        drapeaux: { apprenti: "en transformation du karité" },
        resultat: "Avec les femmes du village, tu apprends à faire un beurre de karité de qualité.",
      },
    ],
  },
  {
    id: "apprentissage",
    cle: true,
    ages: [14, 18],
    condition: (e) => !enEcole(e) && !d(e, "apprenti") && ici(e) && !d(e, "metier"),
    titre: "Apprendre un métier",
    texte:
      "Sans école, il faut apprendre un métier. Un patron accepte de te prendre en apprentissage : pas de salaire, juste « le prix du thé ».",
    choix: [
      {
        texte: (e) => (estFille(e) ? "La couture" : "La mécanique moto (les Djakarta)"),
        effets: { savoir: 6, moyens: 3, sante: -2 },
        drapeaux: { apprenti: "mécanique/couture" },
        resultat: (e) =>
          estFille(e)
            ? "Tu apprends à coudre des complets en wax et en bazin. Les clientes reviennent pour toi."
            : "Les mains toujours noires de cambouis, tu sais bientôt démonter un moteur les yeux fermés.",
      },
      {
        texte: (e) => (estFille(e) ? "La coiffure" : "La soudure et la menuiserie métallique"),
        effets: { savoir: 5, moyens: 5 },
        drapeaux: { apprenti: "coiffure/soudure" },
        resultat: "Tu apprends vite. Ton patron commence à te confier ses propres clients.",
      },
      {
        texte: "Le maraîchage et l'élevage",
        effets: { savoir: 5, sante: 3, moyens: 3 },
        drapeaux: { apprenti: "agriculture", agri: true },
        resultat: "Oignons, tomates, poulets : tu découvres que la terre peut nourrir ton ambition.",
      },
    ],
  },
  {
    id: "orpaillage",
    ages: [15, 22],
    condition: (e) => !enEcole(e) && ici(e) && !d(e, "metier"),
    titre: "La ruée vers l'or",
    texte:
      "On parle d'un nouveau site d'orpaillage. Des jeunes reviennent avec des motos neuves. D'autres ne reviennent pas : éboulements, mercure, bandits.",
    choix: [
      {
        texte: "Partir creuser",
        alea: {
          chance: () => 0.35,
          succes: {
            effets: { moyens: 25, sante: -12, famille: 4 },
            resultat: "Après six mois dans les trous, tu trouves un bon filon. Tu rentres avec de quoi démarrer quelque chose.",
          },
          echec: {
            effets: { moyens: -5, sante: -20, moral: -10 },
            resultat: "Six mois de poussière et de fièvre, presque rien au bout. Tu rentres malade.",
          },
        },
        resultat: "",
      },
      {
        texte: "Rester : c'est trop dangereux",
        effets: { sante: 3, moral: -3 },
        resultat: "Tu regardes les motos neuves passer… Mais tu as encore tous tes doigts.",
      },
    ],
  },
  {
    id: "deplaces",
    ages: [12, 24],
    titre: "Des cousins déplacés",
    texte:
      "À cause de l'insécurité dans le centre du pays, des cousins ont fui leur village. Ils arrivent chez vous avec presque rien.",
    choix: [
      {
        texte: "Partager ta chambre et ton repas",
        effets: { famille: 10, respect: 10, moyens: -8, moral: 3 },
        resultat:
          "La maison est pleine, mais on partage le tô et la sauce. Un de tes cousins devient ton meilleur ami.",
      },
      {
        texte: "Les aider à s'inscrire auprès des services sociaux et des ONG",
        condition: (e) => e.jauges.savoir >= 30,
        effets: { respect: 12, savoir: 3 },
        resultat: "Grâce à toi, ils reçoivent des kits et les enfants sont scolarisés. On t'appelle pour remplir d'autres dossiers.",
      },
      {
        texte: "Rester à l'écart",
        effets: { famille: -10, respect: -8 },
        resultat: "Les anciens remarquent ton attitude. « Un parent, ça ne se renie pas. »",
      },
    ],
  },
  {
    id: "inondation",
    ages: [10, 24],
    condition: (e) => e.milieu === "ville",
    titre: "Les inondations",
    texte:
      "Une pluie diluvienne s'abat sur la ville. Le marigot déborde, des maisons en banco s'effondrent dans le quartier.",
    choix: [
      {
        texte: "Aider les voisins à évacuer",
        effets: { respect: 12, sante: -5 },
        resultat: "Toute la nuit, de l'eau jusqu'à la taille, tu portes enfants et affaires. Le quartier s'en souvient.",
      },
      {
        texte: "Protéger d'abord la maison familiale",
        effets: { famille: 8, moyens: 3 },
        resultat: "Sacs de sable, rigoles : votre maison tient le coup.",
      },
    ],
  },
  {
    id: "mauvaise-recolte",
    ages: [10, 25],
    condition: auVillage,
    titre: "Une mauvaise saison",
    texte:
      "Les pluies sont arrivées tard et se sont arrêtées trop tôt. Le grenier sera à moitié vide. La période de soudure sera longue.",
    choix: [
      {
        texte: "Aller travailler en ville pendant la saison sèche",
        effets: { moyens: 10, famille: -3, sante: -3 },
        resultat: "Tu pars quelques mois faire des petits boulots et tu envoies de quoi acheter du mil.",
      },
      {
        texte: "Proposer de faire du maraîchage de contre-saison",
        effets: { moyens: 8, savoir: 5, respect: 6 },
        drapeaux: { agri: true },
        resultat: "Avec un petit puits et des planches d'oignons, la famille tient jusqu'à l'hivernage suivant.",
      },
      {
        texte: "Réduire les repas et attendre",
        effets: { sante: -10, moral: -6 },
        resultat: "On passe à un repas par jour. L'année est dure pour tout le monde.",
      },
    ],
  },
  {
    id: "ramadan",
    ages: [12, 24],
    titre: "Le mois de Ramadan",
    texte:
      "C'est le Ramadan, en pleine saison chaude. Le soir, on casse le jeûne avec la bouillie, les dattes et le café Touba.",
    choix: [
      {
        texte: "Jeûner et aller à la mosquée chaque soir",
        effets: { respect: 8, moral: 4, sante: -3 },
        resultat: "Tu sors du mois apaisé·e. Les anciens te citent en exemple.",
      },
      {
        texte: "Préparer et vendre des beignets pour la rupture",
        effets: { moyens: 10, respect: 3 },
        resultat: "Tes beignets et ton jus de bissap partent en dix minutes chaque soir.",
      },
    ],
  },
  {
    id: "accident-moto",
    ages: [16, 24],
    titre: "Sur la route",
    texte:
      "Tu es sur une moto Djakarta, en retard, sans casque. Devant toi, un SOTRAMA freine brusquement.",
    choix: [
      {
        texte: "Freiner fort",
        alea: {
          chance: (e) => selon(e, "sante", 0.1),
          succes: { effets: { moral: -2 }, resultat: "Tu t'arrêtes à 10 cm du pare-chocs. Ton cœur bat à 200." },
          echec: {
            effets: { sante: -20, moyens: -10 },
            resultat: "Tu chutes. Bras cassé, des semaines de plâtre. Désormais tu portes un casque.",
          },
        },
        resultat: "",
      },
      {
        texte: "Tenter de doubler par la droite",
        alea: {
          chance: () => 0.4,
          succes: { effets: { moral: 3 }, resultat: "Ça passe… de justesse. Un policier te siffle." },
          echec: {
            effets: { sante: -28, moyens: -14, famille: -3 },
            resultat: "Le choc est violent. Tu passes deux semaines au CHU Gabriel Touré.",
          },
        },
        resultat: "",
      },
    ],
  },
  {
    id: "bac",
    cle: true,
    ages: [18, 20],
    condition: (e) => d(e, "lycee") === true && d(e, "bac") === undefined && enEcole(e),
    titre: "Le Baccalauréat",
    texte:
      "Les épreuves du Bac commencent. Les résultats seront lus à la radio et publiés en ligne. Tout le quartier attend.",
    choix: [
      {
        texte: "Passer le Bac",
        alea: {
          chance: (e) => selon(e, "savoir", 0.1),
          succes: {
            effets: { savoir: 10, moral: 12, famille: 10, respect: 10 },
            drapeaux: { bac: true },
            resultat: "Admis·e ! Ton père égorge un poulet, les voisins défilent pour te féliciter.",
          },
          echec: {
            effets: { moral: -12 },
            drapeaux: { bac: false },
            resultat: "Ajourné·e. Il faut choisir : repiquer ou passer à autre chose.",
          },
        },
        resultat: "",
      },
    ],
  },
  {
    id: "bac-echec",
    cle: true,
    ages: [19, 21],
    condition: (e) => d(e, "bac") === false && enEcole(e),
    titre: "Repiquer le Bac ?",
    texte: "Tu as échoué au Bac. Tes amis disent : « Le Bac, ça se repique. »",
    choix: [
      {
        texte: "Repiquer en candidat libre",
        alea: {
          chance: (e) => selon(e, "savoir", 0.25),
          succes: {
            effets: { savoir: 6, moral: 10, famille: 6 },
            drapeaux: { bac: true },
            resultat: "Cette fois, c'est la bonne : tu es bachelier·ère !",
          },
          echec: {
            effets: { moral: -10 },
            drapeaux: { enEcole: false, etudes: "niveau Terminale" },
            resultat: "Encore raté. Tu tournes la page des études.",
          },
        },
        resultat: "",
      },
      {
        texte: "Arrêter et entrer dans la vie active",
        effets: { moyens: 4 },
        drapeaux: { enEcole: false, etudes: "niveau Terminale" },
        resultat: "Avec ton niveau Terminale, tu cherches ta voie hors de l'école.",
      },
    ],
  },
  {
    id: "apres-bac",
    cle: true,
    ages: [19, 21],
    condition: (e) => d(e, "bac") === true && !d(e, "suiteBac"),
    titre: "Après le Bac",
    texte: "Tu as ton Bac. Que faire maintenant ?",
    choix: [
      {
        texte: "L'université publique à Bamako",
        effets: { savoir: 10, moyens: -6, moral: -2 },
        drapeaux: { suiteBac: "fac", etudes: "études universitaires à Bamako" },
        resultat:
          "Amphis bondés, grèves, années qui se chevauchent… mais aussi des professeurs passionnés. Tu t'accroches.",
      },
      {
        texte: "Tenter une bourse pour étudier à l'étranger",
        alea: {
          chance: (e) => selon(e, "savoir", -0.3),
          succes: {
            effets: { savoir: 18, moral: 10, famille: 4 },
            drapeaux: { suiteBac: "etranger", etudes: "un master obtenu au Maroc grâce à une bourse" },
            resultat: "Bourse obtenue pour le Maroc ! Tu fais ta valise sous les bénédictions de toute la famille.",
          },
          echec: {
            effets: { moral: -6, savoir: 4 },
            drapeaux: { suiteBac: "fac", etudes: "études universitaires à Bamako" },
            resultat: "Pas de bourse cette fois. Tu t'inscris à la faculté à Bamako.",
          },
        },
        resultat: "",
      },
      {
        texte: "Passer un concours de la fonction publique (enseignement, santé, douane…)",
        alea: {
          chance: (e) => selon(e, "savoir", -0.15) + selon(e, "respect", -0.4),
          succes: {
            effets: { moyens: 18, respect: 12, famille: 10 },
            drapeaux: { suiteBac: "concours", metier: "fonctionnaire de l'État", enEcole: false, etudes: "Bac, puis réussite à un concours" },
            resultat: "Admis·e au concours ! Un salaire régulier : toute la famille en parle.",
          },
          echec: {
            effets: { moral: -8 },
            drapeaux: { suiteBac: "fac", etudes: "études universitaires à Bamako" },
            resultat: "Échec au concours. Beaucoup disent qu'il faut « connaître quelqu'un ». Tu t'inscris à la fac.",
          },
        },
        resultat: "",
      },
      {
        texte: "S'engager dans l'armée",
        condition: (e) => e.jauges.sante >= 40,
        effets: { respect: 10, moyens: 10, famille: -2, moral: -3 },
        drapeaux: { suiteBac: "armee", metier: "militaire dans les Forces armées maliennes", enEcole: false, etudes: "Bac" },
        resultat: "Formation militaire à Koulikoro. Le métier est dangereux, mais tu veux servir le pays.",
      },
    ],
  },
  // ==================== JEUNE ADULTE (19 - 25 ans) ====================
  {
    id: "diplome",
    cle: true,
    ages: [22, 24],
    condition: (e) => (d(e, "suiteBac") === "fac" || d(e, "suiteBac") === "etranger") && enEcole(e),
    titre: "La fin des études",
    texte: "Ta licence (ou ton master) est enfin terminée. Et maintenant, le marché du travail.",
    choix: [
      {
        texte: "Chercher un emploi dans une entreprise ou une ONG",
        alea: {
          chance: (e) =>
            selon(e, "savoir", -0.3) + (d(e, "reseau") ? 0.15 : 0) + (d(e, "suiteBac") === "etranger" ? 0.2 : 0),
          succes: {
            effets: { moyens: 20, moral: 10, respect: 8 },
            drapeaux: { enEcole: false, metier: "cadre dans une ONG à Bamako" },
            resultat: "Après des dizaines de CV déposés, une ONG t'embauche. Ton premier salaire !",
          },
          echec: {
            effets: { moral: -10 },
            drapeaux: { enEcole: false },
            resultat: "Des mois de recherche, des stages non payés. Le diplôme ne suffit pas.",
          },
        },
        resultat: "",
      },
      {
        texte: "Créer ta propre entreprise",
        effets: { moyens: -5, moral: 6, savoir: 4 },
        drapeaux: { enEcole: false, projetEntreprise: true },
        resultat: "Tu as une idée. Il faut maintenant trouver le financement et les premiers clients.",
      },
    ],
  },
  {
    id: "entreprise",
    cle: true,
    ages: [19, 25],
    condition: (e) =>
      sansMetier(e) && ici(e) && !enEcole(e) && (d(e, "projetEntreprise") === true || !!d(e, "apprenti")),
    titre: "Se lancer à son compte",
    texte: (e) =>
      d(e, "apprenti")
        ? "Ton apprentissage est terminé. Tu veux ouvrir ton propre atelier ou ta propre activité. Il faut un capital."
        : "Ton projet d'entreprise est prêt sur le papier. Il faut un capital pour démarrer.",
    choix: [
      {
        texte: "Demander un microcrédit à une caisse d'épargne",
        alea: {
          chance: (e) => selon(e, "respect", 0) + selon(e, "savoir", -0.4) + 0.2,
          succes: {
            effets: { moyens: 18, moral: 10, respect: 8 },
            drapeaux: { metier: A_SON_COMPTE },
            resultat: "Le crédit est accordé. Tu ouvres ton activité et tu rembourses chaque mois, à l'heure.",
          },
          echec: {
            effets: { moral: -8 },
            resultat: "Dossier refusé : pas de garantie. Il faudra trouver autrement.",
          },
        },
        resultat: "",
      },
      {
        texte: "Démarrer petit, avec tes économies",
        condition: (e) => e.jauges.moyens >= 25,
        effets: { moyens: -10, moral: 6, savoir: 3 },
        drapeaux: { metier: A_SON_COMPTE },
        resultat: "Tu commences petit, sans dettes. Chaque franc gagné est réinvesti.",
      },
      {
        texte: "Rejoindre la coopérative du quartier ou du village",
        effets: { respect: 8, moyens: 8, famille: 4 },
        drapeaux: { metier: "pilier d'une coopérative", reseau: true },
        resultat: "À plusieurs, on achète moins cher et on vend mieux. Tu deviens vite trésorier·ère.",
      },
    ],
  },
  {
    id: "agriculture",
    ages: [18, 25],
    condition: (e) => ici(e) && sansMetier(e) && !enEcole(e),
    titre: "Une parcelle à cultiver",
    texte:
      "Un oncle te propose d'exploiter une parcelle d'un hectare près d'un point d'eau. « La terre ne ment pas », dit-il.",
    choix: [
      {
        texte: "Se lancer dans le maraîchage et l'aviculture",
        alea: {
          chance: (e) => selon(e, "savoir", 0.15) + (d(e, "agri") ? 0.2 : 0),
          succes: {
            effets: { moyens: 18, sante: 4, respect: 8 },
            drapeaux: { metier: "agri-entrepreneur·e (maraîchage et poulets)", agri: true },
            resultat: "Oignons, pommes de terre et poulets de chair : tu livres les restaurants. L'activité grandit.",
          },
          echec: {
            effets: { moyens: -8, moral: -6, savoir: 6 },
            drapeaux: { agri: true },
            resultat: "Une maladie décime tes poulets. Tu apprends à la dure : vaccination et hygiène avant tout.",
          },
        },
        resultat: "",
      },
      {
        texte: "Décliner : l'agriculture, ce n'est pas pour toi",
        effets: { moral: 2 },
        resultat: "Tu remercies l'oncle. Peut-être plus tard.",
      },
    ],
  },
  {
    id: "mobile-money",
    ages: [17, 25],
    condition: (e) => ici(e) && e.milieu === "ville" && sansMetier(e) && !enEcole(e),
    titre: "Un kiosque Orange Money",
    texte:
      "Un grand du quartier te propose de tenir un kiosque de transfert d'argent mobile. Il faut un fonds de roulement.",
    choix: [
      {
        texte: "Accepter et tenir le kiosque sérieusement",
        effets: { moyens: 12, respect: 6, savoir: 3 },
        drapeaux: { metier: "gérant·e d'un point de transfert d'argent mobile" },
        resultat: "Dépôts, retraits, crédits : tu deviens une figure du quartier.",
      },
      {
        texte: "Refuser : trop de risques de vol et d'arnaques",
        effets: { moral: -2 },
        resultat: "Tu laisses passer l'occasion.",
      },
    ],
  },
  {
    id: "formation-en-ligne",
    ages: [17, 25],
    condition: (e) => e.jauges.savoir >= 20,
    titre: "Se former en ligne",
    texte:
      "Tu découvres qu'on peut suivre des formations en ligne : gestion d'entreprise, comptabilité, agriculture, numérique.",
    choix: [
      {
        texte: "Suivre une formation en gestion et obtenir un certificat",
        effets: { savoir: 12, moyens: -3, moral: 5 },
        drapeaux: { numerique: true, certificat: true },
        resultat: "Le soir, sur ton téléphone, tu apprends à tenir une caisse et à faire un plan d'affaires.",
      },
      {
        texte: "Pas maintenant, le forfait internet coûte trop cher",
        effets: { moyens: 2 },
        resultat: "Tu gardes l'idée dans un coin de ta tête.",
      },
    ],
  },
  {
    id: "petit-boulot",
    ages: [18, 25],
    condition: (e) => sansMetier(e) && ici(e) && !enEcole(e),
    titre: "Joindre les deux bouts",
    texte: "Sans emploi stable, il faut bien vivre. Quelles opportunités saisis-tu ?",
    choix: [
      {
        texte: (e) => (estFille(e) ? "Vendre des plats au bord de la route" : "Faire du moto-taxi"),
        effets: { moyens: 12, sante: -4 },
        resultat: "Ce n'est pas un rêve, mais ça paie le quotidien.",
      },
      {
        texte: "Faire des stages en espérant une embauche",
        effets: { savoir: 8, moyens: -3, respect: 3 },
        drapeaux: { reseau: true },
        resultat: "Tu enchaînes les stages. Ton carnet d'adresses s'épaissit.",
      },
      {
        texte: "Rejoindre l'association des jeunes du quartier",
        effets: { respect: 10, moral: 6 },
        drapeaux: { association: true, reseau: true },
        resultat: "Salubrité, sensibilisation, foot inter-quartiers : on commence à te connaître.",
      },
    ],
  },
  {
    id: "aide-famille",
    ages: [20, 25],
    condition: (e) => !!d(e, "metier"),
    titre: "La famille compte sur toi",
    texte: (e) =>
      `Maintenant que tu gagnes ta vie, les demandes affluent : les frais de scolarité d'un petit frère, l'ordonnance d'une tante, la toiture de la maison${d(e, "migrant") ? ", et tout le village attend tes transferts" : ""}.`,
    choix: [
      {
        texte: "Tout donner : la famille d'abord",
        effets: { famille: 14, respect: 10, moyens: -15, moral: -3 },
        resultat: "La maison a un nouveau toit en tôle. On prie pour toi à chaque repas.",
      },
      {
        texte: "Aider, mais fixer un budget et épargner",
        effets: { famille: 4, moyens: 4, savoir: 3 },
        resultat: "Certains grognent, mais tu construis un avenir solide pour toi et pour eux.",
      },
      {
        texte: "Refuser : c'est ton argent",
        effets: { moyens: 10, famille: -15, respect: -10 },
        resultat: "On dit dans la famille que tu as changé. La solitude pèse un peu.",
      },
    ],
  },
  {
    id: "mariage",
    cle: true,
    ages: [21, 25],
    condition: (e) => !d(e, "marie") && (e.jauges.moyens >= 20 || estFille(e)),
    titre: "Le mariage",
    texte: (e) =>
      estFille(e)
        ? "Un homme sérieux, que tu as rencontré à un baptême, envoie sa famille demander ta main avec les colas."
        : "Ta mère te dit qu'il est temps de te marier. Tu as remarqué une jeune femme du quartier. Il faudra payer la dot et organiser la fête.",
    choix: [
      {
        texte: "Accepter et organiser un grand mariage",
        effets: { famille: 12, respect: 10, moyens: -18, moral: 10 },
        drapeaux: { marie: true },
        resultat: "Griots, djembés, bazin brodé : le mariage dure trois jours. Tout le quartier en parle.",
      },
      {
        texte: "Se marier simplement, à la mosquée et à la mairie",
        effets: { famille: 5, moral: 10, moyens: -5 },
        drapeaux: { marie: true },
        resultat: "Une cérémonie sobre, l'essentiel est là. Certaines tantes trouvent ça un peu « léger ».",
      },
      {
        texte: "Attendre d'être plus stable",
        effets: { moral: -2, famille: -5, moyens: 3 },
        resultat: "La famille insiste, mais tu tiens bon : « Chaque chose en son temps. »",
      },
    ],
  },
  {
    id: "enfant",
    ages: [22, 25],
    condition: (e) => d(e, "marie") === true && !d(e, "enfants"),
    titre: "Une naissance",
    texte: "Un bébé est né dans ton foyer ! Le baptême aura lieu dans sept jours. Quel prénom donner ?",
    choix: [
      {
        texte: "Le prénom d'un grand-parent, comme le veut la tradition",
        effets: { famille: 12, respect: 6, moral: 10, moyens: -6 },
        drapeaux: { enfants: 1 },
        resultat: "Le grand-parent est ému aux larmes : son homonyme est né.",
      },
      {
        texte: "Un prénom moderne que tu aimes",
        effets: { moral: 12, famille: -2, moyens: -6 },
        drapeaux: { enfants: 1 },
        resultat: "Les vieux froncent les sourcils, puis prennent le bébé dans leurs bras. L'amour l'emporte.",
      },
    ],
  },
  {
    id: "politique",
    ages: [20, 25],
    condition: (e) => e.jauges.respect >= 50 && ici(e),
    titre: "Une proposition politique",
    texte:
      "Un homme politique te propose d'être son relais auprès des jeunes du quartier, en échange de « motivations ».",
    choix: [
      {
        texte: "Accepter",
        effets: { moyens: 12, respect: -6, moral: -3 },
        resultat: "L'argent arrive vite. Mais certains amis te regardent différemment.",
      },
      {
        texte: "Refuser et rester indépendant·e",
        effets: { respect: 8, moral: 5 },
        resultat: "« Mon nom n'est pas à vendre. » Ta réputation d'intégrité grandit.",
      },
      {
        texte: "Exiger des actions concrètes pour le quartier",
        condition: (e) => d(e, "association") === true,
        effets: { respect: 14, moral: 6 },
        resultat: "Grâce à ta négociation, un forage et des lampadaires solaires sont installés.",
      },
    ],
  },
  {
    id: "migrant-vie",
    ages: [17, 25],
    condition: (e) => !!d(e, "migrant"),
    titre: "Loin du pays",
    texte: (e) =>
      `Tu vis ${d(e, "migrant")}. Le pays te manque : le tô, la langue, la famille. Tu vis à plusieurs dans une chambre pour économiser.`,
    choix: [
      {
        texte: "Envoyer le maximum d'argent à la famille",
        effets: { famille: 12, respect: 8, moyens: -8, moral: -3 },
        resultat: "Grâce à toi, la famille a construit une maison en dur au village.",
      },
      {
        texte: "Suivre une formation pour progresser",
        effets: { savoir: 10, moral: 4 },
        resultat: "Le soir, tu suis des cours de langue et de métier. Tes perspectives s'élargissent.",
      },
      {
        texte: "Rentrer au pays avec tes économies",
        effets: { famille: 10, moral: 10, moyens: 5 },
        drapeaux: { migrant: false, metier: "commerçant·e de retour au pays", retourne: true },
        resultat: "Tu rentres avec un petit capital et ouvres une boutique. La famille t'accueille en héros.",
      },
    ],
  },
];

// Le métier « à son compte » dépend de l'apprentissage suivi et du sexe.
export function libelleMetier(e: Etat) {
  const m = d(e, "metier") as string | undefined;
  if (!m) return undefined;
  return genrer(e, libelleBrut(e, m));
}

function libelleBrut(e: Etat, m: string) {
  if (m === A_SON_COMPTE) {
    const a = d(e, "apprenti") as string | undefined;
    if (a === "mécanique/couture") return estFille(e) ? "couturière avec ton propre atelier" : "mécanicien moto avec ton propre garage";
    if (a === "coiffure/soudure") return estFille(e) ? "coiffeuse avec ton propre salon" : "soudeur avec ton propre atelier";
    if (a === "agriculture") return "agri-entrepreneur·e";
    if (a === "en transformation du karité") return "productrice de beurre de karité";
    return accord(e, "entrepreneur", "entrepreneuse");
  }
  return m;
}

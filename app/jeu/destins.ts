// Les grandes décisions de vie et leurs « échos » :
// des choix faits enfant ou adolescent qui reviennent des années plus tard.

import { accord, d, estFille, type Choix, type Etat, type Evenement } from "./moteur";

const enEcole = (e: Etat) => d(e, "enEcole") === true;
const ici = (e: Etat) => !d(e, "migrant");
const sansMetier = (e: Etat) => !d(e, "metier");
const nomAmi = (e: Etat) => (d(e, "ami") as string) ?? "ton ami";
const conjoint = (e: Etat) => (estFille(e) ? "Sékou" : "Fanta");

// Le meilleur ami ou la meilleure amie est du même sexe que le joueur.
function choixAmi(
  type: "studieux" | "debrouillard" | "turbulent",
  noms: [string, string],
  description: [string, string],
  effets: Choix["effets"],
  resultat: string,
): Choix[] {
  return (["garcon", "fille"] as const).map((sexe, i) => ({
    condition: (e: Etat) => e.sexe === sexe,
    texte: `${noms[i]}, ${description[i]}`,
    effets,
    drapeaux: { ami: noms[i], amiType: type },
    resultat: resultat.replaceAll("{ami}", noms[i]),
  }));
}

export const EVENEMENTS_DESTIN: Evenement[] = [
  // ==================== L'AMI·E D'ENFANCE ====================
  {
    id: "ami",
    cle: true,
    ages: [8, 9],
    scene: "concession",
    titre: "Un·e ami·e pour la vie",
    texte:
      "Dans la cour, trois enfants veulent devenir ton ami·e inséparable. Celui ou celle que tu choisis marchera longtemps à tes côtés… et reviendra dans ta vie.",
    choix: [
      ...choixAmi(
        "studieux",
        ["Sidi", "Kadi"],
        ["le premier de la classe, toujours un livre à la main", "la première de la classe, toujours un livre à la main"],
        { savoir: 6, moral: 2 },
        "Avec {ami}, vous faites vos devoirs ensemble sous le manguier. Sa soif d'apprendre déteint sur toi.",
      ),
      ...choixAmi(
        "debrouillard",
        ["Madou", "Bintou"],
        ["qui invente toujours une combine pour gagner trois sous", "qui vend déjà des bonbons à la sortie de l'école"],
        { moyens: 5, moral: 3 },
        "{ami} t'apprend à compter la monnaie plus vite qu'un commerçant du Grand Marché.",
      ),
      ...choixAmi(
        "turbulent",
        ["Lamine", "Nafi"],
        ["la terreur du quartier, mais drôle et loyal", "la terreur du quartier, mais drôle et loyale"],
        { moral: 8, respect: -4 },
        "Avec {ami}, les journées sont pleines d'aventures… et de bêtises. Les voisins vous ont à l'œil.",
      ),
    ],
  },

  // ==================== LE MENTOR ====================
  {
    id: "mentor",
    ages: [10, 13],
    scene: "ecole",
    condition: (e) => enEcole(e) && e.jauges.savoir >= 28 && !d(e, "mentor"),
    titre: "Le maître a remarqué ton intelligence",
    texte:
      "M. Dembélé, ton maître, te retient après la classe : « Tu as quelque chose. Viens le samedi matin, je te donnerai des cours gratuits. En échange, tu balaieras la classe. »",
    choix: [
      {
        texte: "Accepter avec gratitude",
        traits: ["studieux"],
        effets: { savoir: 10, respect: 4, moral: 4 },
        drapeaux: { mentor: true },
        resultat:
          "Chaque samedi, M. Dembélé t'ouvre ses livres et sa radio. Il croit en toi : c'est peut-être le plus beau cadeau de ton enfance.",
      },
      {
        texte: "Refuser : le samedi, tu aides la famille",
        effets: { famille: 5, moyens: 3 },
        resultat: "Le maître hoche la tête. « La porte restera ouverte. »",
      },
    ],
  },
  {
    id: "echo-mentor",
    echo: true,
    ages: [17, 18],
    scene: "ecole",
    condition: (e) => d(e, "mentor") === true && d(e, "lycee") === true && !d(e, "recommande"),
    titre: "Écho du passé : M. Dembélé",
    texte:
      "Ton ancien maître, M. Dembélé, a appris que tu passes bientôt le Bac. Il est venu à vélo jusqu'à chez toi, avec une enveloppe.",
    choix: [
      {
        texte: "Accepter sa lettre de recommandation",
        effets: { moral: 10, famille: 4 },
        drapeaux: { recommande: true },
        resultat:
          "« Pour les bourses d'études. J'y ai écrit tout le bien que je pense de toi. » Cette lettre pourrait changer ton avenir.",
      },
      {
        texte: "Le remercier en lui offrant le peu que tu as",
        effets: { respect: 8, moyens: -4 },
        drapeaux: { recommande: true },
        resultat:
          "Il refuse ton argent en riant et te tend quand même l'enveloppe : une lettre de recommandation pour les bourses.",
      },
    ],
  },

  // ==================== QUITTER LE VILLAGE ====================
  {
    id: "exode-ville",
    cle: true,
    majeur: true,
    ages: [16, 19],
    scene: "ville",
    condition: (e) =>
      e.milieu === "village" && ici(e) && !d(e, "marie") && !d(e, "bamako"),
    titre: "Rester au village ou partir à Bamako ?",
    texte: (e) =>
      `Ton oncle de Bamako propose de t'héberger dans sa maison de Kalaban Coura. « En ville, il y a l'avenir. » Mais ${e.drapeaux.metierParent === "cultivateur" ? "ton père a besoin de toi aux champs" : "ta famille compte sur toi ici"}, et tes grands-parents vieillissent.`,
    choix: [
      {
        texte: "Partir vivre à Bamako",
        traits: ["audacieux"],
        effets: { moral: 6, famille: -8, savoir: 4 },
        demenager: { region: "Bamako", milieu: "ville" },
        resultat: (e) =>
          `Le car te dépose à la gare routière de Sogoniko. Le bruit, les motos, les lumières : ta vie de ${accord(e, "citadin", "citadine")} commence.`,
      },
      {
        texte: "Rester et moderniser l'exploitation familiale",
        traits: ["debrouillard"],
        effets: { famille: 10, respect: 6, moyens: 2 },
        drapeaux: { agri: true },
        resultat:
          "Tu restes. Tu convaincs ton père d'essayer de nouvelles semences et le compost. Les anciens te regardent avec un respect nouveau.",
      },
      {
        texte: "Rester pour t'occuper des grands-parents",
        traits: ["solidaire"],
        effets: { famille: 14, moral: -2 },
        resultat:
          "Tu deviens le bâton de vieillesse des anciens. Ils te transmettent les histoires de la famille et leurs bénédictions.",
      },
    ],
  },

  // ==================== LA FUITE DES SUJETS DU BAC ====================
  {
    id: "fuite-bac",
    cle: true,
    majeur: true,
    ages: [17, 18],
    scene: "nuit",
    domaine: "social",
    condition: (e) => d(e, "lycee") === true && enEcole(e) && d(e, "bac") === undefined,
    titre: "Les sujets du Bac circulent",
    texte:
      "La veille du Bac, un message tourne sur WhatsApp : « Sujets de philo et de maths, 25 000 F. » Plusieurs camarades ont déjà payé.",
    choix: [
      {
        texte: "Acheter les sujets",
        effets: { moyens: -8, moral: -4 },
        drapeaux: { triche: true },
        resultat:
          "Tu paies. Le lendemain, les sujets sont bien les bons. Tu écris vite, mais une petite voix te dit que ce diplôme n'est pas tout à fait le tien.",
      },
      {
        texte: "Refuser et réviser toute la nuit",
        traits: ["integre"],
        effets: { savoir: 6, sante: -3 },
        resultat: "Tu éteins le téléphone. Si tu réussis, ce sera par ton seul mérite.",
      },
      {
        texte: "Signaler la fuite aux autorités",
        traits: ["integre"],
        alea: {
          chance: (e) => e.jauges.respect / 100 + 0.1,
          succes: {
            effets: { respect: 12, moral: 6 },
            resultat:
              "Les épreuves sont remplacées en urgence. Ton nom reste discret, mais un inspecteur te félicite en personne.",
          },
          echec: {
            effets: { respect: -6, moral: -8 },
            resultat:
              "Ton nom a fuité. Certains camarades t'accusent d'avoir « gâté » leur Bac. Tu tiens bon, mais c'est dur.",
          },
        },
        resultat: "",
      },
    ],
  },
  {
    id: "echo-triche",
    echo: true,
    ages: [20, 24],
    scene: "ville",
    condition: (e) => d(e, "triche") === true && d(e, "bac") === true,
    titre: "Écho du passé : le Bac acheté",
    texte:
      "Lors d'un test de recrutement, on te demande de résoudre un problème de niveau Terminale. Tu sèches. Les lacunes cachées par les sujets achetés te rattrapent.",
    choix: [
      {
        texte: "Reconnaître tes lacunes et reprendre les bases",
        traits: ["studieux"],
        effets: { savoir: 12, moral: 4, moyens: -3 },
        drapeaux: { triche: false },
        resultat:
          "Pendant des mois, tu reprends les cours le soir. C'est humiliant au début, puis libérateur : ce savoir-là est vraiment à toi.",
      },
      {
        texte: "Bluffer et chercher un piston",
        alea: {
          chance: (e) => e.jauges.respect / 100 - 0.1,
          succes: {
            effets: { moyens: 8, moral: -6 },
            resultat: "Un parent intervient et tu passes. Mais tu vis avec la peur d'être démasqué·e.",
          },
          echec: {
            effets: { respect: -12, moral: -10 },
            resultat: "Le recruteur n'est pas dupe. La nouvelle fait le tour de ton entourage.",
          },
        },
        resultat: "",
      },
    ],
  },

  // ==================== L'AMOUR ET LES TRADITIONS ====================
  {
    id: "amour",
    cle: true,
    majeur: true,
    ages: [19, 22],
    scene: "fete",
    domaine: "social",
    condition: (e) => !d(e, "marie") && ici(e),
    titre: "Un amour qui dérange",
    texte: (e) =>
      `Tu aimes ${conjoint(e)}, et c'est réciproque. Mais sa famille est de caste griot (jeli), et ton grand-père, très attaché aux traditions, refuse cette union : « Chez nous, cela ne se fait pas. »`,
    choix: [
      {
        texte: (e) => `Épouser ${conjoint(e)} malgré l'opposition`,
        traits: ["rebelle"],
        effets: { moral: 15, famille: -15, respect: -4, moyens: -6 },
        drapeaux: { marie: true, mariageAmour: true },
        resultat: (e) =>
          `Vous vous mariez à la mairie, avec quelques amis. Une partie de la famille boude la cérémonie. Mais chaque matin, tu te réveilles à côté de ${conjoint(e)}.`,
      },
      {
        texte: "Envoyer des anciens et un griot médiateur plaider ta cause",
        alea: {
          chance: (e) => e.jauges.famille / 100 + e.jauges.respect / 200,
          succes: {
            effets: { moral: 14, famille: 6, respect: 8, moyens: -8 },
            drapeaux: { marie: true, mariageAmour: true },
            resultat: (e) =>
              `Après des semaines de palabres, de colas et de bénédictions, ton grand-père cède : « Les temps changent. » Tu épouses ${conjoint(e)} avec la bénédiction de tous.`,
          },
          echec: {
            effets: { moral: -14, famille: 2 },
            resultat: (e) =>
              `Le grand-père reste inflexible. ${conjoint(e)} finit par accepter un autre mariage. Ton cœur est brisé.`,
          },
        },
        resultat: "",
      },
      {
        texte: "Renoncer pour respecter la volonté de la famille",
        effets: { famille: 10, respect: 4, moral: -16 },
        resultat: "Tu t'inclines. La famille te remercie, mais tu gardes longtemps une blessure secrète.",
      },
    ],
  },
  {
    id: "polygamie-homme",
    majeur: true,
    ages: [23, 25],
    scene: "concession",
    condition: (e) => !estFille(e) && d(e, "marie") === true && e.jauges.moyens >= 40 && !d(e, "polygame"),
    titre: "Une deuxième épouse ?",
    texte:
      "Tes affaires marchent. Ta mère et tes tantes insistent : « Un homme de ta position doit prendre une deuxième épouse. » Ta femme, elle, n'en veut pas.",
    choix: [
      {
        texte: "Prendre une deuxième épouse",
        effets: { famille: 6, respect: 4, moyens: -16, moral: -6 },
        drapeaux: { polygame: true },
        resultat:
          "La concession s'agrandit. Mais la tension entre les coépouses est palpable, et les dépenses doublent.",
      },
      {
        texte: "Rester monogame, par respect pour ton épouse",
        effets: { moral: 8, famille: -4 },
        resultat: "Ta mère soupire. Ta femme, elle, te regarde avec une confiance renouvelée.",
      },
    ],
  },
  {
    id: "polygamie-femme",
    majeur: true,
    ages: [22, 25],
    scene: "concession",
    condition: (e) => estFille(e) && d(e, "marie") === true && !d(e, "divorce"),
    titre: "Ton mari veut une deuxième épouse",
    texte:
      "Ton mari t'annonce qu'il va prendre une deuxième épouse, plus jeune. La famille trouve cela normal. Toi, tu dois décider comment tu vis cela.",
    choix: [
      {
        texte: "Accepter et garder ta place de première épouse",
        effets: { famille: 6, respect: 4, moral: -10 },
        resultat: "Tu restes la « grande épouse », respectée de tous. Mais tu dois désormais partager ton foyer.",
      },
      {
        texte: "Accepter, mais développer ta propre activité",
        traits: ["debrouillard"],
        effets: { moyens: 10, moral: 2, savoir: 3 },
        drapeaux: { metier: "commerçante indépendante" },
        resultat:
          "Tu lances un commerce de pagnes et de savon. Tes revenus t'appartiennent : c'est ta liberté.",
      },
      {
        texte: "Demander le divorce",
        traits: ["rebelle"],
        effets: { moral: 6, famille: -16, respect: -8 },
        drapeaux: { marie: false, divorce: true },
        resultat:
          "Tu retournes chez tes parents. Les commérages sont durs, mais tu as choisi ta dignité.",
      },
    ],
  },

  // ==================== LA MALADIE D'UNE MÈRE ====================
  {
    id: "sante-mere",
    majeur: true,
    ages: [18, 24],
    scene: "sante",
    domaine: "social",
    condition: ici,
    titre: "Ta mère doit être opérée",
    texte:
      "Ta mère souffre depuis des mois. Au CHU du Point G, le médecin est formel : il faut l'opérer. Coût : 600 000 FCFA. La famille n'a pas cette somme.",
    choix: [
      {
        texte: "Tout payer avec tes économies",
        condition: (e) => e.jauges.moyens >= 30,
        traits: ["solidaire"],
        effets: { moyens: -28, famille: 16, moral: 6 },
        drapeaux: { mereSauvee: true },
        resultat: "Tu vides ton compte sans hésiter. L'opération réussit. Ta mère te bénit chaque jour.",
      },
      {
        texte: "Lancer une cotisation auprès de la famille et de la diaspora",
        alea: {
          chance: (e) => e.jauges.famille / 100 + (d(e, "reseau") ? 0.15 : 0),
          succes: {
            effets: { famille: 12, respect: 8, moyens: -6 },
            drapeaux: { mereSauvee: true },
            resultat:
              "Les cousins de France, les tantes du marché, tes amis du grin : en dix jours, la somme est réunie. L'opération réussit.",
          },
          echec: {
            effets: { famille: -4, moral: -16, sante: -6, moyens: -10 },
            resultat:
              "La somme arrive trop lentement. L'opération a lieu tard, et la convalescence de ta mère sera longue. Tu t'en veux.",
          },
        },
        resultat: "",
      },
      {
        texte: "Consulter un tradipraticien, moins cher",
        alea: {
          chance: () => 0.25,
          succes: {
            effets: { moyens: -4, famille: 4 },
            resultat: "Contre toute attente, ta mère va mieux. Le médecin parle de chance.",
          },
          echec: {
            effets: { moral: -18, famille: -6, moyens: -14 },
            resultat:
              "Son état s'aggrave. Il faut finalement l'opérer en urgence, pour plus cher encore.",
          },
        },
        resultat: "",
      },
    ],
  },

  // ==================== LES ÉCHOS DU PASSÉ ====================
  {
    id: "echo-deplaces",
    echo: true,
    ages: [20, 24],
    scene: "marche",
    condition: (e) => d(e, "aideDeplaces") === true && ici(e),
    titre: "Écho du passé : le cousin du centre",
    texte:
      "Hamadou, le cousin que ta famille avait accueilli quand il fuyait l'insécurité, a réussi : il possède trois camions entre Mopti et Bamako. Il vient te voir : « Tu nous as ouvert ta porte. À mon tour. »",
    choix: [
      {
        texte: "Devenir son associé·e",
        condition: sansMetier,
        effets: { moyens: 16, respect: 6, moral: 8 },
        drapeaux: { metier: "associé·e dans une entreprise de transport" },
        resultat: "Tu gères les livraisons et les comptes. Le bien que tu as fait est revenu vers toi.",
      },
      {
        texte: "Lui demander de financer la scolarité de tes petits frères",
        effets: { famille: 14, respect: 6 },
        resultat: "Il paie sans hésiter trois années d'école. « La famille, c'est ça. »",
      },
    ],
  },
  {
    id: "echo-rejet",
    echo: true,
    ages: [20, 24],
    scene: "concession",
    condition: (e) => d(e, "rejetDeplaces") === true,
    titre: "Écho du passé : la porte fermée",
    texte:
      "Tu traverses une passe difficile et tu demandes de l'aide à la famille élargie. On te rappelle froidement que tu n'avais pas tendu la main aux cousins déplacés.",
    choix: [
      {
        texte: "Aller présenter tes excuses à ces cousins",
        traits: ["integre"],
        effets: { famille: 10, respect: 6, moral: -2 },
        drapeaux: { rejetDeplaces: false },
        resultat: "Les excuses sont acceptées. On te dit : « Le cœur qui se reconnaît en faute est déjà guéri. »",
      },
      {
        texte: "Te débrouiller seul·e, par fierté",
        effets: { moral: -6, moyens: -6, famille: -4 },
        resultat: "Tu t'en sors, mais seul·e. La solitude est un prix lourd.",
      },
    ],
  },
  {
    id: "echo-politique",
    echo: true,
    ages: [22, 25],
    scene: "ville",
    condition: (e) => d(e, "argentPolitique") === true,
    titre: "Écho du passé : l'argent politique",
    texte:
      "L'homme politique que tu as servi est accusé de détournement. Une vidéo où tu distribues ses billets circule sur les réseaux.",
    choix: [
      {
        texte: "Témoigner publiquement et rendre l'argent",
        traits: ["integre"],
        effets: { respect: 10, moyens: -10, moral: 6 },
        resultat: "Ton courage surprend. Les jeunes du quartier te pardonnent : « Tout le monde peut se tromper. »",
      },
      {
        texte: "Nier et faire profil bas",
        effets: { respect: -10, moral: -6 },
        resultat: "La vidéo te suit partout. On t'appelle désormais « le relais ».",
      },
    ],
  },
  {
    id: "echo-refus",
    echo: true,
    ages: [19, 23],
    scene: "concession",
    domaine: "social",
    condition: (e) => d(e, "refusMariagePrecoce") === true,
    titre: "Écho du passé : ta petite sœur",
    texte:
      "Ta petite sœur a 14 ans. Un prétendant vient d'envoyer des colas pour elle. Elle vient te voir en pleurant : « Toi, tu avais réussi à dire non. Aide-moi. »",
    choix: [
      {
        texte: "Parler à ton père, avec tout ce que tu as accompli",
        alea: {
          chance: (e) => e.jauges.respect / 100 + 0.2,
          succes: {
            effets: { respect: 12, famille: 6, moral: 12 },
            resultat:
              "Ton père t'écoute longuement. « Ta réussite m'a appris quelque chose. » Ta sœur restera à l'école. Tu as changé l'histoire de ta famille.",
          },
          echec: {
            effets: { moral: -10, famille: -6 },
            resultat: "Ton père ne cède pas cette fois. Mais ta sœur sait qu'elle pourra toujours compter sur toi.",
          },
        },
        resultat: "",
      },
      {
        texte: "Faire appel à une association de défense des droits des filles",
        traits: ["solidaire"],
        effets: { respect: 6, famille: -6, moral: 8 },
        resultat:
          "Des médiatrices viennent parler à la famille de la loi et de la santé des jeunes filles. Le mariage est reporté.",
      },
    ],
  },
  {
    id: "echo-ami-studieux",
    echo: true,
    ages: [19, 23],
    scene: "sante",
    condition: (e) => d(e, "amiType") === "studieux",
    titre: "Écho du passé : ton ami·e d'enfance",
    texte: (e) =>
      `${nomAmi(e)}, ton ami·e d'enfance, est en dernière année de médecine. ${estFille(e) ? "Elle" : "Il"} t'appelle : « J'ai entendu dire que tu avais des soucis. Comment puis-je t'aider ? »`,
    choix: [
      {
        texte: "Accepter un bilan de santé gratuit",
        effets: { sante: 16, moral: 6 },
        drapeaux: { amiDestin: "devenu·e médecin, veille sur ta santé." },
        resultat: "Un problème détecté à temps, soigné à temps. L'amitié, ça sauve parfois des vies.",
      },
      {
        texte: "Lui demander de t'aider à reprendre des études",
        traits: ["studieux"],
        effets: { savoir: 12, moral: 4 },
        drapeaux: { amiDestin: "devenu·e médecin, t'a redonné le goût d'apprendre." },
        resultat: "Le soir, vous révisez ensemble, comme sous le manguier quand vous aviez neuf ans.",
      },
    ],
  },
  {
    id: "echo-ami-debrouillard",
    echo: true,
    ages: [19, 23],
    scene: "marche",
    domaine: "affaires",
    condition: (e) => d(e, "amiType") === "debrouillard" && ici(e),
    titre: "Écho du passé : ton ami·e d'enfance",
    texte: (e) =>
      `${nomAmi(e)} a ouvert une boutique au marché de Médine. ${estFille(e) ? "Elle" : "Il"} te propose de devenir associé·e : « Toi et moi, comme au temps des bonbons ! »`,
    choix: [
      {
        texte: "Accepter de t'associer",
        alea: {
          chance: (e) => e.jauges.savoir / 100 + 0.25,
          succes: {
            effets: { moyens: 18, moral: 8, respect: 6 },
            drapeaux: {
              metier: "associé·e de ton ami·e d'enfance dans le commerce",
              amiDestin: "est devenu·e ton associé·e en affaires.",
            },
            resultat: "La boutique devient deux, puis trois. Votre duo est connu de tout le marché.",
          },
          echec: {
            effets: { moyens: -12, moral: -8 },
            drapeaux: { amiDestin: "et toi, vous vous êtes brouillés pour une histoire d'argent." },
            resultat: "Un mauvais stock, une dispute sur les comptes… L'affaire coule, et l'amitié avec.",
          },
        },
        resultat: "",
      },
      {
        texte: "Refuser pour préserver l'amitié",
        effets: { moral: 2 },
        drapeaux: { amiDestin: "est resté·e ton ami·e fidèle, sans argent entre vous." },
        resultat: "« Les affaires d'abord, l'amitié toujours », dit le proverbe. Vous restez proches.",
      },
    ],
  },
  {
    id: "echo-ami-turbulent",
    echo: true,
    ages: [17, 21],
    scene: "nuit",
    domaine: "risque",
    condition: (e) => d(e, "amiType") === "turbulent" && ici(e),
    titre: "Écho du passé : ton ami·e d'enfance",
    texte: (e) =>
      `Tard le soir, ${nomAmi(e)} frappe à ta porte, essoufflé·e, un sac à la main : « Garde ça chez toi quelques jours. Ne pose pas de questions. »`,
    choix: [
      {
        texte: "Refuser et l'inciter à se rendre",
        traits: ["integre"],
        effets: { respect: 8, moral: -6 },
        drapeaux: { amiDestin: "a fait de la prison, puis s'en est sorti·e grâce à tes conseils." },
        resultat: (e) =>
          `${nomAmi(e)} part furieux·se. Des mois plus tard, ${estFille(e) ? "elle" : "il"} t'écrit depuis la maison d'arrêt : « Tu avais raison. »`,
      },
      {
        texte: "Garder le sac, par loyauté",
        alea: {
          chance: () => 0.4,
          succes: {
            effets: { moral: 4 },
            drapeaux: { amiDestin: "te doit une fière chandelle." },
            resultat: "Personne ne vient. Ton ami·e récupère son sac et disparaît quelque temps.",
          },
          echec: {
            effets: { respect: -18, famille: -12, moral: -12 },
            drapeaux: { amiDestin: "t'a entraîné·e dans ses ennuis avec la justice." },
            resultat:
              "Les policiers fouillent la maison. Tu passes une nuit au commissariat. Ta famille est humiliée devant tout le quartier.",
          },
        },
        resultat: "",
      },
    ],
  },
  {
    id: "echo-aventure",
    echo: true,
    ages: [19, 23],
    scene: "desert",
    condition: (e) => d(e, "resteAuPays") === true,
    titre: "Écho du passé : des nouvelles de l'aventurier",
    texte:
      "Ton ami parti « à l'aventure » quand tu avais 16 ans donne enfin des nouvelles. Il est bloqué au Niger, sans argent, et sa mère est désespérée.",
    choix: [
      {
        texte: "Cotiser pour payer son retour",
        traits: ["solidaire"],
        effets: { moyens: -10, respect: 8, moral: 6 },
        resultat: "Ton ami rentre amaigri mais vivant. Il raconte le désert aux jeunes du quartier pour les dissuader de partir.",
      },
      {
        texte: "Consoler sa mère, sans pouvoir faire plus",
        effets: { famille: 2, moral: -6 },
        resultat: "Tu te dis que tu as bien fait de rester. Mais tu penses souvent à lui.",
      },
    ],
  },
];

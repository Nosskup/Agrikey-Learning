// Modèles de documents d'AGRIKEY PME.
//
// Chaque modèle est un simple objet de données : pour en ajouter un, il suffit
// d'ajouter un objet à la liste MODELES, sans écrire de code.
//
// Mise en forme du contenu (une instruction par ligne) :
//   # Titre              -> grand titre centré
//   ## Sous-titre        -> titre de section
//   >> texte             -> ligne alignée à droite (date, signature, destinataire)
//   **texte**            -> gras
//   {{tableau_lignes}}   -> tableau des articles avec le total (si `lignes: true`)
//   ---                  -> grand espace (pour la signature et le cachet)
//   ligne vide           -> espace entre deux paragraphes
// Une ligne dont toutes les variables sont vides est retirée du document.
//
// Variables toujours disponibles : {{entreprise_nom}}, {{entreprise_adresse}},
// {{entreprise_ville}}, {{entreprise_telephone}}, {{entreprise_email}},
// {{entreprise_rccm}}, {{lieu_date}} (« Bamako, le 14/10/2026 »).
// Avec `lignes: true` : {{total}} et {{total_lettres}}.
// Pour chaque champ « montant » : {{<nom>}} et {{<nom>_lettres}}.

export type TypeChamp = "texte" | "texte_long" | "date" | "montant";

export type ChampModele = {
  nom: string;
  label: string;
  type: TypeChamp;
  obligatoire?: boolean;
  placeholder?: string;
  /** Valeur proposée ; "aujourdhui" pour la date du jour, "numero" pour un numéro automatique. */
  defaut?: string;
};

export type Modele = {
  code: string;
  titre: string;
  icone: string;
  description: string;
  /** Champ dont la valeur complète le titre dans l'historique (ex. : nom du client). */
  champTitre: string;
  /** Préfixe des numéros automatiques (ex. : "FAC" -> FAC-2026-001). */
  prefixeNumero?: string;
  /** Tableau d'articles (désignation, quantité, prix unitaire) avec total automatique. */
  lignes?: boolean;
  champs: ChampModele[];
  contenu: string;
};

const DATE_DOCUMENT: ChampModele = {
  nom: "date_document",
  label: "Date du document",
  type: "date",
  obligatoire: true,
  defaut: "aujourdhui",
};

const NUMERO: ChampModele = { nom: "numero", label: "Numéro", type: "texte", obligatoire: true, defaut: "numero" };

const SIGNATAIRE: ChampModele[] = [
  { nom: "signataire_nom", label: "Nom du signataire", type: "texte", placeholder: "Ex. : Adama Keïta" },
  { nom: "signataire_fonction", label: "Fonction du signataire", type: "texte", defaut: "Le Gérant" },
];

const CIVILITE: ChampModele = {
  nom: "civilite",
  label: "Formule d'appel",
  type: "texte",
  obligatoire: true,
  defaut: "Madame, Monsieur",
};

const SIGNATURE = `>> {{signataire_fonction}}
---
>> {{signataire_nom}}`;

export const MODELES: Modele[] = [
  {
    code: "devis",
    titre: "Devis",
    icone: "🧾",
    description: "Proposition de prix à un client, total calculé automatiquement.",
    champTitre: "client_nom",
    prefixeNumero: "DEV",
    lignes: true,
    champs: [
      NUMERO,
      DATE_DOCUMENT,
      { nom: "client_nom", label: "Nom du client", type: "texte", obligatoire: true },
      { nom: "client_adresse", label: "Adresse du client", type: "texte" },
      { nom: "client_telephone", label: "Téléphone du client", type: "texte" },
      { nom: "objet", label: "Objet", type: "texte", placeholder: "Ex. : Fourniture de matériel agricole" },
      { nom: "validite", label: "Validité (en jours)", type: "texte", obligatoire: true, defaut: "30" },
      { nom: "conditions", label: "Conditions (facultatif)", type: "texte_long", placeholder: "Ex. : 50 % à la commande, le reste à la livraison." },
      ...SIGNATAIRE,
    ],
    contenu: `# DEVIS N° {{numero}}
>> {{lieu_date}}

## Client
{{client_nom}}
{{client_adresse}}
Tél. : {{client_telephone}}

**Objet :** {{objet}}

{{tableau_lignes}}

Arrêté le présent devis à la somme de **{{total_lettres}} francs CFA** ({{total}}).

Ce devis est valable {{validite}} jours à compter de sa date.

{{conditions}}

${SIGNATURE}`,
  },
  {
    code: "facture",
    titre: "Facture simple",
    icone: "💵",
    description: "Facture à remettre au client, avec le montant en lettres.",
    champTitre: "client_nom",
    prefixeNumero: "FAC",
    lignes: true,
    champs: [
      NUMERO,
      DATE_DOCUMENT,
      { nom: "client_nom", label: "Nom du client", type: "texte", obligatoire: true },
      { nom: "client_adresse", label: "Adresse du client", type: "texte" },
      { nom: "client_telephone", label: "Téléphone du client", type: "texte" },
      { nom: "mode_paiement", label: "Mode de paiement", type: "texte", placeholder: "Ex. : Espèces, Orange Money, virement" },
      { nom: "date_echeance", label: "À payer avant le (facultatif)", type: "date" },
      ...SIGNATAIRE,
    ],
    contenu: `# FACTURE N° {{numero}}
>> {{lieu_date}}

## Facturé à
{{client_nom}}
{{client_adresse}}
Tél. : {{client_telephone}}

{{tableau_lignes}}

Arrêtée la présente facture à la somme de **{{total_lettres}} francs CFA** ({{total}}).

**Mode de paiement :** {{mode_paiement}}
**À payer avant le :** {{date_echeance}}

${SIGNATURE}`,
  },
  {
    code: "relance_paiement",
    titre: "Lettre de relance de paiement",
    icone: "⏰",
    description: "Rappeler poliment à un client une facture impayée.",
    champTitre: "client_nom",
    champs: [
      DATE_DOCUMENT,
      { nom: "client_nom", label: "Nom du client", type: "texte", obligatoire: true },
      { nom: "client_adresse", label: "Adresse du client", type: "texte" },
      CIVILITE,
      { nom: "facture_numero", label: "Numéro de la facture", type: "texte", obligatoire: true },
      { nom: "facture_date", label: "Date de la facture", type: "date", obligatoire: true },
      { nom: "montant_du", label: "Montant restant dû (FCFA)", type: "montant", obligatoire: true },
      { nom: "date_limite", label: "Payer au plus tard le", type: "date", obligatoire: true },
      ...SIGNATAIRE,
    ],
    contenu: `>> {{lieu_date}}

>> **{{client_nom}}**
>> {{client_adresse}}

**Objet :** Relance pour la facture N° {{facture_numero}}

{{civilite}},

Sauf erreur de notre part, la facture N° {{facture_numero}} du {{facture_date}}, d'un montant de **{{montant_du}}**, reste à ce jour impayée.

Nous vous prions de bien vouloir procéder à son règlement au plus tard le **{{date_limite}}**.

Si votre paiement a été effectué entre-temps, merci de ne pas tenir compte de ce courrier.

Nous vous prions d'agréer, {{civilite}}, l'expression de nos salutations distinguées.

${SIGNATURE}`,
  },
  {
    code: "recu",
    titre: "Reçu de paiement",
    icone: "✅",
    description: "Preuve qu'un client vous a payé, avec le montant en lettres.",
    champTitre: "client_nom",
    prefixeNumero: "REC",
    champs: [
      NUMERO,
      DATE_DOCUMENT,
      { nom: "client_nom", label: "Reçu de (nom du client)", type: "texte", obligatoire: true },
      { nom: "montant", label: "Montant reçu (FCFA)", type: "montant", obligatoire: true },
      { nom: "motif", label: "Motif du paiement", type: "texte", obligatoire: true, placeholder: "Ex. : Règlement de la facture FAC-2026-004" },
      { nom: "mode_paiement", label: "Mode de paiement", type: "texte", defaut: "Espèces" },
      ...SIGNATAIRE,
    ],
    contenu: `# REÇU DE PAIEMENT N° {{numero}}
>> {{lieu_date}}

Nous soussignés, **{{entreprise_nom}}**, reconnaissons avoir reçu de **{{client_nom}}** la somme de **{{montant_lettres}} francs CFA** ({{montant}}).

**Motif :** {{motif}}
**Mode de paiement :** {{mode_paiement}}

Pour servir et valoir ce que de droit.

${SIGNATURE}`,
  },
  {
    code: "bon_commande",
    titre: "Bon de commande",
    icone: "📦",
    description: "Commander des marchandises à un fournisseur.",
    champTitre: "fournisseur_nom",
    prefixeNumero: "BC",
    lignes: true,
    champs: [
      NUMERO,
      DATE_DOCUMENT,
      { nom: "fournisseur_nom", label: "Nom du fournisseur", type: "texte", obligatoire: true },
      { nom: "fournisseur_adresse", label: "Adresse du fournisseur", type: "texte" },
      { nom: "fournisseur_telephone", label: "Téléphone du fournisseur", type: "texte" },
      { nom: "date_livraison", label: "Livraison souhaitée le (facultatif)", type: "date" },
      { nom: "lieu_livraison", label: "Lieu de livraison", type: "texte" },
      ...SIGNATAIRE,
    ],
    contenu: `# BON DE COMMANDE N° {{numero}}
>> {{lieu_date}}

## Fournisseur
{{fournisseur_nom}}
{{fournisseur_adresse}}
Tél. : {{fournisseur_telephone}}

{{tableau_lignes}}

Montant total de la commande : **{{total_lettres}} francs CFA** ({{total}}).

**Livraison souhaitée le :** {{date_livraison}}
**Lieu de livraison :** {{lieu_livraison}}

${SIGNATURE}`,
  },
  {
    code: "rendez_vous",
    titre: "Lettre de demande de rendez-vous",
    icone: "🤝",
    description: "Demander un rendez-vous à un client, un partenaire ou une administration.",
    champTitre: "destinataire_nom",
    champs: [
      DATE_DOCUMENT,
      { nom: "destinataire_nom", label: "Destinataire", type: "texte", obligatoire: true, placeholder: "Ex. : M. le Directeur de la BNDA" },
      { nom: "destinataire_adresse", label: "Adresse du destinataire", type: "texte" },
      CIVILITE,
      { nom: "motif", label: "Je souhaite vous présenter…", type: "texte_long", obligatoire: true, placeholder: "Ex. : notre offre de livraison de céréales pour vos magasins" },
      { nom: "disponibilites", label: "Mes disponibilités", type: "texte", placeholder: "Ex. : du lundi au vendredi, de 9 h à 16 h" },
      ...SIGNATAIRE,
    ],
    contenu: `>> {{lieu_date}}

>> **{{destinataire_nom}}**
>> {{destinataire_adresse}}

**Objet :** Demande de rendez-vous

{{civilite}},

Je me permets de vous solliciter pour un rendez-vous afin de vous présenter {{motif}}.

Je serais disponible {{disponibilites}}, selon ce qui vous conviendra le mieux.

Vous pouvez me joindre au {{entreprise_telephone}}.

Dans l'attente de votre réponse, je vous prie d'agréer, {{civilite}}, l'expression de mes salutations distinguées.

${SIGNATURE}`,
  },
  {
    code: "attestation_travail",
    titre: "Attestation de travail",
    icone: "📜",
    description: "Attester qu'une personne travaille dans votre entreprise.",
    champTitre: "employe_nom",
    champs: [
      DATE_DOCUMENT,
      { nom: "employe_nom", label: "Nom de l'employé(e)", type: "texte", obligatoire: true },
      { nom: "poste", label: "Poste occupé", type: "texte", obligatoire: true, placeholder: "Ex. : Vendeur" },
      { nom: "date_embauche", label: "Date d'embauche", type: "date", obligatoire: true },
      { nom: "signataire_nom", label: "Nom du signataire", type: "texte", obligatoire: true },
      { nom: "signataire_fonction", label: "Fonction du signataire", type: "texte", obligatoire: true, defaut: "Gérant" },
    ],
    contenu: `# ATTESTATION DE TRAVAIL

Je soussigné(e), **{{signataire_nom}}**, {{signataire_fonction}} de **{{entreprise_nom}}**, atteste que **{{employe_nom}}** est employé(e) au sein de notre entreprise depuis le **{{date_embauche}}** en qualité de **{{poste}}**.

La présente attestation lui est délivrée, à sa demande, pour servir et valoir ce que de droit.

>> {{lieu_date}}
>> {{signataire_fonction}}
---
>> {{signataire_nom}}`,
  },
  {
    code: "demande_conge",
    titre: "Demande de congé",
    icone: "🌴",
    description: "Lettre d'un employé pour demander des jours de congé.",
    champTitre: "employe_nom",
    champs: [
      DATE_DOCUMENT,
      { nom: "employe_nom", label: "Nom de l'employé(e)", type: "texte", obligatoire: true },
      { nom: "poste", label: "Poste occupé", type: "texte" },
      { nom: "destinataire", label: "Adressée à", type: "texte", obligatoire: true, defaut: "Monsieur le Directeur" },
      { nom: "date_debut", label: "Premier jour de congé", type: "date", obligatoire: true },
      { nom: "date_fin", label: "Dernier jour de congé", type: "date", obligatoire: true },
      { nom: "motif", label: "Motif (facultatif)", type: "texte", placeholder: "Ex. : congé annuel" },
    ],
    contenu: `>> {{lieu_date}}

**{{employe_nom}}**
{{poste}}

>> À {{destinataire}}

**Objet :** Demande de congé

{{destinataire}},

J'ai l'honneur de solliciter un congé du **{{date_debut}}** au **{{date_fin}}** inclus.

**Motif :** {{motif}}

Je m'engage à prendre les dispositions nécessaires pour assurer la continuité de mon travail pendant mon absence.

Dans l'attente d'une suite favorable, veuillez agréer, {{destinataire}}, l'expression de ma haute considération.

---
>> {{employe_nom}}`,
  },
  {
    code: "convocation",
    titre: "Convocation à une réunion",
    icone: "📢",
    description: "Inviter le personnel ou des partenaires à une réunion.",
    champTitre: "objet",
    champs: [
      DATE_DOCUMENT,
      { nom: "destinataires", label: "Destinataires", type: "texte", obligatoire: true, defaut: "Aux membres du personnel" },
      { nom: "objet", label: "Objet de la réunion", type: "texte", obligatoire: true, placeholder: "Ex. : Bilan du mois de septembre" },
      { nom: "date_reunion", label: "Date de la réunion", type: "date", obligatoire: true },
      { nom: "heure", label: "Heure", type: "texte", obligatoire: true, placeholder: "Ex. : 10 h 00" },
      { nom: "lieu", label: "Lieu", type: "texte", obligatoire: true, placeholder: "Ex. : au siège de l'entreprise" },
      { nom: "ordre_du_jour", label: "Ordre du jour", type: "texte_long", obligatoire: true, placeholder: "Un point par ligne" },
      ...SIGNATAIRE,
    ],
    contenu: `# CONVOCATION
>> {{lieu_date}}

**À :** {{destinataires}}

**Objet :** {{objet}}

Vous êtes convoqué(e)s à une réunion qui se tiendra le **{{date_reunion}}** à **{{heure}}**, {{lieu}}.

## Ordre du jour
{{ordre_du_jour}}

Votre présence est vivement souhaitée.

${SIGNATURE}`,
  },
  {
    code: "compte_rendu",
    titre: "Compte rendu de réunion",
    icone: "📝",
    description: "Garder une trace écrite des échanges et des décisions.",
    champTitre: "objet",
    champs: [
      { nom: "date_reunion", label: "Date de la réunion", type: "date", obligatoire: true, defaut: "aujourdhui" },
      { nom: "lieu", label: "Lieu", type: "texte" },
      { nom: "objet", label: "Objet de la réunion", type: "texte", obligatoire: true },
      { nom: "participants", label: "Participants", type: "texte_long", obligatoire: true, placeholder: "Un nom par ligne" },
      { nom: "points_abordes", label: "Points abordés", type: "texte_long", obligatoire: true },
      { nom: "decisions", label: "Décisions prises", type: "texte_long", obligatoire: true },
      { nom: "redacteur", label: "Rédigé par", type: "texte" },
      { ...DATE_DOCUMENT, label: "Date de rédaction" },
    ],
    contenu: `# COMPTE RENDU DE RÉUNION

**Date :** {{date_reunion}}
**Lieu :** {{lieu}}
**Objet :** {{objet}}

## Participants
{{participants}}

## Points abordés
{{points_abordes}}

## Décisions prises
{{decisions}}

>> Rédigé par {{redacteur}}
>> {{lieu_date}}`,
  },
];

export function trouverModele(code: string): Modele | undefined {
  return MODELES.find((m) => m.code === code);
}

/** Modèles visibles selon une liste d'autorisation (null ou « * » = tous). */
export function filtrerModeles(autorises: string[] | null): Modele[] {
  if (!autorises || autorises.includes("*")) return MODELES;
  return MODELES.filter((m) => autorises.includes(m.code));
}

/** Résumé lisible d'une liste d'autorisation, pour l'administration. */
export function resumerModeles(autorises: string[] | null): string {
  if (!autorises || autorises.includes("*")) return "Tous les modèles";
  const titres = filtrerModeles(autorises).map((m) => m.titre);
  if (titres.length === 0) return "Aucun modèle";
  return `${titres.length} modèle${titres.length > 1 ? "s" : ""} : ${titres.join(", ")}`;
}

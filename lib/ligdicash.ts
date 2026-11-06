// Client LigdiCash commun (formations AGRIKEY Learning et abonnement AGRIKEY PME).
// Code serveur uniquement : utilise les clés secrètes LigdiCash.
//
// Variables d'environnement (Vercel > Settings > Environment Variables) :
//   LIGDICASH_API_KEY     clé API (Apikey) du projet API LigdiCash
//   LIGDICASH_AUTH_TOKEN  jeton API_TOKEN du même projet (LIGDICASH_API_TOKEN accepté aussi)
//   LIGDICASH_MODE        absent = « test » (compte d'intégration fourni par LigdiCash) ;
//                         « live » = compte de production. Attention : LigdiCash n'a pas de
//                         bac à sable, les paiements du compte d'intégration sont réels.
//   LIGDICASH_URL_API     facultatif : autre adresse d'API, si LigdiCash en indique une
//
// Selon la documentation officielle (developers.ligdicash.com) : une seule adresse,
// app.ligdicash.com ; création « redirect/checkout-invoice/create » ; vérification
// « redirect/checkout-invoice/confirm » avec le jeton reçu à la création (le jeton du
// callback est vide) ; notre référence passe dans custom_data.transaction_id.
//
// Les variables sont relues à chaque appel (et non au chargement du module) pour
// refléter la configuration réellement présente sur le serveur.

import "server-only";

export const ADRESSE_CALLBACK = "/api/pme/ligdicash";

function cle(): string {
  return (process.env.LIGDICASH_API_KEY ?? "").trim();
}

function jeton(): string {
  return (process.env.LIGDICASH_AUTH_TOKEN || process.env.LIGDICASH_API_TOKEN || "").trim();
}

function urlApi(): string {
  return (process.env.LIGDICASH_URL_API || "https://app.ligdicash.com/pay/v01/").trim().replace(/\/?$/, "/");
}

export function modeLigdicash(): "test" | "live" {
  return process.env.LIGDICASH_MODE?.trim() === "live" ? "live" : "test";
}

export function ligdicashConfigure(): boolean {
  return Boolean(cle() && jeton());
}

/** Ce que le serveur voit de la configuration, sans jamais révéler les valeurs (page admin). */
export function diagnosticLigdicash() {
  return {
    cle: Boolean(cle()),
    jeton: Boolean(jeton()),
    nomJeton: process.env.LIGDICASH_AUTH_TOKEN ? "LIGDICASH_AUTH_TOKEN" : process.env.LIGDICASH_API_TOKEN ? "LIGDICASH_API_TOKEN" : null,
    mode: modeLigdicash(),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    // Noms (jamais les valeurs) des variables qui ressemblent à des clés LigdiCash :
    // permet de repérer une faute de nom ou une variable vide.
    nomsProches: Object.keys(process.env)
      .filter((nom) => /ligdi|apikey|api_key|auth_token|api_token/i.test(nom))
      .map((nom) => `${JSON.stringify(nom)}${process.env[nom]?.trim() ? "" : " (vide)"}`)
      .sort(),
    // Fournies par Vercel : quel déploiement répond.
    environnement: process.env.VERCEL_ENV ?? "inconnu",
    version: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7) || "inconnue",
  };
}

function entetes() {
  return {
    Apikey: cle(),
    Authorization: `Bearer ${jeton()}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

/** custom_data revient soit en objet, soit en liste { keyof_customdata, valueof_customdata }. */
export function lireDonneePerso(customData: unknown, nom: string): string | undefined {
  if (Array.isArray(customData)) {
    const ligne = customData.find((l) => l && typeof l === "object" && (l as Record<string, unknown>).keyof_customdata === nom);
    const valeur = ligne ? (ligne as Record<string, unknown>).valueof_customdata : undefined;
    return valeur == null ? undefined : String(valeur);
  }
  if (customData && typeof customData === "object") {
    const valeur = (customData as Record<string, unknown>)[nom];
    return valeur == null ? undefined : String(valeur);
  }
  return undefined;
}

export type Facture = {
  /** Notre identifiant de paiement, renvoyé par LigdiCash dans custom_data.transaction_id. */
  transactionId: string;
  montant: number;
  libelle: string;
  description: string;
  prenom?: string;
  nom?: string;
  email?: string;
  boutique: string;
  origine: string;
  urlRetour: string;
  urlAnnulation: string;
};

/** Crée la facture LigdiCash (payin avec redirection). Renvoie le jeton et l'adresse de paiement. */
export async function creerFacture(f: Facture): Promise<{ token: string; url: string } | { erreur: string }> {
  const description = f.description.slice(0, 200);
  const reponse = await fetch(`${urlApi()}redirect/checkout-invoice/create`, {
    method: "POST",
    headers: entetes(),
    body: JSON.stringify({
      commande: {
        invoice: {
          items: [{ name: f.libelle.slice(0, 120), description, quantity: 1, unit_price: f.montant, total_price: f.montant }],
          total_amount: f.montant,
          devise: "XOF",
          description,
          // Doit rester vide : sinon LigdiCash filtre les opérateurs proposés.
          customer: "",
          customer_firstname: (f.prenom ?? "").slice(0, 60),
          customer_lastname: (f.nom ?? "").slice(0, 60),
          customer_email: f.email ?? "",
          external_id: "",
          otp: "",
        },
        store: { name: f.boutique, website_url: f.origine },
        actions: {
          cancel_url: f.urlAnnulation,
          return_url: f.urlRetour,
          callback_url: `${f.origine}${ADRESSE_CALLBACK}`,
        },
        custom_data: { transaction_id: f.transactionId },
      },
    }),
    signal: AbortSignal.timeout(20000),
  }).catch((e) => {
    console.error("LigdiCash injoignable :", e);
    return null;
  });

  const donnees = (await reponse?.json().catch(() => null)) as
    | { response_code?: string; response_text?: string; token?: string; wiki?: string }
    | null;
  if (!donnees || donnees.response_code !== "00" || !donnees.response_text?.startsWith("http") || !donnees.token) {
    console.error("Facture LigdiCash non créée :", reponse?.status, donnees);
    return { erreur: "LigdiCash n'a pas répondu. Réessayez dans quelques minutes." };
  }
  return { token: donnees.token, url: donnees.response_text };
}

export type Confirmation = {
  status: "completed" | "pending" | "notcompleted" | string;
  montant: number;
  transactionId?: string;
};

/** Statut d'une facture, demandé à LigdiCash avec le jeton reçu à la création. Null si la vérification échoue. */
export async function confirmerFacture(token: string): Promise<Confirmation | null> {
  if (!/^[\w.-]{6,400}$/.test(token)) return null;
  const reponse = await fetch(`${urlApi()}redirect/checkout-invoice/confirm/?invoiceToken=${encodeURIComponent(token)}`, {
    headers: entetes(),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  const donnees = (await reponse?.json().catch(() => null)) as
    | { response_code?: string; status?: string; montant?: number | string; amount?: number | string; custom_data?: unknown }
    | null;
  if (!donnees || donnees.response_code !== "00") {
    console.error("Vérification LigdiCash impossible :", reponse?.status, donnees);
    return null;
  }
  return {
    status: donnees.status === "nocompleted" ? "notcompleted" : (donnees.status ?? "pending"),
    montant: Number(donnees.montant ?? donnees.amount),
    transactionId: lireDonneePerso(donnees.custom_data, "transaction_id"),
  };
}

// Paiement de l'abonnement AGRIKEY PME avec LigdiCash (Orange Money, Moov…).
// Code serveur uniquement : utilise les clés secrètes LigdiCash et la clé service_role.
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

import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { formuleParCode, type Formule } from "./formules";

export const MODE_LIGDICASH: "test" | "live" = process.env.LIGDICASH_MODE === "live" ? "live" : "test";

const URL_API = (process.env.LIGDICASH_URL_API || "https://app.ligdicash.com/pay/v01/").replace(/\/?$/, "/");
const JETON = process.env.LIGDICASH_AUTH_TOKEN || process.env.LIGDICASH_API_TOKEN || "";

function entetes() {
  return {
    Apikey: process.env.LIGDICASH_API_KEY ?? "",
    Authorization: `Bearer ${JETON}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export function ligdicashConfigure(): boolean {
  return Boolean(process.env.LIGDICASH_API_KEY && JETON);
}

type ReponseCreation = { response_code?: string; response_text?: string; token?: string; description?: string };

type ReponseConfirmation = {
  response_code?: string;
  response_text?: string;
  status?: string;
  montant?: number | string;
  amount?: number | string;
  custom_data?: unknown;
};

/** custom_data revient soit en objet, soit en liste { keyof_customdata, valueof_customdata }. */
export function lireDonneePerso(customData: unknown, cle: string): string | undefined {
  if (Array.isArray(customData)) {
    const ligne = customData.find((l) => l && typeof l === "object" && (l as Record<string, unknown>).keyof_customdata === cle);
    const valeur = ligne ? (ligne as Record<string, unknown>).valueof_customdata : undefined;
    return valeur == null ? undefined : String(valeur);
  }
  if (customData && typeof customData === "object") {
    const valeur = (customData as Record<string, unknown>)[cle];
    return valeur == null ? undefined : String(valeur);
  }
  return undefined;
}

/**
 * Enregistre un paiement « en attente » et crée la facture LigdiCash.
 * Renvoie l'adresse de la page de paiement LigdiCash, ou un message d'erreur.
 */
export async function creerFactureLigdicash(
  utilisateur: { id: string; email?: string },
  formule: Formule,
  nomEntreprise: string,
  origine: string
): Promise<{ url: string } | { erreur: string }> {
  const admin = createSupabaseAdminClient();

  const { data: paiement, error } = await admin
    .from("pme_paiements")
    .insert({
      user_id: utilisateur.id,
      formule: formule.code,
      montant: formule.montant,
      mode: MODE_LIGDICASH,
      fournisseur: "ligdicash",
    })
    .select("id")
    .single();
  if (error || !paiement) {
    console.error("Paiement PME non enregistré :", error?.message);
    return { erreur: "Le paiement n'a pas pu être préparé. Réessayez dans un instant." };
  }

  const description = `AGRIKEY PME – ${formule.titre} – ${nomEntreprise}`.slice(0, 200);
  const reponse = await fetch(`${URL_API}redirect/checkout-invoice/create`, {
    method: "POST",
    headers: entetes(),
    body: JSON.stringify({
      commande: {
        invoice: {
          items: [
            {
              name: formule.titre,
              description,
              quantity: 1,
              unit_price: formule.montant,
              total_price: formule.montant,
            },
          ],
          total_amount: formule.montant,
          devise: "XOF",
          description,
          customer: "",
          customer_firstname: nomEntreprise.slice(0, 60),
          customer_lastname: "",
          customer_email: utilisateur.email ?? "",
          external_id: "",
          otp: "",
        },
        store: { name: "AGRIKEY PME", website_url: origine },
        actions: {
          cancel_url: `${origine}/pme/abonnement?annule=1`,
          return_url: `${origine}/pme/abonnement/retour?paiement=${paiement.id}`,
          callback_url: `${origine}/api/pme/ligdicash`,
        },
        custom_data: { transaction_id: paiement.id },
      },
    }),
    signal: AbortSignal.timeout(20000),
  }).catch((e) => {
    console.error("LigdiCash injoignable :", e);
    return null;
  });

  const donnees = (await reponse?.json().catch(() => null)) as ReponseCreation | null;
  if (!donnees || donnees.response_code !== "00" || !donnees.response_text?.startsWith("http") || !donnees.token) {
    console.error("Facture LigdiCash non créée :", reponse?.status, donnees);
    await admin.from("pme_paiements").update({ statut: "echoue" }).eq("id", paiement.id);
    return { erreur: "LigdiCash n'a pas répondu. Réessayez dans quelques minutes." };
  }

  await admin.from("pme_paiements").update({ token: donnees.token }).eq("id", paiement.id);
  return { url: donnees.response_text };
}

export type ResultatVerification = "paye" | "en_attente" | "annule" | "invalide";

/**
 * Vérifie une facture directement auprès de LigdiCash (on ne croit jamais
 * ce que le navigateur ou la notification envoient) et active l'abonnement
 * si elle est payée. Peut être appelée plusieurs fois sans risque.
 */
export async function verifierPaiementLigdicash(token: string): Promise<ResultatVerification> {
  if (!/^[\w.-]{6,300}$/.test(token)) return "invalide";

  const reponse = await fetch(`${URL_API}redirect/checkout-invoice/confirm/?invoiceToken=${encodeURIComponent(token)}`, {
    headers: entetes(),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  const donnees = (await reponse?.json().catch(() => null)) as ReponseConfirmation | null;
  if (!donnees || donnees.response_code !== "00") {
    console.error("Vérification LigdiCash impossible :", reponse?.status, donnees);
    return "invalide";
  }

  const admin = createSupabaseAdminClient();
  const { data: paiement } = await admin
    .from("pme_paiements")
    .select("id, formule, montant, statut, token, mode, fournisseur")
    .eq("token", token)
    .maybeSingle();

  // La facture doit être la nôtre, pour le bon paiement, le bon montant et le même mode.
  const formule = formuleParCode(paiement?.formule);
  const montant = Number(donnees.montant ?? donnees.amount);
  const paiementId = lireDonneePerso(donnees.custom_data, "transaction_id");
  if (
    !paiement ||
    !formule ||
    paiement.fournisseur !== "ligdicash" ||
    paiement.mode !== MODE_LIGDICASH ||
    (paiementId !== undefined && paiementId !== paiement.id) ||
    (Number.isFinite(montant) && montant !== paiement.montant)
  ) {
    console.error("Paiement PME LigdiCash incohérent pour le jeton", token, { montant, paiementId });
    return "invalide";
  }

  if (paiement.statut === "paye") return "paye";

  if (donnees.status === "completed") {
    // Montant obligatoire pour activer : on ne valide jamais un paiement dont on ne connaît pas le montant.
    if (!Number.isFinite(montant)) {
      console.error("Paiement LigdiCash sans montant pour le jeton", token);
      return "en_attente";
    }
    const { error } = await admin.rpc("pme_activer_abonnement", { p_paiement: paiement.id });
    if (error) {
      console.error("Activation de l'abonnement impossible :", error.message);
      return "en_attente";
    }
    return "paye";
  }

  if (donnees.status === "notcompleted" || donnees.status === "nocompleted") {
    await admin.from("pme_paiements").update({ statut: "annule" }).eq("id", paiement.id).eq("statut", "en_attente");
    return "annule";
  }

  return "en_attente";
}

/**
 * Retrouve notre paiement à partir d'une notification LigdiCash (JSON ou formulaire)
 * et le revérifie avec le jeton enregistré à la création. Les deux notifications
 * envoyées pour un même paiement donnent le même résultat (traitement idempotent).
 */
export async function traiterNotificationLigdicash(transactionId: string): Promise<ResultatVerification> {
  if (!/^[0-9a-f-]{36}$/i.test(transactionId)) return "invalide";
  const admin = createSupabaseAdminClient();
  const { data: paiement } = await admin
    .from("pme_paiements")
    .select("token, fournisseur")
    .eq("id", transactionId)
    .maybeSingle();
  if (!paiement?.token || paiement.fournisseur !== "ligdicash") return "invalide";
  return verifierPaiementLigdicash(paiement.token);
}

// Paiement de l'abonnement AGRIKEY PME avec PayDunya.
// Code serveur uniquement : utilise les clés secrètes PayDunya et la clé service_role.
//
// Mode test : PAYDUNYA_MODE absent ou différent de « live » -> bac à sable PayDunya,
// aucun argent réel n'est débité. Mêmes variables d'environnement que les formations :
// PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY, PAYDUNYA_TOKEN (clés de test en mode test).

import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { formuleParCode, type Formule } from "./formules";

export const MODE_PAYDUNYA: "test" | "live" = process.env.PAYDUNYA_MODE === "live" ? "live" : "test";

const URL_API =
  MODE_PAYDUNYA === "live" ? "https://app.paydunya.com/api/v1" : "https://app.paydunya.com/sandbox-api/v1";

function entetes() {
  return {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": process.env.PAYDUNYA_MASTER_KEY ?? "",
    "PAYDUNYA-PRIVATE-KEY": process.env.PAYDUNYA_PRIVATE_KEY ?? "",
    "PAYDUNYA-TOKEN": process.env.PAYDUNYA_TOKEN ?? "",
  };
}

export function paydunyaConfigure(): boolean {
  return Boolean(process.env.PAYDUNYA_MASTER_KEY && process.env.PAYDUNYA_PRIVATE_KEY && process.env.PAYDUNYA_TOKEN);
}

type ReponseCreation = { response_code?: string; response_text?: string; token?: string };

type ReponseConfirmation = {
  response_code?: string;
  status?: string;
  invoice?: { total_amount?: number | string };
  custom_data?: { paiement_id?: string };
};

/**
 * Enregistre un paiement « en attente » et crée la facture PayDunya.
 * Renvoie l'adresse de la page de paiement PayDunya, ou un message d'erreur.
 */
export async function creerFactureAbonnement(
  utilisateur: { id: string; email?: string },
  formule: Formule,
  nomEntreprise: string,
  origine: string
): Promise<{ url: string } | { erreur: string }> {
  const admin = createSupabaseAdminClient();

  const { data: paiement, error } = await admin
    .from("pme_paiements")
    .insert({ user_id: utilisateur.id, formule: formule.code, montant: formule.montant, mode: MODE_PAYDUNYA })
    .select("id")
    .single();
  if (error || !paiement) {
    console.error("Paiement PME non enregistré :", error?.message);
    return { erreur: "Le paiement n'a pas pu être préparé. Réessayez dans un instant." };
  }

  const reponse = await fetch(`${URL_API}/checkout-invoice/create`, {
    method: "POST",
    headers: entetes(),
    body: JSON.stringify({
      invoice: {
        total_amount: formule.montant,
        description: `AGRIKEY PME – ${formule.titre} – ${nomEntreprise}`.slice(0, 200),
      },
      store: { name: "AGRIKEY PME", website_url: origine },
      custom_data: { paiement_id: paiement.id },
      actions: {
        cancel_url: `${origine}/pme/abonnement?annule=1`,
        // PayDunya ajoute « ?token=… » à ces adresses.
        return_url: `${origine}/pme/abonnement/retour`,
        callback_url: `${origine}/api/pme/paydunya`,
      },
    }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);

  const donnees = (await reponse?.json().catch(() => null)) as ReponseCreation | null;
  if (!donnees || donnees.response_code !== "00" || !donnees.response_text || !donnees.token) {
    console.error("Facture PayDunya non créée :", donnees);
    await admin.from("pme_paiements").update({ statut: "echoue" }).eq("id", paiement.id);
    return { erreur: "PayDunya n'a pas répondu. Réessayez dans quelques minutes." };
  }

  await admin.from("pme_paiements").update({ token: donnees.token }).eq("id", paiement.id);
  return { url: donnees.response_text };
}

export type ResultatVerification = "paye" | "en_attente" | "annule" | "invalide";

/**
 * Vérifie une facture directement auprès de PayDunya (on ne croit jamais
 * ce que le navigateur ou la notification envoient) et active l'abonnement
 * si elle est payée. Peut être appelée plusieurs fois sans risque.
 */
export async function verifierPaiement(token: string): Promise<ResultatVerification> {
  if (!/^[\w-]{6,100}$/.test(token)) return "invalide";

  const reponse = await fetch(`${URL_API}/checkout-invoice/confirm/${token}`, {
    headers: entetes(),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);
  const donnees = (await reponse?.json().catch(() => null)) as ReponseConfirmation | null;
  if (!donnees || donnees.response_code !== "00") return "invalide";

  const admin = createSupabaseAdminClient();
  const { data: paiement } = await admin
    .from("pme_paiements")
    .select("id, formule, montant, statut, token, mode")
    .eq("token", token)
    .maybeSingle();

  // La facture doit être la nôtre, pour le bon paiement, le bon montant et le même mode.
  const formule = formuleParCode(paiement?.formule);
  if (
    !paiement ||
    !formule ||
    donnees.custom_data?.paiement_id !== paiement.id ||
    Number(donnees.invoice?.total_amount) !== paiement.montant ||
    paiement.mode !== MODE_PAYDUNYA
  ) {
    console.error("Paiement PME incohérent pour le jeton", token);
    return "invalide";
  }

  if (paiement.statut === "paye") return "paye";

  if (donnees.status === "completed") {
    const { error } = await admin.rpc("pme_activer_abonnement", { p_paiement: paiement.id });
    if (error) {
      console.error("Activation de l'abonnement impossible :", error.message);
      return "en_attente";
    }
    return "paye";
  }

  if (donnees.status === "cancelled") {
    await admin.from("pme_paiements").update({ statut: "annule" }).eq("id", paiement.id).eq("statut", "en_attente");
    return "annule";
  }

  return "en_attente";
}

// Paiement des formations AGRIKEY Learning avec LigdiCash.
// Code serveur uniquement. Appels LigdiCash : voir lib/ligdicash.ts.
//
// Le paiement « en attente » est créé par la fonction Supabase create_pending_payment ;
// le jeton LigdiCash de création est rangé dans payments.transaction_id, puis
// confirm_payment marque le paiement comme payé (ce qui inscrit l'apprenant).

import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { confirmerFacture } from "@/lib/ligdicash";

export type ResultatFormation = "paye" | "en_attente" | "annule" | "invalide";

type Paiement = { id: string | number; user_id: string; amount: number; status: string; transaction_id: string | null };

export async function lirePaiementFormation(paymentId: string): Promise<Paiement | null> {
  if (!/^[\w-]{1,64}$/.test(paymentId)) return null;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select("id, user_id, amount, status, transaction_id")
    .eq("id", paymentId)
    .maybeSingle<Paiement>();
  if (error) return null;
  return data;
}

/**
 * Vérifie le paiement d'une formation directement auprès de LigdiCash et le confirme
 * s'il est payé. Peut être appelée plusieurs fois sans risque.
 */
export async function verifierPaiementFormation(paymentId: string): Promise<ResultatFormation> {
  const paiement = await lirePaiementFormation(paymentId);
  if (!paiement?.transaction_id) return "invalide";
  if (paiement.status === "paid") return "paye";

  const confirmation = await confirmerFacture(paiement.transaction_id);
  if (!confirmation) return "invalide";

  if (
    (confirmation.transactionId !== undefined && confirmation.transactionId !== String(paiement.id)) ||
    (Number.isFinite(confirmation.montant) && confirmation.montant !== Number(paiement.amount))
  ) {
    console.error("Paiement de formation LigdiCash incohérent :", paiement.id, confirmation);
    return "invalide";
  }

  if (confirmation.status === "completed") {
    if (!Number.isFinite(confirmation.montant)) return "en_attente";
    const admin = createSupabaseAdminClient();
    const { error } = await admin.rpc("confirm_payment", {
      p_payment_id: paiement.id,
      p_transaction_id: paiement.transaction_id,
    });
    if (error) {
      console.error("confirm_payment impossible :", error.message);
      return "en_attente";
    }
    return "paye";
  }

  return confirmation.status === "notcompleted" ? "annule" : "en_attente";
}

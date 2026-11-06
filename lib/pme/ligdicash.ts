// Paiement de l'abonnement AGRIKEY PME avec LigdiCash (Orange Money, Moov…).
// Code serveur uniquement. Appels LigdiCash : voir lib/ligdicash.ts.

import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { confirmerFacture, creerFacture, modeLigdicash } from "@/lib/ligdicash";
import { formuleParCode, type Formule } from "./formules";

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
      mode: modeLigdicash(),
      fournisseur: "ligdicash",
    })
    .select("id")
    .single();
  if (error || !paiement) {
    console.error("Paiement PME non enregistré :", error?.message);
    return { erreur: "Le paiement n'a pas pu être préparé. Réessayez dans un instant." };
  }

  const facture = await creerFacture({
    transactionId: paiement.id,
    montant: formule.montant,
    libelle: formule.titre,
    description: `AGRIKEY PME – ${formule.titre} – ${nomEntreprise}`,
    prenom: nomEntreprise,
    email: utilisateur.email,
    boutique: "AGRIKEY PME",
    origine,
    urlRetour: `${origine}/pme/abonnement/retour?paiement=${paiement.id}`,
    urlAnnulation: `${origine}/pme/abonnement?annule=1`,
  });

  if ("erreur" in facture) {
    await admin.from("pme_paiements").update({ statut: "echoue" }).eq("id", paiement.id);
    return facture;
  }

  await admin.from("pme_paiements").update({ token: facture.token }).eq("id", paiement.id);
  return { url: facture.url };
}

export type ResultatVerification = "paye" | "en_attente" | "annule" | "invalide";

/**
 * Vérifie une facture directement auprès de LigdiCash (on ne croit jamais
 * ce que le navigateur ou la notification envoient) et active l'abonnement
 * si elle est payée. Peut être appelée plusieurs fois sans risque.
 */
export async function verifierPaiementLigdicash(token: string): Promise<ResultatVerification> {
  const confirmation = await confirmerFacture(token);
  if (!confirmation) return "invalide";

  const admin = createSupabaseAdminClient();
  const { data: paiement } = await admin
    .from("pme_paiements")
    .select("id, formule, montant, statut, token, mode, fournisseur")
    .eq("token", token)
    .maybeSingle();

  // La facture doit être la nôtre, pour le bon paiement, le bon montant et le même mode.
  const formule = formuleParCode(paiement?.formule);
  if (
    !paiement ||
    !formule ||
    paiement.fournisseur !== "ligdicash" ||
    paiement.mode !== modeLigdicash() ||
    (confirmation.transactionId !== undefined && confirmation.transactionId !== paiement.id) ||
    (Number.isFinite(confirmation.montant) && confirmation.montant !== paiement.montant)
  ) {
    console.error("Paiement PME LigdiCash incohérent pour le jeton", token, confirmation);
    return "invalide";
  }

  if (paiement.statut === "paye") return "paye";

  if (confirmation.status === "completed") {
    // On ne valide jamais un paiement dont on ne connaît pas le montant.
    if (!Number.isFinite(confirmation.montant)) return "en_attente";
    const { error } = await admin.rpc("pme_activer_abonnement", { p_paiement: paiement.id });
    if (error) {
      console.error("Activation de l'abonnement impossible :", error.message);
      return "en_attente";
    }
    return "paye";
  }

  if (confirmation.status === "notcompleted") {
    await admin.from("pme_paiements").update({ statut: "annule" }).eq("id", paiement.id).eq("statut", "en_attente");
    return "annule";
  }

  return "en_attente";
}

/**
 * Notification LigdiCash concernant peut-être un abonnement PME : null si ce
 * transaction_id n'est pas un paiement PME (il peut s'agir d'une formation).
 */
export async function traiterNotificationPme(transactionId: string): Promise<ResultatVerification | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transactionId)) return null;
  const admin = createSupabaseAdminClient();
  const { data: paiement } = await admin
    .from("pme_paiements")
    .select("token, fournisseur")
    .eq("id", transactionId)
    .maybeSingle();
  if (!paiement) return null;
  if (!paiement.token || paiement.fournisseur !== "ligdicash") return "invalide";
  return verifierPaiementLigdicash(paiement.token);
}

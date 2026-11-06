// Choix du service de paiement de l'abonnement AGRIKEY PME.
//
// LigdiCash dès que ses clés sont configurées, sinon PayDunya.
// PAIEMENT_PME=paydunya force PayDunya.

import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Formule } from "./formules";
import { creerFactureAbonnement, MODE_PAYDUNYA, paydunyaConfigure, verifierPaiement, type ResultatVerification } from "./paydunya";
import { creerFactureLigdicash, ligdicashConfigure, MODE_LIGDICASH, verifierPaiementLigdicash } from "./ligdicash";

export type { ResultatVerification };

export const FOURNISSEUR: "ligdicash" | "paydunya" =
  process.env.PAIEMENT_PME !== "paydunya" && ligdicashConfigure() ? "ligdicash" : "paydunya";

export const NOM_FOURNISSEUR = FOURNISSEUR === "ligdicash" ? "LigdiCash" : "PayDunya";
export const MODE_PAIEMENT = FOURNISSEUR === "ligdicash" ? MODE_LIGDICASH : MODE_PAYDUNYA;

export function paiementConfigure(): boolean {
  return FOURNISSEUR === "ligdicash" ? ligdicashConfigure() : paydunyaConfigure();
}

export function creerFacture(
  utilisateur: { id: string; email?: string },
  formule: Formule,
  nomEntreprise: string,
  origine: string
) {
  return FOURNISSEUR === "ligdicash"
    ? creerFactureLigdicash(utilisateur, formule, nomEntreprise, origine)
    : creerFactureAbonnement(utilisateur, formule, nomEntreprise, origine);
}

/** Vérifie un paiement du membre connecté auprès du service qui l'a traité. */
export async function verifierPaiementDuMembre(paiementId: string, userId: string): Promise<ResultatVerification> {
  const admin = createSupabaseAdminClient();
  const { data: paiement } = await admin
    .from("pme_paiements")
    .select("token, user_id, fournisseur")
    .eq("id", paiementId)
    .maybeSingle();
  if (!paiement?.token || paiement.user_id !== userId) return "invalide";
  return paiement.fournisseur === "ligdicash"
    ? verifierPaiementLigdicash(paiement.token)
    : verifierPaiement(paiement.token);
}

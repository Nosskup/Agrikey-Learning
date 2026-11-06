// Choix du service de paiement de l'abonnement AGRIKEY PME.
//
// LigdiCash dès que ses clés sont configurées, sinon PayDunya.
// PAIEMENT_PME=paydunya force PayDunya. Relu à chaque appel.

import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { ligdicashConfigure, modeLigdicash } from "@/lib/ligdicash";
import type { Formule } from "./formules";
import { creerFactureAbonnement, MODE_PAYDUNYA, paydunyaConfigure, verifierPaiement, type ResultatVerification } from "./paydunya";
import { creerFactureLigdicash, verifierPaiementLigdicash } from "./ligdicash";

export type { ResultatVerification };

export function fournisseur(): "ligdicash" | "paydunya" {
  return process.env.PAIEMENT_PME?.trim() !== "paydunya" && ligdicashConfigure() ? "ligdicash" : "paydunya";
}

export function nomFournisseur(): string {
  return fournisseur() === "ligdicash" ? "LigdiCash" : "PayDunya";
}

export function modePaiement(): "test" | "live" {
  return fournisseur() === "ligdicash" ? modeLigdicash() : MODE_PAYDUNYA;
}

export function paiementConfigure(): boolean {
  return fournisseur() === "ligdicash" ? ligdicashConfigure() : paydunyaConfigure();
}

export function creerFacture(
  utilisateur: { id: string; email?: string },
  formule: Formule,
  nomEntreprise: string,
  origine: string
) {
  return fournisseur() === "ligdicash"
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

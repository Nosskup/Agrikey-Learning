"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { exigerEntreprise } from "@/lib/pme/session";
import { ABONNEMENTS_VISIBLES, formuleParCode } from "@/lib/pme/formules";
import { creerFactureAbonnement, paydunyaConfigure } from "@/lib/pme/paydunya";
import type { EtatFormulaire } from "../actions";

/** Prépare la facture PayDunya de la formule choisie et envoie vers la page de paiement. */
export async function payerAbonnement(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!ABONNEMENTS_VISIBLES) redirect("/pme");
  const { user, entreprise } = await exigerEntreprise();

  const formule = formuleParCode(String(formData.get("formule") ?? ""));
  if (!formule) {
    return { erreur: "Choisissez une formule." };
  }
  if (!paydunyaConfigure()) {
    return { erreur: "Le paiement n'est pas encore activé. Contactez AGRIKEY." };
  }

  const origine = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const resultat = await creerFactureAbonnement(
    { id: user.id, email: user.email },
    formule,
    entreprise.nom,
    origine
  );
  if ("erreur" in resultat) return resultat;

  redirect(resultat.url);
}

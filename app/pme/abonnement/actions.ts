"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { estAdmin, exigerEntreprise } from "@/lib/pme/session";
import { ABONNEMENTS_VISIBLES, FORMULE_ESSAI, formuleParCode } from "@/lib/pme/formules";
import { creerFacture, paiementConfigure } from "@/lib/pme/paiement";
import type { EtatFormulaire } from "../actions";

/** Prépare la facture (LigdiCash ou PayDunya) de la formule choisie et envoie vers la page de paiement. */
export async function payerAbonnement(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const { supabase, user, entreprise } = await exigerEntreprise({ memeSansAcces: true });
  const admin = await estAdmin(supabase, user.id);
  // Abonnements masqués : seuls les administrateurs peuvent tester le paiement.
  if (!ABONNEMENTS_VISIBLES && !admin) redirect("/pme");

  const formule = formuleParCode(String(formData.get("formule") ?? ""));
  // La formule d'essai à 100 FCFA est réservée aux administrateurs.
  if (!formule || (formule.code === FORMULE_ESSAI.code && !admin)) {
    return { erreur: "Choisissez une formule." };
  }
  if (!paiementConfigure()) {
    return { erreur: "Le paiement n'est pas encore activé. Contactez AGRIKEY." };
  }

  const origine = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const resultat = await creerFacture(
    { id: user.id, email: user.email },
    formule,
    entreprise.nom,
    origine
  );
  if ("erreur" in resultat) return resultat;

  redirect(resultat.url);
}

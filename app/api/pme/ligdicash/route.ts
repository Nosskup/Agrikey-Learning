import { NextResponse, type NextRequest } from "next/server";
import { lireDonneePerso, traiterNotificationLigdicash } from "@/lib/pme/ligdicash";

/**
 * Lit notre transaction_id dans la notification LigdiCash. LigdiCash envoie deux POST
 * par paiement : l'un en JSON (custom_data = liste { keyof_customdata, valueof_customdata }),
 * l'autre en formulaire (custom_data[0][keyof_customdata]=…).
 */
function lireTransactionId(texte: string): string | null {
  try {
    const corps = JSON.parse(texte) as { custom_data?: unknown; external_id?: unknown };
    const id = lireDonneePerso(corps.custom_data, "transaction_id");
    if (id) return id;
    return typeof corps.external_id === "string" ? corps.external_id : null;
  } catch {
    // Formulaire : on regroupe les champs custom_data[i][...] par indice.
  }
  const formulaire = new URLSearchParams(texte);
  const entrees = new Map<string, Record<string, string>>();
  for (const [cle, valeur] of formulaire.entries()) {
    const m = cle.match(/^custom_data\[(\d+)\]\[(\w+)\]$/);
    if (m) entrees.set(m[1], { ...entrees.get(m[1]), [m[2]]: valeur });
  }
  const id = lireDonneePerso([...entrees.values()], "transaction_id");
  if (id) return id;
  const brut = formulaire.get("custom_data");
  if (brut) {
    try {
      const liste = lireDonneePerso(JSON.parse(brut), "transaction_id");
      if (liste) return liste;
    } catch {
      // ignoré
    }
  }
  return formulaire.get("external_id");
}

/**
 * Notification de paiement envoyée par LigdiCash (callback_url) pour l'abonnement AGRIKEY PME.
 *
 * On n'en retient que notre transaction_id : le statut réel est toujours revérifié
 * auprès de LigdiCash avec le jeton enregistré à la création (voir traiterNotificationLigdicash).
 */
export async function POST(request: NextRequest) {
  const texte = await request.text();
  const transactionId = lireTransactionId(texte);
  if (!transactionId) {
    console.error("Notification LigdiCash sans transaction_id :", texte.slice(0, 500));
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const resultat = await traiterNotificationLigdicash(transactionId);
  return NextResponse.json({ success: resultat !== "invalide", resultat }, { status: resultat === "invalide" ? 400 : 200 });
}

// Permet de vérifier depuis un navigateur que l'adresse répond.
export async function GET() {
  return NextResponse.json({ success: true, service: "AGRIKEY PME" });
}

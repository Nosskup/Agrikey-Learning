import { NextResponse, type NextRequest } from "next/server";
import { verifierPaiement } from "@/lib/pme/paydunya";

/**
 * Notification de paiement (IPN) envoyée par PayDunya pour l'abonnement AGRIKEY PME.
 *
 * On n'en retient que le jeton de la facture : le statut réel est toujours
 * revérifié auprès de PayDunya avec nos clés secrètes (voir verifierPaiement).
 */
export async function POST(request: NextRequest) {
  const parametres = new URLSearchParams(await request.text());

  let token = parametres.get("token");
  for (const [cle, valeur] of parametres.entries()) {
    if (cle.includes("[invoice]") && cle.endsWith("[token]")) {
      token = valeur;
      break;
    }
  }

  if (!token) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const resultat = await verifierPaiement(token);
  return NextResponse.json({ success: resultat !== "invalide", resultat }, { status: resultat === "invalide" ? 400 : 200 });
}

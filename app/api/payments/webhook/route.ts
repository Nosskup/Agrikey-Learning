import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin";

const PAYDUNYA_MODE =
  process.env.PAYDUNYA_MODE === "live" ? "live" : "test";

const PAYDUNYA_BASE_URL =
  PAYDUNYA_MODE === "live"
    ? "https://app.paydunya.com/api/v1"
    : "https://app.paydunya.com/sandbox-api/v1";

/**
 * Webhook (IPN) PayDunya.
 *
 * Règle de sécurité essentielle : on ne fait JAMAIS confiance au
 * contenu envoyé dans cette requête. N'importe qui peut poster
 * n'importe quoi sur cette URL. La seule chose qu'on en retient
 * est le "token" de la facture, avec lequel on revérifie le
 * statut réel directement auprès des serveurs de PayDunya (API
 * "confirm"). C'est cette réponse-là, authentifiée par nos clés
 * secrètes, qui décide si un paiement est confirmé ou non.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const params = new URLSearchParams(rawBody);

    let token: string | null = null;

    for (const [key, value] of params.entries()) {
      if (key.includes("[invoice]") && key.endsWith("[token]")) {
        token = value;
        break;
      }
    }

    if (!token) {
      token = params.get("token");
    }

    if (!token) {
      console.error(
        "Webhook PayDunya : token introuvable dans le corps reçu."
      );

      return NextResponse.json(
        { success: false },
        { status: 400 }
      );
    }

    const confirmResponse = await fetch(
      `${PAYDUNYA_BASE_URL}/checkout-invoice/confirm/${token}`,
      {
        headers: {
          "Content-Type": "application/json",
          "PAYDUNYA-MASTER-KEY":
            process.env.PAYDUNYA_MASTER_KEY!,
          "PAYDUNYA-PRIVATE-KEY":
            process.env.PAYDUNYA_PRIVATE_KEY!,
          "PAYDUNYA-TOKEN": process.env.PAYDUNYA_TOKEN!,
        },
      }
    );

    const confirmData = await confirmResponse.json();

    if (confirmData.response_code !== "00") {
      console.error(
        "Webhook PayDunya : vérification du statut échouée.",
        confirmData
      );

      return NextResponse.json(
        { success: false },
        { status: 400 }
      );
    }

    const paymentId = confirmData.custom_data?.payment_id;

    if (!paymentId) {
      console.error(
        "Webhook PayDunya : payment_id absent des custom_data."
      );

      return NextResponse.json(
        { success: false },
        { status: 400 }
      );
    }

    if (confirmData.status !== "completed") {
      // Paiement en attente, annulé ou échoué : rien à confirmer
      // côté Supabase pour l'instant.
      return NextResponse.json({
        success: true,
        status: confirmData.status,
      });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const { data: result, error } = await supabaseAdmin.rpc(
      "confirm_payment",
      {
        p_payment_id: paymentId,
        p_transaction_id: token,
      }
    );

    if (error) {
      console.error(
        "Erreur lors de l'appel à confirm_payment :",
        error
      );

      return NextResponse.json(
        { success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err) {
    console.error("Erreur webhook PayDunya :", err);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}

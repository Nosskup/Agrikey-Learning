import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";

const PAYDUNYA_MODE =
  process.env.PAYDUNYA_MODE === "live" ? "live" : "test";

const PAYDUNYA_BASE_URL =
  PAYDUNYA_MODE === "live"
    ? "https://app.paydunya.com/api/v1"
    : "https://app.paydunya.com/sandbox-api/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const courseId = body?.courseId;

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          message: "Formation manquante.",
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Vous devez être connecté.",
        },
        { status: 401 }
      );
    }

    // 1. Créer le paiement "en attente" côté Supabase. Cette
    //    fonction vérifie déjà tout ce qu'il faut : formation
    //    publiée, payante, utilisateur connecté, et calcule le
    //    montant réel à partir du prix de la formation (jamais
    //    depuis une valeur envoyée par le navigateur).
    const {
      data: paymentResult,
      error: paymentError,
    } = await supabase.rpc("create_pending_payment", {
      p_course_id: courseId,
      p_method: "paydunya",
    });

    if (paymentError) {
      return NextResponse.json(
        {
          success: false,
          message: paymentError.message,
        },
        { status: 400 }
      );
    }

    const paymentId = paymentResult.payment_id;
    const amount = paymentResult.amount;

    const { data: course } = await supabase
      .from("courses")
      .select("title")
      .eq("id", courseId)
      .single();

    // 2. Créer la facture PayDunya.
    const origin = request.nextUrl.origin;

    const paydunyaResponse = await fetch(
      `${PAYDUNYA_BASE_URL}/checkout-invoice/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PAYDUNYA-MASTER-KEY":
            process.env.PAYDUNYA_MASTER_KEY!,
          "PAYDUNYA-PRIVATE-KEY":
            process.env.PAYDUNYA_PRIVATE_KEY!,
          "PAYDUNYA-TOKEN": process.env.PAYDUNYA_TOKEN!,
        },
        body: JSON.stringify({
          invoice: {
            total_amount: amount,
            description: `AGRIKEY Learning – ${
              course?.title || "Formation"
            }`,
            customer: {
              name:
                (user.user_metadata as any)?.full_name || "",
              email: user.email || "",
            },
          },
          store: {
            name: "AGRIKEY Learning",
            website_url: origin,
          },
          custom_data: {
            payment_id: paymentId,
            course_id: courseId,
            user_id: user.id,
          },
          actions: {
            cancel_url: `${origin}/paiement?courseId=${courseId}&annule=1`,
            return_url: `${origin}/paiement/confirmation?courseId=${courseId}`,
            callback_url: `${origin}/api/payments/webhook`,
          },
        }),
      }
    );

    const paydunyaData = await paydunyaResponse.json();

    if (paydunyaData.response_code !== "00") {
      console.error(
        "Erreur création facture PayDunya :",
        paydunyaData
      );

      // Diagnostic temporaire, sans danger : ne révèle jamais la
      // clé en entier, seulement sa longueur et ses deux extrémités,
      // pour vérifier ce que le serveur reçoit réellement.
      function apercu(valeur: string | undefined) {
        if (!valeur) return "VIDE / NON DÉFINIE";
        if (valeur.length <= 8) return `longueur ${valeur.length}`;
        return `longueur ${valeur.length}, commence par "${valeur.slice(0, 4)}", finit par "${valeur.slice(-4)}"`;
      }

      return NextResponse.json(
        {
          success: false,
          message:
            paydunyaData.response_text ||
            "Impossible de créer la facture de paiement.",
          diagnostic: {
            mode: PAYDUNYA_MODE,
            master_key: apercu(process.env.PAYDUNYA_MASTER_KEY),
            private_key: apercu(process.env.PAYDUNYA_PRIVATE_KEY),
            token: apercu(process.env.PAYDUNYA_TOKEN),
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: paydunyaData.response_text,
      token: paydunyaData.token,
      paymentId,
    });
  } catch (err: any) {
    console.error(
      "Erreur route create-invoice :",
      err
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erreur serveur lors de la création du paiement.",
      },
      { status: 500 }
    );
  }
}

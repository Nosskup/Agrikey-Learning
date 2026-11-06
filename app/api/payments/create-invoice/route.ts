import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin";
import { creerFacture, ligdicashConfigure } from "../../../../lib/ligdicash";

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
    //    LigdiCash dès que ses clés sont configurées, sinon PayDunya.
    const avecLigdicash = ligdicashConfigure();

    let {
      data: paymentResult,
      error: paymentError,
    } = await supabase.rpc("create_pending_payment", {
      p_course_id: courseId,
      p_method: avecLigdicash ? "ligdicash" : "paydunya",
    });

    // Si la base n'accepte pas encore « ligdicash » comme moyen de paiement,
    // on garde l'ancien libellé : seul le libellé change, le paiement passe par LigdiCash.
    if (paymentError && avecLigdicash) {
      console.error("create_pending_payment avec « ligdicash » :", paymentError.message);
      ({ data: paymentResult, error: paymentError } = await supabase.rpc("create_pending_payment", {
        p_course_id: courseId,
        p_method: "paydunya",
      }));
    }

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

    const origin = request.nextUrl.origin;

    // 2a. Facture LigdiCash : le jeton de création est rangé dans
    //     payments.transaction_id pour la vérification (voir lib/paiement-formation-ligdicash.ts).
    if (avecLigdicash) {
      const facture = await creerFacture({
        transactionId: String(paymentId),
        montant: Number(amount),
        libelle: course?.title || "Formation",
        description: `AGRIKEY Learning – ${course?.title || "Formation"}`,
        prenom: (user.user_metadata as { full_name?: string })?.full_name || "",
        email: user.email || "",
        boutique: "AGRIKEY Learning",
        origine: origin,
        urlRetour: `${origin}/paiement/confirmation?courseId=${courseId}&paiement=${paymentId}`,
        urlAnnulation: `${origin}/paiement?courseId=${courseId}&annule=1`,
      });

      if ("erreur" in facture) {
        return NextResponse.json({ success: false, message: facture.erreur }, { status: 502 });
      }

      const { error: erreurJeton } = await createSupabaseAdminClient()
        .from("payments")
        .update({ transaction_id: facture.token })
        .eq("id", paymentId);
      if (erreurJeton) {
        console.error("Jeton LigdiCash non enregistré :", erreurJeton.message);
        return NextResponse.json(
          { success: false, message: "Le paiement n'a pas pu être préparé. Réessayez dans un instant." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, checkoutUrl: facture.url, paymentId });
    }

    // 2b. Créer la facture PayDunya.

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

      return NextResponse.json(
        {
          success: false,
          message:
            paydunyaData.response_text ||
            "Impossible de créer la facture de paiement.",
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

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { processPartnerRequest } from "@/lib/partner-request";
import {
  buildNotification,
  buildTestMail,
  getNotifyConfig,
  sendMail,
} from "@/lib/partner-notify";

/** Adresse publique du site, pour les liens placés dans les e-mails. */
function adminUrl(request: Request) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  return `${base.replace(/\/+$/, "")}/admin/partenaires`;
}

/**
 * Réception d'une demande de partenariat envoyée depuis la page publique.
 *
 * La table `partner_requests` n'accepte AUCUNE écriture directe : seule cette
 * route, qui utilise la clé service_role, peut y ajouter une demande, après
 * validation, filtre anti-robots et limitation de fréquence.
 *
 * Une fois la demande enregistrée, un e-mail de notification est envoyé si la
 * notification est configurée. Son échec n'affecte jamais l'enregistrement.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Demande invalide." },
      { status: 400 }
    );
  }

  const link = adminUrl(request);

  const result = await processPartnerRequest(body, {
    now: () => new Date(),

    async countByEmailSince(email, sinceIso) {
      const admin = createSupabaseAdminClient();
      const { count, error } = await admin
        .from("partner_requests")
        .select("id", { count: "exact", head: true })
        .eq("email", email)
        .gte("created_at", sinceIso);

      if (error) throw error;
      return count ?? 0;
    },

    async countAllSince(sinceIso) {
      const admin = createSupabaseAdminClient();
      const { count, error } = await admin
        .from("partner_requests")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sinceIso);

      if (error) throw error;
      return count ?? 0;
    },

    async insert(row) {
      const admin = createSupabaseAdminClient();
      const { error } = await admin.from("partner_requests").insert(row);
      return { error: error ? error.message : null };
    },

    async notify(row) {
      const config = getNotifyConfig();
      if (!config) return;

      const sent = await sendMail(config, buildNotification(row, link));

      if (!sent.ok) {
        // Visible dans les journaux Vercel ; sans données personnelles.
        console.error("[partenaires] e-mail de notification non envoyé :", sent.reason);
      }
    },
  });

  return NextResponse.json(result.body, { status: result.status });
}

/**
 * Envoi d'un e-mail de TEST, pour vérifier les réglages de notification.
 * Réservé aux administrateurs connectés (bouton de /admin/partenaires).
 */
export async function PUT(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Vous devez être connecté." },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Accès réservé aux administrateurs." },
      { status: 403 }
    );
  }

  const config = getNotifyConfig();

  if (!config) {
    return NextResponse.json({
      ok: false,
      error:
        "La notification n'est pas configurée. Ajoutez RESEND_API_KEY et PARTNER_NOTIFY_EMAIL dans les variables d'environnement de Vercel, puis redéployez.",
    });
  }

  const sent = await sendMail(config, buildTestMail(adminUrl(request)), {
    timeoutMs: 8000,
  });

  if (!sent.ok) {
    return NextResponse.json({ ok: false, error: sent.reason });
  }

  return NextResponse.json({ ok: true, to: config.to });
}

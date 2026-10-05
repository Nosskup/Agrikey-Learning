import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { processPartnerRequest } from "@/lib/partner-request";

/**
 * Réception d'une demande de partenariat envoyée depuis la page publique.
 *
 * La table `partner_requests` n'accepte AUCUNE écriture directe : seule cette
 * route, qui utilise la clé service_role, peut y ajouter une demande, après
 * validation, filtre anti-robots et limitation de fréquence.
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
  });

  return NextResponse.json(result.body, { status: result.status });
}

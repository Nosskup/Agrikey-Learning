import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { lirePaiementFormation, verifierPaiementFormation } from "../../../../lib/paiement-formation-ligdicash";

/**
 * Au retour de la page LigdiCash : revérifie le paiement de formation de l'apprenant
 * connecté, sans attendre la notification de LigdiCash.
 */
export async function GET(request: NextRequest) {
  const paiementId = request.nextUrl.searchParams.get("paiement") ?? "";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false }, { status: 401 });

  const paiement = await lirePaiementFormation(paiementId);
  if (!paiement || paiement.user_id !== user.id) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const resultat = await verifierPaiementFormation(paiementId);
  return NextResponse.json({ success: resultat !== "invalide", resultat });
}

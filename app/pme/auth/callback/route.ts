import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Pages où un lien reçu par e-mail peut mener après connexion.
const SUITES_AUTORISEES = ["/pme", "/pme/nouveau-mot-de-passe"];

// Lien reçu par e-mail : confirmation d'inscription ou mot de passe oublié.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const suite = searchParams.get("suite") ?? "/pme";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${SUITES_AUTORISEES.includes(suite) ? suite : "/pme"}`);
    }
  }

  return NextResponse.redirect(`${origin}/pme/connexion`);
}

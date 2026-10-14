import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Téléchargement de toutes les données AGRIKEY PME de l'utilisateur (fichier JSON).
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/pme/connexion", request.url));
  }

  const tables = ["entreprises", "categories_caisse", "operations_caisse", "projets", "taches", "documents"] as const;
  const resultats = await Promise.all(
    tables.map((table) => supabase.from(table).select("*").eq("user_id", user.id).order("created_at"))
  );

  const export_ = {
    exporte_le: new Date().toISOString(),
    compte: { email: user.email },
    ...Object.fromEntries(tables.map((table, i) => [table, resultats[i].data ?? []])),
  };

  return new NextResponse(JSON.stringify(export_, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="agrikey-pme-mes-donnees-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

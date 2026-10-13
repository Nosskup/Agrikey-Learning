import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { dateNumerique, lireMois } from "@/lib/pme/format";

// Export CSV du mois, lisible par Excel en français (séparateur « ; »).
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/pme/connexion", request.url));
  }

  const mois = lireMois(request.nextUrl.searchParams.get("mois") ?? undefined);

  const [{ data: categories }, { data: operations }] = await Promise.all([
    supabase.from("categories_caisse").select("id, nom"),
    supabase
      .from("operations_caisse")
      .select("type, montant, categorie_id, note, date")
      .gte("date", mois.debut)
      .lte("date", mois.fin)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const noms = new Map((categories ?? []).map((c) => [c.id, c.nom]));
  const cellule = (valeur: string) => `"${valeur.replace(/"/g, '""')}"`;

  const lignes = [
    ["Date", "Type", "Catégorie", "Note", "Argent reçu (FCFA)", "Argent dépensé (FCFA)"].map(cellule).join(";"),
    ...(operations ?? []).map((o) =>
      [
        cellule(dateNumerique(o.date)),
        cellule(o.type === "recu" ? "Argent reçu" : "Argent dépensé"),
        cellule((o.categorie_id && noms.get(o.categorie_id)) || "Sans catégorie"),
        cellule(o.note ?? ""),
        o.type === "recu" ? String(o.montant) : "",
        o.type === "depense" ? String(o.montant) : "",
      ].join(";")
    ),
  ];

  // Le BOM permet à Excel de reconnaître les accents (UTF-8).
  const contenu = "﻿" + lignes.join("\r\n") + "\r\n";

  return new NextResponse(contenu, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="caisse-${mois.cle}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { estAdmin } from "@/lib/pme/session";

type EntrepriseInscrite = {
  nom: string;
  email: string | null;
  statut: string;
  ville: string | null;
  activite: string | null;
  code_partenaire: string | null;
  inscrite_le: string;
  active_30_jours: boolean;
  documents: number;
};

// Liste des entreprises inscrites en CSV (Excel), réservée aux administrateurs.
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await estAdmin(supabase, user.id))) {
    return NextResponse.redirect(new URL("/pme/admin", request.url));
  }

  const code = request.nextUrl.searchParams.get("code") ?? "";
  const filtre = /^[A-Z0-9-]{2,20}$|^AUCUN$/.test(code) ? code : "";

  const { data } = await supabase.rpc("pme_liste_entreprises");
  const liste = ((data ?? []) as EntrepriseInscrite[]).filter(
    (e) => !filtre || (e.code_partenaire ?? "AUCUN") === filtre
  );

  const cellule = (valeur: string) => `"${valeur.replace(/"/g, '""')}"`;
  const lignes = [
    ["Entreprise", "E-mail", "Ville", "Activité", "Code partenaire", "Statut", "Inscrite le", "Active (30 jours)", "Documents"].map(cellule).join(";"),
    ...liste.map((e) =>
      [
        cellule(e.nom),
        cellule(e.email ?? ""),
        cellule(e.ville ?? ""),
        cellule(e.activite ?? ""),
        cellule(e.code_partenaire ?? ""),
        cellule({ en_attente: "En attente", valide: "Validée", refuse: "Refusée" }[e.statut] ?? e.statut),
        cellule(new Date(e.inscrite_le).toLocaleDateString("fr-FR")),
        cellule(e.active_30_jours ? "Oui" : "Non"),
        String(e.documents),
      ].join(";")
    ),
  ];

  return new NextResponse("﻿" + lignes.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="entreprises-${filtre || "toutes"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

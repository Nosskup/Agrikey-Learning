import { createSupabaseServerClient } from "@/lib/supabase-server";
import { uuidValide } from "@/lib/pme/validation";

// Sert le SVG d'une création au seul membre qui l'a faite (règles d'accès de la base).
export async function GET(_requete: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidValide(id)) return new Response("Introuvable", { status: 404 });

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("creations_ia")
    .select("svg")
    .eq("id", id)
    .eq("statut", "pret")
    .maybeSingle();

  if (!data?.svg) return new Response("Introuvable", { status: 404 });

  return new Response(data.svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Même ouvert directement, le fichier ne peut rien exécuter ni charger d'extérieur.
      "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=86400",
    },
  });
}

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import FormulaireBienvenue from "./FormulaireBienvenue";

export const metadata = { title: "Bienvenue" };

export default async function BienvenuePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/pme/connexion");
  }

  const { data: entreprise } = await supabase
    .from("entreprises")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (entreprise) {
    redirect("/pme");
  }

  // Nom saisi à l'inscription (si l'e-mail a dû être confirmé avant).
  const nomPropose =
    typeof user.user_metadata?.nom_entreprise === "string"
      ? user.user_metadata.nom_entreprise
      : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-marine">Bienvenue !</h1>
        <p className="mt-2 text-base text-slate-600">
          Une seule question pour commencer : comment s&apos;appelle votre entreprise ?
        </p>
      </div>
      <FormulaireBienvenue nomPropose={nomPropose} />
    </div>
  );
}

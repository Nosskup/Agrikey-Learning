import Link from "next/link";
import { exigerEntreprise } from "@/lib/pme/session";
import { boutonSecondaire } from "@/components/pme/styles";
import { lirePreferences } from "@/lib/opportunites/donnees";
import FormulaireDomaines from "./FormulaireDomaines";

export const metadata = { title: "Mes domaines" };

export default async function DomainesPage() {
  const { supabase } = await exigerEntreprise();
  const preferences = await lirePreferences(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-marine">Mes domaines</h1>
        <p className="mt-2 text-base text-slate-700">
          Les offres d&apos;emploi, appels d&apos;offres et actualités du Mali seront choisis selon ces domaines.
        </p>
      </div>

      <FormulaireDomaines domaines={preferences.domaines} motsCles={preferences.motsCles.join(", ")} />

      <Link href="/pme/opportunites" className={boutonSecondaire}>
        ← Retour aux opportunités
      </Link>
    </div>
  );
}

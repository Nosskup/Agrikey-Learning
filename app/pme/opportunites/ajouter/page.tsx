import Link from "next/link";
import { redirect } from "next/navigation";
import { estAdmin, exigerEntreprise } from "@/lib/pme/session";
import { boutonSecondaire } from "@/components/pme/styles";
import FormulaireAnnonce from "./FormulaireAnnonce";

export const metadata = { title: "Ajouter une annonce" };

export default async function AjouterAnnoncePage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>;
}) {
  const { supabase, user } = await exigerEntreprise();
  if (!(await estAdmin(supabase, user.id))) redirect("/pme/opportunites");

  const { type } = await searchParams;
  const typeInitial = type === "appel_offres" || type === "actualite" ? type : "emploi";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-marine">Ajouter une annonce</h1>
        <p className="mt-2 text-base text-slate-700">
          Pour les annonces trouvées dans les journaux, sur les panneaux ou dans vos réseaux. Elles sont visibles par tous
          les membres, en tête de liste.
        </p>
      </div>

      <FormulaireAnnonce type={typeInitial} />

      <Link href="/pme/opportunites" className={boutonSecondaire}>
        ← Retour aux opportunités
      </Link>
    </div>
  );
}

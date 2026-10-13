import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerEntreprise, type Categorie, type Operation } from "@/lib/pme/session";
import { aujourdhui } from "@/lib/pme/format";
import { uuidValide } from "@/lib/pme/validation";
import BoutonSupprimer from "@/components/pme/BoutonSupprimer";
import FormulaireOperation from "../FormulaireOperation";
import { modifierOperation, supprimerOperation } from "../actions";

export const metadata = { title: "Modifier une opération" };

export default async function ModifierOperationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidValide(id)) notFound();

  const { supabase } = await exigerEntreprise();

  const [{ data: operation }, { data: categories }] = await Promise.all([
    supabase
      .from("operations_caisse")
      .select("id, type, montant, categorie_id, note, date")
      .eq("id", id)
      .maybeSingle<Operation>(),
    supabase.from("categories_caisse").select("id, nom, type").order("created_at").returns<Categorie[]>(),
  ]);

  if (!operation) notFound();

  const mois = operation.date.slice(0, 7);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-marine">Modifier l&apos;opération</h1>
        <Link href={`/pme/caisse?mois=${mois}`} className="min-h-12 content-center text-base font-semibold text-slate-600 underline">
          Annuler
        </Link>
      </div>

      <FormulaireOperation
        action={modifierOperation.bind(null, operation.id)}
        categories={categories ?? []}
        typeInitial={operation.type}
        dateDuJour={aujourdhui()}
        operation={operation}
      />

      <BoutonSupprimer
        action={supprimerOperation.bind(null, operation.id, mois)}
        question="Supprimer définitivement cette opération ?"
        libelle="🗑️ Supprimer cette opération"
        className="w-full"
      />
    </div>
  );
}

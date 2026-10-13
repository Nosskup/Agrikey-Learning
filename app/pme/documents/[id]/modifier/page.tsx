import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerEntreprise } from "@/lib/pme/session";
import { trouverModele } from "@/lib/pme/modeles";
import type { DonneesDocument } from "@/lib/pme/documents";
import { uuidValide } from "@/lib/pme/validation";
import { modifierDocument } from "../../actions";
import FormulaireDocument from "../../FormulaireDocument";

export const metadata = { title: "Modifier le document" };

export default async function ModifierDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidValide(id)) notFound();

  const { supabase } = await exigerEntreprise();

  const { data: document } = await supabase
    .from("documents")
    .select("id, modele_code, donnees")
    .eq("id", id)
    .maybeSingle<{ id: string; modele_code: string; donnees: DonneesDocument }>();

  const modele = document && trouverModele(document.modele_code);
  if (!document || !modele) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-marine">
          <span aria-hidden="true">{modele.icone}</span> {modele.titre}
        </h1>
        <Link
          href={`/pme/documents/${document.id}`}
          className="min-h-12 shrink-0 content-center text-base font-semibold text-slate-600 underline"
        >
          Annuler
        </Link>
      </div>

      <FormulaireDocument
        action={modifierDocument.bind(null, document.id)}
        modele={modele}
        valeurs={document.donnees.champs ?? {}}
        lignesInitiales={document.donnees.lignes ?? []}
        libelleBouton="Enregistrer et voir l'aperçu →"
      />
    </div>
  );
}

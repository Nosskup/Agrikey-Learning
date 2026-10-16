import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerEntreprise, modelesAutorises } from "@/lib/pme/session";
import { filtrerModeles, trouverModele } from "@/lib/pme/modeles";
import { aujourdhui } from "@/lib/pme/format";
import { creerDocument } from "../../actions";
import FormulaireDocument from "../../FormulaireDocument";

export const metadata = { title: "Nouveau document" };

export default async function NouveauDocumentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const modele = trouverModele(code);
  if (!modele) notFound();

  const { supabase } = await exigerEntreprise();
  const jour = aujourdhui();

  if (!filtrerModeles(await modelesAutorises(supabase)).some((m) => m.code === modele.code)) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-marine">{modele.titre}</h1>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-900">
          Ce modèle n&apos;est pas ouvert pour votre compte. Contactez votre association ou AGRIKEY.
        </p>
        <Link href="/pme/documents" className="min-h-12 content-center text-base font-semibold text-marine underline">
          ← Retour aux documents
        </Link>
      </div>
    );
  }

  // Numéro proposé : FAC-2026-004 si 3 factures ont déjà été faites cette année.
  let numero = "";
  if (modele.prefixeNumero) {
    const annee = jour.slice(0, 4);
    const { count } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("modele_code", modele.code)
      .gte("created_at", `${annee}-01-01`);
    numero = `${modele.prefixeNumero}-${annee}-${String((count ?? 0) + 1).padStart(3, "0")}`;
  }

  const valeurs: Record<string, string> = {};
  for (const champ of modele.champs) {
    if (champ.defaut === "aujourdhui") valeurs[champ.nom] = jour;
    else if (champ.defaut === "numero") valeurs[champ.nom] = numero;
    else if (champ.defaut) valeurs[champ.nom] = champ.defaut;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-marine">
          <span aria-hidden="true">{modele.icone}</span> {modele.titre}
        </h1>
        <Link href="/pme/documents" className="min-h-12 shrink-0 content-center text-base font-semibold text-slate-600 underline">
          Annuler
        </Link>
      </div>

      <FormulaireDocument
        action={creerDocument.bind(null, modele.code)}
        modele={modele}
        valeurs={valeurs}
        lignesInitiales={[]}
        libelleBouton="Voir l'aperçu →"
      />
    </div>
  );
}

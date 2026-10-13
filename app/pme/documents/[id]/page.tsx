import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerEntreprise } from "@/lib/pme/session";
import { trouverModele } from "@/lib/pme/modeles";
import type { DonneesDocument } from "@/lib/pme/documents";
import { uuidValide } from "@/lib/pme/validation";
import BoutonImprimer from "@/components/pme/BoutonImprimer";
import BoutonSupprimer from "@/components/pme/BoutonSupprimer";
import RenduDocument from "@/components/pme/RenduDocument";
import { boutonSecondaire } from "@/components/pme/styles";
import { supprimerDocument } from "../actions";

export const metadata = { title: "Aperçu du document" };

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidValide(id)) notFound();

  const { supabase, entreprise } = await exigerEntreprise();

  const { data: document } = await supabase
    .from("documents")
    .select("id, titre, modele_code, donnees")
    .eq("id", id)
    .maybeSingle<{ id: string; titre: string; modele_code: string; donnees: DonneesDocument }>();

  const modele = document && trouverModele(document.modele_code);
  if (!document || !modele) notFound();

  return (
    <div className="space-y-6">
      <div className="no-print space-y-3">
        <h1 className="text-2xl font-black break-words text-marine">{document.titre}</h1>
        <BoutonImprimer />
        <p className="text-base text-slate-600">
          Dans la fenêtre d&apos;impression, choisissez « Enregistrer au format PDF » comme imprimante.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/pme/documents/${document.id}/modifier`} className={boutonSecondaire}>
            ✏️ Modifier
          </Link>
          <Link href="/pme/documents" className={boutonSecondaire}>
            Mes documents
          </Link>
        </div>
      </div>

      <RenduDocument modele={modele} donnees={document.donnees} entreprise={entreprise} />

      <div className="no-print">
        <BoutonSupprimer
          action={supprimerDocument.bind(null, document.id)}
          question="Supprimer définitivement ce document ?"
          libelle="🗑️ Supprimer ce document"
          className="w-full"
        />
      </div>
    </div>
  );
}

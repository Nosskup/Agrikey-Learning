import Link from "next/link";
import { exigerEntreprise } from "@/lib/pme/session";
import { aujourdhui } from "@/lib/pme/format";
import { uuidValide } from "@/lib/pme/validation";
import { boutonSecondaire } from "@/components/pme/styles";
import { domaineParCode } from "@/lib/opportunites/domaines";
import type { TypeAnnonce } from "@/lib/opportunites/flux";
import { BadgeDateLimite, datePublication } from "../../CarteAnnonce";

export const metadata = { title: "Annonce" };

const LIBELLES: Record<TypeAnnonce, string> = {
  emploi: "Offre d'emploi",
  appel_offres: "Appel d'offres",
  actualite: "Actualité",
};

/** Page d'une annonce ajoutée par un administrateur sans lien externe. */
export default async function AnnoncePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await exigerEntreprise();

  const { data: annonce } = uuidValide(id)
    ? await supabase
        .from("opportunites")
        .select("type, titre, organisme, description, lien, lieu, domaine, date_limite, created_at")
        .eq("id", id)
        .maybeSingle()
    : { data: null };

  if (!annonce) {
    return (
      <div className="space-y-6">
        <p className="rounded-2xl border border-slate-200 bg-white p-5 text-base text-slate-700">
          Cette annonce n&apos;existe plus. Elle a peut-être été retirée.
        </p>
        <Link href="/pme/opportunites" className={boutonSecondaire}>
          ← Retour aux opportunités
        </Link>
      </div>
    );
  }

  const domaine = domaineParCode(annonce.domaine);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-base text-slate-500">
          {LIBELLES[annonce.type as TypeAnnonce]} · publiée le {datePublication(annonce.created_at)}
        </p>
        <h1 className="text-2xl font-black text-marine">{annonce.titre}</h1>
        {annonce.date_limite && <BadgeDateLimite dateLimite={annonce.date_limite} aujourdhui={aujourdhui()} />}
      </div>

      <dl className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-base">
        {annonce.organisme && (
          <div>
            <dt className="font-semibold text-slate-500">Organisme</dt>
            <dd className="text-slate-900">{annonce.organisme}</dd>
          </div>
        )}
        {annonce.lieu && (
          <div>
            <dt className="font-semibold text-slate-500">Lieu</dt>
            <dd className="text-slate-900">{annonce.lieu}</dd>
          </div>
        )}
        {domaine && (
          <div>
            <dt className="font-semibold text-slate-500">Domaine</dt>
            <dd className="text-slate-900">
              {domaine.icone} {domaine.libelle}
            </dd>
          </div>
        )}
      </dl>

      {annonce.description && (
        <p className="whitespace-pre-line rounded-2xl border border-slate-200 bg-white p-4 text-base text-slate-800">
          {annonce.description}
        </p>
      )}

      {annonce.lien && (
        <a
          href={annonce.lien}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center rounded-xl bg-agri px-5 py-3 text-base font-bold text-white hover:bg-agri-fonce"
        >
          Voir l&apos;annonce complète ↗
        </a>
      )}

      <Link href="/pme/opportunites" className={boutonSecondaire}>
        ← Retour aux opportunités
      </Link>
    </div>
  );
}

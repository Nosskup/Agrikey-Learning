import Link from "next/link";
import { exigerEntreprise, type Categorie, type Operation } from "@/lib/pme/session";
import { dateNumerique, formatFCFA, lireMois } from "@/lib/pme/format";
import BoutonImprimer from "@/components/pme/BoutonImprimer";
import { boutonSecondaire } from "@/components/pme/styles";

export const metadata = { title: "Journal de caisse" };

export default async function ImprimerCaissePage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>;
}) {
  const mois = lireMois((await searchParams).mois);
  const { supabase, entreprise } = await exigerEntreprise();

  const [{ data: categories }, { data: operations }] = await Promise.all([
    supabase.from("categories_caisse").select("id, nom, type").returns<Categorie[]>(),
    supabase
      .from("operations_caisse")
      .select("id, type, montant, categorie_id, note, date")
      .gte("date", mois.debut)
      .lte("date", mois.fin)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<Operation[]>(),
  ]);

  const noms = new Map((categories ?? []).map((c) => [c.id, c.nom]));
  const liste = operations ?? [];
  const totalRecu = liste.filter((o) => o.type === "recu").reduce((t, o) => t + o.montant, 0);
  const totalDepense = liste.filter((o) => o.type === "depense").reduce((t, o) => t + o.montant, 0);
  const coordonnees = [entreprise.adresse, entreprise.ville, entreprise.telephone, entreprise.email]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <div className="no-print space-y-3">
        <BoutonImprimer />
        <p className="text-base text-slate-600">
          Dans la fenêtre d&apos;impression, choisissez « Enregistrer au format PDF » comme imprimante.
        </p>
        <Link href={`/pme/caisse?mois=${mois.cle}`} className={boutonSecondaire}>
          ← Retour à la caisse
        </Link>
      </div>

      <article className="feuille-a4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900">
        <header
          className="flex items-center gap-4 border-b-4 pb-4"
          style={{ borderColor: entreprise.couleur }}
        >
          {entreprise.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entreprise.logo_url} alt="" className="h-16 w-16 object-contain" />
          )}
          <div>
            <p className="text-xl font-black" style={{ color: entreprise.couleur }}>
              {entreprise.nom}
            </p>
            {coordonnees && <p className="text-base text-slate-600">{coordonnees}</p>}
          </div>
        </header>

        <h1 className="mt-6 text-2xl font-black">
          Journal de caisse — <span className="capitalize">{mois.libelle}</span>
        </h1>

        <table className="mt-4 w-full border-collapse text-base">
          <tbody>
            <tr>
              <td className="py-1">Total reçu</td>
              <td className="py-1 text-right font-bold">{formatFCFA(totalRecu)}</td>
            </tr>
            <tr>
              <td className="py-1">Total dépensé</td>
              <td className="py-1 text-right font-bold">{formatFCFA(totalDepense)}</td>
            </tr>
            <tr className="border-t-2 border-slate-900">
              <td className="py-1 font-black">Solde du mois</td>
              <td className="py-1 text-right font-black">{formatFCFA(totalRecu - totalDepense)}</td>
            </tr>
          </tbody>
        </table>

        <table className="mt-6 w-full border-collapse text-base">
          <thead>
            <tr className="border-b-2 border-slate-900 text-left">
              <th className="py-2 pr-2">Date</th>
              <th className="py-2 pr-2">Catégorie / note</th>
              <th className="py-2 pr-2 text-right">Reçu</th>
              <th className="py-2 text-right">Dépensé</th>
            </tr>
          </thead>
          <tbody>
            {liste.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-500">
                  Aucune opération ce mois-ci.
                </td>
              </tr>
            )}
            {liste.map((o) => (
              <tr key={o.id} className="border-b border-slate-200 align-top">
                <td className="py-2 pr-2 whitespace-nowrap">{dateNumerique(o.date)}</td>
                <td className="py-2 pr-2">
                  {(o.categorie_id && noms.get(o.categorie_id)) || "Sans catégorie"}
                  {o.note && <span className="block text-slate-500">{o.note}</span>}
                </td>
                <td className="py-2 pr-2 text-right whitespace-nowrap">
                  {o.type === "recu" ? formatFCFA(o.montant) : ""}
                </td>
                <td className="py-2 text-right whitespace-nowrap">
                  {o.type === "depense" ? formatFCFA(o.montant) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-8 text-base text-slate-500">
          Édité le {new Date().toLocaleDateString("fr-FR")} avec AGRIKEY PME.
        </p>
      </article>
    </div>
  );
}

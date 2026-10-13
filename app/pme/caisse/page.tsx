import Link from "next/link";
import { exigerEntreprise, type Categorie, type Operation } from "@/lib/pme/session";
import { aujourdhui, dateCourte, formatFCFA, lireMois } from "@/lib/pme/format";
import { boutonSecondaire } from "@/components/pme/styles";
import AjoutOperation from "./AjoutOperation";

export const metadata = { title: "Caisse" };

export default async function CaissePage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>;
}) {
  const parametres = await searchParams;
  const mois = lireMois(parametres.mois);
  const ouvertSur =
    parametres.ajouter === "recu" || parametres.ajouter === "depense" ? parametres.ajouter : null;

  const { supabase } = await exigerEntreprise();

  const [{ data: categories }, { data: operations }] = await Promise.all([
    supabase.from("categories_caisse").select("id, nom, type").order("created_at").returns<Categorie[]>(),
    supabase
      .from("operations_caisse")
      .select("id, type, montant, categorie_id, note, date")
      .gte("date", mois.debut)
      .lte("date", mois.fin)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<Operation[]>(),
  ]);

  const nomsCategories = new Map((categories ?? []).map((c) => [c.id, c.nom]));
  const liste = operations ?? [];

  const totalRecu = liste.filter((o) => o.type === "recu").reduce((t, o) => t + o.montant, 0);
  const totalDepense = liste.filter((o) => o.type === "depense").reduce((t, o) => t + o.montant, 0);
  const solde = totalRecu - totalDepense;

  // Regroupement par jour, du plus récent au plus ancien.
  const parJour = new Map<string, Operation[]>();
  for (const operation of liste) {
    parJour.set(operation.date, [...(parJour.get(operation.date) ?? []), operation]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-marine">💰 Caisse</h1>
        <Link href="/pme" className="min-h-12 content-center text-base font-semibold text-slate-600 underline">
          Accueil
        </Link>
      </div>

      {/* Choix du mois */}
      <nav aria-label="Choisir le mois" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2">
        <Link
          href={`/pme/caisse?mois=${mois.precedent}`}
          aria-label="Mois précédent"
          className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-bold text-marine hover:bg-slate-100"
        >
          ‹
        </Link>
        <span className="text-lg font-bold capitalize text-marine">{mois.libelle}</span>
        <Link
          href={`/pme/caisse?mois=${mois.suivant}`}
          aria-label="Mois suivant"
          className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-bold text-marine hover:bg-slate-100"
        >
          ›
        </Link>
      </nav>

      {/* Résumé du mois */}
      <section className="rounded-2xl bg-marine p-5 text-white">
        <p className="text-base text-slate-300">Solde du mois</p>
        <p className={`text-3xl font-black ${solde < 0 ? "text-red-300" : ""}`}>{formatFCFA(solde)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-base">
          <div className="rounded-xl bg-marine-clair p-3">
            <p className="text-slate-300">Reçu</p>
            <p className="font-bold text-green-300">{formatFCFA(totalRecu)}</p>
          </div>
          <div className="rounded-xl bg-marine-clair p-3">
            <p className="text-slate-300">Dépensé</p>
            <p className="font-bold text-red-300">{formatFCFA(totalDepense)}</p>
          </div>
        </div>
      </section>

      <AjoutOperation categories={categories ?? []} dateDuJour={aujourdhui()} ouvertSur={ouvertSur} />

      {/* Liste des opérations */}
      <section className="space-y-4">
        <h2 className="text-xl font-black text-marine">Opérations</h2>

        {liste.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-base text-slate-600">
            Aucune opération ce mois-ci. Utilisez les boutons ci-dessus pour en ajouter une.
          </p>
        )}

        {[...parJour.entries()].map(([date, operationsDuJour]) => (
          <div key={date}>
            <h3 className="mb-2 text-base font-bold capitalize text-slate-500">{dateCourte(date)}</h3>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {operationsDuJour.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/pme/caisse/${o.id}`}
                    className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold text-slate-900">
                        {(o.categorie_id && nomsCategories.get(o.categorie_id)) || "Sans catégorie"}
                      </span>
                      {o.note && <span className="block truncate text-base text-slate-500">{o.note}</span>}
                    </span>
                    <span
                      className={`shrink-0 text-base font-black ${o.type === "recu" ? "text-agri" : "text-red-600"}`}
                    >
                      {o.type === "recu" ? "+" : "−"} {formatFCFA(o.montant)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Exports et réglages */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link href={`/pme/caisse/imprimer?mois=${mois.cle}`} className={boutonSecondaire}>
          📄 Exporter en PDF
        </Link>
        <a href={`/pme/caisse/export?mois=${mois.cle}`} className={boutonSecondaire}>
          📊 Exporter en CSV (Excel)
        </a>
        <Link href="/pme/caisse/categories" className={`${boutonSecondaire} sm:col-span-2`}>
          🏷️ Gérer les catégories
        </Link>
      </section>
    </div>
  );
}

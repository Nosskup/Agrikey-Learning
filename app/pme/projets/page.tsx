import Link from "next/link";
import { exigerEntreprise, type Projet, type Tache } from "@/lib/pme/session";
import { ajouterJours, aujourdhui, dateNumerique } from "@/lib/pme/format";
import Depliable from "@/components/pme/Depliable";
import { boutonPrincipal } from "@/components/pme/styles";
import { ajouterTache, creerProjet } from "./actions";
import BarreStatuts from "./BarreStatuts";
import { VERDICTS, calculerRythme, compterTaches } from "@/lib/pme/avancement";
import FormulaireProjet from "./FormulaireProjet";
import FormulaireTache from "./FormulaireTache";
import LigneTache from "./LigneTache";

export const metadata = { title: "Projets" };

export default async function ProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>;
}) {
  const ajouterUneTache = (await searchParams).ajouter === "tache";
  const { supabase } = await exigerEntreprise();

  const [{ data: projets }, { data: taches }] = await Promise.all([
    supabase
      .from("projets")
      .select("id, nom, description, date_debut, date_fin")
      .order("created_at", { ascending: false })
      .returns<Projet[]>(),
    supabase
      .from("taches")
      .select("id, projet_id, titre, responsable, echeance, statut")
      .order("echeance", { ascending: true, nullsFirst: false })
      .returns<Tache[]>(),
  ]);

  const listeProjets = projets ?? [];
  const listeTaches = taches ?? [];
  const nomsProjets = new Map(listeProjets.map((p) => [p.id, p.nom]));

  const jour = aujourdhui();
  const dansUneSemaine = ajouterJours(jour, 7);
  // Tâches non terminées en retard ou à échéance dans les 7 prochains jours.
  const cetteSemaine = listeTaches.filter(
    (t) => t.statut !== "termine" && t.echeance !== null && t.echeance <= dansUneSemaine
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-marine">📋 Projets</h1>
        <Link href="/pme" className="min-h-12 content-center text-base font-semibold text-slate-600 underline">
          Accueil
        </Link>
      </div>

      {ajouterUneTache && listeProjets.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-black text-marine">Nouvelle tâche</h2>
          <FormulaireTache action={ajouterTache} projets={listeProjets} />
        </section>
      )}

      {ajouterUneTache && listeProjets.length === 0 && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-base font-semibold text-amber-900">
          Une tâche appartient à un projet : créez d&apos;abord votre premier projet ci-dessous.
        </p>
      )}

      <Depliable libelle="+ Nouveau projet" ouvert={listeProjets.length === 0} classeBouton={boutonPrincipal}>
        <FormulaireProjet action={creerProjet} />
      </Depliable>

      {/* À faire cette semaine */}
      <section className="space-y-2">
        <h2 className="text-xl font-black text-marine">À faire cette semaine</h2>
        {cetteSemaine.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-base text-slate-600">
            Rien d&apos;urgent cette semaine. 👍
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {cetteSemaine.map((t) => (
              <LigneTache key={t.id} tache={t} aujourdhui={jour} nomProjet={nomsProjets.get(t.projet_id)} />
            ))}
          </ul>
        )}
      </section>

      {/* Liste des projets */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-marine">Mes projets</h2>
        {listeProjets.length === 0 && (
          <p className="text-base text-slate-600">Aucun projet pour l&apos;instant.</p>
        )}
        {listeProjets.map((p) => {
          const tachesDuProjet = listeTaches.filter((t) => t.projet_id === p.id);
          const compte = compterTaches(tachesDuProjet, jour);
          const rythme = calculerRythme(p, compte, jour);
          const verdict = rythme ? VERDICTS[rythme.verdict] : null;

          return (
            <Link
              key={p.id}
              href={`/pme/projets/${p.id}`}
              className="block space-y-3 rounded-2xl border border-slate-200 bg-white p-5 hover:border-agri"
            >
              <div>
                <p className="text-lg font-black text-marine">{p.nom}</p>
                {(p.date_debut || p.date_fin) && (
                  <p className="text-base text-slate-500">
                    {p.date_debut ? dateNumerique(p.date_debut) : "…"} → {p.date_fin ? dateNumerique(p.date_fin) : "…"}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-2">
                  {verdict && (
                    <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${verdict.classe}`}>
                      {verdict.icone} {verdict.libelle}
                    </span>
                  )}
                  {compte.enRetard > 0 && (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-bold text-red-800">
                      ⚠️ {compte.enRetard} tâche{compte.enRetard > 1 ? "s" : ""} en retard
                    </span>
                  )}
                </div>
              </div>
              <BarreStatuts compte={compte} />
            </Link>
          );
        })}
      </section>
    </div>
  );
}

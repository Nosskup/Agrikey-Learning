import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerEntreprise, type Projet, type Tache } from "@/lib/pme/session";
import { aujourdhui, dateNumerique } from "@/lib/pme/format";
import { uuidValide } from "@/lib/pme/validation";
import BoutonSupprimer from "@/components/pme/BoutonSupprimer";
import Depliable from "@/components/pme/Depliable";
import { ajouterTache, modifierProjet, supprimerProjet } from "../actions";
import AnneauAvancement from "../AnneauAvancement";
import RythmeProjet from "../RythmeProjet";
import TableauTaches from "../TableauTaches";
import FriseProjet from "../FriseProjet";
import { calculerRythme, compterTaches } from "@/lib/pme/avancement";
import { carte } from "@/components/pme/styles";
import FormulaireProjet from "../FormulaireProjet";
import FormulaireTache from "../FormulaireTache";
import LigneTache from "../LigneTache";

export const metadata = { title: "Projet" };

const ORDRE_STATUT = { en_cours: 0, a_faire: 1, termine: 2 } as const;

const VUES = [
  { code: "liste", libelle: "☰ Liste" },
  { code: "tableau", libelle: "▦ Tableau" },
  { code: "frise", libelle: "⏱ Frise" },
] as const;
type Vue = (typeof VUES)[number]["code"];

export default async function ProjetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ vue?: string }>;
}) {
  const { id } = await params;
  const { vue: vueDemandee } = await searchParams;
  const vue: Vue = VUES.some((v) => v.code === vueDemandee) ? (vueDemandee as Vue) : "liste";
  if (!uuidValide(id)) notFound();

  const { supabase } = await exigerEntreprise();

  const [{ data: projet }, { data: taches }] = await Promise.all([
    supabase
      .from("projets")
      .select("id, nom, description, date_debut, date_fin")
      .eq("id", id)
      .maybeSingle<Projet>(),
    supabase
      .from("taches")
      .select("id, projet_id, titre, responsable, echeance, statut")
      .eq("projet_id", id)
      .order("echeance", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .returns<Tache[]>(),
  ]);

  if (!projet) notFound();

  // Tâches en cours, puis à faire, puis terminées (tri stable : l'échéance reste respectée).
  const liste = [...(taches ?? [])].sort((a, b) => ORDRE_STATUT[a.statut] - ORDRE_STATUT[b.statut]);
  const jour = aujourdhui();
  const compte = compterTaches(liste, jour);
  const rythme = calculerRythme(projet, compte, jour);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-black break-words text-marine">{projet.nom}</h1>
          {(projet.date_debut || projet.date_fin) && (
            <p className="text-base text-slate-500">
              {projet.date_debut ? dateNumerique(projet.date_debut) : "…"} →{" "}
              {projet.date_fin ? dateNumerique(projet.date_fin) : "…"}
            </p>
          )}
        </div>
        <Link href="/pme/projets" className="min-h-12 shrink-0 content-center text-base font-semibold text-slate-600 underline">
          Projets
        </Link>
      </div>

      {projet.description && <p className="text-base text-slate-700">{projet.description}</p>}

      {/* Vue d'ensemble : où en est le projet, et va-t-il au bon rythme ? */}
      {liste.length > 0 && (
        <section className={`${carte} space-y-5 p-5`} aria-label="Avancement du projet">
          <AnneauAvancement compte={compte} />
          {rythme ? (
            <div className="border-t border-slate-100 pt-4">
              <RythmeProjet rythme={rythme} />
            </div>
          ) : (
            <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">
              Ajoutez une date de début et de fin au projet pour savoir s&apos;il avance au bon rythme.
            </p>
          )}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-black text-marine">Tâches</h2>
          {liste.length > 0 && (
            <nav aria-label="Affichage des tâches" className="flex rounded-2xl bg-slate-100 p-1">
              {VUES.map((v) => (
                <Link
                  key={v.code}
                  href={`/pme/projets/${projet.id}${v.code === "liste" ? "" : `?vue=${v.code}`}`}
                  aria-current={vue === v.code ? "page" : undefined}
                  className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-bold ${
                    vue === v.code ? "bg-white text-marine shadow-sm" : "text-slate-500"
                  }`}
                >
                  {v.libelle}
                </Link>
              ))}
            </nav>
          )}
        </div>
        {liste.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-base text-slate-600">
            Aucune tâche. Ajoutez la première ci-dessous.
          </p>
        ) : vue === "tableau" ? (
          <TableauTaches taches={liste} jour={jour} />
        ) : vue === "frise" ? (
          <FriseProjet projet={projet} taches={liste} jour={jour} />
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {liste.map((t) => (
              <LigneTache key={t.id} tache={t} aujourdhui={jour} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-marine">Ajouter une tâche</h2>
        <FormulaireTache action={ajouterTache} projets={[projet]} projetId={projet.id} />
      </section>

      <section className="space-y-3 border-t border-slate-200 pt-6">
        <Depliable libelle="✏️ Modifier le projet">
          <FormulaireProjet action={modifierProjet.bind(null, projet.id)} projet={projet} />
        </Depliable>
        <BoutonSupprimer
          action={supprimerProjet.bind(null, projet.id)}
          question={`Supprimer le projet « ${projet.nom} » et toutes ses tâches ?`}
          libelle="🗑️ Supprimer le projet"
          className="w-full"
        />
      </section>
    </div>
  );
}

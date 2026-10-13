import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerEntreprise, type Projet, type Tache } from "@/lib/pme/session";
import { aujourdhui, dateNumerique } from "@/lib/pme/format";
import { uuidValide } from "@/lib/pme/validation";
import BoutonSupprimer from "@/components/pme/BoutonSupprimer";
import Depliable from "@/components/pme/Depliable";
import { ajouterTache, modifierProjet, supprimerProjet } from "../actions";
import BarreProgression from "../BarreProgression";
import FormulaireProjet from "../FormulaireProjet";
import FormulaireTache from "../FormulaireTache";
import LigneTache from "../LigneTache";

export const metadata = { title: "Projet" };

const ORDRE_STATUT = { en_cours: 0, a_faire: 1, termine: 2 } as const;

export default async function ProjetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  const terminees = liste.filter((t) => t.statut === "termine").length;
  const jour = aujourdhui();

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

      <BarreProgression terminees={terminees} total={liste.length} />

      <section className="space-y-2">
        <h2 className="text-xl font-black text-marine">Tâches</h2>
        {liste.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-base text-slate-600">
            Aucune tâche. Ajoutez la première ci-dessous.
          </p>
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

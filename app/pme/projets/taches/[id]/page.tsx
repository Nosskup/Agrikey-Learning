import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerEntreprise, type Projet, type Tache } from "@/lib/pme/session";
import { uuidValide } from "@/lib/pme/validation";
import BoutonSupprimer from "@/components/pme/BoutonSupprimer";
import { modifierTache, supprimerTache } from "../../actions";
import FormulaireTache from "../../FormulaireTache";

export const metadata = { title: "Modifier une tâche" };

export default async function ModifierTachePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidValide(id)) notFound();

  const { supabase } = await exigerEntreprise();

  const [{ data: tache }, { data: projets }] = await Promise.all([
    supabase
      .from("taches")
      .select("id, projet_id, titre, responsable, echeance, statut")
      .eq("id", id)
      .maybeSingle<Tache>(),
    supabase.from("projets").select("id, nom").order("created_at", { ascending: false }).returns<Pick<Projet, "id" | "nom">[]>(),
  ]);

  if (!tache) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-marine">Modifier la tâche</h1>
        <Link
          href={`/pme/projets/${tache.projet_id}`}
          className="min-h-12 content-center text-base font-semibold text-slate-600 underline"
        >
          Annuler
        </Link>
      </div>

      <FormulaireTache action={modifierTache.bind(null, tache.id)} projets={projets ?? []} tache={tache} />

      <BoutonSupprimer
        action={supprimerTache.bind(null, tache.id, tache.projet_id)}
        question="Supprimer définitivement cette tâche ?"
        libelle="🗑️ Supprimer la tâche"
        className="w-full"
      />
    </div>
  );
}

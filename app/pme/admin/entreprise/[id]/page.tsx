import { notFound, redirect } from "next/navigation";
import { estAdmin, utilisateurConnecte } from "@/lib/pme/session";
import { resumerModeles } from "@/lib/pme/modeles";
import { uuidValide } from "@/lib/pme/validation";
import { definirModelesEntreprise } from "../../actions";
import ChoixModeles from "../../ChoixModeles";

export const metadata = { title: "Modèles d'un membre" };

type Ligne = { entreprise_id: string; nom: string; email: string | null; code_partenaire: string | null; modeles_autorises: string[] | null };

// Modèles de documents d'un membre précis : suivre son code, tous, ou une sélection.
export default async function ModelesEntreprisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidValide(id)) notFound();

  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (!(await estAdmin(supabase, user.id))) redirect("/pme/admin");

  const { data } = await supabase.rpc("pme_liste_entreprises");
  const entreprise = ((data ?? []) as Ligne[]).find((e) => e.entreprise_id === id);
  if (!entreprise) notFound();

  let resumeCode = "tous les modèles (sans code)";
  if (entreprise.code_partenaire) {
    const { data: invitation } = await supabase
      .from("codes_invitation")
      .select("modeles_autorises")
      .eq("code", entreprise.code_partenaire)
      .maybeSingle();
    resumeCode = `${entreprise.code_partenaire} – ${resumerModeles(invitation?.modeles_autorises ?? null).toLowerCase()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-marine">Modèles de {entreprise.nom}</h1>
        {entreprise.email && <p className="text-base text-slate-600">{entreprise.email}</p>}
      </div>
      <ChoixModeles
        action={definirModelesEntreprise.bind(null, entreprise.entreprise_id)}
        autorises={entreprise.modeles_autorises}
        avecSuivreCode
        resumeCode={resumeCode}
      />
    </div>
  );
}

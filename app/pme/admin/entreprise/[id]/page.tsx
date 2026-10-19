import { notFound, redirect } from "next/navigation";
import { estAdmin, utilisateurConnecte } from "@/lib/pme/session";
import { resumerModeles } from "@/lib/pme/modeles";
import { uuidValide } from "@/lib/pme/validation";
import { definirModelesEntreprise, definirQuotaEntreprise } from "../../actions";
import ChoixModeles from "../../ChoixModeles";
import ChoixQuota from "../../ChoixQuota";
import { resumerQuota } from "@/lib/pme/creations";

export const metadata = { title: "Réglages d'un membre" };

type Ligne = { entreprise_id: string; nom: string; email: string | null; code_partenaire: string | null; modeles_autorises: string[] | null; quota_ia?: number | null; creations_ia_mois?: number };

// Modèles de documents et créations IA d'un membre précis : suivre son code ou un réglage propre.
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
  let resumeQuotaCode = resumerQuota(null).toLowerCase();
  if (entreprise.code_partenaire) {
    const { data: invitation } = await supabase
      .from("codes_invitation")
      .select("*")
      .eq("code", entreprise.code_partenaire)
      .maybeSingle();
    resumeCode = `${entreprise.code_partenaire} – ${resumerModeles(invitation?.modeles_autorises ?? null).toLowerCase()}`;
    resumeQuotaCode = `${entreprise.code_partenaire} – ${resumerQuota(invitation?.quota_ia ?? null).toLowerCase()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-marine">Réglages de {entreprise.nom}</h1>
        {entreprise.email && <p className="text-base text-slate-600">{entreprise.email}</p>}
        {entreprise.creations_ia_mois !== undefined && (
          <p className="text-base text-slate-600">🎨 {entreprise.creations_ia_mois} création(s) IA ce mois-ci</p>
        )}
      </div>
      <ChoixModeles
        action={definirModelesEntreprise.bind(null, entreprise.entreprise_id)}
        autorises={entreprise.modeles_autorises}
        avecSuivreCode
        resumeCode={resumeCode}
      />
      <ChoixQuota
        action={definirQuotaEntreprise.bind(null, entreprise.entreprise_id)}
        quota={entreprise.quota_ia ?? null}
        avecSuivreCode
        resumeCode={resumeQuotaCode}
      />
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { estAdmin, utilisateurConnecte } from "@/lib/pme/session";
import { resumerModeles } from "@/lib/pme/modeles";
import { uuidValide } from "@/lib/pme/validation";
import { definirFinEssai, definirModelesEntreprise, definirQuotaEntreprise } from "../../actions";
import { boutonPrincipal, champ } from "@/components/pme/styles";
import { dateLongue } from "@/lib/pme/format";
import ChoixModeles from "../../ChoixModeles";
import ChoixQuota from "../../ChoixQuota";
import { resumerQuota } from "@/lib/pme/creations";

export const metadata = { title: "Réglages d'un membre" };

type Ligne = { entreprise_id: string; nom: string; email: string | null; code_partenaire: string | null; modeles_autorises: string[] | null; quota_ia?: number | null; creations_ia_mois?: number; fin_essai?: string | null; fin_essai_personnalisee?: boolean; abonnement_jusqua?: string | null };

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
      {entreprise.fin_essai !== undefined && (
        <form
          action={definirFinEssai.bind(null, entreprise.entreprise_id)}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-base"
        >
          <p className="font-semibold text-marine">🎁 Période gratuite et abonnement</p>
          <p className="text-slate-600">
            Période gratuite : {entreprise.fin_essai ? `jusqu'au ${dateLongue(entreprise.fin_essai)}` : "pas encore commencée (inscription à valider)"}
            {entreprise.fin_essai_personnalisee ? " (date fixée pour ce membre)" : " (selon son code)"}
            <br />
            Abonnement : {entreprise.abonnement_jusqua ? `jusqu'au ${dateLongue(entreprise.abonnement_jusqua)}` : "aucun"}
          </p>
          <label htmlFor="fin_essai" className="block font-semibold text-slate-800">
            Fixer une autre fin de période gratuite
          </label>
          <input
            id="fin_essai"
            name="fin_essai"
            type="date"
            defaultValue={entreprise.fin_essai_personnalisee && entreprise.fin_essai ? entreprise.fin_essai.slice(0, 10) : ""}
            className={`${champ} max-w-56`}
          />
          <p className="text-slate-500">Laissez vide pour revenir à la période prévue par son code.</p>
          <button type="submit" className={boutonPrincipal}>
            Enregistrer la date
          </button>
        </form>
      )}
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

import { notFound, redirect } from "next/navigation";
import { estAdmin, utilisateurConnecte } from "@/lib/pme/session";
import { resumerModeles } from "@/lib/pme/modeles";
import { uuidValide } from "@/lib/pme/validation";
import { definirFinEssai, definirModelesEntreprise, definirQuotaEntreprise } from "../../actions";
import { boutonPrincipal, boutonSecondaire, champ } from "@/components/pme/styles";
import { dateLongue } from "@/lib/pme/format";
import ChoixModeles from "../../ChoixModeles";
import ChoixQuota from "../../ChoixQuota";
import { resumerQuota } from "@/lib/pme/creations";
import { resumerAcces } from "../../acces";

export const metadata = { title: "Réglages d'un membre" };

type Ligne = { entreprise_id: string; nom: string; email: string | null; code_partenaire: string | null; modeles_autorises: string[] | null; quota_ia?: number | null; creations_ia_mois?: number; fin_essai?: string | null; fin_essai_personnalisee?: boolean; abonnement_jusqua?: string | null };

// Réglages d'un membre précis : accès (date limite), modèles de documents et créations IA.
export default async function ModelesEntreprisePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ acces?: string }>;
}) {
  const { id } = await params;
  const { acces } = await searchParams;
  if (!uuidValide(id)) notFound();

  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (!(await estAdmin(supabase, user.id))) redirect("/pme/admin");

  const { data } = await supabase.rpc("pme_liste_entreprises");
  const entreprise = ((data ?? []) as Ligne[]).find((e) => e.entreprise_id === id);
  if (!entreprise) notFound();

  const resumeAcces = resumerAcces(entreprise.fin_essai ?? null, entreprise.abonnement_jusqua ?? null);
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
      <section className="space-y-4 rounded-2xl border-2 border-agri bg-white p-5 text-base">
        <h2 className="text-lg font-black text-marine">⏳ Accès de ce membre</h2>

        {acces === "ok" && (
          <p role="status" className="rounded-xl bg-green-50 px-3 py-2 font-semibold text-agri-fonce">C&apos;est enregistré.</p>
        )}
        {acces === "erreur" && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 font-semibold text-red-700">
            L&apos;enregistrement a échoué. Vérifiez que le script SQL 20261025 a bien été exécuté dans Supabase.
          </p>
        )}
        {acces === "date" && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 font-semibold text-red-700">Choisissez une date.</p>
        )}

        {entreprise.fin_essai === undefined ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">
            Pour gérer l&apos;accès, exécutez d&apos;abord dans Supabase le script{" "}
            <span className="font-mono">supabase/migrations/20261025_pme_acces_payant.sql</span>, puis rechargez cette page.
          </p>
        ) : (
          <>
            <p className="text-slate-700">
              <strong>{resumeAcces}</strong>
              <br />
              Accès gratuit : {entreprise.fin_essai ? `jusqu'au ${dateLongue(entreprise.fin_essai)}` : "commence à la validation"}
              {entreprise.fin_essai_personnalisee ? " (date fixée pour ce membre)" : " (selon son code)"}
              <br />
              Abonnement payé : {entreprise.abonnement_jusqua ? `jusqu'au ${dateLongue(entreprise.abonnement_jusqua)}` : "aucun"}
            </p>

            <form action={definirFinEssai.bind(null, entreprise.entreprise_id)} className="space-y-3">
              <input type="hidden" name="choix" value="date" />
              <label htmlFor="fin_essai" className="block font-semibold text-slate-800">
                Date limite d&apos;accès gratuit
              </label>
              <div className="flex flex-wrap gap-3">
                <input
                  id="fin_essai"
                  name="fin_essai"
                  type="date"
                  required
                  defaultValue={entreprise.fin_essai ? entreprise.fin_essai.slice(0, 10) : ""}
                  className={`${champ} max-w-56`}
                />
                <button type="submit" className={`${boutonPrincipal} w-auto`}>
                  Enregistrer la date
                </button>
              </div>
            </form>

            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { choix: "plus1", libelle: "+ 1 mois" },
                { choix: "plus3", libelle: "+ 3 mois" },
              ].map((b) => (
                <form key={b.choix} action={definirFinEssai.bind(null, entreprise.entreprise_id)}>
                  <input type="hidden" name="choix" value={b.choix} />
                  <button type="submit" className={boutonSecondaire}>
                    {b.libelle}
                  </button>
                </form>
              ))}
              <form action={definirFinEssai.bind(null, entreprise.entreprise_id)}>
                <input type="hidden" name="choix" value="couper" />
                <button
                  type="submit"
                  className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-700 hover:bg-red-50"
                >
                  ⛔ Couper l&apos;accès aujourd&apos;hui
                </button>
              </form>
              {entreprise.fin_essai_personnalisee && (
                <form action={definirFinEssai.bind(null, entreprise.entreprise_id)}>
                  <input type="hidden" name="choix" value="code" />
                  <button type="submit" className={boutonSecondaire}>
                    ↩ Revenir à la règle de son code
                  </button>
                </form>
              )}
            </div>
            <p className="text-sm text-slate-500">
              « + 1 mois » et « + 3 mois » s&apos;ajoutent à la date actuelle (ou à aujourd&apos;hui si elle est passée).
              Couper l&apos;accès ne supprime aucune donnée : le membre peut se réabonner. Un abonnement payé reste valable
              jusqu&apos;à sa propre date.
            </p>
          </>
        )}
      </section>

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

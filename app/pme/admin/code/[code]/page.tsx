import { notFound, redirect } from "next/navigation";
import { estAdmin, utilisateurConnecte } from "@/lib/pme/session";
import { definirModelesCode, definirMoisOfferts, definirQuotaCode } from "../../actions";
import { boutonPrincipal, champ } from "@/components/pme/styles";
import ChoixModeles from "../../ChoixModeles";
import ChoixQuota from "../../ChoixQuota";

export const metadata = { title: "Réglages d'un code" };

// Modèles de documents et créations IA ouverts par défaut aux membres inscrits avec ce code.
export default async function ModelesCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (!(await estAdmin(supabase, user.id))) redirect("/pme/admin");

  const { data: invitation } = await supabase
    .from("codes_invitation")
    .select("*")
    .eq("code", decodeURIComponent(code))
    .maybeSingle();
  if (!invitation) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-marine">Réglages du code {invitation.code}</h1>
        {invitation.libelle && <p className="text-base text-slate-600">{invitation.libelle}</p>}
        <p className="mt-2 text-base text-slate-600">
          Réglage par défaut pour tous les membres inscrits avec ce code. Vous pouvez ensuite l&apos;ajuster pour un membre
          précis depuis la liste des entreprises.
        </p>
      </div>
      <form
        action={definirMoisOfferts.bind(null, invitation.code)}
        className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-base"
      >
        <label htmlFor="mois_offerts" className="block font-semibold text-marine">
          🎁 Période gratuite : mois offerts après la validation
        </label>
        <input
          id="mois_offerts"
          name="mois_offerts"
          type="number"
          min={0}
          max={60}
          inputMode="numeric"
          defaultValue={invitation.mois_offerts ?? ""}
          placeholder="1 (par défaut)"
          className={`${champ} max-w-40`}
        />
        <p className="text-slate-500">
          Vide = 1 mois. Ensuite, l&apos;abonnement est nécessaire pour continuer. S&apos;applique aussi aux membres déjà
          inscrits avec ce code (sauf date fixée pour un membre).
        </p>
        <button type="submit" className={boutonPrincipal}>
          Enregistrer la période gratuite
        </button>
      </form>
      <ChoixModeles action={definirModelesCode.bind(null, invitation.code)} autorises={invitation.modeles_autorises} />
      <ChoixQuota action={definirQuotaCode.bind(null, invitation.code)} quota={invitation.quota_ia ?? null} />
    </div>
  );
}

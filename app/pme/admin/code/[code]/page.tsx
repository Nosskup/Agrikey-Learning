import { notFound, redirect } from "next/navigation";
import { estAdmin, utilisateurConnecte } from "@/lib/pme/session";
import { definirModelesCode, definirQuotaCode } from "../../actions";
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
      <ChoixModeles action={definirModelesCode.bind(null, invitation.code)} autorises={invitation.modeles_autorises} />
      <ChoixQuota action={definirQuotaCode.bind(null, invitation.code)} quota={invitation.quota_ia ?? null} />
    </div>
  );
}

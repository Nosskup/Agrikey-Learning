import Link from "next/link";
import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/pme/session";
import { EDITEUR } from "@/lib/pme/editeur";
import { boutonSecondaire } from "@/components/pme/styles";
import { deconnecter } from "../actions";

export const metadata = { title: "Inscription en attente" };

// Compte inscrit mais pas encore validé (ou refusé) par un administrateur.
export default async function EnAttentePage() {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  const { data: entreprise } = await supabase
    .from("entreprises")
    .select("nom, statut")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!entreprise) redirect("/pme/bienvenue");
  if (entreprise.statut === "valide") redirect("/pme");

  const refusee = entreprise.statut === "refuse";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-marine">
        {refusee ? "Inscription non retenue" : "Inscription en attente de validation"}
      </h1>

      <div
        className={`space-y-3 rounded-2xl border p-5 text-base ${
          refusee ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        {refusee ? (
          <p>
            L&apos;inscription de <strong>{entreprise.nom}</strong> n&apos;a pas été validée. Si vous pensez qu&apos;il
            s&apos;agit d&apos;une erreur, contactez AGRIKEY.
          </p>
        ) : (
          <>
            <p>
              Merci ! L&apos;inscription de <strong>{entreprise.nom}</strong> est bien enregistrée.
            </p>
            <p>
              Un responsable va la vérifier. Dès qu&apos;elle sera validée, vous aurez accès à votre caisse, vos projets et
              vos documents : revenez simplement sur cette page plus tard.
            </p>
          </>
        )}
        <p>
          Contact : {EDITEUR.email} · {EDITEUR.telephone}
        </p>
      </div>

      <Link href="/pme/en-attente" className={boutonSecondaire}>
        🔄 Vérifier à nouveau
      </Link>

      <form action={deconnecter}>
        <button type="submit" className="min-h-12 w-full text-base font-semibold text-slate-600 underline">
          Se déconnecter
        </button>
      </form>
    </div>
  );
}

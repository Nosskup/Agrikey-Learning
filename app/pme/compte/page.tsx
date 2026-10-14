import Link from "next/link";
import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/pme/session";
import { boutonSecondaire } from "@/components/pme/styles";
import FormulaireSuppression from "./FormulaireSuppression";

export const metadata = { title: "Mon compte" };

export default async function ComptePage() {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  const { data: entreprise } = await supabase
    .from("entreprises")
    .select("nom, code_partenaire")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-marine">Mon compte</h1>

      <section className="space-y-1 rounded-2xl border border-slate-200 bg-white p-5 text-base">
        <p>
          <span className="font-semibold text-marine">E-mail :</span> {user.email}
        </p>
        {entreprise && (
          <p>
            <span className="font-semibold text-marine">Entreprise :</span> {entreprise.nom}
          </p>
        )}
        {entreprise?.code_partenaire && (
          <p>
            <span className="font-semibold text-marine">Code partenaire :</span> {entreprise.code_partenaire}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-marine">Mot de passe</h2>
        <Link href="/pme/nouveau-mot-de-passe" className={boutonSecondaire}>
          🔑 Changer mon mot de passe
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-marine">Mes données</h2>
        <p className="text-base text-slate-600">
          Vos données vous appartiennent. Téléchargez-les à tout moment : entreprise, caisse, projets et documents.
        </p>
        <a href="/pme/compte/export" className={boutonSecondaire}>
          ⬇️ Télécharger mes données
        </a>
      </section>

      <section className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-xl font-black text-red-800">Supprimer mes données AGRIKEY PME</h2>
        <p className="text-base text-red-900">
          Efface définitivement votre entreprise, votre caisse, vos projets, vos documents et votre logo. Cette action ne
          peut pas être annulée. Votre compte AGRIKEY (formations) est conservé.
        </p>
        <FormulaireSuppression />
      </section>

      <p className="text-center text-base text-slate-600">
        <Link href="/pme/confidentialite" className="underline">
          Politique de confidentialité
        </Link>
        {" · "}
        <Link href="/pme/conditions" className="underline">
          Conditions d&apos;utilisation
        </Link>
      </p>
    </div>
  );
}

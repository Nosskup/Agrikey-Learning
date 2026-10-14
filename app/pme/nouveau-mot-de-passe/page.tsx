import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/pme/session";
import FormulaireNouveauMotDePasse from "./FormulaireNouveauMotDePasse";

export const metadata = { title: "Nouveau mot de passe" };

// On arrive ici par le lien reçu par e-mail (la session est ouverte par /pme/auth/callback).
export default async function NouveauMotDePassePage() {
  const { user } = await utilisateurConnecte();
  if (!user) {
    redirect("/pme/mot-de-passe-oublie");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-marine">Nouveau mot de passe</h1>
        <p className="mt-2 text-base text-slate-600">Choisissez un nouveau mot de passe pour {user.email}.</p>
      </div>
      <FormulaireNouveauMotDePasse />
    </div>
  );
}

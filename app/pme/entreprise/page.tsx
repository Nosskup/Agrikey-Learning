import { exigerEntreprise } from "@/lib/pme/session";
import FormulaireEntreprise from "./FormulaireEntreprise";

export const metadata = { title: "Mon entreprise" };

export default async function EntreprisePage() {
  const { user, entreprise } = await exigerEntreprise();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-marine">Mon entreprise</h1>
        <p className="mt-2 text-base text-slate-600">
          Ces informations apparaissent automatiquement sur vos devis, factures et lettres.
        </p>
      </div>
      <FormulaireEntreprise entreprise={entreprise} userId={user.id} />
    </div>
  );
}

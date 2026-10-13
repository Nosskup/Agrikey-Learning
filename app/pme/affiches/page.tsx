import Link from "next/link";
import { exigerEntreprise } from "@/lib/pme/session";
import { boutonSecondaire } from "@/components/pme/styles";
import BoutonMePrevenir from "./BoutonMePrevenir";

export const metadata = { title: "Affiches et logos IA" };

export default async function AffichesPage() {
  const { supabase } = await exigerEntreprise();

  const { data: inscription } = await supabase
    .from("liste_attente_ia")
    .select("id")
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-block rounded-full bg-slate-200 px-3 py-1 text-base font-bold text-slate-700">
          Bientôt disponible
        </span>
        <h1 className="mt-3 text-3xl font-black text-marine">Affiches et logos IA</h1>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-base text-slate-700">
        <p>Bientôt, décrivez ce que vous voulez en quelques mots, et AGRIKEY PME créera pour vous :</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>une affiche pour annoncer une promotion ou un événement ;</li>
          <li>un logo pour votre entreprise ;</li>
          <li>des visuels à partager sur WhatsApp et Facebook.</li>
        </ul>
      </div>

      <BoutonMePrevenir dejaInscrit={Boolean(inscription)} />

      <Link href="/pme" className={boutonSecondaire}>
        ← Retour au tableau de bord
      </Link>
    </div>
  );
}

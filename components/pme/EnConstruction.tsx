import Link from "next/link";
import { boutonSecondaire } from "./styles";

/** Page temporaire pour un module en cours de construction. */
export default function EnConstruction({
  titre,
  icone,
  description,
}: {
  titre: string;
  icone: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-marine">
        <span aria-hidden="true">{icone}</span> {titre}
      </h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-lg font-bold text-marine">Ce module arrive très bientôt.</p>
        <p className="mt-2 text-base text-slate-600">{description}</p>
      </div>
      <Link href="/pme" className={boutonSecondaire}>
        ← Retour au tableau de bord
      </Link>
    </div>
  );
}

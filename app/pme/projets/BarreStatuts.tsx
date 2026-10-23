import { LIBELLES_STATUT } from "@/lib/pme/libelles";
import { COULEURS_STATUT, type Compte } from "@/lib/pme/avancement";
import type { StatutTache } from "@/lib/pme/session";

const ORDRE: StatutTache[] = ["termine", "en_cours", "a_faire"];

/** Barre en trois couleurs : tâches terminées, en cours et à faire. */
export default function BarreStatuts({ compte }: { compte: Compte }) {
  if (compte.total === 0) return <p className="text-base text-slate-500">Aucune tâche</p>;
  const pourcentage = Math.round((compte.termine / compte.total) * 100);

  return (
    <div>
      <div
        className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={pourcentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tâches terminées"
      >
        {ORDRE.filter((s) => compte[s] > 0).map((s) => (
          <div
            key={s}
            title={`${LIBELLES_STATUT[s]} : ${compte[s]}`}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(compte[s] / compte.total) * 100}%`, background: COULEURS_STATUT[s] }}
          />
        ))}
      </div>
      <p className="mt-1.5 flex flex-wrap gap-x-3 text-sm text-slate-600">
        <span className="font-bold text-marine">{pourcentage} % terminé</span>
        {ORDRE.map((s) => (
          <span key={s} className="inline-flex items-center gap-1">
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: COULEURS_STATUT[s] }} />
            {compte[s]} {LIBELLES_STATUT[s].toLowerCase()}
          </span>
        ))}
      </p>
    </div>
  );
}

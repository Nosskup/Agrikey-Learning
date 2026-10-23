import { LIBELLES_STATUT } from "@/lib/pme/libelles";
import { COULEURS_STATUT, type Compte } from "@/lib/pme/avancement";
import type { StatutTache } from "@/lib/pme/session";

const ORDRE: StatutTache[] = ["termine", "en_cours", "a_faire"];
const RAYON = 52;
const EPAISSEUR = 16;
const CIRCONFERENCE = 2 * Math.PI * RAYON;
// Petit espace entre deux parts de l'anneau.
const ECART = 2;

/** Anneau : part des tâches terminées, en cours et à faire, avec le pourcentage au centre. */
export default function AnneauAvancement({ compte }: { compte: Compte }) {
  const pourcentage = compte.total === 0 ? 0 : Math.round((compte.termine / compte.total) * 100);
  const parts = ORDRE.filter((s) => compte[s] > 0);

  const longueurs = parts.map((statut) => (compte[statut] / compte.total) * CIRCONFERENCE);
  const arcs = parts.map((statut, i) => ({
    statut,
    depart: longueurs.slice(0, i).reduce((somme, l) => somme + l, 0),
    longueur: parts.length > 1 ? Math.max(0, longueurs[i] - ECART) : longueurs[i],
  }));

  return (
    <div className="flex items-center gap-5">
      <svg
        viewBox="0 0 136 136"
        className="h-32 w-32 shrink-0"
        role="img"
        aria-label={`${pourcentage} % des tâches terminées`}
      >
        <circle cx="68" cy="68" r={RAYON} fill="none" stroke="#e2e8f0" strokeWidth={EPAISSEUR} />
        <g transform="rotate(-90 68 68)">
          {arcs.map((a) => (
            <circle
              key={a.statut}
              cx="68"
              cy="68"
              r={RAYON}
              fill="none"
              stroke={COULEURS_STATUT[a.statut]}
              strokeWidth={EPAISSEUR}
              strokeDasharray={`${a.longueur} ${CIRCONFERENCE}`}
              strokeDashoffset={-a.depart}
            >
              <title>{`${LIBELLES_STATUT[a.statut]} : ${compte[a.statut]}`}</title>
            </circle>
          ))}
        </g>
        <text x="68" y="66" textAnchor="middle" className="fill-marine text-[28px] font-black">
          {pourcentage} %
        </text>
        <text x="68" y="86" textAnchor="middle" className="fill-slate-500 text-[12px] font-semibold">
          terminé
        </text>
      </svg>

      <ul className="min-w-0 space-y-1.5 text-base">
        {ORDRE.map((statut) => (
          <li key={statut} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ background: COULEURS_STATUT[statut] }} />
            <span className="text-slate-700">{LIBELLES_STATUT[statut]}</span>
            <span className="ml-auto pl-3 font-black text-marine">{compte[statut]}</span>
          </li>
        ))}
        {compte.enRetard > 0 && (
          <li className="font-bold text-red-700">
            ⚠️ {compte.enRetard} en retard
          </li>
        )}
      </ul>
    </div>
  );
}

import Link from "next/link";
import type { Projet, Tache } from "@/lib/pme/session";
import { LIBELLES_STATUT } from "@/lib/pme/libelles";
import { dateCourte } from "@/lib/pme/format";
import { COULEURS_STATUT, COULEUR_RETARD, estEnRetard } from "@/lib/pme/avancement";

type Etape =
  | { genre: "tache"; date: string; tache: Tache }
  | { genre: "repere"; date: string; libelle: string; icone: string };

function nomDuMois(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * Frise chronologique : début du projet, tâches à leur échéance, aujourd'hui et fin prévue,
 * de haut en bas, regroupées par mois.
 */
export default function FriseProjet({ projet, taches, jour }: { projet: Projet; taches: Tache[]; jour: string }) {
  const etapes: Etape[] = taches
    .filter((t) => t.echeance)
    .map((t) => ({ genre: "tache" as const, date: t.echeance!, tache: t }));
  if (projet.date_debut) etapes.push({ genre: "repere", date: projet.date_debut, libelle: "Début du projet", icone: "🚩" });
  if (projet.date_fin) etapes.push({ genre: "repere", date: projet.date_fin, libelle: "Fin prévue", icone: "🏁" });
  etapes.push({ genre: "repere", date: jour, libelle: "Aujourd'hui", icone: "📍" });

  // Ordre chronologique ; le même jour : début, tâches, aujourd'hui, fin.
  const rang = (e: Etape) =>
    e.genre === "tache" ? 1 : e.libelle === "Début du projet" ? 0 : e.libelle === "Aujourd'hui" ? 2 : 3;
  etapes.sort((a, b) => a.date.localeCompare(b.date) || rang(a) - rang(b));

  const sansDate = taches.filter((t) => !t.echeance);

  return (
    <div className="space-y-5">
      <ol className="relative ml-3 border-l-2 border-slate-200">
        {etapes.map((e, index) => {
          const mois = e.date.slice(0, 7);
          const enTete = index === 0 || etapes[index - 1].date.slice(0, 7) !== mois;
          const passe = e.date < jour;

          if (e.genre === "repere") {
            const estAujourdhui = e.libelle === "Aujourd'hui";
            return (
              <li key={`r${index}`} className="relative pb-4 pl-6">
                {enTete && <p className="-ml-6 mb-2 pl-6 text-sm font-black tracking-wide text-slate-400 uppercase">{nomDuMois(e.date)}</p>}
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className={`absolute top-0 -left-[37px] flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                      estAujourdhui ? "bg-marine ring-4 ring-sky-100" : "bg-white ring-2 ring-slate-200"
                    }`}
                  >
                    {e.icone}
                  </span>
                  <p className={`text-base font-black ${estAujourdhui ? "text-marine" : "text-slate-600"}`}>
                    {e.libelle} <span className="font-semibold text-slate-500">· <span className="capitalize">{dateCourte(e.date)}</span></span>
                  </p>
                </div>
              </li>
            );
          }

          const t = e.tache;
          const retard = estEnRetard(t, jour);
          const couleur = retard ? COULEUR_RETARD : COULEURS_STATUT[t.statut];
          return (
            <li key={t.id} className="relative pb-4 pl-6">
              {enTete && <p className="-ml-6 mb-2 pl-6 text-sm font-black tracking-wide text-slate-400 uppercase">{nomDuMois(e.date)}</p>}
              <div className="relative">
              <span
                aria-hidden="true"
                className="absolute top-4 -left-[33px] h-4 w-4 rounded-full ring-4 ring-white"
                style={{ background: couleur }}
              />
              <Link
                href={`/pme/projets/taches/${t.id}`}
                className={`block rounded-2xl border bg-white p-3 shadow-sm ${retard ? "border-red-200" : "border-slate-100"} ${
                  passe && t.statut === "termine" ? "opacity-70" : ""
                }`}
              >
                <span
                  className={`block text-base font-semibold break-words ${
                    t.statut === "termine" ? "text-slate-400 line-through" : "text-slate-900"
                  }`}
                >
                  {t.titre}
                </span>
                <span className="block text-sm text-slate-500">
                  <span className="capitalize">{dateCourte(t.echeance!)}</span> ·{" "}
                  {retard ? <strong className="text-red-700">⚠️ En retard</strong> : LIBELLES_STATUT[t.statut]}
                  {t.responsable && ` · 👤 ${t.responsable}`}
                </span>
              </Link>
              </div>
            </li>
          );
        })}
      </ol>

      {sansDate.length > 0 && (
        <div>
          <h3 className="mb-2 text-base font-black text-marine">Sans date ({sansDate.length})</h3>
          <ul className="flex flex-wrap gap-2">
            {sansDate.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/pme/projets/taches/${t.id}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                >
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: COULEURS_STATUT[t.statut] }} />
                  {t.titre}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-slate-500">Ajoutez une échéance à ces tâches pour les placer sur la frise.</p>
        </div>
      )}
    </div>
  );
}

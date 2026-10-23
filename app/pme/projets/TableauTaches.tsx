import type { StatutTache, Tache } from "@/lib/pme/session";
import { LIBELLES_STATUT } from "@/lib/pme/libelles";
import { COULEURS_STATUT, estEnRetard } from "@/lib/pme/avancement";
import CarteTableau from "./CarteTableau";

const COLONNES: StatutTache[] = ["a_faire", "en_cours", "termine"];

/** Tableau en trois colonnes : on voit d'un coup d'œil où en est chaque tâche. */
export default function TableauTaches({ taches, jour }: { taches: Tache[]; jour: string }) {
  return (
    // Sur téléphone, on fait glisser les colonnes de côté ; sur ordinateur, elles tiennent côte à côte.
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
      {COLONNES.map((statut) => {
        const colonne = taches.filter((t) => t.statut === statut);
        return (
          <section
            key={statut}
            aria-label={LIBELLES_STATUT[statut]}
            className="w-[80%] shrink-0 snap-start rounded-3xl bg-slate-100 p-3 sm:w-auto"
          >
            <h3 className="mb-2 flex items-center gap-2 px-1 text-base font-black text-marine">
              <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: COULEURS_STATUT[statut] }} />
              {LIBELLES_STATUT[statut]}
              <span className="ml-auto rounded-full bg-white px-2 text-sm text-slate-600">{colonne.length}</span>
            </h3>
            {colonne.length === 0 ? (
              <p className="px-1 py-3 text-sm text-slate-500">Aucune tâche.</p>
            ) : (
              <ul className="space-y-2">
                {colonne.map((t) => (
                  <CarteTableau key={t.id} tache={t} enRetard={estEnRetard(t, jour)} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

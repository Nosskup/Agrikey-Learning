"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { StatutTache, Tache } from "@/lib/pme/session";
import { LIBELLES_STATUT } from "@/lib/pme/libelles";
import { dateCourte } from "@/lib/pme/format";
import { changerStatutTache } from "./actions";

const ORDRE: StatutTache[] = ["a_faire", "en_cours", "termine"];

/** Carte d'une tâche dans le tableau, avec des boutons pour la changer de colonne. */
export default function CarteTableau({ tache, enRetard }: { tache: Tache; enRetard: boolean }) {
  const [enCours, demarrer] = useTransition();
  const position = ORDRE.indexOf(tache.statut);
  const precedent = ORDRE[position - 1];
  const suivant = ORDRE[position + 1];

  const deplacer = (statut: StatutTache) => demarrer(() => changerStatutTache(tache.id, statut));

  return (
    <li
      className={`rounded-2xl border bg-white p-3 shadow-sm ${enRetard ? "border-red-200" : "border-slate-100"} ${
        enCours ? "opacity-60" : ""
      }`}
    >
      <Link href={`/pme/projets/taches/${tache.id}`} className="block">
        <span
          className={`block text-base font-semibold break-words ${
            tache.statut === "termine" ? "text-slate-400 line-through" : "text-slate-900"
          }`}
        >
          {tache.titre}
        </span>
        {tache.responsable && <span className="block truncate text-sm text-slate-500">👤 {tache.responsable}</span>}
        {tache.echeance && (
          <span className={`block text-sm ${enRetard ? "font-bold text-red-700" : "text-slate-500"}`}>
            {enRetard ? "⚠️ En retard — " : "📅 "}
            <span className="capitalize">{dateCourte(tache.echeance)}</span>
          </span>
        )}
      </Link>

      <div className="mt-2 flex gap-2">
        {precedent && (
          <button
            type="button"
            disabled={enCours}
            onClick={() => deplacer(precedent)}
            aria-label={`Remettre « ${tache.titre} » dans ${LIBELLES_STATUT[precedent]}`}
            className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600"
          >
            ←
          </button>
        )}
        {suivant && (
          <button
            type="button"
            disabled={enCours}
            onClick={() => deplacer(suivant)}
            className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-green-50 px-3 text-sm font-bold text-agri-fonce"
          >
            {suivant === "termine" ? "✓ Terminer" : "▶ Commencer"}
          </button>
        )}
      </div>
    </li>
  );
}

import Link from "next/link";
import type { Tache } from "@/lib/pme/session";
import { LIBELLES_STATUT } from "@/lib/pme/libelles";
import { dateCourte } from "@/lib/pme/format";
import CaseTache from "./CaseTache";

/** Une tâche : case à cocher, titre, responsable, échéance (en rouge si dépassée). */
export default function LigneTache({
  tache,
  aujourdhui,
  nomProjet,
}: {
  tache: Tache;
  aujourdhui: string;
  nomProjet?: string;
}) {
  const terminee = tache.statut === "termine";
  const enRetard = !terminee && tache.echeance !== null && tache.echeance < aujourdhui;

  const details = [
    nomProjet,
    tache.responsable && `👤 ${tache.responsable}`,
    tache.statut === "en_cours" && LIBELLES_STATUT.en_cours,
  ].filter(Boolean);

  return (
    <li className={`flex items-center gap-1 py-2 pr-4 pl-1 ${enRetard ? "bg-red-50" : ""}`}>
      <CaseTache id={tache.id} terminee={terminee} titre={tache.titre} />
      <Link href={`/pme/projets/taches/${tache.id}`} className="min-w-0 flex-1 py-1">
        <span className={`block text-base font-semibold ${terminee ? "text-slate-400 line-through" : "text-slate-900"}`}>
          {tache.titre}
        </span>
        {details.length > 0 && <span className="block truncate text-base text-slate-500">{details.join(" · ")}</span>}
        {tache.echeance && (
          <span className={`block text-base ${enRetard ? "font-bold text-red-700" : "text-slate-500"}`}>
            {enRetard ? "⚠️ En retard — " : "📅 "}
            <span className="capitalize">{dateCourte(tache.echeance)}</span>
          </span>
        )}
      </Link>
    </li>
  );
}

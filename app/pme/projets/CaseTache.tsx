"use client";

import { useOptimistic, useTransition } from "react";
import { basculerTache } from "./actions";

/** Grosse case à cocher : termine (ou rouvre) la tâche en un geste. */
export default function CaseTache({ id, terminee, titre }: { id: string; terminee: boolean; titre: string }) {
  const [, demarrer] = useTransition();
  const [cochee, setCochee] = useOptimistic(terminee);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={cochee}
      aria-label={cochee ? `Rouvrir « ${titre} »` : `Terminer « ${titre} »`}
      onClick={() =>
        demarrer(async () => {
          setCochee(!cochee);
          await basculerTache(id, !cochee);
        })
      }
      className="flex h-12 w-12 shrink-0 items-center justify-center"
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-lg font-black ${
          cochee ? "border-agri bg-agri text-white" : "border-slate-400 bg-white text-transparent"
        }`}
      >
        ✓
      </span>
    </button>
  );
}

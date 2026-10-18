"use client";

import { useOptimistic, useTransition } from "react";
import type { Annonce } from "@/lib/opportunites/flux";
import { enregistrerAnnonce, retirerAnnonce } from "./actions";

/** Ajoute l'annonce à « Mes annonces » (ou l'en retire) en un geste. */
export default function BoutonEnregistrer({ annonce, enregistree }: { annonce: Annonce; enregistree: boolean }) {
  const [, demarrer] = useTransition();
  const [active, setActive] = useOptimistic(enregistree);

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() =>
        demarrer(async () => {
          setActive(!active);
          if (active) await retirerAnnonce(annonce.lien);
          else await enregistrerAnnonce(annonce);
        })
      }
      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-base font-semibold ${
        active ? "border-agri bg-green-50 text-agri-fonce" : "border-slate-300 bg-white text-marine hover:bg-slate-50"
      }`}
    >
      <span aria-hidden="true">{active ? "★" : "☆"}</span>
      {active ? "Enregistrée" : "Enregistrer"}
    </button>
  );
}

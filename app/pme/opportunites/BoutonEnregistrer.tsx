"use client";

import { useOptimistic, useTransition } from "react";
import type { Annonce } from "@/lib/opportunites/flux";
import Icone from "@/components/pme/Icones";
import { enregistrerAnnonce, retirerAnnonce } from "./actions";

/** Étoile ronde : ajoute l'annonce à « Mes annonces » (ou l'en retire) en un geste. */
export default function BoutonEnregistrer({ annonce, enregistree }: { annonce: Annonce; enregistree: boolean }) {
  const [, demarrer] = useTransition();
  const [active, setActive] = useOptimistic(enregistree);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Retirer de mes annonces" : "Enregistrer dans mes annonces"}
      title={active ? "Retirer de mes annonces" : "Enregistrer"}
      onClick={() =>
        demarrer(async () => {
          setActive(!active);
          if (active) await retirerAnnonce(annonce.lien);
          else await enregistrerAnnonce(annonce);
        })
      }
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${
        active ? "bg-amber-50 text-amber-500" : "bg-slate-50 text-slate-400 hover:text-amber-500"
      }`}
    >
      <Icone nom="etoile" plein={active} className="h-6 w-6" />
    </button>
  );
}

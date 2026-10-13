"use client";

import { useState } from "react";
import type { Categorie } from "@/lib/pme/session";
import { ajouterOperation } from "./actions";
import FormulaireOperation from "./FormulaireOperation";

/** Deux gros boutons qui ouvrent le formulaire avec le bon type déjà choisi. */
export default function AjoutOperation({
  categories,
  dateDuJour,
  ouvertSur,
}: {
  categories: Categorie[];
  dateDuJour: string;
  ouvertSur: "recu" | "depense" | null;
}) {
  const [type, setType] = useState(ouvertSur);

  if (type) {
    return (
      <div className="space-y-3">
        <FormulaireOperation
          key={type}
          action={ajouterOperation}
          categories={categories}
          typeInitial={type}
          dateDuJour={dateDuJour}
        />
        <button
          type="button"
          onClick={() => setType(null)}
          className="min-h-12 w-full text-base font-semibold text-slate-600 underline"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => setType("recu")}
        className="min-h-16 rounded-2xl bg-agri px-3 text-lg font-black text-white hover:bg-agri-fonce"
      >
        + Argent reçu
      </button>
      <button
        type="button"
        onClick={() => setType("depense")}
        className="min-h-16 rounded-2xl bg-red-600 px-3 text-lg font-black text-white hover:bg-red-700"
      >
        − Argent dépensé
      </button>
    </div>
  );
}

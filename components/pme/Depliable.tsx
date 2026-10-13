"use client";

import { useState } from "react";
import { boutonSecondaire } from "./styles";

/** Bouton qui affiche ou masque un bloc (formulaire d'ajout, de modification…). */
export default function Depliable({
  libelle,
  ouvert = false,
  classeBouton = boutonSecondaire,
  children,
}: {
  libelle: string;
  ouvert?: boolean;
  classeBouton?: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(ouvert);

  if (!visible) {
    return (
      <button type="button" onClick={() => setVisible(true)} className={classeBouton}>
        {libelle}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {children}
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="min-h-12 w-full text-base font-semibold text-slate-600 underline"
      >
        Fermer
      </button>
    </div>
  );
}

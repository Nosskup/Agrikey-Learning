"use client";

import { useTransition } from "react";

/** Bouton qui demande confirmation avant d'appeler une action de suppression. */
export default function BoutonSupprimer({
  action,
  question,
  libelle = "Supprimer",
  className = "",
}: {
  action: () => Promise<void>;
  question: string;
  libelle?: string;
  className?: string;
}) {
  const [enCours, demarrer] = useTransition();

  return (
    <button
      type="button"
      disabled={enCours}
      onClick={() => {
        if (window.confirm(question)) {
          demarrer(() => action());
        }
      }}
      className={`flex min-h-12 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-base font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 ${className}`}
    >
      {enCours ? "Suppression…" : libelle}
    </button>
  );
}

"use client";

import { boutonPrincipal } from "./styles";

/** Ouvre l'impression du navigateur (« Enregistrer au format PDF »). */
export default function BoutonImprimer({ libelle = "📄 Télécharger en PDF" }: { libelle?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={boutonPrincipal}>
      {libelle}
    </button>
  );
}

import type { EtatFormulaire } from "@/app/pme/actions";

/** Affiche l'erreur ou la confirmation renvoyée par une action. */
export default function Message({ etat }: { etat: EtatFormulaire }) {
  if (etat.erreur) {
    return (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-700">
        {etat.erreur}
      </p>
    );
  }

  if (etat.succes) {
    return (
      <p role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-base font-semibold text-agri-fonce">
        {etat.succes}
      </p>
    );
  }

  return null;
}

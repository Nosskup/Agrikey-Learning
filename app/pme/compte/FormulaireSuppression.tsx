"use client";

import { supprimerDonneesPme } from "./actions";
import { useFormulaire } from "@/components/pme/useFormulaire";
import Message from "@/components/pme/Message";
import { champ, etiquette } from "@/components/pme/styles";

export default function FormulaireSuppression() {
  const { etat, enCours, proprietes } = useFormulaire(supprimerDonneesPme);

  return (
    <form {...proprietes} className="space-y-3">
      <div>
        <label htmlFor="confirmation" className={etiquette}>
          Pour confirmer, écrivez SUPPRIMER
        </label>
        <input id="confirmation" name="confirmation" required autoComplete="off" autoCapitalize="characters" className={champ} />
      </div>
      <Message etat={etat} />
      <button
        type="submit"
        disabled={enCours}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-red-700 px-5 text-base font-bold text-white hover:bg-red-800 disabled:opacity-60"
      >
        {enCours ? "Suppression…" : "Supprimer définitivement mes données"}
      </button>
    </form>
  );
}

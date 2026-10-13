"use client";

import type { EtatFormulaire } from "../actions";
import type { Projet } from "@/lib/pme/session";
import Message from "@/components/pme/Message";
import { useFormulaire } from "@/components/pme/useFormulaire";
import { boutonPrincipal, champ, etiquette } from "@/components/pme/styles";

type Action = (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;

export default function FormulaireProjet({ action, projet }: { action: Action; projet?: Projet }) {
  const { etat, enCours, proprietes } = useFormulaire(action);

  return (
    <form {...proprietes} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <label htmlFor="nom" className={etiquette}>
          Nom du projet
        </label>
        <input
          id="nom"
          name="nom"
          required
          maxLength={120}
          autoFocus={!projet}
          defaultValue={projet?.nom}
          placeholder="Ex. : Ouverture de la 2e boutique"
          className={champ}
        />
      </div>

      <div>
        <label htmlFor="description" className={etiquette}>
          Description courte (facultatif)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={500}
          defaultValue={projet?.description ?? ""}
          className={champ}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="date_debut" className={etiquette}>
            Début
          </label>
          <input id="date_debut" name="date_debut" type="date" defaultValue={projet?.date_debut ?? ""} className={champ} />
        </div>
        <div>
          <label htmlFor="date_fin" className={etiquette}>
            Fin
          </label>
          <input id="date_fin" name="date_fin" type="date" defaultValue={projet?.date_fin ?? ""} className={champ} />
        </div>
      </div>

      <Message etat={etat} />

      <button type="submit" disabled={enCours} className={boutonPrincipal}>
        {enCours ? "Enregistrement…" : projet ? "Enregistrer le projet" : "Créer le projet"}
      </button>
    </form>
  );
}

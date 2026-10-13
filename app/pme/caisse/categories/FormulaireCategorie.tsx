"use client";

import { useFormulaire } from "@/components/pme/useFormulaire";
import type { EtatFormulaire } from "../../actions";
import type { Categorie } from "@/lib/pme/session";
import Message from "@/components/pme/Message";
import { boutonPrincipal, champ } from "@/components/pme/styles";

type Action = (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;

export default function FormulaireCategorie({
  action: actionServeur,
  categorie,
  libelleBouton,
  viderSiSucces = false,
}: {
  action: Action;
  categorie?: Categorie;
  libelleBouton: string;
  viderSiSucces?: boolean;
}) {
  const { etat, enCours, proprietes } = useFormulaire(actionServeur, { viderSiSucces });
  const prefixe = categorie?.id ?? "nouvelle";

  return (
    <form
      {...proprietes}
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label htmlFor={`nom-${prefixe}`} className="sr-only">
          Nom de la catégorie
        </label>
        <input
          id={`nom-${prefixe}`}
          name="nom"
          required
          maxLength={60}
          defaultValue={categorie?.nom}
          placeholder="Ex. : Carburant"
          className={champ}
        />
        <label htmlFor={`type-${prefixe}`} className="sr-only">
          Type
        </label>
        <select id={`type-${prefixe}`} name="type" defaultValue={categorie?.type ?? "depense"} className={champ}>
          <option value="recu">Argent reçu</option>
          <option value="depense">Argent dépensé</option>
          <option value="tous">Les deux</option>
        </select>
      </div>
      <Message etat={etat} />
      <button type="submit" disabled={enCours} className={boutonPrincipal}>
        {enCours ? "Un instant…" : libelleBouton}
      </button>
    </form>
  );
}

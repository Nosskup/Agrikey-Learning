"use client";

import { creerEntreprise } from "../actions";
import { useFormulaire } from "@/components/pme/useFormulaire";
import Message from "@/components/pme/Message";
import { boutonPrincipal, champ, etiquette } from "@/components/pme/styles";

export default function FormulaireBienvenue({ nomPropose }: { nomPropose: string }) {
  const { etat, enCours, proprietes } = useFormulaire(creerEntreprise);

  return (
    <form {...proprietes} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <label htmlFor="nom" className={etiquette}>
          Nom de votre entreprise
        </label>
        <input
          id="nom"
          name="nom"
          required
          maxLength={120}
          defaultValue={nomPropose}
          autoComplete="organization"
          placeholder="Ex. : Boutique Diallo"
          className={champ}
        />
      </div>

      <Message etat={etat} />

      <button type="submit" disabled={enCours} className={boutonPrincipal}>
        {enCours ? "Enregistrement…" : "Commencer"}
      </button>
    </form>
  );
}

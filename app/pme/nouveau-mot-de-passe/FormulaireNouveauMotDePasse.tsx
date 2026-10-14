"use client";

import { changerMotDePasse } from "../actions";
import { useFormulaire } from "@/components/pme/useFormulaire";
import Message from "@/components/pme/Message";
import { boutonPrincipal, champ, etiquette } from "@/components/pme/styles";

export default function FormulaireNouveauMotDePasse() {
  const { etat, enCours, proprietes } = useFormulaire(changerMotDePasse);

  return (
    <form {...proprietes} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <label htmlFor="mot_de_passe" className={etiquette}>
          Nouveau mot de passe
        </label>
        <input id="mot_de_passe" name="mot_de_passe" type="password" required minLength={6} autoComplete="new-password" placeholder="Au moins 6 caractères" className={champ} />
      </div>
      <div>
        <label htmlFor="confirmation" className={etiquette}>
          Retapez le mot de passe
        </label>
        <input id="confirmation" name="confirmation" type="password" required minLength={6} autoComplete="new-password" className={champ} />
      </div>
      <Message etat={etat} />
      <button type="submit" disabled={enCours} className={boutonPrincipal}>
        {enCours ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </button>
    </form>
  );
}

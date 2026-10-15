"use client";

import { creerCode } from "./actions";
import { useFormulaire } from "@/components/pme/useFormulaire";
import Message from "@/components/pme/Message";
import { boutonPrincipal, champ, etiquette } from "@/components/pme/styles";

export default function FormulaireCode() {
  const { etat, enCours, proprietes } = useFormulaire(creerCode, { viderSiSucces: true });

  return (
    <form {...proprietes} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="code" className={etiquette}>
            Code
          </label>
          <input id="code" name="code" required maxLength={20} autoCapitalize="characters" placeholder="Ex. : LIGUE" className={`${champ} uppercase`} />
        </div>
        <div>
          <label htmlFor="max_inscriptions" className={etiquette}>
            Maximum d&apos;inscriptions (facultatif)
          </label>
          <input id="max_inscriptions" name="max_inscriptions" inputMode="numeric" placeholder="Illimité" className={champ} />
        </div>
      </div>
      <div>
        <label htmlFor="libelle" className={etiquette}>
          Organisation
        </label>
        <input id="libelle" name="libelle" maxLength={120} placeholder="Ex. : Ligue des jeunes entrepreneurs du Mali" className={champ} />
      </div>
      <Message etat={etat} />
      <button type="submit" disabled={enCours} className={boutonPrincipal}>
        {enCours ? "Création…" : "Créer le code"}
      </button>
    </form>
  );
}

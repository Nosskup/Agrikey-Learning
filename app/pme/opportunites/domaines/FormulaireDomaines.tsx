"use client";

import { useActionState } from "react";
import type { EtatFormulaire } from "../../actions";
import { enregistrerDomaines } from "../actions";
import { DOMAINES } from "@/lib/opportunites/domaines";
import Message from "@/components/pme/Message";
import { boutonPrincipal, champ, etiquette } from "@/components/pme/styles";

export default function FormulaireDomaines({ domaines, motsCles }: { domaines: string[]; motsCles: string }) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(enregistrerDomaines, {});

  return (
    <form action={action} className="space-y-5">
      <fieldset className="space-y-2">
        <legend className={etiquette}>Cochez les domaines qui vous intéressent</legend>
        {DOMAINES.map((d) => (
          <label
            key={d.code}
            className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 has-[:checked]:border-agri has-[:checked]:bg-green-50"
          >
            <input type="checkbox" name="domaines" value={d.code} defaultChecked={domaines.includes(d.code)} className="h-6 w-6 accent-agri" />
            <span aria-hidden="true" className="text-2xl">
              {d.icone}
            </span>
            <span className="text-base font-semibold text-slate-800">{d.libelle}</span>
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="mots_cles" className={etiquette}>
          Mots-clés en plus (facultatif)
        </label>
        <input
          id="mots_cles"
          name="mots_cles"
          defaultValue={motsCles}
          maxLength={200}
          placeholder="Ex. riz, karité, Sikasso"
          className={champ}
        />
        <p className="mt-1 text-base text-slate-500">Séparez les mots par des virgules.</p>
      </div>

      <Message etat={etat} />

      <button type="submit" disabled={enCours} className={boutonPrincipal}>
        {enCours ? "Enregistrement…" : "Enregistrer mes domaines"}
      </button>
    </form>
  );
}

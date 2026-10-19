"use client";

import { useActionState } from "react";
import type { EtatFormulaire } from "../../actions";
import { enregistrerDomaines } from "../actions";
import { DOMAINES } from "@/lib/opportunites/domaines";
import Message from "@/components/pme/Message";
import Icone from "@/components/pme/Icones";
import { boutonPrincipal, champ, etiquette } from "@/components/pme/styles";

export default function FormulaireDomaines({ domaines, motsCles }: { domaines: string[]; motsCles: string }) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(enregistrerDomaines, {});

  return (
    <form action={action} className="space-y-5">
      <fieldset>
        <legend className={etiquette}>Touchez les domaines qui vous intéressent</legend>
        <div className="grid grid-cols-2 gap-3">
          {DOMAINES.map((d) => (
            <label
              key={d.code}
              className="relative flex min-h-28 cursor-pointer flex-col justify-between gap-2 rounded-3xl border-2 border-transparent bg-white p-4 shadow-[0_2px_12px_rgba(15,42,68,0.06)] transition has-[:checked]:border-agri has-[:checked]:bg-green-50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-green-100"
            >
              <input type="checkbox" name="domaines" value={d.code} defaultChecked={domaines.includes(d.code)} className="peer sr-only" />
              <span aria-hidden="true" className="text-3xl">
                {d.icone}
              </span>
              <span className="text-base leading-snug font-bold text-marine">{d.libelle}</span>
              <span className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-200 text-transparent peer-checked:border-agri peer-checked:bg-agri peer-checked:text-white">
                <Icone nom="verifie" className="h-4 w-4" />
              </span>
            </label>
          ))}
        </div>
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

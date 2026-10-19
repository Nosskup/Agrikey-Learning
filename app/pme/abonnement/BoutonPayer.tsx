"use client";

import { useActionState } from "react";
import type { EtatFormulaire } from "../actions";
import { payerAbonnement } from "./actions";
import Message from "@/components/pme/Message";
import { boutonPrincipal, boutonSecondaire } from "@/components/pme/styles";

export default function BoutonPayer({ formule, libelle, principal }: { formule: string; libelle: string; principal: boolean }) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(payerAbonnement, {});

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="formule" value={formule} />
      <Message etat={etat} />
      <button type="submit" disabled={enCours} className={principal ? boutonPrincipal : boutonSecondaire}>
        {enCours ? "Ouverture de PayDunya…" : libelle}
      </button>
    </form>
  );
}

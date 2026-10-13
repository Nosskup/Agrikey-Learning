"use client";

import { useActionState } from "react";
import { rejoindreListeAttente, type EtatFormulaire } from "../actions";
import Message from "@/components/pme/Message";
import { boutonPrincipal } from "@/components/pme/styles";

export default function BoutonMePrevenir({ dejaInscrit }: { dejaInscrit: boolean }) {
  const [etat, action, enCours] = useActionState<EtatFormulaire>(rejoindreListeAttente, {});

  if (dejaInscrit && !etat.succes) {
    return <Message etat={{ succes: "Vous êtes déjà sur la liste : nous vous préviendrons par e-mail." }} />;
  }

  return (
    <form action={action} className="space-y-3">
      <Message etat={etat} />
      {!etat.succes && (
        <button type="submit" disabled={enCours} className={boutonPrincipal}>
          {enCours ? "Un instant…" : "🔔 Me prévenir"}
        </button>
      )}
    </form>
  );
}

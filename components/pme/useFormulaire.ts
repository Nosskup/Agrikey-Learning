"use client";

import { startTransition, useActionState, useRef, type FormEvent } from "react";
import type { EtatFormulaire } from "@/app/pme/actions";

type Action = (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;

/**
 * Envoie un formulaire à une action serveur en gardant la saisie affichée
 * en cas d'erreur (React vide sinon le formulaire après chaque envoi).
 * Avec `viderSiSucces`, le formulaire est vidé après un enregistrement réussi.
 */
export function useFormulaire(actionServeur: Action, { viderSiSucces = false } = {}) {
  const ref = useRef<HTMLFormElement>(null);

  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(
    async (precedent, formData) => {
      const resultat = await actionServeur(precedent, formData);
      if (resultat.succes && viderSiSucces) ref.current?.reset();
      return resultat;
    },
    {}
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return { etat, enCours, proprietes: { ref, onSubmit } };
}

"use client";

import Link from "next/link";
import { demanderReinitialisation } from "../actions";
import { useFormulaire } from "@/components/pme/useFormulaire";
import Message from "@/components/pme/Message";
import { boutonPrincipal, champ, etiquette } from "@/components/pme/styles";

export default function MotDePasseOubliePage() {
  const { etat, enCours, proprietes } = useFormulaire(demanderReinitialisation);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-marine">Mot de passe oublié</h1>
        <p className="mt-2 text-base text-slate-600">
          Écrivez l&apos;adresse e-mail de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe.
        </p>
      </div>

      {etat.succes ? (
        <Message etat={etat} />
      ) : (
        <form {...proprietes} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <label htmlFor="email" className={etiquette}>
              Adresse e-mail
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="nom@gmail.com" className={champ} />
          </div>
          <Message etat={etat} />
          <button type="submit" disabled={enCours} className={boutonPrincipal}>
            {enCours ? "Envoi…" : "Recevoir le lien"}
          </button>
        </form>
      )}

      <p className="text-center text-base">
        <Link href="/pme/connexion" className="font-semibold text-marine underline">
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  );
}

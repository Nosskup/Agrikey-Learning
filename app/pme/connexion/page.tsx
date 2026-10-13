"use client";

import Link from "next/link";
import { connecter } from "../actions";
import { useFormulaire } from "@/components/pme/useFormulaire";
import Message from "@/components/pme/Message";
import { boutonPrincipal, champ, etiquette } from "@/components/pme/styles";

export default function ConnexionPme() {
  const { etat, enCours, proprietes } = useFormulaire(connecter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-marine">Connexion</h1>
        <p className="mt-2 text-base text-slate-600">Retrouvez votre caisse, vos projets et vos documents.</p>
      </div>

      <form {...proprietes} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <label htmlFor="email" className={etiquette}>
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="nom@gmail.com"
            className={champ}
          />
        </div>

        <div>
          <label htmlFor="mot_de_passe" className={etiquette}>
            Mot de passe
          </label>
          <input
            id="mot_de_passe"
            name="mot_de_passe"
            type="password"
            required
            autoComplete="current-password"
            className={champ}
          />
        </div>

        <Message etat={etat} />

        <button type="submit" disabled={enCours} className={boutonPrincipal}>
          {enCours ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <div className="space-y-3 text-center text-base text-slate-600">
        <p>
          Pas encore de compte ?{" "}
          <Link href="/pme/inscription" className="font-bold text-agri underline">
            Créer un compte
          </Link>
        </p>
        <p>
          <Link href="/mot-de-passe-oublie" className="font-semibold text-marine underline">
            Mot de passe oublié ?
          </Link>
        </p>
      </div>
    </div>
  );
}

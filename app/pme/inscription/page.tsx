"use client";

import Link from "next/link";
import { useActionState } from "react";
import { inscrire, type EtatFormulaire } from "../actions";
import Message from "@/components/pme/Message";
import { boutonPrincipal, champ, etiquette } from "@/components/pme/styles";

export default function InscriptionPme() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(inscrire, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-marine">Créez votre compte</h1>
        <p className="mt-2 text-base text-slate-600">
          Gratuit. Gérez votre caisse, vos projets et vos documents depuis votre téléphone.
        </p>
      </div>

      {etat.succes ? (
        <Message etat={etat} />
      ) : (
        <form action={action} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <label htmlFor="nom_entreprise" className={etiquette}>
              Nom de votre entreprise
            </label>
            <input
              id="nom_entreprise"
              name="nom_entreprise"
              required
              maxLength={120}
              autoComplete="organization"
              placeholder="Ex. : Boutique Diallo"
              className={champ}
            />
          </div>

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
              minLength={6}
              autoComplete="new-password"
              placeholder="Au moins 6 caractères"
              className={champ}
            />
          </div>

          <Message etat={etat} />

          <button type="submit" disabled={enCours} className={boutonPrincipal}>
            {enCours ? "Création en cours…" : "Créer mon compte"}
          </button>
        </form>
      )}

      <p className="text-center text-base text-slate-600">
        Déjà un compte ?{" "}
        <Link href="/pme/connexion" className="font-bold text-agri underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

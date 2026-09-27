"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErreur("");

    if (!email.trim()) {
      setErreur("Veuillez renseigner votre adresse e-mail.");
      return;
    }

    try {
      setChargement(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
        }
      );

      if (error) {
        throw error;
      }

      setSucces(true);
    } catch (err: any) {
      console.error("Erreur réinitialisation :", err);

      setErreur(
        err?.message ||
          "Impossible d'envoyer l'e-mail de réinitialisation."
      );
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg sm:p-9">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-2xl font-black text-white shadow-sm">
              A
            </div>

            <h1 className="mt-5 text-3xl font-black text-slate-950">
              Mot de passe oublié
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Indiquez votre adresse e-mail, nous vous envoyons un
              lien pour créer un nouveau mot de passe.
            </p>
          </div>

          {succes ? (
            <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold leading-6 text-green-800">
                Si un compte existe avec cette adresse, un e-mail
                contenant un lien de réinitialisation vient d'être
                envoyé. Pensez à vérifier vos spams.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Adresse e-mail
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </div>

              {erreur && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold leading-6 text-red-700">
                    {erreur}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={chargement}
                className="w-full rounded-xl bg-green-700 px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {chargement
                  ? "Envoi en cours..."
                  : "Envoyer le lien de réinitialisation"}
              </button>
            </form>
          )}

          <div className="mt-7 text-center">
            <Link
              href="/connexion"
              className="text-sm font-bold text-green-700 hover:text-green-800"
            >
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
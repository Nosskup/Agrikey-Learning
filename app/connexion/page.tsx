"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function Connexion() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function handleConnexion(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErreur("");
    setChargement(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErreur(
        "Adresse e-mail ou mot de passe incorrect."
      );
      setChargement(false);
      return;
    }

    router.push("/mon-espace");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* Contenu principal */}
      <section className="px-6 py-12 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">

          {/* Présentation */}
          <div className="hidden lg:block">
            <div className="max-w-xl">

              <span className="inline-flex rounded-full bg-green-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-green-700">
                AGRIKEY Learning
              </span>

              <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-slate-950">
                Développez vos compétences,
                <span className="text-green-700">
                  {" "}à votre rythme.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
                Connectez-vous à votre espace pour retrouver
                vos formations, suivre votre progression et
                continuer votre apprentissage.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Retrouvez vos formations",
                  "Suivez votre progression",
                  "Accédez à vos quiz et certificats",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-black text-green-700">
                      ✓
                    </span>

                    <span className="font-semibold text-slate-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Formulaire */}
          <div className="mx-auto w-full max-w-md">

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg sm:p-9">

              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-2xl font-black text-white shadow-sm">
                  A
                </div>

                <h2 className="mt-5 text-3xl font-black text-slate-950">
                  Se connecter
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Accédez à votre espace de formation.
                </p>
              </div>

              <form
                onSubmit={handleConnexion}
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

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-bold text-slate-700"
                    >
                      Mot de passe
                    </label>

                    <Link
                      href="/mot-de-passe-oublie"
                      className="text-sm font-semibold text-green-700 hover:text-green-800 hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  <input
                    id="password"
                    type="password"
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
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
                    ? "Connexion en cours..."
                    : "Se connecter"}
                </button>

              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400">
                  OU
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-500">
                  Vous n'avez pas encore de compte ?
                </p>

                <Link
                  href="/inscription"
                  className="mt-2 inline-block text-sm font-bold text-green-700 hover:text-green-800"
                >
                  Créer un compte →
                </Link>
              </div>

            </div>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              En vous connectant, vous accédez à votre espace
              personnel AGRIKEY Learning.
            </p>

          </div>
        </div>
      </section>
    </main>
  );
}
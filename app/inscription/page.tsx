"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function InscriptionPage() {
  const router = useRouter();

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!prenom.trim() || !nom.trim()) {
      setError("Veuillez renseigner votre prénom et votre nom.");
      return;
    }

    if (!email.trim()) {
      setError("Veuillez renseigner votre adresse e-mail.");
      return;
    }

    if (motDePasse.length < 6) {
      setError(
        "Le mot de passe doit contenir au moins 6 caractères."
      );
      return;
    }

    if (motDePasse !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);

      const nomComplet = `${prenom.trim()} ${nom.trim()}`;

      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password: motDePasse,
          options: {
            data: {
              full_name: nomComplet,
              first_name: prenom.trim(),
              last_name: nom.trim(),
            },
          },
        });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        router.push("/mon-espace");
        return;
      }

      setSuccess(
        "Votre compte a été créé. Vérifiez votre adresse e-mail si une confirmation vous est demandée."
      );

      setPrenom("");
      setNom("");
      setEmail("");
      setMotDePasse("");
      setConfirmation("");
    } catch (err: any) {
      console.error("ERREUR INSCRIPTION :", err);

      if (
        err?.message?.toLowerCase().includes("already registered")
      ) {
        setError(
          "Cette adresse e-mail est déjà utilisée. Essayez de vous connecter."
        );
      } else {
        setError(
          err?.message ||
            "Impossible de créer votre compte. Veuillez réessayer."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* CÔTÉ GAUCHE */}
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 lg:flex">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-green-400/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            <Link href="/" className="inline-block">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-1">
                  <img
                    src="/images/logo-emblem.png"
                    alt="AGRIKEY Learning"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <div className="text-2xl font-black text-white">
                    AGRIKEY
                  </div>

                  <div className="text-sm font-medium text-green-200">
                    Learning
                  </div>
                </div>
              </div>
            </Link>

            <div className="max-w-xl">
              <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-green-200">
                Bienvenue sur AGRIKEY Learning
              </p>

              <h1 className="text-4xl font-black leading-tight text-white xl:text-5xl">
                Développez les compétences
                <span className="block text-green-200">
                  dont vous avez besoin.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-green-50/90">
                Accédez à des formations pratiques, apprenez à votre
                rythme et progressez avec un parcours structuré.
              </p>

              <div className="mt-10 space-y-5">

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg text-white">
                    ✓
                  </div>

                  <div>
                    <h2 className="font-bold text-white">
                      Des formations pratiques
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-green-100/80">
                      Des contenus conçus pour être compris et
                      directement appliqués.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg text-white">
                    ✓
                  </div>

                  <div>
                    <h2 className="font-bold text-white">
                      Apprenez à votre rythme
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-green-100/80">
                      Avancez progressivement selon votre disponibilité.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg text-white">
                    ✓
                  </div>

                  <div>
                    <h2 className="font-bold text-white">
                      Suivez votre progression
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-green-100/80">
                      Leçons, quiz, progression et certificat au même
                      endroit.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <p className="text-sm text-green-100/70">
              Apprendre · progresser · entreprendre
            </p>
          </div>
        </section>

        {/* CÔTÉ DROIT */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-lg">

            {/* Logo mobile */}
            <div className="mb-10 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <img
                  src="/images/logo-emblem.png"
                  alt="AGRIKEY Learning"
                  className="h-12 w-12 object-contain"
                />

                <div>
                  <div className="text-xl font-black text-slate-900">
                    AGRIKEY
                  </div>

                  <div className="text-xs font-medium text-green-600">
                    Learning
                  </div>
                </div>
              </Link>
            </div>

            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
                Créer un compte
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Commencez votre parcours.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Créez votre compte gratuitement pour accéder à vos
                formations et suivre votre progression.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">

              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-800">
                  {success}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>
                    <label
                      htmlFor="prenom"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Prénom
                    </label>

                    <input
                      id="prenom"
                      type="text"
                      value={prenom}
                      onChange={(event) =>
                        setPrenom(event.target.value)
                      }
                      placeholder="Votre prénom"
                      autoComplete="given-name"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-100"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="nom"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Nom
                    </label>

                    <input
                      id="nom"
                      type="text"
                      value={nom}
                      onChange={(event) =>
                        setNom(event.target.value)
                      }
                      placeholder="Votre nom"
                      autoComplete="family-name"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-100"
                      required
                    />
                  </div>

                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Adresse e-mail
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-100"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Mot de passe
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={motDePasse}
                    onChange={(event) =>
                      setMotDePasse(event.target.value)
                    }
                    placeholder="Au moins 6 caractères"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-100"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmation"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirmer le mot de passe
                  </label>

                  <input
                    id="confirmation"
                    type="password"
                    value={confirmation}
                    onChange={(event) =>
                      setConfirmation(event.target.value)
                    }
                    placeholder="Retapez votre mot de passe"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-100"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-green-700 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-green-700/20 transition hover:bg-green-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Création du compte..."
                    : "Créer mon compte"}
                </button>

              </form>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">
                  ou
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <p className="text-center text-sm text-slate-500">
                Vous avez déjà un compte ?{" "}
                <Link
                  href="/connexion"
                  className="font-bold text-green-700 hover:text-green-800 hover:underline"
                >
                  Se connecter
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              En créant votre compte, vous pourrez accéder à vos
              formations et suivre votre progression sur AGRIKEY Learning.
            </p>

          </div>
        </section>
      </div>
    </main>
  );
}
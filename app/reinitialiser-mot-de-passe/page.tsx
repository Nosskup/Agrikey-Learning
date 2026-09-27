"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ReinitialiserMotDePasse() {
  const router = useRouter();

  const [pretPourReinitialisation, setPretPourReinitialisation] =
    useState(false);
  const [verificationEnCours, setVerificationEnCours] =
    useState(true);

  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    // Le clic sur le lien reçu par e-mail crée une session
    // temporaire de type "recovery". Supabase déclenche alors
    // l'événement PASSWORD_RECOVERY.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPretPourReinitialisation(true);
        setVerificationEnCours(false);
      }
    });

    // Filet de sécurité : si l'événement a déjà été émis avant
    // que ce composant ne s'abonne, on vérifie la session actuelle.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPretPourReinitialisation(true);
      }
      setVerificationEnCours(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErreur("");

    if (motDePasse.length < 6) {
      setErreur(
        "Le mot de passe doit contenir au moins 6 caractères."
      );
      return;
    }

    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    try {
      setChargement(true);

      const { error } = await supabase.auth.updateUser({
        password: motDePasse,
      });

      if (error) {
        throw error;
      }

      setSucces(true);

      setTimeout(() => {
        router.push("/mon-espace");
      }, 2000);
    } catch (err: any) {
      console.error("Erreur mise à jour mot de passe :", err);

      setErreur(
        err?.message ||
          "Impossible de mettre à jour le mot de passe."
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
              Nouveau mot de passe
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Choisissez votre nouveau mot de passe.
            </p>
          </div>

          {verificationEnCours && (
            <p className="mt-8 text-center text-sm text-slate-500">
              Vérification du lien...
            </p>
          )}

          {!verificationEnCours &&
            !pretPourReinitialisation &&
            !succes && (
              <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold leading-6 text-red-700">
                  Ce lien de réinitialisation est invalide ou a
                  expiré. Refaites une demande depuis la page
                  "Mot de passe oublié".
                </p>
              </div>
            )}

          {succes && (
            <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold leading-6 text-green-800">
                Votre mot de passe a été mis à jour. Redirection
                vers votre espace...
              </p>
            </div>
          )}

          {pretPourReinitialisation && !succes && (
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <div>
                <label
                  htmlFor="motDePasse"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Nouveau mot de passe
                </label>

                <input
                  id="motDePasse"
                  type="password"
                  placeholder="Au moins 6 caractères"
                  value={motDePasse}
                  onChange={(event) =>
                    setMotDePasse(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmation"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Confirmer le mot de passe
                </label>

                <input
                  id="confirmation"
                  type="password"
                  placeholder="Retapez le mot de passe"
                  value={confirmation}
                  onChange={(event) =>
                    setConfirmation(event.target.value)
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
                  ? "Mise à jour..."
                  : "Mettre à jour le mot de passe"}
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
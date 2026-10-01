"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Formation = {
  id: number;
  title: string;
  price: number;
};

const moyensPaiement = [
  {
    id: "paydunya",
    nom: "Paiement mobile / carte",
    description:
      "Orange Money, Moov Money, carte bancaire (via PayDunya)",
    disponible: true,
    symbole: "PD",
  },
];

function PaiementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get("courseId");

  const [formation, setFormation] =
    useState<Formation | null>(null);

  const [methode, setMethode] = useState("");

  const [chargement, setChargement] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [traitement, setTraitement] =
    useState(false);

  useEffect(() => {
    async function chargerPaiement() {
      const { data: userData } =
        await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/connexion");
        return;
      }

      const courseId = Number(courseIdParam);

      if (!courseIdParam || Number.isNaN(courseId)) {
        setMessage(
          "Aucune formation sélectionnée. Repartez du catalogue pour choisir une formation à acheter."
        );
        setChargement(false);
        return;
      }

      const {
        data: formationData,
        error: formationError,
      } = await supabase
        .from("courses")
        .select("id, title, price")
        .eq("id", courseId)
        .single();

      if (
        formationError ||
        !formationData
      ) {
        setMessage(
          "Impossible de trouver cette formation."
        );
        setChargement(false);
        return;
      }

      setFormation(formationData);
      setChargement(false);
    }

    chargerPaiement();
  }, [router, courseIdParam]);

  function choisirMethode(nom: string) {
    const moyen = moyensPaiement.find(
      (item) => item.id === nom
    );

    if (!moyen?.disponible) {
      setMethode("");
      setMessage(
        "Ce moyen de paiement sera bientôt disponible."
      );
      return;
    }

    setMethode(nom);
    setMessage("");
  }

  async function continuerPaiement() {
    setMessage("");

    if (!methode) {
      setMessage(
        "Veuillez choisir un moyen de paiement."
      );
      return;
    }

    if (!formation) {
      setMessage(
        "Formation introuvable."
      );
      return;
    }

    const moyen = moyensPaiement.find(
      (item) => item.id === methode
    );

    if (!moyen?.disponible) {
      setMessage(
        "Ce moyen de paiement sera bientôt disponible. Votre commande n'a pas été débitée."
      );
      return;
    }

    setTraitement(true);

    const { data: userData } =
      await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/connexion");
      setTraitement(false);
      return;
    }

    try {
      const reponse = await fetch(
        "/api/payments/create-invoice",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId: formation.id,
          }),
        }
      );

      const resultat = await reponse.json();

      if (!resultat.success) {
        setMessage(
          resultat.message ||
            "Impossible de créer le paiement."
        );

        setTraitement(false);
        return;
      }

      // Redirection vers la page de paiement PayDunya
      // (Orange Money, Moov Money, carte bancaire...).
      window.location.href = resultat.checkoutUrl;
    } catch (err) {
      setMessage(
        "Une erreur est survenue. Veuillez réessayer."
      );

      setTraitement(false);
    }
  }

  if (chargement) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="animate-pulse">
            <div className="h-5 w-32 rounded bg-slate-200" />
            <div className="mt-8 h-12 max-w-xl rounded bg-slate-200" />
            <div className="mt-4 h-5 max-w-md rounded bg-slate-200" />
            <div className="mt-10 h-80 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!formation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <h1 className="text-xl font-bold text-slate-900">
            Formation introuvable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {message ||
              "Impossible de charger cette formation."}
          </p>

          <Link
            href="/formations"
            className="mt-6 block w-full rounded-xl bg-green-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-800"
          >
            Retour au catalogue
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* En-tête */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <Link
            href={`/formations/${formation.id}`}
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Retour à la formation
          </Link>

          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-green-700">
              Paiement
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Finaliser votre inscription
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Choisissez votre moyen de paiement pour
              accéder à votre formation.
            </p>
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* Moyens de paiement */}
          <div className="space-y-6">

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-green-700">
                  Étape 1
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Choisissez votre moyen de paiement
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Paiement sécurisé via PayDunya.
                </p>
              </div>

              <div className="mt-7 space-y-3">

                {moyensPaiement.map(
                  (moyen) => {
                    const selected =
                      methode === moyen.id;

                    return (
                      <button
                        key={moyen.id}
                        type="button"
                        onClick={() =>
                          choisirMethode(
                            moyen.id
                          )
                        }
                        disabled={
                          !moyen.disponible
                        }
                        className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition ${
                          !moyen.disponible
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70"
                            : selected
                            ? "border-green-500 bg-green-50"
                            : "border-slate-200 bg-white hover:border-green-300 hover:bg-green-50/30"
                        }`}
                      >

                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                            selected
                              ? "bg-green-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {moyen.symbole}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block font-bold text-slate-900">
                            {moyen.nom}
                          </span>

                          <span className="mt-1 block text-sm text-slate-500">
                            {moyen.description}
                          </span>
                        </span>

                        <span className="shrink-0">
                          {moyen.disponible ? (
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                                selected
                                  ? "border-green-600 bg-green-600 text-xs text-white"
                                  : "border-slate-300"
                              }`}
                            >
                              {selected
                                ? "✓"
                                : ""}
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500">
                              Bientôt disponible
                            </span>
                          )}
                        </span>

                      </button>
                    );
                  }
                )}

              </div>

            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700">
                  i
                </span>

                <div>
                  <p className="font-bold text-blue-900">
                    Paiement sécurisé
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    Vous êtes redirigé vers PayDunya, notre
                    prestataire de paiement, pour saisir vos
                    informations. AGRIKEY n'a jamais accès à vos
                    identifiants de paiement.
                  </p>
                </div>
              </div>
            </div>

            {message && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-semibold leading-6 text-amber-800">
                  {message}
                </p>
              </div>
            )}

          </div>

          {/* Récapitulatif */}
          <aside className="lg:sticky lg:top-24 lg:self-start">

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="bg-slate-950 p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Récapitulatif
                </p>

                <h2 className="mt-3 text-xl font-black">
                  Votre commande
                </h2>
              </div>

              <div className="p-6">

                <div>
                  <p className="text-sm font-bold leading-6 text-slate-900">
                    {formation.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Formation en ligne
                  </p>
                </div>

                <div className="my-6 border-t border-slate-200" />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Prix
                  </span>

                  <span className="font-bold text-slate-900">
                    {formation.price.toLocaleString(
                      "fr-FR"
                    )}{" "}
                    FCFA
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    Total
                  </span>

                  <span className="text-2xl font-black text-green-700">
                    {formation.price.toLocaleString(
                      "fr-FR"
                    )}{" "}
                    FCFA
                  </span>
                </div>

                <button
                  type="button"
                  onClick={continuerPaiement}
                  disabled={
                    traitement ||
                    !methode ||
                    !moyensPaiement.find(
                      (item) =>
                        item.id === methode
                    )?.disponible
                  }
                  className="mt-7 w-full rounded-xl bg-green-700 px-5 py-4 text-sm font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {traitement
                    ? "Traitement..."
                    : "Continuer le paiement"}
                </button>

                <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                  Vous serez redirigé vers PayDunya pour finaliser
                  le paiement en toute sécurité.
                </p>

              </div>
            </div>

          </aside>

        </div>
      </section>

    </main>
  );
}

export default function Paiement() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="animate-pulse">
              <div className="h-5 w-32 rounded bg-slate-200" />
              <div className="mt-8 h-12 max-w-xl rounded bg-slate-200" />
            </div>
          </div>
        </main>
      }
    >
      <PaiementContent />
    </Suspense>
  );
}

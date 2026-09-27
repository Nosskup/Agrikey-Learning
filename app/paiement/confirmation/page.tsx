"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Statut = "verification" | "paye" | "attente" | "erreur";

function ConfirmationPaiementContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [statut, setStatut] = useState<Statut>("verification");
  const [essais, setEssais] = useState(0);

  useEffect(() => {
    let annule = false;

    async function verifier() {
      if (!courseId) {
        setStatut("erreur");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatut("erreur");
        return;
      }

      const { data: paiement } = await supabase
        .from("payments")
        .select("status")
        .eq("user_id", user.id)
        .eq("course_id", Number(courseId))
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (annule) return;

      if (paiement?.status === "paid") {
        setStatut("paye");
        return;
      }

      // Le webhook PayDunya peut mettre quelques secondes à
      // confirmer le paiement. On réessaie plusieurs fois avant
      // de dire à l'apprenant que c'est encore en cours.
      if (essais < 6) {
        setTimeout(() => {
          if (!annule) setEssais((n) => n + 1);
        }, 2500);
      } else {
        setStatut("attente");
      }
    }

    verifier();

    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, essais]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        {statut === "verification" && (
          <>
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-700" />

            <h1 className="text-xl font-bold text-slate-900">
              Vérification de votre paiement...
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Cela ne prend que quelques secondes.
            </p>
          </>
        )}

        {statut === "paye" && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
              ✓
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              Paiement confirmé !
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Votre inscription a été activée. Vous pouvez
              accéder à votre formation dès maintenant.
            </p>

            <Link
              href="/mon-espace"
              className="mt-6 block w-full rounded-xl bg-green-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-800"
            >
              Aller à mon espace
            </Link>
          </>
        )}

        {statut === "attente" && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-700">
              ⏳
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              Paiement en cours de traitement
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Votre paiement met un peu plus de temps que prévu à
              être confirmé. Vérifiez votre espace dans quelques
              minutes — l'accès s'active automatiquement dès que
              c'est bon.
            </p>

            <Link
              href="/mon-espace"
              className="mt-6 block w-full rounded-xl bg-green-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-800"
            >
              Aller à mon espace
            </Link>
          </>
        )}

        {statut === "erreur" && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-700">
              !
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              Impossible de vérifier le paiement
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Reconnectez-vous et consultez votre espace pour
              vérifier l'état de votre inscription.
            </p>

            <Link
              href="/mon-espace"
              className="mt-6 block w-full rounded-xl bg-green-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-800"
            >
              Aller à mon espace
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function ConfirmationPaiementPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">
            Chargement...
          </p>
        </main>
      }
    >
      <ConfirmationPaiementContent />
    </Suspense>
  );
}

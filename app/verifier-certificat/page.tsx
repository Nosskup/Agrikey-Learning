"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type VerificationResult = {
  valid: boolean;
  certificate_number?: string;
  learner_name?: string | null;
  course_title?: string;
  issued_at?: string;
};

function VerifyCertificateContent() {
  const searchParams = useSearchParams();

  const [certificateNumber, setCertificateNumber] = useState("");
  const [result, setResult] =
    useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function verifyCertificate(numberToVerify?: string) {
    setLoading(true);
    setError("");
    setResult(null);

    const number = (numberToVerify ?? certificateNumber).trim();

    if (!number) {
      setError("Veuillez saisir un numéro de certificat.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: verificationError } =
        await supabase.rpc("verify_certificate", {
          p_certificate_number: number,
        });

      if (verificationError) {
        throw verificationError;
      }

      setResult(data as VerificationResult);
    } catch (err: any) {
      console.error("Erreur vérification :", err);

      setError(
        err?.message ||
          "Une erreur est survenue pendant la vérification."
      );
    } finally {
      setLoading(false);
    }
  }

  // Récupère automatiquement le numéro depuis l'URL
  // (cas du scan du QR code sur le certificat) et lance
  // la vérification sans action de l'utilisateur.
  useEffect(() => {
    const numeroDepuisUrl = searchParams.get("numero");

    if (numeroDepuisUrl) {
      const numeroNettoye = numeroDepuisUrl.trim();
      setCertificateNumber(numeroNettoye);
      verifyCertificate(numeroNettoye);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const issuedDate = result?.issued_at
    ? new Date(result.issued_at).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-700">
            AGRIKEY
          </p>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Vérifier un certificat
          </h1>

          <p className="mt-3 text-gray-600">
            Entrez le numéro inscrit sur le certificat pour vérifier
            son authenticité.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <label
            htmlFor="certificateNumber"
            className="mb-2 block font-semibold text-gray-800"
          >
            Numéro du certificat
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="certificateNumber"
              type="text"
              value={certificateNumber}
              onChange={(event) =>
                setCertificateNumber(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  verifyCertificate();
                }
              }}
              placeholder="Ex. AGRIKEY-2-XXXXXXXX-2026"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />

            <button
              type="button"
              onClick={() => verifyCertificate()}
              disabled={loading}
              className="rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Vérification..." : "Vérifier"}
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6">
              {result.valid ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-xl text-white">
                      ✓
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-green-900">
                        Certificat authentique
                      </h2>

                      <p className="text-sm text-green-700">
                        Ce certificat a été délivré par AGRIKEY.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Titulaire
                      </p>

                      <p className="font-semibold text-gray-900">
                        {result.learner_name ||
                          "Apprenant AGRIKEY"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Formation
                      </p>

                      <p className="font-semibold text-gray-900">
                        {result.course_title}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Date d'obtention
                      </p>

                      <p className="font-semibold text-gray-900">
                        {issuedDate}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Numéro du certificat
                      </p>

                      <p className="break-all font-semibold text-gray-900">
                        {result.certificate_number}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                  <h2 className="text-xl font-bold text-red-900">
                    Certificat introuvable
                  </h2>

                  <p className="mt-2 text-red-700">
                    Aucun certificat AGRIKEY correspondant à ce
                    numéro n'a été trouvé.
                  </p>

                  <p className="mt-4 text-sm text-red-600">
                    Vérifiez le numéro saisi et réessayez.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/formations"
            className="text-sm font-semibold text-green-700 hover:underline"
          >
            Découvrir les formations AGRIKEY
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 px-4 py-12">
          <div className="mx-auto max-w-2xl text-center text-gray-500">
            Chargement...
          </div>
        </main>
      }
    >
      <VerifyCertificateContent />
    </Suspense>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";

type Certificate = {
  certificate_id: number;
  certificate_number: string;
  course_id: number;
  course_title: string;
  issued_at: string;
  already_exists: boolean;
};

type Profile = {
  full_name: string | null;
};

export default function CertificatePage() {
  const params = useParams();
  const courseId = Number(params.courseId);

  const [certificate, setCertificate] =
    useState<Certificate | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [qrCode, setQrCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCertificate();
  }, [courseId]);

  useEffect(() => {
    if (!certificate) return;

    const verificationUrl =
      `${window.location.origin}/verifier-certificat?numero=` +
      encodeURIComponent(certificate.certificate_number);

    QRCode.toDataURL(verificationUrl, {
      width: 220,
      margin: 2,
    })
      .then((url) => {
        setQrCode(url);
      })
      .catch((err) => {
        console.error("Erreur QR code :", err);
      });
  }, [certificate]);

  async function loadCertificate() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(
          "Vous devez être connecté pour accéder à votre certificat."
        );
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();

      if (profileError) {
        throw profileError;
      }

      setProfile(profileData);

      const { data: certificateData, error: certificateError } =
        await supabase.rpc("issue_course_certificate", {
          p_course_id: courseId,
        });

      if (certificateError) {
        throw certificateError;
      }

      setCertificate(certificateData as Certificate);
    } catch (err: any) {
      console.error("Erreur certificat :", err);

      setError(
        err?.message ||
          "Impossible de générer le certificat."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-5xl text-center">
          <p>Préparation de votre certificat...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Certificat indisponible
          </h1>

          <p className="mb-6 text-red-600">
            {error}
          </p>

          <Link
            href="/mon-espace"
            className="inline-block rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
          >
            Retour à mon espace
          </Link>
        </div>
      </main>
    );
  }

  if (!certificate) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-5xl text-center">
          <p>Certificat introuvable.</p>
        </div>
      </main>
    );
  }

  const learnerName =
    profile?.full_name || "Apprenant AGRIKEY";

  const issuedDate = new Date(
    certificate.issued_at
  ).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .certificate-page {
            min-height: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .certificate-container {
            box-shadow: none !important;
            max-width: none !important;
            width: 100% !important;
          }

          /*
            Filet de sécurité absolu : une hauteur fixe qui tient
            dans une page A4 paysage avec marges de 8mm (zone utile
            ≈ 194mm de haut), et overflow hidden pour qu'il soit
            structurellement impossible de déborder sur une 2e page,
            quoi qu'il arrive.
          */
          .certificate-frame {
            height: 182mm !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      <main className="certificate-page min-h-screen bg-gray-100 px-4 py-10">
        <div className="no-print mx-auto mb-6 flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/mon-espace"
            className="text-sm font-semibold text-green-700 hover:underline"
          >
            ← Retour à mon espace
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
          >
            Imprimer / Enregistrer en PDF
          </button>
        </div>

        <div className="certificate-container mx-auto max-w-6xl rounded-xl bg-white p-2 shadow-2xl">
          <div className="border-[6px] border-green-700 p-1">
            <div className="certificate-frame relative overflow-hidden border border-green-200 px-10 py-6 md:px-16">
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border-[30px] border-green-50" />

              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full border-[30px] border-green-50" />

              <div className="relative flex h-full flex-col items-center justify-center">
                <div className="w-full">

                {/* En-tête : logo + titre, en bandeau compact */}
                <div>
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src="/images/logo-emblem.png"
                      alt="AGRIKEY"
                      className="h-11 w-11 shrink-0 object-contain"
                    />

                    <div className="text-left">
                      <p className="text-xs font-bold uppercase tracking-[0.35em] text-green-700">
                        AGRIKEY
                      </p>

                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                        Plateforme de formation
                      </p>
                    </div>
                  </div>

                  <h1 className="mt-3 text-center text-2xl font-bold uppercase tracking-[0.1em] text-gray-900 md:text-3xl">
                    Certificat de réussite
                  </h1>

                  <div className="mx-auto mt-2 h-1 w-24 bg-green-700" />
                </div>

                {/* Corps : nom de l'apprenant et formation */}
                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500">
                    Certifie que
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-green-800 md:text-2xl">
                    {learnerName}
                  </h2>

                  <p className="mx-auto mt-1 max-w-2xl text-sm text-gray-600">
                    a terminé avec succès la formation
                  </p>

                  <h3 className="mx-auto mt-1 max-w-3xl text-lg font-bold text-gray-900 md:text-xl">
                    {certificate.course_title}
                  </h3>

                  <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-gray-500">
                    Ce certificat atteste de l'achèvement de la formation
                    conformément aux critères de validation établis par
                    AGRIKEY.
                  </p>
                </div>

                {/* Pied : infos condensées sur une ligne + signature/QR */}
                <div className="mt-8">
                  <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-gray-200 pt-3 text-xs text-gray-600">
                    <span>
                      <span className="text-gray-400">Date : </span>
                      <strong className="text-gray-900">
                        {issuedDate}
                      </strong>
                    </span>

                    <span className="text-gray-300">•</span>

                    <span>
                      <span className="text-gray-400">N° : </span>
                      <strong className="break-all text-gray-900">
                        {certificate.certificate_number}
                      </strong>
                    </span>

                    <span className="text-gray-300">•</span>

                    <span className="font-semibold text-green-700">
                      Certificat numérique vérifiable
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-8">
                    <div className="text-center">
                      <div className="mx-auto mb-1 h-px w-32 bg-gray-400" />

                      <p className="text-xs font-semibold text-gray-800">
                        AGRIKEY
                      </p>

                      <p className="text-[10px] text-gray-500">
                        Direction de la formation
                      </p>
                    </div>

                    <div className="flex flex-col items-center">
                      {qrCode ? (
                        <img
                          src={qrCode}
                          alt="QR code de vérification du certificat"
                          className="h-14 w-14"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-lg border border-gray-200 bg-gray-50" />
                      )}

                      <p className="mt-0.5 text-[9px] uppercase tracking-wide text-gray-500">
                        Scanner pour vérifier
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="mx-auto mb-1 h-px w-32 bg-gray-400" />

                      <p className="text-xs font-semibold text-gray-800">
                        Certificat numérique
                      </p>

                      <p className="text-[10px] text-gray-500">
                        Authentifiable en ligne
                      </p>
                    </div>
                  </div>
                </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

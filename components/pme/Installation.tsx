"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type EvenementInstallation = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const CLE_MASQUE = "agrikey-pme-installation-masquee";

/** Enregistre le service worker de l'espace PME (page hors ligne). */
export function EnregistrementApplication() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/pme-sw.js", { scope: "/pme" }).catch(() => {});
    }
  }, []);
  return null;
}

/**
 * Invitation à installer l'application sur l'écran d'accueil :
 * bouton sur Android (Chrome), instructions sur iPhone (Safari).
 * Rien ne s'affiche si l'application est déjà installée.
 */
/** « installee », « masquee » (refusée plus tôt), « iphone » ou « autre », lu une fois dans le navigateur. */
function lireEnvironnement(): string {
  const installee =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (installee) return "installee";
  try {
    if (localStorage.getItem(CLE_MASQUE) === "1") return "masquee";
  } catch {}
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ? "iphone" : "autre";
}

const sAbonner = () => () => {};

export default function BoutonInstallation() {
  // Côté serveur : « installee » pour ne rien afficher avant le chargement du navigateur.
  const environnement = useSyncExternalStore(sAbonner, lireEnvironnement, () => "installee");
  const [evenement, setEvenement] = useState<EvenementInstallation | null>(null);
  const [masque, setMasque] = useState(false);
  const iphone = environnement === "iphone";

  useEffect(() => {
    const surInvitation = (e: Event) => {
      e.preventDefault();
      setEvenement(e as EvenementInstallation);
    };
    const surInstallee = () => setMasque(true);
    window.addEventListener("beforeinstallprompt", surInvitation);
    window.addEventListener("appinstalled", surInstallee);
    return () => {
      window.removeEventListener("beforeinstallprompt", surInvitation);
      window.removeEventListener("appinstalled", surInstallee);
    };
  }, []);

  function fermer() {
    setMasque(true);
    try {
      localStorage.setItem(CLE_MASQUE, "1");
    } catch {}
  }

  if (masque || environnement === "installee" || environnement === "masquee" || (!evenement && !iphone)) return null;

  return (
    <div className="no-print space-y-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-base">
      <p className="font-bold text-marine">📲 Installez AGRIKEY PME sur votre téléphone</p>
      {evenement ? (
        <>
          <p className="text-slate-700">Une icône sur votre écran d&apos;accueil, ouverture en plein écran, sans lien à retenir.</p>
          <button
            type="button"
            onClick={async () => {
              await evenement.prompt();
              const choix = await evenement.userChoice;
              if (choix.outcome === "accepted") setMasque(true);
              setEvenement(null);
            }}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-agri px-5 font-bold text-white hover:bg-agri-fonce"
          >
            Installer l&apos;application
          </button>
        </>
      ) : (
        <ol className="list-decimal space-y-1 pl-6 text-slate-700">
          <li>
            Touchez le bouton <strong>Partager</strong> (carré avec une flèche vers le haut) en bas de Safari.
          </li>
          <li>
            Choisissez <strong>« Sur l&apos;écran d&apos;accueil »</strong>, puis <strong>Ajouter</strong>.
          </li>
        </ol>
      )}
      <button type="button" onClick={fermer} className="min-h-12 w-full text-base font-semibold text-slate-600 underline">
        Plus tard
      </button>
    </div>
  );
}

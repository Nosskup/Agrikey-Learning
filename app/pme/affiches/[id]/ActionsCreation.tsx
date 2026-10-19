"use client";

import { useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import Message from "@/components/pme/Message";
import { boutonPrincipal, boutonSecondaire } from "@/components/pme/styles";
import type { EtatFormulaire } from "../../actions";
import { utiliserCommeLogo } from "../actions";

/** Dessine le SVG dans une image PNG (le format que WhatsApp et Facebook acceptent partout). */
async function enPng(url: string, largeur: number, hauteur: number): Promise<Blob> {
  const image = new Image();
  image.src = url;
  await image.decode();
  // Safari dessine parfois les images intégrées au SVG avec un léger retard.
  await new Promise((r) => setTimeout(r, 150));

  const toile = document.createElement("canvas");
  toile.width = largeur;
  toile.height = hauteur;
  const contexte = toile.getContext("2d");
  if (!contexte) throw new Error("Canvas indisponible");
  contexte.fillStyle = "#ffffff";
  contexte.fillRect(0, 0, largeur, hauteur);
  contexte.drawImage(image, 0, 0, largeur, hauteur);

  return new Promise((resolve, reject) =>
    toile.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG impossible"))), "image/png")
  );
}

// Le partage de fichiers n'existe que sur certains téléphones : connu seulement dans le navigateur.
const sAbonner = () => () => {};
function peutPartagerFichiers(): boolean {
  return (
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [new File([""], "essai.png", { type: "image/png" })] })
  );
}

function nomFichier(titre: string): string {
  const base = titre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "creation"}.png`;
}

export default function ActionsCreation({
  url,
  titre,
  largeur,
  hauteur,
  estLogo,
  userId,
}: {
  url: string;
  titre: string;
  largeur: number;
  hauteur: number;
  estLogo: boolean;
  userId: string;
}) {
  const [enCours, setEnCours] = useState<"" | "telecharger" | "partager" | "logo">("");
  const [etat, setEtat] = useState<EtatFormulaire>({});
  const partageFichiers = useSyncExternalStore(sAbonner, peutPartagerFichiers, () => false);

  async function telecharger() {
    setEnCours("telecharger");
    setEtat({});
    try {
      const blob = await enPng(url, largeur, hauteur);
      const lien = document.createElement("a");
      lien.href = URL.createObjectURL(blob);
      lien.download = nomFichier(titre);
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      setTimeout(() => URL.revokeObjectURL(lien.href), 10_000);
    } catch {
      setEtat({ erreur: "Le téléchargement a échoué. Réessayez." });
    }
    setEnCours("");
  }

  async function partager() {
    setEnCours("partager");
    setEtat({});
    try {
      const blob = await enPng(url, largeur, hauteur);
      await navigator.share({ files: [new File([blob], nomFichier(titre), { type: "image/png" })], title: titre });
    } catch (erreur) {
      // Fermer la fenêtre de partage n'est pas une erreur.
      if (!(erreur instanceof DOMException && erreur.name === "AbortError")) {
        setEtat({ erreur: "Le partage a échoué. Téléchargez l'image puis envoyez-la depuis WhatsApp." });
      }
    }
    setEnCours("");
  }

  async function definirLogo() {
    setEnCours("logo");
    setEtat({});
    try {
      const blob = await enPng(url, 512, 512);
      const chemin = `${userId}/logo-ia-${Date.now()}.png`;
      const { error } = await supabase.storage
        .from("logos-entreprises")
        .upload(chemin, blob, { contentType: "image/png" });
      if (error) throw error;
      const { data } = supabase.storage.from("logos-entreprises").getPublicUrl(chemin);
      setEtat(await utiliserCommeLogo(data.publicUrl));
    } catch {
      setEtat({ erreur: "Le logo n'a pas pu être enregistré. Vérifiez votre connexion et réessayez." });
    }
    setEnCours("");
  }

  return (
    <div className="space-y-3">
      <Message etat={etat} />
      {partageFichiers && (
        <button type="button" onClick={partager} disabled={enCours !== ""} className={boutonPrincipal}>
          {enCours === "partager" ? "Préparation…" : "📤 Partager (WhatsApp, Facebook…)"}
        </button>
      )}
      <button
        type="button"
        onClick={telecharger}
        disabled={enCours !== ""}
        className={partageFichiers ? boutonSecondaire : boutonPrincipal}
      >
        {enCours === "telecharger" ? "Préparation…" : "⬇️ Télécharger l'image"}
      </button>
      {estLogo && (
        <button type="button" onClick={definirLogo} disabled={enCours !== ""} className={boutonSecondaire}>
          {enCours === "logo" ? "Enregistrement…" : "🏪 Utiliser comme logo de mon entreprise"}
        </button>
      )}
    </div>
  );
}

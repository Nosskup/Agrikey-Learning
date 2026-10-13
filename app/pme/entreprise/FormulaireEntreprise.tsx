"use client";

import { useState } from "react";
import { enregistrerEntreprise } from "../actions";
import { useFormulaire } from "@/components/pme/useFormulaire";
import { supabase } from "@/lib/supabase";
import type { Entreprise } from "@/lib/pme/session";
import Message from "@/components/pme/Message";
import { boutonPrincipal, boutonSecondaire, champ, etiquette } from "@/components/pme/styles";

const TAILLE_MAX_LOGO = 1024 * 1024; // 1 Mo
const TYPES_LOGO: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

type Champ = {
  nom: keyof Entreprise;
  label: string;
  max: number;
  type?: string;
  inputMode?: "text" | "tel" | "email";
  placeholder?: string;
};

const CHAMPS: Champ[] = [
  { nom: "activite", label: "Activité", max: 120, placeholder: "Ex. : Vente de matériel agricole" },
  { nom: "adresse", label: "Adresse", max: 200, placeholder: "Ex. : Rue 304, Porte 12, Hamdallaye ACI" },
  { nom: "ville", label: "Ville", max: 80, placeholder: "Ex. : Bamako" },
  { nom: "telephone", label: "Téléphone", max: 30, type: "tel", inputMode: "tel", placeholder: "Ex. : +223 70 00 00 00" },
  { nom: "email", label: "E-mail de l'entreprise", max: 120, type: "email", inputMode: "email" },
  { nom: "rccm", label: "Numéro RCCM (facultatif)", max: 60, placeholder: "Ex. : MA.BKO.2024.B.1234" },
];

export default function FormulaireEntreprise({
  entreprise,
  userId,
}: {
  entreprise: Entreprise;
  userId: string;
}) {
  const { etat, enCours, proprietes } = useFormulaire(enregistrerEntreprise);
  const [logoUrl, setLogoUrl] = useState(entreprise.logo_url ?? "");
  const [envoiLogo, setEnvoiLogo] = useState(false);
  const [erreurLogo, setErreurLogo] = useState("");

  async function choisirLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const fichier = event.target.files?.[0];
    event.target.value = "";
    setErreurLogo("");

    if (!fichier) return;

    const extension = TYPES_LOGO[fichier.type];
    if (!extension) {
      setErreurLogo("Choisissez une image PNG, JPG ou WEBP.");
      return;
    }
    if (fichier.size > TAILLE_MAX_LOGO) {
      setErreurLogo("Cette image dépasse 1 Mo. Choisissez une image plus légère.");
      return;
    }

    setEnvoiLogo(true);
    const chemin = `${userId}/logo-${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from("logos-entreprises")
      .upload(chemin, fichier, { contentType: fichier.type });
    setEnvoiLogo(false);

    if (error) {
      setErreurLogo("L'envoi du logo a échoué. Vérifiez votre connexion et réessayez.");
      return;
    }

    const { data } = supabase.storage.from("logos-entreprises").getPublicUrl(chemin);
    setLogoUrl(data.publicUrl);
  }

  return (
    <form {...proprietes} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <label htmlFor="nom" className={etiquette}>
          Nom de l&apos;entreprise <span className="text-red-600">*</span>
        </label>
        <input id="nom" name="nom" required maxLength={120} defaultValue={entreprise.nom} className={champ} />
      </div>

      {CHAMPS.map((c) => (
        <div key={c.nom}>
          <label htmlFor={c.nom} className={etiquette}>
            {c.label}
          </label>
          <input
            id={c.nom}
            name={c.nom}
            type={c.type ?? "text"}
            inputMode={c.inputMode}
            maxLength={c.max}
            placeholder={c.placeholder}
            defaultValue={(entreprise[c.nom] as string | null) ?? ""}
            className={champ}
          />
        </div>
      ))}

      <div>
        <span className={etiquette}>Logo (1 Mo maximum)</span>
        <input type="hidden" name="logo_url" value={logoUrl} />

        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo de l'entreprise" className="h-full w-full object-contain" />
            ) : (
              <span className="text-base text-slate-400">Aucun</span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <label className={`${boutonSecondaire} cursor-pointer`}>
              {envoiLogo ? "Envoi en cours…" : logoUrl ? "Changer le logo" : "Choisir une image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={choisirLogo}
                disabled={envoiLogo}
                className="sr-only"
              />
            </label>
            {logoUrl && (
              <button type="button" onClick={() => setLogoUrl("")} className="min-h-12 text-base font-semibold text-red-700 underline">
                Retirer le logo
              </button>
            )}
          </div>
        </div>

        {erreurLogo && <p className="mt-2 text-base font-semibold text-red-700">{erreurLogo}</p>}
      </div>

      <div>
        <label htmlFor="couleur" className={etiquette}>
          Couleur principale
        </label>
        <input
          id="couleur"
          name="couleur"
          type="color"
          defaultValue={entreprise.couleur}
          className="h-12 w-24 cursor-pointer rounded-xl border border-slate-300 bg-white p-1"
        />
      </div>

      <Message etat={etat} />

      <button type="submit" disabled={enCours || envoiLogo} className={boutonPrincipal}>
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import type { EtatFormulaire } from "../actions";
import type { Modele } from "@/lib/pme/modeles";
import { formatFCFA } from "@/lib/pme/format";
import Message from "@/components/pme/Message";
import { useFormulaire } from "@/components/pme/useFormulaire";
import { boutonPrincipal, boutonSecondaire, champ as classeChamp, etiquette } from "@/components/pme/styles";

type Action = (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;

type LigneSaisie = { designation: string; quantite: string; prix_unitaire: string };

const LIGNE_VIDE: LigneSaisie = { designation: "", quantite: "1", prix_unitaire: "" };

function nombre(texte: string): number {
  const valeur = Number(texte.replace(/[\s  ]/g, "").replace(",", "."));
  return Number.isFinite(valeur) ? valeur : 0;
}

export default function FormulaireDocument({
  action,
  modele,
  valeurs,
  lignesInitiales,
  libelleBouton,
}: {
  action: Action;
  modele: Modele;
  valeurs: Record<string, string>;
  lignesInitiales: { designation: string; quantite: number; prix_unitaire: number }[];
  libelleBouton: string;
}) {
  const { etat, enCours, proprietes } = useFormulaire(action);
  const [lignes, setLignes] = useState<LigneSaisie[]>(
    lignesInitiales.length > 0
      ? lignesInitiales.map((l) => ({
          designation: l.designation,
          quantite: String(l.quantite).replace(".", ","),
          prix_unitaire: String(l.prix_unitaire),
        }))
      : [{ ...LIGNE_VIDE }]
  );

  function changerLigne(index: number, cle: keyof LigneSaisie, valeur: string) {
    setLignes((actuelles) => actuelles.map((l, i) => (i === index ? { ...l, [cle]: valeur } : l)));
  }

  const total = lignes.reduce((t, l) => t + Math.round(nombre(l.quantite) * nombre(l.prix_unitaire)), 0);

  return (
    <form {...proprietes} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      {modele.champs.map((c) => {
        const id = `champ_${c.nom}`;
        const label = (
          <label htmlFor={id} className={etiquette}>
            {c.label}
            {c.obligatoire && <span className="text-red-600"> *</span>}
          </label>
        );

        if (c.type === "texte_long") {
          return (
            <div key={c.nom}>
              {label}
              <textarea
                id={id}
                name={id}
                rows={4}
                maxLength={2000}
                required={c.obligatoire}
                defaultValue={valeurs[c.nom] ?? ""}
                placeholder={c.placeholder}
                className={classeChamp}
              />
            </div>
          );
        }

        return (
          <div key={c.nom}>
            {label}
            <input
              id={id}
              name={id}
              type={c.type === "date" ? "date" : "text"}
              inputMode={c.type === "montant" ? "numeric" : undefined}
              maxLength={200}
              required={c.obligatoire}
              defaultValue={valeurs[c.nom] ?? ""}
              placeholder={c.placeholder ?? (c.type === "montant" ? "Ex. : 25000" : undefined)}
              className={classeChamp}
            />
          </div>
        );
      })}

      {modele.lignes && (
        <fieldset className="space-y-3">
          <legend className={etiquette}>
            Articles <span className="text-red-600">*</span>
          </legend>
          <input type="hidden" name="lignes" value={JSON.stringify(lignes)} />

          {lignes.map((ligne, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-700">Article {index + 1}</span>
                {lignes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLignes((actuelles) => actuelles.filter((_, i) => i !== index))}
                    className="min-h-12 px-2 text-base font-semibold text-red-700 underline"
                  >
                    Retirer
                  </button>
                )}
              </div>
              <input
                aria-label={`Désignation de l'article ${index + 1}`}
                value={ligne.designation}
                onChange={(e) => changerLigne(index, "designation", e.target.value)}
                maxLength={200}
                placeholder="Désignation, ex. : Sac de riz 50 kg"
                className={classeChamp}
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-base text-slate-700">
                  Quantité
                  <input
                    inputMode="decimal"
                    value={ligne.quantite}
                    onChange={(e) => changerLigne(index, "quantite", e.target.value)}
                    className={classeChamp}
                  />
                </label>
                <label className="text-base text-slate-700">
                  Prix unitaire
                  <input
                    inputMode="numeric"
                    value={ligne.prix_unitaire}
                    onChange={(e) => changerLigne(index, "prix_unitaire", e.target.value)}
                    placeholder="FCFA"
                    className={classeChamp}
                  />
                </label>
              </div>
              <p className="text-right text-base font-semibold text-slate-700">
                = {formatFCFA(Math.round(nombre(ligne.quantite) * nombre(ligne.prix_unitaire)))}
              </p>
            </div>
          ))}

          <button type="button" onClick={() => setLignes((actuelles) => [...actuelles, { ...LIGNE_VIDE }])} className={boutonSecondaire}>
            + Ajouter un article
          </button>

          <p className="rounded-xl bg-marine p-4 text-right text-xl font-black text-white">Total : {formatFCFA(total)}</p>
        </fieldset>
      )}

      <Message etat={etat} />

      <button type="submit" disabled={enCours} className={boutonPrincipal}>
        {enCours ? "Préparation…" : libelleBouton}
      </button>
    </form>
  );
}

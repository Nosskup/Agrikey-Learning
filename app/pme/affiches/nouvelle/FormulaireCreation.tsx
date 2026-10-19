"use client";

import { useState } from "react";
import Message from "@/components/pme/Message";
import { useFormulaire } from "@/components/pme/useFormulaire";
import { boutonPrincipal, carte, champ, etiquette } from "@/components/pme/styles";
import { FORMATS_AFFICHE, type Demande, type TypeCreation } from "@/lib/pme/creations";
import { creerCreation } from "../actions";

function CaseACocher({ nom, libelle, aide, coche }: { nom: string; libelle: string; aide?: string; coche: boolean }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-start gap-3 text-base">
      <input type="checkbox" name={nom} defaultChecked={coche} className="mt-1 h-5 w-5 accent-agri" />
      <span>
        <span className="block font-semibold text-slate-800">{libelle}</span>
        {aide && <span className="block text-slate-500">{aide}</span>}
      </span>
    </label>
  );
}

export default function FormulaireCreation({
  typeInitial,
  formatInitial,
  demande,
  nomEntreprise,
  aUnLogo,
  aUnTelephone,
  photoPossible,
}: {
  typeInitial: TypeCreation;
  formatInitial: string;
  demande: Demande | null;
  nomEntreprise: string;
  aUnLogo: boolean;
  aUnTelephone: boolean;
  photoPossible: boolean;
}) {
  const [type, setType] = useState<TypeCreation>(typeInitial);
  const { etat, enCours, proprietes } = useFormulaire(creerCreation);
  const affiche = type === "affiche";

  return (
    <form {...proprietes} className={`${carte} space-y-5 p-5`}>
      <fieldset>
        <legend className={etiquette}>Que voulez-vous créer ?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["affiche", "logo"] as const).map((t) => (
            <label
              key={t}
              className={`flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 text-base font-bold ${
                type === t ? "border-agri bg-green-50 text-agri-fonce" : "border-slate-200 text-slate-700"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                onChange={() => setType(t)}
                className="sr-only"
              />
              {t === "affiche" ? "🖼️ Une affiche" : "✏️ Un logo"}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="idee" className={etiquette}>
          {affiche ? "Que voulez-vous annoncer ?" : "Votre activité et le style que vous aimez"}{" "}
          <span className="text-red-600">*</span>
        </label>
        <textarea
          id="idee"
          name="idee"
          required
          minLength={5}
          maxLength={600}
          rows={3}
          defaultValue={demande?.idee}
          placeholder={
            affiche
              ? "Ex. : promotion sur les pagnes wax pour la Tabaski, -20 % toute la semaine"
              : "Ex. : boutique de cosmétiques naturels au karité, style moderne et élégant"
          }
          className={champ}
        />
      </div>

      <div>
        <label htmlFor="titre" className={etiquette}>
          {affiche ? "Titre principal (en gros sur l'affiche)" : "Nom à écrire sur le logo"}
        </label>
        <input
          key={type}
          id="titre"
          name="titre"
          maxLength={80}
          defaultValue={demande?.titre ?? (affiche ? "" : nomEntreprise)}
          placeholder={affiche ? "Ex. : GRANDE PROMO TABASKI" : nomEntreprise}
          className={champ}
        />
      </div>

      {affiche ? (
        <>
          <div>
            <label htmlFor="details" className={etiquette}>
              Détails : prix, dates, lieu (facultatif)
            </label>
            <textarea
              id="details"
              name="details"
              maxLength={400}
              rows={3}
              defaultValue={demande?.details}
              placeholder="Ex. : Pagne 6 yards à 7 500 FCFA au lieu de 9 500 FCFA. Du 1er au 7 juin. Marché de Médina Coura."
              className={champ}
            />
            <p className="mt-1 text-base text-slate-500">
              Écrivez les prix et les dates exactement comme ils doivent apparaître.
            </p>
          </div>

          <div>
            <label htmlFor="format" className={etiquette}>
              Format
            </label>
            <select id="format" name="format" defaultValue={formatInitial} className={champ}>
              {FORMATS_AFFICHE.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.libelle}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="format" value="logo" />
          <div>
            <label htmlFor="slogan" className={etiquette}>
              Slogan (facultatif)
            </label>
            <input
              id="slogan"
              name="slogan"
              maxLength={80}
              defaultValue={demande?.slogan}
              placeholder="Ex. : La beauté naturelle du Mali"
              className={champ}
            />
          </div>
        </>
      )}

      <fieldset className="space-y-1 border-t border-slate-200 pt-4">
        <legend className="sr-only">Options</legend>
        <CaseACocher nom="avec_couleur" libelle="Utiliser la couleur de mon entreprise" coche={demande?.avecCouleur ?? true} />
        {affiche && photoPossible && (
          <CaseACocher
            nom="avec_photo"
            libelle="Ajouter une photo réaliste en fond"
            aide="Plus beau, mais la création prend un peu plus de temps."
            coche={demande?.avecPhoto ?? false}
          />
        )}
        {affiche && aUnLogo && <CaseACocher nom="avec_logo" libelle="Mettre mon logo" coche={demande?.avecLogo ?? true} />}
        {affiche && aUnTelephone && (
          <CaseACocher nom="avec_contact" libelle="Mettre mon téléphone et mon adresse" coche={demande?.avecContact ?? true} />
        )}
      </fieldset>

      <Message etat={etat} />

      <button type="submit" disabled={enCours} className={boutonPrincipal}>
        {enCours ? "Création en cours…" : "✨ Créer"}
      </button>
      {enCours && (
        <p role="status" className="text-center text-base text-slate-600">
          Cela prend en général une à deux minutes. Gardez cette page ouverte.
        </p>
      )}
    </form>
  );
}

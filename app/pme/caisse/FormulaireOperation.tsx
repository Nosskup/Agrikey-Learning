"use client";

import { useState } from "react";
import { useFormulaire } from "@/components/pme/useFormulaire";
import type { EtatFormulaire } from "../actions";
import type { Categorie, Operation } from "@/lib/pme/session";
import { formatFCFA } from "@/lib/pme/format";
import Message from "@/components/pme/Message";
import { boutonPrincipal, champ, etiquette } from "@/components/pme/styles";

type Action = (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;

export default function FormulaireOperation({
  action: actionServeur,
  categories,
  typeInitial,
  dateDuJour,
  operation,
}: {
  action: Action;
  categories: Categorie[];
  typeInitial: "recu" | "depense";
  dateDuJour: string;
  operation?: Operation;
}) {
  const [type, setType] = useState(operation?.type ?? typeInitial);
  const [montant, setMontant] = useState(operation ? String(operation.montant) : "");

  // Après un ajout réussi, le formulaire est prêt pour l'opération suivante.
  const { etat, enCours, proprietes } = useFormulaire(
    async (precedent, formData) => {
      const resultat = await actionServeur(precedent, formData);
      if (resultat.succes && !operation) setMontant("");
      return resultat;
    },
    { viderSiSucces: !operation }
  );

  const categoriesDuType = categories.filter((c) => c.type === type || c.type === "tous");
  const montantLu = Number(montant.replace(/\D/g, ""));

  const choixType = [
    { valeur: "recu" as const, libelle: "⬇️ Argent reçu", actif: "border-agri bg-green-50 text-agri-fonce" },
    { valeur: "depense" as const, libelle: "⬆️ Argent dépensé", actif: "border-red-500 bg-red-50 text-red-700" },
  ];

  return (
    <form {...proprietes} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="sr-only">Type d&apos;opération</legend>
        {choixType.map((c) => (
          <label
            key={c.valeur}
            className={`flex min-h-14 cursor-pointer items-center justify-center rounded-xl border-2 px-2 text-center text-base font-bold ${
              type === c.valeur ? c.actif : "border-slate-200 text-slate-600"
            }`}
          >
            <input
              type="radio"
              name="type"
              value={c.valeur}
              checked={type === c.valeur}
              onChange={() => setType(c.valeur)}
              className="sr-only"
            />
            {c.libelle}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="montant" className={etiquette}>
          Montant (FCFA)
        </label>
        <input
          id="montant"
          name="montant"
          required
          inputMode="numeric"
          autoComplete="off"
          autoFocus={!operation}
          placeholder="Ex. : 25000"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          className={`${champ} text-xl font-bold`}
        />
        {montantLu > 0 && (
          <p className="mt-1.5 text-base font-semibold text-slate-600">= {formatFCFA(montantLu)}</p>
        )}
      </div>

      <div>
        <label htmlFor="categorie_id" className={etiquette}>
          Catégorie
        </label>
        <select
          id="categorie_id"
          name="categorie_id"
          key={type}
          defaultValue={
            operation && operation.type === type ? operation.categorie_id ?? "" : categoriesDuType[0]?.id ?? ""
          }
          className={champ}
        >
          {categoriesDuType.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
          <option value="">Sans catégorie</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className={etiquette}>
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={operation?.date ?? dateDuJour}
            className={champ}
          />
        </div>

        <div>
          <label htmlFor="note" className={etiquette}>
            Note (facultatif)
          </label>
          <input
            id="note"
            name="note"
            maxLength={300}
            defaultValue={operation?.note ?? ""}
            placeholder="Ex. : vente de 3 sacs de riz"
            className={champ}
          />
        </div>
      </div>

      <Message etat={etat} />

      <button type="submit" disabled={enCours} className={boutonPrincipal}>
        {enCours ? "Enregistrement…" : operation ? "Enregistrer les modifications" : "Enregistrer"}
      </button>
    </form>
  );
}

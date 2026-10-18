"use client";

import { useActionState } from "react";
import type { EtatFormulaire } from "../../actions";
import { ajouterAnnonce } from "../actions";
import { DOMAINES } from "@/lib/opportunites/domaines";
import Message from "@/components/pme/Message";
import { boutonPrincipal, champ, etiquette } from "@/components/pme/styles";

export default function FormulaireAnnonce({ type }: { type: string }) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(ajouterAnnonce, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="type" className={etiquette}>
          Type d&apos;annonce
        </label>
        <select id="type" name="type" defaultValue={type} className={champ}>
          <option value="emploi">Offre d&apos;emploi</option>
          <option value="appel_offres">Appel d&apos;offres</option>
          <option value="actualite">Actualité</option>
        </select>
      </div>

      <div>
        <label htmlFor="titre" className={etiquette}>
          Titre
        </label>
        <input id="titre" name="titre" required maxLength={300} placeholder="Ex. Recrutement d'un technicien agricole" className={champ} />
      </div>

      <div>
        <label htmlFor="organisme" className={etiquette}>
          Organisme (facultatif)
        </label>
        <input id="organisme" name="organisme" maxLength={150} placeholder="Ex. Ministère de l'Agriculture" className={champ} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lieu" className={etiquette}>
            Lieu (facultatif)
          </label>
          <input id="lieu" name="lieu" maxLength={100} placeholder="Ex. Ségou" className={champ} />
        </div>
        <div>
          <label htmlFor="date_limite" className={etiquette}>
            Date limite (facultatif)
          </label>
          <input id="date_limite" name="date_limite" type="date" className={champ} />
        </div>
      </div>

      <div>
        <label htmlFor="domaine" className={etiquette}>
          Domaine
        </label>
        <select id="domaine" name="domaine" defaultValue="" className={champ}>
          <option value="">Tous les domaines</option>
          {DOMAINES.map((d) => (
            <option key={d.code} value={d.code}>
              {d.libelle}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="lien" className={etiquette}>
          Lien vers l&apos;annonce (facultatif)
        </label>
        <input id="lien" name="lien" type="url" maxLength={1000} placeholder="https://…" className={champ} />
      </div>

      <div>
        <label htmlFor="description" className={etiquette}>
          Description (facultatif)
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={2000}
          placeholder="Profil recherché, pièces à fournir, contact…"
          className={champ}
        />
      </div>

      <Message etat={etat} />

      <button type="submit" disabled={enCours} className={boutonPrincipal}>
        {enCours ? "Publication…" : "Publier l'annonce"}
      </button>
    </form>
  );
}

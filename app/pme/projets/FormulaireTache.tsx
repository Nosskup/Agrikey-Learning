"use client";

import type { EtatFormulaire } from "../actions";
import type { Projet, StatutTache, Tache } from "@/lib/pme/session";
import { LIBELLES_STATUT } from "@/lib/pme/libelles";
import Message from "@/components/pme/Message";
import { useFormulaire } from "@/components/pme/useFormulaire";
import { boutonPrincipal, champ, etiquette } from "@/components/pme/styles";

type Action = (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;

/**
 * Ajout ou modification d'une tâche. Si `projets` contient plusieurs projets,
 * l'utilisateur choisit le projet ; sinon il est fixé.
 */
export default function FormulaireTache({
  action,
  projets,
  projetId,
  tache,
}: {
  action: Action;
  projets: Pick<Projet, "id" | "nom">[];
  projetId?: string;
  tache?: Tache;
}) {
  const { etat, enCours, proprietes } = useFormulaire(action, { viderSiSucces: !tache });
  const projetInitial = tache?.projet_id ?? projetId ?? projets[0]?.id ?? "";
  const prefixe = tache?.id ?? "nouvelle";

  return (
    <form {...proprietes} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      {projets.length > 1 ? (
        <div>
          <label htmlFor={`projet-${prefixe}`} className={etiquette}>
            Projet
          </label>
          <select id={`projet-${prefixe}`} name="projet_id" defaultValue={projetInitial} className={champ}>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="projet_id" value={projetInitial} />
      )}

      <div>
        <label htmlFor={`titre-${prefixe}`} className={etiquette}>
          Que faut-il faire ?
        </label>
        <input
          id={`titre-${prefixe}`}
          name="titre"
          required
          maxLength={200}
          defaultValue={tache?.titre}
          placeholder="Ex. : Acheter les étagères"
          className={champ}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`responsable-${prefixe}`} className={etiquette}>
            Responsable (facultatif)
          </label>
          <input
            id={`responsable-${prefixe}`}
            name="responsable"
            maxLength={120}
            defaultValue={tache?.responsable ?? ""}
            placeholder="Ex. : Moussa"
            className={champ}
          />
        </div>
        <div>
          <label htmlFor={`echeance-${prefixe}`} className={etiquette}>
            Échéance (facultatif)
          </label>
          <input
            id={`echeance-${prefixe}`}
            name="echeance"
            type="date"
            defaultValue={tache?.echeance ?? ""}
            className={champ}
          />
        </div>
      </div>

      {tache && (
        <div>
          <label htmlFor={`statut-${prefixe}`} className={etiquette}>
            Statut
          </label>
          <select id={`statut-${prefixe}`} name="statut" defaultValue={tache.statut} className={champ}>
            {(Object.keys(LIBELLES_STATUT) as StatutTache[]).map((s) => (
              <option key={s} value={s}>
                {LIBELLES_STATUT[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      <Message etat={etat} />

      <button type="submit" disabled={enCours} className={boutonPrincipal}>
        {enCours ? "Enregistrement…" : tache ? "Enregistrer la tâche" : "Ajouter la tâche"}
      </button>
    </form>
  );
}

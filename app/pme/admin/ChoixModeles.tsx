import Link from "next/link";
import { MODELES } from "@/lib/pme/modeles";
import { boutonPrincipal, boutonSecondaire } from "@/components/pme/styles";

type Mode = "code" | "tous" | "choix";

/**
 * Formulaire de choix des modèles de documents (page admin).
 * `avecSuivreCode` : propose « Suivre son code » (réglage d'un membre).
 */
export default function ChoixModeles({
  action,
  autorises,
  avecSuivreCode = false,
  resumeCode,
}: {
  action: (formData: FormData) => Promise<void>;
  autorises: string[] | null;
  avecSuivreCode?: boolean;
  resumeCode?: string;
}) {
  const mode: Mode =
    autorises === null ? (avecSuivreCode ? "code" : "tous") : autorises.includes("*") ? "tous" : "choix";
  const coches = new Set(autorises ?? []);

  const options: { valeur: Mode; libelle: string; aide?: string }[] = [
    ...(avecSuivreCode ? [{ valeur: "code" as Mode, libelle: "Suivre son code", aide: resumeCode }] : []),
    { valeur: "tous", libelle: "Tous les modèles" },
    { valeur: "choix", libelle: "Seulement les modèles cochés ci-dessous" },
  ];

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 text-base">
      <fieldset className="space-y-2">
        <legend className="mb-2 font-semibold text-marine">Accès aux modèles</legend>
        {options.map((o) => (
          <label key={o.valeur} className="flex min-h-12 cursor-pointer items-start gap-3">
            <input type="radio" name="mode" value={o.valeur} defaultChecked={mode === o.valeur} className="mt-1 h-5 w-5 accent-agri" />
            <span>
              <span className="block font-semibold">{o.libelle}</span>
              {o.aide && <span className="block text-slate-500">Actuellement : {o.aide}</span>}
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-1 border-t border-slate-200 pt-4">
        <legend className="mb-2 font-semibold text-marine">Modèles (pris en compte avec « Seulement les modèles cochés »)</legend>
        {MODELES.map((m) => (
          <label key={m.code} className="flex min-h-12 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="modeles"
              value={m.code}
              defaultChecked={mode === "choix" && coches.has(m.code)}
              className="h-5 w-5 accent-agri"
            />
            <span>
              <span aria-hidden="true">{m.icone}</span> {m.titre}
            </span>
          </label>
        ))}
      </fieldset>

      <button type="submit" className={boutonPrincipal}>
        Enregistrer
      </button>
      <Link href="/pme/admin" className={boutonSecondaire}>
        Annuler
      </Link>
    </form>
  );
}

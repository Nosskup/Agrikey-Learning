import { QUOTA_IA_DEFAUT } from "@/lib/pme/creations";
import { boutonPrincipal, champ } from "@/components/pme/styles";

/**
 * Nombre de créations IA (affiches, logos) par mois, pour un code ou un membre.
 * `avecSuivreCode` : propose « Suivre son code » (réglage d'un membre).
 */
export default function ChoixQuota({
  action,
  quota,
  avecSuivreCode = false,
  resumeCode,
}: {
  action: (formData: FormData) => Promise<void>;
  quota: number | null;
  avecSuivreCode?: boolean;
  resumeCode?: string;
}) {
  const mode = quota === null ? (avecSuivreCode ? "code" : "defaut") : "nombre";

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-base">
      <fieldset className="space-y-2">
        <legend className="mb-2 font-semibold text-marine">🎨 Affiches et logos IA : créations par mois</legend>
        {avecSuivreCode && (
          <label className="flex min-h-12 cursor-pointer items-start gap-3">
            <input type="radio" name="mode" value="code" defaultChecked={mode === "code"} className="mt-1 h-5 w-5 accent-agri" />
            <span>
              <span className="block font-semibold">Suivre son code</span>
              {resumeCode && <span className="block text-slate-500">Actuellement : {resumeCode}</span>}
            </span>
          </label>
        )}
        {!avecSuivreCode && (
          <label className="flex min-h-12 cursor-pointer items-center gap-3">
            <input type="radio" name="mode" value="defaut" defaultChecked={mode === "defaut"} className="h-5 w-5 accent-agri" />
            <span className="font-semibold">Valeur par défaut ({QUOTA_IA_DEFAUT} par mois)</span>
          </label>
        )}
        <label className="flex min-h-12 cursor-pointer items-center gap-3">
          <input type="radio" name="mode" value="nombre" defaultChecked={mode === "nombre"} className="h-5 w-5 accent-agri" />
          <span className="font-semibold">Nombre choisi :</span>
        </label>
        <input
          type="number"
          name="quota"
          min={0}
          max={1000}
          inputMode="numeric"
          defaultValue={quota ?? QUOTA_IA_DEFAUT}
          aria-label="Créations par mois"
          className={`${champ} max-w-40`}
        />
        <p className="text-slate-500">0 = module fermé. Chaque création coûte des crédits IA à AGRIKEY.</p>
      </fieldset>

      <button type="submit" className={boutonPrincipal}>
        Enregistrer la limite
      </button>
    </form>
  );
}

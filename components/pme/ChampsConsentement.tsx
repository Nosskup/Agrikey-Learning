import Link from "next/link";
import { champ, etiquette } from "./styles";

/** Code partenaire facultatif + case obligatoire d'acceptation des conditions. */
export default function ChampsConsentement({ codeInitial = "" }: { codeInitial?: string }) {
  return (
    <>
      <div>
        <label htmlFor="code_partenaire" className={etiquette}>
          Code partenaire (facultatif)
        </label>
        <input
          id="code_partenaire"
          name="code_partenaire"
          maxLength={20}
          defaultValue={codeInitial}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="Ex. : LIGUE"
          className={`${champ} uppercase`}
        />
        <p className="mt-1 text-base text-slate-500">Donné par votre association ou votre organisation, si vous en avez un.</p>
      </div>

      <label className="flex min-h-12 cursor-pointer items-start gap-3 text-base text-slate-700">
        <input type="checkbox" name="conditions" value="oui" required className="mt-1 h-6 w-6 shrink-0 accent-agri" />
        <span>
          J&apos;accepte les{" "}
          <Link href="/pme/conditions" target="_blank" className="font-semibold text-agri underline">
            conditions d&apos;utilisation
          </Link>{" "}
          et la{" "}
          <Link href="/pme/confidentialite" target="_blank" className="font-semibold text-agri underline">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>
    </>
  );
}

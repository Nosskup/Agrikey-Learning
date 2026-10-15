import Link from "next/link";
import { champ, etiquette } from "./styles";

/** Code d'invitation obligatoire + case obligatoire d'acceptation des conditions. */
export default function ChampsConsentement({ codeInitial = "" }: { codeInitial?: string }) {
  return (
    <>
      <div>
        <label htmlFor="code_partenaire" className={etiquette}>
          Code d&apos;invitation
        </label>
        <input
          id="code_partenaire"
          name="code_partenaire"
          required
          maxLength={20}
          defaultValue={codeInitial}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="Ex. : LIGUE"
          className={`${champ} uppercase`}
        />
        <p className="mt-1 text-base text-slate-500">
          AGRIKEY PME est réservé aux membres des organisations partenaires. Le code vous est donné par votre association.
        </p>
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

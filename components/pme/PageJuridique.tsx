import Link from "next/link";
import { boutonSecondaire } from "./styles";

export type SectionJuridique = { titre: string; paragraphes: React.ReactNode[] };

/** Valeur de l'éditeur, surlignée tant qu'elle reste à compléter. */
export function Valeur({ texte }: { texte: string }) {
  return texte.startsWith("À compléter") ? <mark className="bg-yellow-200 px-1">{texte}</mark> : <>{texte}</>;
}

/** Mise en page commune des conditions d'utilisation et de la confidentialité. */
export default function PageJuridique({
  titre,
  version,
  introduction,
  sections,
}: {
  titre: string;
  version: string;
  introduction: string;
  sections: SectionJuridique[];
}) {
  return (
    <article className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-marine">{titre}</h1>
        <p className="mt-1 text-base text-slate-500">Version du {version}</p>
        <p className="mt-3 text-base text-slate-700">{introduction}</p>
      </div>

      {sections.map((section, i) => (
        <section key={section.titre} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black text-marine">
            {i + 1}. {section.titre}
          </h2>
          {section.paragraphes.map((p, j) => (
            <p key={j} className="text-base leading-7 text-slate-700">
              {p}
            </p>
          ))}
        </section>
      ))}

      <Link href="/pme" className={boutonSecondaire}>
        ← Retour à AGRIKEY PME
      </Link>
    </article>
  );
}

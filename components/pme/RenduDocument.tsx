import { Fragment } from "react";
import type { Entreprise } from "@/lib/pme/session";
import type { Modele } from "@/lib/pme/modeles";
import { montantLigne, variablesDocument, type DonneesDocument } from "@/lib/pme/documents";
import { formatFCFA } from "@/lib/pme/format";
import EnTeteEntreprise from "./EnTeteEntreprise";

const VARIABLE = /\{\{\s*([a-z_]+)\s*\}\}/g;

/** Texte avec retours à la ligne conservés. */
function TexteMultiligne({ texte }: { texte: string }) {
  return texte.split("\n").map((morceau, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {morceau}
    </Fragment>
  ));
}

/**
 * Remplit une ligne du modèle. Le gras (**…**) est lu dans le modèle avant
 * le remplacement : le texte saisi par l'utilisateur n'est jamais interprété.
 */
function LigneRemplie({ ligne, variables }: { ligne: string; variables: Record<string, string> }) {
  return ligne.split("**").map((segment, i) => {
    const texte = segment.replace(VARIABLE, (_, nom: string) => variables[nom] ?? "");
    return i % 2 === 1 ? (
      <strong key={i}>
        <TexteMultiligne texte={texte} />
      </strong>
    ) : (
      <TexteMultiligne key={i} texte={texte} />
    );
  });
}

function TableauLignes({ donnees, total }: { donnees: DonneesDocument; total: string }) {
  // Sur téléphone, police un peu plus petite pour que les montants tiennent dans la feuille ;
  // si l'écran est vraiment étroit, le tableau défile plutôt que de déborder.
  return (
    <div className="overflow-x-auto">
    <table className="w-full border-collapse text-sm sm:text-base">
      <thead>
        <tr className="border-y-2 border-slate-900 text-left">
          <th className="py-2 pr-2">Désignation</th>
          <th className="py-2 pr-2 text-right">Qté</th>
          <th className="py-2 pr-2 text-right">Prix unitaire</th>
          <th className="py-2 text-right">Montant</th>
        </tr>
      </thead>
      <tbody>
        {donnees.lignes.map((ligne, i) => (
          <tr key={i} className="border-b border-slate-200 align-top">
            <td className="py-2 pr-2">{ligne.designation}</td>
            <td className="py-2 pr-2 text-right">{ligne.quantite.toLocaleString("fr-FR")}</td>
            <td className="py-2 pr-2 text-right whitespace-nowrap">{formatFCFA(ligne.prix_unitaire)}</td>
            <td className="py-2 text-right whitespace-nowrap">{formatFCFA(montantLigne(ligne))}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-slate-900">
          <td colSpan={3} className="py-2 pr-2 text-right font-black">
            TOTAL
          </td>
          <td className="py-2 text-right font-black whitespace-nowrap">{total}</td>
        </tr>
      </tfoot>
    </table>
    </div>
  );
}

/** Document A4 complet : en-tête de l'entreprise puis contenu du modèle rempli. */
export default function RenduDocument({
  modele,
  donnees,
  entreprise,
}: {
  modele: Modele;
  donnees: DonneesDocument;
  entreprise: Entreprise;
}) {
  const variables = variablesDocument(modele, donnees, entreprise);
  const elements: React.ReactNode[] = [];
  let espace = false;

  modele.contenu.split("\n").forEach((brute, index) => {
    const ligne = brute.trimEnd();

    if (ligne.trim() === "") {
      espace = elements.length > 0;
      return;
    }

    // Une ligne dont toutes les variables sont vides est retirée.
    const noms = [...ligne.matchAll(VARIABLE)].map((m) => m[1]);
    if (noms.length > 0 && noms.every((nom) => !variables[nom]?.trim()) && ligne.trim() !== "{{tableau_lignes}}") {
      return;
    }

    const marge = espace ? "mt-5" : "";
    espace = false;

    if (ligne.trim() === "---") {
      elements.push(<div key={index} className="h-20" aria-hidden="true" />);
    } else if (ligne.trim() === "{{tableau_lignes}}") {
      elements.push(
        <div key={index} className={marge}>
          <TableauLignes donnees={donnees} total={variables.total ?? ""} />
        </div>
      );
    } else if (ligne.startsWith("# ")) {
      elements.push(
        <h1 key={index} className={`${marge} text-center text-2xl font-black tracking-wide`} style={{ color: entreprise.couleur }}>
          <LigneRemplie ligne={ligne.slice(2)} variables={variables} />
        </h1>
      );
    } else if (ligne.startsWith("## ")) {
      elements.push(
        <h2 key={index} className={`${marge} text-base font-black uppercase`} style={{ color: entreprise.couleur }}>
          <LigneRemplie ligne={ligne.slice(3)} variables={variables} />
        </h2>
      );
    } else if (ligne.startsWith(">> ")) {
      elements.push(
        <p key={index} className={`${marge} text-right`}>
          <LigneRemplie ligne={ligne.slice(3)} variables={variables} />
        </p>
      );
    } else {
      elements.push(
        <p key={index} className={marge}>
          <LigneRemplie ligne={ligne} variables={variables} />
        </p>
      );
    }
  });

  return (
    <article className="feuille-a4 rounded-2xl border border-slate-200 bg-white p-6 text-base leading-relaxed text-slate-900 sm:p-10">
      <EnTeteEntreprise entreprise={entreprise} />
      <div className="mt-8">{elements}</div>
    </article>
  );
}

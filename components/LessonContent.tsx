import { Fragment, type ReactNode } from "react";

/**
 * Affichage du contenu d'une leçon, avec une mise en forme simple
 * (inspirée de Markdown) pensée pour des formations riches.
 *
 * Ce que le formateur peut écrire dans le champ « Contenu » :
 *
 *   # Titre de section            (##  = sous-titre, ###  = petit titre)
 *   Un paragraphe normal.
 *   - une puce                    (ou * une puce)
 *   1. une étape numérotée
 *   **gras**   *italique*   `code`   [texte du lien](https://...)
 *   ---                           (ligne de séparation)
 *   ![Description](https://adresse-de-l-image)
 *   | Colonne A | Colonne B |     (tableau : 2e ligne = | --- | --- |)
 *   | --- | --- |
 *   | valeur | valeur |
 *   > [!retenir] Texte de l'encadré
 *   > [!astuce]  > [!attention]  > [!exemple]  > [!exercice]
 *
 * Un texte simple (paragraphes séparés par une ligne vide) s'affiche
 * exactement comme avant : les anciennes leçons ne changent pas.
 *
 * Aucune balise HTML n'est interprétée : tout est construit en
 * éléments React, donc un contenu ne peut pas injecter de code.
 */

type Block =
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; kind: CalloutKind | null; lines: string[] }
  | { type: "hr" }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "image"; alt: string; src: string }
  | { type: "code"; text: string };

type CalloutKind =
  | "retenir"
  | "astuce"
  | "attention"
  | "exemple"
  | "exercice";

const CALLOUT_STYLES: Record<
  CalloutKind | "defaut",
  { box: string; label: string; title: string }
> = {
  retenir: {
    box: "border-green-500 bg-green-50",
    label: "text-green-800",
    title: "À retenir",
  },
  astuce: {
    box: "border-sky-400 bg-sky-50",
    label: "text-sky-800",
    title: "Astuce",
  },
  attention: {
    box: "border-amber-400 bg-amber-50",
    label: "text-amber-800",
    title: "Attention",
  },
  exemple: {
    box: "border-slate-400 bg-slate-50",
    label: "text-slate-700",
    title: "Exemple",
  },
  exercice: {
    box: "border-violet-400 bg-violet-50",
    label: "text-violet-800",
    title: "À vous de jouer",
  },
  defaut: {
    box: "border-slate-300 bg-slate-50",
    label: "text-slate-600",
    title: "",
  },
};

const CALLOUT_TAG =
  /^\[!(retenir|astuce|attention|exemple|exercice)\]\s*(.*)$/i;

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line.trim());
}

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];

  let paragraph: string[] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  }

  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    // Ligne vide : fin de paragraphe
    if (line === "") {
      flushParagraph();
      i++;
      continue;
    }

    // Bloc de code
    if (line.startsWith("```")) {
      flushParagraph();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // fermeture
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    // Séparateur
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushParagraph();
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Titre
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      const level = Math.min(heading[1].length + 1, 4) as 2 | 3 | 4;
      blocks.push({ type: "heading", level, text: heading[2].trim() });
      i++;
      continue;
    }

    // Image seule sur sa ligne
    const image = line.match(
      /^!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^)\s]+)\)$/
    );
    if (image) {
      flushParagraph();
      blocks.push({ type: "image", alt: image[1], src: image[2] });
      i++;
      continue;
    }

    // Tableau
    if (
      line.startsWith("|") &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      flushParagraph();
      const header = splitTableRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    // Encadré / citation
    if (line.startsWith(">")) {
      flushParagraph();
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        const content = lines[i].trim().replace(/^>\s?/, "");
        // Une nouvelle balise [!...] démarre un nouvel encadré.
        if (quote.length > 0 && CALLOUT_TAG.test(content)) break;
        quote.push(content);
        i++;
      }

      let kind: CalloutKind | null = null;
      const tag = quote[0]?.match(CALLOUT_TAG);
      if (tag) {
        kind = tag[1].toLowerCase() as CalloutKind;
        quote[0] = tag[2];
      }

      blocks.push({
        type: "callout",
        kind,
        lines: quote.filter((q, idx) => !(idx === 0 && q === "")),
      });
      continue;
    }

    // Liste à puces
    if (/^[-*•]\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Liste numérotée
    if (/^\d+[.)]\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Texte courant
    paragraph.push(line);
    i++;
  }

  flushParagraph();
  return blocks;
}

const INLINE =
  /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_|\[[^\]]+\]\((?:https?:\/\/|\/|mailto:)[^)\s]+\))/g;

function renderInline(text: string): ReactNode[] {
  const parts = text.split(INLINE);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={index}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const link = part.match(
      /^\[([^\]]+)\]\(((?:https?:\/\/|\/|mailto:)[^)\s]+)\)$/
    );
    if (link) {
      const external = /^https?:\/\//.test(link[2]);
      return (
        <a
          key={index}
          href={link[2]}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="font-semibold text-green-700 underline decoration-green-300 underline-offset-2 hover:text-green-800"
        >
          {link[1]}
        </a>
      );
    }

    if (
      (part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length > 2)
    ) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

/** Temps de lecture estimé, en minutes (environ 200 mots/minute). */
export function readingTimeMinutes(source: string | null): number {
  if (!source) return 0;
  const words = source.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function LessonContent({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading": {
            const cls =
              block.level === 2
                ? "mt-10 border-b border-slate-200 pb-2 text-2xl font-black text-slate-900 first:mt-0"
                : block.level === 3
                  ? "mt-8 text-xl font-bold text-slate-900 first:mt-0"
                  : "mt-6 text-base font-bold uppercase tracking-wide text-green-700 first:mt-0";
            const Tag = block.level === 2 ? "h2" : block.level === 3 ? "h3" : "h4";
            return (
              <Tag key={index} className={cls}>
                {renderInline(block.text)}
              </Tag>
            );
          }

          case "paragraph":
            return (
              <p key={index} className="text-base leading-8 text-slate-700">
                {renderInline(block.text)}
              </p>
            );

          case "ul":
            return (
              <ul
                key={index}
                className="list-disc space-y-2 pl-6 text-base leading-8 text-slate-700 marker:text-green-600"
              >
                {block.items.map((item, k) => (
                  <li key={k}>{renderInline(item)}</li>
                ))}
              </ul>
            );

          case "ol":
            return (
              <ol
                key={index}
                className="list-decimal space-y-2 pl-6 text-base leading-8 text-slate-700 marker:font-bold marker:text-green-700"
              >
                {block.items.map((item, k) => (
                  <li key={k}>{renderInline(item)}</li>
                ))}
              </ol>
            );

          case "callout": {
            const style = CALLOUT_STYLES[block.kind ?? "defaut"];
            return (
              <aside
                key={index}
                className={`rounded-r-2xl border-l-4 px-5 py-4 ${style.box}`}
              >
                {style.title && (
                  <p
                    className={`mb-1 text-xs font-black uppercase tracking-widest ${style.label}`}
                  >
                    {style.title}
                  </p>
                )}
                <div className="space-y-2 text-[15px] leading-7 text-slate-800">
                  {block.lines.map((l, k) => (
                    <p key={k}>{renderInline(l)}</p>
                  ))}
                </div>
              </aside>
            );
          }

          case "table":
            return (
              <div
                key={index}
                className="overflow-x-auto rounded-2xl border border-slate-200"
              >
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-green-50 text-green-900">
                    <tr>
                      {block.header.map((cell, k) => (
                        <th key={k} className="px-4 py-3 font-bold">
                          {renderInline(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {block.rows.map((row, r) => (
                      <tr key={r} className={r % 2 === 1 ? "bg-slate-50/60" : ""}>
                        {row.map((cell, k) => (
                          <td key={k} className="px-4 py-3 align-top">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "image":
            return (
              <figure key={index}>
                <img
                  src={block.src}
                  alt={block.alt}
                  className="mx-auto max-h-[28rem] w-auto max-w-full rounded-2xl border border-slate-200"
                />
                {block.alt && (
                  <figcaption className="mt-2 text-center text-xs text-slate-500">
                    {block.alt}
                  </figcaption>
                )}
              </figure>
            );

          case "code":
            return (
              <pre
                key={index}
                className="overflow-x-auto rounded-2xl bg-slate-900 p-5 font-mono text-sm leading-6 text-slate-100"
              >
                {block.text}
              </pre>
            );

          case "hr":
            return <hr key={index} className="my-8 border-slate-200" />;

          default:
            return null;
        }
      })}
    </div>
  );
}

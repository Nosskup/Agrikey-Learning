import Link from "next/link";
import { exigerEntreprise } from "@/lib/pme/session";
import { bornesDuMois, formatFCFA, nomDuMois } from "@/lib/pme/format";

export const metadata = { title: "Tableau de bord" };

type Carte = {
  href: string;
  icone: string;
  titre: string;
  info: string;
};

export default async function TableauDeBord() {
  const { supabase, entreprise } = await exigerEntreprise();
  const { debut, fin } = bornesDuMois();

  const [operations, tachesAFaire, documents] = await Promise.all([
    supabase
      .from("operations_caisse")
      .select("type, montant")
      .gte("date", debut)
      .lte("date", fin),
    supabase
      .from("taches")
      .select("id", { count: "exact", head: true })
      .neq("statut", "termine"),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true }),
  ]);

  const solde = (operations.data ?? []).reduce(
    (total, op) => total + (op.type === "recu" ? op.montant : -op.montant),
    0
  );
  const nbTaches = tachesAFaire.count ?? 0;
  const nbDocuments = documents.count ?? 0;

  const cartes: Carte[] = [
    {
      href: "/pme/caisse",
      icone: "💰",
      titre: "Caisse",
      info: `Solde de ${nomDuMois()} : ${formatFCFA(solde)}`,
    },
    {
      href: "/pme/projets",
      icone: "📋",
      titre: "Projets",
      info: nbTaches === 0
        ? "Aucune tâche à faire"
        : `${nbTaches} tâche${nbTaches > 1 ? "s" : ""} à faire`,
    },
    {
      href: "/pme/documents",
      icone: "📄",
      titre: "Documents",
      info: nbDocuments === 0
        ? "Devis, factures, lettres…"
        : `${nbDocuments} document${nbDocuments > 1 ? "s" : ""} créé${nbDocuments > 1 ? "s" : ""}`,
    },
    {
      href: "/pme/entreprise",
      icone: "🏪",
      titre: "Mon entreprise",
      info: "Logo, adresse, téléphone…",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-base text-slate-600">Bonjour,</p>
        <h1 className="text-3xl font-black text-marine">{entreprise.nom}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cartes.map((carte) => (
          <Link
            key={carte.href}
            href={carte.href}
            className="flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-agri active:bg-green-50"
          >
            <span aria-hidden="true" className="text-4xl">
              {carte.icone}
            </span>
            <span>
              <span className="block text-xl font-black text-marine">{carte.titre}</span>
              <span className="mt-1 block text-base text-slate-600">{carte.info}</span>
            </span>
          </Link>
        ))}

        <Link
          href="/pme/affiches"
          className="flex min-h-28 items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-100 p-5 text-slate-500 sm:col-span-2"
        >
          <span aria-hidden="true" className="text-4xl grayscale">
            🎨
          </span>
          <span>
            <span className="block text-xl font-black">Affiches et logos IA</span>
            <span className="mt-1 inline-block rounded-full bg-slate-300 px-3 py-0.5 text-base font-bold text-slate-700">
              Bientôt
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { boutonPrincipal, boutonSecondaire } from "@/components/pme/styles";
import BoutonInstallation from "@/components/pme/Installation";

const MODULES = [
  { icone: "💰", titre: "Caisse", texte: "Notez l'argent reçu et dépensé, voyez votre solde du mois." },
  { icone: "📋", titre: "Projets", texte: "Organisez vos tâches et voyez ce qu'il reste à faire cette semaine." },
  { icone: "📄", titre: "Documents", texte: "Devis, factures, reçus, lettres : prêts en PDF avec votre logo." },
  { icone: "🏪", titre: "Mon entreprise", texte: "Vos informations remplies une fois, utilisées partout." },
];

/** Page d'accueil d'AGRIKEY PME pour les visiteurs non connectés. */
export default function Presentation() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl leading-tight font-black text-marine sm:text-4xl">
          Gérez votre entreprise <span className="text-agri">depuis votre téléphone.</span>
        </h1>
        <p className="text-lg text-slate-700">
          AGRIKEY PME est l&apos;outil simple et en français pour les boutiques, ateliers et petites
          entreprises du Mali. Gratuit, sans formation.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/pme/inscription" className={boutonPrincipal}>
            Créer mon compte gratuit
          </Link>
          <Link href="/pme/connexion" className={boutonSecondaire}>
            Se connecter
          </Link>
        </div>
      </section>

      <BoutonInstallation />

      <section className="grid gap-3 sm:grid-cols-2">
        {MODULES.map((m) => (
          <div key={m.titre} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <span aria-hidden="true" className="text-3xl">
              {m.icone}
            </span>
            <span>
              <span className="block text-lg font-black text-marine">{m.titre}</span>
              <span className="block text-base text-slate-600">{m.texte}</span>
            </span>
          </div>
        ))}
      </section>

      <p className="text-center text-base text-slate-500">
        Une initiative{" "}
        <Link href="/" className="font-semibold text-agri underline">
          AGRIKEY
        </Link>
        .
      </p>
    </div>
  );
}

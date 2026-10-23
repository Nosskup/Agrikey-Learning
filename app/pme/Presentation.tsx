import Link from "next/link";
import { boutonSecondaire, carte } from "@/components/pme/styles";
import BoutonInstallation from "@/components/pme/Installation";
import Icone, { type NomIcone } from "@/components/pme/Icones";
import { iaDisponible } from "@/lib/pme/ia";

type Module = { icone: NomIcone; titre: string; texte: string; teinte: string; bientot?: boolean };

const ETAPES = [
  { titre: "Inscrivez-vous", texte: "Avec le code d'invitation de votre association ou d'AGRIKEY." },
  { titre: "Présentez votre entreprise", texte: "Nom, logo, téléphone : remplis une fois, utilisés partout." },
  { titre: "Gérez au quotidien", texte: "Caisse, projets et documents, depuis votre téléphone." },
];

const ATOUTS = [
  { icone: "verifie" as NomIcone, texte: "Vos données vous appartiennent : téléchargez-les ou supprimez-les quand vous voulez." },
  { icone: "compte" as NomIcone, texte: "Chaque compte est protégé : personne d'autre ne voit votre caisse." },
  { icone: "accueil" as NomIcone, texte: "S'installe sur l'écran d'accueil comme une application." },
];

/** Aperçu du tableau de bord, dessiné en HTML, pour montrer l'outil avant l'inscription. */
function ApercuTelephone() {
  return (
    <div aria-hidden="true" className="mx-auto w-56 shrink-0 rounded-[2rem] bg-marine p-2 shadow-2xl shadow-marine/40 ring-1 ring-white/20">
      <div className="space-y-2 rounded-[1.6rem] bg-slate-50 p-3">
        <div className="rounded-2xl bg-linear-to-br from-marine to-agri-fonce p-3 text-white">
          <p className="text-[10px] text-slate-200">Solde du mois</p>
          <p className="text-lg font-black">245 000 FCFA</p>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {(["recu", "depense", "tache", "documents"] as NomIcone[]).map((n) => (
              <span key={n} className="flex h-7 items-center justify-center rounded-lg bg-white text-marine">
                <Icone nom={n} className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm">
          <svg viewBox="0 0 36 36" className="h-10 w-10 shrink-0">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="5" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#16834b" strokeWidth="5" strokeDasharray="53 88" transform="rotate(-90 18 18)" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#0284c7" strokeWidth="5" strokeDasharray="16 88" strokeDashoffset="-55" transform="rotate(-90 18 18)" />
          </svg>
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-black text-marine">Ouverture boutique</span>
            <span className="block text-[10px] text-slate-500">60 % · Dans les temps</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { n: "caisse" as NomIcone, t: "Caisse", c: "bg-green-50 text-agri" },
            { n: "documents" as NomIcone, t: "Documents", c: "bg-amber-50 text-amber-700" },
          ].map((s) => (
            <span key={s.t} className="rounded-2xl bg-white p-2 shadow-sm">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${s.c}`}>
                <Icone nom={s.n} className="h-4 w-4" />
              </span>
              <span className="mt-1 block text-[11px] font-black text-marine">{s.t}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Page d'accueil d'AGRIKEY PME pour les visiteurs non connectés. */
export default function Presentation() {
  const modules: Module[] = [
    { icone: "caisse", titre: "Caisse", texte: "L'argent reçu et dépensé, le solde du mois en un coup d'œil.", teinte: "bg-green-50 text-agri" },
    {
      icone: "projets",
      titre: "Projets",
      texte: "Tâches en liste, en tableau ou sur une frise, et l'avancement en couleurs.",
      teinte: "bg-sky-50 text-sky-700",
    },
    { icone: "documents", titre: "Documents", texte: "Devis, factures, reçus, lettres : prêts en PDF avec votre logo.", teinte: "bg-amber-50 text-amber-700" },
    { icone: "opportunites", titre: "Opportunités", texte: "Emplois, appels d'offres et actualités utiles au Mali.", teinte: "bg-violet-50 text-violet-700" },
    {
      icone: "palette",
      titre: "Affiches et logos IA",
      texte: "Décrivez votre idée : l'IA crée une affiche ou un logo à partager.",
      teinte: "bg-pink-50 text-pink-700",
      bientot: !iaDisponible(),
    },
    { icone: "entreprise", titre: "Mon entreprise", texte: "Vos informations remplies une fois, utilisées partout.", teinte: "bg-teal-50 text-teal-700" },
  ];

  return (
    <div className="space-y-10">
      {/* En-tête */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-marine via-marine-clair to-agri-fonce p-6 text-white shadow-xl shadow-marine/20 sm:p-8">
        <div aria-hidden="true" className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-white/10" />
        <div aria-hidden="true" className="absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-agri/30" />

        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center">
          <div className="space-y-4">
            <p className="flex flex-wrap gap-2 text-sm font-bold">
              {["Gratuit", "En français", "Sur téléphone"].map((e) => (
                <span key={e} className="rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/20">
                  {e}
                </span>
              ))}
            </p>
            <h1 className="text-3xl leading-tight font-black sm:text-4xl">
              Gérez votre entreprise <span className="text-green-300">depuis votre téléphone.</span>
            </h1>
            <p className="text-lg text-slate-200">
              L&apos;outil simple des boutiques, ateliers et petites entreprises du Mali : caisse, projets, documents et
              plus encore, sans formation.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/pme/inscription"
                className="flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-base font-black whitespace-nowrap text-marine shadow-md hover:bg-green-50 active:scale-[0.99]"
              >
                Créer mon compte
              </Link>
              <Link
                href="/pme/connexion"
                className="flex min-h-12 items-center justify-center rounded-2xl px-5 py-3 text-base font-bold text-white ring-1 ring-white/40 hover:bg-white/10"
              >
                Se connecter
              </Link>
            </div>
          </div>
          <ApercuTelephone />
        </div>
      </section>

      <BoutonInstallation />

      {/* Modules */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-marine">Tout votre quotidien au même endroit</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map((m) => (
            <div key={m.titre} className={`${carte} flex items-start gap-4 p-4`}>
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${m.teinte}`}>
                <Icone nom={m.icone} className="h-6 w-6" />
              </span>
              <span>
                <span className="flex flex-wrap items-center gap-2 text-lg font-black text-marine">
                  {m.titre}
                  {m.bientot && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">Bientôt</span>
                  )}
                </span>
                <span className="block text-base text-slate-600">{m.texte}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-marine">Prêt en 3 étapes</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {ETAPES.map((e, i) => (
            <li key={e.titre} className={`${carte} p-4`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-agri text-lg font-black text-white">
                {i + 1}
              </span>
              <span className="mt-3 block text-lg font-black text-marine">{e.titre}</span>
              <span className="block text-base text-slate-600">{e.texte}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Confiance */}
      <section className={`${carte} space-y-3 p-5`}>
        <h2 className="text-xl font-black text-marine">Pensé pour vous, et sûr</h2>
        <ul className="space-y-3">
          {ATOUTS.map((a) => (
            <li key={a.texte} className="flex items-start gap-3 text-base text-slate-700">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-agri">
                <Icone nom={a.icone} className="h-5 w-5" />
              </span>
              <span className="pt-1.5">{a.texte}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Appel final */}
      <section className="space-y-3 text-center">
        <p className="text-xl font-black text-marine">Votre association vous a donné un code ?</p>
        <Link
          href="/pme/inscription"
          className="mx-auto flex min-h-12 max-w-sm items-center justify-center rounded-2xl bg-linear-to-r from-agri to-agri-fonce px-5 py-3 text-base font-bold text-white shadow-md shadow-green-900/15 hover:brightness-110"
        >
          Créer mon compte maintenant
        </Link>
        <Link href="/pme/connexion" className={`${boutonSecondaire} mx-auto max-w-sm`}>
          J&apos;ai déjà un compte
        </Link>
        <p className="pt-2 text-base text-slate-500">
          Une initiative{" "}
          <Link href="/" className="font-semibold text-agri underline">
            AGRIKEY
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

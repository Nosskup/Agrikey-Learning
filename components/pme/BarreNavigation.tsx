"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icone, { type NomIcone } from "./Icones";

// Pages d'accès au compte : pas de barre de navigation.
const PAGES_SANS_BARRE = [
  "/pme/connexion", "/pme/inscription", "/pme/bienvenue", "/pme/mot-de-passe-oublie",
  "/pme/nouveau-mot-de-passe", "/pme/en-attente", "/pme/caisse/imprimer",
];

const ONGLETS: { href: string; libelle: string; icone: NomIcone }[] = [
  { href: "/pme", libelle: "Accueil", icone: "accueil" },
  { href: "/pme/caisse", libelle: "Caisse", icone: "caisse" },
  { href: "/pme/projets", libelle: "Projets", icone: "projets" },
  { href: "/pme/opportunites", libelle: "Opportunités", icone: "opportunites" },
];

/**
 * Barre de navigation fixée en bas de l'écran, comme dans les applications mobiles,
 * avec le gros bouton « + » (opération de caisse ou tâche) au centre.
 */
export default function BarreNavigation() {
  const pathname = usePathname();

  if (PAGES_SANS_BARRE.some((page) => pathname.startsWith(page))) {
    return null;
  }

  const actif = (href: string) => (href === "/pme" ? pathname === "/pme" : pathname.startsWith(href));
  const lien = (o: (typeof ONGLETS)[number]) => (
    <Link
      key={o.href}
      href={o.href}
      aria-current={actif(o.href) ? "page" : undefined}
      className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
        actif(o.href) ? "text-agri" : "text-slate-500 hover:text-marine"
      }`}
    >
      <Icone nom={o.icone} className="h-6 w-6" />
      {o.libelle}
    </Link>
  );

  return (
    <nav
      aria-label="Navigation principale"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,42,68,0.06)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-2xl items-end px-2">
        {ONGLETS.slice(0, 2).map(lien)}
        <div className="flex flex-1 justify-center">
          <Link
            href="/pme/ajouter"
            aria-label="Ajouter une opération ou une tâche"
            className="-mt-6 mb-1.5 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-agri to-agri-fonce text-white shadow-lg shadow-green-900/25 ring-4 ring-white active:scale-95"
          >
            <Icone nom="plus" className="h-7 w-7" />
          </Link>
        </div>
        {ONGLETS.slice(2).map(lien)}
      </div>
    </nav>
  );
}

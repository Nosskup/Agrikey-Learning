"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES_SANS_BOUTON = ["/pme/connexion", "/pme/inscription", "/pme/bienvenue", "/pme/ajouter"];

/** Raccourci permanent « + Ajouter » (opération de caisse ou tâche). */
export default function BoutonAjouter() {
  const pathname = usePathname();

  if (PAGES_SANS_BOUTON.some((page) => pathname.startsWith(page))) {
    return null;
  }

  return (
    <Link
      href="/pme/ajouter"
      className="no-print fixed right-4 bottom-5 z-30 flex min-h-14 items-center gap-2 rounded-full bg-agri px-6 text-lg font-black text-white shadow-lg hover:bg-agri-fonce"
    >
      <span aria-hidden="true" className="text-2xl leading-none">+</span> Ajouter
    </Link>
  );
}

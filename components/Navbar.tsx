"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [menuOuvert, setMenuOuvert] = useState(false);

  useEffect(() => {
    async function verifierUtilisateur() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setChargement(false);
    }

    verifierUtilisateur();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function lienActif(path: string) {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(path);
  }

  async function seDeconnecter() {
    await supabase.auth.signOut();

    setUser(null);
    setMenuOuvert(false);

    router.push("/");
    router.refresh();
  }

  return (
    <header className="no-print sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          onClick={() => setMenuOuvert(false)}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-sm font-bold text-white">
            A
          </div>

          <div className="leading-tight">
            <div className="text-base font-bold text-slate-900">
              AGRIKEY
            </div>
            <div className="text-xs font-medium text-green-600">
              Learning
            </div>
          </div>
        </Link>

        {/* Navigation ordinateur */}
        <nav className="hidden items-center gap-7 md:flex">
          <Link
            href="/"
            className={`text-sm font-medium transition ${
              lienActif("/")
                ? "text-green-600"
                : "text-slate-600 hover:text-green-600"
            }`}
          >
            Accueil
          </Link>

          <Link
            href="/formations"
            className={`text-sm font-medium transition ${
              lienActif("/formations")
                ? "text-green-600"
                : "text-slate-600 hover:text-green-600"
            }`}
          >
            Formations
          </Link>

          {user && (
            <Link
              href="/mon-espace"
              className={`text-sm font-medium transition ${
                lienActif("/mon-espace")
                  ? "text-green-600"
                  : "text-slate-600 hover:text-green-600"
              }`}
            >
              Mon espace
            </Link>
          )}
        </nav>

        {/* Actions ordinateur */}
        <div className="hidden items-center gap-3 md:flex">
          {!chargement && !user && (
            <>
              <Link
                href="/connexion"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Se connecter
              </Link>

              <Link
                href="/inscription"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                S'inscrire
              </Link>
            </>
          )}

          {!chargement && user && (
            <button
              onClick={seDeconnecter}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Se déconnecter
            </button>
          )}
        </div>

        {/* Bouton mobile */}
        <button
          type="button"
          onClick={() => setMenuOuvert(!menuOuvert)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
          aria-label="Ouvrir le menu"
        >
          {menuOuvert ? "✕" : "☰"}
        </button>
      </div>

      {/* Menu mobile */}
      {menuOuvert && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-4 sm:px-6">

            <Link
              href="/"
              onClick={() => setMenuOuvert(false)}
              className={`rounded-lg px-3 py-3 text-sm font-medium ${
                lienActif("/")
                  ? "bg-green-50 text-green-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Accueil
            </Link>

            <Link
              href="/formations"
              onClick={() => setMenuOuvert(false)}
              className={`rounded-lg px-3 py-3 text-sm font-medium ${
                lienActif("/formations")
                  ? "bg-green-50 text-green-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Formations
            </Link>

            {user && (
              <Link
                href="/mon-espace"
                onClick={() => setMenuOuvert(false)}
                className={`rounded-lg px-3 py-3 text-sm font-medium ${
                  lienActif("/mon-espace")
                    ? "bg-green-50 text-green-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Mon espace
              </Link>
            )}

            <div className="mt-3 border-t border-slate-100 pt-3">
              {!chargement && !user && (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/connexion"
                    onClick={() => setMenuOuvert(false)}
                    className="rounded-lg px-3 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Se connecter
                  </Link>

                  <Link
                    href="/inscription"
                    onClick={() => setMenuOuvert(false)}
                    className="rounded-lg bg-green-600 px-3 py-3 text-center text-sm font-semibold text-white hover:bg-green-700"
                  >
                    S'inscrire
                  </Link>
                </div>
              )}

              {!chargement && user && (
                <button
                  onClick={seDeconnecter}
                  className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Se déconnecter
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
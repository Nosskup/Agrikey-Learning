import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { estAdmin } from "@/lib/pme/session";
import { deconnecter } from "./actions";
import BoutonAjouter from "@/components/pme/BoutonAjouter";

export const metadata: Metadata = {
  title: {
    default: "AGRIKEY PME — Gérez votre entreprise simplement",
    template: "%s | AGRIKEY PME",
  },
  description:
    "Caisse, projets, documents : l'outil de gestion simple et en français pour les petites entreprises maliennes.",
};

export const viewport: Viewport = {
  themeColor: "#0f2a44",
};

export default async function PmeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await estAdmin(supabase, user.id) : false;

  return (
    <div className="pme min-h-screen bg-slate-50 text-base text-slate-900">
      <header className="no-print sticky top-0 z-40 bg-marine text-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/pme" className="flex items-center gap-2 text-lg font-black">
            AGRIKEY <span className="rounded-md bg-agri px-2 py-0.5 text-base">PME</span>
          </Link>

          {user && (
            <form action={deconnecter}>
              <button
                type="submit"
                className="min-h-12 rounded-lg px-3 text-base font-semibold text-slate-200 hover:bg-marine-clair hover:text-white"
              >
                Se déconnecter
              </button>
            </form>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-6 pb-8">{children}</main>

      <footer className="no-print mx-auto max-w-2xl px-4 pb-28 text-center text-base text-slate-500">
        {user && (
          <>
            <Link href="/pme/compte" className="inline-block min-h-12 content-center px-2 underline">
              Mon compte
            </Link>
            {" · "}
            {admin && (
              <>
                <Link href="/pme/admin" className="inline-block min-h-12 content-center px-2 font-semibold text-agri underline">
                  Administration
                </Link>
                {" · "}
              </>
            )}
          </>
        )}
        <Link href="/pme/conditions" className="inline-block min-h-12 content-center px-2 underline">
          Conditions
        </Link>
        {" · "}
        <Link href="/pme/confidentialite" className="inline-block min-h-12 content-center px-2 underline">
          Confidentialité
        </Link>
      </footer>

      {user && <BoutonAjouter />}
    </div>
  );
}

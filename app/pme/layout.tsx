import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { estAdmin } from "@/lib/pme/session";
import { deconnecter } from "./actions";
import BarreNavigation from "@/components/pme/BarreNavigation";
import Icone from "@/components/pme/Icones";
import { EnregistrementApplication } from "@/components/pme/Installation";

export const metadata: Metadata = {
  title: {
    default: "AGRIKEY PME — Gérez votre entreprise simplement",
    template: "%s | AGRIKEY PME",
  },
  description:
    "Caisse, projets, documents : l'outil de gestion simple et en français pour les petites entreprises maliennes.",
  manifest: "/pme/manifest.webmanifest",
  appleWebApp: { capable: true, title: "AGRIKEY PME", statusBarStyle: "default" },
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
    <div className="pme min-h-screen bg-fond text-base text-slate-900">
      <header className="no-print sticky top-0 z-40 bg-linear-to-r from-marine to-marine-clair text-white shadow-md shadow-marine/20">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Link href="/pme" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo-emblem.png" alt="" className="h-full w-full object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-black tracking-tight">AGRIKEY</span>
              <span className="block text-xs font-bold tracking-[0.2em] text-green-300">PME</span>
            </span>
          </Link>

          {user && (
            <div className="flex items-center gap-1">
              <Link
                href="/pme/compte"
                aria-label="Mon compte"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <Icone nom="compte" className="h-5 w-5" />
              </Link>
              <form action={deconnecter}>
                <button
                  type="submit"
                  className="min-h-11 rounded-full px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white"
                >
                  Se déconnecter
                </button>
              </form>
            </div>
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

      {user && <BarreNavigation />}
      <EnregistrementApplication />
    </div>
  );
}

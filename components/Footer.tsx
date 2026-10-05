"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type FormationLien = {
  id: number;
  title: string;
};

export default function Footer() {
  const [formations, setFormations] = useState<FormationLien[]>([]);

  useEffect(() => {
    async function chargerFormations() {
      const { data } = await supabase
        .from("courses")
        .select("id, title")
        .eq("published", true)
        .order("id", { ascending: true })
        .limit(4);

      setFormations(data || []);
    }

    chargerFormations();
  }, []);

  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5">
                <img
                  src="/images/logo.png"
                  alt="AGRIKEY — De la stratégie à l'impact"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="text-xl font-black">
                AGRIKEY
                <span className="font-medium text-green-400"> Learning</span>
              </div>
            </div>

            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
              Des formations pratiques pour développer vos compétences,
              renforcer votre activité et progresser à votre rythme.
            </p>

            <p className="mt-4 text-sm font-medium text-slate-300">
              Apprendre · progresser · entreprendre
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Formations
            </h3>

            <div className="mt-4 flex flex-col gap-2.5 text-sm text-slate-400">
              <Link
                href="/formations"
                className="transition hover:text-green-400"
              >
                Toutes les formations
              </Link>

              {formations.map((formation) => (
                <Link
                  key={formation.id}
                  href={`/formations/${formation.id}`}
                  className="transition hover:text-green-400"
                >
                  {formation.title}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              AGRIKEY
            </h3>

            <div className="mt-4 flex flex-col gap-2.5 text-sm text-slate-400">
              <Link
                href="/mon-espace"
                className="transition hover:text-green-400"
              >
                Mon espace
              </Link>
              <Link
                href="/connexion"
                className="transition hover:text-green-400"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="transition hover:text-green-400"
              >
                Créer un compte
              </Link>
              <Link
                href="/partenaires"
                className="transition hover:text-green-400"
              >
                Devenir partenaire
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-xs text-slate-500">
          <p>© 2026 AGRIKEY Learning. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

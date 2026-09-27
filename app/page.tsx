"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type Formation = {
  id: number;
  title: string;
  category: string;
  level: string;
  price: number;
  duration: string;
  description: string | null;
  is_free: boolean;
};

const steps = [
  ["01", "Choisissez", "Trouvez une formation adaptée à votre objectif."],
  ["02", "Apprenez", "Suivez les leçons à votre rythme."],
  ["03", "Pratiquez", "Testez vos connaissances avec les quiz."],
  ["04", "Validez", "Terminez votre parcours et obtenez votre certificat."],
];

export default function HomePage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();

      const { data } = await supabase
        .from("courses")
        .select("id,title,category,level,price,duration,description,is_free")
        .eq("published", true)
        .order("id");

      setUser(auth.user);
      setFormations(data || []);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-green-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-2 lg:px-8 lg:py-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-green-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Formation en ligne
            </div>

            <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Développez vos
              <span className="block text-green-700">compétences.</span>
              Faites progresser
              <span className="block text-slate-700">votre activité.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Des formations pratiques pour les entrepreneurs,
              professionnels et porteurs de projets qui veulent
              développer des compétences directement utiles.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/formations"
                className="rounded-xl bg-green-700 px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg transition hover:bg-green-800"
              >
                Découvrir les formations →
              </Link>

              <Link
                href={user ? "/mon-espace" : "/inscription"}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-center text-sm font-bold text-slate-700 transition hover:border-green-300 hover:bg-green-50"
              >
                {user ? "Mon espace" : "Créer mon compte"}
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-5 text-sm text-slate-500">
              <span>✓ Formations pratiques</span>
              <span>✓ À votre rythme</span>
              <span>✓ Certificat</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="overflow-hidden rounded-[1.5rem] border border-green-100 bg-white shadow-xl shadow-green-900/10">
              <img
                src="/images/hero-agrikey.png?v=2"
                alt="Apprentissage en ligne avec AGRIKEY Learning"
                className="block h-[400px] w-full object-cover sm:h-[440px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* POURQUOI */}
      <section className="w-full bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="mx-auto w-full max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
              Pourquoi AGRIKEY Learning ?
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Apprenez des compétences utiles,
              <span className="block text-green-700">
                directement applicables.
              </span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
              Des formations pratiques pour vous aider à mieux comprendre,
              agir et progresser dans vos projets professionnels et
              entrepreneuriaux.
            </p>
          </div>

          <div className="mx-auto mt-10 grid w-full max-w-6xl grid-cols-1 gap-5 md:grid-cols-3">

            <article className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-6 transition duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-base font-black text-green-700">
                01
              </div>
              <h3 className="mt-5 text-xl font-black leading-tight text-slate-950">
                Des contenus pratiques
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Des formations conçues pour comprendre, appliquer et progresser
                dans des situations concrètes.
              </p>
            </article>

            <article className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-6 transition duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-base font-black text-green-700">
                02
              </div>
              <h3 className="mt-5 text-xl font-black leading-tight text-slate-950">
                Apprenez à votre rythme
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Accédez à vos contenus et avancez progressivement selon votre
                disponibilité.
              </p>
            </article>

            <article className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-6 transition duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-base font-black text-green-700">
                03
              </div>
              <h3 className="mt-5 text-xl font-black leading-tight text-slate-950">
                Suivez votre progression
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Leçons, quiz, progression et certificat réunis au même endroit
                pour suivre votre parcours.
              </p>
            </article>

          </div>
        </div>
      </section>

      {/* FORMATIONS */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-green-700">
                Nos formations
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                Développez vos compétences.
              </h2>
            </div>

            <Link
              href="/formations"
              className="hidden text-sm font-bold text-green-700 sm:block"
            >
              Toutes les formations →
            </Link>
          </div>

          {loading ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-80 animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {formations.slice(0, 2).map((formation) => (
                <article
                  key={formation.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-200">
                    {formation.id === 1 ? (
                      <img
                        src="/images/gestion-financiere.png?v=1"
                        alt="Formation Gestion financière pour entrepreneurs"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : formation.id === 2 ? (
                      <img
                        src="/images/gestion-entreprise.png?v=1"
                        alt="Formation Les bases de l'entrepreneuriat"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-green-800 via-green-700 to-emerald-500" />
                    )}

                    <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                      <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
                        {formation.category}
                      </span>

                      {formation.is_free && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-green-700 shadow-sm">
                          GRATUIT
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-lg bg-slate-100 px-3 py-1.5">
                        {formation.level}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-3 py-1.5">
                        {formation.duration}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-black leading-tight text-slate-950">
                      {formation.title}
                    </h3>

                    <p className="mt-3 min-h-[64px] text-sm leading-6 text-slate-600">
                      {formation.description ||
                        "Une formation pratique pour développer vos compétences."}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-4">
                      <div>
                        <p className="text-xs text-slate-400">Tarif</p>
                        <p className="mt-1 text-lg font-black text-slate-700">
                          {formation.is_free
                            ? "Gratuit"
                            : `${formation.price.toLocaleString("fr-FR")} FCFA`}
                        </p>
                      </div>

                      <Link
                        href={`/formations/${formation.id}`}
                        className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-800"
                      >
                        Découvrir →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-green-700">
              Votre parcours
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Comment ça marche ?
            </h2>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-4">
            {steps.map(([number, title, text]) => (
              <div key={number} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-700 text-sm font-black text-white shadow-md">
                  {number}
                </div>
                <h3 className="mt-4 text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[1.5rem] bg-gradient-to-br from-green-800 to-emerald-600 px-7 py-12 sm:px-10">
          <p className="text-sm font-bold uppercase tracking-widest text-green-100">
            Commencez maintenant
          </p>

          <h2 className="mt-2 max-w-2xl text-2xl font-black text-white sm:text-3xl">
            Votre prochaine compétence peut commencer aujourd'hui.
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-green-50">
            Découvrez les formations AGRIKEY Learning et construisez
            progressivement les compétences dont vous avez besoin.
          </p>

          <Link
            href="/formations"
            className="mt-6 inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-black text-green-800 shadow-lg transition hover:bg-green-50"
          >
            Découvrir les formations →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">

          <div className="grid gap-8 md:grid-cols-4">

            <div className="md:col-span-2">
              <div className="text-xl font-black">
                AGRIKEY
                <span className="font-medium text-green-400"> Learning</span>
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
                <Link href="/formations" className="transition hover:text-green-400">
                  Toutes les formations
                </Link>
                <Link href="/formations/1" className="transition hover:text-green-400">
                  Gestion financière
                </Link>
                <Link href="/formations/2" className="transition hover:text-green-400">
                  Les bases de l'entrepreneuriat
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                AGRIKEY
              </h3>

              <div className="mt-4 flex flex-col gap-2.5 text-sm text-slate-400">
                <Link href="/mon-espace" className="transition hover:text-green-400">
                  Mon espace
                </Link>
                <Link href="/connexion" className="transition hover:text-green-400">
                  Connexion
                </Link>
                <Link href="/inscription" className="transition hover:text-green-400">
                  Créer un compte
                </Link>
              </div>
            </div>

          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 AGRIKEY Learning. Tous droits réservés.</p>
            <p>Apprendre · progresser · entreprendre</p>
          </div>

        </div>
      </footer>

    </main>
  );
}
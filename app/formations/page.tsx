"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

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

export default function Formations() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [level, setLevel] = useState("Tous");
  const [type, setType] = useState("Toutes");

  useEffect(() => {
    async function loadFormations() {
      const { data, error } = await supabase
        .from("courses")
        .select(
          "id,title,category,level,price,duration,description,is_free"
        )
        .eq("published", true)
        .order("id");

      if (error) {
        setError(true);
      } else {
        setFormations(data || []);
      }

      setLoading(false);
    }

    loadFormations();
  }, []);

  const categories = [
    "Toutes",
    ...Array.from(
      new Set(formations.map((formation) => formation.category))
    ),
  ];

  const levels = [
    "Tous",
    ...Array.from(
      new Set(formations.map((formation) => formation.level))
    ),
  ];

  const filteredFormations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return formations.filter((formation) => {
      const matchesSearch =
        !query ||
        formation.title.toLowerCase().includes(query) ||
        formation.category.toLowerCase().includes(query) ||
        (formation.description || "").toLowerCase().includes(query);

      const matchesCategory =
        category === "Toutes" || formation.category === category;

      const matchesLevel =
        level === "Tous" || formation.level === level;

      const matchesType =
        type === "Toutes" ||
        (type === "Gratuites" && formation.is_free) ||
        (type === "Payantes" && !formation.is_free);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLevel &&
        matchesType
      );
    });
  }, [formations, search, category, level, type]);

  const resetFilters = () => {
    setSearch("");
    setCategory("Toutes");
    setLevel("Tous");
    setType("Toutes");
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* HERO */}
      <section className="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-14">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl">

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
              Notre catalogue
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Développez vos compétences
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Découvrez nos formations pratiques pour développer vos
              compétences et progresser dans vos projets professionnels
              et entrepreneuriaux.
            </p>

          </div>
        </div>
      </section>

      {/* CATALOGUE */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* FILTRES */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rechercher
                </label>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une formation..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Catégorie
                </label>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-green-600"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Niveau
                </label>

                <select
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-green-600"
                >
                  {levels.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Type
                </label>

                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-green-600"
                >
                  <option value="Toutes">Toutes</option>
                  <option value="Gratuites">Gratuites</option>
                  <option value="Payantes">Payantes</option>
                </select>
              </div>

            </div>
          </div>

          {/* ENTÊTE RÉSULTATS */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm font-bold text-slate-950">
                {filteredFormations.length} formation
                {filteredFormations.length > 1 ? "s" : ""}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Des contenus conçus pour apprendre et mettre en pratique.
              </p>
            </div>

            {(search ||
              category !== "Toutes" ||
              level !== "Tous" ||
              type !== "Toutes") && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-green-300 hover:text-green-700"
              >
                Réinitialiser les filtres
              </button>
            )}

          </div>

          {/* CHARGEMENT */}
          {loading && (
            <div className="mt-8 grid gap-6 md:grid-cols-2">

              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-[420px] animate-pulse rounded-2xl bg-slate-100"
                />
              ))}

            </div>
          )}

          {/* ERREUR */}
          {!loading && error && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">

              <p className="text-sm font-bold uppercase tracking-wider text-red-600">
                Erreur
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-950">
                Impossible de charger les formations
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Veuillez actualiser la page et réessayer.
              </p>

            </div>
          )}

          {/* AUCUN RÉSULTAT */}
          {!loading && !error && filteredFormations.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">

              <h2 className="text-xl font-black text-slate-900">
                Aucune formation trouvée
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Essayez de modifier votre recherche ou vos filtres.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800"
              >
                Voir toutes les formations
              </button>

            </div>
          )}

          {/* FORMATIONS */}
          {!loading && !error && filteredFormations.length > 0 && (
            <div className="mt-8 grid gap-6 md:grid-cols-2">

              {filteredFormations.map((formation) => (
                <article
                  key={formation.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >

                  {/* IMAGE */}
                  <div className="relative h-52 overflow-hidden bg-slate-200">

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

                      <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
                        {formation.category}
                      </span>

                      {formation.is_free && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-green-700 shadow-sm">
                          GRATUIT
                        </span>
                      )}

                    </div>
                  </div>

                  {/* CONTENU */}
                  <div className="flex flex-1 flex-col p-6">

                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">

                      <span className="rounded-lg bg-slate-100 px-3 py-1.5">
                        {formation.level}
                      </span>

                      <span className="rounded-lg bg-slate-100 px-3 py-1.5">
                        {formation.duration}
                      </span>

                    </div>

                    <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950">
                      {formation.title}
                    </h2>

                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600">
                      {formation.description ||
                        "Une formation pratique pour développer vos compétences."}
                    </p>

                    <div className="mt-auto flex items-end justify-between border-t border-slate-200 pt-5">

                      <div>
                        <p className="text-xs text-slate-400">
                          Tarif
                        </p>

                        <p className="mt-1 text-xl font-black text-slate-800">
                          {formation.is_free
                            ? "Gratuit"
                            : `${formation.price.toLocaleString("fr-FR")} FCFA`}
                        </p>
                      </div>

                      <Link
                        href={
                          formation.id === 1
                            ? "/formations/gestion-financiere"
                            : `/formations/${formation.id}`
                        }
                        className="rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
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

      {/* CTA */}
      <section className="bg-slate-50 px-6 pb-14 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl bg-gradient-to-br from-green-800 to-emerald-600 px-7 py-10 sm:px-10">

          <p className="text-xs font-bold uppercase tracking-widest text-green-100">
            Commencez votre parcours
          </p>

          <h2 className="mt-2 max-w-2xl text-2xl font-black text-white sm:text-3xl">
            Choisissez une compétence à développer aujourd'hui.
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-green-50">
            Apprenez progressivement et mettez vos nouvelles connaissances
            en pratique dans vos activités.
          </p>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">

          <div className="grid gap-8 md:grid-cols-4">

            <div className="md:col-span-2">

              <div className="text-xl font-black">
                AGRIKEY
                <span className="font-medium text-green-400">
                  {" "}Learning
                </span>
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
                Navigation
              </h3>

              <div className="mt-4 flex flex-col gap-2.5 text-sm text-slate-400">

                <Link href="/" className="transition hover:text-green-400">
                  Accueil
                </Link>

                <Link href="/formations" className="transition hover:text-green-400">
                  Formations
                </Link>

                <Link href="/mon-espace" className="transition hover:text-green-400">
                  Mon espace
                </Link>

              </div>

            </div>

            <div>

              <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                Compte
              </h3>

              <div className="mt-4 flex flex-col gap-2.5 text-sm text-slate-400">

                <Link href="/connexion" className="transition hover:text-green-400">
                  Connexion
                </Link>

                <Link href="/inscription" className="transition hover:text-green-400">
                  Créer un compte
                </Link>

              </div>

            </div>

          </div>

          <div className="mt-8 border-t border-white/10 pt-5 text-xs text-slate-500">
            © 2026 AGRIKEY Learning. Tous droits réservés.
          </div>

        </div>
      </footer>

    </main>
  );
}
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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

type Props = {
  formations: Formation[];
};

export default function FormationsCatalog({ formations }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [level, setLevel] = useState("Tous");
  const [type, setType] = useState("Toutes");

  const categories = [
    "Toutes",
    ...Array.from(new Set(formations.map((formation) => formation.category))),
  ];

  const levels = [
    "Tous",
    ...Array.from(new Set(formations.map((formation) => formation.level))),
  ];

  const filteredFormations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return formations.filter((formation) => {
      const matchesSearch =
        !query ||
        formation.title.toLowerCase().includes(query) ||
        (formation.description || "").toLowerCase().includes(query) ||
        formation.category.toLowerCase().includes(query);

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

  return (
    <>
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
              Découvrez des formations pratiques pour développer vos
              compétences et progresser dans vos projets professionnels
              et entrepreneuriaux.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

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
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Catégorie
                </label>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-green-600"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-green-600"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-green-600"
                >
                  <option value="Toutes">Toutes</option>
                  <option value="Gratuites">Gratuites</option>
                  <option value="Payantes">Payantes</option>
                </select>
              </div>

            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-950">
                {filteredFormations.length} formation
                {filteredFormations.length > 1 ? "s" : ""}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Des contenus conçus pour apprendre et mettre en pratique.
              </p>
            </div>

            {(search || category !== "Toutes" || level !== "Tous" || type !== "Toutes") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("Toutes");
                  setLevel("Tous");
                  setType("Toutes");
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-green-300 hover:text-green-700"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {filteredFormations.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
              <h2 className="text-xl font-black text-slate-900">
                Aucune formation trouvée
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Essayez de modifier votre recherche ou vos filtres.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">

              {filteredFormations.map((formation) => (
                <article
                  key={formation.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
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

      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-2xl bg-green-800 px-7 py-10 sm:px-10">

            <p className="text-xs font-bold uppercase tracking-widest text-green-200">
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
        </div>
      </section>
    </>
  );
}
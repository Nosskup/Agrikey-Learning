"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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

type Module = {
  id: number;
  title: string;
 
};

type Lesson = {
  id: number;
  module_id: number;
  title: string;
  type: string;
  order_number: number;
};

export default function FormationDetailPage() {
  const params = useParams();
  const formationId = Number(params.id);

  const [formation, setFormation] = useState<Formation | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    if (!formationId) return;

    async function loadFormation() {
      setLoading(true);
      setMessage("");
      setDataError("");

      const { data: formationData, error: formationError } =
        await supabase
          .from("courses")
          .select(
            "id,title,category,level,price,duration,description,is_free"
          )
          .eq("id", formationId)
          .eq("published", true)
          .single();

      if (formationError || !formationData) {
        setFormation(null);
        setDataError(
          formationError?.message || "Formation introuvable."
        );
        setLoading(false);
        return;
      }

      setFormation(formationData);

      const { data: modulesData, error: modulesError } =
        await supabase
          .from("modules")
          .select("id,title")
          .eq("course_id", formationId)
          ;

      if (modulesError) {
        console.error("Erreur modules :", modulesError);
        setDataError(
          `Erreur lors du chargement des modules : ${modulesError.message}`
        );
        setModules([]);
        setLessons([]);
        setLoading(false);
        return;
      }

      const loadedModules = modulesData || [];
      setModules(loadedModules);

      if (loadedModules.length > 0) {
        const moduleIds = loadedModules.map((module) => module.id);

        const { data: lessonsData, error: lessonsError } =
          await supabase
            .from("lessons")
            .select("id,module_id,title,type,order_number")
            .in("module_id", moduleIds)
            ;

        if (lessonsError) {
          console.error("Erreur leçons :", lessonsError);
          setDataError(
            `Erreur lors du chargement des leçons : ${lessonsError.message}`
          );
        }

        setLessons(lessonsData || []);
      } else {
        setLessons([]);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id,status")
          .eq("user_id", user.id)
          .eq("course_id", formationId)
          .eq("status", "active")
          .maybeSingle();

        setHasAccess(!!enrollment);
      }

      setLoading(false);
    }

    loadFormation();
  }, [formationId]);

  async function accederFormation() {
    setAccessLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Connectez-vous pour accéder à cette formation.");
      setAccessLoading(false);
      return;
    }

    const { error } = await supabase.rpc("enroll_in_free_course", {
      p_course_id: formationId,
    });

    if (error) {
      console.error(error);
      setMessage(
        "Impossible de vous inscrire à cette formation pour le moment."
      );
      setAccessLoading(false);
      return;
    }

    setHasAccess(true);
    setMessage("Vous êtes maintenant inscrit à cette formation.");
    setAccessLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="animate-pulse">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="mt-6 h-14 max-w-3xl rounded bg-slate-200" />
            <div className="mt-5 h-6 max-w-2xl rounded bg-slate-200" />
          </div>
        </section>
      </main>
    );
  }

  if (!formation) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <h1 className="text-3xl font-black text-slate-900">
              Formation introuvable
            </h1>
            <p className="mt-3 text-slate-600">
              {dataError}
            </p>
            <Link
              href="/formations"
              className="mt-7 inline-flex rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white hover:bg-green-800"
            >
              Retour aux formations
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const firstLesson = lessons[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      <section className="overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-emerald-700">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <Link
              href="/formations"
              className="text-sm font-semibold text-green-100 hover:text-white"
            >
              ← Retour aux formations
            </Link>

            <div className="mt-8 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
                {formation.category}
              </span>

              {formation.is_free && (
                <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-green-800">
                  GRATUIT
                </span>
              )}
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {formation.title}
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-green-50">
              {formation.description ||
                "Une formation pratique pour développer vos compétences et progresser dans vos projets."}
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-white">
              <span className="rounded-lg bg-white/10 px-4 py-2">
                {formation.level}
              </span>
              <span className="rounded-lg bg-white/10 px-4 py-2">
                {formation.duration}
              </span>
              <span className="rounded-lg bg-white/10 px-4 py-2">
                {lessons.length} leçon{lessons.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          <div className="space-y-8">

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
              <h2 className="text-2xl font-black text-slate-950">
                Ce que vous allez apprendre
              </h2>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                {[
                  "Comprendre les notions essentielles liées à votre activité",
                  "Mieux organiser et suivre votre activité",
                  "Prendre de meilleures décisions",
                  "Appliquer les connaissances à votre situation",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-2xl bg-slate-50 p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-black text-green-700">
                      ✓
                    </span>
                    <p className="text-sm leading-6 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
              <p className="text-xs font-bold uppercase tracking-widest text-green-700">
                Programme
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Programme de la formation
              </h2>

              {dataError && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700">
                    {dataError}
                  </p>
                </div>
              )}

              <div className="mt-7 space-y-4">
                {modules.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6">
                    <p className="text-sm text-slate-500">
                      Aucun module disponible pour le moment.
                    </p>
                  </div>
                ) : (
                  modules.map((module, index) => {
                    const moduleLessons = lessons
                      .filter((lesson) => lesson.module_id === module.id)
                      .sort(
                        (a, b) => a.order_number - b.order_number
                      );

                    return (
                      <div
                        key={module.id}
                        className="overflow-hidden rounded-2xl border border-slate-200"
                      >
                        <div className="flex items-center gap-4 bg-slate-50 px-5 py-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-sm font-black text-green-700">
                            {index + 1}
                          </div>

                          <div>
                            <h3 className="font-bold text-slate-900">
                              {module.title}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {moduleLessons.length} leçon
                              {moduleLessons.length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        {moduleLessons.length > 0 && (
                          <div className="divide-y divide-slate-100">
                            {moduleLessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between gap-4 px-5 py-4"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">
                                    ▶
                                  </span>

                                  <span className="text-sm font-medium text-slate-700">
                                    {lesson.title}
                                  </span>
                                </div>

                                {hasAccess ? (
                                  <Link
                                    href={`/formations/${formation.id}/lecons/${lesson.id}`}
                                    className="shrink-0 text-sm font-bold text-green-700 hover:text-green-800"
                                  >
                                    Ouvrir →
                                  </Link>
                                ) : (
                                  <span className="shrink-0 text-xs font-semibold text-slate-400">
                                    Verrouillée
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">

              <div className="bg-slate-950 p-7 text-white">
                <p className="text-sm text-slate-400">
                  Accès à la formation
                </p>

                <div className="mt-2 text-3xl font-black">
                  {formation.is_free
                    ? "Gratuit"
                    : `${formation.price.toLocaleString("fr-FR")} FCFA`}
                </div>
              </div>

              <div className="p-7">

                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Niveau</span>
                    <span className="font-bold text-slate-800">
                      {formation.level}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Durée</span>
                    <span className="font-bold text-slate-800">
                      {formation.duration}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Modules</span>
                    <span className="font-bold text-slate-800">
                      {modules.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Leçons</span>
                    <span className="font-bold text-slate-800">
                      {lessons.length}
                    </span>
                  </div>
                </div>

                <div className="my-6 border-t border-slate-200" />

                {hasAccess ? (
                  <div>
                    <div className="rounded-2xl bg-green-50 p-4">
                      <p className="text-sm font-bold text-green-800">
                        Vous avez accès à cette formation.
                      </p>
                    </div>

                    {firstLesson && (
                      <Link
                        href={`/formations/${formation.id}/lecons/${firstLesson.id}`}
                        className="mt-4 flex w-full items-center justify-center rounded-xl bg-green-700 px-5 py-4 text-sm font-bold text-white hover:bg-green-800"
                      >
                        Commencer la formation →
                      </Link>
                    )}
                  </div>
                ) : formation.is_free ? (
                  <div>
                    <button
                      onClick={accederFormation}
                      disabled={accessLoading}
                      className="w-full rounded-xl bg-green-700 px-5 py-4 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-60"
                    >
                      {accessLoading
                        ? "Inscription en cours..."
                        : "Accéder gratuitement"}
                    </button>

                    {message && (
                      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-600">
                        {message}
                      </p>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/paiement"
                    className="flex w-full items-center justify-center rounded-xl bg-green-700 px-5 py-4 text-sm font-bold text-white hover:bg-green-800"
                  >
                    Acheter la formation →
                  </Link>
                )}

              </div>
            </div>
          </aside>

        </div>
      </section>

      <section className="px-6 pb-16 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl bg-gradient-to-br from-green-800 to-emerald-600 px-7 py-12 sm:px-10">
          <h2 className="text-3xl font-black text-white">
            Prêt à commencer ?
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-green-50">
            Avancez à votre rythme et développez des compétences directement utiles à votre activité.
          </p>

          <Link
            href="/formations"
            className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-bold text-green-800 hover:bg-green-50"
          >
            Voir toutes les formations
          </Link>
        </div>
      </section>

    </main>
  );
}

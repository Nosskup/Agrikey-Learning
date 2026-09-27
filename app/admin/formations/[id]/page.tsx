"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Course = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  price: number;
  duration: string | null;
  published: boolean;
  is_free: boolean;
};

type Module = {
  id: number;
  title: string;
  course_id: number;
};

type Lesson = {
  id: number;
  title: string;
  module_id: number;
  order_number: number;
};

export default function AdminFormationPage() {
  const params = useParams();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [moduleTitle, setModuleTitle] = useState("");
  const [editingModuleId, setEditingModuleId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Vous devez être connecté.");
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profileError || profile?.role !== "admin") {
      throw new Error("Accès réservé aux administrateurs.");
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      await checkAdmin();

      const { data: courseData, error: courseError } =
        await supabase
          .from("courses")
          .select(
            "id, title, description, category, level, price, duration, published, is_free"
          )
          .eq("id", courseId)
          .single();

      if (courseError || !courseData) {
        throw new Error("Formation introuvable.");
      }

      setCourse(courseData);

      const { data: moduleData, error: moduleError } =
        await supabase
          .from("modules")
          .select("id, title, course_id")
          .eq("course_id", courseId)
          .order("id", { ascending: true });

      if (moduleError) {
        throw moduleError;
      }

      setModules(moduleData || []);

      if (moduleData && moduleData.length > 0) {
        const moduleIds = moduleData.map((module) => module.id);

        const { data: lessonData, error: lessonError } =
          await supabase
            .from("lessons")
            .select(
              "id, title, module_id, order_number"
            )
            .in("module_id", moduleIds)
            .order("order_number", {
              ascending: true,
            });

        if (lessonError) {
          throw lessonError;
        }

        setLessons(lessonData || []);
      } else {
        setLessons([]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [courseId]);

  function resetModuleForm() {
    setEditingModuleId(null);
    setModuleTitle("");
  }

  function startEditingModule(module: Module) {
    setEditingModuleId(module.id);
    setModuleTitle(module.title);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveModule() {
    if (!moduleTitle.trim()) {
      setError("Le titre du module est obligatoire.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (editingModuleId) {
        const { data, error: updateError } =
          await supabase
            .from("modules")
            .update({
              title: moduleTitle.trim(),
            })
            .eq("id", editingModuleId)
            .select("id, title, course_id")
            .single();

        if (updateError) {
          throw updateError;
        }

        setModules(
          modules.map((module) =>
            module.id === editingModuleId
              ? data
              : module
          )
        );

        setMessage("Module modifié avec succès.");
      } else {
        const { data, error: insertError } =
          await supabase
            .from("modules")
            .insert({
              course_id: courseId,
              title: moduleTitle.trim(),
            })
            .select("id, title, course_id")
            .single();

        if (insertError) {
          throw insertError;
        }

        setModules([...modules, data]);

        setMessage("Module créé avec succès.");
      }

      resetModuleForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer le module."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteModule(moduleId: number) {
    const moduleLessons = lessons.filter(
      (lesson) => lesson.module_id === moduleId
    );

    const confirmationMessage =
      moduleLessons.length > 0
        ? `Ce module contient ${moduleLessons.length} leçon(s). Supprimer le module supprimera également ses leçons. Continuer ?`
        : "Voulez-vous vraiment supprimer ce module ?";

    const confirmed = window.confirm(
      confirmationMessage
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { error: deleteError } =
        await supabase
          .from("modules")
          .delete()
          .eq("id", moduleId);

      if (deleteError) {
        throw deleteError;
      }

      setModules(
        modules.filter(
          (module) => module.id !== moduleId
        )
      );

      setLessons(
        lessons.filter(
          (lesson) => lesson.module_id !== moduleId
        )
      );

      if (editingModuleId === moduleId) {
        resetModuleForm();
      }

      setMessage("Module supprimé avec succès.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer le module."
      );
    } finally {
      setSaving(false);
    }
  }

  function getModuleLessons(moduleId: number) {
    return lessons
      .filter(
        (lesson) => lesson.module_id === moduleId
      )
      .sort(
        (a, b) =>
          a.order_number - b.order_number
      );
  }

  const totalLessons = lessons.length;

  const formatPrice = (price: number) => {
    if (price <= 0) {
      return "Gratuite";
    }

    return `${price.toLocaleString("fr-FR")} FCFA`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-32 rounded-2xl bg-white shadow-sm" />
            <div className="h-24 rounded-2xl bg-white shadow-sm" />
            <div className="h-64 rounded-2xl bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
          <p className="font-medium text-red-600">
            {error || "Formation introuvable."}
          </p>

          <a
            href="/admin"
            className="mt-6 inline-flex rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
          >
            Retour à l'administration
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <a
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-green-700"
          >
            <span className="text-lg">←</span>
            Retour à l'administration
          </a>

          <a
            href={`/formations/${courseId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-green-300 hover:text-green-700"
          >
            Voir la formation
            <span>↗</span>
          </a>
        </div>

        {/* Hero formation */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="bg-gradient-to-r from-green-800 via-green-700 to-emerald-600 px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                    {course.category || "Formation"}
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                    {course.level || "Tous niveaux"}
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                    {course.published
                      ? "Publiée"
                      : "Brouillon"}
                  </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {course.title}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-green-50 sm:text-base">
                  {course.description ||
                    "Gérez le contenu, les modules et les leçons de cette formation."}
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-xs font-medium text-green-100">
                  Tarif
                </p>
                <p className="mt-1 text-xl font-bold">
                  {course.is_free
                    ? "Gratuite"
                    : formatPrice(course.price)}
                </p>

                {course.duration && (
                  <p className="mt-1 text-xs text-green-100">
                    Durée : {course.duration}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-6 py-5">
              <p className="text-sm text-slate-500">
                Modules
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {modules.length}
              </p>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-slate-500">
                Leçons
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {totalLessons}
              </p>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-slate-500">
                Statut
              </p>
              <p
                className={`mt-1 text-lg font-bold ${
                  course.published
                    ? "text-green-700"
                    : "text-amber-600"
                }`}
              >
                {course.published
                  ? "En ligne"
                  : "Brouillon"}
              </p>
            </div>
          </div>
        </section>

        {/* Messages */}
        {(message || error) && (
          <div className="mt-6">
            {message && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr]">

          {/* Colonne gauche */}
          <aside className="space-y-6">

            {/* Formulaire module */}
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Programme
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {editingModuleId
                    ? "Modifier le module"
                    : "Ajouter un module"}
                </h2>

                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Organisez votre formation en plusieurs modules
                  pour structurer le parcours pédagogique.
                </p>
              </div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nom du module
              </label>

              <input
                type="text"
                value={moduleTitle}
                onChange={(event) =>
                  setModuleTitle(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    saveModule();
                  }
                }}
                placeholder="Ex. Comprendre les bases"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={saveModule}
                  disabled={saving}
                  className="w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Enregistrement..."
                    : editingModuleId
                    ? "Enregistrer les modifications"
                    : "Ajouter le module"}
                </button>

                {editingModuleId && (
                  <button
                    onClick={resetModuleForm}
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </section>

            {/* Aide */}
            <section className="rounded-2xl border border-green-100 bg-green-50 p-6">
              <p className="text-sm font-bold text-green-900">
                Organisation du contenu
              </p>

              <p className="mt-2 text-sm leading-6 text-green-800">
                Chaque module peut contenir plusieurs leçons.
                Depuis la gestion des leçons, vous pourrez ajouter
                le contenu pédagogique, les vidéos, les PDF et les
                quiz.
              </p>
            </section>
          </aside>

          {/* Colonne principale */}
          <section>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Contenu pédagogique
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Modules de la formation
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {modules.length} module
                  {modules.length > 1 ? "s" : ""} ·{" "}
                  {totalLessons} leçon
                  {totalLessons > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {modules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-green-700">
                  +
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  Aucun module pour le moment
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Commencez par créer le premier module de cette
                  formation dans le panneau à gauche.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {modules.map((module, index) => {
                  const moduleLessons =
                    getModuleLessons(module.id);

                  return (
                    <article
                      key={module.id}
                      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
                    >
                      {/* En-tête module */}
                      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-sm font-bold text-green-700">
                              {String(index + 1).padStart(2, "0")}
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                                Module {index + 1}
                              </p>

                              <h3 className="mt-1 text-lg font-bold text-slate-900">
                                {module.title}
                              </h3>

                              <p className="mt-1 text-sm text-slate-500">
                                {moduleLessons.length} leçon
                                {moduleLessons.length > 1
                                  ? "s"
                                  : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <a
                              href={`/admin/formations/${courseId}/modules/${module.id}`}
                              className="inline-flex items-center justify-center rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                            >
                              Gérer les leçons
                            </a>

                            <button
                              onClick={() =>
                                startEditingModule(module)
                              }
                              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Modifier
                            </button>

                            <button
                              onClick={() =>
                                deleteModule(module.id)
                              }
                              disabled={saving}
                              className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Liste des leçons */}
                      <div className="px-5 py-4 sm:px-6">
                        {moduleLessons.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                            <p className="text-sm font-medium text-slate-500">
                              Aucune leçon dans ce module.
                            </p>

                            <a
                              href={`/admin/formations/${courseId}/modules/${module.id}`}
                              className="mt-2 inline-block text-sm font-semibold text-green-700 hover:underline"
                            >
                              Ajouter la première leçon
                            </a>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {moduleLessons.map(
                              (lesson, lessonIndex) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center gap-4 py-3"
                                >
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                                    {lessonIndex + 1}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {lesson.title}
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-400">
                                      Leçon {lessonIndex + 1}
                                    </p>
                                  </div>

                                  <a
                                    href={`/admin/formations/${courseId}/modules/${module.id}`}
                                    className="hidden text-xs font-semibold text-green-700 hover:underline sm:block"
                                  >
                                    Gérer
                                  </a>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
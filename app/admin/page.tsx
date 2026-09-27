"use client";

import { useEffect, useState } from "react";
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

type CourseStats = {
  modules: number;
  lessons: number;
  learners: number;
};

export default function AdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Record<number, CourseStats>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("Débutant");
  const [price, setPrice] = useState("0");
  const [duration, setDuration] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [published, setPublished] = useState(false);

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
          .order("id", { ascending: false });

      if (courseError) {
        throw courseError;
      }

      const loadedCourses = courseData || [];
      setCourses(loadedCourses);

      const newStats: Record<number, CourseStats> = {};

      for (const course of loadedCourses) {
        const { data: moduleData, error: moduleError } =
          await supabase
            .from("modules")
            .select("id")
            .eq("course_id", course.id);

        if (moduleError) {
          throw moduleError;
        }

        const moduleIds =
          moduleData?.map((module) => module.id) || [];

        let lessonCount = 0;

        if (moduleIds.length > 0) {
          const { count, error: lessonError } =
            await supabase
              .from("lessons")
              .select("id", {
                count: "exact",
                head: true,
              })
              .in("module_id", moduleIds);

          if (lessonError) {
            throw lessonError;
          }

          lessonCount = count || 0;
        }

        const { count: learnerCount, error: learnerError } =
          await supabase
            .from("enrollments")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("course_id", course.id);

        if (learnerError) {
          throw learnerError;
        }

        newStats[course.id] = {
          modules: moduleIds.length,
          lessons: lessonCount,
          learners: learnerCount || 0,
        };
      }

      setStats(newStats);
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
  }, []);

  async function createCourse() {
    if (!title.trim()) {
      setError("Le titre de la formation est obligatoire.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { data, error: insertError } =
        await supabase
          .from("courses")
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            category: category.trim() || null,
            level: level.trim() || "Débutant",
            price: isFree ? 0 : Number(price) || 0,
            duration: duration.trim() || null,
            is_free: isFree,
            published,
          })
          .select(
            "id, title, description, category, level, price, duration, published, is_free"
          )
          .single();

      if (insertError) {
        throw insertError;
      }

      setCourses([data, ...courses]);

      setStats({
        ...stats,
        [data.id]: {
          modules: 0,
          lessons: 0,
          learners: 0,
        },
      });

      setTitle("");
      setDescription("");
      setCategory("");
      setLevel("Débutant");
      setPrice("0");
      setDuration("");
      setIsFree(true);
      setPublished(false);

      setMessage("Formation créée avec succès.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer la formation."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <p>Chargement de l'administration...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="text-sm font-semibold text-green-700">
            AGRIKEY
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Administration
          </h1>

          <p className="mt-2 text-gray-600">
            Gérez vos formations, modules, leçons et quiz.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg bg-green-100 p-4 text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-800">
            {error}
          </div>
        )}

        <section className="mb-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Formations
            </p>

            <p className="mt-2 text-3xl font-bold">
              {courses.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Modules
            </p>

            <p className="mt-2 text-3xl font-bold">
              {Object.values(stats).reduce(
                (total, stat) => total + stat.modules,
                0
              )}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Leçons
            </p>

            <p className="mt-2 text-3xl font-bold">
              {Object.values(stats).reduce(
                (total, stat) => total + stat.lessons,
                0
              )}
            </p>
          </div>
        </section>

        <section className="mb-10 rounded-xl bg-white p-8 shadow">
          <h2 className="mb-6 text-xl font-bold">
            Créer une formation
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la formation"
              className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
            />

            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Catégorie"
              className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
            />

            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-3"
            >
              <option value="Débutant">Débutant</option>
              <option value="Intermédiaire">
                Intermédiaire
              </option>
              <option value="Avancé">Avancé</option>
            </select>

            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Durée, ex : 4 heures"
              className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
            />

            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isFree}
              placeholder="Prix en FCFA"
              className="rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
            />

            <div className="flex items-center gap-6 rounded-lg border border-gray-200 px-4 py-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) =>
                    setIsFree(e.target.checked)
                  }
                />
                Formation gratuite
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) =>
                    setPublished(e.target.checked)
                  }
                />
                Publier
              </label>
            </div>
          </div>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Description de la formation"
            rows={5}
            className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
          />

          <button
            onClick={createCourse}
            disabled={saving}
            className="mt-4 rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving
              ? "Création..."
              : "Créer la formation"}
          </button>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Mes formations
              </h2>

              <p className="mt-1 text-gray-600">
                Accédez à la gestion de chaque formation.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {courses.map((course) => {
              const courseStats = stats[course.id] || {
                modules: 0,
                lessons: 0,
                learners: 0,
              };

              return (
                <div
                  key={course.id}
                  className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {course.title}
                    </h3>

                    <span
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                        course.published
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {course.published
                        ? "Publiée"
                        : "Brouillon"}
                    </span>
                  </div>

                  <p className="mt-4 text-gray-600">
                    {course.category || "Sans catégorie"}{" "}
                    · {course.level || "Sans niveau"}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className="rounded-full bg-gray-100 px-4 py-2 text-sm">
                      {course.is_free
                        ? "Gratuite"
                        : `${course.price.toLocaleString(
                            "fr-FR"
                          )} FCFA`}
                    </span>

                    <span className="rounded-full bg-gray-100 px-4 py-2 text-sm">
                      {course.duration || "Durée non définie"}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3 border-t border-gray-100 pt-5">
                    <div>
                      <p className="text-xs text-gray-500">
                        Modules
                      </p>
                      <p className="mt-1 font-bold">
                        {courseStats.modules}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Leçons
                      </p>
                      <p className="mt-1 font-bold">
                        {courseStats.lessons}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Apprenants
                      </p>
                      <p className="mt-1 font-bold">
                        {courseStats.learners}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href={
                        course.id === 1
                          ? "/formations/gestion-financiere"
                          : `/formations/${course.id}`
                      }
                      className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800"
                    >
                      Voir la formation
                    </a>

                    <a
                      href={`/admin/formations/${course.id}`}
                      className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
                    >
                      Gérer
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
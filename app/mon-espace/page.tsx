"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Course = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  price: number | null;
  duration: string | null;
  is_free: boolean;
};

type CompletionStatus = {
  course_id: number;
  total_lessons: number;
  completed_lessons: number;
  total_quizzes: number;
  passed_quizzes: number;
  lessons_completed: boolean;
  quizzes_completed: boolean;
  course_completed: boolean;
};

type CourseProgress = {
  course: Course;
  status: CompletionStatus;
  percentage: number;
  nextLessonId: number | null;
};

export default function MonEspacePage() {
  const [coursesProgress, setCoursesProgress] = useState<CourseProgress[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadMySpace();
  }, []);

  async function loadMySpace() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserEmail(user.email || "");

      // Récupérer les formations auxquelles l'utilisateur est inscrit
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (enrollmentError) {
        throw enrollmentError;
      }

      const courseIds = (enrollments || []).map(
        (enrollment) => enrollment.course_id
      );

      if (courseIds.length === 0) {
        setCoursesProgress([]);
        setLoading(false);
        return;
      }

      // Récupérer les formations
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select(
          "id, title, description, category, level, price, duration, is_free"
        )
        .in("id", courseIds)
        .order("id", { ascending: true });

      if (coursesError) {
        throw coursesError;
      }

      // Calculer l'état réel de chaque formation
      const results: CourseProgress[] = [];

      for (const course of courses || []) {
        const { data: statusData, error: statusError } =
          await supabase.rpc("get_course_completion_status", {
            p_user_id: user.id,
            p_course_id: course.id,
          });

        if (statusError) {
          throw statusError;
        }

        const status = statusData as CompletionStatus;

        const percentage =
          status.total_lessons > 0
            ? Math.round(
                (status.completed_lessons / status.total_lessons) * 100
              )
            : 0;

        // Détermine la prochaine leçon non terminée (toute la
        // formation, tous modules confondus, dans l'ordre) pour
        // que "Continuer la formation" reprenne exactement où
        // l'apprenant s'est arrêté, sans repasser par le sommaire.
        let nextLessonId: number | null = null;

        if (!status.course_completed) {
          const {
            data: courseModulesData,
            error: courseModulesError,
          } = await supabase
            .from("modules")
            .select("id")
            .eq("course_id", course.id)
            .order("id", { ascending: true });

          if (courseModulesError) {
            throw courseModulesError;
          }

          const moduleIds = (courseModulesData || []).map(
            (item) => item.id
          );

          if (moduleIds.length > 0) {
            const {
              data: courseLessonsData,
              error: courseLessonsError,
            } = await supabase
              .from("lessons")
              .select("id")
              .in("module_id", moduleIds)
              .order("module_id", { ascending: true })
              .order("order_number", { ascending: true });

            if (courseLessonsError) {
              throw courseLessonsError;
            }

            const lessonIds = (courseLessonsData || []).map(
              (item) => item.id
            );

            if (lessonIds.length > 0) {
              const {
                data: progressRows,
                error: progressRowsError,
              } = await supabase
                .from("lesson_progress")
                .select("lesson_id, completed")
                .eq("user_id", user.id)
                .in("lesson_id", lessonIds);

              if (progressRowsError) {
                throw progressRowsError;
              }

              const completedLessonIds = new Set(
                (progressRows || [])
                  .filter((row) => row.completed)
                  .map((row) => row.lesson_id)
              );

              const firstIncompleteLessonId = lessonIds.find(
                (id) => !completedLessonIds.has(id)
              );

              nextLessonId =
                firstIncompleteLessonId ?? lessonIds[0];
            }
          }
        }

        results.push({
          course,
          status,
          percentage,
          nextLessonId,
        });
      }

      setCoursesProgress(results);
    } catch (err: any) {
      console.error("Erreur Mon espace :", err);

      setError(
        err?.message ||
          "Une erreur est survenue lors du chargement de votre espace."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-6xl">
          <p>Chargement de votre espace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Mon espace
          </h1>

          {userEmail && (
            <p className="mt-2 text-gray-600">
              Connecté avec : {userEmail}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {coursesProgress.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              Aucune formation en cours
            </h2>

            <p className="mb-6 text-gray-600">
              Vous n'êtes inscrit à aucune formation pour le moment.
            </p>

            <Link
              href="/formations"
              className="inline-block rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
            >
              Découvrir les formations
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {coursesProgress.map(
              ({ course, status, percentage, nextLessonId }) => (
                <div
                  key={course.id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {course.title}
                      </h2>

                      {course.category && (
                        <p className="mt-1 text-sm text-gray-500">
                          {course.category}
                        </p>
                      )}
                    </div>

                    {status.course_completed ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                        Terminée
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                        En cours
                      </span>
                    )}
                  </div>

                  {course.description && (
                    <p className="mb-5 text-sm leading-6 text-gray-600">
                      {course.description}
                    </p>
                  )}

                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      Progression
                    </span>

                    <span className="font-semibold text-gray-900">
                      {percentage}%
                    </span>
                  </div>

                  <div className="mb-5 h-3 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-green-600 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="mb-6 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Leçons
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {status.completed_lessons} /{" "}
                        {status.total_lessons}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Quiz réussis
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {status.passed_quizzes} /{" "}
                        {status.total_quizzes}
                      </p>
                    </div>
                  </div>

                  {status.course_completed ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <p className="font-semibold text-green-800">
                          Formation terminée avec succès.
                        </p>

                        <p className="mt-1 text-sm text-green-700">
                          Vous avez terminé toutes les leçons et réussi les
                          quiz requis.
                        </p>
                      </div>

                      <Link
                        href={`/certificat/${course.id}`}
                        className="block w-full rounded-lg bg-green-700 px-5 py-3 text-center font-semibold text-white hover:bg-green-800"
                      >
                        Obtenir mon certificat
                      </Link>

                      <Link
                        href={
                          course.id === 1
                            ? "/formations/gestion-financiere"
                            : `/formations/${course.id}`
                        }
                        className="block w-full rounded-lg border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Revoir la formation
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={
                        nextLessonId
                          ? `/formations/${course.id}/lecons/${nextLessonId}`
                          : course.id === 1
                            ? "/formations/gestion-financiere"
                            : `/formations/${course.id}`
                      }
                      className="block w-full rounded-lg bg-green-700 px-5 py-3 text-center font-semibold text-white hover:bg-green-800"
                    >
                      Continuer la formation
                    </Link>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}
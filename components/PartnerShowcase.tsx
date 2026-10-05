"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import CourseCover from "./CourseCover";

type Course = {
  id: number;
  title: string;
  category: string | null;
  level: string | null;
  duration: string | null;
  is_free: boolean;
  image_url: string | null;
  instructor_name: string | null;
};

/**
 * Montre les formations réellement publiées sur la plateforme.
 * Rien n'est écrit en dur : si aucune formation n'est publiée, la section
 * n'apparaît pas (on ne montre jamais un catalogue vide à un partenaire).
 */
export default function PartnerShowcase() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("courses")
        .select(
          "id, title, category, level, duration, is_free, image_url, instructor_name"
        )
        .eq("published", true)
        .order("id", { ascending: false })
        .limit(6);

      if (!cancelled && !error && data) {
        setCourses(data as Course[]);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (courses.length === 0) return null;

  return (
    <section className="bg-slate-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-green-700">
          Du concret
        </p>

        <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Des formations déjà en ligne, que vous pouvez suivre dès maintenant
        </h2>

        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Ouvrez-en une comme le ferait un apprenant : objectifs, leçons
          structurées, exercices, quiz et certificat vérifiable.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/formations/${course.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
            >
              <CourseCover
                courseId={course.id}
                title={course.title}
                imageUrl={course.image_url}
              />

              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  {course.category && (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">
                      {course.category}
                    </span>
                  )}
                  {course.level && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                      {course.level}
                    </span>
                  )}
                  {course.is_free && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">
                      Gratuit
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-base font-bold leading-snug text-slate-900 group-hover:text-green-800">
                  {course.title}
                </h3>

                {(course.instructor_name || course.duration) && (
                  <p className="mt-2 text-xs text-slate-500">
                    {[course.instructor_name, course.duration]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/formations"
            className="text-sm font-bold text-green-700 hover:text-green-800"
          >
            Voir toutes les formations →
          </Link>
        </div>
      </div>
    </section>
  );
}

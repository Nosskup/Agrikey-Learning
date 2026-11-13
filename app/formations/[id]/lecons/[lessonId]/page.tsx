"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";
import LessonContent, {
  readingTimeMinutes,
} from "../../../../../components/LessonContent";

type Lesson = {
  id: number;
  module_id: number;
  title: string;
  content: string | null;
  type: string | null;
  video_url: string | null;
  pdf_url: string | null;
  order_number: number;
};

type Module = {
  id: number;
  title: string;
  course_id: number;
};

/**
 * Reconnaît un lien YouTube (toutes ses formes courantes :
 * youtube.com/watch?v=, youtu.be/, youtube.com/shorts/,
 * youtube.com/embed/) et renvoie son URL d'intégration (iframe).
 * Renvoie null si ce n'est pas un lien YouTube : dans ce cas, la
 * vidéo est traitée comme un fichier vidéo direct (.mp4...).
 */
function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\.|^m\./, "");

    let videoId: string | null = null;

    if (host === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v");
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/embed/")[1];
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/shorts/")[1];
      }
    } else {
      return null;
    }

    videoId = videoId ? videoId.split(/[?&]/)[0] : null;

    return videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = Number(params.id);
  const lessonId = Number(params.lessonId);  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>(
    []
  );
  const [isCompleted, setIsCompleted] = useState(false);
  // Identifiants des leçons terminées par l'apprenant dans cette formation
  // (sert au calcul réel de la progression du module et de la formation).
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [hasQuiz, setHasQuiz] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLesson() {
      setLoading(true);
      setError("");

      try {
        const { data: lessonData, error: lessonError } =
          await supabase
            .from("lessons")
            .select(
              "id, module_id, title, content, type, video_url, pdf_url, order_number"
            )
            .eq("id", lessonId)
            .maybeSingle();

        if (lessonError) {
          throw lessonError;
        }

        if (!lessonData) {
          setError("Cette leçon n'existe pas.");
          setLoading(false);
          return;
        }

        setLesson(lessonData);

        const { data: moduleData, error: moduleError } =
          await supabase
            .from("modules")
            .select("id, title, course_id")
            .eq("id", lessonData.module_id)
            .maybeSingle();

        if (moduleError) {
          throw moduleError;
        }

        if (!moduleData) {
          setError("Le module de cette leçon est introuvable.");
          setLoading(false);
          return;
        }

        if (moduleData.course_id !== courseId) {
          setError(
            "Cette leçon n'appartient pas à cette formation."
          );
          setLoading(false);
          return;
        }

        setModule(moduleData);

        const { data: lessonsData, error: lessonsError } =
          await supabase
            .from("lessons")
            .select(
              "id, module_id, title, content, type, video_url, pdf_url, order_number"
            )
            .eq("module_id", lessonData.module_id)
            .order("order_number", {
              ascending: true,
            });

        if (lessonsError) {
          throw lessonsError;
        }

        setLessons(lessonsData || []);

        // Récupère l'ensemble des leçons de TOUTE la formation
        // (tous modules confondus, dans l'ordre des modules puis
        // des leçons) afin que le bouton "leçon suivante" puisse
        // enchaîner sur le module suivant plutôt que de s'arrêter
        // à la fin du module courant.
        const { data: courseModulesData, error: courseModulesError } =
          await supabase
            .from("modules")
            .select("id")
            .eq("course_id", courseId)
            .order("id", { ascending: true });

        if (courseModulesError) {
          throw courseModulesError;
        }

        const moduleIds = (courseModulesData || []).map(
          (item) => item.id
        );

        let allLessonIds: number[] = [];

        if (moduleIds.length > 0) {
          const {
            data: courseLessonsData,
            error: courseLessonsError,
          } = await supabase
            .from("lessons")
            .select(
              "id, module_id, title, content, type, video_url, pdf_url, order_number"
            )
            .in("module_id", moduleIds)
            .order("module_id", { ascending: true })
            .order("order_number", { ascending: true });

          if (courseLessonsError) {
            throw courseLessonsError;
          }

          setCourseLessons(courseLessonsData || []);
          allLessonIds = (courseLessonsData || []).map(
            (item) => item.id
          );
        }

        // Cette leçon possède-t-elle un quiz ? Si oui, on affichera
        // un bouton pour y accéder (sans lui, une formation contenant
        // un quiz ne pourrait jamais être terminée).
        const { data: quizData } = await supabase
          .from("quizzes")
          .select("id")
          .eq("lesson_id", lessonId)
          .limit(1)
          .maybeSingle();

        setHasQuiz(!!quizData);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError(
            "Vous devez être connecté pour accéder à cette leçon."
          );
          setLoading(false);
          return;
        }

        const { data: progressData, error: progressError } =
          await supabase
            .from("lesson_progress")
            .select("completed")
            .eq("user_id", user.id)
            .eq("lesson_id", lessonId)
            .maybeSingle();

        if (progressError) {
          throw progressError;
        }

        setIsCompleted(progressData?.completed === true);

        // Leçons terminées de toute la formation (RLS : l'apprenant
        // ne voit que sa propre progression).
        if (allLessonIds.length > 0) {
          const { data: doneData } = await supabase
            .from("lesson_progress")
            .select("lesson_id")
            .eq("user_id", user.id)
            .eq("completed", true)
            .in("lesson_id", allLessonIds);

          setCompletedIds(
            (doneData || []).map((item) => item.lesson_id)
          );
        }
      } catch (err) {
        console.error("ERREUR CHARGEMENT LEÇON :", err);

        setError(
          "Une erreur est survenue lors du chargement de la leçon."
        );
      } finally {
        setLoading(false);
      }
    }

    if (courseId && lessonId) {
      loadLesson();
    }
  }, [courseId, lessonId]);

  async function markAsCompleted() {
    setSaving(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Vous devez être connecté.");
        setSaving(false);
        return;
      }

      const { data: existingProgress, error: checkError } =
        await supabase
          .from("lesson_progress")
          .select("id")
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId)
          .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingProgress) {
        const { error: updateError } = await supabase
          .from("lesson_progress")
          .update({
            completed: true,
          })
          .eq("id", existingProgress.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from("lesson_progress")
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
          });

        if (insertError) {
          throw insertError;
        }
      }

      setIsCompleted(true);
      setCompletedIds((previous) =>
        previous.includes(lessonId)
          ? previous
          : [...previous, lessonId]
      );
    } catch (err) {
      console.error(
        "ERREUR ENREGISTREMENT PROGRESSION :",
        err
      );

      setError(
        "Impossible d'enregistrer votre progression."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-5xl px-6 py-12">
          <p className="text-slate-600">
            Chargement de la leçon...
          </p>
        </section>
      </main>
    );
  }

  if (error || !lesson || !module) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Leçon introuvable
            </h1>

            <p className="mt-3 text-red-600">
              {error ||
                "Impossible de charger cette leçon."}
            </p>

            <button
              onClick={() =>
                router.push(`/formations/${courseId}`)
              }
              className="mt-6 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Retour à la formation
            </button>
          </div>
        </section>
      </main>
    );
  }

  const currentIndex = lessons.findIndex(
    (item) => item.id === lessonId
  );

  const courseIndex = courseLessons.findIndex(
    (item) => item.id === lessonId
  );

  const previousLesson =
    courseIndex > 0 ? courseLessons[courseIndex - 1] : null;

  const nextLesson =
    courseIndex >= 0 && courseIndex < courseLessons.length - 1
      ? courseLessons[courseIndex + 1]
      : null;

  const previousChangeDeModule =
    previousLesson !== null &&
    previousLesson.module_id !== lesson.module_id;

  const nextChangeDeModule =
    nextLesson !== null &&
    nextLesson.module_id !== lesson.module_id;

  // Section vidéo : affichée AVANT le texte pour une leçon de type « vidéo »,
  // et APRÈS le texte pour les autres types de leçon.
  const rawVideoUrl = (lesson.video_url || "").trim();
  const youtubeEmbedUrl = rawVideoUrl
    ? getYoutubeEmbedUrl(rawVideoUrl)
    : null;
  // Fichier vidéo direct (mp4, webm, ogg) en https uniquement.
  const isDirectVideo =
    !youtubeEmbedUrl &&
    /^https:\/\/\S+\.(mp4|webm|ogg)(\?\S*)?$/i.test(rawVideoUrl);
  const hasPlayableVideo = !!youtubeEmbedUrl || isDirectVideo;

  // Une leçon de type « vidéo » sans lien (ou avec un lien inutilisable)
  // affiche « Vidéo bientôt disponible » au lieu d'un lecteur cassé.
  // Les autres types de leçon n'affichent rien s'il n'y a pas de vidéo.
  const showVideoPlaceholder =
    lesson.type === "video" && !hasPlayableVideo;

  const videoSection =
    hasPlayableVideo || showVideoPlaceholder ? (
      <section className="mb-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Vidéo
        </h2>

        {youtubeEmbedUrl ? (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
            <iframe
              src={youtubeEmbedUrl}
              title={`Vidéo - ${lesson.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : isDirectVideo ? (
          <video controls className="w-full rounded-xl">
            <source src={rawVideoUrl} />
            Votre navigateur ne peut pas lire cette vidéo.
          </video>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
            <p className="text-lg font-bold text-slate-700">
              Vidéo bientôt disponible
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Vous pouvez déjà lire le contenu de la leçon
              ci-dessous.
            </p>
          </div>
        )}
      </section>
    ) : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        <button
          onClick={() =>
            router.push(`/formations/${courseId}`)
          }
          className="mb-6 text-sm font-semibold text-green-700 hover:underline"
        >
          ← Retour à la formation
        </button>

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-green-700">
            {module.title}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Leçon {currentIndex + 1} sur {lessons.length}
            {lesson.content &&
              ` · environ ${readingTimeMinutes(lesson.content)} min de lecture`}
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            {lesson.title}
          </h1>

          {courseLessons.length > 1 && courseIndex >= 0 && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: "Progression du module",
                  total: lessons.length,
                  done: lessons.filter((item) =>
                    completedIds.includes(item.id)
                  ).length,
                },
                {
                  label: "Progression de la formation",
                  total: courseLessons.length,
                  done: courseLessons.filter((item) =>
                    completedIds.includes(item.id)
                  ).length,
                },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{bar.label}</span>
                    <span>
                      {bar.done} / {bar.total} terminée
                      {bar.done > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-green-600 transition-all"
                      style={{
                        width: `${bar.total ? (bar.done / bar.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {lesson.type === "video" && videoSection}

        {lesson.content && (
          <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <LessonContent content={lesson.content} />
          </section>
        )}

        {lesson.type !== "video" && videoSection}

        {lesson.pdf_url && (
          <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Support pédagogique
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Document PDF
                </h2>
              </div>

              <a
                href={lesson.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
              >
                Ouvrir dans un nouvel onglet
              </a>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <iframe
                src={lesson.pdf_url}
                title={`Support PDF - ${lesson.title}`}
                className="h-[700px] w-full"
              />
            </div>
          </section>
        )}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {isCompleted ? (
            <div className="rounded-xl bg-green-50 p-4 text-center font-semibold text-green-700">
              ✓ Leçon terminée
            </div>
          ) : (
            <button
              onClick={markAsCompleted}
              disabled={saving}
              className="w-full rounded-xl bg-green-700 px-6 py-3.5 font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Enregistrement..."
                : "Marquer comme terminée"}
            </button>
          )}
        </section>

        {hasQuiz && (
          <section className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-green-700">
              Évaluation
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Quiz de cette leçon
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Réussissez ce quiz avec au moins 70 % de bonnes
              réponses pour valider la leçon. Il est nécessaire
              pour obtenir le certificat de la formation.
            </p>

            <button
              onClick={() =>
                router.push(
                  `/formations/${courseId}/lecons/${lessonId}/quiz`
                )
              }
              className="mt-4 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800"
            >
              Passer le quiz →
            </button>
          </section>
        )}

        <div className="flex flex-wrap justify-between gap-3">
          {previousLesson ? (
            <button
              onClick={() =>
                router.push(
                  `/formations/${courseId}/lecons/${previousLesson.id}`
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {previousChangeDeModule
                ? "← Module précédent"
                : "← Leçon précédente"}
            </button>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <button
              onClick={() =>
                router.push(
                  `/formations/${courseId}/lecons/${nextLesson.id}`
                )
              }
              className="rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
            >
              {nextChangeDeModule
                ? "Module suivant →"
                : "Leçon suivante →"}
            </button>
          ) : (
            <button
              onClick={() =>
                router.push(`/formations/${courseId}`)
              }
              className="rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
            >
              Retour à la formation
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
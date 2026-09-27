"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = Number(params.id);
  const lessonId = Number(params.lessonId);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [module, setModule] = useState<Module | null>(null);

  const [isCompleted, setIsCompleted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLesson() {
      setLoading(true);
      setError("");

      try {
        /*
         * 1. Récupérer la leçon
         */

        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .select(
            `
              id,
              module_id,
              title,
              content,
              type,
              video_url,
              pdf_url,
              order_number
            `
          )
          .eq("id", lessonId)
          .maybeSingle();

        if (lessonError) {
          console.error("ERREUR LEÇON :", lessonError);
          throw lessonError;
        }

        if (!lessonData) {
          setError("Cette leçon n'existe pas.");
          setLoading(false);
          return;
        }

        setLesson(lessonData);

        /*
         * 2. Récupérer le module
         */

        const { data: moduleData, error: moduleError } = await supabase
          .from("modules")
          .select("id, title, course_id")
          .eq("id", lessonData.module_id)
          .maybeSingle();

        if (moduleError) {
          console.error("ERREUR MODULE :", moduleError);
          throw moduleError;
        }

        if (!moduleData) {
          setError("Le module de cette leçon est introuvable.");
          setLoading(false);
          return;
        }

        /*
         * Vérifier que le module appartient bien
         * à la formation demandée dans l'URL.
         */

        if (moduleData.course_id !== courseId) {
          setError(
            "Cette leçon n'appartient pas à cette formation."
          );

          setLoading(false);
          return;
        }

        setModule(moduleData);

        /*
         * 3. Vérifier l'utilisateur connecté
         */

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

        /*
         * 4. Vérifier la progression de la leçon
         */

        const { data: progressData, error: progressError } =
          await supabase
            .from("lesson_progress")
            .select("completed")
            .eq("user_id", user.id)
            .eq("lesson_id", lessonId)
            .maybeSingle();

        if (progressError) {
          console.error(
            "ERREUR PROGRESSION :",
            progressError
          );

          throw progressError;
        }

        setIsCompleted(progressData?.completed === true);
      } catch (err) {
        console.error(
          "ERREUR CHARGEMENT DE LA LEÇON :",
          err
        );

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

  /*
   * Marquer la leçon comme terminée
   */

  async function markAsCompleted() {
    setSaving(true);
    setError("");

    try {
      /*
       * Vérifier l'utilisateur
       */

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Vous devez être connecté.");
        setSaving(false);
        return;
      }

      /*
       * Vérifier si une progression existe déjà
       */

      const { data: existingProgress, error: checkError } =
        await supabase
          .from("lesson_progress")
          .select("id")
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId)
          .maybeSingle();

      if (checkError) {
        console.error(
          "ERREUR VÉRIFICATION PROGRESSION :",
          checkError
        );

        throw checkError;
      }

      /*
       * Si la progression existe déjà,
       * on la met à jour.
       */

      if (existingProgress) {
        const { error: updateError } = await supabase
          .from("lesson_progress")
          .update({
            completed: true,
          })
          .eq("id", existingProgress.id);

        if (updateError) {
          console.error(
            "ERREUR UPDATE PROGRESSION :",
            updateError
          );

          throw updateError;
        }
      }

      /*
       * Sinon, on crée une nouvelle progression.
       */

      else {
        const { error: insertError } = await supabase
          .from("lesson_progress")
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
          });

        if (insertError) {
          console.error(
            "ERREUR INSERTION PROGRESSION :",
            insertError
          );

          throw insertError;
        }
      }

      /*
       * Mettre immédiatement l'interface à jour
       */

      setIsCompleted(true);
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

  /*
   * État de chargement
   */

  if (loading) {
    return (
      <main>
        <section>
          <p>Chargement de la leçon...</p>
        </section>
      </main>
    );
  }

  /*
   * État d'erreur
   */

  if (error || !lesson || !module) {
    return (
      <main>
        <section>
          <h1>Leçon introuvable</h1>

          <p>
            {error ||
              "Impossible de charger cette leçon."}
          </p>

          <button
            onClick={() =>
              router.push(`/formations/${courseId}`)
            }
          >
            Retour à la formation
          </button>
        </section>
      </main>
    );
  }

  /*
   * Page principale de la leçon
   */

  return (
    <main>
      <section>
        {/* Retour à la formation */}

        <button
          onClick={() =>
            router.push(`/formations/${courseId}`)
          }
        >
          ← Retour à la formation
        </button>

        {/* Informations sur le module */}

        <p>Module</p>

        <h1>{module.title}</h1>

        {/* Titre de la leçon */}

        <h2>{lesson.title}</h2>

        {/* Type de contenu */}

        {lesson.type && (
          <p>
            Type de contenu : {lesson.type}
          </p>
        )}

        {/* Contenu texte */}

        {lesson.content && (
          <article>
            {lesson.content
              .split("\n\n")
              .map((paragraph, index) => (
                <p key={index}>
                  {paragraph}
                </p>
              ))}
          </article>
        )}

        {/* Vidéo */}

        {lesson.video_url && (
          <div>
            <h3>Vidéo</h3>

            <video
              controls
              width="100%"
            >
              <source
                src={lesson.video_url}
              />

              Votre navigateur ne peut pas
              lire cette vidéo.
            </video>
          </div>
        )}

        {/* PDF */}

        {lesson.pdf_url && (
          <div>
            <h3>Support PDF</h3>

            <a
              href={lesson.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ouvrir le support PDF
            </a>
          </div>
        )}

        {/* Progression */}

        <div>
          {isCompleted ? (
            <div>
              <p>
                Leçon terminée
              </p>
            </div>
          ) : (
            <button
              onClick={markAsCompleted}
              disabled={saving}
            >
              {saving
                ? "Enregistrement..."
                : "Marquer comme terminée"}
            </button>
          )}
        </div>

        {/* Retour */}

        <div>
          <button
            onClick={() =>
              router.push(`/formations/${courseId}`)
            }
          >
            Retour à la formation
          </button>
        </div>
      </section>
    </main>
  );
}
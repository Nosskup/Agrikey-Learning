"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Module = {
  id: number;
  title: string;
  course_id: number;
};

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

export default function AdminModulePage() {
  const params = useParams();

  const courseId = Number(params.id);
  const moduleId = Number(params.moduleId);

  const [courseTitle, setCourseTitle] = useState("");
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonType, setLessonType] = useState("text");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState("");
  const [orderNumber, setOrderNumber] = useState("1");

  const [editingLessonId, setEditingLessonId] =
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
      setMessage("");

      await checkAdmin();

      const { data: courseData, error: courseError } =
        await supabase
          .from("courses")
          .select("id, title")
          .eq("id", courseId)
          .single();

      if (courseError || !courseData) {
        throw new Error("Formation introuvable.");
      }

      setCourseTitle(courseData.title);

      const { data: moduleData, error: moduleError } =
        await supabase
          .from("modules")
          .select("id, title, course_id")
          .eq("id", moduleId)
          .eq("course_id", courseId)
          .single();

      if (moduleError || !moduleData) {
        throw new Error("Module introuvable.");
      }

      setModule(moduleData);

      const { data: lessonData, error: lessonError } =
        await supabase
          .from("lessons")
          .select(
            "id, module_id, title, content, type, video_url, pdf_url, order_number"
          )
          .eq("module_id", moduleId)
          .order("order_number", {
            ascending: true,
          });

      if (lessonError) {
        throw lessonError;
      }

      setLessons(lessonData || []);
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
    if (courseId && moduleId) {
      loadData();
    }
  }, [courseId, moduleId]);

  function resetLessonForm() {
    setEditingLessonId(null);
    setLessonTitle("");
    setLessonContent("");
    setLessonType("text");
    setVideoUrl("");
    setPdfFile(null);
    setExistingPdfUrl("");
    setOrderNumber(String(lessons.length + 1));
  }

  function startEditingLesson(lesson: Lesson) {
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonContent(lesson.content || "");
    setLessonType(lesson.type || "text");
    setVideoUrl(lesson.video_url || "");
    setPdfFile(null);
    setExistingPdfUrl(lesson.pdf_url || "");
    setOrderNumber(String(lesson.order_number));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function uploadPdf(): Promise<string | null> {
    if (!pdfFile) {
      return existingPdfUrl || null;
    }

    if (pdfFile.type !== "application/pdf") {
      throw new Error("Le fichier doit être au format PDF.");
    }

    if (pdfFile.size > 20 * 1024 * 1024) {
      throw new Error("Le PDF ne doit pas dépasser 20 Mo.");
    }

    const fileExtension = "pdf";

    const safeName = pdfFile.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-");

    const fileName = `${Date.now()}-${safeName}`;

    const filePath = `${courseId}/${moduleId}/${fileName}`;

    const { error: uploadError } =
      await supabase.storage
        .from("course-pdfs")
        .upload(filePath, pdfFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: "application/pdf",
        });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("course-pdfs")
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function saveLesson() {
    if (!lessonTitle.trim()) {
      setError("Le titre de la leçon est obligatoire.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const uploadedPdfUrl = await uploadPdf();

      const lessonPayload = {
        title: lessonTitle.trim(),
        content: lessonContent.trim() || null,
        type: lessonType.trim() || "text",
        video_url: videoUrl.trim() || null,
        pdf_url: uploadedPdfUrl,
        order_number: Number(orderNumber) || 1,
      };

      if (editingLessonId) {
        const { data, error: updateError } =
          await supabase
            .from("lessons")
            .update(lessonPayload)
            .eq("id", editingLessonId)
            .eq("module_id", moduleId)
            .select(
              "id, module_id, title, content, type, video_url, pdf_url, order_number"
            )
            .single();

        if (updateError) {
          throw updateError;
        }

        setLessons(
          lessons
            .map((lesson) =>
              lesson.id === editingLessonId
                ? data
                : lesson
            )
            .sort(
              (a, b) =>
                a.order_number - b.order_number
            )
        );

        setMessage("Leçon modifiée avec succès.");
      } else {
        const { data, error: insertError } =
          await supabase
            .from("lessons")
            .insert({
              module_id: moduleId,
              ...lessonPayload,
            })
            .select(
              "id, module_id, title, content, type, video_url, pdf_url, order_number"
            )
            .single();

        if (insertError) {
          throw insertError;
        }

        setLessons(
          [...lessons, data].sort(
            (a, b) =>
              a.order_number - b.order_number
          )
        );

        setMessage("Leçon créée avec succès.");
      }

      resetLessonForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer la leçon."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteLesson(lessonId: number) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette leçon ? Cette action est définitive."
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
          .from("lessons")
          .delete()
          .eq("id", lessonId)
          .eq("module_id", moduleId);

      if (deleteError) {
        throw deleteError;
      }

      setLessons(
        lessons.filter(
          (lesson) => lesson.id !== lessonId
        )
      );

      if (editingLessonId === lessonId) {
        resetLessonForm();
      }

      setMessage("Leçon supprimée avec succès.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer la leçon."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="animate-pulse space-y-5">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-32 rounded-2xl bg-white shadow-sm" />
            <div className="h-96 rounded-2xl bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !module) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
          <p className="font-medium text-red-600">
            {error}
          </p>

          <Link
            href={`/admin/formations/${courseId}`}
            className="mt-6 inline-flex rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
          >
            Retour à la formation
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href={`/admin/formations/${courseId}`}
              className="text-sm font-semibold text-green-700 hover:underline"
            >
              ← Retour à la formation
            </Link>

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              {courseTitle}
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              {module?.title}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Gestion des leçons de ce module
            </p>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                {editingLessonId
                  ? "Modifier une leçon"
                  : "Nouvelle leçon"}
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {editingLessonId
                  ? "Modifier le contenu"
                  : "Ajouter une leçon au module"}
              </h2>
            </div>

            {editingLessonId && (
              <button
                type="button"
                onClick={resetLessonForm}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
            )}
          </div>

          <div className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Titre de la leçon
              </label>

              <input
                type="text"
                value={lessonTitle}
                onChange={(event) =>
                  setLessonTitle(event.target.value)
                }
                placeholder="Ex. Comprendre les notions financières de base"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Type de contenu
                </label>

                <select
                  value={lessonType}
                  onChange={(event) =>
                    setLessonType(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                >
                  <option value="text">
                    Texte
                  </option>
                  <option value="video">
                    Vidéo
                  </option>
                  <option value="pdf">
                    PDF
                  </option>
                  <option value="mixed">
                    Texte + vidéo + PDF
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ordre de la leçon
                </label>

                <input
                  type="number"
                  min="1"
                  value={orderNumber}
                  onChange={(event) =>
                    setOrderNumber(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Contenu de la leçon
              </label>

              <textarea
                value={lessonContent}
                onChange={(event) =>
                  setLessonContent(event.target.value)
                }
                rows={10}
                placeholder="Rédigez ici le contenu pédagogique de la leçon..."
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                URL de la vidéo
              </label>

              <input
                type="url"
                value={videoUrl}
                onChange={(event) =>
                  setVideoUrl(event.target.value)
                }
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Support PDF
              </label>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    setPdfFile(
                      event.target.files?.[0] || null
                    )
                  }
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-green-700 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-green-800"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Format accepté : PDF — taille maximale : 20 Mo.
                </p>

                {pdfFile && (
                  <div className="mt-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                    Fichier sélectionné :
                    <span className="ml-1 font-semibold">
                      {pdfFile.name}
                    </span>
                  </div>
                )}

                {!pdfFile && existingPdfUrl && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-slate-200">
                    <span className="font-medium text-slate-600">
                      Un PDF est déjà associé à cette leçon.
                    </span>

                    <a
                      href={existingPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-green-700 hover:underline"
                    >
                      Voir le PDF
                    </a>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={saveLesson}
              disabled={saving}
              className="rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Enregistrement..."
                : editingLessonId
                ? "Enregistrer les modifications"
                : "Ajouter la leçon"}
            </button>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Contenu du module
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {lessons.length} leçon
                {lessons.length > 1 ? "s" : ""}
              </h2>
            </div>
          </div>

          {lessons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="font-semibold text-slate-700">
                Aucune leçon pour le moment
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Utilisez le formulaire ci-dessus pour créer la première leçon.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <article
                  key={lesson.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-sm font-bold text-green-700">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900">
                          {lesson.title}
                        </h3>

                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>
                            Type : {lesson.type || "text"}
                          </span>

                          <span>•</span>

                          <span>
                            Ordre : {lesson.order_number}
                          </span>

                          {lesson.video_url && (
                            <>
                              <span>•</span>
                              <span className="text-green-700">
                                Vidéo
                              </span>
                            </>
                          )}

                          {lesson.pdf_url && (
                            <>
                              <span>•</span>
                              <span className="text-green-700">
                                PDF
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/formations/${courseId}/modules/${moduleId}/lessons/${lesson.id}/quiz`}
                        className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                      >
                        Gérer le quiz
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          startEditingLesson(lesson)
                        }
                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteLesson(lesson.id)
                        }
                        disabled={saving}
                        className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
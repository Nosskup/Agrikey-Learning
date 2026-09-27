"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Quiz = {
  id: number;
  lesson_id: number;
  title: string;
};

type Question = {
  id: number;
  quiz_id: number;
  question: string;
  order_number: number;
};

type Answer = {
  id: number;
  question_id: number;
  answer: string;
  is_correct: boolean;
  order_number: number;
};

export default function AdminQuizPage() {
  const params = useParams();

  const courseId = Number(params.id);
  const moduleId = Number(params.moduleId);
  const lessonId = Number(params.lessonId);

  const [lessonTitle, setLessonTitle] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [courseTitle, setCourseTitle] = useState("");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const [quizTitle, setQuizTitle] = useState("");

  const [questionText, setQuestionText] = useState("");
  const [questionOrder, setQuestionOrder] = useState("1");
  const [editingQuestionId, setEditingQuestionId] =
    useState<number | null>(null);

  const [answerTexts, setAnswerTexts] = useState<string[]>([
    "",
    "",
    "",
  ]);

  const [correctAnswerIndex, setCorrectAnswerIndex] =
    useState(0);

  const [editingAnswerId, setEditingAnswerId] =
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
      throw new Error(
        "Accès réservé aux administrateurs."
      );
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      await checkAdmin();

      const { data: lessonData, error: lessonError } =
        await supabase
          .from("lessons")
          .select("id, title, module_id")
          .eq("id", lessonId)
          .single();

      if (
        lessonError ||
        !lessonData ||
        Number(lessonData.module_id) !== moduleId
      ) {
        throw new Error("Leçon introuvable.");
      }

      setLessonTitle(lessonData.title);

      const { data: moduleData, error: moduleError } =
        await supabase
          .from("modules")
          .select("id, title, course_id")
          .eq("id", moduleId)
          .single();

      if (
        moduleError ||
        !moduleData ||
        Number(moduleData.course_id) !== courseId
      ) {
        throw new Error("Module introuvable.");
      }

      setModuleTitle(moduleData.title);

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

      const { data: quizData, error: quizError } =
        await supabase
          .from("quizzes")
          .select("id, lesson_id, title")
          .eq("lesson_id", lessonId)
          .maybeSingle();

      if (quizError) {
        throw quizError;
      }

      if (!quizData) {
        setQuiz(null);
        setQuestions([]);
        setAnswers([]);
        return;
      }

      setQuiz(quizData);
      setQuizTitle(quizData.title);

      const { data: questionData, error: questionError } =
        await supabase
          .from("questions")
          .select(
            "id, quiz_id, question, order_number"
          )
          .eq("quiz_id", quizData.id)
          .order("order_number", {
            ascending: true,
          });

      if (questionError) {
        throw questionError;
      }

      const loadedQuestions = questionData || [];

      setQuestions(loadedQuestions);

      if (loadedQuestions.length > 0) {
        const questionIds = loadedQuestions.map(
          (question) => question.id
        );

        const { data: answerData, error: answerError } =
          await supabase
            .from("answers")
            .select(
              "id, question_id, answer, is_correct, order_number"
            )
            .in("question_id", questionIds)
            .order("order_number", {
              ascending: true,
            });

        if (answerError) {
          throw answerError;
        }

        setAnswers(answerData || []);
      } else {
        setAnswers([]);
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
  }, [courseId, moduleId, lessonId]);

  function resetQuestionForm() {
    setEditingQuestionId(null);
    setQuestionText("");
    setQuestionOrder(
      String(questions.length + 1)
    );
    setAnswerTexts(["", "", ""]);
    setCorrectAnswerIndex(0);
    setEditingAnswerId(null);
  }

  function startEditingQuestion(
    question: Question
  ) {
    const questionAnswers = answers
      .filter(
        (answer) =>
          answer.question_id === question.id
      )
      .sort(
        (a, b) =>
          a.order_number - b.order_number
      );

    setEditingQuestionId(question.id);
    setQuestionText(question.question);
    setQuestionOrder(
      String(question.order_number)
    );

    const loadedTexts = questionAnswers.map(
      (answer) => answer.answer
    );

    while (loadedTexts.length < 3) {
      loadedTexts.push("");
    }

    setAnswerTexts(loadedTexts);

    const correctIndex =
      questionAnswers.findIndex(
        (answer) => answer.is_correct
      );

    setCorrectAnswerIndex(
      correctIndex >= 0 ? correctIndex : 0
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveQuiz() {
    if (!quizTitle.trim()) {
      setError("Le titre du quiz est obligatoire.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (quiz) {
        const { data, error: updateError } =
          await supabase
            .from("quizzes")
            .update({
              title: quizTitle.trim(),
            })
            .eq("id", quiz.id)
            .select(
              "id, lesson_id, title"
            )
            .single();

        if (updateError) {
          throw updateError;
        }

        setQuiz(data);
        setQuizTitle(data.title);

        setMessage(
          "Quiz modifié avec succès."
        );
      } else {
        const { data, error: insertError } =
          await supabase
            .from("quizzes")
            .insert({
              lesson_id: lessonId,
              title: quizTitle.trim(),
            })
            .select(
              "id, lesson_id, title"
            )
            .single();

        if (insertError) {
          throw insertError;
        }

        setQuiz(data);
        setQuizTitle(data.title);

        setMessage(
          "Quiz créé avec succès."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer le quiz."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuiz() {
    if (!quiz) {
      return;
    }

    const confirmed = window.confirm(
      "Supprimer ce quiz supprimera également toutes ses questions et réponses. Continuer ?"
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
          .from("quizzes")
          .delete()
          .eq("id", quiz.id);

      if (deleteError) {
        throw deleteError;
      }

      setQuiz(null);
      setQuestions([]);
      setAnswers([]);
      setQuizTitle("");
      resetQuestionForm();

      setMessage(
        "Quiz supprimé avec succès."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer le quiz."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveQuestion() {
    if (!quiz) {
      setError(
        "Créez d'abord le quiz avant d'ajouter une question."
      );
      return;
    }

    if (!questionText.trim()) {
      setError(
        "Le texte de la question est obligatoire."
      );
      return;
    }

    const validAnswers = answerTexts
      .map((answer) => answer.trim())
      .filter(Boolean);

    if (validAnswers.length < 2) {
      setError(
        "Une question doit avoir au moins deux réponses."
      );
      return;
    }

    if (
      correctAnswerIndex >= validAnswers.length
    ) {
      setError(
        "Sélectionnez une réponse correcte."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      let questionId = editingQuestionId;

      if (editingQuestionId) {
        const { data, error: updateError } =
          await supabase
            .from("questions")
            .update({
              question: questionText.trim(),
              order_number:
                Number(questionOrder) || 1,
            })
            .eq("id", editingQuestionId)
            .select(
              "id, quiz_id, question, order_number"
            )
            .single();

        if (updateError) {
          throw updateError;
        }

        questionId = data.id;

        setQuestions(
          questions
            .map((item) =>
              item.id === editingQuestionId
                ? data
                : item
            )
            .sort(
              (a, b) =>
                a.order_number -
                b.order_number
            )
        );

        await supabase
          .from("answers")
          .delete()
          .eq(
            "question_id",
            editingQuestionId
          );
      } else {
        const { data, error: insertError } =
          await supabase
            .from("questions")
            .insert({
              quiz_id: quiz.id,
              question:
                questionText.trim(),
              order_number:
                Number(questionOrder) || 1,
            })
            .select(
              "id, quiz_id, question, order_number"
            )
            .single();

        if (insertError) {
          throw insertError;
        }

        questionId = data.id;

        setQuestions(
          [...questions, data].sort(
            (a, b) =>
              a.order_number -
              b.order_number
          )
        );
      }

      if (!questionId) {
        throw new Error(
          "Impossible d'identifier la question."
        );
      }

      const answersToInsert =
        validAnswers.map(
          (answer, index) => ({
            question_id: questionId,
            answer,
            is_correct:
              index === correctAnswerIndex,
            order_number: index + 1,
          })
        );

      const {
        data: insertedAnswers,
        error: answerError,
      } = await supabase
        .from("answers")
        .insert(answersToInsert)
        .select(
          "id, question_id, answer, is_correct, order_number"
        );

      if (answerError) {
        throw answerError;
      }

      setAnswers((currentAnswers) => {
        const filtered = currentAnswers.filter(
          (answer) =>
            answer.question_id !==
            questionId
        );

        return [
          ...filtered,
          ...(insertedAnswers || []),
        ].sort(
          (a, b) =>
            a.order_number -
            b.order_number
        );
      });

      setMessage(
        editingQuestionId
          ? "Question modifiée avec succès."
          : "Question créée avec succès."
      );

      resetQuestionForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer la question."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(
    questionId: number
  ) {
    const confirmed = window.confirm(
      "Supprimer cette question supprimera également ses réponses. Continuer ?"
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
          .from("questions")
          .delete()
          .eq("id", questionId);

      if (deleteError) {
        throw deleteError;
      }

      setQuestions(
        questions.filter(
          (question) =>
            question.id !== questionId
        )
      );

      setAnswers(
        answers.filter(
          (answer) =>
            answer.question_id !==
            questionId
        )
      );

      if (editingQuestionId === questionId) {
        resetQuestionForm();
      }

      setMessage(
        "Question supprimée avec succès."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer la question."
      );
    } finally {
      setSaving(false);
    }
  }

  function updateAnswerText(
    index: number,
    value: string
  ) {
    setAnswerTexts((current) =>
      current.map((answer, i) =>
        i === index ? value : answer
      )
    );
  }

  function addAnswerField() {
    if (answerTexts.length >= 5) {
      setError(
        "Une question peut contenir au maximum 5 réponses."
      );
      return;
    }

    setAnswerTexts([
      ...answerTexts,
      "",
    ]);
  }

  function removeAnswerField(index: number) {
    if (answerTexts.length <= 2) {
      return;
    }

    const nextAnswers =
      answerTexts.filter(
        (_, i) => i !== index
      );

    setAnswerTexts(nextAnswers);

    if (correctAnswerIndex === index) {
      setCorrectAnswerIndex(0);
    } else if (
      correctAnswerIndex > index
    ) {
      setCorrectAnswerIndex(
        correctAnswerIndex - 1
      );
    }
  }

  function getQuestionAnswers(
    questionId: number
  ) {
    return answers
      .filter(
        (answer) =>
          answer.question_id ===
          questionId
      )
      .sort(
        (a, b) =>
          a.order_number -
          b.order_number
      );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-32 rounded-2xl bg-white" />
            <div className="h-64 rounded-2xl bg-white" />
          </div>
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
            href={`/admin/formations/${courseId}/modules/${moduleId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-green-700"
          >
            <span className="text-lg">←</span>
            Retour à la leçon
          </a>

          <a
            href={`/formations/${courseId}/lecons/${lessonId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-green-300 hover:text-green-700"
          >
            Voir la leçon
            <span>↗</span>
          </a>
        </div>

        {/* En-tête */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="bg-gradient-to-r from-green-800 via-green-700 to-emerald-600 px-6 py-8 text-white sm:px-8">
            <p className="text-sm text-green-100">
              {courseTitle}
            </p>

            <p className="mt-1 text-sm text-green-100">
              {moduleTitle}
            </p>

            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  Évaluation
                </span>

                <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  {lessonTitle}
                </h1>

                <p className="mt-2 text-sm text-green-50">
                  Configurez le quiz associé à cette leçon.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 px-6 py-4 text-center backdrop-blur">
                <p className="text-xs text-green-100">
                  Questions
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {questions.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Messages */}
        {(message || error) && (
          <div className="mt-6 space-y-3">
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

        {/* Configuration du quiz */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                Configuration
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {quiz
                  ? "Quiz de la leçon"
                  : "Créer le quiz"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Le quiz permet d'évaluer la compréhension de
                l'apprenant après la leçon.
              </p>
            </div>

            {quiz && (
              <button
                onClick={deleteQuiz}
                disabled={saving}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Supprimer le quiz
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={quizTitle}
              onChange={(event) =>
                setQuizTitle(event.target.value)
              }
              placeholder="Ex. Quiz - Comprendre les finances"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />

            <button
              onClick={saveQuiz}
              disabled={saving}
              className="rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-60"
            >
              {saving
                ? "Enregistrement..."
                : quiz
                ? "Enregistrer"
                : "Créer le quiz"}
            </button>
          </div>

          {quiz && (
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
              <span>
                {questions.length} question
                {questions.length > 1 ? "s" : ""}
              </span>

              <span>
                Réussite requise : 70 %
              </span>
            </div>
          )}
        </section>

        {quiz && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[410px_1fr]">

            {/* Formulaire question */}
            <aside>
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Éditeur
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {editingQuestionId
                    ? "Modifier la question"
                    : "Ajouter une question"}
                </h2>

                <div className="mt-6 space-y-5">

                  {/* Question */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Question
                    </label>

                    <textarea
                      value={questionText}
                      onChange={(event) =>
                        setQuestionText(
                          event.target.value
                        )
                      }
                      rows={4}
                      placeholder="Écrivez votre question..."
                      className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  {/* Ordre */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Ordre de la question
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={questionOrder}
                      onChange={(event) =>
                        setQuestionOrder(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  {/* Réponses */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">
                        Réponses
                      </label>

                      <span className="text-xs text-slate-400">
                        Sélectionnez la bonne réponse
                      </span>
                    </div>

                    <div className="space-y-3">
                      {answerTexts.map(
                        (answer, index) => (
                          <div
                            key={index}
                            className={`rounded-xl border p-3 ${
                              correctAnswerIndex ===
                              index
                                ? "border-green-300 bg-green-50"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setCorrectAnswerIndex(
                                    index
                                  )
                                }
                                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                  correctAnswerIndex ===
                                  index
                                    ? "border-green-600 bg-green-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                                aria-label={
                                  correctAnswerIndex ===
                                  index
                                    ? "Bonne réponse"
                                    : "Définir comme bonne réponse"
                                }
                              >
                                {correctAnswerIndex ===
                                  index && (
                                  <span className="text-xs">
                                    ✓
                                  </span>
                                )}
                              </button>

                              <input
                                type="text"
                                value={answer}
                                onChange={(event) =>
                                  updateAnswerText(
                                    index,
                                    event.target.value
                                  )
                                }
                                placeholder={`Réponse ${index + 1}`}
                                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                              />

                              {answerTexts.length >
                                2 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeAnswerField(
                                      index
                                    )
                                  }
                                  className="text-slate-400 hover:text-red-600"
                                  title="Supprimer cette réponse"
                                >
                                  ×
                                </button>
                              )}
                            </div>

                            {correctAnswerIndex ===
                              index && (
                              <p className="mt-2 pl-8 text-xs font-semibold text-green-700">
                                Bonne réponse
                              </p>
                            )}
                          </div>
                        )
                      )}
                    </div>

                    {answerTexts.length < 5 && (
                      <button
                        type="button"
                        onClick={addAnswerField}
                        className="mt-3 text-sm font-semibold text-green-700 hover:underline"
                      >
                        + Ajouter une réponse
                      </button>
                    )}
                  </div>

                  {/* Enregistrer */}
                  <div className="border-t border-slate-100 pt-5">
                    <button
                      onClick={saveQuestion}
                      disabled={saving}
                      className="w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-60"
                    >
                      {saving
                        ? "Enregistrement..."
                        : editingQuestionId
                        ? "Enregistrer la question"
                        : "Ajouter la question"}
                    </button>

                    {editingQuestionId && (
                      <button
                        onClick={resetQuestionForm}
                        disabled={saving}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </aside>

            {/* Questions */}
            <section>
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Contenu
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Questions du quiz
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Vérifiez les questions et les réponses configurées.
                </p>
              </div>

              {questions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-xl font-bold text-green-700">
                    ?
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    Aucune question
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Utilisez l'éditeur pour ajouter la première
                    question de ce quiz.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map(
                    (question, index) => {
                      const questionAnswers =
                        getQuestionAnswers(
                          question.id
                        );

                      return (
                        <article
                          key={question.id}
                          className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
                        >
                          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                            <div className="flex gap-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-sm font-bold text-green-700">
                                {String(
                                  index + 1
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                  Question{" "}
                                  {index + 1}
                                </p>

                                <h3 className="mt-1 text-base font-bold leading-6 text-slate-900">
                                  {question.question}
                                </h3>
                              </div>
                            </div>
                          </div>

                          <div className="px-5 py-4 sm:px-6">
                            <div className="space-y-2">
                              {questionAnswers.map(
                                (
                                  answer,
                                  answerIndex
                                ) => (
                                  <div
                                    key={
                                      answer.id
                                    }
                                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                                      answer.is_correct
                                        ? "border-green-200 bg-green-50"
                                        : "border-slate-100 bg-slate-50"
                                    }`}
                                  >
                                    <span
                                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                        answer.is_correct
                                          ? "bg-green-600 text-white"
                                          : "bg-white text-slate-500 ring-1 ring-slate-200"
                                      }`}
                                    >
                                      {answer.is_correct
                                        ? "✓"
                                        : String.fromCharCode(
                                            65 +
                                              answerIndex
                                          )}
                                    </span>

                                    <span
                                      className={`flex-1 text-sm ${
                                        answer.is_correct
                                          ? "font-semibold text-green-800"
                                          : "text-slate-700"
                                      }`}
                                    >
                                      {answer.answer}
                                    </span>

                                    {answer.is_correct && (
                                      <span className="text-xs font-bold text-green-700">
                                        Correcte
                                      </span>
                                    )}
                                  </div>
                                )
                              )}
                            </div>

                            {questionAnswers.length ===
                              0 && (
                              <p className="text-sm text-amber-600">
                                Aucune réponse configurée.
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4 sm:px-6">
                            <button
                              onClick={() =>
                                startEditingQuestion(
                                  question
                                )
                              }
                              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Modifier
                            </button>

                            <button
                              onClick={() =>
                                deleteQuestion(
                                  question.id
                                )
                              }
                              disabled={saving}
                              className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Supprimer
                            </button>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
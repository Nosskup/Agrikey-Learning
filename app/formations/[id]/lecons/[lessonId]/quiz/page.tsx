"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Quiz = {
  id: number;
  lesson_id: number;
  title: string;
};

type Answer = {
  id: number;
  question_id: number;
  answer: string;
  order_number: number;
};

type Question = {
  id: number;
  question: string;
  order_number: number;
  answers: Answer[];
};

type SavedAnswer = {
  question_id: number;
  answer_id: number;
};

type QuizResult = {
  score: number;
  total_questions: number;
  correct_answers: number;
  lesson_completed: boolean;
};

export default function QuizPage() {
  const params = useParams();

  const courseId = Number(params.id);
  const lessonId = Number(params.lessonId);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [result, setResult] = useState<QuizResult | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    loadQuiz();
  }, [lessonId]);

  async function loadQuiz() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(
          "Vous devez être connecté pour accéder au quiz."
        );
        setLoading(false);
        return;
      }

      const { data: quizData, error: quizError } =
        await supabase
          .from("quizzes")
          .select("id, lesson_id, title")
          .eq("lesson_id", lessonId)
          .single();

      if (quizError) {
        throw quizError;
      }

      setQuiz(quizData);

      const { data: questionData, error: questionError } =
        await supabase
          .from("questions")
          .select("id, question, order_number")
          .eq("quiz_id", quizData.id)
          .order("order_number", {
            ascending: true,
          });

      if (questionError) {
        throw questionError;
      }

      const questionIds = (questionData || []).map(
        (question) => question.id
      );

      let answerData: Answer[] = [];

      if (questionIds.length > 0) {
        const {
          data,
          error: answerError,
        } = await supabase
          .from("quiz_answer_options")
          .select(
            "id, question_id, answer, order_number"
          )
          .in("question_id", questionIds)
          .order("order_number", {
            ascending: true,
          });

        if (answerError) {
          throw answerError;
        }

        answerData = data || [];
      }

      const finalQuestions: Question[] =
        (questionData || []).map((question) => ({
          ...question,
          answers: answerData.filter(
            (answer) =>
              answer.question_id === question.id
          ),
        }));

      setQuestions(finalQuestions);

      const {
        data: savedAnswers,
        error: savedAnswersError,
      } = await supabase
        .from("quiz_answers")
        .select("question_id, answer_id")
        .eq("user_id", user.id)
        .eq("quiz_id", quizData.id);

      if (savedAnswersError) {
        throw savedAnswersError;
      }

      const restoredSelections: Record<
        number,
        number
      > = {};

      (savedAnswers || []).forEach(
        (saved: SavedAnswer) => {
          restoredSelections[
            Number(saved.question_id)
          ] = Number(saved.answer_id);
        }
      );

      setSelectedAnswers(restoredSelections);
    } catch (err: any) {
      console.error(
        "Erreur chargement quiz :",
        err
      );

      setError(
        err?.message ||
          "Une erreur est survenue lors du chargement du quiz."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(
    questionId: number,
    answerId: number
  ) {
    setSelectedAnswers((previous) => ({
      ...previous,
      [questionId]: answerId,
    }));

    setResult(null);
    setError("");
  }

  async function handleSubmit() {
    if (!quiz) return;

    setError("");
    setResult(null);

    const unansweredQuestions = questions.filter(
      (question) =>
        !selectedAnswers[question.id]
    );

    if (unansweredQuestions.length > 0) {
      setError(
        `Veuillez répondre à toutes les questions avant de valider le quiz. Il reste ${unansweredQuestions.length} question(s).`
      );
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Vous devez être connecté."
        );
      }

      const answers = questions.map(
        (question) => ({
          question_id: question.id,
          answer_id:
            selectedAnswers[question.id],
        })
      );

      const {
        data,
        error: rpcError,
      } = await supabase.rpc(
        "submit_quiz_attempt",
        {
          p_quiz_id: quiz.id,
          p_answers: answers,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      setResult({
        score: data.score,
        total_questions:
          data.total_questions,
        correct_answers:
          data.correct_answers,
        lesson_completed:
          data.lesson_completed,
      });
    } catch (err: any) {
      console.error(
        "Erreur validation quiz :",
        err
      );

      setError(
        err?.message ||
          "Une erreur est survenue lors de la validation du quiz."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="animate-pulse">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="mt-8 h-10 max-w-2xl rounded bg-slate-200" />
            <div className="mt-4 h-5 max-w-xl rounded bg-slate-200" />

            <div className="mt-10 space-y-5">
              <div className="h-48 rounded-3xl bg-slate-200" />
              <div className="h-48 rounded-3xl bg-slate-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !quiz) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-600">
              !
            </div>

            <h1 className="mt-6 text-2xl font-black text-slate-900">
              Impossible de charger le quiz
            </h1>

            <p className="mt-3 text-slate-600">
              {error}
            </p>

            <Link
              href={`/formations/${courseId}/lecons/${lessonId}`}
              className="mt-7 inline-flex rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white hover:bg-green-800"
            >
              Retour à la leçon
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!quiz) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">
              Quiz introuvable
            </h1>

            <p className="mt-3 text-slate-600">
              Aucun quiz n'est disponible pour cette leçon.
            </p>

            <Link
              href={`/formations/${courseId}/lecons/${lessonId}`}
              className="mt-7 inline-flex rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Retour à la leçon
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const answeredCount = questions.filter(
    (question) =>
      !!selectedAnswers[question.id]
  ).length;

  const progress =
    questions.length > 0
      ? Math.round(
          (answeredCount / questions.length) * 100
        )
      : 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* En-tête */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5 lg:px-8">
          <Link
            href={`/formations/${courseId}/lecons/${lessonId}`}
            className="text-sm font-semibold text-green-700 transition hover:text-green-800"
          >
            ← Retour à la leçon
          </Link>

          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-green-700">
              Évaluation
            </p>

            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              {quiz.title}
            </h1>

            <p className="mt-3 text-base text-slate-600">
              Répondez aux questions puis validez votre quiz.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-green-600 transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>

            <p className="shrink-0 text-sm font-bold text-slate-500">
              {answeredCount}/{questions.length}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold leading-6 text-red-700">
              {error}
            </p>
          </div>
        )}

        {result && (
          <div
            className={`mb-8 overflow-hidden rounded-3xl border p-7 ${
              result.lesson_completed
                ? "border-green-200 bg-green-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p
                  className={`text-xs font-bold uppercase tracking-widest ${
                    result.lesson_completed
                      ? "text-green-700"
                      : "text-amber-700"
                  }`}
                >
                  Résultat
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  {result.score}%
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Vous avez obtenu{" "}
                  <strong>
                    {result.correct_answers}
                  </strong>{" "}
                  bonne
                  {result.correct_answers > 1
                    ? "s"
                    : ""}{" "}
                  réponse
                  {result.correct_answers > 1
                    ? "s"
                    : ""}{" "}
                  sur{" "}
                  <strong>
                    {result.total_questions}
                  </strong>
                  .
                </p>

                {result.lesson_completed ? (
                  <p className="mt-3 font-bold text-green-800">
                    ✓ Félicitations, cette leçon est validée.
                  </p>
                ) : (
                  <p className="mt-3 font-semibold text-amber-800">
                    Le score minimum requis n'est pas atteint.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                {result.lesson_completed && (
                  <Link
                    href={`/formations/${courseId}/lecons/${lessonId}`}
                    className="rounded-xl bg-green-700 px-5 py-3 text-center text-sm font-bold text-white hover:bg-green-800"
                  >
                    Retour à la leçon
                  </Link>
                )}

                {!result.lesson_completed && (
                  <button
                    onClick={() => setResult(null)}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-white"
                  >
                    Réessayer
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <section
              key={question.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-sm font-black text-green-700">
                    {index + 1}
                  </div>

                  <h2 className="pt-1 text-lg font-black leading-7 text-slate-950 sm:text-xl">
                    {question.question}
                  </h2>
                </div>
              </div>

              <div className="space-y-3 p-5 sm:p-7">
                {question.answers.map((answer) => {
                  const selected =
                    selectedAnswers[
                      question.id
                    ] === answer.id;

                  return (
                    <label
                      key={answer.id}
                      className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                        selected
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200 bg-white hover:border-green-300 hover:bg-green-50/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={answer.id}
                        checked={selected}
                        onChange={() =>
                          handleSelect(
                            question.id,
                            answer.id
                          )
                        }
                        className="mt-1 h-5 w-5 accent-green-600"
                      />

                      <span
                        className={`text-base leading-7 ${
                          selected
                            ? "font-semibold text-green-900"
                            : "text-slate-700"
                        }`}
                      >
                        {answer.answer}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Validation */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="font-bold text-slate-900">
                Prêt à valider ?
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {answeredCount === questions.length
                  ? "Toutes les questions ont reçu une réponse."
                  : `Il reste ${
                      questions.length -
                      answeredCount
                    } question(s) à compléter.`}
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={
                submitting ||
                questions.length === 0
              }
              className="rounded-xl bg-green-700 px-7 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Validation en cours..."
                : "Valider mon quiz"}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
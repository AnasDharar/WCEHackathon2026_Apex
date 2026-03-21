"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import {
  ASSESSMENT_CATALOG,
  countAnswered,
  flattenQuestions,
  isAssessmentComplete,
  normalizeAnswers,
  totalQuestions,
} from "@/lib/assessmentCatalog";

function createAnswerPatch(answers, testId, questionIndex, value) {
  const next = { ...answers };
  const testAnswers = Array.isArray(next[testId]) ? [...next[testId]] : [];
  testAnswers[questionIndex] = value;
  next[testId] = testAnswers;
  return next;
}

function getFirstUnansweredIndex(questions, answers) {
  const firstUnanswered = questions.findIndex(
    (item) => !Number.isInteger(answers?.[item.testId]?.[item.questionIndex]),
  );
  return firstUnanswered >= 0 ? firstUnanswered : 0;
}

function getNextUnansweredIndex(questions, answers, currentIndex) {
  const nextUnanswered = questions.findIndex(
    (item, index) =>
      index > currentIndex && !Number.isInteger(answers?.[item.testId]?.[item.questionIndex]),
  );

  if (nextUnanswered >= 0) {
    return nextUnanswered;
  }

  const firstUnanswered = getFirstUnansweredIndex(questions, answers);
  if (!Number.isInteger(answers?.[questions[firstUnanswered]?.testId]?.[questions[firstUnanswered]?.questionIndex])) {
    return firstUnanswered;
  }

  return Math.min(currentIndex, questions.length - 1);
}

function formatDateTime(value) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AssessmentWizard({
  mode = "retake",
  presentation = "page",
  onClose,
  onCompleted,
}) {
  const router = useRouter();
  const questions = useMemo(() => flattenQuestions(ASSESSMENT_CATALOG), []);
  const questionCount = useMemo(() => totalQuestions(ASSESSMENT_CATALOG), []);
  const [sessionId, setSessionId] = useState(null);
  const [answers, setAnswers] = useState(() => normalizeAnswers());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const completionSentRef = useRef(false);
  const answerRequestInFlightRef = useRef(false);

  const answeredQuestions = useMemo(
    () => countAnswered(answers, ASSESSMENT_CATALOG),
    [answers],
  );
  const progressPercent = questionCount > 0 ? Math.round((answeredQuestions / questionCount) * 100) : 0;
  const currentQuestion = questions[currentQuestionIndex] || null;
  const currentAnswer = currentQuestion
    ? answers?.[currentQuestion.testId]?.[currentQuestion.questionIndex]
    : null;
  const isComplete = isAssessmentComplete(answers, ASSESSMENT_CATALOG);
  const isModal = presentation === "modal";

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      setIsInitializing(true);
      setError("");

      try {
        if (mode === "initial") {
          const latestResponse = await api.get("/assessments/latest");
          const latest = latestResponse?.data || null;
          if (latest?.id) {
            router.replace("/home");
            return;
          }
        }

        const sessionResponse = await api.post("/assessments/sessions", { mode });
        const session = sessionResponse?.data || null;
        if (!mounted || !session?.id) {
          return;
        }

        const normalizedAnswers = normalizeAnswers(session.answers);
        setSessionId(session.id);
        setAnswers(normalizedAnswers);
        setCurrentQuestionIndex(getFirstUnansweredIndex(questions, normalizedAnswers));
        setIsHydrated(true);
      } catch (caughtError) {
        if (mounted) {
          setError(caughtError.message || "Failed to start the assessment session.");
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    }

    void initialize();
    return () => {
      mounted = false;
    };
  }, [mode, questions, router]);

  useEffect(() => {
    if (!result || completionSentRef.current) {
      return;
    }

    completionSentRef.current = true;
    if (typeof onCompleted === "function") {
      onCompleted(result);
    }
  }, [onCompleted, result]);

  const handleAnswerSelect = async (value) => {
    if (!currentQuestion || !sessionId || answerRequestInFlightRef.current || isSubmitting) {
      return;
    }

    answerRequestInFlightRef.current = true;
    const questionAtSelection = currentQuestion;
    const questionIndexAtSelection = currentQuestionIndex;
    const nextAnswers = createAnswerPatch(
      answers,
      questionAtSelection.testId,
      questionAtSelection.questionIndex,
      value,
    );

    setAnswers(nextAnswers);
    setError("");
    setSaveError("");
    setIsSaving(true);

    try {
      await api.patch(`/assessments/sessions/${sessionId}/answers`, {
        test_id: questionAtSelection.testId,
        question_index: questionAtSelection.questionIndex,
        answer_value: value,
      });
      setCurrentQuestionIndex(getNextUnansweredIndex(questions, nextAnswers, questionIndexAtSelection));
    } catch (caughtError) {
      setSaveError(caughtError.message || "Failed to save this answer.");
    } finally {
      answerRequestInFlightRef.current = false;
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    if (isSaving || isSubmitting) {
      return;
    }
    setSaveError("");
    setCurrentQuestionIndex((previous) => Math.max(0, previous - 1));
  };

  const handleGoNext = () => {
    if (!currentQuestion || isSaving || isSubmitting) {
      return;
    }
    if (!Number.isInteger(currentAnswer)) {
      setSaveError("Select one option before moving to the next question.");
      return;
    }
    setSaveError("");
    setCurrentQuestionIndex((previous) => Math.min(questions.length - 1, previous + 1));
  };

  const handleSubmit = async () => {
    if (!sessionId || isSaving) {
      return;
    }

    if (!isComplete) {
      const firstUnansweredIndex = getFirstUnansweredIndex(questions, answers);
      setError("Answer every question before submitting the assessment.");
      setCurrentQuestionIndex(firstUnansweredIndex);
      return;
    }

    setError("");
    setSaveError("");
    setIsSubmitting(true);

    try {
      const response = await api.post(`/assessments/sessions/${sessionId}/complete`, {});
      const completedSession = response?.data || null;
      setResult(completedSession);
      if (!isModal) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (caughtError) {
      setError(caughtError.message || "Failed to submit the assessment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className={`rounded-2xl border border-gray-200 bg-white ${isModal ? "p-6" : "p-8"} shadow-sm`}>
        <p className="text-center text-sm font-medium text-gray-500">Preparing your assessment session...</p>
      </div>
    );
  }

  if (error && !isHydrated && !sessionId) {
    return (
      <div className={`rounded-2xl border border-red-200 bg-white ${isModal ? "p-6" : "p-8"} shadow-sm`}>
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    );
  }

  if (result) {
    const scoreCards = Array.isArray(result?.scores) ? result.scores : [];
    const feedback = result?.feedback || {};
    const recommendedActions = Array.isArray(feedback?.recommended_actions)
      ? feedback.recommended_actions
      : [];
    const followUpQuestions = Array.isArray(feedback?.follow_up_questions)
      ? feedback.follow_up_questions
      : [];
    const clinicianFlags = Array.isArray(feedback?.clinician_flags)
      ? feedback.clinician_flags
      : [];

    return (
      <div className={`rounded-2xl border border-gray-200 bg-white ${isModal ? "p-6" : "p-8"} shadow-sm`}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Result ready
            </span>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Assessment complete</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              {feedback?.ui_summary || feedback?.overall_summary || "Your latest scores and structured analysis are ready."}
            </p>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
              Completed {formatDateTime(result?.completed_at)}
            </p>
          </div>

          {feedback?.risk_level && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              {feedback.risk_level} risk
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {scoreCards.map((score) => (
            <article key={score.test_id} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                    {score.title || score.test_id}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {score.score}
                    <span className="ml-1 text-base font-semibold text-gray-400">pts</span>
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600 ring-1 ring-gray-200">
                  {score.severity}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600">{score.summary}</p>
            </article>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">AI Summary</h3>
          <p className="mt-3 text-sm leading-6 text-gray-700">
            {feedback?.overall_summary || "No AI summary was generated for this session."}
          </p>
          {feedback?.trend_comparison && (
            <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-gray-600 ring-1 ring-gray-200">
              {feedback.trend_comparison}
            </p>
          )}
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Key Findings</h3>
            <ul className="mt-4 space-y-3">
              {(feedback?.key_findings || []).map((item, index) => (
                <li key={`${item}-${index}`} className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-100">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Contributing Factors</h3>
            <ul className="mt-4 space-y-3">
              {(feedback?.contributing_factors || []).map((item, index) => (
                <li key={`${item}-${index}`} className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-100">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Recommended Actions</h3>
            <div className="mt-4 space-y-3">
              {recommendedActions.length === 0 && (
                <p className="text-sm text-gray-500">No additional actions were generated.</p>
              )}
              {recommendedActions.map((action, index) => (
                <div key={`${action.title}-${index}`} className="rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-800">{action.title}</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 ring-1 ring-gray-200">
                      {action.priority || "normal"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{action.rationale}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Follow-up</h3>
            <div className="mt-4 space-y-3">
              {followUpQuestions.map((item, index) => (
                <p key={`${item}-${index}`} className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-100">
                  {item}
                </p>
              ))}
              {clinicianFlags.map((item, index) => (
                <p key={`${item}-${index}`} className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
                  {item}
                </p>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {isModal ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Close
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white ${isModal ? "p-6" : "p-8"} shadow-sm`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {mode === "initial" ? "Initial assessment" : "Retake assessment"}
          </span>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Mental Health Assessment</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Answer each question based on how you have felt over the last two weeks. The final screen will show your score summary and structured AI feedback.
          </p>
        </div>

        {isModal && typeof onClose === "function" && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            Close
          </button>
        )}
      </div>

      <div className="mb-6 rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Question {Math.min(currentQuestionIndex + 1, questionCount)} of {questionCount}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">
              {answeredQuestions} answered
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">{progressPercent}% complete</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">
              {isSaving ? "Saving..." : "Saved"}
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {saveError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {saveError}
        </div>
      )}

      {currentQuestion && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              {currentQuestion.testTitle}
            </p>
            <p className="mt-3 text-xl font-semibold leading-8 text-gray-900">
              {currentQuestion.questionText}
            </p>
          </div>

          <div className="grid gap-3">
            {currentQuestion.options.map((option) => {
              const selected = currentAnswer === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleAnswerSelect(option.value)}
                  disabled={isSaving || isSubmitting}
                  className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                    selected
                      ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                  } ${isSaving || isSubmitting ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleGoBack}
          disabled={currentQuestionIndex === 0 || isSaving || isSubmitting}
          className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          {currentQuestionIndex < questionCount - 1 ? (
            <button
              type="button"
              onClick={handleGoNext}
              disabled={!Number.isInteger(currentAnswer) || isSaving || isSubmitting}
              className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Next Question"}
            </button>
          ) : !isComplete ? (
            <button
              type="button"
              onClick={() => {
                setError("Answer every question before submitting the assessment.");
                setCurrentQuestionIndex(getFirstUnansweredIndex(questions, answers));
              }}
              disabled={isSaving || isSubmitting}
              className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Go to Missing Answers"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isComplete || isSaving || isSubmitting}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Generating result..." : isSaving ? "Saving..." : "Finish Assessment"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

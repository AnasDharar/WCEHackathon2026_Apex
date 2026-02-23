"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";

import { auth, db } from "../../../firebaseConfig";
import { api } from "@/lib/api";

const TEST_ORDER = ["phq9", "gad7"];

function createEmptyAnswers(catalog) {
  const initial = {};
  for (const test of catalog) {
    initial[test.id] = Array.from({ length: test.questions.length }, () => null);
  }
  return initial;
}

export default function TestPage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      setLoadingCatalog(true);
      setError("");
      try {
        const response = await api.get("/assessments/catalog");
        const rawCatalog = Array.isArray(response?.data) ? response.data : [];
        const orderedCatalog = TEST_ORDER.map((testId) =>
          rawCatalog.find((item) => item?.id === testId)
        ).filter(Boolean);

        if (orderedCatalog.length !== TEST_ORDER.length) {
          throw new Error("Assessment catalog is not available right now.");
        }

        if (!mounted) {
          return;
        }

        setCatalog(orderedCatalog);
        setAnswers(createEmptyAnswers(orderedCatalog));
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load assessments.");
        }
      } finally {
        if (mounted) {
          setLoadingCatalog(false);
        }
      }
    }

    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  const progress = useMemo(() => {
    const totalQuestions = catalog.reduce((sum, test) => sum + test.questions.length, 0);
    const answeredQuestions = catalog.reduce((sum, test) => {
      const testAnswers = answers[test.id] || [];
      return sum + testAnswers.filter((value) => value !== null).length;
    }, 0);
    return { answeredQuestions, totalQuestions };
  }, [answers, catalog]);

  const handleAnswerChange = (testId, questionIndex, value) => {
    setAnswers((previous) => {
      const next = { ...previous };
      const previousAnswers = Array.isArray(next[testId]) ? [...next[testId]] : [];
      previousAnswers[questionIndex] = value;
      next[testId] = previousAnswers;
      return next;
    });
  };

  const isComplete = () =>
    catalog.every((test) => {
      const testAnswers = answers[test.id] || [];
      return (
        testAnswers.length === test.questions.length &&
        testAnswers.every((value) => Number.isInteger(value))
      );
    });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const user = auth.currentUser;
    if (!user) {
      setError("Session expired. Please sign in again.");
      return;
    }

    if (!isComplete()) {
      setError("Please answer every question in PHQ-9 and GAD-7.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      const submissions = TEST_ORDER.map((testId) => ({
        test_id: testId,
        answers: answers[testId],
      }));

      const result = await api.post("/assessments/submit", {
        submissions,
        max_recommendations: 5,
      });

      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          testGiven: true,
          latestAssessment: result,
          lastTestDate: new Date().toISOString(),
        },
        { merge: true }
      );

      router.push("/home");
    } catch (err) {
      setError(err.message || "Failed to submit assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingCatalog) {
    return (
      <div className="min-h-screen bg-gray-100 px-4 py-10 font-google">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-center text-gray-600">Loading PHQ-9 and GAD-7...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 font-google">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800">Mental Health Assessment</h1>
          <p className="mt-2 text-gray-600">
            Please answer all questions based on your experience over the last 2 weeks.
          </p>
          <p className="mt-3 text-sm font-medium text-gray-500">
            Progress: {progress.answeredQuestions}/{progress.totalQuestions}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {catalog.map((test) => (
            <section
              key={test.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-gray-800">{test.title}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {test.use} | {test.duration}
                </p>
              </div>

              <div className="space-y-4">
                {test.questions.map((question, questionIndex) => (
                  <div key={question.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-3 text-sm font-medium text-gray-800">
                      {questionIndex + 1}. {question.text}
                    </p>

                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {test.options.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            handleAnswerChange(test.id, questionIndex, option.value)
                          }
                          className={`rounded-lg border px-3 py-2 text-xs transition-colors md:text-sm ${
                            answers[test.id]?.[questionIndex] === option.value
                              ? "border-blue-500 bg-blue-50 font-semibold text-blue-700"
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit PHQ-9 + GAD-7"}
          </button>
        </form>
      </div>
    </div>
  );
}

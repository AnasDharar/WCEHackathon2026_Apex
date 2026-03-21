export const TEST_ORDER = ["phq9", "gad7"];

export const STANDARD_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

export const ASSESSMENT_CATALOG = TEST_ORDER.map((testId) => {
  if (testId === "phq9") {
    return {
      id: "phq9",
      title: "PHQ-9",
      use: "Depression screening",
      duration: "2-4 min",
      options: STANDARD_OPTIONS,
      questions: [
        { id: "phq9_q1", text: "Little interest or pleasure in doing things" },
        { id: "phq9_q2", text: "Feeling down, depressed, or hopeless" },
        { id: "phq9_q3", text: "Trouble falling or staying asleep, or sleeping too much" },
        { id: "phq9_q4", text: "Feeling tired or having little energy" },
        { id: "phq9_q5", text: "Poor appetite or overeating" },
        { id: "phq9_q6", text: "Feeling bad about yourself or that you are a failure" },
        { id: "phq9_q7", text: "Trouble concentrating on things" },
        { id: "phq9_q8", text: "Moving or speaking slowly, or being fidgety/restless" },
        { id: "phq9_q9", text: "Thoughts that you would be better off dead or of self-harm" },
      ],
    };
  }

  return {
    id: "gad7",
    title: "GAD-7",
    use: "Anxiety screening",
    duration: "2-3 min",
    options: STANDARD_OPTIONS,
    questions: [
      { id: "gad7_q1", text: "Feeling nervous, anxious, or on edge" },
      { id: "gad7_q2", text: "Not being able to stop or control worrying" },
      { id: "gad7_q3", text: "Worrying too much about different things" },
      { id: "gad7_q4", text: "Trouble relaxing" },
      { id: "gad7_q5", text: "Being so restless that it is hard to sit still" },
      { id: "gad7_q6", text: "Becoming easily annoyed or irritable" },
      { id: "gad7_q7", text: "Feeling afraid as if something awful might happen" },
    ],
  };
});

export function createEmptyAnswers(catalog = ASSESSMENT_CATALOG) {
  const initial = {};
  for (const test of catalog) {
    initial[test.id] = Array.from({ length: test.questions.length }, () => null);
  }
  return initial;
}

export function normalizeAnswers(rawAnswers, catalog = ASSESSMENT_CATALOG) {
  const normalized = createEmptyAnswers(catalog);
  if (!rawAnswers || typeof rawAnswers !== "object") {
    return normalized;
  }

  for (const test of catalog) {
    const incoming = Array.isArray(rawAnswers[test.id]) ? rawAnswers[test.id] : [];
    normalized[test.id] = test.questions.map((_, index) => {
      const value = incoming[index];
      return Number.isInteger(value) ? value : null;
    });
  }

  return normalized;
}

export function flattenQuestions(catalog = ASSESSMENT_CATALOG) {
  return catalog.flatMap((test) =>
    test.questions.map((question, questionIndex) => ({
      key: `${test.id}-${question.id}`,
      testId: test.id,
      testTitle: test.title,
      questionId: question.id,
      questionIndex,
      questionText: question.text,
      options: test.options,
      totalInTest: test.questions.length,
    })),
  );
}

export function countAnswered(answers, catalog = ASSESSMENT_CATALOG) {
  return catalog.reduce((sum, test) => {
    const testAnswers = Array.isArray(answers?.[test.id]) ? answers[test.id] : [];
    return sum + testAnswers.filter((value) => Number.isInteger(value)).length;
  }, 0);
}

export function totalQuestions(catalog = ASSESSMENT_CATALOG) {
  return catalog.reduce((sum, test) => sum + test.questions.length, 0);
}

export function isAssessmentComplete(answers, catalog = ASSESSMENT_CATALOG) {
  return catalog.every((test) => {
    const testAnswers = Array.isArray(answers?.[test.id]) ? answers[test.id] : [];
    return (
      testAnswers.length === test.questions.length &&
      testAnswers.every((value) => Number.isInteger(value))
    );
  });
}

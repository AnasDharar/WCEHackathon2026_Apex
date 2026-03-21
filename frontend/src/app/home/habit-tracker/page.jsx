"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5";

function HabitTrackerContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [activeExercise, setActiveExercise] = useState(null);

  // const interactive_exercises = [
  //   {
  //     id: "breathing-478",
  //     title: "4-7-8 Breathing",
  //     type: "breathing",
  //     duration: "1 min",
  //     description: "Quickly lower anxiety with guided rhythmic breathing.",
  //     color: "bg-emerald-50 text-gray-900 ring-emerald-200 hover:bg-emerald-100"
  //   },
  //   {
  //     id: "grounding-54321",
  //     title: "5-4-3-2-1 Grounding",
  //     type: "grounding",
  //     duration: "2 mins",
  //     description: "Reconnect with surroundings to break panic loops.",
  //     color: "bg-blue-50 text-gray-900 ring-blue-200 hover:bg-blue-100"
  //   },
  //   {
  //     id: "mood-checkin",
  //     title: "Daily Reflection",
  //     type: "reflection",
  //     duration: "1 min",
  //     description: "Log how you are feeling to improve Zenith's insights.",
  //     color: "bg-purple-50 text-gray-900 ring-purple-200 hover:bg-purple-100"
  //   }
  // ];

  const [stats, setStats] = useState([]);
  const [todayHabits, setTodayHabits] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [categoryProgress, setCategoryProgress] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);

  const [coachMessage, setCoachMessage] = useState("");
  const [coachResult, setCoachResult] = useState(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingHabitId, setUpdatingHabitId] = useState(null);
  const [deletingHabitId, setDeletingHabitId] = useState(null);
  const [creatingHabit, setCreatingHabit] = useState(false);
  const [newHabit, setNewHabit] = useState({
    title: "",
    description: "",
    schedule: "Anytime",
    category: "wellbeing",
  });
  const [onboardingStatus, setOnboardingStatus] = useState({ completed: true, habit_count: 0 });
  const [onboardingQuestions, setOnboardingQuestions] = useState([]);
  const [onboardingAnswers, setOnboardingAnswers] = useState({});
  const [loadingOnboarding, setLoadingOnboarding] = useState(false);
  const [submittingOnboarding, setSubmittingOnboarding] = useState(false);

  const setStatsFromRaw = (rawStats) => {
    setStats([
      { id: "total", label: "Total Habits", value: rawStats?.total ?? 0, note: "All tracked routines" },
      { id: "completed", label: "Completed", value: rawStats?.completed ?? 0, note: "Marked done" },
      { id: "pending", label: "Pending", value: rawStats?.pending ?? 0, note: "Still to complete" },
    ]);
  };

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [statsRes, habitsRes, weeklyRes, categoryRes, calendarRes, onboardingRes] = await Promise.all([
          api.get("/habits/stats"),
          api.get("/habits/"),
          api.get("/habits/weekly-progress"),
          api.get("/habits/category-progress"),
          api.get("/habits/calendar", { params: { year, month } }),
          api.get("/habits/onboarding/status"),
        ]);

        if (!mounted) {
          return;
        }

        const rawStats = statsRes?.data || {};
        setStatsFromRaw(rawStats);

        const rawHabits = Array.isArray(habitsRes?.data) ? habitsRes.data : [];
        setTodayHabits(
          rawHabits.map((habit) => ({
            ...habit,
            name: habit.title || "Untitled habit",
          }))
        );

        const rawWeekly = Array.isArray(weeklyRes?.data) ? weeklyRes.data : [];
        setWeeklyProgress(
          rawWeekly.map((item) => ({
            day: item.day,
            done: (item.completed ?? 0) > 0,
          }))
        );

        const rawCategory = Array.isArray(categoryRes?.data) ? categoryRes.data : [];
        const totalCategoryCount = rawCategory.reduce((sum, item) => sum + (item.count || 0), 0) || 1;
        setCategoryProgress(
          rawCategory.map((item) => ({
            id: item.category,
            name: item.category,
            progress: Math.round(((item.count || 0) / totalCategoryCount) * 100),
          }))
        );

        setCalendarDays(calendarRes?.data?.days || []);
        setOnboardingStatus(onboardingRes?.data || { completed: true, habit_count: 0 });
      } catch (err) {
        if (mounted) {
          setError(err.message || t("Failed to load habit tracker."));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [month, year]);

  useEffect(() => {
    const setupRequested = searchParams?.get("setup") === "1";
    const needsOnboarding = !onboardingStatus.completed || onboardingStatus.habit_count === 0;
    if (!setupRequested && !needsOnboarding) {
      return;
    }

    let mounted = true;
    async function loadOnboarding() {
      setLoadingOnboarding(true);
      try {
        const res = await api.get("/habits/onboarding/questions");
        if (!mounted) return;
        const questions = Array.isArray(res?.data) ? res.data : [];
        setOnboardingQuestions(questions);
        const initialAnswers = {};
        questions.forEach((q) => {
          if (Array.isArray(q.options) && q.options.length) {
            initialAnswers[q.id] = q.options[0];
          }
        });
        setOnboardingAnswers(initialAnswers);
      } catch (err) {
        if (mounted) {
          setError(err.message || t("Could not load onboarding questions."));
        }
      } finally {
        if (mounted) setLoadingOnboarding(false);
      }
    }
    loadOnboarding();
    return () => {
      mounted = false;
    };
  }, [onboardingStatus, searchParams]);

  const completion = useMemo(() => {
    const done = todayHabits.filter((habit) => habit.done).length;
    const total = todayHabits.length;
    return {
      done,
      total,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  }, [todayHabits]);

  const toggleHabit = async (habit) => {
    const nextDone = !habit.done;
    setUpdatingHabitId(habit.id);
    setError("");

    setTodayHabits((prev) =>
      prev.map((item) => (item.id === habit.id ? { ...item, done: nextDone } : item))
    );

    try {
      await api.patch(`/habits/${habit.id}`, { done: nextDone });
      const statsRes = await api.get("/habits/stats");
      setStatsFromRaw(statsRes?.data || {});
    } catch (err) {
      setTodayHabits((prev) =>
        prev.map((item) => (item.id === habit.id ? { ...item, done: habit.done } : item))
      );
      setError(err.message || t("Could not update habit."));
    } finally {
      setUpdatingHabitId(null);
    }
  };

  const runCoach = async () => {
    setLoadingCoach(true);
    setError("");
    try {
      const payload = { message: coachMessage.trim() || null };
      const res = await api.post("/habits/coach", payload);
      const responseText = res?.data?.response;
      setCoachResult(
        responseText
          ? {
            priority_focus: "Consistency",
            confidence: 0.7,
            coach_reply: responseText,
            suggested_actions: [],
          }
          : null
      );
    } catch (err) {
      setError(err.message || t("Habit coach request failed."));
    } finally {
      setLoadingCoach(false);
    }
  };

  const refreshHabitsAndStats = async () => {
    const [statsRes, habitsRes] = await Promise.all([
      api.get("/habits/stats"),
      api.get("/habits/"),
    ]);
    setStatsFromRaw(statsRes?.data || {});
    const rawHabits = Array.isArray(habitsRes?.data) ? habitsRes.data : [];
    setTodayHabits(
      rawHabits.map((habit) => ({
        ...habit,
        name: habit.title || "Untitled habit",
      }))
    );
  };

  const addHabit = async () => {
    const title = newHabit.title.trim();
    if (!title) {
      setError(t("Habit title is required."));
      return;
    }
    setCreatingHabit(true);
    setError("");
    try {
      await api.post("/habits/", {
        title,
        description: newHabit.description.trim() || null,
        schedule: newHabit.schedule,
        category: newHabit.category,
      });
      setNewHabit({
        title: "",
        description: "",
        schedule: "Anytime",
        category: "wellbeing",
      });
      await refreshHabitsAndStats();
    } catch (err) {
      setError(err.message || t("Could not create habit."));
    } finally {
      setCreatingHabit(false);
    }
  };

  const removeHabit = async (habitId) => {
    setDeletingHabitId(habitId);
    setError("");
    try {
      await api.remove(`/habits/${habitId}`);
      await refreshHabitsAndStats();
    } catch (err) {
      setError(err.message || t("Could not delete habit."));
    } finally {
      setDeletingHabitId(null);
    }
  };

  const submitOnboarding = async () => {
    setSubmittingOnboarding(true);
    setError("");
    try {
      await api.post("/habits/onboarding/submit", { answers: onboardingAnswers });
      setOnboardingStatus({ completed: true, habit_count: 1 });
      await refreshHabitsAndStats();
    } catch (err) {
      setError(err.message || t("Could not save onboarding."));
    } finally {
      setSubmittingOnboarding(false);
    }
  };

  return (
    <>
      <Header
        title={t("Exercises & Habits")}
        subtitle={t("Your interactive wellbeing routines and daily tracking.")}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-gray-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 animate-pulse">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className={`h-32 ${static_card_style} bg-gray-50`}
            />
          ))}
        </div>
      ) : (
        <div className="pb-20 text-gray-900">
          {(!onboardingStatus.completed || onboardingStatus.habit_count === 0) && (
            <section className="mb-8 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">{t("Quick Habit Setup")}</h2>
              <p className="mt-2 text-sm text-gray-900 font-medium">
                {t("Answer these questions once. We will auto-create a starter habit plan for you.")}
              </p>

              {loadingOnboarding ? (
                <p className="mt-4 text-sm font-semibold text-gray-800">{t("Loading questions...")}</p>
              ) : (
                <div className="mt-6 space-y-6">
                  {onboardingQuestions.map((q) => (
                    <div key={q.id}>
                      <p className="mb-3 text-sm font-bold text-gray-900">{q.question}</p>
                      <div className="flex flex-wrap gap-3">
                        {(q.options || []).map((opt) => (
                          <button
                            key={`${q.id}-${opt}`}
                            type="button"
                            onClick={() =>
                              setOnboardingAnswers((prev) => ({ ...prev, [q.id]: opt }))
                            }
                            className={`rounded-full ring-1 px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${onboardingAnswers[q.id] === opt
                                ? "ring-emerald-600 bg-emerald-600 text-white shadow-sm"
                                : "ring-emerald-200 bg-white text-gray-900 hover:bg-emerald-100"
                              }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={submitOnboarding}
                    disabled={submittingOnboarding}
                    className="rounded-xl ring-1 ring-emerald-700 bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer"
                  >
                    {submittingOnboarding ? t("Creating your habits...") : t("Create My Starter Habits")}
                  </button>
                </div>
              )}
            </section>
          )}

          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {stats.map((item) => (
              <div key={item.id} className={static_card_style}>
                <p className="text-xs tracking-wider uppercase font-semibold text-gray-500">{item.label}</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{item.value}</p>
                <p className="mt-2 text-xs font-medium text-gray-800">{item.note}</p>
              </div>
            ))}
          </div>

          {/* {!activeExercise ? (
            <div className="mb-8">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-5">Interactive Exercises</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {interactive_exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => setActiveExercise(exercise.id)}
                    className={`text-left rounded-xl p-6 transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ring-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${exercise.color}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-bold text-lg tracking-tight">{exercise.title}</span>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/80 shadow-sm uppercase tracking-wider">{exercise.duration}</span>
                    </div>
                    <p className="text-sm font-medium opacity-90 leading-relaxed mb-6">{exercise.description}</p>
                    <div className="mt-auto text-xs font-bold flex items-center gap-1 group">
                      Play Exercise 
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-8 rounded-xl bg-white p-8 md:p-12 relative overflow-hidden shadow-sm ring-1 ring-black/5">
              <button
                onClick={() => setActiveExercise(null)}
                className="absolute top-6 right-6 text-gray-500 ring-1 ring-gray-200 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                title="Close Exercise"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {activeExercise === "breathing-478" && (
                <div className="flex flex-col items-center justify-center py-10">
                  <h3 className="font-bold text-2xl tracking-tight text-gray-900 mb-10">4-7-8 Breathing</h3>
                  <div className="w-32 h-32 rounded-full bg-emerald-500 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] flex items-center justify-center relative mb-12 shadow-xl shadow-emerald-500/20">
                    <span className="absolute text-white font-bold tracking-widest text-lg">BREATHE</span>
                  </div>
                  <p className="text-gray-900 font-bold text-lg text-center tracking-wide">Inhale for 4s, Hold for 7s, Exhale for 8s</p>
                </div>
              )}

              {activeExercise === "grounding-54321" && (
                <div className="py-8 max-w-2xl mx-auto">
                  <h3 className="font-bold text-2xl tracking-tight text-gray-900 mb-8 text-center">5-4-3-2-1 Grounding</h3>
                  <div className="space-y-4">
                    {["5 things you can see", "4 things you can physically feel", "3 things you can hear", "2 things you can smell", "1 thing you can taste"].map((step, i) => (
                      <div key={i} className="flex items-center gap-4 bg-blue-50 px-6 py-5 rounded-xl text-lg font-bold text-gray-900 transition-colors hover:bg-blue-100">
                        <span className="w-10 h-10 rounded-full bg-blue-200 text-gray-900 flex items-center justify-center text-base shrink-0 font-bold shadow-sm">{5 - i}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeExercise === "mood-checkin" && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <h3 className="font-bold text-2xl tracking-tight text-gray-900 mb-4">Daily Reflection</h3>
                  <p className="text-gray-900 mb-10 text-lg font-medium">How are you feeling right now?</p>
                  <div className="flex gap-6">
                    {["😢", "😐", "🙂", "😁"].map((emoji, i) => (
                      <button key={i} className="text-5xl hover:scale-125 transition-transform duration-200 bg-purple-50 hover:bg-purple-100 ring-1 ring-purple-100 p-5 rounded-full shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer">{emoji}</button>
                    ))}
                  </div>
                  <button className="mt-12 px-8 py-3 bg-purple-600 text-white text-sm font-bold rounded-xl ring-1 ring-purple-700 shadow-sm transition-all duration-200 hover:bg-purple-700 hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer" onClick={() => setActiveExercise(null)}>Finish Exercise</button>
                </div>
              )}
            </div>
          )} */}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className={`${static_card_style} lg:col-span-2 flex flex-col`}>
              <div className="mb-6 rounded-xl ring-1 ring-gray-100 bg-gray-50 p-6">
                <p className="mb-4 text-base font-bold tracking-tight text-gray-900">Add New Habit</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    value={newHabit.title}
                    onChange={(e) => setNewHabit((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Habit title"
                    className="rounded-lg ring-1 ring-gray-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition-shadow focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    value={newHabit.description}
                    onChange={(e) => setNewHabit((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Description (optional)"
                    className="rounded-lg ring-1 ring-gray-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition-shadow focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    value={newHabit.schedule}
                    onChange={(e) => setNewHabit((prev) => ({ ...prev, schedule: e.target.value }))}
                    placeholder="Schedule (e.g. Morning)"
                    className="rounded-lg ring-1 ring-gray-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition-shadow focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    value={newHabit.category}
                    onChange={(e) => setNewHabit((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="Category (e.g. sleep)"
                    className="rounded-lg ring-1 ring-gray-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition-shadow focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={addHabit}
                  disabled={creatingHabit}
                  className="mt-4 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer"
                >
                  {creatingHabit ? "Adding..." : "Add Habit"}
                </button>
              </div>

              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight text-gray-900">Today&apos;s Checklist</h2>
                <span className="rounded-full bg-emerald-50 ring-1 ring-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-800">
                  {completion.done}/{completion.total} done
                </span>
              </div>

              {todayHabits.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                   <span className="text-sm font-medium text-gray-500">No habits tracked today.</span>
                </div>
              ) : (
                <div className="space-y-3 flex-1">
                  {todayHabits.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors duration-200 hover:bg-gray-50 ring-1 ring-transparent hover:ring-gray-100"
                    >
                      <button
                        type="button"
                        onClick={() => toggleHabit(habit)}
                        disabled={updatingHabitId === habit.id}
                        className={`flex h-6 w-6 items-center justify-center rounded-md ring-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 shrink-0 ${habit.done
                            ? "ring-emerald-600 bg-emerald-600 text-white shadow-sm"
                            : "ring-gray-300 bg-white hover:bg-gray-50"
                          }`}
                      >
                        {habit.done && (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M5 13L9 17L19 7"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold truncate transition-colors duration-200 ${habit.done ? "text-gray-400 line-through" : "text-gray-900"}`}>{habit.name}</p>
                        <p className={`text-xs font-medium truncate mt-0.5 ${habit.done ? "text-gray-400" : "text-gray-500"}`}>{habit.schedule}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeHabit(habit.id)}
                        disabled={deletingHabitId === habit.id}
                        className="opacity-0 group-hover:opacity-100 shrink-0 ml-2 rounded-lg ring-1 ring-red-200 px-3 py-1.5 text-xs font-bold text-gray-700 transition-all duration-200 hover:bg-red-50 active:scale-[0.98] disabled:opacity-60 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        style={{ opacity: 1 /* override for mobile visibility if needed, or keep hover */ }}
                      >
                        {deletingHabitId === habit.id ? "..." : "Delete"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 rounded-xl bg-gray-50 ring-1 ring-gray-100 p-5">
                <p className="text-sm font-bold tracking-tight text-gray-900 mb-4">Weekly Completion</p>
                <div className="grid grid-cols-7 gap-2">
                  {weeklyProgress.map((item) => (
                    <div key={item.day} className="text-center group">
                      <div
                        className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-transform group-hover:scale-110 ${item.done ? "bg-emerald-500 text-white shadow-sm" : "bg-white ring-1 ring-gray-200 text-gray-500"
                          }`}
                      >
                        {item.day[0]}
                      </div>
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-gray-400">{item.day}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8 lg:col-span-3">
              <div className={static_card_style}>
                <h2 className="mb-6 text-xl font-bold tracking-tight text-gray-900">Category Progress</h2>
                {categoryProgress.length === 0 ? (
                  <div className="w-full flex items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <span className="text-sm font-medium text-gray-500">No category data available yet.</span>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {categoryProgress.map((item) => (
                      <div key={item.id}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-bold text-gray-700 uppercase tracking-widest text-xs">{item.name}</span>
                          <span className="text-gray-500 font-semibold">{item.progress}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 ring-1 ring-inset ring-gray-200">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={static_card_style}>
                <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <h2 className="text-xl font-bold tracking-tight text-gray-900">Calendar Overview</h2>
                  <div className="flex items-center gap-3">
                    <select
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="rounded-lg ring-1 ring-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none transition-shadow focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                    >
                      {monthNames.map((label, idx) => (
                        <option key={label} value={idx + 1}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      min={2000}
                      max={2100}
                      className="w-24 rounded-lg ring-1 ring-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none transition-shadow focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                    />
                  </div>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="py-2 text-center text-xs font-bold uppercase tracking-wider text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((item, idx) => (
                    <div key={idx} className="flex justify-center p-1">
                      {item.day ? (
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 hover:scale-110 cursor-default ${item.completed ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-gray-50 ring-1 ring-gray-200 text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                          {item.day}
                        </div>
                      ) : (
                        <div className="h-10 w-10" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-8 ${static_card_style}`}>
            <h2 className="mb-6 text-xl font-bold tracking-tight text-gray-900">AI Habit Coach</h2>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
              <div className="lg:col-span-2 flex flex-col">
                <label className="mb-3 block text-sm font-bold text-gray-700 tracking-tight">
                  Describe your blocker or goal
                </label>
                <textarea
                  value={coachMessage}
                  onChange={(e) => setCoachMessage(e.target.value)}
                  rows={6}
                  placeholder="Example: I keep missing my sleep routine during exam week."
                  className="w-full flex-1 min-h-[150px] rounded-xl ring-1 ring-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={runCoach}
                  disabled={loadingCoach}
                  className="mt-4 rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-md active:scale-[0.98] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 cursor-pointer"
                >
                  {loadingCoach ? "Generating plan..." : "Get personalized plan"}
                </button>
              </div>

              <div className="rounded-xl ring-1 ring-gray-100 bg-emerald-50/30 p-6 lg:col-span-3">
                {todayHabits.length > 0 && !coachResult && (
                  <div className="mb-6 rounded-xl ring-1 ring-gray-200 bg-white p-5 shadow-sm">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Your current habits context
                    </p>
                    <ul className="space-y-2">
                      {todayHabits.slice(0, 5).map((habit) => (
                        <li key={`coach-${habit.id}`} className="text-sm text-gray-700 flex items-start gap-2">
                           <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                           <span><strong className="font-bold text-gray-900">{habit.name}</strong>{habit.description ? ` - ${habit.description}` : ""}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {coachResult ? (
                  <div className="bg-white rounded-xl p-6 ring-1 ring-emerald-100 shadow-sm">
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-emerald-100 ring-1 ring-emerald-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-900">
                        Focus: {coachResult.priority_focus}
                      </span>
                      <span className="rounded-full bg-blue-100 ring-1 ring-blue-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-900">
                        Confidence: {Math.round((coachResult.confidence || 0) * 100)}%
                      </span>
                    </div>
                    <p className="text-base font-medium text-gray-800 leading-relaxed">{coachResult.coach_reply}</p>
                    {coachResult.suggested_actions && coachResult.suggested_actions.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-xs font-bold tracking-wider uppercase text-gray-500 mb-4">Suggested Actions</p>
                            <ul className="space-y-3">
                            {coachResult.suggested_actions.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                <span>{item}</span>
                                </li>
                            ))}
                            </ul>
                        </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 bg-white rounded-full shadow-sm ring-1 ring-gray-200 flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                      </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">Ready for analysis</h3>
                    <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto leading-relaxed">
                      Ask the AI coach for a personalized plan based on your current habit data.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function HabitTrackerPage() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 animate-pulse p-6">
          {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className={`h-32 ${static_card_style} bg-gray-50`} />
          ))}
      </div>
    }>
      <HabitTrackerContent />
    </Suspense>
  );
}

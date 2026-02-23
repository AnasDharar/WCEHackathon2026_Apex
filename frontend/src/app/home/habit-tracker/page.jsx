"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
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

export default function HabitTracker() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

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

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [statsRes, todayRes, weeklyRes, categoryRes, calendarRes] = await Promise.all([
          api.get("/habits/stats"),
          api.get("/habits/today"),
          api.get("/habits/weekly-progress"),
          api.get("/habits/category-progress"),
          api.get("/habits/calendar", { params: { year, month } }),
        ]);

        if (!mounted) {
          return;
        }

        setStats(statsRes?.data || []);
        setTodayHabits(todayRes?.data || []);
        setWeeklyProgress(weeklyRes?.data || []);
        setCategoryProgress(categoryRes?.data || []);
        setCalendarDays(calendarRes?.data?.days || []);
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load habit tracker.");
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
      setStats(statsRes?.data || []);
    } catch (err) {
      setTodayHabits((prev) =>
        prev.map((item) => (item.id === habit.id ? { ...item, done: habit.done } : item))
      );
      setError(err.message || "Could not update habit.");
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
      setCoachResult(res?.data || null);
    } catch (err) {
      setError(err.message || "Habit coach request failed.");
    } finally {
      setLoadingCoach(false);
    }
  };

  return (
    <>
      <Header
        title="Habit Tracker"
        subtitle="Track daily actions, monitor consistency, and get AI coaching."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 animate-pulse rounded-3xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {stats.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-800">{item.value}</p>
                <p className="mt-1 text-xs text-emerald-700">{item.note}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Today&apos;s Checklist</h2>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                  {completion.done}/{completion.total} done
                </span>
              </div>

              <div className="space-y-2">
                {todayHabits.map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => toggleHabit(habit)}
                    disabled={updatingHabitId === habit.id}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-50 disabled:opacity-70"
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border ${
                        habit.done
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {habit.done && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M5 13L9 17L19 7"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{habit.name}</p>
                      <p className="text-xs text-gray-500">{habit.schedule}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700">Weekly Completion</p>
                <div className="mt-3 grid grid-cols-7 gap-2">
                  {weeklyProgress.map((item) => (
                    <div key={item.day} className="text-center">
                      <div
                        className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                          item.done ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {item.day[0]}
                      </div>
                      <p className="text-[10px] text-gray-500">{item.day}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-800">Category Progress</h2>
                <div className="space-y-3">
                  {categoryProgress.map((item) => (
                    <div key={item.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <span className="text-gray-500">{item.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <h2 className="text-lg font-semibold text-gray-800">Calendar</h2>
                  <div className="flex items-center gap-2">
                    <select
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
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
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="mb-1 grid grid-cols-7 gap-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="py-1 text-center text-xs text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((item, idx) => (
                    <div key={idx} className="flex justify-center p-1">
                      {item.day ? (
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                            item.completed ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.day}
                        </div>
                      ) : (
                        <div className="h-8 w-8" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Habit Coach</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm text-gray-600">
                  Describe your blocker or goal
                </label>
                <textarea
                  value={coachMessage}
                  onChange={(e) => setCoachMessage(e.target.value)}
                  rows={6}
                  placeholder="Example: I keep missing my sleep routine during exam week."
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={runCoach}
                  disabled={loadingCoach}
                  className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loadingCoach ? "Generating plan..." : "Get Coach Plan"}
                </button>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 lg:col-span-3">
                {coachResult ? (
                  <>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Priority: {coachResult.priority_focus}
                      </span>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                        Confidence: {Math.round((coachResult.confidence || 0) * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{coachResult.coach_reply}</p>
                    <ul className="mt-3 space-y-2">
                      {(coachResult.suggested_actions || []).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    Ask the coach for a personalized plan based on your current habit data.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

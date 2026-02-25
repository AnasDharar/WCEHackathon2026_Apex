"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import { api } from "@/lib/api";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Overview() {
  const [overview, setOverview] = useState(null);
  const [profile, setProfile] = useState(null);
  const [todayHabits, setTodayHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingHabitId, setSavingHabitId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadOverview() {
      setLoading(true);
      setError("");
      try {
        const [overviewRes, profileRes] = await Promise.all([
          api.get("/dashboard/overview"),
          api.get("/users/me").catch(() => null),
        ]);

        if (!mounted) {
          return;
        }

        setOverview(overviewRes?.data || null);
        setTodayHabits(overviewRes?.data?.today_habits || []);
        setProfile(profileRes?.data || null);
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOverview();
    return () => {
      mounted = false;
    };
  }, []);

  const completedCount = useMemo(
    () => todayHabits.filter((habit) => habit.done).length,
    [todayHabits]
  );
  const completionPercent = todayHabits.length
    ? Math.round((completedCount / todayHabits.length) * 100)
    : 0;

  const handleToggleHabit = async (habit) => {
    const nextDone = !habit.done;
    setSavingHabitId(habit.id);

    setTodayHabits((prev) =>
      prev.map((item) => (item.id === habit.id ? { ...item, done: nextDone } : item))
    );

    try {
      await api.patch(`/habits/${habit.id}`, { done: nextDone });
    } catch (err) {
      setTodayHabits((prev) =>
        prev.map((item) => (item.id === habit.id ? { ...item, done: habit.done } : item))
      );
      setError(err.message || "Could not update habit.");
    } finally {
      setSavingHabitId(null);
    }
  };

  const welcomeName =
    profile?.first_name || overview?.welcome_name || profile?.name || "there";

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={`Welcome back, ${welcomeName}. Here's your wellness overview.`}
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
              className="h-36 animate-pulse rounded-3xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 font-google lg:grid-cols-6">
          <div className="col-span-3 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg text-gray-800">Assessment Results</h2>
            <div className="space-y-4">
              {(overview?.test_results || []).slice(0, 4).map((result) => (
                <div key={result.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-medium text-gray-800">{result.title}</h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      {result.score}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{result.feedback}</p>
                  <p className="mt-2 text-xs text-gray-400">{result.date}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-3 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg text-gray-800">Live Appointments</h2>
            <div className="space-y-4">
              {(overview?.live_appointments || []).map((apt) => (
                <div key={apt.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-gray-800">{apt.doctor}</h3>
                      <p className="text-sm text-gray-500">{apt.specialty}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {apt.date} • {apt.time}
                      </p>
                    </div>
                    {apt.meet_link ? (
                      <a
                        href={apt.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-emerald-700"
                      >
                        Join
                      </a>
                    ) : (
                      <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700">
                        {apt.mode}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center items-center h-[340px] gap-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-4 overflow-x-auto">
            <div className="flex flex-col min-w-[200px]">
              <h2 className="mb-4 shrink-0 text-lg text-gray-800">Today&apos;s Habits</h2>
              <div className="space-y-2 overflow-y-auto pr-2">
                {todayHabits.map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => handleToggleHabit(habit)}
                    disabled={savingHabitId === habit.id}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-50 disabled:opacity-70"
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border ${habit.done
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
            </div>

            <div className="flex flex-col items-center justify-center gap-4 border-l border-gray-100 pl-6 min-w-[160px]">
              <h2 className="mb-1 shrink-0 text-lg text-gray-800">Completion</h2>
              <div className="relative">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(completionPercent / 100) * 314} 314`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">{completionPercent}%</span>
                  <span className="text-xs text-gray-500">
                    {completedCount}/{todayHabits.length}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Habits completed today</p>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 border-l border-gray-100 pl-6 pr-2 min-w-[200px]">
              <h2 className="mb-1 shrink-0 text-lg text-gray-800">Past 4 Weeks</h2>
              <div className="flex h-32 w-full items-end justify-between gap-3 px-2">
                {[
                  { week: "W1", value: 65, label: "Week 1" },
                  { week: "W2", value: 80, label: "Week 2" },
                  { week: "W3", value: 45, label: "Week 3" },
                  { week: "W4", value: 90, label: "Week 4" },
                ].map((item, i) => (
                  <div key={i} className="group relative flex flex-1 flex-col items-center gap-2">
                    <div className="relative flex h-24 w-full items-end justify-center rounded-t-md bg-gray-100">
                      <div
                        className="w-full rounded-t-md bg-emerald-500 transition-all duration-500 hover:bg-emerald-400"
                        style={{ height: `${item.value}%` }}
                      />
                      <div className="absolute -top-8 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap z-10 transition-opacity">
                        {item.value}%
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500">{item.week}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">Weekly completion avg</p>
            </div>
          </div>

          <div className="flex h-[340px] flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-4 shrink-0 text-lg text-gray-800">Resource Highlights</h2>
            <div className="space-y-3 overflow-y-auto pr-2">
              {(overview?.resource_highlights || []).map((resource) => (
                <div
                  key={`${resource.id}-${resource.title}`}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3 shrink-0"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-gray-800">{resource.title}</h3>
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                      {resource.type}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-gray-500">{resource.description}</p>
                </div>
              ))}
            </div>
          </div>

          

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-3">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">Your Groups</h2>
            <div className="space-y-2">
              {[
                { id: 1, name: "Anxiety Support", members: 124, next: "Today, 6 PM" },
                { id: 2, name: "Mindfulness Practice", members: 89, next: "Tomorrow, 8 AM" },
                { id: 3, name: "Sleep Hygiene", members: 256, next: "Fri, 9 PM" }
              ].map((group) => (
                <div
                  key={group.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <p className="text-sm font-medium text-gray-800">{group.name}</p>
                  <p className="text-xs text-gray-500">
                    {group.members} members • Next: {group.next}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg text-gray-800">Habit Calendar</h2>
              <span className="text-xs text-gray-500">Green dots show completed days</span>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div key={day} className="py-1 text-center text-xs text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {(overview?.habit_calendar || []).map((item, index) => (
                <div key={index} className="flex justify-center p-1">
                  {item.day ? (
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${item.completed ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"
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
      )}
    </>
  );
}

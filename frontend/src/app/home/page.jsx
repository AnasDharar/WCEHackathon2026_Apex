"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import { api } from "@/lib/api";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const box_shadow = "shadow-[0_4px_20px_rgba(0,0,0,0.03)]";

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
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className={`h-36 animate-pulse rounded-2xl bg-neutral-100 ${idx < 2 ? "lg:col-span-3" : "lg:col-span-2"}`}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 font-google lg:grid-cols-6">

          {/* ── Row 1: Live Appointment (wide) + Assessment Results (narrow) ── */}
          <div className={`lg:col-span-4 rounded-[28px] ${box_shadow} bg-white p-7`}>
            <h2 className="mb-4 text-[16px] font-bold text-slate-800 tracking-tight">Live Appointments</h2>
            <div className="space-y-3">
              {(overview?.live_appointments || []).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between rounded-xl bg-emerald-50/50 p-4 border border-emerald-50">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900">{apt.doctor}</h3>
                    <p className="text-[13px] text-neutral-500 mt-0.5">{apt.specialty}</p>
                    <p className="mt-1.5 text-[13px] text-neutral-600">
                      {apt.date} &middot; {apt.time}
                    </p>
                  </div>
                  {apt.meet_link ? (
                    <a
                      href={apt.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-[14px] bg-emerald-600 px-6 py-2.5 text-[13px] font-semibold text-white transition-all shadow-sm hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5"
                    >
                      Join
                    </a>
                  ) : (
                    <span className="rounded-lg bg-emerald-100/50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      {apt.mode}
                    </span>
                  )}
                </div>
              ))}
              {(overview?.live_appointments || []).length === 0 && (
                <p className="text-sm text-neutral-500 py-4">No upcoming appointments</p>
              )}
            </div>
          </div>

          <div className={`lg:col-span-2 rounded-[28px] ${box_shadow} bg-white p-7`}>
            <h2 className="mb-4 text-[16px] font-bold text-slate-800 tracking-tight">Assessment Results</h2>
            <div className="space-y-3">
              {(overview?.test_results || []).slice(0, 4).map((result) => (
                <div key={result.id} className="rounded-xl bg-emerald-50/50 p-3.5 border border-emerald-50">
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-neutral-900">{result.title}</h3>
                    <span className="shrink-0 rounded-md bg-emerald-100/60 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                      {result.score}
                    </span>
                  </div>
                  <p className="text-[12px] text-neutral-600 leading-relaxed">{result.feedback}</p>
                  <p className="mt-1.5 text-[11px] text-neutral-400">{result.date}</p>
                </div>
              ))}
              {(overview?.test_results || []).length === 0 && (
                <p className="text-sm text-neutral-500 py-4">No assessment data available</p>
              )}
            </div>
          </div>

          {/* ── Row 2: Today's Habits + Resources for You (equal width) ── */}
          <div className={`lg:col-span-3 rounded-[28px] ${box_shadow} bg-white p-7 flex flex-col`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">Today&apos;s Habits</h2>
            </div>

            {/* Progress bar moved to top */}
            <div className="mb-4 pb-4 border-b border-emerald-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-neutral-600">Today&apos;s progress</span>
                <span className="text-[13px] font-semibold text-neutral-900">{completedCount}/{todayHabits.length} done</span>
              </div>
              <div className="h-2 w-full rounded-full bg-emerald-100/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto">
              {todayHabits.map((habit) => (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => handleToggleHabit(habit)}
                  disabled={savingHabitId === habit.id}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-emerald-50/50 disabled:opacity-70"
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${habit.done
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-emerald-200 bg-white"
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
                  <div className="flex-1">
                    <p className={`text-sm ${habit.done ? "text-neutral-400 line-through" : "text-neutral-900"}`}>{habit.name}</p>
                    <p className="text-[11px] text-neutral-500">{habit.schedule}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className={`lg:col-span-3 rounded-[28px] ${box_shadow} bg-white p-7`}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">Habit Calendar</h2>
              <span className="text-[12px] text-slate-500 font-medium">Filled dots show completed days</span>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div key={day} className="py-1 text-center text-[11px] font-medium text-neutral-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {(overview?.habit_calendar || []).map((item, index) => (
                <div key={index} className="flex justify-center py-1">
                  {item.day ? (
                    <div
                      className={`flex h-[40px] w-full max-w-[40px] items-center justify-center rounded-2xl text-[14px] transition-colors ${item.completed ? "bg-emerald-600 text-white font-medium shadow-md shadow-emerald-600/20" : "bg-slate-100 text-slate-400 font-medium"
                        }`}
                    >
                      {item.day}
                    </div>
                  ) : (
                    <div className="h-[40px] w-[40px]" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-6 flex flex-col pt-4">
            <h2 className="mb-5 text-[18px] font-bold text-slate-800 tracking-tight">Resources for You</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(overview?.resource_highlights || []).map((resource) => (
                <article
                  key={`${resource.id}-${resource.title}`}
                  className="group flex flex-col overflow-hidden rounded-[24px] border-none bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-emerald-50/50 relative">
                    <img
                      src={resource.thumbnail_url || `https://picsum.photos/seed/${encodeURIComponent(resource.id + '-' + resource.title)}/400/225`}
                      alt={resource.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.target.src = `https://picsum.photos/seed/${encodeURIComponent(resource.title)}/400/225`; }}
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-neutral-800 backdrop-blur-sm shadow-sm backdrop-filter">
                        {resource.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6 bg-white">
                    <h3 className="text-[15px] font-semibold text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {resource.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[13px] text-slate-500 leading-relaxed">
                      {resource.description}
                    </p>
                    <div className="mt-auto pt-5 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-slate-400">
                        {resource.source || "Curated Guide"}
                      </span>
                    </div>
                    <a
                      href={resource.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 block text-center w-full rounded-[16px] bg-emerald-600 px-5 py-3 text-[13px] font-semibold tracking-wide text-white transition-all shadow-sm hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5"
                      onClick={(event) => {
                        if (!resource.url) {
                          event.preventDefault();
                        }
                      }}
                    >
                      Open Resource
                    </a>
                  </div>
                </article>
              ))}
            </div>
            {(overview?.resource_highlights || []).length === 0 && (
              <div className={`rounded-[24px] ${box_shadow} bg-white p-7 flex items-center justify-center text-sm text-neutral-500 py-10`}>
                No curated resources at this time.
              </div>
            )}
          </div>

          {/* ── Row 3: Your Groups + Habit Calendar ── */}
          {/* <div className={`lg:col-span-3 rounded-2xl ${box_shadow} bg-white p-5`}>
            <h2 className="mb-3 text-[15px] font-semibold text-neutral-800">Your Groups</h2>
            <div className="space-y-2">
              {[
                { id: 1, name: "Anxiety Support", members: 124, next: "Today, 6 PM" },
                { id: 2, name: "Mindfulness Practice", members: 89, next: "Tomorrow, 8 AM" },
                { id: 3, name: "Sleep Hygiene", members: 256, next: "Fri, 9 PM" }
              ].map((group) => (
                <div
                  key={group.id}
                  className="rounded-xl bg-neutral-50 px-3.5 py-3"
                >
                  <p className="text-sm font-medium text-neutral-800">{group.name}</p>
                  <p className="text-[12px] text-neutral-400 mt-0.5">
                    {group.members} members &middot; Next: {group.next}
                  </p>
                </div>
              ))}
            </div>
          </div> */}


        </div>
      )}
    </>
  );
}

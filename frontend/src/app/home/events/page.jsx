"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import { api } from "@/lib/api";

const categoryTabs = [
  { id: "all", label: "All" },
  { id: "workshop", label: "Workshops" },
  { id: "masterclass", label: "Masterclasses" },
  { id: "community-circle", label: "Community Circles" },
];

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5";

export default function Events() {
  const [featured, setFeatured] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [weeklyLineup, setWeeklyLineup] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadEvents() {
      setLoading(true);
      setError("");
      try {
      const res = await api.get("/events", {
          params: {
            category: activeCategory === "all" ? undefined : activeCategory,
          },
        });

        if (!mounted) {
          return;
        }

        setFeatured(res?.featured || res?.data?.featured || null);
        setUpcoming(res?.upcoming || res?.events || res?.data?.upcoming || []);
        const rawLineup = res?.weekly_lineup || res?.weeklyLineup || res?.data?.weekly_lineup || [];
        setWeeklyLineup(
          (Array.isArray(rawLineup) ? rawLineup : []).map((item, idx) => ({
            id: item.id ?? idx,
            topic: item.topic || item.title || "Event",
            day: item.day || item.date || "TBD",
            time: item.time || "TBD",
          }))
        );
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load events.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadEvents();
    return () => {
      mounted = false;
    };
  }, [activeCategory]);

  const sortedLineup = useMemo(() => weeklyLineup || [], [weeklyLineup]);

  const runEventAction = async (eventId, mode) => {
    const key = `${eventId}-${mode}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    setError("");

    try {
      const endpoint =
        mode === "waitlist" ? `/events/${eventId}/waitlist` : `/events/${eventId}/reserve`;
      const res = await api.post(endpoint, {});
      const updatedEvent = res?.event || res?.data?.event;

      if (updatedEvent) {
        setUpcoming((prev) =>
          prev.map((item) => (item.id === eventId ? { ...item, ...updatedEvent } : item))
        );
      }
    } catch (err) {
      setError(err.message || "Unable to update registration.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <>
      <Header
        title="Events"
        subtitle="Register for workshops, masterclasses, and community circles."
      />

      {error && (
        <div className="mb-6 rounded-xl ring-1 ring-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-gray-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 animate-pulse">
          <div className={`h-40 lg:col-span-5 ${static_card_style} bg-gray-50`} />
          <div className={`h-64 lg:col-span-3 ${static_card_style} bg-gray-50`} />
          <div className={`h-64 lg:col-span-2 ${static_card_style} bg-gray-50`} />
        </div>
      ) : (
        <div className="space-y-8 pb-20">
          {featured && (
            <div className="rounded-2xl ring-1 ring-emerald-200 bg-emerald-50 p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:ring-emerald-300">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
              <div className="relative z-10">
                <span className="mb-3 inline-flex items-center rounded-full bg-white/80 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-900 shadow-sm ring-1 ring-emerald-100">
                  Featured Event
                </span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-emerald-950">{featured.title}</h2>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium text-gray-900">
                  <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> {featured.date}</span>
                  <span className="hidden sm:inline text-emerald-300">•</span>
                  <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {featured.time}</span>
                  <span className="hidden sm:inline text-emerald-300">•</span>
                  <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> {featured.mode}</span>
                </div>
                <p className="mt-5 text-base font-medium text-gray-900 leading-relaxed max-w-3xl">{featured.description}</p>
                <button
                  type="button"
                  className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer"
                >
                  Join Featured Event
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`rounded-full ring-1 px-5 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 truncate ${
                  activeCategory === tab.id
                    ? "ring-emerald-600 bg-emerald-600 text-white shadow-md transform -translate-y-0.5"
                    : "ring-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:ring-gray-300 hover:shadow-sm"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              {upcoming.length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <svg className="w-10 h-10 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-base font-medium text-gray-500 text-center max-w-sm">No upcoming events found for this category.</span>
                </div>
              ) : (
                upcoming.map((event) => (
                  <div
                    key={event.id}
                    className="group rounded-xl ring-1 ring-black/5 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:ring-black/10"
                  >
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-gray-800 transition-colors duration-200 truncate">{event.title}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-gray-500">
                          <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> {event.date}</span>
                          <span className="hidden sm:inline text-gray-300">•</span>
                          <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {event.time}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
                          <span className="bg-gray-100 px-2.5 py-1 rounded truncate max-w-xs">Host: {event.host}</span>
                          <span className="bg-gray-100 px-2.5 py-1 rounded">{event.mode}</span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 ring-1 ring-emerald-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-800">
                        {event.category_label || event.type || "Event"}
                      </span>
                    </div>

                    <div className="mb-5 flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden ring-1 ring-inset ring-gray-200">
                         <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round(((event.attendees || 0) / (event.capacity || 1)) * 100))}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-gray-500 shrink-0 min-w-[60px] text-right">
                        {event.attendees}/{event.capacity} seats
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => runEventAction(event.id, "reserve")}
                        disabled={actionLoading[`${event.id}-reserve`]}
                        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center gap-2"
                      >
                        {actionLoading[`${event.id}-reserve`] ? "Processing..." : "Reserve Spot"}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => runEventAction(event.id, "waitlist")}
                        disabled={actionLoading[`${event.id}-waitlist`]}
                        className="rounded-xl bg-white ring-1 ring-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm active:scale-[0.98] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        {actionLoading[`${event.id}-waitlist`] ? "Waitlisting..." : "Join Waitlist"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-6 lg:col-span-2">
              <div className={static_card_style}>
                <h3 className="mb-5 text-xl font-bold tracking-tight text-gray-900">Weekly Lineup</h3>
                {sortedLineup.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <p className="text-sm font-medium text-gray-500 text-center">No lineup scheduled.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                    {sortedLineup.map((item) => (
                        <div
                        key={item.id}
                        className="rounded-xl ring-1 ring-gray-100 bg-gray-50 px-4 py-3 transition-colors duration-200 hover:bg-white hover:ring-emerald-200 hover:shadow-sm"
                        >
                        <p className="text-sm font-bold text-gray-800 tracking-tight truncate">{item.topic}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-xs font-medium text-gray-800">
                            <span className="uppercase tracking-wider font-bold">{item.day}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500">{item.time}</span>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
              </div>

              <div className="rounded-2xl bg-emerald-800 p-6 text-white shadow-lg ring-1 ring-emerald-900/50 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                    <svg className="w-6 h-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    <p className="text-base font-bold tracking-tight">Privacy Reminder</p>
                </div>
                <p className="text-sm font-medium text-emerald-100/90 leading-relaxed relative z-10">
                  Participation details remain completely confidential and are visible only within the dedicated wellness support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

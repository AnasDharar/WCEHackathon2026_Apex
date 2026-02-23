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
        setWeeklyLineup(res?.weekly_lineup || res?.weeklyLineup || res?.data?.weekly_lineup || []);
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
        <div className="space-y-6">
          {featured && (
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Featured Event
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-800">{featured.title}</h2>
              <p className="mt-1 text-sm text-gray-600">
                {featured.date} • {featured.time} • {featured.mode}
              </p>
              <p className="mt-2 text-sm text-gray-700">{featured.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === tab.id
                    ? "bg-emerald-600 text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              {upcoming.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500">
                        {event.date} • {event.time}
                      </p>
                      <p className="text-xs text-gray-500">
                        Host: {event.host} • Mode: {event.mode}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      {event.category_label || event.type || "Event"}
                    </span>
                  </div>

                  <div className="mb-3 text-sm text-gray-600">
                    Seats: {event.attendees}/{event.capacity}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => runEventAction(event.id, "reserve")}
                      disabled={actionLoading[`${event.id}-reserve`]}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {actionLoading[`${event.id}-reserve`] ? "Saving..." : "Reserve Spot"}
                    </button>
                    <button
                      type="button"
                      onClick={() => runEventAction(event.id, "waitlist")}
                      disabled={actionLoading[`${event.id}-waitlist`]}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      {actionLoading[`${event.id}-waitlist`] ? "Saving..." : "Join Waitlist"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-lg font-semibold text-gray-800">Weekly Lineup</h3>
                <div className="space-y-2">
                  {sortedLineup.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-gray-800">{item.topic}</p>
                      <p className="text-xs text-gray-500">
                        {item.day} • {item.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-600 p-5 text-white shadow-sm">
                <p className="text-sm font-semibold">Privacy Reminder</p>
                <p className="mt-2 text-sm text-emerald-100">
                  Participation details remain visible only within the wellness support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

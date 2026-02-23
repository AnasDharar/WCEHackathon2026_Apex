"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { getUserSession } from "@/lib/userSession";

const bookingModes = ["Online", "In-person", "Video Session", "Audio Session"];
const statThemes = [
  "from-emerald-500 to-emerald-600",
  "from-blue-500 to-cyan-500",
  "from-amber-500 to-orange-500",
];

const modeBadges = {
  Online: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Video Session": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Audio Session": "bg-sky-50 text-sky-700 border-sky-200",
  "In-person": "bg-amber-50 text-amber-700 border-amber-200",
};

function counselorInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Appointments() {
  const { addNotification } = useNotification() || { addNotification: () => {} };

  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [openSlots, setOpenSlots] = useState([]);
  const [prepChecklist, setPrepChecklist] = useState([]);

  const [languageFilter, setLanguageFilter] = useState("All");
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [bookingData, setBookingData] = useState({
    preferred_slot: "",
    mode: "Online",
    location: "",
    notes: "",
  });
  const [rescheduleSelection, setRescheduleSelection] = useState({});

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [reschedulingId, setReschedulingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setCurrentUser(getUserSession());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      setLoading(true);
      setError("");
      try {
        const [statsRes, counselorRes, upcomingRes, slotsRes, checklistRes] = await Promise.all([
          api.get("/appointments/stats"),
          api.get("/appointments/counselors"),
          api.get("/appointments/upcoming"),
          api.get("/appointments/open-slots"),
          api.get("/appointments/prep-checklist"),
        ]);

        if (!mounted) {
          return;
        }

        setStats(statsRes?.data || []);
        setCounselors(counselorRes?.data || []);
        setUpcoming(upcomingRes?.data || []);
        setOpenSlots(slotsRes?.data || []);
        setPrepChecklist(checklistRes?.data || []);
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load appointments.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInitial();
    return () => {
      mounted = false;
    };
  }, []);

  const languages = useMemo(() => {
    const langSet = new Set();
    counselors.forEach((item) => (item.languages || []).forEach((lang) => langSet.add(lang)));
    return ["All", ...Array.from(langSet)];
  }, [counselors]);

  const filteredCounselors = useMemo(() => {
    if (languageFilter === "All") {
      return counselors;
    }
    return counselors.filter((item) =>
      (item.languages || []).some((lang) => lang.toLowerCase() === languageFilter.toLowerCase())
    );
  }, [counselors, languageFilter]);

  const nextAppointment = useMemo(() => upcoming[0] || null, [upcoming]);

  const refreshAppointmentsData = async () => {
    const [statsRes, upcomingRes, slotsRes] = await Promise.all([
      api.get("/appointments/stats"),
      api.get("/appointments/upcoming"),
      api.get("/appointments/open-slots"),
    ]);
    setStats(statsRes?.data || []);
    setUpcoming(upcomingRes?.data || []);
    setOpenSlots(slotsRes?.data || []);
  };

  const bookAppointment = async () => {
    if (!selectedCounselor) {
      setError("Select a counselor first.");
      return;
    }
    if (!bookingData.preferred_slot) {
      setError("Please choose a preferred slot.");
      return;
    }

    setBooking(true);
    setError("");
    try {
      const payload = {
        counselor_id: selectedCounselor.id,
        preferred_slot: bookingData.preferred_slot,
        mode: bookingData.mode,
        location: bookingData.location || null,
        notes: bookingData.notes || null,
      };
      const res = await api.post("/appointments/book", payload);
      const appointment = res?.appointment;

      addNotification({
        title: "Appointment Booked",
        message: `Session with ${appointment?.doctor || selectedCounselor.name} scheduled for ${appointment?.date} at ${appointment?.time}.`,
      });

      setSelectedCounselor(null);
      setBookingData({ preferred_slot: "", mode: "Online", location: "", notes: "" });
      await refreshAppointmentsData();
    } catch (err) {
      setError(err.message || "Failed to book appointment.");
    } finally {
      setBooking(false);
    }
  };

  const rescheduleAppointment = async (appointmentId) => {
    const preferred_slot = rescheduleSelection[appointmentId];
    if (!preferred_slot) {
      setError("Select a slot before rescheduling.");
      return;
    }

    setReschedulingId(appointmentId);
    setError("");
    try {
      const res = await api.post(`/appointments/${appointmentId}/reschedule`, {
        preferred_slot,
      });

      addNotification({
        title: "Appointment Rescheduled",
        message: `${res?.appointment?.doctor || "Session"} moved to ${res?.appointment?.date} at ${res?.appointment?.time}.`,
      });

      await refreshAppointmentsData();
    } catch (err) {
      setError(err.message || "Failed to reschedule.");
    } finally {
      setReschedulingId(null);
    }
  };

  return (
    <>
      <Header
        title="Appointments"
        subtitle={`${
          currentUser?.first_name ? `${currentUser.first_name}, ` : ""
        }book confidential sessions, track upcoming appointments, and reschedule quickly.`}
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
              className="h-40 animate-pulse rounded-3xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-6 shadow-sm">
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" />

            <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <p className="mb-2 inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Session Center
                </p>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {nextAppointment ? "Your next session is ready" : "Plan your next wellness session"}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-gray-600">
                  Choose a counselor, confirm a slot, and keep your appointments organized in one place.
                </p>

                {nextAppointment && (
                  <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">{nextAppointment.doctor}</span>
                    <span>{nextAppointment.date}</span>
                    <span>{nextAppointment.time}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                        modeBadges[nextAppointment.mode] || "border-gray-200 bg-gray-50 text-gray-700"
                      }`}
                    >
                      {nextAppointment.mode}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current profile</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {currentUser?.name || nextAppointment?.patient_name || "Wellness Member"}
                </p>
                <p className="mt-1 text-xs text-gray-500">{currentUser?.email || "No email synced"}</p>
                <p className="mt-3 text-xs text-gray-600">
                  This profile name is shared with booking and AI chat context.
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {stats.map((item, idx) => (
              <div
                key={item.id}
                className={`rounded-2xl bg-gradient-to-br p-[1px] shadow-sm ${
                  statThemes[idx % statThemes.length]
                }`}
              >
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-7">
            <div className="space-y-6 xl:col-span-4">
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Available Counselors</h2>
                    <p className="text-xs text-gray-500">Select a counselor to enable booking.</p>
                  </div>
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {filteredCounselors.map((item) => {
                    const isSelected = selectedCounselor?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedCounselor(item)}
                        className={`w-full rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-emerald-300 bg-emerald-50 shadow-sm"
                            : "border-gray-200 bg-gray-50 hover:border-emerald-200 hover:bg-emerald-50/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                              {counselorInitials(item.name)}
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                              <p className="text-sm text-emerald-700">{item.specialty}</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                            {item.rating} / 5
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          {item.years_experience} years experience | {(item.languages || []).join(", ")}
                        </p>
                      </button>
                    );
                  })}

                  {!filteredCounselors.length && (
                    <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                      No counselors found for this language filter.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
                <div className="space-y-3">
                  {upcoming.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-4"
                    >
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{item.doctor}</h3>
                          <p className="text-xs text-gray-500">
                            {item.specialty} | {item.date} | {item.time}
                          </p>
                          {item.patient_name && (
                            <p className="mt-1 text-xs text-gray-500">For: {item.patient_name}</p>
                          )}
                        </div>
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                          {item.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {item.meet_link ? (
                          <a
                            href={item.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            Join Meeting
                          </a>
                        ) : (
                          <span className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600">
                            {item.mode}
                          </span>
                        )}

                        <select
                          value={rescheduleSelection[item.id] || ""}
                          onChange={(e) =>
                            setRescheduleSelection((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-emerald-500"
                        >
                          <option value="">Reschedule slot</option>
                          {openSlots.map((slot) => (
                            <option key={`${item.id}-${slot}`} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => rescheduleAppointment(item.id)}
                          disabled={reschedulingId === item.id}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                        >
                          {reschedulingId === item.id ? "Saving..." : "Reschedule"}
                        </button>
                      </div>
                    </div>
                  ))}

                  {!upcoming.length && (
                    <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                      No upcoming sessions yet. Book one from the panel.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6 xl:col-span-3">
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Book Appointment</h2>
                {selectedCounselor ? (
                  <>
                    <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs text-emerald-700">Selected counselor</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedCounselor.name}</p>
                      <p className="text-xs text-gray-600">{selectedCounselor.specialty}</p>
                    </div>

                    <select
                      value={bookingData.preferred_slot}
                      onChange={(e) =>
                        setBookingData((prev) => ({ ...prev, preferred_slot: e.target.value }))
                      }
                      className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="">Choose slot</option>
                      {openSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>

                    <div className="mb-2 grid grid-cols-2 gap-2">
                      {bookingModes.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setBookingData((prev) => ({ ...prev, mode }))}
                          className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                            bookingData.mode === mode
                              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>

                    <input
                      value={bookingData.location}
                      onChange={(e) =>
                        setBookingData((prev) => ({ ...prev, location: e.target.value }))
                      }
                      placeholder="Preferred location (optional)"
                      className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                    <textarea
                      value={bookingData.notes}
                      onChange={(e) =>
                        setBookingData((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      rows={3}
                      placeholder="Session notes (optional)"
                      className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />

                    <button
                      type="button"
                      onClick={bookAppointment}
                      disabled={booking}
                      className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {booking ? "Booking..." : "Confirm Booking"}
                    </button>
                  </>
                ) : (
                  <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                    Select any counselor from the list to start booking.
                  </p>
                )}
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Open Slots</h2>
                  <span className="text-xs text-gray-500">{openSlots.length} available</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {openSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setBookingData((prev) => ({ ...prev, preferred_slot: slot }))}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        bookingData.preferred_slot === slot
                          ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                          : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                  {!openSlots.length && <p className="text-sm text-gray-500">No open slots currently available.</p>}
                </div>
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Session Prep Checklist</h2>
                <ul className="space-y-2">
                  {prepChecklist.map((item, idx) => (
                    <li key={`${item}-${idx}`} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

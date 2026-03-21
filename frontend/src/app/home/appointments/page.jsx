"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { getUserSession } from "@/lib/userSession";
import { useRouter } from "next/navigation";

const bookingModes = ["Online", "In-person", "Video Session", "Audio Session"];
const statThemes = [
  "from-emerald-500 to-emerald-600",
  "from-blue-500 to-cyan-500",
  "from-amber-500 to-orange-500",
];

const modeBadges = {
  Online: "bg-emerald-50 text-gray-900 ring-emerald-200",
  "Video Session": "bg-emerald-50 text-gray-900 ring-emerald-200",
  "Audio Session": "bg-sky-50 text-sky-800 ring-sky-200",
  "In-person": "bg-amber-50 text-gray-900 ring-amber-200",
};

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5";

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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [isTherapist, setIsTherapist] = useState(false);
  const router = useRouter();

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

  const normalizeStats = (raw) => {
    if (Array.isArray(raw)) return raw;
    return [
      { id: "total", label: "Total Sessions", value: raw?.total ?? 0 },
      { id: "booked", label: "Booked", value: raw?.booked ?? 0 },
      { id: "rescheduled", label: "Rescheduled", value: raw?.rescheduled ?? 0 },
    ];
  };

  const normalizeCounselors = (raw) =>
    (Array.isArray(raw) ? raw : []).map((item, idx) => ({
      id: item.id ?? idx + 1,
      name: item.name,
      specialty: item.specialty || "Wellness Counselor",
      rating: item.rating ?? 4.7,
      years_experience: item.years_experience ?? 5,
      languages: item.languages || ["English"],
    }));

  const normalizeAppointments = (raw) =>
    (Array.isArray(raw) ? raw : []).map((item) => {
      const preferred = item.preferred_slot || "";
      const [datePart, ...timeParts] = preferred.split(" ");
      return {
        ...item,
        doctor: item.doctor || item.counselor_name || "Counselor",
        specialty: item.specialty || "Wellness Support",
        date: item.date || datePart || "TBD",
        time: item.time || timeParts.join(" ") || preferred || "TBD",
        status: item.status || "booked",
        mode: item.mode || "Online",
      };
    });

  useEffect(() => {
    setCurrentUser(getUserSession());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      const sessionUser = getUserSession();
      if (sessionUser?.role === "therapist") {
        if (mounted) {
           setIsTherapist(true);
           setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [statsRes, counselorRes, upcomingRes, checklistRes] = await Promise.all([
          api.get("/appointments/stats"),
          api.get("/appointments/counselors"),
          api.get("/appointments/upcoming"),
          api.get("/appointments/prep-checklist"),
        ]);

        if (!mounted) {
          return;
        }

        setStats(normalizeStats(statsRes?.data || {}));
        setCounselors(normalizeCounselors(counselorRes?.data || []));
        setUpcoming(normalizeAppointments(upcomingRes?.data || []));
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

  useEffect(() => {
    let mounted = true;
    async function fetchSlots() {
        if (!selectedCounselor || !selectedDate) {
            if (mounted) setOpenSlots([]);
            return;
        }
        try {
            const res = await api.get(`/appointments/open-slots?therapist_id=${selectedCounselor.id}&date=${selectedDate}`);
            if (mounted) setOpenSlots(res.data || []);
        } catch(e) {
            console.error("Failed to fetch slots", e);
            if (mounted) setOpenSlots([]);
        }
    }
    fetchSlots();
    return () => mounted = false;
  }, [selectedCounselor, selectedDate]);

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
    const [statsRes, upcomingRes] = await Promise.all([
      api.get("/appointments/stats"),
      api.get("/appointments/upcoming"),
    ]);
    setStats(normalizeStats(statsRes?.data || {}));
    setUpcoming(normalizeAppointments(upcomingRes?.data || []));
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
      const selectedSlotParams = openSlots.find(s => s.display === bookingData.preferred_slot) || openSlots[0];
      const payload = {
        therapist_id: selectedCounselor.id,
        counselor_name: selectedCounselor.name,
        preferred_slot: `${selectedDate} ${bookingData.preferred_slot}`,
        start_time: selectedSlotParams ? selectedSlotParams.start : new Date().toISOString(),
        end_time: selectedSlotParams ? selectedSlotParams.end : new Date().toISOString(),
        mode: bookingData.mode,
        location: bookingData.location || null,
        notes: bookingData.notes || null,
      };
      const res = await api.post("/appointments/book", payload);
      const appointment = normalizeAppointments([res?.appointment || res?.data])[0] || {};

      addNotification({
        title: "Appointment Requested",
        message: `Your request was sent to ${appointment?.doctor || selectedCounselor.name} for approval.`,
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
      const appointment = normalizeAppointments([res?.appointment || res?.data])[0] || {};

      addNotification({
        title: "Appointment Rescheduled",
        message: `${appointment?.doctor || "Session"} moved to ${appointment?.date} at ${appointment?.time}.`,
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
        <div className="mb-6 rounded-xl ring-1 ring-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-gray-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 animate-pulse">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className={`h-40 ${static_card_style} bg-gray-50`}
            />
          ))}
        </div>
      ) : isTherapist ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 pb-20 mt-10">
           <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 ring-4 ring-emerald-50">
             <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
           </div>
           <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Therapist Portal</h2>
           <p className="text-lg text-gray-600 max-w-lg mb-10 leading-relaxed">
             This booking page is designed for patients. Visit your dedicated Therapist Dashboard to view and manage your scheduled appointments.
           </p>
           <button 
             onClick={() => router.push('/therapist')}
             className="rounded-xl bg-emerald-600 px-8 py-4 text-base font-bold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-lg active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
           >
             Go to Therapist Dashboard
           </button>
        </div>
      ) : (
        <div className="space-y-8 pb-20">
          <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-8 shadow-sm ring-1 ring-black/5">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl" />

            <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 flex flex-col justify-center">
                <span className="mb-3 inline-flex w-max items-center rounded-full bg-white/80 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-800 shadow-sm ring-1 ring-black/5">
                  Session Center
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                  {nextAppointment ? "Your next session is ready" : "Plan your next wellness session"}
                </h2>
                <p className="max-w-xl text-base text-gray-600 leading-relaxed">
                  Choose a counselor, confirm a slot, and keep your appointments organized in one place.
                </p>

                {nextAppointment && (
                  <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 text-sm text-gray-700 shadow-sm ring-1 ring-black/5 max-w-2xl transition-all duration-200 hover:shadow-md">
                    <span className="font-bold text-gray-900">{nextAppointment.doctor}</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-medium">{nextAppointment.date}</span>
                    <span className="font-medium">{nextAppointment.time}</span>
                    <span
                      className={`ml-auto rounded-full ring-1 px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        modeBadges[nextAppointment.mode] || "ring-gray-200 bg-gray-50 text-gray-700"
                      }`}
                    >
                      {nextAppointment.mode}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-100 bg-white/60 backdrop-blur-md p-6 shadow-sm ring-1 ring-black/5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Current profile</p>
                <p className="text-lg font-bold tracking-tight text-gray-900 truncate">
                  {currentUser?.name || nextAppointment?.patient_name || "Wellness Member"}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-500 truncate">{currentUser?.email || "No email synced"}</p>
                <p className="mt-4 text-xs font-medium text-gray-400 leading-relaxed">
                  This profile name is shared with booking and AI chat context.
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {stats.map((item, idx) => (
              <div
                key={item.id}
                className={`rounded-2xl bg-linear-to-br p-px shadow-sm ${
                  statThemes[idx % statThemes.length]
                }`}
              >
                <div className="flex h-full flex-col justify-between rounded-2xl bg-white p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{item.label}</p>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-gray-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-7">
            <div className="space-y-8 xl:col-span-4">
              <section className={static_card_style}>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Available Counselors</h2>
                    <p className="mt-1 text-sm font-medium text-gray-500">Select a counselor to enable booking.</p>
                  </div>
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="rounded-lg ring-1 ring-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-700 outline-none transition-all duration-200 hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  {filteredCounselors.map((item) => {
                    const isSelected = selectedCounselor?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedCounselor(item)}
                        className={`w-full rounded-xl text-left transition-all duration-200 ease-in-out ring-1 p-5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 hover:-translate-y-0.5 active:scale-[0.98] ${
                          isSelected
                            ? "ring-emerald-400 bg-emerald-50 shadow-md transform -translate-y-0.5"
                            : "ring-gray-200 bg-white hover:ring-emerald-200 hover:bg-emerald-50/30 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base font-bold text-gray-800 shadow-sm ring-1 ring-emerald-200">
                              {counselorInitials(item.name)}
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-gray-900 tracking-tight">{item.name}</h3>
                              <p className="mt-0.5 text-sm font-medium text-gray-800 truncate">{item.specialty}</p>
                            </div>
                          </div>
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 ring-1 ring-amber-200 px-2.5 py-1 text-xs font-bold text-gray-800">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            {item.rating}
                          </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center text-xs font-medium text-gray-500">
                          <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>{item.years_experience} years exp</span>
                          <span className="hidden sm:block text-gray-300">•</span>
                          <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>{(item.languages || []).join(", ")}</span>
                        </div>
                      </button>
                    );
                  })}

                  {!filteredCounselors.length && (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <svg className="w-8 h-8 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <p className="text-sm font-medium text-gray-500">No counselors found for this language filter.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className={static_card_style}>
                <h2 className="mb-6 text-xl font-bold tracking-tight text-gray-900">Upcoming Sessions</h2>
                <div className="space-y-4">
                  {upcoming.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/5"
                    >
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-900 tracking-tight truncate">{item.doctor}</h3>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                             <span className="text-gray-800 bg-emerald-50 px-2 py-0.5 rounded">{item.specialty}</span>
                             <span>{item.date}</span>
                             <span>{item.time}</span>
                          </div>
                          {item.patient_name && (
                            <p className="mt-2 text-xs font-semibold text-gray-500 truncate">For: {item.patient_name}</p>
                          )}
                        </div>
                        <span className="shrink-0 rounded-full bg-blue-50 ring-1 ring-blue-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-800">
                          {item.status}
                        </span>
                      </div>

                      <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                        {item.meet_link ? (
                          <a
                            href={item.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          >
                            Join Meeting <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </a>
                        ) : (
                          <span className={`inline-flex items-center justify-center rounded-lg ring-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider ${modeBadges[item.mode] || 'ring-gray-200 bg-gray-50 text-gray-700'}`}>
                            {item.mode}
                          </span>
                        )}

                        <div className="flex-1 sm:flex-none flex items-center gap-2">
                            <select
                            value={rescheduleSelection[item.id] || ""}
                            onChange={(e) =>
                                setRescheduleSelection((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                                }))
                            }
                            className="flex-1 sm:flex-none sm:w-40 rounded-lg ring-1 ring-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                            >
                            <option value="">Reschedule slot</option>
                            {openSlots.map((slot) => (
                                <option key={`${item.id}-${slot.display}`} value={slot.display}>
                                {slot.display}
                                </option>
                            ))}
                            </select>

                            <button
                            type="button"
                            onClick={() => rescheduleAppointment(item.id)}
                            disabled={reschedulingId === item.id}
                            className="rounded-lg bg-white ring-1 ring-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm active:scale-[0.98] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                            {reschedulingId === item.id ? "Saving..." : "Apply"}
                            </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!upcoming.length && (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <svg className="w-8 h-8 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-sm font-medium text-gray-500">No upcoming sessions yet. Book one from the panel.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-8 xl:col-span-3">
              <section className={static_card_style}>
                <h2 className="mb-5 text-xl font-bold tracking-tight text-gray-900">Book Appointment</h2>
                {selectedCounselor ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-1">Selected Counselor</p>
                      <p className="text-base font-bold text-gray-900 tracking-tight">{selectedCounselor.name}</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCounselor.specialty}</p>
                    </div>

                    <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Date</label>
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="mb-5 w-full rounded-xl ring-1 ring-gray-200 bg-gray-50 p-3.5 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />

                    <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Slot</label>
                    <select
                      value={bookingData.preferred_slot}
                      onChange={(e) =>
                        setBookingData((prev) => ({ ...prev, preferred_slot: e.target.value }))
                      }
                      className="mb-5 w-full rounded-xl ring-1 ring-gray-200 bg-gray-50 p-3.5 text-sm font-medium text-gray-900 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Choose an available slot...</option>
                      {openSlots.map((slot) => (
                        <option key={slot.display} value={slot.display}>
                          {slot.display}
                        </option>
                      ))}
                    </select>

                    <label className="block text-sm font-bold text-gray-700 mb-2">Session Mode</label>
                    <div className="mb-5 grid grid-cols-2 gap-3">
                      {bookingModes.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setBookingData((prev) => ({ ...prev, mode }))}
                          className={`rounded-xl ring-1 px-4 py-3 text-sm font-bold transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                            bookingData.mode === mode
                              ? "ring-emerald-500 bg-emerald-500 text-white shadow-md"
                              : "ring-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:ring-gray-300 hover:shadow-sm"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>

                    <label className="block text-sm font-bold text-gray-700 mb-2">Location (if applicable)</label>
                    <input
                      value={bookingData.location}
                      onChange={(e) =>
                        setBookingData((prev) => ({ ...prev, location: e.target.value }))
                      }
                      placeholder="E.g., Clinic Name, Zoom"
                      className="mb-5 w-full rounded-xl ring-1 ring-gray-200 bg-gray-50 p-3.5 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />

                    <label className="block text-sm font-bold text-gray-700 mb-2">Session Notes</label>
                    <textarea
                      value={bookingData.notes}
                      onChange={(e) =>
                        setBookingData((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      rows={3}
                      placeholder="Topics you'd like to discuss..."
                      className="mb-6 w-full rounded-xl ring-1 ring-gray-200 bg-gray-50 p-3.5 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />

                    <button
                      type="button"
                      onClick={bookAppointment}
                      disabled={booking}
                      className="w-full rounded-xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer"
                    >
                      {booking ? "Booking..." : "Confirm Booking"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-100 rounded-xl bg-emerald-50/30">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm ring-1 ring-gray-100 mb-4">
                        <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                    <p className="text-sm font-bold text-gray-900 mb-2">Select a Counselor</p>
                    <p className="text-xs font-medium text-gray-800/70 text-center max-w-[200px]">
                      Choose a counselor from the list to view their schedule and begin booking.
                    </p>
                  </div>
                )}
              </section>

              <section className={static_card_style}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold tracking-tight text-gray-900">Open Slots</h2>
                  <span className="rounded-full bg-emerald-50 ring-1 ring-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-800">
                    {openSlots.length} available
                  </span>
                </div>
                {openSlots.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {openSlots.map((slot) => (
                      <button
                        key={slot.display}
                        type="button"
                        onClick={() => setBookingData((prev) => ({ ...prev, preferred_slot: slot.display }))}
                        className={`rounded-lg ring-1 px-4 py-2 text-sm font-bold transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                          bookingData.preferred_slot === slot.display
                            ? "ring-emerald-500 bg-emerald-600 text-white shadow-md transform -translate-y-0.5"
                            : "ring-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:ring-gray-300 hover:shadow-sm"
                        }`}
                      >
                        {slot.display}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex w-full items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <span className="text-sm font-medium text-gray-500">No open slots currently available.</span>
                  </div>
                )}
              </section>

              <section className={static_card_style}>
                <h2 className="mb-5 text-lg font-bold tracking-tight text-gray-900">Session Prep Checklist</h2>
                <ul className="space-y-4">
                  {prepChecklist.map((item, idx) => (
                    <li key={`${item}-${idx}`} className="flex items-start gap-3 rounded-xl ring-1 ring-gray-100 bg-gray-50 p-4 transition-colors duration-200 hover:bg-white hover:shadow-sm hover:ring-gray-200">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 ring-1 ring-emerald-200 text-xs font-bold text-gray-800">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                  {prepChecklist.length === 0 && (
                      <div className="p-4 text-center">
                          <p className="text-sm text-gray-500">No checklist items yet.</p>
                      </div>
                  )}
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

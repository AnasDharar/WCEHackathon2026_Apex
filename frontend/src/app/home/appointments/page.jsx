"use client";
import { useState } from "react";
import Header from "@/components/Header";
import { motion } from "motion/react";
import { useNotification } from "@/context/NotificationContext";

// Mock Data
const counselors = [
  {
    id: 1,
    name: "Dr. Sarah Wilson",
    specialty: "Clinical Psychologist",
    experience: "10+ years",
    languages: ["English", "Hindi"],
    availability: ["Mon", "Wed", "Fri"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    rating: 4.9,
  },
  {
    id: 2,
    name: "Mr. Rajesh Kumar",
    specialty: "Student Counselor",
    experience: "5+ years",
    languages: ["Hindi", "Marathi", "English"],
    availability: ["Tue", "Thu", "Sat"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh",
    rating: 4.8,
  },
  {
    id: 3,
    name: "Ms. Priya Desai",
    specialty: "Wellness Coach",
    experience: "7+ years",
    languages: ["English", "Gujarati"],
    availability: ["Mon", "Tue", "Thu"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
    rating: 4.7,
  },
];

const upcomingAppointments = [
  {
    id: 101,
    counselorId: 1,
    date: "2026-02-25",
    time: "10:00 AM",
    type: "Online",
    status: "Confirmed",
  },
];

export default function Appointments() {
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [bookingStep, setBookingStep] = useState(1); // 1: Select Date/Time, 2: Privacy/Confirm
  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    type: "Online", 
  });
  const [languageFilter, setLanguageFilter] = useState("All");

  const { addNotification } = useNotification() || { addNotification: () => {} };

  const filteredCounselors = languageFilter === "All" 
    ? counselors 
    : counselors.filter(c => c.languages.includes(languageFilter));

  const uniqueLanguages = ["All", ...new Set(counselors.flatMap(c => c.languages))];

  const handleBookClick = (counselor) => {
    setSelectedCounselor(counselor);
    setBookingStep(1);
    setBookingData({ date: "", time: "", type: "Online" });
  };

  const handleConfirmBooking = () => {
    if (!selectedCounselor) {
      alert("Please select a counselor before confirming the appointment.");
      return;
    }

    addNotification({
      title: "Appointment Booked",
      message: `Your session with ${selectedCounselor.name} is confirmed for ${bookingData.date} at ${bookingData.time}.`,
      type: "success",
    });

    alert("Booking Confirmed!");
    setSelectedCounselor(null);
  };

  return (
    <>
      <Header
        title="Appointments"
        subtitle="Confidential and secure booking with trusted professionals."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Counselor List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Available Counselors
            </h2>
            <select 
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {uniqueLanguages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4">
            {filteredCounselors.map((counselor) => (
              <motion.div
                key={counselor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                className={`bg-white p-6 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row gap-6 items-start md:items-center ${
                  selectedCounselor?.id === counselor.id
                    ? "border-emerald-500 ring-1 ring-emerald-500 shadow-md"
                    : "border-gray-100 hover:border-emerald-200 shadow-sm"
                }`}
                onClick={() => handleBookClick(counselor)}
              >
                <img
                  src={counselor.image}
                  alt={counselor.name}
                  className="w-16 h-16 rounded-full bg-gray-50"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{counselor.name}</h3>
                      <p className="text-emerald-600 font-medium">{counselor.specialty}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded text-amber-700 text-sm font-bold">
                      <span>★</span> {counselor.rating}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {counselor.experience} Exp
                    </span>
                    <span className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      {counselor.languages.join(", ")}
                    </span>
                  </div>
                </div>
                <button className="px-5 py-2 rounded-lg bg-gray-50 text-gray-700 font-medium hover:bg-emerald-50 hover:text-emerald-700 transition-colors whitespace-nowrap">
                  Book Now
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Booking Panel or Upcoming */}
        <div className="space-y-6">
          {selectedCounselor ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg sticky top-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Book Appointment</h3>
                <button
                  onClick={() => setSelectedCounselor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {bookingStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                    <input
                      type="date"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Time</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                    >
                      <option value="">Choose a slot...</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:00">03:00 PM</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setBookingStep(2)}
                    disabled={!bookingData.date || !bookingData.time}
                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    Next: Privacy Options
                  </button>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Where do you want to meet?</label>
                    <div className="space-y-2">
                      {["Online", "Safe Space (Library)", "Counselor Office"].map((type) => (
                        <label
                          key={type}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                            bookingData.type === type
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="locationType"
                            value={type}
                            checked={bookingData.type === type}
                            onChange={(e) => setBookingData({ ...bookingData, type: e.target.value })}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                          />
                          <span className="ml-3 text-gray-700 font-medium">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg flex gap-3 items-start">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>Privacy Note:</strong> This appointment will appear as "Busy" on your calendar. The details (Counselor name, location) will be hidden from others.
                    </p>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => setBookingStep(1)}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirmBooking}
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Your Upcoming Sessions
              </h3>
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => {
                  const counselor = counselors.find(c => c.id === apt.counselorId);
                  return (
                    <div key={apt.id} className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-blue-900">{counselor?.name}</span>
                        <span className="bg-white px-2 py-0.5 rounded text-xs font-semibold text-blue-700 border border-blue-200">{apt.type}</span>
                      </div>
                      <div className="text-sm text-blue-800 flex flex-col gap-1">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {apt.date} at {apt.time}
                        </span>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {apt.status}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200 flex gap-2">
                        <button className="flex-1 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors">
                          Join Meeting
                        </button>
                        <button className="flex-1 py-1.5 bg-white text-blue-700 text-xs font-medium rounded border border-blue-200 hover:bg-blue-50 transition-colors">
                          Reschedule
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-100 text-center">
                <p className="text-sm text-gray-500 mb-2">Need immediate help?</p>
                <button className="w-full py-2 bg-red-50 text-red-600 font-medium rounded border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Crisis Helpline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

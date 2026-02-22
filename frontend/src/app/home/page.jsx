"use client";
import { useState, useEffect } from "react";
import Header from "@/components/Header";

// Generate calendar data for the current month
const generateCalendarData = () => {
  const today = new Date(2026, 1, 22); // February 22, 2026
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const calendar = [];
  const completedDays = new Set();
  
  // Generate random completed days (will be replaced with real data)
  for (let i = 1; i <= daysInMonth; i++) {
    if (Math.random() > 0.4) {
      completedDays.add(i);
    }
  }
  
  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDay; i++) {
    calendar.push({ day: null, completed: false });
  }
  
  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    calendar.push({ day: i, completed: completedDays.has(i) });
  }
  
  return calendar;
};

// Static initial calendar data
const getInitialCalendarData = () => {
  const firstDay = new Date(2026, 1, 1).getDay(); // February 2026
  const daysInMonth = 28;
  const calendar = [];
  
  for (let i = 0; i < firstDay; i++) {
    calendar.push({ day: null, completed: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendar.push({ day: i, completed: false });
  }
  return calendar;
};

const initialHabits = [
  { id: 1, name: "Drink more water", completed: true },
  { id: 2, name: "Walk 5000 steps", completed: true },
  { id: 3, name: "Meditate 10 mins", completed: false },
  { id: 4, name: "Read 20 pages", completed: false },
];

const testResults = [
  { id: 1, title: "Weekly Stress Assessment", score: "Low", feedback: "Great progress! Your stress levels have decreased by 15% this week.", date: "Feb 20, 2026" },
  { id: 2, title: "Sleep Quality Analysis", score: "Good", feedback: "Your sleep patterns are improving. Try maintaining consistent bedtime.", date: "Feb 18, 2026" },
];

const appointments = [
  { id: 1, doctor: "Dr. Sarah Wilson", specialty: "Psychologist", date: "Feb 25, 2026", time: "10:00 AM", meetLink: "https://meet.google.com/abc-defg-hij" },
  { id: 2, doctor: "Dr. James Chen", specialty: "Wellness Coach", date: "Feb 28, 2026", time: "2:30 PM", meetLink: "https://meet.google.com/xyz-uvwx-yz" },
];

const resources = [
  { id: 1, title: "Managing Anxiety", type: "Article", duration: "5 min read" },
  { id: 2, title: "Guided Meditation", type: "Audio", duration: "15 mins" },
  { id: 3, title: "Stress Relief Techniques", type: "Video", duration: "10 mins" },
  { id: 4, title: "Better Sleep Habits", type: "Article", duration: "7 min read" },
];

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
  </svg>
);

export default function Overview() {
  const [calendarData, setCalendarData] = useState(getInitialCalendarData);
  const [habits, setHabits] = useState(initialHabits);
  const today = 22; // Current day
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    setCalendarData(generateCalendarData());
  }, []);

  const toggleHabit = (id) => {
    setHabits(habits.map(habit => 
      habit.id === id ? { ...habit, completed: !habit.completed } : habit
    ));
  };

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Welcome back, John! Here's your wellness overview." 
      />

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 font-google">
        {/* Test Results Card */}
        <div className="bg-white rounded-3xl border col-span-3 border-gray-200 p-5 shadow-sm">
          <h2 className="text-lg font-google text-gray-800 mb-4 flex items-center gap-2">
            Test Results (Feedback by AI)
          </h2>
          <div className="space-y-4">
            {testResults.map((result) => (
              <div key={result.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800">{result.title}</h3>
                  
                </div>
                <p className="text-sm text-gray-600 mb-2">{result.feedback}</p>
                <p className="text-xs text-gray-400">{result.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Appointments Card */}
        <div className="bg-white rounded-3xl border col-span-3 border-gray-200 p-5 shadow-sm font-google">
          <h2 className="text-lg font-google text-gray-800 mb-4 flex items-center gap-2">
            
            Live Appointments
          </h2>
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">{apt.doctor}</h3>
                    <p className="text-sm text-gray-500">{apt.specialty}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {apt.date} • {apt.time}
                    </p>
                  </div>
                  <a
                    href={apt.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <VideoIcon />
                    Join
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Habit Tracker */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm lg:col-span-2 font-google">
          <h2 className="text-lg font-google text-gray-800 mb-4 flex items-center gap-2">
            
            Today's Habits
          </h2>
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Today's Habits Checklist */}
            <div className="lg:w-1/2">
              <p className="text-sm text-gray-500 mb-3">February 22, 2026</p>
              <div className="space-y-2">
                {habits.map((habit) => (
                  <div 
                    key={habit.id} 
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors"
                    onClick={() => toggleHabit(habit.id)}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                      habit.completed ? "bg-emerald-500" : "border-2 border-gray-300 hover:border-emerald-400"
                    }`}>
                      {habit.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm select-none ${habit.completed ? "text-gray-800" : "text-gray-500"}`}>
                      {habit.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Ring Chart */}
            <div className="lg:w-1/2 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(habits.filter(h => h.completed).length / habits.length) * 314} 314`}
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">
                    {habits.filter(h => h.completed).length}/{habits.length}
                  </span>
                  <span className="text-xs text-gray-500">completed</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600 text-center">
                {Math.round((habits.filter(h => h.completed).length / habits.length) * 100)}% of today's habits done
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm lg:col-span-2 font-google">
          <div className="m-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-700">February 2026</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-full border-2 border-gray-200"></div>
                    <span>Incomplete</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-500"></div>
                    <span>Complete</span>
                  </div>
                </div>
              </div>
              
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs text-gray-400 py-1">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarData.map((item, index) => (
                  <div key={index} className="flex items-center justify-center p-1">
                    {item.day !== null ? (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer transition-all
                          ${item.completed 
                            ? "bg-emerald-500 text-white" 
                            : "text-gray-600 hover:bg-gray-100"
                          }
                          ${item.day === today 
                            ? "ring-2 ring-emerald-400 ring-offset-1" 
                            : ""
                          }
                        `}
                        title={item.completed ? "All habits completed" : "Habits incomplete"}
                      >
                        {item.day}
                      </div>
                    ) : (
                      <div className="w-8 h-8"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
        </div>

        {/* Resources Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm lg:col-span-2 font-google">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                
            Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-2">
                </div>
                <h3 className="font-medium text-gray-800 group-hover:text-emerald-700 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{resource.duration}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

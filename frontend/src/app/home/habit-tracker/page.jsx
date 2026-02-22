import Header from "@/components/Header";

export default function HabitTracker() {
  return (
    <>
      <Header 
        title="Habit Tracker" 
        subtitle="Track your daily habits and build consistency." 
      />
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Coming Soon</h2>
          <p className="text-gray-500">This feature is under development.</p>
        </div>
      </div>
    </>
  );
}

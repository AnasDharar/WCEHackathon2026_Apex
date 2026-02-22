import Header from "@/components/Header";

export default function Resources() {
  return (
    <>
      <Header 
        title="Resources" 
        subtitle="Explore articles, videos, and guides for your wellness journey." 
      />
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Coming Soon</h2>
          <p className="text-gray-500">This feature is under development.</p>
        </div>
      </div>
    </>
  );
}

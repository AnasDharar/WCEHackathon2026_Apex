export default function AIChatbot() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">AI Chatbot</h1>
        <p className="text-gray-500 text-sm">Chat with our AI assistant for wellness support.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Coming Soon</h2>
          <p className="text-gray-500">This feature is under development.</p>
        </div>
      </div>
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
      <p className="text-gray-600 max-w-2xl">
        Welcome to the Manah Arogya Admin Panel. Use the sidebar to navigate through 
        user management, community moderation, resource allocation, and real-time AI alerts.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder Stat Cards */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <span className="text-gray-500 font-medium text-sm">Total Users</span>
          <span className="text-3xl font-bold text-emerald-600">--</span>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <span className="text-gray-500 font-medium text-sm">Active Therapists</span>
          <span className="text-3xl font-bold text-emerald-600">--</span>
        </div>
        <div className="p-6 rounded-2xl shadow-sm flex flex-col gap-2 bg-red-50 border border-red-100">
          <span className="text-red-500 font-medium text-sm">Unresolved Alerts</span>
          <span className="text-3xl font-bold text-red-600">--</span>
        </div>
      </div>
    </div>
  );
}

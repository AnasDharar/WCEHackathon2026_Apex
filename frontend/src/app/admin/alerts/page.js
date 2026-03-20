"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Siren, CheckCircle } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.get("/admin/alerts?resolved=false");
      setAlerts(data);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await api.patch(`/admin/alerts/${alertId}/resolve`, { is_resolved: true });
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error("Failed to resolve alert", error);
    }
  };

  if (loading && alerts.length === 0) return <p className="text-gray-500">Loading alerts...</p>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-100 rounded-full">
          <Siren className="w-8 h-8 text-red-600 animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Critical Alerts</h1>
      </div>
      <p className="text-gray-600">
        High-priority notifications from the AI agent detecting suicidal language or severe crises in real-time.
      </p>
      
      {alerts.length === 0 ? (
        <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl flex items-center gap-4">
          <CheckCircle className="w-6 h-6" />
          <p className="font-semibold">No critical active alerts.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-l-red-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 rounded-bl-lg font-bold text-xs">
                {alert.type.toUpperCase().replace("_", " ")}
              </div>
              <div className="flex justify-between items-start mb-4 mt-2">
                <div>
                  <h3 className="font-bold text-red-700">User ID: {alert.user_id}</h3>
                  <p className="text-sm text-gray-500">{new Date(alert.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl text-red-900 mb-6 font-medium">
                "{alert.details}"
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleResolve(alert.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Resolved
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

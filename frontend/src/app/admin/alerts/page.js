"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Siren, CheckCircle } from "lucide-react";
import Header from "@/components/Header";

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 hover:ring-black/10 transition-all duration-200 ease-in-out";

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

  if (loading && alerts.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="pb-20 space-y-8 h-full max-w-5xl">
      <Header 
        title="Critical Alerts Console"
        subtitle="High-priority notifications triggered by AI diagnostics indicating immediate clinical crises."
        icon={<Siren className="w-8 h-8 text-red-500 animate-pulse" />}
      />

      {alerts.length === 0 ? (
        <div className="bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 p-6 rounded-xl flex items-center gap-4 shadow-sm">
          <CheckCircle className="w-6 h-6 shrink-0" />
          <p className="font-bold text-sm">All clear! No critical active alerts requiring intervention.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className={`${static_card_style} border-l-4 border-l-red-500 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 bg-linear-to-l from-red-600 to-red-500 text-white px-3 py-1.5 rounded-bl-xl font-bold text-[10px] tracking-widest shadow-sm">
                {alert.type.toUpperCase().replace("_", " ")}
              </div>
              <div className="flex justify-between items-start mb-4 mt-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg tracking-tight">Affected User ID: {alert.user_id}</h3>
                  <p className="text-xs text-gray-400 font-bold tracking-wider mt-0.5 uppercase">{new Date(alert.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg ring-1 ring-red-100 text-red-900 mb-6 font-medium text-sm leading-relaxed border-l border-red-300">
                "{alert.details}"
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <button
                  onClick={() => handleResolve(alert.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-white ring-1 ring-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold rounded-lg shadow-sm transition-colors text-xs active:scale-[0.98]"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Safely Resolved
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

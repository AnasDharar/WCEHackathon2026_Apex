"use client";

import { Users, Stethoscope, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5";

export default function AdminDashboardPage() {
  return (
    <div className="pb-20 space-y-8 h-full">
      <Header 
        title="Admin Overview"
        subtitle="Welcome back. Use the sidebar to navigate through user management, moderation, and alerts."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder Stat Cards */}
        <div className={`${static_card_style} relative overflow-hidden group`}>
          <div className="flex items-center gap-3 mb-1">
            <div className="text-gray-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Users</span>
          </div>
          <span className="text-3xl font-bold tracking-tight text-gray-900">--</span>
        </div>
        
        <div className={`${static_card_style} relative overflow-hidden group`}>
          <div className="flex items-center gap-3 mb-1">
            <div className="text-gray-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Therapists</span>
          </div>
          <span className="text-3xl font-bold tracking-tight text-gray-900">--</span>
        </div>
        
        <div className={`${static_card_style} bg-red-50/50 ring-red-100 relative overflow-hidden group`}>
          <div className="flex items-center gap-3 mb-1">
            <div className="text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600">Unresolved Alerts</span>
          </div>
          <span className="text-3xl font-bold tracking-tight text-red-600">--</span>
        </div>
      </div>
    </div>
  );
}

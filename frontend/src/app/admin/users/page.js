"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";

const static_card_style = "rounded-xl bg-white shadow-sm ring-1 ring-black/5";

export default function UsersAdminPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get("/admin/users");
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSummary = async (userId) => {
    try {
      const data = await api.get(`/admin/users/${userId}/summary`);
      setSummary(Array.isArray(data.assessments) ? data.assessments : []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleBanToggle = async (user) => {
    try {
      await api.patch(`/admin/users/${user.id}/ban`, { is_banned: !user.is_banned });
      fetchUsers();
    } catch (error) {
      console.error("Failed to toggle ban", error);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="pb-20 space-y-8 h-full">
      <Header 
        title={t("User Management")}
        subtitle={t("View, monitor, and manage the access of registered users across the platform.")}
      />
      
      <div className={`${static_card_style} overflow-hidden p-0!`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Org</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-4 font-bold text-gray-900 text-sm">{user.name || "N/A"}</td>
                  <td className="p-4 text-gray-600 text-sm">{user.email || "N/A"}</td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-gray-100 ring-1 ring-gray-200 text-gray-700 rounded shadow-sm inline-block mb-1 capitalize tracking-wider">
                      {user.role}
                    </span>
                    {user.organization && (
                      <div className="text-xs text-gray-500 font-medium">{user.organization}</div>
                    )}
                  </td>
                  <td className="p-4">
                    {user.is_banned ? (
                      <span className="px-2.5 py-1 bg-red-50 text-red-700 ring-1 ring-red-200 text-[10px] font-bold uppercase tracking-wider rounded shadow-sm">Banned</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-[10px] font-bold uppercase tracking-wider rounded shadow-sm">Active</span>
                    )}
                  </td>
                  <td className="p-4 flex gap-2 justify-end pr-6">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        loadUserSummary(user.id);
                      }}
                      className="px-3 py-1.5 bg-white ring-1 ring-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 text-xs font-bold shadow-sm transition-colors"
                    >
                      Scores
                    </button>
                    <button
                      onClick={() => handleBanToggle(user)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors ${
                        user.is_banned 
                          ? "bg-white ring-1 ring-gray-200 text-gray-700 hover:bg-gray-50" 
                          : "bg-white ring-1 ring-red-200 text-red-600 hover:bg-red-50"
                      }`}
                    >
                      {user.is_banned ? "Unban" : "Ban"}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 text-sm font-medium bg-gray-50/50">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-0 w-full max-w-lg shadow-xl ring-1 ring-black/5 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Scores for {selectedUser.name}</h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">Review AI-derived clinical assessment metrics.</p>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50/30 flex-1">
              <div className="space-y-4">
                {!summary && <div className="text-center py-8 text-emerald-600 animate-pulse text-sm font-bold">Loading Assessments...</div>}
                {summary && summary.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm font-medium ring-1 ring-gray-200 bg-white rounded-xl shadow-sm">No assessments taken yet.</div>
                )}
                {summary?.map((res, i) => {
                  const scores = Array.isArray(res.scores) ? res.scores : [];
                  const riskLevel = res.feedback?.risk_level || res.risk_level || "low";
                  const summaryText =
                    res.feedback?.ui_summary ||
                    res.feedback?.overall_summary ||
                    res.summary ||
                    "No structured summary available.";

                  return (
                    <div key={res.id || i} className="p-5 bg-white rounded-xl ring-1 ring-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div>
                          <span className="font-bold text-gray-900 text-sm tracking-tight">
                            {res.mode === "initial" ? "Initial Assessment" : "Retake Assessment"}
                          </span>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {new Date(res.completed_at || res.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm ring-1 ${riskLevel.toLowerCase().includes('low') ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-red-50 text-red-800 ring-red-200'}`}>
                          {riskLevel} risk
                        </span>
                      </div>
                      
                      {scores.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {scores.map((score) => (
                            <span
                              key={`${res.id}-${score.test_id}`}
                              className="bg-gray-50 text-gray-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ring-1 ring-gray-200 shadow-sm"
                            >
                              {score.title || score.test_id}: {score.score}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="bg-gray-50/50 p-3 rounded-lg ring-1 ring-gray-100">
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">{summaryText}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSummary(null);
                }}
                className="px-6 py-2.5 bg-white hover:bg-gray-50 ring-1 ring-gray-200 text-gray-700 font-bold rounded-lg shadow-sm transition-colors text-sm"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

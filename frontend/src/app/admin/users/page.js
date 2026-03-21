"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function UsersAdminPage() {
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

  if (loading) return <p className="text-gray-500">Loading users...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-sm font-semibold text-gray-600">Name</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Email</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Role & Org</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-4 font-medium text-gray-900">{user.name || "N/A"}</td>
                <td className="p-4 text-gray-600">{user.email || "N/A"}</td>
                <td className="p-4">
                  <span className="text-sm font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded mr-2">
                    {user.role}
                  </span>
                  {user.organization && (
                    <span className="text-xs text-gray-500">{user.organization}</span>
                  )}
                </td>
                <td className="p-4">
                  {user.is_banned ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Banned</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>
                  )}
                </td>
                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      loadUserSummary(user.id);
                    }}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium"
                  >
                    View Scores
                  </button>
                  <button
                    onClick={() => handleBanToggle(user)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      user.is_banned 
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    {user.is_banned ? "Unban" : "Ban"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-xl relative">
            <h2 className="text-2xl font-bold mb-4">Scores for {selectedUser.name}</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {!summary && <p className="text-gray-500 text-sm">Loading...</p>}
              {summary && summary.length === 0 && (
                <p className="text-gray-500 text-sm">No assessments taken.</p>
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
                  <div key={res.id || i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div>
                        <span className="font-bold text-gray-800 uppercase text-sm tracking-wider">
                          {res.mode === "initial" ? "Initial Assessment" : "Retake Assessment"}
                        </span>
                        <p className="mt-1 text-[11px] uppercase tracking-wider text-gray-400">
                          {new Date(res.completed_at || res.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-bold uppercase">
                        {riskLevel} risk
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {scores.map((score) => (
                        <span
                          key={`${res.id}-${score.test_id}`}
                          className="bg-white text-gray-700 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-gray-200"
                        >
                          {score.title || score.test_id}: {score.score}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">{summaryText}</p>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => {
                setSelectedUser(null);
                setSummary(null);
              }}
              className="mt-6 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

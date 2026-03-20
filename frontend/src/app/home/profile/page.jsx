"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getUserSession, setUserSession } from "@/lib/userSession";
import { User, Building, BookOpen } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", organization: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/profile/me`); 
      const userData = response.data.user;
      setUser(userData);
      setFormData({
        name: userData.name || "",
        organization: userData.organization || "",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const sessionUser = getUserSession();
      const updatedUser = await api.patch(`/profile/me`, formData);
      setUser(updatedUser.data);
      // Update local storage session
      setUserSession({ ...sessionUser, name: formData.name, organization: formData.organization });
      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessage("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your personal information and institutional affiliations.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-gray-100">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
              <input 
                type="email" 
                value={user?.email || ""} 
                disabled
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed directly.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <div className="flex items-center gap-2"><User className="w-4 h-4"/> Full Name</div>
              </label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <div className="flex items-center gap-2"><Building className="w-4 h-4"/> Organization / College</div>
              </label>
              <input 
                type="text" 
                value={formData.organization} 
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g. Acme Corp or State University"
              />
              <p className="text-xs text-gray-500 mt-1">Helps us aggregate reports if you are part of a wellness program.</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <div className="flex items-center gap-2"><BookOpen className="w-4 h-4"/> Role</div>
              </label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 capitalize font-medium">
                {user?.role || "User"}
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <p className={`text-sm font-medium ${message.includes('success') ? 'text-emerald-600' : 'text-red-500'}`}>
              {message}
            </p>
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

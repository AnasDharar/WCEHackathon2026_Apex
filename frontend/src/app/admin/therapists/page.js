"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    region: "",
    institution: "",
  });

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      const data = await api.get("/admin/therapists");
      setTherapists(data);
    } catch (error) {
      console.error("Failed to load therapists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.remove(`/admin/therapists/${id}`);
      setTherapists((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const newTherapist = await api.post("/admin/therapists", formData);
      setTherapists((prev) => [...prev, newTherapist]);
      setShowAddForm(false);
      setFormData({ name: "", specialty: "", region: "", institution: "" });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Therapists Management</h1>
          <p className="text-gray-600">Add, view, and manage verified mental health professionals.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Therapist
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col gap-4">
          <h2 className="text-xl font-bold">New Therapist Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Full Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="px-4 py-2 border rounded-lg" />
            <input type="text" placeholder="Specialty (e.g. Clinical Psychologist)" required value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})} className="px-4 py-2 border rounded-lg" />
            <input type="text" placeholder="Region (Location)" value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})} className="px-4 py-2 border rounded-lg" />
            <input type="text" placeholder="Institution / Organization" value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})} className="px-4 py-2 border rounded-lg" />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save Therapist</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {therapists.map((therapist) => (
            <div key={therapist.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
              <button
                onClick={() => handleDelete(therapist.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-xl text-gray-900 mb-1">{therapist.name}</h3>
              <p className="text-emerald-600 font-medium text-sm mb-4">{therapist.specialty}</p>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Region:</strong> {therapist.region || "Not specified"}</p>
                <p><strong>Institution:</strong> {therapist.institution || "Independent"}</p>
              </div>
            </div>
          ))}
          {therapists.length === 0 && !showAddForm && (
            <p className="col-span-full text-center text-gray-500 py-10">No therapists added yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

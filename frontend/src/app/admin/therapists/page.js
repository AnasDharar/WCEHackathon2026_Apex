"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2, MapPin, Building2, Stethoscope } from "lucide-react";
import Header from "@/components/Header";

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 hover:ring-black/10 hover:shadow-md transition-all duration-200 ease-in-out hover:-translate-y-0.5";

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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="pb-20 space-y-8 h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <Header 
          title="Therapist Management"
          subtitle="Add, view, and manage verified mental health professionals."
        />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg transition-colors text-sm shadow-sm md:mb-2 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Therapist
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-emerald-200 flex flex-col gap-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">New Practitioner Profile</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input type="text" placeholder="e.g. Dr. Sarah Jenkins" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Specialty</label>
              <input type="text" placeholder="e.g. Clinical Psychologist" required value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Region Location</label>
              <input type="text" placeholder="e.g. New York, NY" value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Institution</label>
              <input type="text" placeholder="e.g. Acme Health Network" value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-50">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 ring-1 ring-gray-200 rounded-lg shadow-sm text-sm transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm text-sm transition-colors">Save Practitioner</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {therapists.map((therapist) => (
          <div key={therapist.id} className={`${static_card_style} flex flex-col relative`}>
            <button
              onClick={() => handleDelete(therapist.id)}
              title="Remove Therapist"
              className="absolute top-5 right-5 text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg shadow-sm">
                {therapist.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="pr-6">
                <h3 className="font-bold text-gray-900 text-base tracking-tight">{therapist.name}</h3>
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-gray-50 ring-1 ring-gray-200 text-gray-600 text-[9px] font-bold uppercase tracking-wider rounded">
                  {therapist.specialty}
                </span>
              </div>
            </div>
            
            <div className="space-y-2 text-xs font-semibold text-gray-500 mt-2 bg-gray-50/50 p-3 rounded-lg ring-1 ring-gray-100">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {therapist.region || "Not specified"}
              </p>
              <p className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                {therapist.institution || "Independent"}
              </p>
            </div>
          </div>
        ))}
        {therapists.length === 0 && !showAddForm && (
          <div className="col-span-full text-center bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl p-12">
             <Stethoscope className="w-10 h-10 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-900 font-bold text-base">No practitioners added yet.</p>
             <p className="text-gray-500 text-sm mt-1">Click "Add Therapist" to expand the directory.</p>
          </div>
        )}
      </div>
    </div>
  );
}

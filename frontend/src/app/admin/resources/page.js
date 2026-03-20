"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";

export default function ResourcesAdminPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    resource_type: "article",
    category: "general",
    content_format: "text",
    recommended: false,
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await api.get("/resources");
      setResources(data.data || []);
    } catch (error) {
      console.error("Failed to load resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.remove(`/admin/resources/${id}`);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const newResource = await api.post("/admin/resources", formData);
      setResources((prev) => [newResource, ...prev]);
      setShowAddForm(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resource Management</h1>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          Add Resource
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Title" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="px-4 py-2 border rounded-lg md:col-span-2" />
            <textarea placeholder="Description" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="px-4 py-2 border rounded-lg md:col-span-2" rows="2" />
            <input type="url" placeholder="Resource URL" required value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className="px-4 py-2 border rounded-lg md:col-span-2" />
            
            <select value={formData.resource_type} onChange={(e) => setFormData({...formData, resource_type: e.target.value})} className="px-4 py-2 border rounded-lg bg-white">
              <option value="article">Article</option>
              <option value="book">Book</option>
              <option value="app">App</option>
              <option value="hotline">Hotline</option>
              <option value="video">Video</option>
            </select>
            
            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="px-4 py-2 border rounded-lg bg-white">
              <option value="general">General</option>
              <option value="anxiety">Anxiety</option>
              <option value="depression">Depression</option>
              <option value="sleep">Sleep</option>
              <option value="mindfulness">Mindfulness</option>
            </select>

            <select value={formData.content_format} onChange={(e) => setFormData({...formData, content_format: e.target.value})} className="px-4 py-2 border rounded-lg bg-white">
              <option value="text">Text / Webpage</option>
              <option value="audio">Audio / Podcast</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="rec" checked={formData.recommended} onChange={(e) => setFormData({...formData, recommended: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
            <label htmlFor="rec" className="text-sm font-medium text-gray-700">Recommended Resource</label>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save Resource</button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((res) => (
            <div key={res.id} className="bg-white p-5 rounded-xl border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{res.title}</h3>
                  <button onClick={() => handleDelete(res.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{res.description}</p>
              </div>
              <div className="flex gap-2 text-xs font-semibold">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded capitalize">{res.content_format}</span>
                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">{res.category}</span>
                {res.recommended && <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded">Recommended</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

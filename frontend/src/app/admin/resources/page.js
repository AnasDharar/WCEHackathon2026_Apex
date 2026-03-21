"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2, Link as LinkIcon, BookOpen, FileText, Headphones, Video } from "lucide-react";
import Header from "@/components/Header";

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 hover:ring-black/10 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-in-out flex flex-col";

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
      setFormData({
         title: "",
         description: "",
         url: "",
         resource_type: "article",
         category: "general",
         content_format: "text",
         recommended: false,
      });
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
          title="Resource Library Management"
          subtitle="Curate and organize psychoeducational literature, hotlines, and media."
        />
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg shadow-sm transition-colors text-sm md:mb-2 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-emerald-200 flex flex-col gap-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
             <BookOpen className="w-5 h-5 text-emerald-600" />
             <h2 className="text-lg font-bold text-gray-900 tracking-tight">Add New Resource Item</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="md:col-span-2">
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Resource Title</label>
               <input type="text" placeholder="e.g. Grounding Techniques Guide" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium" />
            </div>
            <div className="md:col-span-1">
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Direct URL Link</label>
               <input type="url" placeholder="https://..." required value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium" />
            </div>
            
            <div className="md:col-span-3">
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description Summary</label>
               <textarea placeholder="Briefly explain what this resource helps with..." required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium resize-y" rows="2" />
            </div>
            
            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
               <select value={formData.resource_type} onChange={(e) => setFormData({...formData, resource_type: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium bg-white">
                 <option value="article">Article / Guide</option>
                 <option value="book">Book Recommendation</option>
                 <option value="app">Mobile Application</option>
                 <option value="hotline">Crisis Hotline</option>
                 <option value="video">Video Session</option>
               </select>
            </div>
            
            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Clinical Category</label>
               <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium bg-white">
                 <option value="general">General Wellness</option>
                 <option value="anxiety">Anxiety / Stress</option>
                 <option value="depression">Depression</option>
                 <option value="sleep">Sleep Hygiene</option>
                 <option value="mindfulness">Mindfulness</option>
               </select>
            </div>

            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Media Format</label>
               <select value={formData.content_format} onChange={(e) => setFormData({...formData, content_format: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium bg-white">
                 <option value="text">Text / Webpage</option>
                 <option value="audio">Audio / Podcast</option>
                 <option value="video">Video</option>
               </select>
            </div>
            
            <div className="md:col-span-3 flex items-center gap-3 p-4 bg-emerald-50 ring-1 ring-emerald-200 rounded-lg mt-1">
               <input type="checkbox" id="rec" checked={formData.recommended} onChange={(e) => setFormData({...formData, recommended: e.target.checked})} className="w-5 h-5 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500" />
               <label htmlFor="rec" className="text-sm font-bold text-emerald-900 cursor-pointer">Mark as Highly Recommended (Features prominently to users)</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-50">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200 font-bold rounded-lg shadow-sm transition-colors text-sm">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg shadow-sm transition-colors text-sm">Save Resource</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((res) => (
          <div key={res.id} className={`${static_card_style} relative`}>
            <div className="flex justify-between items-start mb-3">
              <div className="pr-8 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center shrink-0">
                    {res.content_format === 'video' && <Video className="w-5 h-5 text-emerald-600" />}
                    {res.content_format === 'audio' && <Headphones className="w-5 h-5 text-emerald-600" />}
                    {res.content_format === 'text' && <FileText className="w-5 h-5 text-emerald-600" />}
                 </div>
                 <h3 className="font-bold text-lg text-gray-900 tracking-tight leading-snug">{res.title}</h3>
              </div>
              <button 
                onClick={() => handleDelete(res.id)} 
                title="Delete Resource"
                className="absolute top-5 right-5 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 line-clamp-3 mb-5 leading-relaxed font-medium">
               {res.description}
            </p>
            
            <div className="flex flex-wrap gap-1.5 mt-auto mb-4">
              <span className="px-2 py-0.5 bg-gray-50 ring-1 ring-gray-200 text-gray-600 text-[9px] font-bold uppercase tracking-wider rounded">
                {res.content_format}
              </span>
              <span className="px-2 py-0.5 bg-blue-50 ring-1 ring-blue-200 text-blue-700 text-[9px] font-bold uppercase tracking-wider rounded">
                {res.category.replace('_', ' ')}
              </span>
              {res.recommended && (
                 <span className="px-2 py-0.5 bg-amber-50 ring-1 ring-amber-300 text-amber-700 text-[9px] font-bold uppercase tracking-wider rounded">
                   Featured
                 </span>
              )}
            </div>
            
            <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white ring-1 ring-emerald-200 text-emerald-700 font-bold rounded-lg hover:bg-emerald-50 transition-colors text-xs shadow-sm mt-auto active:scale-[0.98]">
               <LinkIcon className="w-3.5 h-3.5" /> Access Resource
            </a>
          </div>
        ))}
        {resources.length === 0 && !showAddForm && (
           <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
             <BookOpen className="w-10 h-10 text-gray-300 mb-3" />
             <h3 className="text-base font-bold text-gray-900">No resources available.</h3>
             <p className="text-sm text-gray-500 mt-1">Begin curating mental wellness resources for the community.</p>
          </div>
        )}
      </div>
    </div>
  );
}

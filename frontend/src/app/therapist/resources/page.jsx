"use client";

import { useState } from "react";
import { BookOpen, Video, FileText, Send, CheckCircle, Search, PlayCircle } from "lucide-react";
import { api } from "@/lib/api";
import Header from "@/components/Header";

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 hover:ring-black/10 hover:shadow-md transition-all duration-200 ease-in-out hover:-translate-y-0.5 flex flex-col h-full";

const RESOURCES = [
  { id: "res_1", title: "4-7-8 Breathing", type: "Guided", icon: PlayCircle, color: "text-blue-500", bg: "bg-blue-50", ring: "ring-blue-100", desc: "A 5-minute audio guide to rapidly reduce anxiety using paced breathing." },
  { id: "res_2", title: "Cognitive Traps", type: "Article", icon: FileText, color: "text-amber-500", bg: "bg-amber-50", ring: "ring-amber-100", desc: "A simple worksheet identifying common thinking traps." },
  { id: "res_3", title: "Muscle Relaxation", type: "Video", icon: Video, color: "text-emerald-500", bg: "bg-emerald-50", ring: "ring-emerald-100", desc: "Visual guide to releasing physical tension from head to toe." },
  { id: "res_4", title: "5-4-3-2-1 Grounding", type: "Practice", icon: BookOpen, color: "text-purple-500", bg: "bg-purple-50", ring: "ring-purple-100", desc: "Best for panic attacks. Grounds the user in their immediate environment." }
];

export default function TherapistResourcesPage() {
  const [search, setSearch] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);
  const [showingSendModal, setShowingSendModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSendClick = async (resource) => {
    setSelectedResource(resource);
    setShowingSendModal(true);
    setLoadingPatients(true);
    try {
      const res = await api.get("/therapist/patients");
      setPatients(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const dispatchResource = async (patientId) => {
    setSending(true);
    try {
      await api.post(`/therapist/chat/${patientId}`, {
        content: `Shared Resource: ${selectedResource.title}`,
        message_type: "resource",
        resource_id: selectedResource.id
      });
      setSuccessMsg(`Successfully sent to patient!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
      setShowingSendModal(false);
    }
  };

  const filteredResources = RESOURCES.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pb-20 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <Header 
          title="Resource Library" 
          subtitle="Curate and dispatch clinical exercises directly to patient portals." 
        />
        
        <div className="relative w-full md:w-80 lg:w-96 md:mb-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white ring-1 ring-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium text-gray-800"
          />
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 font-bold text-sm shadow-sm">
           <CheckCircle className="w-4 h-4 text-emerald-600" />
           {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredResources.map(res => {
          const Icon = res.icon;
          return (
            <div key={res.id} className={static_card_style}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-10 h-10 rounded-lg ${res.bg} ring-1 ${res.ring} ${res.color} flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm tracking-tight leading-snug">{res.title}</h3>
                  <span className="inline-block mt-1 bg-gray-50 ring-1 ring-gray-200 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">{res.type}</span>
                </div>
              </div>
              <p className="text-gray-500 text-xs font-medium flex-1 leading-relaxed">{res.desc}</p>
              
              <div className="mt-5 pt-5 border-t border-gray-100 flex gap-3">
                <button 
                  onClick={() => handleSendClick(res)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-white ring-1 ring-gray-200 hover:bg-emerald-50 hover:ring-emerald-200 hover:text-emerald-700 text-gray-700 font-bold rounded-lg transition-colors text-xs shadow-sm active:scale-[0.98]"
                >
                  <Send className="w-3.5 h-3.5" /> Dispatch
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispatch Modal */}
      {showingSendModal && selectedResource && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900 truncate tracking-tight">Send: {selectedResource.title}</h3>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1">Select Patient</p>
            </div>
            
            <div className="max-h-72 overflow-y-auto p-3 space-y-1.5 bg-gray-50/20">
               {loadingPatients ? (
                  <div className="py-8 text-center text-gray-400 font-medium text-xs animate-pulse">Loading patients...</div>
               ) : patients.length > 0 ? patients.map(p => (
                 <button 
                   key={p.id}
                   onClick={() => dispatchResource(p.id)}
                   disabled={sending}
                   className="w-full flex items-center justify-between p-3 bg-white ring-1 ring-gray-100 hover:ring-emerald-200 hover:bg-emerald-50 rounded-xl shadow-sm transition-all text-left disabled:opacity-50 group"
                 >
                   <div>
                     <p className="font-bold text-gray-900 text-sm tracking-tight">{p.name}</p>
                     <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{p.email}</p>
                   </div>
                   <Send className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                 </button>
               )) : (
                 <div className="py-8 text-center text-gray-400 font-medium text-xs">No active patients found.</div>
               )}
            </div>
            
            <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex justify-center">
              <button 
                onClick={() => setShowingSendModal(false)}
                className="w-full py-2 font-bold text-gray-600 bg-white ring-1 ring-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-colors text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

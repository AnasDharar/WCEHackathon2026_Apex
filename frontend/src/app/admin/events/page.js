"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2, MapPin, Link as LinkIcon, Users, CalendarDays, Clock, Video } from "lucide-react";
import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 hover:ring-black/10 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-in-out flex flex-col";

export default function EventsAdminPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "workshop",
    date: "",
    time: "",
    mode: "online",
    location: "",
    registration_link: "",
    host: "",
    capacity: 50,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.get("/events");
      setEvents(data.data || []);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.remove(`/admin/events/${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Failed to delete event", error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const newEvent = await api.post("/admin/events", formData);
      setEvents((prev) => [...prev, newEvent]);
      setShowAddForm(false);
      setFormData({
         title: "",
         description: "",
         category: "workshop",
         date: "",
         time: "",
         mode: "online",
         location: "",
         registration_link: "",
         host: "",
         capacity: 50,
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
          title={t("Event Management")}
          subtitle={t("Organize and publish workshops, webinars, and group sessions.")}
        />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg shadow-sm transition-colors text-sm md:mb-2 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-emerald-200 flex flex-col gap-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
             <CalendarDays className="w-5 h-5 text-emerald-600" />
             <h2 className="text-lg font-bold text-gray-900 tracking-tight">Create New Event</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="md:col-span-2">
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Title</label>
               <input type="text" placeholder="e.g. Managing Exam Anxiety" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium" />
            </div>
            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Host Organizer</label>
               <input type="text" placeholder="e.g. Dr. A. Smith" required value={formData.host} onChange={(e) => setFormData({...formData, host: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium" />
            </div>
            
            <div className="md:col-span-3">
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
               <textarea placeholder="Write a short brief..." required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium resize-y" rows="2" />
            </div>

            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
               <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium text-gray-800" />
            </div>
            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Time</label>
               <input type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium text-gray-800" />
            </div>
            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Capacity</label>
               <input type="number" placeholder="50" required value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 50})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium" />
            </div>
            
            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Modality</label>
               <select value={formData.mode} onChange={(e) => setFormData({...formData, mode: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium bg-white">
                 <option value="online">Online</option>
                 <option value="offline">Offline / In-person</option>
                 <option value="hybrid">Hybrid</option>
               </select>
            </div>
            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
               <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium bg-white">
                 <option value="workshop">Workshop</option>
                 <option value="webinar">Webinar</option>
                 <option value="group_therapy">Group Session</option>
                 <option value="social">Community Setup</option>
               </select>
            </div>
            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Reg Link (Optional)</label>
               <input type="url" placeholder="https://zoom.us/..." value={formData.registration_link} onChange={(e) => setFormData({...formData, registration_link: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium" />
            </div>

            {formData.mode !== "online" && (
              <div className="md:col-span-3">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Physical Location</label>
                 <input type="text" placeholder="123 Wellness Ave, Main Hall" required={formData.mode !== "online"} value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm font-medium" />
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-50">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200 font-bold rounded-lg shadow-sm transition-colors text-sm">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg shadow-sm transition-colors text-sm">Publish Event</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className={`${static_card_style} relative`}>
            <div className="flex justify-between items-start mb-3">
              <div className="pr-8">
                <h3 className="font-bold text-lg text-gray-900 tracking-tight leading-snug">{event.title}</h3>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="px-2 py-0.5 bg-gray-50 ring-1 ring-gray-200 text-gray-600 text-[9px] font-bold uppercase tracking-wider rounded">
                    {event.mode}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-50 ring-1 ring-amber-200 text-amber-700 text-[9px] font-bold uppercase tracking-wider rounded">
                    {event.category}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(event.id)} 
                title="Remove Event"
                className="absolute top-5 right-5 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed font-medium">
               {event.description}
            </p>
            
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-2 mb-4 mt-auto">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                 <CalendarDays className="w-4 h-4 text-emerald-600 block" /> 
                 <span>{new Date(event.date).toLocaleDateString([], { month:'long', day:'numeric' })} <span className="text-gray-400 font-normal ml-1">at {event.time}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                 {event.mode === "online" ? <Video className="w-4 h-4 text-amber-500 block" /> : <MapPin className="w-4 h-4 text-amber-500 block" />}
                 <span className="truncate">{event.location || (event.mode === "online" ? "Virtual Room" : "TBD")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                 <Users className="w-4 h-4 text-blue-500 block" /> 
                 <span className="truncate">{event.attendees || 0} / {event.capacity} Registered</span>
              </div>
            </div>
            
            {event.registration_link && (
              <a href={event.registration_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white ring-1 ring-emerald-200 text-emerald-700 font-bold rounded-lg hover:bg-emerald-50 transition-colors text-xs shadow-sm mt-auto active:scale-[0.98]">
                <LinkIcon className="w-3.5 h-3.5" /> Registration Link
              </a>
            )}
          </div>
        ))}
        {events.length === 0 && !showAddForm && (
           <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
             <CalendarDays className="w-10 h-10 text-gray-300 mb-3" />
             <h3 className="text-base font-bold text-gray-900">No events scheduled.</h3>
             <p className="text-sm text-gray-500 mt-1">Add workshops or webinars to populate the user calendar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

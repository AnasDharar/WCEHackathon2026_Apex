"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2, MapPin, Link as LinkIcon, Users } from "lucide-react";

export default function EventsAdminPage() {
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
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Event Title" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="px-4 py-2 border rounded-lg md:col-span-2" />
            <textarea placeholder="Event Description" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="px-4 py-2 border rounded-lg md:col-span-2" rows="2" />
            <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="px-4 py-2 border rounded-lg text-gray-700" />
            <input type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="px-4 py-2 border rounded-lg text-gray-700" />
            <input type="text" placeholder="Host / Organizer" required value={formData.host} onChange={(e) => setFormData({...formData, host: e.target.value})} className="px-4 py-2 border rounded-lg" />
            <input type="number" placeholder="Capacity (e.g. 50)" required value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 50})} className="px-4 py-2 border rounded-lg" />
            
            <select value={formData.mode} onChange={(e) => setFormData({...formData, mode: e.target.value})} className="px-4 py-2 border rounded-lg bg-white">
              <option value="online">Online</option>
              <option value="offline">Offline / In-person</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="px-4 py-2 border rounded-lg bg-white">
              <option value="workshop">Workshop</option>
              <option value="webinar">Webinar</option>
              <option value="group_therapy">Group Therapy</option>
              <option value="social">Social/Community</option>
            </select>

            <input type="url" placeholder="Registration Link" value={formData.registration_link} onChange={(e) => setFormData({...formData, registration_link: e.target.value})} className="px-4 py-2 border rounded-lg md:col-span-2" />
            {formData.mode !== "online" && (
              <input type="text" placeholder="Physical Location" required={formData.mode !== "online"} value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="px-4 py-2 border rounded-lg md:col-span-2" />
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save Event</button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-gray-900">{event.title}</h3>
                  <button onClick={() => handleDelete(event.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                </div>
                <div className="flex gap-2 text-xs font-semibold mb-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded capitalize">{event.mode}</span>
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded capitalize">{event.category}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 md:line-clamp-3 mb-4">{event.description}</p>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900">{new Date(event.date).toLocaleDateString()} at {event.time}</p>
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-600"/> {event.location || (event.mode === "online" ? "Online Link provided upon registration" : "TBD")}</p>
                  <p className="flex items-center gap-2"><Users className="w-4 h-4 text-emerald-600"/> Hosted by: {event.host}</p>
                  <p className="flex items-center gap-2 text-xs">Capacity: {event.attendees}/{event.capacity} registered</p>
                </div>
              </div>
              
              {event.registration_link && (
                <a href={event.registration_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition-colors">
                  <LinkIcon className="w-4 h-4" /> Registration Link
                </a>
              )}
            </div>
          ))}
          {events.length === 0 && !showAddForm && (
            <p className="col-span-full text-center text-gray-500 py-10">No events found.</p>
          )}
        </div>
      )}
    </div>
  );
}

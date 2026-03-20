"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, Clock, Video, FileText, Calendar, Edit2, MapPin } from "lucide-react";
import Header from "@/components/Header";

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5";

export default function TherapistAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  
  const [notesModal, setNotesModal] = useState({ open: false, apptId: null, notes: "" });
  const [editModal, setEditModal] = useState({ open: false, appt: null, mode: "Online", start_time: "", location: "" });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const apptsRes = await api.get("/therapist/appointments");
      setAppointments(apptsRes.data?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (apptId, newStatus) => {
    setProcessing(true);
    try {
      await api.patch(`/therapist/appointments/${apptId}/status`, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      setError(err.message || `Failed to update status to ${newStatus}`);
    } finally {
      setProcessing(false);
    }
  };

  const saveNotes = async () => {
    if (!notesModal.apptId) return;
    setProcessing(true);
    try {
      await api.patch(`/therapist/appointments/${notesModal.apptId}/notes`, { 
        therapist_notes: notesModal.notes 
      });
      setNotesModal({ open: false, apptId: null, notes: "" });
      fetchAppointments();
    } catch (err) {
      setError(err.message || "Failed to save notes");
    } finally {
      setProcessing(false);
    }
  };

  const saveAppointmentDetails = async () => {
    setProcessing(true);
    try {
      await api.patch(`/therapist/appointments/${editModal.appt.id}/status`, { status: 'rescheduled' });
      setEditModal({ open: false, appt: null, mode: "Online", start_time: "", location: "" });
      fetchAppointments();
    } catch (err) {
      setError(err.message || "Failed to update appointment");
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (appt) => {
    setEditModal({
      open: true,
      appt,
      mode: appt.mode || "Online",
      location: appt.location || "",
      start_time: appt.start_time ? new Date(appt.start_time).toISOString().slice(0, 16) : ""
    });
  };

  const pendingAppointments = useMemo(() => appointments.filter(a => a.status === 'pending'), [appointments]);
  const activeAppointments = useMemo(() => appointments.filter(a => ['booked', 'confirmed', 'rescheduled'].includes(a.status)).sort((a,b) => new Date(a.start_time) - new Date(b.start_time)), [appointments]);
  const historyAppointments = useMemo(() => appointments.filter(a => ['completed', 'cancelled', 'declined'].includes(a.status)).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)), [appointments]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="pb-20 space-y-8">
      <Header
        title="Appointments"
        subtitle="Manage your schedule, respond to requests, and update sessions."
      />

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 font-medium text-sm shadow-sm">
          {error}
        </div>
      )}

      {/* Action Needed */}
      {pendingAppointments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Action Needed <span className="text-red-600 bg-red-50 ring-1 ring-red-200 px-2 py-0.5 rounded-full text-xs">{pendingAppointments.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingAppointments.map(appt => (
              <div key={appt.id} className="bg-amber-50 ring-1 ring-amber-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base tracking-tight">{appt.patient_name}</h3>
                    <p className="text-gray-500 text-xs mt-1">{appt.patient_email}</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Pending</span>
                </div>
                
                <div className="flex flex-col gap-2 mb-6 bg-white/50 p-3 rounded-lg ring-1 ring-amber-100">
                  <div className="flex items-center gap-2 text-gray-700 text-xs font-semibold">
                    <Clock className="w-4 h-4 text-amber-500"/> 
                    {appt.start_time ? new Date(appt.start_time).toLocaleString() : 'No time proposed'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 text-xs font-semibold">
                    {appt.mode?.toLowerCase() === 'offline' ? <MapPin className="w-4 h-4 text-amber-500"/> : <Video className="w-4 h-4 text-amber-500"/>}
                    {appt.mode || "Online"}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleStatusUpdate(appt.id, 'confirmed')}
                    disabled={processing}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center text-sm shadow-sm"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(appt.id, 'declined')}
                    disabled={processing}
                    className="flex-1 bg-white hover:bg-red-50 text-red-600 ring-1 ring-red-200 font-bold py-2 rounded-lg transition-colors flex justify-center items-center text-sm shadow-sm"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Schedule */}
      <div className={static_card_style}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Upcoming Schedule</h2>
        </div>
        <div className="divide-y divide-gray-100 border-t border-gray-100 pt-2 -mx-6 px-6">
          {activeAppointments.map(appt => (
            <div key={appt.id} className="py-5 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 -mx-6 px-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base tracking-tight">{appt.patient_name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      {appt.start_time ? new Date(appt.start_time).toLocaleString([], {weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : "TBD"}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium bg-gray-100 px-2 py-0.5 rounded shadow-sm ring-1 ring-black/5">
                      {appt.mode?.toLowerCase() === 'offline' ? <MapPin className="w-3 h-3"/> : <Video className="w-3 h-3"/>}
                      {appt.mode || "Online"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2 py-0.5 rounded">
                      {appt.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => openEditModal(appt)}
                  className="px-3 py-1.5 bg-white ring-1 ring-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-xs shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button 
                  onClick={() => setNotesModal({ open: true, apptId: appt.id, notes: appt.therapist_notes || "" })}
                  className="px-3 py-1.5 bg-white ring-1 ring-blue-200 text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 text-xs shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" /> Notes
                </button>
                <button 
                  onClick={() => handleStatusUpdate(appt.id, 'completed')}
                  disabled={processing}
                  className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-xs shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Complete
                </button>
                <button 
                  onClick={() => handleStatusUpdate(appt.id, 'cancelled')}
                  disabled={processing}
                  className="px-3 py-1.5 bg-white ring-1 ring-red-200 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-xs shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
          {activeAppointments.length === 0 && (
            <div className="py-12 text-center text-gray-500 text-sm font-medium">
              No upcoming appointments. Schedule is clear!
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {historyAppointments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Past Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyAppointments.slice(0, 6).map(appt => (
              <div key={appt.id} className="bg-white ring-1 ring-gray-100 rounded-xl p-5 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-sm tracking-tight">{appt.patient_name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-200'}`}>
                    {appt.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5"/> 
                  {appt.start_time ? new Date(appt.start_time).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {notesModal.open && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500"/> Session Notes</h3>
              <button onClick={() => setNotesModal({open: false, apptId: null, notes: ""})} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs text-gray-500 mb-3 font-medium">These notes are strictly private and only visible to you.</p>
              <textarea 
                value={notesModal.notes}
                onChange={(e) => setNotesModal({...notesModal, notes: e.target.value})}
                className="w-full h-48 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-sm"
                placeholder="Write your observations, clinical diagnoses, or next steps here..."
              />
            </div>
            <div className="px-6 py-4 bg-gray-50/50 flex justify-end gap-3 border-t border-gray-100">
              <button 
                onClick={() => setNotesModal({open: false, apptId: null, notes: ""})}
                className="px-4 py-2 font-bold text-gray-600 bg-white ring-1 ring-gray-200 hover:bg-gray-50 rounded-lg transition-colors text-sm shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={saveNotes}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 text-sm shadow-sm"
              >
                {processing ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><Edit2 className="w-4 h-4 text-emerald-500"/> Edit Appointment</h3>
              <button onClick={() => setEditModal({...editModal, open: false})} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wider uppercase">Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={editModal.start_time}
                  onChange={(e) => setEditModal({...editModal, start_time: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800 text-sm shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wider uppercase">Mode</label>
                <select 
                  value={editModal.mode} 
                  onChange={(e) => setEditModal({...editModal, mode: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800 text-sm shadow-sm"
                >
                  <option value="Online">Online (Video Call)</option>
                  <option value="Offline">Offline (In-Person)</option>
                </select>
              </div>
              {editModal.mode === "Offline" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wider uppercase">Location</label>
                  <input 
                    type="text" 
                    value={editModal.location}
                    onChange={(e) => setEditModal({...editModal, location: e.target.value})}
                    placeholder="E.g. Clinic Room 1"
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800 text-sm shadow-sm"
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50/50 flex justify-end gap-3 border-t border-gray-100">
              <button 
                onClick={() => setEditModal({...editModal, open: false})}
                className="px-4 py-2 font-bold text-gray-600 bg-white ring-1 ring-gray-200 hover:bg-gray-50 rounded-lg transition-colors text-sm shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={saveAppointmentDetails}
                disabled={processing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 text-sm shadow-sm"
              >
                {processing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

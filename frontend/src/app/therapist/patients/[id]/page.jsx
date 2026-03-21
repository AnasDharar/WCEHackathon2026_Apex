"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { User, Activity, Calendar, FileText, Sparkles, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5";

export default function PatientDossierPage() {
  const { id } = useParams();
  const [patientData, setPatientData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("insights"); // 'insights' or 'history'

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [detailsRes, insightsRes] = await Promise.all([
          api.get(`/therapist/patients/${id}`),
          api.get(`/therapist/patients/${id}/insights`),
        ]);
        setPatientData(detailsRes?.data || null);
        setInsights(insightsRes?.data || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!patientData) return (
    <div className="p-8 text-center text-gray-500 font-medium">Patient not found or access denied.</div>
  );

  const { profile, appointments, assessment_history: assessmentHistory = [] } = patientData;

  return (
    <div className="pb-20 space-y-8">
      
      {/* Dossier Header */}
      <div className={`${static_card_style} flex gap-6 items-center`}>
        <div className="w-16 h-16 rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl shadow-sm">
          {profile.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{profile.name}</h1>
            {insights?.risk_level && (
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded shadow-sm ring-1 ${
                insights.risk_level.toLowerCase().includes('low') ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-red-50 text-red-800 ring-red-200'
              }`}>
                Risk: {insights.risk_level}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500">{profile.email} • Assigned {new Date(profile.joined).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-white ring-1 ring-black/5 rounded-xl w-max shadow-sm">
        <button 
          onClick={() => setActiveTab("insights")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold transition-all text-sm ${activeTab === 'insights' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <Sparkles className={`w-4 h-4 ${activeTab === 'insights' ? 'text-emerald-600' : ''}`} />
          AI Analysis
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold transition-all text-sm ${activeTab === 'history' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <Calendar className="w-4 h-4" />
          Session History & Notes
        </button>
      </div>

      {/* Content Area */}
      {activeTab === "insights" && (
        <div className="space-y-6">
          
          <div className={`${static_card_style} bg-emerald-700 text-white ring-emerald-800 overflow-hidden relative`}>
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                 <Activity className="w-48 h-48" />
             </div>
             <div className="relative z-10 max-w-3xl">
               <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-300"/> Clinical Summary</h2>
               <p className="text-base leading-relaxed text-emerald-50">{insights?.summary || "No AI summary available."}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={static_card_style}>
              <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500"/> Key Identifiers
              </h3>
              <ul className="space-y-3">
                {insights?.bullet_points?.map((pt, i) => (
                   <li key={i} className="flex gap-3 p-4 rounded-xl bg-gray-50 ring-1 ring-gray-100">
                     <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                     <span className="text-sm font-medium text-gray-700 leading-relaxed">{pt}</span>
                   </li>
                ))}
              </ul>
            </div>

            <div className={static_card_style}>
              <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500"/> Suggested Topics for Next Session
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {insights?.suggested_topics?.map((topic, i) => (
                  <span key={i} className="px-3.5 py-1.5 bg-amber-50 text-amber-800 ring-1 ring-amber-200 rounded-lg font-bold text-xs shadow-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {Array.isArray(insights?.clinician_flags) && insights.clinician_flags.length > 0 && (
            <div className={static_card_style}>
              <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500"/> Clinician Flags
              </h3>
              <div className="space-y-3">
                {insights.clinician_flags.map((flag, index) => (
                  <div key={`${flag}-${index}`} className="rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-100 text-sm font-medium text-red-900">
                    {flag}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {activeTab === "history" && (
        <div className={`${static_card_style} !p-0 overflow-hidden`}>
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">Session History</h2>
            <p className="text-xs font-medium text-gray-500 mt-1">Review past appointments and your private clinical notes.</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {assessmentHistory.length > 0 && (
              <div className="p-6 bg-gray-50/60">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Assessment History</h3>
                <div className="space-y-3">
                  {assessmentHistory.map((attempt) => (
                    <div key={attempt.id} className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-gray-900">
                          {attempt.mode === "initial" ? "Initial Assessment" : "Retake Assessment"}
                        </p>
                        <span className="bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                          {attempt.feedback?.risk_level || attempt.risk_level || "low"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-wider text-gray-400">
                        {new Date(attempt.completed_at || attempt.created_at).toLocaleString()}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(attempt.scores || []).map((score) => (
                          <span
                            key={`${attempt.id}-${score.test_id}`}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold"
                          >
                            {score.title || score.test_id}: {score.score}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {appointments.length > 0 ? [...appointments].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(appt => (
              <div key={appt.id} className="p-6 hover:bg-gray-50/30 transition-colors">
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                     <Calendar className="w-4 h-4 text-gray-400" />
                     <h3 className="font-bold text-base text-gray-900">{new Date(appt.start_time || appt.created_at).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}</h3>
                   </div>
                   <span className="bg-gray-100 ring-1 ring-gray-200 px-2.5 py-1 rounded shadow-sm text-[10px] font-bold uppercase text-gray-600 tracking-wider">
                     {appt.status}
                   </span>
                 </div>
                 
                 <div className="bg-emerald-50/50 ring-1 ring-emerald-100 p-5 rounded-xl">
                    <h4 className="flex items-center gap-2 font-bold text-emerald-800 mb-2 text-sm">
                      <FileText className="w-4 h-4 text-emerald-600" /> Provider Notes
                    </h4>
                    <p className="text-gray-700 italic whitespace-pre-wrap leading-relaxed text-sm font-medium">
                      {appt.therapist_notes || "No notes recorded for this session."}
                    </p>
                 </div>
              </div>
            )) : (
              <div className="p-16 text-center">
                 <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                 <h3 className="text-base font-bold text-gray-900">No session history</h3>
                 <p className="text-sm font-medium text-gray-500 mt-1">Book a session with the patient to start tracking progress.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

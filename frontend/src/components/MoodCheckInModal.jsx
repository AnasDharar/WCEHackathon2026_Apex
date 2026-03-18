 "use client";
 
 import { useMemo, useState } from "react";
 
 export default function MoodCheckInModal({ open, onClose, onSubmit, saving, error }) {
   const [score, setScore] = useState(6);
   const [notes, setNotes] = useState("");
   const [tags, setTags] = useState({ sleep: false, stress: false, social: false, appetite: false });
 
   const label = useMemo(() => {
     if (score >= 9) return "Great";
     if (score >= 7) return "Good";
     if (score >= 5) return "Okay";
     if (score >= 3) return "Low";
     return "Very low";
   }, [score]);
 
   if (!open) return null;
 
   return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
       <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">
         <div className="flex items-start justify-between gap-4">
           <div>
             <p className="text-sm font-semibold text-gray-900">Daily mood check-in</p>
             <p className="mt-1 text-xs text-gray-500">
               This helps the dashboard explain what’s happening and personalize recommendations.
             </p>
           </div>
           <button
             type="button"
             onClick={onClose}
             className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
           >
             Not now
           </button>
         </div>
 
         {error && (
           <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
             {error}
           </div>
         )}
 
         <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
           <div className="flex items-center justify-between gap-3">
             <p className="text-sm font-medium text-gray-900">
               Mood score: <span className="font-semibold">{score}</span> / 10
             </p>
             <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700">{label}</span>
           </div>
           <input
             type="range"
             min={1}
             max={10}
             value={score}
             onChange={(e) => setScore(Number(e.target.value))}
             className="mt-3 w-full"
           />
 
           <div className="mt-4 flex flex-wrap gap-2">
             {Object.keys(tags).map((key) => (
               <button
                 key={key}
                 type="button"
                 onClick={() => setTags((prev) => ({ ...prev, [key]: !prev[key] }))}
                 className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                   tags[key] ? "bg-emerald-600 text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                 }`}
               >
                 {key}
               </button>
             ))}
           </div>
 
           <textarea
             value={notes}
             onChange={(e) => setNotes(e.target.value)}
             placeholder="One line about today (optional)…"
             rows={3}
             className="mt-4 w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
           />
         </div>
 
         <div className="mt-5 flex items-center justify-end gap-2">
           <button
             type="button"
             onClick={() => onSubmit({ mood_score: score, notes: notes.trim() || undefined, tags })}
             disabled={saving}
             className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
           >
             {saving ? "Saving…" : "Save check-in"}
           </button>
         </div>
       </div>
     </div>
   );
 }


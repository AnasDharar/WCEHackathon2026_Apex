"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, Search, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 hover:ring-black/10 hover:shadow-md transition-all duration-200 ease-in-out hover:-translate-y-0.5";

export default function TherapistPatientsPage() {
  const { t } = useLanguage();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await api.get("/therapist/patients");
      setPatients(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="pb-20 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <Header
          title={t("Patient Directory")}
          subtitle={t("Manage and monitor the individuals assigned to your care.")}
        />
        
        <div className="relative w-full md:w-80 lg:w-96 md:mb-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder={t("Search patients...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white ring-1 ring-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm text-gray-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map(patient => (
          <Link href={`/therapist/patients/${patient.id}`} key={patient.id} className={`group block ${static_card_style}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg shadow-sm">
                {patient.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base tracking-tight group-hover:text-emerald-700 transition-colors">{patient.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{patient.email}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
                <Clock className="w-3.5 h-3.5 text-gray-400"/>
                {patient.last_session ? new Date(patient.last_session).toLocaleDateString() : 'No sessions yet'}
              </div>
              <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              </div>
            </div>
          </Link>
        ))}
        
        {filteredPatients.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
            <Users className="w-10 h-10 text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-900">No patients found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

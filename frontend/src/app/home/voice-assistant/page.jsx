"use client";

import { useState } from "react";
import { RoomAudioRenderer } from "@livekit/components-react";

import Header from "@/components/Header";
import Controls from "@/components/Controls";
import Transcript from "@/components/Transcript";
import VoiceOrb from "@/components/VoiceOrb";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { getVoiceDoctorById, voiceDoctors } from "@/lib/voiceDoctors";
import { getVoiceLanguageByCode, voiceLanguages } from "@/lib/voiceLanguages";

const static_card_style = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5";

function DoctorCard({ doctor, isSelected, onSelect, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(doctor.id)}
      disabled={disabled}
      className={`group rounded-xl p-5 text-left transition-all duration-300 ring-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
        isSelected
          ? "ring-emerald-500 bg-emerald-50 shadow-md transform -translate-y-1"
          : "ring-gray-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-md hover:ring-gray-300"
      } ${disabled ? "cursor-not-allowed opacity-60" : "active:scale-[0.98]"}`}
    >
      <div
        className={`rounded-xl ${
          isSelected ? "bg-emerald-100/50" : "bg-gray-50 group-hover:bg-gray-100/50"
        } p-4 transition-colors duration-300 h-full`}
      >
        <div className="flex h-full flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <p
              className={`text-xs font-bold uppercase tracking-wider ${
                isSelected ? "text-gray-800" : "text-gray-500"
              }`}
            >
              {doctor.specialty}
            </p>
            <h2 className={`mt-2 text-xl font-bold tracking-tight ${isSelected ? "text-emerald-950" : "text-gray-900"}`}>{doctor.name}</h2>
            {isSelected && (
              <span className="mt-3 inline-flex rounded-full bg-emerald-200/50 ring-1 ring-emerald-300 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-900">
                Selected
              </span>
            )}
          </div>
          <div
            className={`flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-xl ring-1 shadow-sm transition-colors duration-300 ${
              isSelected
                ? "ring-emerald-200 bg-white"
                : "ring-gray-200 bg-white group-hover:ring-gray-300"
            }`}
          >
            <img
              src={doctor.image}
              alt={doctor.name}
              className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function VoiceAssistantPage() {
  const [selectedDoctorId, setSelectedDoctorId] = useState(voiceDoctors[0].id);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState("mr-IN");
  const selectedDoctor = getVoiceDoctorById(selectedDoctorId);
  const selectedLanguage = getVoiceLanguageByCode(selectedLanguageCode);

  const {
    room,
    phase,
    error,
    transcript,
    isMuted,
    isConnected,
    isStarting,
    agentConnected,
    statusText,
    startSession,
    toggleMute,
    endSession,
  } = useVoiceAssistant(selectedDoctorId, selectedLanguageCode);

  return (
    <>
      <Header
        title="Voice Therapy"
        subtitle="Experience real-time AI voice counseling tailored to your needs."
      />

      <div className="space-y-8 pb-20">
        <section className={`${static_card_style} relative overflow-hidden bg-gradient-to-br from-white to-gray-50 p-6 sm:p-10`}>
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-blue-100/30 blur-3xl" />

          <div className="relative z-10 max-w-3xl mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Virtual Therapy Room
            </h1>
            <p className="mt-2 text-base text-gray-600 max-w-xl leading-relaxed">Customize your session language and choose an AI counselor below to begin.</p>
          </div>

          <div className="relative z-10 w-full rounded-2xl ring-1 ring-gray-200 bg-white/80 backdrop-blur-md p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                 <h2 className="text-sm font-bold tracking-tight text-gray-900">Conversation Language</h2>
                 <p className="text-xs font-medium text-gray-500 mt-0.5">Select the primary language for your session.</p>
              </div>
              <span className="rounded-full bg-emerald-50 ring-1 ring-emerald-200 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-800 shadow-sm">
                Current: {selectedLanguage.nativeLabel}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {voiceLanguages.map((language) => {
                const isSelected = language.code === selectedLanguageCode;

                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => setSelectedLanguageCode(language.code)}
                    disabled={isConnected || isStarting}
                    className={`rounded-xl ring-1 px-4 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
                      isSelected
                        ? "ring-emerald-500 bg-emerald-600 text-white shadow-md transform -translate-y-0.5"
                        : "ring-gray-200 bg-white hover:ring-gray-300 hover:bg-gray-50 hover:shadow-sm"
                    } ${isConnected || isStarting ? "cursor-not-allowed opacity-60" : "active:scale-[0.98]"}`}
                  >
                    <p
                      className={`text-sm font-bold tracking-tight ${
                        isSelected ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {language.label}
                    </p>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        isSelected ? "text-emerald-100" : "text-gray-500"
                      }`}
                    >
                      {language.nativeLabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 mt-10">
            <h2 className="mb-4 text-xl font-bold tracking-tight text-gray-900">Choose Your Counselor</h2>
            <div className="grid gap-6 xl:grid-cols-3 md:grid-cols-2">
              {voiceDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  isSelected={doctor.id === selectedDoctorId}
                  onSelect={setSelectedDoctorId}
                  disabled={isConnected || isStarting}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className={`${static_card_style} p-8 flex flex-col`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-emerald-100 ring-2 ring-emerald-200 overflow-hidden shadow-sm shrink-0">
                    <img src={selectedDoctor.image} alt={selectedDoctor.name} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">{selectedDoctor.name}</h2>
                    <p className="text-sm font-medium text-gray-800">{selectedDoctor.specialty}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gray-100 ring-1 ring-gray-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                  {selectedLanguage.nativeLabel}
                </span>
              </div>
            </div>

            <div className="flex-1 grid items-stretch gap-6 lg:grid-cols-2">
              <div className="rounded-2xl ring-1 ring-gray-200 bg-gray-50 flex flex-col items-center justify-center p-8 min-h-[300px]">
                <VoiceOrb
                  phase={phase}
                  statusText={statusText}
                  doctorImage={selectedDoctor.image}
                  doctorName={selectedDoctor.name}
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex-1 rounded-2xl ring-1 ring-gray-200 bg-white p-6 shadow-sm flex flex-col justify-center items-center text-center">
                   <h3 className="text-lg font-bold text-gray-900 mb-2">Session Controls</h3>
                   <p className="text-sm font-medium text-gray-500 mb-8 px-4 leading-relaxed">Manage your microphone and session connectivity below.</p>
                  <Controls
                    isConnected={isConnected}
                    isStarting={isStarting}
                    isMuted={isMuted}
                    onStart={startSession}
                    onToggleMute={toggleMute}
                    onEnd={endSession}
                  />
                </div>

                {error && (
                  <div className="rounded-xl ring-1 ring-red-200 bg-red-50 p-4 text-sm font-medium text-gray-800 shadow-sm flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>

            {room && <RoomAudioRenderer room={room} />}
          </div>

          <Transcript items={transcript} />
        </section>
      </div>
    </>
  );
}

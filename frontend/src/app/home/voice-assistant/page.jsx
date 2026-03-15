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

function DoctorCard({ doctor, isSelected, onSelect, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(doctor.id)}
      disabled={disabled}
      className={`group rounded-[2rem] border p-5 text-left transition duration-300 ${
        isSelected
          ? "border-slate-950 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
          : "border-slate-200 bg-white/90 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:border-slate-300"
      } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
    >
      <div
        className={`rounded-[1.75rem] bg-gradient-to-br ${
          isSelected ? "from-white/25 via-white/10 to-transparent" : doctor.color
        } p-4`}
      >
        <div className="flex min-h-36 items-start justify-between gap-4">
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                isSelected ? "text-white/70" : "text-slate-500"
              }`}
            >
              {doctor.specialty}
            </p>
            <h2 className="mt-3 text-xl font-semibold">{doctor.name}</h2>
            {isSelected ? (
              <span className="mt-4 inline-flex rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                Selected
              </span>
            ) : null}
          </div>
          <div
            className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.5rem] border ${
              isSelected
                ? "border-white/20 bg-white/10"
                : "border-slate-200 bg-white/80"
            }`}
          >
            <img
              src={doctor.image}
              alt={doctor.name}
              className="h-20 w-20 object-contain"
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
        title=""
        subtitle=""
      />

      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(186,230,253,0.35),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(209,250,229,0.28),transparent_30%),linear-gradient(135deg,#f7fbff_0%,#eef6fb_42%,#f8fcff_100%)] p-6 shadow-[0_30px_100px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              Therapy Room
            </h1>
          </div>

          <div className="mt-6 w-full rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Conversation language
              </label>
              <span className="rounded-full bg-gradient-to-r from-emerald-100 to-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                {selectedLanguage.nativeLabel}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {voiceLanguages.map((language) => {
                const isSelected = language.code === selectedLanguageCode;

                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => setSelectedLanguageCode(language.code)}
                    disabled={isConnected || isStarting}
                    className={`rounded-[1.25rem] border px-3 py-3 text-left transition duration-200 ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-[0_14px_35px_rgba(15,23,42,0.18)]"
                        : "border-slate-200 bg-white/85 text-slate-800 hover:-translate-y-0.5 hover:border-slate-300"
                    } ${isConnected || isStarting ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        isSelected ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {language.label}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isSelected ? "text-white/70" : "text-slate-500"
                      }`}
                    >
                      {language.nativeLabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-3 md:grid-cols-2">
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
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-slate-950">{selectedDoctor.name}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {selectedLanguage.nativeLabel}
                </span>
              </div>
            </div>

            <div className="mt-6 grid items-start gap-4 lg:grid-cols-[0.88fr_1.12fr]">
              <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,#fff8eb_0%,#ffffff_55%,#f8fafc_100%)] p-5">
                <VoiceOrb
                  phase={phase}
                  statusText={statusText}
                  doctorImage={selectedDoctor.image}
                  doctorName={selectedDoctor.name}
                />
              </div>

              <div className="space-y-4 self-start rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <Controls
                  isConnected={isConnected}
                  isStarting={isStarting}
                  isMuted={isMuted}
                  onStart={startSession}
                  onToggleMute={toggleMute}
                  onEnd={endSession}
                />

                {error ? (
                  <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>

            {room ? <RoomAudioRenderer room={room} /> : null}
          </div>

          <Transcript items={transcript} />
        </section>
      </div>
    </>
  );
}

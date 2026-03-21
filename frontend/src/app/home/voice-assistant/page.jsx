"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { RoomAudioRenderer } from "@livekit/components-react";

import Controls from "@/components/Controls";
import EmotionCameraPanel from "@/components/EmotionCameraPanel";
import Transcript from "@/components/Transcript";
import VoiceOrb from "@/components/VoiceOrb";
import { useEmotionCamera } from "@/hooks/useEmotionCamera";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { getVoiceDoctorById, voiceDoctors } from "@/lib/voiceDoctors";
import { getVoiceLanguageByCode, voiceLanguages } from "@/lib/voiceLanguages";

const staticCardStyle = "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5";
const EMOTION_SAMPLE_WINDOW_MS = 45000;
const EMOTION_CONFIDENCE_THRESHOLD = 55;
const EMOTION_PUBLISH_MIN_INTERVAL_MS = 8000;
const EMOTION_VALENCE = {
  angry: -3,
  anger: -3,
  anxious: -3,
  calm: 2,
  disgust: -2,
  disgusted: -2,
  fear: -3,
  fearful: -3,
  happy: 2,
  neutral: 0,
  sad: -2,
  stressed: -3,
  surprise: 0,
  surprised: 0,
};

function normalizeEmotionKey(value) {
  return value
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_") || "";
}

function getEmotionValence(emotion) {
  return EMOTION_VALENCE[emotion] ?? 0;
}

function summarizeEmotionSamples(samples) {
  if (!samples.length) {
    return null;
  }

  const grouped = new Map();

  samples.forEach((sample) => {
    const current = grouped.get(sample.emotion) || {
      emotion: sample.emotion,
      totalWeight: 0,
      totalConfidence: 0,
      sampleCount: 0,
    };

    grouped.set(sample.emotion, {
      emotion: sample.emotion,
      totalWeight: current.totalWeight + Math.max(sample.confidence, 1),
      totalConfidence: current.totalConfidence + sample.confidence,
      sampleCount: current.sampleCount + 1,
    });
  });

  const dominant = Array.from(grouped.values()).sort((left, right) => {
    return right.totalWeight - left.totalWeight;
  })[0];

  const midpoint = Math.max(1, Math.floor(samples.length / 2));
  const firstHalf = samples.slice(0, midpoint);
  const secondHalf = samples.slice(midpoint);
  const averageValence = (items) => {
    if (!items.length) {
      return 0;
    }

    return (
      items.reduce((total, item) => total + getEmotionValence(item.emotion), 0) / items.length
    );
  };

  const delta =
    averageValence(secondHalf.length ? secondHalf : firstHalf) - averageValence(firstHalf);

  let trend = "stable";
  if (delta <= -0.75) {
    trend = "worsening";
  } else if (delta >= 0.75) {
    trend = "improving";
  }

  return {
    emotion: dominant.emotion,
    confidence: Number((dominant.totalConfidence / dominant.sampleCount).toFixed(1)),
    trend,
    sampleCount: samples.length,
    windowMs: EMOTION_SAMPLE_WINDOW_MS,
    observedAt: samples[samples.length - 1].timestamp,
  };
}

function shouldPublishEmotionSummary(nextSummary, previousPublished, now) {
  if (!nextSummary) {
    return false;
  }

  if (!previousPublished) {
    return true;
  }

  if (nextSummary.emotion !== previousPublished.emotion) {
    return true;
  }

  if (nextSummary.trend !== previousPublished.trend) {
    return true;
  }

  if (Math.abs(nextSummary.confidence - previousPublished.confidence) >= 8) {
    return true;
  }

  return now - previousPublished.publishedAt >= EMOTION_PUBLISH_MIN_INTERVAL_MS;
}

function DoctorCard({ doctor, isSelected, onSelect, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(doctor.id)}
      disabled={disabled}
      className={`group rounded-2xl p-5 text-left transition-all duration-300 ring-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
        isSelected
          ? "ring-emerald-500 bg-emerald-50 shadow-md -translate-y-1"
          : "ring-gray-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-md hover:ring-gray-300"
      } ${disabled ? "cursor-not-allowed opacity-60" : "active:scale-[0.98]"}`}
    >
      <div
        className={`rounded-2xl p-4 transition-colors duration-300 ${
          isSelected ? "bg-emerald-100/60" : "bg-gray-50 group-hover:bg-gray-100/70"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p
              className={`text-xs font-bold uppercase tracking-wider ${
                isSelected ? "text-emerald-900" : "text-gray-500"
              }`}
            >
              {doctor.specialty}
            </p>
            <h2
              className={`mt-2 text-xl font-bold tracking-tight ${
                isSelected ? "text-emerald-950" : "text-gray-900"
              }`}
            >
              {doctor.name}
            </h2>
          </div>

          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ring-1 shadow-sm transition-colors duration-300 ${
              isSelected
                ? "ring-emerald-200 bg-white"
                : "ring-gray-200 bg-white group-hover:ring-gray-300"
            }`}
          >
            <img
              src={doctor.image}
              alt={doctor.name}
              className="h-16 w-16 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-600 ring-1 ring-gray-200">
            Tap to open room
          </span>
          {isSelected ? (
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              Selected
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function VoiceSessionModal({
  open,
  doctor,
  language,
  camera,
  phase,
  error,
  transcript,
  isMuted,
  isConnected,
  isStarting,
  agentConnected,
  statusText,
  onStart,
  onToggleMute,
  onEnd,
  onClose,
}) {
  if (!open) {
    return null;
  }

  const readinessLabel = isStarting
    ? "Connecting room"
    : isConnected
      ? agentConnected
        ? "Counselor joined"
        : "Waiting for counselor"
      : "Room not started";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Voice therapy room"
        className="relative h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-slate-50 to-emerald-50 shadow-[0_35px_120px_rgba(15,23,42,0.35)]"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />

        <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
          <div className="border-b border-white/70 bg-white/70 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-emerald-100 ring-2 ring-emerald-200 shadow-sm">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="h-12 w-12 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-gray-500">
                    Voice Room
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                    {doctor.name}
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 sm:text-sm">{doctor.specialty}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-600 ring-1 ring-gray-200">
                  {language.nativeLabel}
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ring-1 ${
                    agentConnected
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-amber-50 text-amber-700 ring-amber-200"
                  }`}
                >
                  {readinessLabel}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1.03fr_0.97fr]">
              <section className="min-h-0 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
                <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[0.78fr_1.02fr]">
                  <div className="flex min-h-0 flex-col">
                    <div className="flex h-full min-h-0 flex-col overflow-y-auto rounded-[1.75rem] border border-gray-200 bg-gray-50 p-3.5">
                      <div className="mx-auto flex w-full min-h-[12.5rem] max-w-[14.75rem] items-center justify-center rounded-[1.5rem] border border-white/70 bg-white px-3 py-4 shadow-sm sm:min-h-[15rem] sm:max-w-[16rem]">
                        <VoiceOrb
                          phase={phase}
                          statusText={statusText}
                          doctorImage={doctor.image}
                          doctorName={doctor.name}
                        />
                      </div>

                      <div className="mt-3 rounded-[1.35rem] border border-gray-200 bg-white/90 p-3 shadow-sm">
                        <Controls
                          isConnected={isConnected}
                          isStarting={isStarting}
                          isMuted={isMuted}
                          onStart={onStart}
                          onToggleMute={onToggleMute}
                          onEnd={onEnd}
                        />

                        {error ? (
                          <div className="mt-3 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                            {error}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <EmotionCameraPanel camera={camera} />
                  </div>
                </div>
              </section>

              <div className="min-h-0">
                <Transcript items={transcript} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VoiceAssistantPage() {
  const [selectedDoctorId, setSelectedDoctorId] = useState(voiceDoctors[0].id);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState("mr-IN");
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [emotionSummary, setEmotionSummary] = useState(null);

  const selectedDoctor = getVoiceDoctorById(selectedDoctorId);
  const selectedLanguage = getVoiceLanguageByCode(selectedLanguageCode);
  const emotionCamera = useEmotionCamera(showSessionModal);
  const emotionHistoryRef = useRef([]);
  const lastPublishedEmotionRef = useRef(null);
  const resetEmotionSession = () => {
    emotionHistoryRef.current = [];
    lastPublishedEmotionRef.current = null;
    setEmotionSummary(null);
  };

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
    publishEmotionContext,
    endSession,
  } = useVoiceAssistant(selectedDoctorId, selectedLanguageCode);

  const handleEscapeRoom = useEffectEvent(() => {
    resetEmotionSession();
    emotionCamera.stopCamera();
    setShowSessionModal(false);
    void endSession();
  });

  useEffect(() => {
    if (!showSessionModal) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        handleEscapeRoom();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showSessionModal]);

  const handleOpenRoom = (doctorId) => {
    setSelectedDoctorId(doctorId);
    setShowSessionModal(true);
  };

  const handleStartRoomSession = async () => {
    resetEmotionSession();
    emotionCamera.startCamera();
    await emotionCamera.waitForAnalysis(7000);
    await startSession();
  };

  const handleStartEmotionCamera = () => {
    resetEmotionSession();
    emotionCamera.startCamera();
  };

  const handleStopEmotionCamera = () => {
    resetEmotionSession();
    emotionCamera.stopCamera();

    if (isConnected) {
      void publishEmotionContext({
        type: "emotion_context",
        availability: "unavailable",
        reason: "camera_inactive",
        observedAt: Date.now(),
      });
    }
  };

  const handleRetryEmotionCamera = () => {
    resetEmotionSession();
    emotionCamera.retry();
  };

  const sessionCamera = {
    ...emotionCamera,
    startCamera: handleStartEmotionCamera,
    stopCamera: handleStopEmotionCamera,
    retry: handleRetryEmotionCamera,
  };

  const handleEndRoomSession = async () => {
    handleStopEmotionCamera();
    await endSession();
  };

  const handleCloseRoom = () => {
    setShowSessionModal(false);
    void handleEndRoomSession();
  };

  useEffect(() => {
    if (!emotionCamera.lastAnalysisAt) {
      return;
    }

    const nextHistory = emotionHistoryRef.current.filter((sample) => {
      return emotionCamera.lastAnalysisAt - sample.timestamp <= EMOTION_SAMPLE_WINDOW_MS;
    });
    const normalizedEmotion = normalizeEmotionKey(emotionCamera.dominantEmotion);
    const nextConfidence = emotionCamera.confidence;

    if (
      normalizedEmotion &&
      typeof nextConfidence === "number" &&
      nextConfidence >= EMOTION_CONFIDENCE_THRESHOLD
    ) {
      nextHistory.push({
        emotion: normalizedEmotion,
        confidence: nextConfidence,
        timestamp: emotionCamera.lastAnalysisAt,
      });
    }

    emotionHistoryRef.current = nextHistory;
    setEmotionSummary(summarizeEmotionSamples(nextHistory));
  }, [
    emotionCamera.confidence,
    emotionCamera.dominantEmotion,
    emotionCamera.lastAnalysisAt,
  ]);

  useEffect(() => {
    if (!emotionSummary || !isConnected || !agentConnected) {
      return undefined;
    }

    const now = Date.now();
    if (!shouldPublishEmotionSummary(emotionSummary, lastPublishedEmotionRef.current, now)) {
      return undefined;
    }

    let cancelled = false;

    void (async () => {
      const published = await publishEmotionContext({
        type: "emotion_context",
        primaryEmotion: emotionSummary.emotion,
        confidence: emotionSummary.confidence,
        trend: emotionSummary.trend,
        sampleCount: emotionSummary.sampleCount,
        windowMs: emotionSummary.windowMs,
        observedAt: emotionSummary.observedAt,
      });

      if (!cancelled && published) {
        lastPublishedEmotionRef.current = {
          ...emotionSummary,
          publishedAt: now,
        };
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [agentConnected, emotionSummary, isConnected, publishEmotionContext]);

  return (
    <>
      <div className="space-y-8 pb-20">
        <section
          className={`${staticCardStyle} relative overflow-hidden bg-gradient-to-br from-white to-gray-50 p-6 sm:p-10`}
        >
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-blue-100/30 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Virtual Therapy Room
            </h1>
          </div>

          <div className="relative z-10 mt-8 w-full rounded-3xl border border-gray-200 bg-white/85 p-6 shadow-sm backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-gray-900">
                  Conversation Language
                </h2>
                <p className="mt-0.5 text-xs font-medium text-gray-500">
                  Popup me jo room open hoga usi language me AI counselor baat karega.
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-800 ring-1 ring-emerald-200 shadow-sm">
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
                    className={`rounded-xl px-4 py-3 text-left ring-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
                      isSelected
                        ? "bg-emerald-600 text-white ring-emerald-500 shadow-md -translate-y-0.5"
                        : "bg-white ring-gray-200 hover:bg-gray-50 hover:ring-gray-300 hover:shadow-sm"
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  Choose Your Counselor
                </h2>
              </div>

              <div className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-gray-600 ring-1 ring-gray-200">
                Step 2 of 2
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {voiceDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  isSelected={doctor.id === selectedDoctorId}
                  onSelect={handleOpenRoom}
                  disabled={isConnected || isStarting}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <VoiceSessionModal
        open={showSessionModal}
        doctor={selectedDoctor}
        language={selectedLanguage}
        camera={sessionCamera}
        phase={phase}
        error={error}
        transcript={transcript}
        isMuted={isMuted}
        isConnected={isConnected}
        isStarting={isStarting}
        agentConnected={agentConnected}
        statusText={statusText}
        onStart={handleStartRoomSession}
        onToggleMute={toggleMute}
        onEnd={handleEndRoomSession}
        onClose={handleCloseRoom}
      />

      {room ? <RoomAudioRenderer room={room} /> : null}
    </>
  );
}

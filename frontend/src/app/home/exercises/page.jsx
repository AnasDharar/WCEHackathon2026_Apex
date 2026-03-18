"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { RoomAudioRenderer } from "@livekit/components-react";

import Header from "@/components/Header";
import { useBreathingExercise } from "@/hooks/useBreathingExercise";
import { useExerciseVoiceCoach } from "@/hooks/useExerciseVoiceCoach";
import { getVoiceLanguageByCode, voiceLanguages } from "@/lib/voiceLanguages";

const EXERCISE_COACH_LANGUAGES = voiceLanguages.filter((language) =>
  ["en-IN", "hi-IN", "mr-IN"].includes(language.code)
);

const EXERCISES = [
  {
    id: "calm-breathing",
    title: "Calm Breathing",
    description: "A guided breathing pattern that slows the breath and supports calm.",
    imageUrl: "https://cdn.pixabay.com/photo/2022/10/17/18/03/breathing-7528398_1280.jpg",
    imageAlt: "Illustration of a person sitting calmly and practicing breathing outdoors.",
    totalDurationLabel: "60 seconds",
    rhythmLabel: "4s in / 4s hold / 4s out",
    config: {
      type: "breathing",
      sessionDuration: 60,
      order: ["INHALE", "HOLD", "EXHALE"],
      stages: {
        INHALE: {
          label: "Breathe In",
          duration: 4,
          instruction: "Breathe In",
          voicePrompt: "Breathe in slowly.",
        },
        HOLD: {
          label: "Hold",
          duration: 4,
          instruction: "Hold",
          voicePrompt: "Hold your breath.",
        },
        EXHALE: {
          label: "Breathe Out",
          duration: 4,
          instruction: "Breathe Out",
          voicePrompt: "Breathe out slowly.",
        },
      },
      completionMessage: "Exercise Complete. Great job!",
    },
  },
];

const STAGE_BADGES = {
  INHALE: "bg-emerald-100 text-gray-900 ring-emerald-200",
  HOLD: "bg-amber-100 text-gray-900 ring-amber-200",
  EXHALE: "bg-sky-100 text-sky-800 ring-sky-200",
};

export default function ExercisesPage() {
  const [selectedExerciseId, setSelectedExerciseId] = useState(EXERCISES[0].id);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState("en-IN");
  const [showExerciseSession, setShowExerciseSession] = useState(false);
  const [isSessionFocused, setIsSessionFocused] = useState(false);
  const [isSessionVisible, setIsSessionVisible] = useState(false);
  const {
    exerciseRunning,
    currentStageKey,
    currentStageDuration,
    currentStage,
    currentStageLabel,
    stageTimer,
    sessionTimer,
    completionMessage,
    activeExercise,
    statusMessage,
    startExercise,
    startStage,
    completeExercise,
    resetExercise,
    setExerciseConfig,
  } = useBreathingExercise();
  const coach = useExerciseVoiceCoach(selectedExerciseId, selectedLanguageCode);
  const lastHandledEventRef = useRef(null);

  const selectedExercise =
    EXERCISES.find((exercise) => exercise.id === selectedExerciseId) || EXERCISES[0];
  const selectedLanguage = getVoiceLanguageByCode(selectedLanguageCode);

  const currentInstruction = statusMessage;
  const stageLabel = currentStage ? currentStageLabel : "Ready";
  const orbRingClass =
    !exerciseRunning || !currentStageKey
      ? "scale-100 opacity-100"
      : currentStageKey === "EXHALE"
        ? "scale-[0.96] opacity-70"
        : currentStageKey === "HOLD"
          ? "scale-[1.08] opacity-90"
          : "scale-[1.12] opacity-100";
  const orbAuraClass =
    !exerciseRunning || !currentStageKey
      ? "scale-95 opacity-35"
      : currentStageKey === "EXHALE"
        ? "scale-[0.9] opacity-20"
        : currentStageKey === "HOLD"
          ? "scale-[1.12] opacity-45"
          : "scale-[1.2] opacity-55";
  const orbShadowClass =
    !exerciseRunning || !currentStageKey
      ? "scale-100 opacity-50"
      : currentStageKey === "EXHALE"
        ? "scale-90 opacity-30"
        : currentStageKey === "HOLD"
          ? "scale-110 opacity-60"
          : "scale-125 opacity-70";
  const indicatorScaleClass =
    activeExercise.type === "breathing"
      ? !exerciseRunning || !currentStageKey
        ? "scale-100"
        : currentStageKey === "EXHALE"
          ? "scale-90"
          : "scale-125"
      : !exerciseRunning
        ? "scale-100"
        : "scale-110";

  useEffect(() => {
    if (!coach.lastExerciseEvent) {
      return;
    }

    if (lastHandledEventRef.current === coach.lastExerciseEvent.receivedAt) {
      return;
    }

    lastHandledEventRef.current = coach.lastExerciseEvent.receivedAt;

    if (coach.lastExerciseEvent.type === "stage_started") {
      startStage({
        stageKey: coach.lastExerciseEvent.stage,
        sessionTimeRemaining: coach.lastExerciseEvent.session_time_remaining,
        instruction: coach.lastExerciseEvent.instruction,
        duration: coach.lastExerciseEvent.duration,
        label: coach.lastExerciseEvent.label,
      });
      return;
    }

    if (coach.lastExerciseEvent.type === "exercise_completed") {
      completeExercise(coach.lastExerciseEvent.message);
    }
  }, [coach.lastExerciseEvent, completeExercise, startStage]);

  useEffect(() => {
    if (!showExerciseSession) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setIsSessionVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [showExerciseSession]);

  const handleStartExercise = async () => {
    lastHandledEventRef.current = null;
    const connected = await coach.startSession();

    if (!connected) {
      return;
    }

    startExercise(selectedExercise.config);
    await coach.publishExerciseEvent({
      type: "exercise_started",
      exercise_id: selectedExercise.id,
      language_code: selectedLanguageCode,
      session_duration: selectedExercise.config.sessionDuration,
      stages: selectedExercise.config.order.map((stageKey) => ({
        key: stageKey,
        duration: selectedExercise.config.stages[stageKey].duration,
      })),
    });
  };

  const handleResetExercise = async () => {
    lastHandledEventRef.current = null;
    setIsSessionFocused(false);
    resetExercise();
    await coach.publishExerciseEvent({
      type: "exercise_stopped",
      exercise_id: selectedExercise.id,
    });
    await coach.endSession();
  };

  return (
    <>
      <Header
        title="Exercises"
        subtitle="Guided sessions to help you relax, refocus, and recharge."
      />

      <div className="relative space-y-8 pb-20">
        {!showExerciseSession ? (
          <section className="rounded-2xl bg-white p-8 md:p-10 shadow-sm ring-1 ring-black/5 relative overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl" />
            
            <div className="mb-8 relative z-10 max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Available Exercises</h2>
              <p className="mt-2 text-base text-gray-600 leading-relaxed">Choose an exercise below. Your AI coach will guide you through the session in real-time.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 relative z-10">
              {EXERCISES.map((exercise) => {
                const isSelected = exercise.id === selectedExerciseId;

                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => {
                      setSelectedExerciseId(exercise.id);
                      setExerciseConfig(exercise.config);
                      setIsSessionVisible(false);
                      setShowExerciseSession(true);
                      setIsSessionFocused(true);
                      lastHandledEventRef.current = null;
                      void coach.endSession();
                    }}
                    className={`group flex flex-col overflow-hidden rounded-2xl bg-white text-left transition-all duration-300 ring-1 shadow-sm hover:shadow-md hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      isSelected
                        ? "ring-emerald-500"
                        : "ring-gray-200 hover:ring-emerald-300"
                    }`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden w-full">
                      <Image
                        src={exercise.imageUrl}
                        alt={exercise.imageAlt}
                        width={1280}
                        height={1280}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900/80 to-transparent p-5 pt-12">
                         <h3 className="text-xl font-bold tracking-tight text-white line-clamp-1">{exercise.title}</h3>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-sm font-medium text-gray-600 leading-relaxed mb-4 line-clamp-2 flex-1">{exercise.description}</p>
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-auto">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-50 px-2.5 py-1 rounded">
                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {exercise.totalDurationLabel}
                        </span>
                         <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-50 px-2.5 py-1 rounded">
                           {exercise.rhythmLabel}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <>
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 z-10 rounded-3xl transition-all duration-700 ease-in-out ${
                isSessionFocused
                  ? "h-[450px] bg-white/70 opacity-100 backdrop-blur-md"
                  : "h-0 bg-transparent opacity-0"
              }`}
            />

            <section
              className={`relative z-20 mx-auto w-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isSessionVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-16 scale-[0.94] opacity-0"
              }`}
            >
          <div
            className={`relative overflow-hidden rounded-2xl bg-white p-6 md:p-10 transition-all duration-700 ease-out shadow-lg ring-1 ${
              isSessionFocused
                ? "ring-emerald-200"
                : "ring-black/5"
            }`}
          >

            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">{selectedExercise.title}</h2>
                <p className="mt-2 text-sm font-medium text-gray-500 max-w-xl">{selectedExercise.description}</p>
              </div>
              <span className="rounded-full bg-emerald-50 ring-1 ring-emerald-200 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-900 shadow-sm flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {activeExercise.sessionDuration} sec session
              </span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
              <div className="rounded-2xl ring-1 ring-gray-100 bg-gray-50/50 p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center justify-center gap-8 text-center w-full">
                  <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-emerald-100/50">
                    <div
                      className={`pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.1),rgba(16,185,129,0)_70%)] transition-all ease-in-out ${orbAuraClass}`}
                      style={{ transitionDuration: `${Math.max(currentStageDuration, 1)}s` }}
                    />
                    <div
                      className={`absolute inset-0 rounded-full ring-1 ring-emerald-200/50 transition-all ease-in-out ${orbRingClass}`}
                      style={{ transitionDuration: `${Math.max(currentStageDuration, 1)}s` }}
                    />
                    <div
                      className={`absolute inset-6 rounded-full ring-1 ring-emerald-200/80 transition-all ease-in-out ${orbRingClass}`}
                      style={{ transitionDuration: `${Math.max(currentStageDuration, 1)}s` }}
                    />
                    <div
                      className={`absolute inset-12 rounded-full ring-1 ring-emerald-300/80 transition-all ease-in-out ${orbRingClass}`}
                      style={{ transitionDuration: `${Math.max(currentStageDuration, 1)}s` }}
                    />
                    <div
                      className={`absolute h-48 w-48 rounded-full bg-emerald-200/30 blur-2xl transition-all ease-in-out ${orbShadowClass}`}
                      style={{ transitionDuration: `${Math.max(currentStageDuration, 1)}s` }}
                    />
                    <div
                      className={`relative h-32 w-32 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/30 transition-transform ease-in-out ${indicatorScaleClass} flex items-center justify-center`}
                      style={{ transitionDuration: `${Math.max(currentStageDuration, 1)}s` }}
                    >
                        {exerciseRunning && (
                             <span className="text-white font-bold text-3xl tabular-nums animate-pulse drop-shadow-md">{stageTimer}</span>
                        )}
                    </div>
                  </div>

                  <div className="space-y-4 max-w-xs">
                    <div className="flex justify-center">
                        <span
                        className={`inline-flex items-center justify-center rounded-full ring-1 px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${
                            STAGE_BADGES[currentStageKey] || "bg-gray-100 text-gray-600 ring-gray-200"
                        }`}
                        >
                        {stageLabel}
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-gray-900">{stageLabel}</h3>
                    <p className="text-base font-medium text-gray-600 leading-relaxed">{currentInstruction}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl ring-1 ring-gray-100 bg-white p-5 shadow-sm text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                        {currentStageKey ? stageLabel : "Stage Timer"}
                    </p>
                    <p className="text-4xl font-bold tracking-tight text-gray-900 tabular-nums">{stageTimer}s</p>
                    {exerciseRunning && (
                        <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-gray-700 flex items-center justify-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                        </p>
                    )}
                    </div>
                    <div className="rounded-2xl ring-1 ring-gray-100 bg-white p-5 shadow-sm text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                        Total Time
                    </p>
                    <p className="text-4xl font-bold tracking-tight text-gray-900 tabular-nums">{sessionTimer}s</p>
                     {exerciseRunning && (
                        <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-gray-700 flex items-center justify-center gap-1.5">
                        Remaining
                        </p>
                    )}
                    </div>
                </div>

                <div className="flex-1 rounded-2xl ring-1 ring-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                     <div>
                        <p className="text-sm font-bold tracking-tight text-gray-900">Voice Coach Language</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">Select the voice for guided cues.</p>
                     </div>
                     <div className="h-10 w-10 rounded-full bg-emerald-100 ring-1 ring-emerald-200 flex items-center justify-center">
                         <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                     </div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col gap-2">
                    {EXERCISE_COACH_LANGUAGES.map((language) => {
                        const isSelected = selectedLanguageCode === language.code;

                        return (
                        <button
                            key={language.code}
                            type="button"
                            onClick={() => setSelectedLanguageCode(language.code)}
                            disabled={exerciseRunning || coach.isStarting}
                            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                            isSelected
                                ? "ring-1 ring-emerald-200 bg-emerald-50/80 shadow-sm"
                                : "bg-transparent text-gray-700 hover:bg-gray-50 hover:ring-1 hover:ring-gray-200"
                            } disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:ring-0 disabled:hover:bg-transparent`}
                        >
                            <div>
                            <p className={`text-sm tracking-tight ${isSelected ? "font-bold text-gray-900" : "font-semibold"}`}>{language.label}</p>
                            <p className={`mt-0.5 text-xs font-medium ${isSelected ? "text-gray-800" : "text-gray-500"}`}>{language.nativeLabel}</p>
                            </div>
                            {isSelected && (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
                                   <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                                </span>
                            )}
                        </button>
                        );
                    })}
                  </div>
                </div>

                {completionMessage && (
                  <div className="rounded-xl ring-1 ring-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-gray-900 shadow-sm flex items-center gap-3">
                    <span className="text-xl">🎉</span> {completionMessage}
                  </div>
                )}

                {coach.error && (
                  <div className="rounded-xl ring-1 ring-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-gray-800 shadow-sm flex items-center gap-3">
                     <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {coach.error}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSessionVisible(false);
                      setShowExerciseSession(false);
                      setIsSessionFocused(false);
                      lastHandledEventRef.current = null;
                      resetExercise();
                      void coach.endSession();
                    }}
                    className="rounded-xl bg-white ring-1 ring-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Back to Selection
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleResetExercise();
                    }}
                    className="rounded-xl bg-white ring-1 ring-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleStartExercise}
                    disabled={coach.isStarting || exerciseRunning}
                    className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-emerald-400 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer"
                  >
                    {coach.isStarting ? "Connecting Coach..." : "Start Exercise"}
                  </button>
                </div>
              </div>
            </div>
          </div>
            </section>
          </>
        )}
      </div>

      {coach.room ? <RoomAudioRenderer room={coach.room} /> : null}
    </>
  );
}

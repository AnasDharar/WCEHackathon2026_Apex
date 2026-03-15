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
    title: "Calm Breathing Exercise",
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
  INHALE: "bg-emerald-100 text-emerald-700",
  HOLD: "bg-amber-100 text-amber-700",
  EXHALE: "bg-sky-100 text-sky-700",
  SEE_5: "bg-emerald-100 text-emerald-700",
  FEEL_4: "bg-teal-100 text-teal-700",
  HEAR_3: "bg-sky-100 text-sky-700",
  SMELL_2: "bg-amber-100 text-amber-700",
  TASTE_1: "bg-rose-100 text-rose-700",
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
        subtitle=""
      />

      <div className="relative space-y-6 font-google">
        {!showExerciseSession ? (
          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg text-gray-800">Available Exercises</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    className={`group overflow-hidden rounded-[28px] border p-3 text-left transition-all duration-300 ${
                      isSelected
                        ? "border-emerald-300 bg-emerald-50 shadow-[0_20px_60px_rgba(16,185,129,0.12)]"
                        : "border-gray-200 bg-white hover:border-emerald-200 hover:bg-gray-50 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
                    }`}
                  >
                    <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-sm">
                      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-slate-900/72 via-slate-900/16 to-white/10" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-slate-900/70 via-slate-900/24 to-transparent" />
                      <div className="pointer-events-none absolute left-5 top-5 z-20 rounded-full border border-white/35 bg-white/20 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-white backdrop-blur-md">
                        EXERCISE
                      </div>
                      <div className="pointer-events-none absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-white/20 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
                        <span className="ml-0.5 text-lg">+</span>
                      </div>
                      <div className="pointer-events-none absolute -left-6 top-8 z-10 h-24 w-24 rounded-full bg-emerald-200/35 blur-2xl" />
                      <div className="pointer-events-none absolute -right-6 bottom-6 z-10 h-24 w-24 rounded-full bg-sky-200/30 blur-2xl" />
                      <div className="relative aspect-[16/8.8] overflow-hidden">
                        <Image
                          src={exercise.imageUrl}
                          alt={exercise.imageAlt}
                          width={1280}
                          height={1280}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      </div>

                      <div className="absolute inset-x-0 bottom-0 z-20 p-6">
                        <div className="max-w-lg">
                          <h3 className="text-[30px] font-semibold leading-tight tracking-[0.01em] text-white [text-shadow:0_3px_18px_rgba(15,23,42,0.55)]">
                            {exercise.title}
                          </h3>
                        </div>
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
              className={`pointer-events-none absolute inset-x-0 top-0 z-10 rounded-[2rem] transition-all duration-500 ${
                isSessionFocused
                  ? "h-[320px] bg-white/60 opacity-100 backdrop-blur-[4px]"
                  : "h-0 bg-transparent opacity-0"
              }`}
            />

            <section
              className={`relative z-20 mx-auto w-full max-w-6xl transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isSessionVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-10 scale-[0.96] opacity-0"
              }`}
            >
          <div
            className={`relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 transition-all duration-700 ease-out ${
              isSessionFocused
                ? "shadow-[0_30px_100px_rgba(15,23,42,0.18)] ring-1 ring-emerald-100"
                : "shadow-sm"
            }`}
          >
            <div
              className={`pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.22),rgba(16,185,129,0))] transition-all duration-700 ${
                isSessionFocused ? "animate-[pulse_4.2s_ease-in-out_infinite] opacity-100" : "opacity-0"
              }`}
            />
            <div
              className={`pointer-events-none absolute -right-8 top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.2),rgba(34,211,238,0))] transition-all duration-700 ${
                isSessionFocused ? "animate-[pulse_5s_ease-in-out_infinite] opacity-100" : "opacity-0"
              }`}
            />
            <div
              className={`pointer-events-none absolute bottom-0 left-16 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(167,243,208,0.28),rgba(167,243,208,0))] transition-all duration-700 ${
                isSessionFocused ? "animate-[pulse_3.8s_ease-in-out_infinite] opacity-100" : "opacity-0"
              }`}
            />

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">{selectedExercise.title}</h2>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                Session length: {activeExercise.sessionDuration} seconds
              </span>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-[0.7fr_1.3fr]">
              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6">
                <div className="flex flex-col items-center justify-center gap-6 text-center">
                  <div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-emerald-100 bg-white">
                    <div
                      className={`pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.14),rgba(16,185,129,0)_68%)] transition-all ease-in-out ${orbAuraClass}`}
                      style={{ transitionDuration: `${Math.max(currentStageDuration, 1)}s` }}
                    />
                    <div
                      className={`absolute inset-0 rounded-full border border-emerald-100/80 transition-all ease-in-out ${orbRingClass}`}
                      style={{ transitionDuration: `${Math.max(currentStageDuration, 1)}s` }}
                    />
                    <div
                      className={`absolute inset-5 rounded-full border border-emerald-100 transition-all ease-in-out ${orbRingClass}`}
                      style={{ transitionDuration: `${Math.max(currentStageDuration, 1)}s` }}
                    />
                    <div
                      className={`absolute inset-10 rounded-full border border-emerald-50 transition-all ease-in-out ${orbRingClass}`}
                      style={{ transitionDuration: `${Math.max(currentStageDuration, 1)}s` }}
                    />
                    <div
                      className={`absolute h-44 w-44 rounded-full bg-emerald-100/30 blur-2xl transition-all ease-in-out ${orbShadowClass}`}
                      style={{ transitionDuration: `${Math.max(currentStageDuration, 1)}s` }}
                    />
                    <div
                      className={`relative h-32 w-32 rounded-full bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-300 shadow-[0_18px_50px_rgba(16,185,129,0.28)] transition-transform ease-in-out ${indicatorScaleClass}`}
                      style={{ transitionDuration: `${Math.max(currentStageDuration, 1)}s` }}
                    />
                  </div>

                  <div className="space-y-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        STAGE_BADGES[currentStageKey] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {stageLabel}
                    </span>
                    <h3 className="text-2xl font-semibold text-gray-800">{stageLabel}</h3>
                    <p className="max-w-md text-sm text-gray-500">{currentInstruction}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {currentStageKey ? stageLabel : "Timer"}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-gray-800">{stageTimer}s</p>
                  {exerciseRunning ? (
                    <p className="mt-2 text-xs text-gray-500">
                      Synced with the current guided breathing cue.
                    </p>
                  ) : null}
                </div>

                <div className="w-full rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Voice Guidance</p>
                  <div className="mt-3 space-y-3">
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                      <div className="border-b border-gray-100 bg-white px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Coach language</p>
                            <p className="mt-1 text-xs text-gray-500">
                              Select the voice for your guided session.
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full border border-emerald-100 bg-emerald-50" />
                        </div>
                      </div>

                      <div className="p-2">
                        {EXERCISE_COACH_LANGUAGES.map((language) => {
                          const isSelected = selectedLanguageCode === language.code;

                          return (
                            <button
                              key={language.code}
                              type="button"
                              onClick={() => setSelectedLanguageCode(language.code)}
                              disabled={exerciseRunning || coach.isStarting}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors ${
                                isSelected
                                  ? "bg-emerald-50 text-emerald-800"
                                  : "bg-transparent text-gray-700 hover:bg-white"
                              } disabled:cursor-not-allowed disabled:opacity-70`}
                            >
                              <div>
                                <p className="text-sm font-semibold">{language.label}</p>
                                <p className="mt-1 text-xs text-gray-500">{language.nativeLabel}</p>
                              </div>
                              <span
                                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                                  isSelected
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-gray-300 bg-white"
                                }`}
                              >
                                {isSelected ? (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                    <path
                                      d="M5 13L9 17L19 7"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : null}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {completionMessage ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {completionMessage}
                  </div>
                ) : null}

                {coach.error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {coach.error}
                  </div>
                ) : null}

                <div className="flex flex-wrap justify-end gap-3">
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
                    className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleStartExercise}
                    disabled={coach.isStarting}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {coach.isStarting ? "Connecting Coach..." : "Start Exercise"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleResetExercise();
                    }}
                    className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Reset
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

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { RoomAudioRenderer } from "@livekit/components-react";

import Header from "@/components/Header";
import { useBreathingExercise } from "@/hooks/useBreathingExercise";
import { useExerciseVoiceCoach } from "@/hooks/useExerciseVoiceCoach";
import { voiceLanguages } from "@/lib/voiceLanguages";

const EXERCISE_COACH_LANGUAGES = voiceLanguages.filter((language) =>
  ["en-IN", "hi-IN", "mr-IN"].includes(language.code)
);

const EXERCISES = [
  {
    id: "calm-breathing",
    title: "Calm Breathing Exercise",
    description: "A guided breathing pattern that slows the breath and supports calm.",
    imageUrl: "/images/calm-breathing-prompt-card.png",
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
  {
    id: "anulom-vilom",
    title: "Anulom Vilom",
    description: "Alternate nostril breathing to calm the mind and balance the breath.",
    imageUrl: "/images/anulom-vilom-prompt-card.png",
    imageAlt: "Illustration of a person practicing alternate nostril breathing.",
    totalDurationLabel: "60 seconds",
    rhythmLabel: "",
    config: {
      type: "breathing",
      sessionDuration: 60,
      // Repeat the alternate-nostril cycle to fill ~1 minute.
      order: [
        "RIGHT_THUMB",
        "INHALE_LEFT",
        "EXHALE_RIGHT",
        "INHALE_RIGHT",
        "EXHALE_LEFT",
        "INHALE_LEFT",
        "EXHALE_RIGHT",
        "INHALE_RIGHT",
        "EXHALE_LEFT",
        "LOOP",
      ],
      stages: {
        RIGHT_THUMB: {
          label: "Right Thumb",
          duration: 6,
          instruction: "Place your right thumb on your right nostril.",
          voicePrompt: "Place your right thumb on your right nostril.",
        },
        INHALE_LEFT: {
          label: "Inhale Left",
          duration: 5,
          instruction: "Close right nostril and inhale through left.",
          voicePrompt: "Close the right nostril and slowly inhale through the left nostril.",
        },
        EXHALE_RIGHT: {
          label: "Exhale Right",
          duration: 5,
          instruction: "Close left nostril and exhale through right.",
          voicePrompt: "Now close the left nostril. Gently exhale through the right nostril.",
        },
        INHALE_RIGHT: {
          label: "Inhale Right",
          duration: 5,
          instruction: "Inhale through right nostril.",
          voicePrompt: "Now inhale through the right nostril.",
        },
        EXHALE_LEFT: {
          label: "Exhale Left",
          duration: 5,
          instruction: "Close right nostril and exhale through left.",
          voicePrompt: "Close the right nostril and exhale through the left.",
        },
        LOOP: {
          label: "Continue",
          duration: 14,
          instruction: "Continue slowly.",
          voicePrompt: "Continue this breathing pattern slowly for the next one minute.",
        },
      },
      completionMessage: "Great job. Slowly return to normal breathing.",
    },
  },
  {
    id: "bhramari-pranayama",
    title: "Bhramari Pranayama",
    description: "Humming bee breathing to relax the mind and reduce stress.",
    imageUrl: "/images/bhramari-prompt-card.png",
    imageAlt: "Illustration of a person practicing humming bee breathing.",
    imageVariant: "cover",
    totalDurationLabel: "~50 seconds",
    rhythmLabel: "",
    config: {
      type: "breathing",
      sessionDuration: 55,
      order: [
        "LOOP",
        "INHALE",
        "HUM",
        "VIBRATION",
        "INHALE",
        "HUM",
        "VIBRATION",
        "INHALE",
        "HUM",
        "VIBRATION",
        "INHALE",
        "HUM",
        "VIBRATION",
        "INHALE",
        "HUM",
        "VIBRATION",
      ],
      stages: {
        LOOP: {
          label: "Repeat",
          duration: 4,
          instruction: "Let's repeat this together five times.",
          voicePrompt: "Let's repeat this together five times.",
        },
        INHALE: {
          label: "Inhale",
          duration: 4,
          instruction: "Take a deep breath in through your nose.",
          voicePrompt: "Take a deep breath in through your nose.",
        },
        HUM: {
          label: "Humming Exhale",
          duration: 6,
          instruction: "Exhale with a gentle humming sound. Mmmmmmmmm.",
          voicePrompt: "Now slowly exhale while making a gentle humming sound like a bee. Mmmmmmmmm.",
        },
        VIBRATION: {
          label: "Feel the vibration",
          duration: 3,
          instruction: "Feel the vibration relaxing your mind.",
          voicePrompt: "Feel the vibration relaxing your mind.",
        },
      },
      completionMessage: "Take a normal breath and notice the calmness in your body.",
    },
  },
  {
    id: "balasana",
    title: "Child’s Pose",
    description: "A relaxing posture to release tension and calm your breathing.",
    imageUrl: "/images/balasana-prompt-card.png",
    imageAlt: "Illustration of child’s pose (balasana).",
    totalDurationLabel: "60 seconds",
    rhythmLabel: "",
    config: {
      type: "breathing",
      sessionDuration: 60,
      order: [
        "KNEEL",
        "HEELS",
        "FOLD",
        "FOREHEAD",
        "BREATHE",
        "INHALE",
        "EXHALE",
        "HOLD",
      ],
      stages: {
        KNEEL: {
          label: "Kneel",
          duration: 6,
          instruction: "Kneel on the floor.",
          voicePrompt: "Kneel on the floor.",
        },
        HEELS: {
          label: "Sit back",
          duration: 6,
          instruction: "Sit back on your heels.",
          voicePrompt: "Sit back on your heels.",
        },
        FOLD: {
          label: "Fold forward",
          duration: 8,
          instruction: "Slowly bend forward and stretch your arms in front of you.",
          voicePrompt: "Slowly bend forward and stretch your arms in front of you.",
        },
        FOREHEAD: {
          label: "Rest",
          duration: 6,
          instruction: "Rest your forehead on the floor.",
          voicePrompt: "Rest your forehead on the floor.",
        },
        BREATHE: {
          label: "Slow breaths",
          duration: 6,
          instruction: "Take slow deep breaths.",
          voicePrompt: "Take slow deep breaths.",
        },
        INHALE: {
          label: "Inhale",
          duration: 4,
          instruction: "Inhale slowly.",
          voicePrompt: "Inhale slowly.",
        },
        EXHALE: {
          label: "Exhale",
          duration: 5,
          instruction: "Exhale and relax your body.",
          voicePrompt: "Exhale and relax your body.",
        },
        HOLD: {
          label: "Hold",
          duration: 19,
          instruction: "Stay in this position for about one minute.",
          voicePrompt: "Stay in this position for about one minute.",
        },
      },
      completionMessage: "Gently lift your head and return to a sitting position.",
    },
  },
  {
    id: "shavasana",
    title: "Shavasana",
    description: "A deep relaxation practice with a gentle body scan.",
    imageUrl: "/images/shavasana-prompt-card.png",
    imageAlt: "Illustration of shavasana deep relaxation.",
    totalDurationLabel: "60 seconds",
    rhythmLabel: "",
    config: {
      type: "breathing",
      sessionDuration: 60,
      order: [
        "LIE_DOWN",
        "ARMS",
        "CLOSE_EYES",
        "RELAX_FEET",
        "RELAX_LEGS",
        "RELAX_STOMACH",
        "RELAX_SHOULDERS",
        "RELAX_FACE",
        "BREATHE",
      ],
      stages: {
        LIE_DOWN: {
          label: "Lie down",
          duration: 6,
          instruction: "Lie down on your back.",
          voicePrompt: "Lie down on your back.",
        },
        ARMS: {
          label: "Arms relaxed",
          duration: 6,
          instruction: "Keep your arms relaxed beside your body.",
          voicePrompt: "Keep your arms relaxed beside your body.",
        },
        CLOSE_EYES: {
          label: "Close your eyes",
          duration: 5,
          instruction: "Close your eyes.",
          voicePrompt: "Close your eyes.",
        },
        RELAX_FEET: {
          label: "Relax feet",
          duration: 5,
          instruction: "Relax your feet.",
          voicePrompt: "Relax your feet.",
        },
        RELAX_LEGS: {
          label: "Relax legs",
          duration: 5,
          instruction: "Relax your legs.",
          voicePrompt: "Relax your legs.",
        },
        RELAX_STOMACH: {
          label: "Relax stomach",
          duration: 5,
          instruction: "Relax your stomach.",
          voicePrompt: "Relax your stomach.",
        },
        RELAX_SHOULDERS: {
          label: "Relax shoulders",
          duration: 5,
          instruction: "Relax your shoulders.",
          voicePrompt: "Relax your shoulders.",
        },
        RELAX_FACE: {
          label: "Relax face",
          duration: 5,
          instruction: "Relax your face.",
          voicePrompt: "Relax your face.",
        },
        BREATHE: {
          label: "Slow breathing",
          duration: 18,
          instruction: "Take slow and gentle breaths.",
          voicePrompt: "Take slow and gentle breaths.",
        },
      },
      completionMessage: "Slowly move your fingers and open your eyes.",
    },
  },
  {
    id: "sukhasana-meditation",
    title: "Sukhasana Meditation",
    description: "A short seated meditation to settle the body and return attention to the breath.",
    imageUrl: "/images/sukhasana-prompt-card.png",
    imageAlt: "Illustration of a person sitting in sukhasana meditation with calm breathing.",
    totalDurationLabel: "60 seconds",
    rhythmLabel: "",
    config: {
      type: "breathing",
      sessionDuration: 60,
      order: [
        "SIT_CROSS_LEGGED",
        "BACK_STRAIGHT",
        "HANDS_ON_KNEES",
        "CLOSE_EYES",
        "FOCUS_BREATH",
        "INHALE",
        "EXHALE",
        "RETURN_TO_BREATH",
        "INHALE",
        "EXHALE",
        "OPEN_EYES",
      ],
      stages: {
        SIT_CROSS_LEGGED: {
          label: "Sit comfortably",
          duration: 5,
          instruction: "Sit cross-legged comfortably.",
          voicePrompt: "Sit cross-legged comfortably.",
        },
        BACK_STRAIGHT: {
          label: "Back straight",
          duration: 5,
          instruction: "Keep your back straight.",
          voicePrompt: "Keep your back straight.",
        },
        HANDS_ON_KNEES: {
          label: "Hands on knees",
          duration: 5,
          instruction: "Rest your hands on your knees.",
          voicePrompt: "Rest your hands on your knees.",
        },
        CLOSE_EYES: {
          label: "Close your eyes",
          duration: 4,
          instruction: "Close your eyes.",
          voicePrompt: "Close your eyes.",
        },
        FOCUS_BREATH: {
          label: "Focus on breath",
          duration: 6,
          instruction: "Focus on your breathing.",
          voicePrompt: "Focus on your breathing.",
        },
        INHALE: {
          label: "Inhale",
          duration: 4,
          instruction: "Inhale slowly.",
          voicePrompt: "Inhale slowly.",
        },
        EXHALE: {
          label: "Exhale",
          duration: 4,
          instruction: "Exhale slowly.",
          voicePrompt: "Exhale slowly.",
        },
        RETURN_TO_BREATH: {
          label: "Return to breath",
          duration: 10,
          instruction: "If your thoughts wander, gently bring your attention back to your breath.",
          voicePrompt: "If your thoughts wander, gently bring your attention back to your breath.",
        },
        OPEN_EYES: {
          label: "Open your eyes",
          duration: 9,
          instruction: "Take a deep breath and slowly open your eyes.",
          voicePrompt: "Take a deep breath and slowly open your eyes.",
        },
      },
      completionMessage: "Meditation complete. Notice the calm in your body.",
    },
  },
];

const EXERCISE_GUIDE_THEMES = {
  "calm-breathing": {
    badge: "Rhythm Guide",
    shell: "from-emerald-100 via-white to-cyan-100",
    surface: "from-white via-emerald-50/70 to-cyan-50/80",
    progress: "from-emerald-400 via-teal-400 to-cyan-400",
    chipActive:
      "border-emerald-300 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.24)]",
    metricGlow: "shadow-[0_18px_45px_rgba(16,185,129,0.14)]",
    idleTitle: "Find an even breathing rhythm",
    helper: "",
    miniTip: "",
  },
  "anulom-vilom": {
    badge: "Flow Guide",
    shell: "from-sky-100 via-white to-orange-100",
    surface: "from-white via-sky-50/70 to-orange-50/80",
    progress: "from-sky-400 via-cyan-400 to-orange-300",
    chipActive:
      "border-sky-300 bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-[0_12px_30px_rgba(14,165,233,0.24)]",
    metricGlow: "shadow-[0_18px_45px_rgba(59,130,246,0.14)]",
    idleTitle: "Prepare for alternate nostril breathing",
    helper: "",
    miniTip: "",
  },
  "bhramari-pranayama": {
    badge: "Sound Guide",
    shell: "from-amber-100 via-white to-lime-100",
    surface: "from-white via-amber-50/75 to-lime-50/80",
    progress: "from-amber-400 via-yellow-400 to-lime-400",
    chipActive:
      "border-amber-300 bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-[0_12px_30px_rgba(245,158,11,0.24)]",
    metricGlow: "shadow-[0_18px_45px_rgba(245,158,11,0.14)]",
    idleTitle: "Settle into a gentle humming rhythm",
    helper: "",
    miniTip: "",
  },
  balasana: {
    badge: "Pose Guide",
    shell: "from-rose-100 via-white to-amber-100",
    surface: "from-white via-rose-50/70 to-amber-50/80",
    progress: "from-rose-400 via-orange-300 to-amber-300",
    chipActive:
      "border-rose-300 bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-[0_12px_30px_rgba(244,63,94,0.24)]",
    metricGlow: "shadow-[0_18px_45px_rgba(251,113,133,0.14)]",
    idleTitle: "Ease into a supported fold",
    helper: "",
    miniTip: "",
  },
  shavasana: {
    badge: "Body-Scan Guide",
    shell: "from-sky-100 via-white to-indigo-100",
    surface: "from-white via-slate-50/95 to-sky-50/85",
    progress: "from-sky-400 via-cyan-400 to-indigo-400",
    chipActive:
      "border-sky-300 bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-[0_12px_30px_rgba(59,130,246,0.2)]",
    metricGlow: "shadow-[0_18px_45px_rgba(96,165,250,0.14)]",
    idleTitle: "Settle into stillness",
    helper: "",
    miniTip: "",
  },
  "sukhasana-meditation": {
    badge: "Focus Guide",
    shell: "from-sky-100 via-white to-indigo-100",
    surface: "from-white via-sky-50/80 to-indigo-50/80",
    progress: "from-sky-400 via-indigo-400 to-violet-400",
    chipActive:
      "border-sky-300 bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-[0_12px_30px_rgba(99,102,241,0.2)]",
    metricGlow: "shadow-[0_18px_45px_rgba(96,165,250,0.14)]",
    idleTitle: "Settle into quiet focus",
    helper: "",
    miniTip: "",
  },
};

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function uniqueStageKeys(exercise) {
  const seen = new Set();
  return exercise.config.order.filter((stageKey) => {
    if (seen.has(stageKey)) {
      return false;
    }

    seen.add(stageKey);
    return true;
  });
}

function stageMatches(currentStageKey, keys) {
  if (!currentStageKey) {
    return false;
  }

  return Array.isArray(keys) ? keys.includes(currentStageKey) : currentStageKey === keys;
}

function GuideMetric({ label, value, note, glowClass = "" }) {
  return (
    <div
      className={`rounded-2xl border border-white/70 bg-white/85 px-4 py-3 backdrop-blur-sm ${glowClass}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-gray-900">{value}</p>
      {note ? <p className="mt-1 text-xs text-gray-500">{note}</p> : null}
    </div>
  );
}

function FlowChip({ label, active, activeClass }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
        active ? activeClass : "border-white/70 bg-white/75 text-gray-600"
      }`}
    >
      {label}
    </span>
  );
}

function CalmBreathingVisual({ currentStageKey, exerciseRunning, stageProgress }) {
  const steps = [
    { key: "INHALE", label: "Inhale" },
    { key: "HOLD", label: "Hold" },
    { key: "EXHALE", label: "Exhale" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {steps.map((step, index) => {
        const active = currentStageKey === step.key;
        const fillHeight = active ? 58 + stageProgress * 0.28 : exerciseRunning ? 34 : 44;

        return (
          <div
            key={step.key}
            className={`rounded-[26px] border p-4 transition-all duration-500 ${
              active
                ? "border-emerald-200 bg-white shadow-[0_18px_35px_rgba(16,185,129,0.16)]"
                : "border-white/70 bg-white/65"
            }`}
          >
            <div className="flex h-28 items-end">
              <div
                className={`w-full rounded-[20px] bg-gradient-to-t transition-all duration-500 ${
                  active ? "from-emerald-500 via-teal-400 to-cyan-300" : "from-emerald-200 to-cyan-100"
                }`}
                style={{ height: `${fillHeight}%` }}
              />
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
              0{index + 1}
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-800">{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function AnulomVilomVisual({ currentStageKey }) {
  const leftActive = stageMatches(currentStageKey, ["INHALE_LEFT", "EXHALE_LEFT"]);
  const rightActive = stageMatches(currentStageKey, ["RIGHT_THUMB", "INHALE_RIGHT", "EXHALE_RIGHT"]);
  const leftLabel =
    currentStageKey === "INHALE_LEFT" ? "Inhale" : currentStageKey === "EXHALE_LEFT" ? "Exhale" : "Soft";
  const rightLabel =
    currentStageKey === "INHALE_RIGHT"
      ? "Inhale"
      : currentStageKey === "EXHALE_RIGHT"
        ? "Exhale"
        : currentStageKey === "RIGHT_THUMB"
          ? "Close"
          : "Soft";

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div
          className={`rounded-[28px] border p-4 transition-all duration-500 ${
            leftActive ? "border-sky-200 bg-white shadow-[0_18px_35px_rgba(14,165,233,0.14)]" : "border-white/70 bg-white/65"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Left nostril</p>
          <div className="mt-4 h-3 rounded-full bg-sky-100">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 transition-all duration-500 ${
                leftActive ? "w-full" : "w-1/2"
              }`}
            />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-800">{leftLabel}</p>
        </div>

        <div className="flex h-28 w-20 items-center justify-center rounded-[28px] border border-white/70 bg-white/80">
          <div className="relative h-20 w-10">
            <div className="absolute left-1/2 top-0 h-20 w-[2px] -translate-x-1/2 rounded-full bg-slate-300" />
            <div className="absolute left-[7px] top-6 h-8 w-[3px] rounded-full bg-slate-300" />
            <div className="absolute right-[7px] top-6 h-8 w-[3px] rounded-full bg-slate-300" />
            <div className="absolute left-1/2 top-9 h-3 w-3 -translate-x-1/2 rounded-full bg-slate-200" />
          </div>
        </div>

        <div
          className={`rounded-[28px] border p-4 transition-all duration-500 ${
            rightActive ? "border-orange-200 bg-white shadow-[0_18px_35px_rgba(251,146,60,0.14)]" : "border-white/70 bg-white/65"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Right nostril</p>
          <div className="mt-4 h-3 rounded-full bg-orange-100">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-orange-300 to-amber-400 transition-all duration-500 ${
                rightActive ? "w-full" : "w-1/2"
              }`}
            />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-800">{rightLabel}</p>
        </div>
    </div>
  );
}

function BhramariVisual({ currentStageKey, stageProgress }) {
  const humming = stageMatches(currentStageKey, ["HUM", "VIBRATION"]);
  const bars = [36, 54, 78, 54, 36];

  return (
    <div className="rounded-[30px] border border-white/70 bg-white/70 p-5">
        <div className="flex h-36 items-end justify-center gap-3">
          {bars.map((height, index) => (
            <div
              key={index}
              className={`w-7 rounded-t-[18px] transition-all duration-500 ${
                humming ? "bg-gradient-to-t from-amber-500 via-yellow-400 to-lime-300" : "bg-gradient-to-t from-amber-200 to-yellow-100"
              }`}
              style={{ height: `${humming ? height + stageProgress * 0.18 : height * 0.72}%` }}
            />
          ))}
        </div>
    </div>
  );
}

function BalasanaVisual({ currentStageKey }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/70 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-5">
      <div className="absolute inset-x-8 bottom-6 h-4 rounded-full bg-violet-200/80" />
      <div className="relative h-40">
        <div className="absolute bottom-10 left-[35%] h-12 w-44 rounded-[40px] bg-orange-200 shadow-[0_18px_40px_rgba(251,146,60,0.18)]" />
        <div className="absolute bottom-[72px] left-[48%] h-10 w-12 rounded-full bg-amber-100 shadow-sm" />
        <div className="absolute bottom-[58px] left-[44%] h-8 w-24 rounded-[24px] bg-orange-300/80" />
        <div className="absolute bottom-[36px] left-[28%] h-6 w-28 rounded-full bg-orange-100/90" />
      </div>
    </div>
  );
}

function ShavasanaVisual({ currentStageKey }) {
  const focusIndex = (() => {
    if (currentStageKey === "RELAX_FEET") return 0;
    if (currentStageKey === "RELAX_LEGS") return 1;
    if (currentStageKey === "RELAX_STOMACH") return 2;
    if (currentStageKey === "RELAX_SHOULDERS" || currentStageKey === "ARMS") return 3;
    if (currentStageKey === "RELAX_FACE" || currentStageKey === "CLOSE_EYES") return 4;
    return 2;
  })();
  const zones = ["Feet", "Legs", "Core", "Shoulders", "Face"];

  return (
    <div className="rounded-[30px] border border-white/70 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-5">
      <div className="rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-slate-100 via-white to-sky-50 px-5 py-6">
        <div className="flex items-center justify-center gap-3 pt-2">
          <div className="h-11 w-11 rounded-full bg-slate-200" />
          <div className="h-7 w-40 rounded-full bg-slate-300/95" />
          <div className="h-6 w-24 rounded-full bg-slate-300/75" />
        </div>
        <div className="mt-6 grid grid-cols-5 gap-2">
          {zones.map((zone, index) => {
            const active = focusIndex === index;

            return (
              <div
                key={zone}
                className={`rounded-2xl border px-2 py-3 text-center transition-all duration-300 ${
                  active
                    ? "border-sky-300 bg-sky-100 text-sky-900 shadow-[0_18px_35px_rgba(125,211,252,0.2)]"
                    : "border-slate-200 bg-white/90 text-slate-500"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{zone}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SukhasanaVisual({ currentStageKey }) {
  const inhaleActive = currentStageKey === "INHALE";
  const exhaleActive = currentStageKey === "EXHALE";
  const focusActive = stageMatches(currentStageKey, ["FOCUS_BREATH", "RETURN_TO_BREATH"]);
  const setupActive = stageMatches(currentStageKey, ["SIT_CROSS_LEGGED", "BACK_STRAIGHT", "HANDS_ON_KNEES"]);
  const openEyesActive = currentStageKey === "OPEN_EYES";

  return (
    <div className="rounded-[30px] border border-white/70 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-5">
      <div className="relative h-44 overflow-hidden rounded-[26px] border border-white/80 bg-gradient-to-br from-white/95 via-sky-50/85 to-indigo-100/75">
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-sky-100/80 to-transparent" />
        <div className="absolute left-1/2 top-6 h-28 w-28 -translate-x-1/2 rounded-full bg-sky-200/40 blur-2xl" />
        <div
          className={`absolute left-1/2 top-6 h-28 w-28 -translate-x-1/2 rounded-full border transition-all duration-500 ${
            inhaleActive
              ? "scale-[1.18] border-sky-300/80 bg-sky-200/25"
              : exhaleActive
                ? "scale-[0.92] border-indigo-300/70 bg-indigo-200/20"
                : focusActive
                  ? "scale-[1.06] border-violet-300/70 bg-violet-200/20"
                  : "scale-100 border-sky-200/60 bg-white/30"
          }`}
        />
        <div
          className={`absolute left-1/2 top-10 h-20 w-20 -translate-x-1/2 rounded-full border transition-all duration-500 ${
            openEyesActive ? "border-amber-300/80 bg-amber-100/40" : "border-white/80 bg-white/40"
          }`}
        />

        <div className="absolute left-1/2 top-[22px] h-12 w-12 -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 shadow-[0_12px_24px_rgba(251,191,36,0.16)]" />
        <div
          className={`absolute left-[calc(50%-7px)] top-[38px] h-[2px] w-[14px] rounded-full transition-all duration-300 ${
            openEyesActive ? "bg-slate-400/90" : "bg-slate-300/70"
          }`}
        />
        <div className="absolute left-1/2 top-[74px] h-16 w-24 -translate-x-1/2 rounded-[28px] bg-gradient-to-b from-violet-300/85 to-indigo-300/80 shadow-[0_18px_30px_rgba(129,140,248,0.18)]" />
        <div className="absolute left-[calc(50%-44px)] top-[84px] h-[2px] w-16 rotate-[18deg] rounded-full bg-indigo-200" />
        <div className="absolute right-[calc(50%-44px)] top-[84px] h-[2px] w-16 rotate-[-18deg] rounded-full bg-indigo-200" />
        <div
          className={`absolute left-1/2 top-[62px] h-20 w-[3px] -translate-x-1/2 rounded-full transition-all duration-300 ${
            setupActive ? "bg-indigo-400" : "bg-indigo-300"
          }`}
        />
        <div className="absolute left-1/2 bottom-7 h-16 w-44 -translate-x-1/2 rounded-[999px] bg-gradient-to-r from-sky-200/90 via-indigo-200/90 to-sky-200/90 shadow-[0_18px_35px_rgba(125,211,252,0.18)]" />
        <div className="absolute left-[calc(50%-58px)] bottom-[58px] h-12 w-[3px] rotate-[28deg] rounded-full bg-sky-300" />
        <div className="absolute right-[calc(50%-58px)] bottom-[58px] h-12 w-[3px] rotate-[-28deg] rounded-full bg-sky-300" />
        <div className="absolute left-[calc(50%-26px)] bottom-[56px] h-[3px] w-16 rotate-[18deg] rounded-full bg-indigo-300" />
        <div className="absolute right-[calc(50%-26px)] bottom-[56px] h-[3px] w-16 rotate-[-18deg] rounded-full bg-indigo-300" />

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {["setup", "focus", "release"].map((key) => {
            const active =
              (key === "setup" && setupActive) ||
              (key === "focus" && focusActive) ||
              (key === "release" && (inhaleActive || exhaleActive || openEyesActive));

            return (
              <span
                key={key}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  active ? "w-8 bg-gradient-to-r from-sky-400 to-indigo-400" : "w-2.5 bg-white/80"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ExerciseGuideVisual({ exerciseId, currentStageKey, exerciseRunning, stageProgress }) {
  switch (exerciseId) {
    case "calm-breathing":
      return (
        <CalmBreathingVisual
          currentStageKey={currentStageKey}
          exerciseRunning={exerciseRunning}
          stageProgress={stageProgress}
        />
      );
    case "anulom-vilom":
      return <AnulomVilomVisual currentStageKey={currentStageKey} />;
    case "bhramari-pranayama":
      return <BhramariVisual currentStageKey={currentStageKey} stageProgress={stageProgress} />;
    case "balasana":
      return <BalasanaVisual currentStageKey={currentStageKey} />;
    case "shavasana":
      return <ShavasanaVisual currentStageKey={currentStageKey} />;
    case "sukhasana-meditation":
      return <SukhasanaVisual currentStageKey={currentStageKey} />;
    default:
      return (
        <CalmBreathingVisual
          currentStageKey={currentStageKey}
          exerciseRunning={exerciseRunning}
          stageProgress={stageProgress}
        />
      );
  }
}

function ExerciseGuidePanel({
  exercise,
  exerciseRunning,
  currentStageKey,
  currentStageDuration,
  stageTimer,
  sessionTimer,
  stageLabel,
  currentInstruction,
}) {
  const theme = EXERCISE_GUIDE_THEMES[exercise.id] || EXERCISE_GUIDE_THEMES["calm-breathing"];
  const flowStages = uniqueStageKeys(exercise).slice(0, 6);
  const stageProgress = exerciseRunning
    ? clampPercent(((Math.max(currentStageDuration, 0) - Math.max(stageTimer, 0)) / Math.max(currentStageDuration, 1)) * 100)
    : 0;
  const sessionProgress = exerciseRunning
    ? clampPercent(
        ((exercise.config.sessionDuration - Math.max(sessionTimer, 0)) / Math.max(exercise.config.sessionDuration, 1)) * 100
      )
    : 0;
  const isCalmBreathing = exercise.id === "calm-breathing";
  const isAnulomVilom = exercise.id === "anulom-vilom";
  const isBhramari = exercise.id === "bhramari-pranayama";
  const isBalasana = exercise.id === "balasana";
  const isShavasana = exercise.id === "shavasana";
  const isSukhasana = exercise.id === "sukhasana-meditation";
  const headline = exerciseRunning ? stageLabel : theme.idleTitle;
  const minimalCopy =
    isCalmBreathing ||
    isAnulomVilom ||
    isBhramari ||
    isBalasana ||
    isShavasana ||
    isSukhasana;
  const subcopy = exerciseRunning ? (isCalmBreathing ? "" : currentInstruction) : minimalCopy ? "" : theme.helper;
  const sessionNote = minimalCopy ? "" : exercise.rhythmLabel;
  const stageNote = exerciseRunning ? "Time left for this cue." : minimalCopy ? "" : "Press start to begin guidance.";
  const focusLabel = isCalmBreathing ? "Mode" : "Focus";
  const focusValue = isCalmBreathing
    ? "Guided breath"
    : isAnulomVilom
      ? "Nasal breath"
      : isBhramari
        ? "Humming breath"
        : isBalasana
          ? "Rest posture"
          : isShavasana
            ? "Body scan"
            : isSukhasana
              ? "Breath awareness"
              : exercise.rhythmLabel;
  const focusNote = minimalCopy ? "" : theme.miniTip;

  return (
    <div
      className={`relative overflow-hidden rounded-[32px] border border-white/70 bg-gradient-to-br ${theme.shell} p-[1px]`}
    >
      <div className={`relative overflow-hidden rounded-[31px] bg-gradient-to-br ${theme.surface} p-5`}>
        <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/45 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-0 h-32 w-32 rounded-full bg-white/35 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="max-w-[75%]">
            <span className="inline-flex rounded-full border border-white/70 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              {theme.badge}
            </span>
            <h3 className="mt-4 text-[28px] font-semibold leading-tight text-gray-900">{headline}</h3>
            {subcopy ? <p className="mt-2 text-sm leading-6 text-gray-600">{subcopy}</p> : null}
          </div>

          <GuideMetric
            label="Session"
            value={`${exerciseRunning ? Math.max(sessionTimer, 0) : exercise.config.sessionDuration}s`}
            note={sessionNote}
            glowClass={theme.metricGlow}
          />
        </div>

        <div className="relative mt-6">
          <ExerciseGuideVisual
            exerciseId={exercise.id}
            currentStageKey={currentStageKey}
            exerciseRunning={exerciseRunning}
            stageProgress={stageProgress}
          />
        </div>

        <div className="relative mt-6 space-y-4">
          {isAnulomVilom || isBhramari || isBalasana || isShavasana || isSukhasana ? null : (
            <div className="grid grid-cols-2 gap-3">
              <GuideMetric
                label="Stage"
                value={exerciseRunning ? `${Math.max(stageTimer, 0)}s` : "Ready"}
                note={stageNote}
                glowClass={theme.metricGlow}
              />
              <GuideMetric label={focusLabel} value={focusValue} note={focusNote} glowClass={theme.metricGlow} />
            </div>
          )}

          <div className="rounded-[24px] border border-white/70 bg-white/70 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              <span>Session progress</span>
              <span>{Math.round(sessionProgress)}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/80">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${theme.progress} transition-all duration-500`}
                style={{ width: `${sessionProgress}%` }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {flowStages.map((stageKey) => (
                <FlowChip
                  key={stageKey}
                  label={exercise.config.stages[stageKey].label}
                  active={currentStageKey === stageKey}
                  activeClass={theme.chipActive}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseArtwork({
  exercise,
  aspectClass = "aspect-[16/8.8]",
  className = "",
  hover = false,
  priority = false,
}) {
  const imageVariant = exercise.imageVariant || "cover";
  const objectPosition = exercise.imageObjectPosition || "object-center";
  const hoverClass = hover ? "transition-transform duration-500 group-hover:scale-[1.04]" : "";

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${aspectClass} ${className}`}>
      {imageVariant === "contain-blur" ? (
        <>
          <Image
            src={exercise.imageUrl}
            alt=""
            fill
            sizes="100vw"
            className={`scale-110 object-cover opacity-85 blur-xl ${objectPosition}`}
            aria-hidden="true"
            priority={priority}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-white/10" />
          <div className="absolute inset-0 p-4">
            <div className="relative h-full w-full">
              <Image
                src={exercise.imageUrl}
                alt={exercise.imageAlt}
                fill
                sizes="100vw"
                priority={priority}
                className={`object-contain ${hoverClass}`}
              />
            </div>
          </div>
        </>
      ) : (
        <Image
          src={exercise.imageUrl}
          alt={exercise.imageAlt}
          fill
          sizes="100vw"
          priority={priority}
          className={`object-cover ${objectPosition} ${hoverClass}`}
        />
      )}
    </div>
  );
}

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
  const startRequestInFlightRef = useRef(false);

  const selectedExercise =
    EXERCISES.find((exercise) => exercise.id === selectedExerciseId) || EXERCISES[0];

  const currentInstruction = statusMessage;
  const stageLabel = currentStage ? currentStageLabel : "Ready";

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
    if (startRequestInFlightRef.current || exerciseRunning) {
      return;
    }

    startRequestInFlightRef.current = true;
    lastHandledEventRef.current = null;
    try {
      const connected = coach.isConnected ? true : await coach.startSession();

      if (!connected) {
        return;
      }

      const requestId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${selectedExercise.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const published = await coach.publishExerciseEvent({
        type: "exercise_started",
        request_id: requestId,
        exercise_id: selectedExercise.id,
        language_code: selectedLanguageCode,
        session_duration: selectedExercise.config.sessionDuration,
        stages: selectedExercise.config.order.map((stageKey) => ({
          key: stageKey,
          duration: selectedExercise.config.stages[stageKey].duration,
        })),
      });

      if (!published) {
        return;
      }

      startExercise(selectedExercise.config);
    } finally {
      startRequestInFlightRef.current = false;
    }
  };

  const startDisabled = coach.isStarting || exerciseRunning;

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
                      <div className="pointer-events-none absolute -left-6 top-8 z-10 h-24 w-24 rounded-full bg-emerald-200/35 blur-2xl" />
                      <div className="pointer-events-none absolute -right-6 bottom-6 z-10 h-24 w-24 rounded-full bg-sky-200/30 blur-2xl" />
                      <ExerciseArtwork
                        exercise={exercise}
                        hover
                      />

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
              <div className="h-full">
                <ExerciseGuidePanel
                  exercise={selectedExercise}
                  exerciseRunning={exerciseRunning}
                  currentStageKey={currentStageKey}
                  currentStageDuration={currentStageDuration}
                  stageTimer={stageTimer}
                  sessionTimer={sessionTimer}
                  stageLabel={stageLabel}
                  currentInstruction={currentInstruction}
                />
              </div>

              <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {currentStageKey ? stageLabel : "Timer"}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-gray-800">{stageTimer}s</p>
                  {exerciseRunning && selectedExercise.id !== "calm-breathing" ? (
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
                    disabled={startDisabled}
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

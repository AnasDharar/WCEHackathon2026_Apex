import { useEffect, useRef, useState } from "react";

const DEFAULT_EXERCISE = {
  type: "breathing",
  sessionDuration: 60,
  order: ["INHALE", "HOLD", "EXHALE"],
  stages: {
    INHALE: {
      label: "Breathe In",
      duration: 4,
      instruction: "Breathe in slowly.",
      voicePrompt: "Breathe in slowly.",
    },
    HOLD: {
      label: "Hold",
      duration: 4,
      instruction: "Hold your breath.",
      voicePrompt: "Hold your breath.",
    },
    EXHALE: {
      label: "Breathe Out",
      duration: 4,
      instruction: "Breathe out slowly.",
      voicePrompt: "Breathe out slowly.",
    },
  },
  completionMessage: "Exercise Complete. Great job!",
};

function normalizeExercise(exerciseConfig) {
  return {
    type: exerciseConfig?.type || DEFAULT_EXERCISE.type,
    sessionDuration: exerciseConfig?.sessionDuration || DEFAULT_EXERCISE.sessionDuration,
    order: exerciseConfig?.order || DEFAULT_EXERCISE.order,
    stages: exerciseConfig?.stages || DEFAULT_EXERCISE.stages,
    completionMessage:
      exerciseConfig?.completionMessage || DEFAULT_EXERCISE.completionMessage,
  };
}

export function useBreathingExercise() {
  const [exerciseRunning, setExerciseRunning] = useState(false);
  const [currentStageKey, setCurrentStageKey] = useState(null);
  const [currentStageDuration, setCurrentStageDuration] = useState(0);
  const [stageTimer, setStageTimer] = useState(0);
  const [sessionTimer, setSessionTimer] = useState(DEFAULT_EXERCISE.sessionDuration);
  const [completionMessage, setCompletionMessage] = useState("");
  const [activeExercise, setActiveExercise] = useState(DEFAULT_EXERCISE);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentStageLabel, setCurrentStageLabel] = useState("Ready");

  const intervalRef = useRef(null);

  const clearExerciseLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetSessionState = (exercise = activeExercise) => {
    clearExerciseLoop();
    setExerciseRunning(false);
    setCurrentStageKey(null);
    setCurrentStageDuration(0);
    setStageTimer(0);
    setSessionTimer(exercise.sessionDuration);
    setCurrentStageLabel("Ready");
  };

  const startExercise = (exerciseConfig = activeExercise) => {
    const normalizedExercise = normalizeExercise(exerciseConfig);
    clearExerciseLoop();
    setActiveExercise(normalizedExercise);
    setExerciseRunning(false);
    setCurrentStageKey(null);
    setCurrentStageDuration(0);
    setStageTimer(0);
    setSessionTimer(normalizedExercise.sessionDuration);
    setCurrentStageLabel("Ready");
    setCompletionMessage("");
    setStatusMessage("Connecting you to the coach.");
  };

  const startStage = ({
    stageKey,
    sessionTimeRemaining,
    instruction,
    duration,
    label,
  }) => {
    if (!stageKey || !activeExercise.stages[stageKey]) {
      return;
    }

    clearExerciseLoop();

    const stageDuration = duration || activeExercise.stages[stageKey].duration;
    let nextStageTimer = stageDuration;
    let nextSessionTimer =
      typeof sessionTimeRemaining === "number"
        ? sessionTimeRemaining
        : activeExercise.sessionDuration;

    setExerciseRunning(true);
    setCurrentStageKey(stageKey);
    setCurrentStageDuration(stageDuration);
    setStageTimer(stageDuration);
    setSessionTimer(nextSessionTimer);
    setCurrentStageLabel(label || activeExercise.stages[stageKey].label);
    setCompletionMessage("");
    setStatusMessage(instruction || activeExercise.stages[stageKey].instruction);

    intervalRef.current = setInterval(() => {
      nextStageTimer = Math.max(0, nextStageTimer - 1);
      nextSessionTimer = Math.max(0, nextSessionTimer - 1);
      setStageTimer(nextStageTimer);
      setSessionTimer(nextSessionTimer);

      if (nextStageTimer <= 0 || nextSessionTimer <= 0) {
        clearExerciseLoop();
      }
    }, 1000);
  };

  const completeExercise = (message) => {
    clearExerciseLoop();
    setExerciseRunning(false);
    setCurrentStageKey(null);
    setCurrentStageDuration(0);
    setStageTimer(0);
    setSessionTimer(0);
    setCurrentStageLabel("Complete");
    setCompletionMessage(message || activeExercise.completionMessage);
    setStatusMessage(message || activeExercise.completionMessage);
  };

  const setExerciseConfig = (exerciseConfig) => {
    const normalizedExercise = normalizeExercise(exerciseConfig);
    setActiveExercise(normalizedExercise);
    setCompletionMessage("");
    setStatusMessage("");
    resetSessionState(normalizedExercise);
  };

  const resetExercise = () => {
    setCompletionMessage("");
    setStatusMessage("");
    resetSessionState(activeExercise);
  };

  useEffect(
    () => () => {
      clearExerciseLoop();
    },
    []
  );

  const currentStage = currentStageKey ? activeExercise.stages[currentStageKey] : null;

  return {
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
    voiceGuidanceSupported: true,
  };
}

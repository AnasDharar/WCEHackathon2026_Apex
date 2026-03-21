"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";

const ANALYZE_INTERVAL_MS = 6000;
const MIN_CAPTURE_WIDTH = 480;
const MIN_CAPTURE_HEIGHT = 360;
const MAX_CAPTURE_EDGE = 720;

function stopMediaStream(stream) {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

function clampConfidence(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, value));
}

function getCaptureSize(video) {
  const sourceWidth = video?.videoWidth || MIN_CAPTURE_WIDTH;
  const sourceHeight = video?.videoHeight || MIN_CAPTURE_HEIGHT;
  const largestEdge = Math.max(sourceWidth, sourceHeight, 1);
  const scale = Math.min(1, MAX_CAPTURE_EDGE / largestEdge);
  const width = Math.max(MIN_CAPTURE_WIDTH, Math.round(sourceWidth * scale));
  const height = Math.max(MIN_CAPTURE_HEIGHT, Math.round(sourceHeight * scale));

  return {
    width,
    height,
  };
}

export function useEmotionCamera(active) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const analyzingRef = useRef(false);
  const analyzeNowRef = useRef(null);
  const requestAbortRef = useRef(null);
  const disposedRef = useRef(false);
  const analysisWaitersRef = useRef([]);
  const [faces, setFaces] = useState([]);
  const [frameSize, setFrameSize] = useState(null);
  const [dominantEmotion, setDominantEmotion] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisAt, setLastAnalysisAt] = useState(null);
  const [error, setError] = useState("");
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    disposedRef.current = false;

    return () => {
      disposedRef.current = true;
      analysisWaitersRef.current.forEach((resolve) => resolve(false));
      analysisWaitersRef.current = [];
    };
  }, []);

  const resolveAnalysisWaiters = (result) => {
    if (!analysisWaitersRef.current.length) {
      return;
    }

    const waiters = analysisWaitersRef.current;
    analysisWaitersRef.current = [];
    waiters.forEach((resolve) => resolve(result));
  };

  useEffect(() => {
    if (active) {
      return;
    }

    setIsCameraEnabled(false);
  }, [active]);

  useEffect(() => {
    if (!active || !isCameraEnabled) {
      return undefined;
    }

    let cancelled = false;

    const stopCurrentSession = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
        requestAbortRef.current = null;
      }

      analyzingRef.current = false;
      stopMediaStream(streamRef.current);
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const analyzeFrame = async () => {
      if (cancelled || disposedRef.current || analyzingRef.current) {
        return;
      }

      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) {
        return;
      }

      analyzingRef.current = true;
      setIsAnalyzing(true);
      setError("");

      const { width, height } = getCaptureSize(video);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        analyzingRef.current = false;
        setIsAnalyzing(false);
        setError("Unable to prepare the emotion preview.");
        return;
      }

      context.drawImage(video, 0, 0, width, height);
      const imageBase64 = canvas.toDataURL("image/jpeg", 0.72).split(",")[1];

      const controller = new AbortController();
      requestAbortRef.current = controller;

      try {
        const payload = await api.post(
          "/emotion/analyze",
          {
            imageBase64,
          },
          {
            signal: controller.signal,
          },
        );

        if (cancelled || disposedRef.current) {
          return;
        }

        setFaces(Array.isArray(payload?.faces) ? payload.faces : []);
        setFrameSize(
          Number.isFinite(payload?.frameWidth) && Number.isFinite(payload?.frameHeight)
            ? {
                width: payload.frameWidth,
                height: payload.frameHeight,
              }
            : {
                width,
                height,
              },
        );
        setDominantEmotion(payload?.dominantEmotion || "");
        setConfidence(clampConfidence(payload?.confidence));
        setLastAnalysisAt(Date.now());
        resolveAnalysisWaiters(true);
      } catch (caughtError) {
        if (controller.signal.aborted || cancelled || disposedRef.current) {
          return;
        }

        setFaces([]);
        setFrameSize(null);
        setDominantEmotion("");
        setConfidence(null);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to analyze the camera frame.",
        );
        resolveAnalysisWaiters(false);
      } finally {
        requestAbortRef.current = null;
        analyzingRef.current = false;

        if (!cancelled && !disposedRef.current) {
          setIsAnalyzing(false);
        }
      }
    };
    analyzeNowRef.current = analyzeFrame;

    const startCamera = async () => {
      stopCurrentSession();
      setFaces([]);
      setFrameSize(null);
      setDominantEmotion("");
      setConfidence(null);
      setIsCameraReady(false);
      setIsAnalyzing(false);
      setLastAnalysisAt(null);
      setError("");

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        setError("Camera preview is not supported in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });

        if (cancelled || disposedRef.current) {
          stopMediaStream(stream);
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) {
          stopMediaStream(stream);
          return;
        }

        video.srcObject = stream;

        await new Promise((resolve) => {
          if (video.readyState >= 1) {
            resolve();
            return;
          }

          const handleLoadedMetadata = () => {
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            resolve();
          };

          video.addEventListener("loadedmetadata", handleLoadedMetadata);
        });

        await video.play().catch(() => undefined);

        if (cancelled || disposedRef.current) {
          return;
        }

        setIsCameraReady(true);

        await analyzeFrame();

        intervalRef.current = window.setInterval(() => {
          void analyzeFrame();
        }, ANALYZE_INTERVAL_MS);
      } catch (caughtError) {
        if (cancelled || disposedRef.current) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to access the camera preview.",
        );
        resolveAnalysisWaiters(false);
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      analyzeNowRef.current = null;
      stopCurrentSession();
    };
  }, [active, isCameraEnabled, retryTick]);

  const retry = () => {
    setIsCameraEnabled(true);
    setRetryTick((current) => current + 1);
  };

  const startCamera = () => {
    setIsCameraEnabled(true);
  };

  const stopCamera = () => {
    setIsCameraEnabled(false);
    setFaces([]);
    setFrameSize(null);
    setDominantEmotion("");
    setConfidence(null);
    setIsCameraReady(false);
    setIsAnalyzing(false);
    setLastAnalysisAt(null);
    setError("");
    resolveAnalysisWaiters(false);
  };

  const waitForAnalysis = (timeoutMs = 7000) => {
    if (lastAnalysisAt) {
      return Promise.resolve(true);
    }

    if (error) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      let settled = false;

      const finish = (result) => {
        if (settled) {
          return;
        }

        settled = true;
        window.clearTimeout(timeoutId);
        analysisWaitersRef.current = analysisWaitersRef.current.filter(
          (candidate) => candidate !== finish,
        );
        resolve(result);
      };

      const timeoutId = window.setTimeout(() => {
        finish(false);
      }, timeoutMs);

      analysisWaitersRef.current.push(finish);
    });
  };

  const analyzeNow = () => {
    if (typeof analyzeNowRef.current === "function") {
      void analyzeNowRef.current();
    }
  };

  return {
    videoRef,
    faces,
    frameSize,
    dominantEmotion,
    confidence,
    isCameraEnabled,
    isCameraReady,
    isAnalyzing,
    lastAnalysisAt,
    error,
    startCamera,
    stopCamera,
    analyzeNow,
    retry,
    waitForAnalysis,
  };
}

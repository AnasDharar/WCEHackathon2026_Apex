"use client";

import { useEffect, useRef, useState } from "react";

function formatEmotionLabel(value) {
  if (!value) {
    return "No face detected";
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapFaceToViewport(face, frameSize, viewportSize) {
  if (
    !face ||
    !frameSize?.width ||
    !frameSize?.height ||
    !viewportSize?.width ||
    !viewportSize?.height
  ) {
    return null;
  }

  const scale = Math.max(
    viewportSize.width / frameSize.width,
    viewportSize.height / frameSize.height,
  );
  const renderedWidth = frameSize.width * scale;
  const renderedHeight = frameSize.height * scale;
  const offsetX = (viewportSize.width - renderedWidth) / 2;
  const offsetY = (viewportSize.height - renderedHeight) / 2;
  const width = face.w * scale;
  const height = face.h * scale;

  return {
    left: offsetX + face.x * scale,
    top: offsetY + face.y * scale,
    width,
    height,
    cornerSize: Math.max(14, Math.min(28, Math.round(Math.min(width, height) * 0.22))),
  };
}

export default function EmotionCameraPanel({ camera }) {
  const {
    videoRef,
    faces,
    frameSize,
    dominantEmotion,
    confidence,
    isCameraEnabled,
    isCameraReady,
    isAnalyzing,
    error,
    startCamera,
    stopCamera,
    analyzeNow,
    retry,
  } = camera;

  const previewRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const primaryFace = faces[0] || null;
  const mappedFace = mapFaceToViewport(primaryFace, frameSize, viewportSize);

  useEffect(() => {
    const previewElement = previewRef.current;
    if (!previewElement) {
      return undefined;
    }

    const updateViewportSize = () => {
      const nextWidth = previewElement.clientWidth;
      const nextHeight = previewElement.clientHeight;

      setViewportSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) {
          return current;
        }

        return {
          width: nextWidth,
          height: nextHeight,
        };
      });
    };

    updateViewportSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateViewportSize);

      return () => {
        window.removeEventListener("resize", updateViewportSize);
      };
    }

    const observer = new ResizeObserver(() => {
      updateViewportSize();
    });
    observer.observe(previewElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3.5 shadow-[0_16px_34px_rgba(15,23,42,0.06)] sm:p-4">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950 p-2">
        <div
          ref={previewRef}
          className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.15rem] bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_rgba(15,23,42,0.92)_58%)]"
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover object-center"
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/55 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/65 to-transparent" />

          {mappedFace ? (
            <div
              className="pointer-events-none absolute"
              style={{
                left: `${mappedFace.left}px`,
                top: `${mappedFace.top}px`,
                width: `${mappedFace.width}px`,
                height: `${mappedFace.height}px`,
              }}
            >
              <div
                className="absolute left-0 top-0 border-l-2 border-t-2 border-emerald-300/95 shadow-[0_0_18px_rgba(52,211,153,0.45)]"
                style={{
                  width: `${mappedFace.cornerSize}px`,
                  height: `${mappedFace.cornerSize}px`,
                  borderTopLeftRadius: "1rem",
                }}
              />
              <div
                className="absolute right-0 top-0 border-r-2 border-t-2 border-emerald-300/95 shadow-[0_0_18px_rgba(52,211,153,0.45)]"
                style={{
                  width: `${mappedFace.cornerSize}px`,
                  height: `${mappedFace.cornerSize}px`,
                  borderTopRightRadius: "1rem",
                }}
              />
              <div
                className="absolute bottom-0 left-0 border-b-2 border-l-2 border-emerald-300/95 shadow-[0_0_18px_rgba(52,211,153,0.45)]"
                style={{
                  width: `${mappedFace.cornerSize}px`,
                  height: `${mappedFace.cornerSize}px`,
                  borderBottomLeftRadius: "1rem",
                }}
              />
              <div
                className="absolute bottom-0 right-0 border-b-2 border-r-2 border-emerald-300/95 shadow-[0_0_18px_rgba(52,211,153,0.45)]"
                style={{
                  width: `${mappedFace.cornerSize}px`,
                  height: `${mappedFace.cornerSize}px`,
                  borderBottomRightRadius: "1rem",
                }}
              />
            </div>
          ) : null}

          {!isCameraEnabled && !error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/72 px-5 text-center text-sm font-medium text-white">
              Start camera to begin live emotion detection.
            </div>
          ) : null}

          {isCameraEnabled && !isCameraReady && !error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/68 px-4 text-center text-sm font-medium text-white">
              Requesting camera access...
            </div>
          ) : null}

          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/78 px-5 text-center text-white">
              <p className="max-w-xs text-sm leading-6">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="pointer-events-auto rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
              >
                Retry Camera
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-[1.15rem] border border-slate-200 bg-white/80 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] leading-4 text-slate-500">
            Current Emotion
          </p>
          <p className="mt-1 text-lg font-semibold leading-6 text-slate-900">
            {formatEmotionLabel(dominantEmotion)}
          </p>
        </div>

        <div className="rounded-[1.15rem] border border-slate-200 bg-white/80 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] leading-4 text-slate-500">
            Confidence
          </p>
          <p className="mt-1 text-lg font-semibold leading-6 text-slate-900">
            {typeof confidence === "number" ? `${confidence.toFixed(1)}%` : "--"}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={startCamera}
          disabled={isCameraEnabled}
          className="min-h-12 flex-1 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:min-w-[11rem] sm:text-base"
        >
          {isCameraEnabled ? (isCameraReady ? "Camera Live" : "Starting Camera...") : "Start Camera"}
        </button>

        <button
          type="button"
          onClick={analyzeNow}
          disabled={!isCameraReady || isAnalyzing}
          className="min-h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 sm:min-w-[11rem] sm:text-base"
        >
          {isAnalyzing ? "Analyzing..." : "Refresh Detection"}
        </button>

        <button
          type="button"
          onClick={stopCamera}
          disabled={!isCameraEnabled}
          className="min-h-12 flex-1 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 sm:min-w-[9rem] sm:text-base"
        >
          Stop Camera
        </button>
      </div>
    </section>
  );
}

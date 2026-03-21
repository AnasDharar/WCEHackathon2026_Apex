"use client";

const phaseStyles = {
  idle: {
    shell: "border-slate-300/70 bg-white/80",
    core: "from-slate-300 via-white to-slate-200",
    glow: "rgba(148,163,184,0.24)",
    ring: "rgba(203,213,225,0.8)",
    dot: "bg-slate-300/80",
    label: "Ready",
  },
  connecting: {
    shell: "border-amber-300/70 bg-amber-50/80",
    core: "from-amber-400 via-orange-200 to-yellow-100",
    glow: "rgba(251,191,36,0.28)",
    ring: "rgba(253,230,138,0.85)",
    dot: "bg-amber-300/90",
    label: "Connecting",
  },
  listening: {
    shell: "border-emerald-300/70 bg-emerald-50/80",
    core: "from-emerald-500 via-teal-300 to-cyan-200",
    glow: "rgba(45,212,191,0.3)",
    ring: "rgba(167,243,208,0.85)",
    dot: "bg-emerald-300/90",
    label: "Listening",
  },
  processing: {
    shell: "border-sky-300/70 bg-sky-50/80",
    core: "from-sky-500 via-cyan-300 to-blue-100",
    glow: "rgba(56,189,248,0.3)",
    ring: "rgba(186,230,253,0.85)",
    dot: "bg-sky-300/90",
    label: "Processing",
  },
  speaking: {
    shell: "border-fuchsia-300/70 bg-rose-50/80",
    core: "from-fuchsia-500 via-rose-300 to-orange-100",
    glow: "rgba(244,114,182,0.28)",
    ring: "rgba(251,207,232,0.85)",
    dot: "bg-fuchsia-300/90",
    label: "AI Speaking",
  },
  error: {
    shell: "border-rose-300/70 bg-rose-50/80",
    core: "from-rose-500 via-orange-300 to-rose-100",
    glow: "rgba(251,113,133,0.28)",
    ring: "rgba(254,205,211,0.85)",
    dot: "bg-rose-300/90",
    label: "Error",
  },
};

const waveHeights = {
  idle: [10, 14, 10, 14, 10],
  connecting: [16, 24, 18, 24, 16],
  listening: [22, 34, 18, 30, 20],
  processing: [18, 28, 38, 28, 18],
  speaking: [32, 48, 26, 44, 30],
  error: [12, 20, 12, 20, 12],
};

function orbitStyle(duration, delay = "0s", reverse = false) {
  return {
    animation: `spin ${duration} linear infinite`,
    animationDelay: delay,
    animationDirection: reverse ? "reverse" : "normal",
  };
}

function pulseStyle(phase) {
  if (phase === "speaking") {
    return { animation: "pulse 0.9s ease-in-out infinite" };
  }
  if (phase === "listening" || phase === "processing") {
    return { animation: "pulse 1.4s ease-in-out infinite" };
  }
  if (phase === "connecting") {
    return { animation: "pulse 1s ease-in-out infinite" };
  }
  return undefined;
}

function mouthStyle(isTalking) {
  return isTalking
    ? { animation: "pulse 180ms ease-in-out infinite" }
    : { transform: "translateX(-50%) scaleX(1) scaleY(0.45)", opacity: 0.8 };
}

export default function VoiceOrb({ phase, statusText, doctorImage, doctorName }) {
  const currentStyle = phaseStyles[phase] || phaseStyles.idle;
  const bars = waveHeights[phase] || waveHeights.idle;
  const isTalking = phase === "speaking";
  const isAlive = phase === "listening" || phase === "processing" || phase === "speaking";

  return (
    <div className="relative flex w-full max-w-[13rem] flex-col items-center gap-2.5 sm:max-w-[14rem] sm:gap-3">
      <div
        className={`relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] border shadow-[0_22px_50px_rgba(15,23,42,0.14)] transition-all duration-500 sm:h-44 sm:w-44 sm:rounded-[2.25rem] ${currentStyle.shell}`}
      >
        <div
          className="absolute inset-7 rounded-full blur-3xl transition-all duration-500"
          style={{ backgroundColor: currentStyle.glow, ...pulseStyle(phase) }}
        />

        <div className="absolute inset-4 rounded-full border border-white/40" />
        <div className="absolute inset-7 rounded-full border border-white/25" />

        <div
          className="absolute inset-3 rounded-full"
          style={{
            ...orbitStyle(phase === "speaking" ? "4s" : "7s"),
            border: `1px solid ${currentStyle.ring}`,
          }}
        >
          <span className={`absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full ${currentStyle.dot}`} />
          <span className={`absolute left-8 top-8 h-2 w-2 rounded-full ${currentStyle.dot}`} />
        </div>

        <div
          className="absolute inset-5 rounded-full"
          style={{
            ...orbitStyle(phase === "processing" ? "5s" : "9s", "-1.2s", true),
            border: `1px solid ${currentStyle.ring}`,
          }}
        >
          <span className={`absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full ${currentStyle.dot}`} />
          <span className={`absolute right-8 top-10 h-2 w-2 rounded-full ${currentStyle.dot}`} />
        </div>

        <div
          className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${currentStyle.core} shadow-[0_12px_32px_rgba(15,23,42,0.18)] transition-transform duration-500 sm:h-[7.5rem] sm:w-[7.5rem] ${
            phase === "speaking" ? "scale-110" : phase === "processing" ? "scale-105" : "scale-100"
          }`}
          style={pulseStyle(phase)}
        >
          <div
            className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-white/80 sm:h-[5.5rem] sm:w-[5.5rem] ${
              isAlive ? "animate-[pulse_2.2s_ease-in-out_infinite]" : ""
            }`}
          >
            {doctorImage ? (
              <div className="relative">
                <img
                  src={doctorImage}
                  alt={doctorName || "Doctor avatar"}
                  className="h-14 w-14 object-contain sm:h-[4.5rem] sm:w-[4.5rem]"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
                <span
                  className={`absolute left-1/2 top-[61%] block h-1.5 w-4 -translate-x-1/2 rounded-full bg-slate-800 ${
                    isTalking ? "" : ""
                  }`}
                  style={mouthStyle(isTalking)}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="absolute bottom-3 flex items-end gap-1 sm:bottom-4">
          {bars.map((height, index) => (
            <span
              key={`${phase}-${index}`}
              className="w-1 rounded-full bg-white/80 shadow-[0_0_14px_rgba(255,255,255,0.35)]"
              style={{
                height: Math.max(8, Math.round(height * 0.72)),
                animation:
                  phase === "idle"
                    ? "none"
                    : `pulse ${phase === "speaking" ? "0.8s" : "1.3s"} ease-in-out ${index * 0.08}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="w-full space-y-1.5 text-center sm:space-y-2">
        <div className="inline-flex items-center rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 sm:px-3 sm:text-[11px] sm:tracking-[0.2em]">
          {currentStyle.label}
        </div>
        {statusText ? (
          <p className="mx-auto max-w-[11.5rem] text-sm font-semibold leading-5 text-slate-900 sm:max-w-[13rem] sm:text-base sm:leading-6">
            {statusText}
          </p>
        ) : null}
      </div>
    </div>
  );
}

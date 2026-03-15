"use client";

export default function Controls({
  isConnected,
  isStarting,
  isMuted,
  onStart,
  onToggleMute,
  onEnd,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <button
        type="button"
        onClick={onStart}
        disabled={isConnected || isStarting}
        className="min-h-14 flex-1 rounded-2xl bg-slate-950 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:min-w-[12rem]"
      >
        {isStarting ? "Starting..." : isConnected ? "Conversation Live" : "Start Conversation"}
      </button>

      <button
        type="button"
        onClick={onToggleMute}
        disabled={!isConnected}
        className="min-h-14 flex-1 rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 sm:min-w-[10rem]"
      >
        {isMuted ? "Unmute Microphone" : "Mute Microphone"}
      </button>

      <button
        type="button"
        onClick={onEnd}
        disabled={!isConnected && !isStarting}
        className="min-h-14 flex-1 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-3 text-base font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 sm:min-w-[9rem]"
      >
        End Session
      </button>
    </div>
  );
}

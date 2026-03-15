"use client";

import "@livekit/components-styles";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
} from "@livekit/components-react";
import { useMemo, useState } from "react";

import { api } from "@/lib/api";
import { getUserSession } from "@/lib/userSession";

type VoiceTokenResponse = {
  token: string;
  room_name: string;
  participant_name: string;
  participant_identity: string;
  server_url: string;
  expires_in_seconds: number;
};

type TokenStatus = "idle" | "loading" | "ready" | "error";

function buildRoomName(userId: string | null | undefined) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `mental-health-${userId || "guest"}-${suffix}`;
}

export default function MentalHealthVoiceRoom() {
  const [sessionIdentity, setSessionIdentity] = useState(() => {
    const user = getUserSession();
    return {
      participantName: user?.name || user?.first_name || "Guest User",
      roomName: buildRoomName(user?.id),
    };
  });
  const [serverUrl, setServerUrl] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<TokenStatus>("idle");
  const [error, setError] = useState("");
  const { roomName, participantName } = sessionIdentity;

  const sessionHint = useMemo(() => {
    if (!roomName) {
      return "A secure audio room will be created when you start the session.";
    }
    return `Private room: ${roomName}`;
  }, [roomName]);

  const connectToRoom = async () => {
    if (!roomName || !participantName) {
      setError("Room configuration is incomplete.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const response = (await api.post("/voice/token", {
        room_name: roomName,
        participant_name: participantName,
      })) as VoiceTokenResponse;

      setToken(response.token);
      setServerUrl(response.server_url);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unable to start the voice session.");
    }
  };

  const resetSession = () => {
    setToken("");
    setServerUrl("");
    setStatus("idle");
    setError("");
    const user = getUserSession();
    setSessionIdentity({
      participantName: user?.name || user?.first_name || "Guest User",
      roomName: buildRoomName(user?.id),
    });
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700">
              Guided Voice Care
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Talk in Marathi with a calming voice assistant</h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">
                This room uses LiveKit audio, Sarvam speech models, and a guarded LangGraph flow to keep replies empathetic, brief, and non-diagnostic.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Language</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">Marathi first</p>
                <p className="mt-1 text-xs text-gray-500">STT and TTS tuned for the Marathi mr-IN locale.</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Guardrails</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">Diagnosis blocked</p>
                <p className="mt-1 text-xs text-gray-500">Unsafe or clinical requests get redirected safely.</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Session</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">Audio only</p>
                <p className="mt-1 text-xs text-gray-500">No camera needed for support conversations.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Session setup</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Participant</p>
                <p className="text-sm font-semibold text-gray-900">{participantName}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Room status</p>
                <p className="text-sm font-semibold text-gray-900">{sessionHint}</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={connectToRoom}
                  disabled={status === "loading" || status === "ready"}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "loading" ? "Preparing..." : status === "ready" ? "Session Live" : "Start Voice Session"}
                </button>
                <button
                  type="button"
                  onClick={resetSession}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Voice session</h3>
            <p className="text-sm text-gray-500">
              Join the room, allow microphone access, and speak naturally. The assistant answers in Marathi.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status === "ready"
                ? "bg-emerald-100 text-emerald-700"
                : status === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {status === "ready" ? "Connected" : status === "loading" ? "Connecting" : "Waiting"}
          </span>
        </div>

        <div className="min-h-[340px] rounded-3xl border border-dashed border-emerald-200 bg-gradient-to-br from-gray-50 via-white to-emerald-50 p-4">
          {token && serverUrl ? (
            <LiveKitRoom
              token={token}
              serverUrl={serverUrl}
              connect={true}
              audio={true}
              video={false}
              className="flex h-full min-h-[300px] flex-col justify-between gap-6 rounded-2xl border border-white bg-white/80 p-5 shadow-sm"
              data-lk-theme="default"
            >
              <RoomAudioRenderer />

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900">
                तुमच्या भावना मोकळेपणाने सांगा. हा सहाय्यक ऐकून घेतो, हलक्या पद्धतीने प्रतिसाद देतो, आणि वैद्यकीय निदान करत नाही.
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-3">
                <VoiceAssistantControlBar />
              </div>
            </LiveKitRoom>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white bg-white/70 px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
                  <path d="M19 11a7 7 0 0 1-14 0" />
                  <path d="M12 18v4" />
                  <path d="M8 22h8" />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-gray-900">Microphone session is not connected yet</h4>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                Start the secure session above to fetch a LiveKit token and activate the assistant controls.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

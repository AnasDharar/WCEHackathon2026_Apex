"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ConnectionState, Room, RoomEvent, Track } from "livekit-client";

import { api } from "@/lib/api";
import { getUserSession } from "@/lib/userSession";
import { getVoiceDoctorById } from "@/lib/voiceDoctors";
import { getVoiceLanguageByCode } from "@/lib/voiceLanguages";

const PHASES = {
  idle: "idle",
  connecting: "connecting",
  listening: "listening",
  processing: "processing",
  speaking: "speaking",
  error: "error",
};

const EMOTION_CONTEXT_TOPIC = "emotion-context";

function buildRoomName(doctorId, languageCode) {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `mental-health-${doctorId || "general-care"}__${languageCode || "mr-IN"}__${suffix}`;
}

function buildSessionIdentity(selectedDoctorId, selectedLanguageCode) {
  const user = getUserSession();
  const doctor = getVoiceDoctorById(selectedDoctorId);
  const language = getVoiceLanguageByCode(selectedLanguageCode);

  return {
    participantName: user?.name || user?.first_name || "Guest User",
    roomName: buildRoomName(doctor.id, language.code),
    doctor,
    language,
  };
}

function isRemoteSpeaker(participant, localIdentity) {
  return participant && participant.identity !== localIdentity;
}

function upsertTranscript(previous, nextEntry) {
  const existingIndex = previous.findIndex((entry) => entry.id === nextEntry.id);

  if (existingIndex === -1) {
    return [...previous, nextEntry].sort((a, b) => a.timestamp - b.timestamp);
  }

  const updated = [...previous];
  updated[existingIndex] = {
    ...updated[existingIndex],
    ...nextEntry,
    final: updated[existingIndex].final || nextEntry.final,
  };
  return updated.sort((a, b) => a.timestamp - b.timestamp);
}

function encodeRoomEvent(payload) {
  return new TextEncoder().encode(JSON.stringify(payload));
}

export function useVoiceAssistant(selectedDoctorId, selectedLanguageCode) {
  const [sessionIdentity, setSessionIdentity] = useState(() =>
    buildSessionIdentity(selectedDoctorId, selectedLanguageCode),
  );
  const [room, setRoom] = useState(null);
  const [phase, setPhase] = useState(PHASES.idle);
  const [connectionState, setConnectionState] = useState(ConnectionState.Disconnected);
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const [tokenDetails, setTokenDetails] = useState(null);

  const roomRef = useRef(null);
  const isMutedRef = useRef(false);
  const awaitingAgentRef = useRef(false);
  const localWasSpeakingRef = useRef(false);
  const remoteWasSpeakingRef = useRef(false);

  const disconnectRoom = async (targetRoom = roomRef.current) => {
    if (!targetRoom) {
      return;
    }

    try {
      await targetRoom.disconnect();
    } catch {
      // Best effort disconnect so the UI can recover cleanly.
    }
  };

  useEffect(() => {
    return () => {
      disconnectRoom();
    };
  }, []);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (roomRef.current && roomRef.current.state !== ConnectionState.Disconnected) {
      return;
    }

    setSessionIdentity(buildSessionIdentity(selectedDoctorId, selectedLanguageCode));
  }, [connectionState, selectedDoctorId, selectedLanguageCode]);

  const startSession = async () => {
    if (roomRef.current || phase === PHASES.connecting) {
      return;
    }

    setHasStarted(true);
    setError("");
    setTranscript([]);
    setAgentConnected(false);
    setTokenDetails(null);
    setIsMuted(false);
    setPhase(PHASES.connecting);
    awaitingAgentRef.current = false;
    localWasSpeakingRef.current = false;
    remoteWasSpeakingRef.current = false;

    try {
      const tokenResponse = await api.get("/voice/token", {
        params: {
          room_name: sessionIdentity.roomName,
          participant_name: sessionIdentity.participantName,
        },
      });

      const nextRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      const handleConnectionStateChanged = (nextState) => {
        setConnectionState(nextState);

        if (nextState === ConnectionState.Connected) {
          setPhase((currentPhase) =>
            currentPhase === PHASES.connecting ? PHASES.listening : currentPhase,
          );
          return;
        }

        if (nextState === ConnectionState.Disconnected) {
          setPhase(PHASES.idle);
          setAgentConnected(false);
        }
      };

      const handleParticipantConnected = (participant) => {
        if (participant.identity !== nextRoom.localParticipant.identity) {
          setAgentConnected(true);
        }
      };

      const handleParticipantDisconnected = (participant) => {
        if (participant.identity !== nextRoom.localParticipant.identity) {
          setAgentConnected(false);
        }
      };

      const handleActiveSpeakersChanged = (speakers) => {
        const localIdentity = nextRoom.localParticipant.identity;
        const localIsSpeaking = speakers.some(
          (speaker) => speaker.identity === localIdentity,
        );
        const remoteIsSpeaking = speakers.some((speaker) =>
          isRemoteSpeaker(speaker, localIdentity),
        );

        if (remoteIsSpeaking) {
          awaitingAgentRef.current = false;
          remoteWasSpeakingRef.current = true;
          setPhase(PHASES.speaking);
        } else if (localIsSpeaking) {
          awaitingAgentRef.current = false;
          localWasSpeakingRef.current = true;
          setPhase(PHASES.listening);
        } else if (localWasSpeakingRef.current) {
          awaitingAgentRef.current = true;
          localWasSpeakingRef.current = false;
          setPhase(PHASES.processing);
        } else if (remoteWasSpeakingRef.current) {
          remoteWasSpeakingRef.current = false;
          setPhase(isMutedRef.current ? PHASES.processing : PHASES.listening);
        } else if (awaitingAgentRef.current) {
          setPhase(PHASES.processing);
        } else if (!isMutedRef.current && nextRoom.state === ConnectionState.Connected) {
          setPhase(PHASES.listening);
        }
      };

      const handleTrackSubscribed = (_track, publication, participant) => {
        if (
          publication.kind === Track.Kind.Audio &&
          participant.identity !== nextRoom.localParticipant.identity
        ) {
          setAgentConnected(true);
        }
      };

      const handleTranscriptionReceived = (segments, participant) => {
        const isUser = participant?.identity === nextRoom.localParticipant.identity;

        segments.forEach((segment) => {
          const text = segment.text?.trim();

          if (!text) {
            return;
          }

          setTranscript((previous) =>
            upsertTranscript(previous, {
              id: segment.id,
              speaker: isUser ? "user" : "assistant",
              text,
              final: Boolean(segment.final),
              timestamp:
                typeof segment.firstReceivedTime === "number"
                  ? segment.firstReceivedTime
                  : Date.now(),
            }),
          );
        });
      };

      nextRoom
        .on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
        .on(RoomEvent.ParticipantConnected, handleParticipantConnected)
        .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
        .on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)
        .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
        .on(RoomEvent.TranscriptionReceived, handleTranscriptionReceived);

      roomRef.current = nextRoom;
      setRoom(nextRoom);
      setTokenDetails(tokenResponse);

      await nextRoom.prepareConnection(tokenResponse.server_url, tokenResponse.token);
      await nextRoom.connect(tokenResponse.server_url, tokenResponse.token);
      await nextRoom.localParticipant.setMicrophoneEnabled(true);
      await nextRoom.startAudio();

      setPhase(PHASES.listening);
    } catch (caughtError) {
      await disconnectRoom(roomRef.current);
      roomRef.current = null;
      setRoom(null);
      setConnectionState(ConnectionState.Disconnected);
      setPhase(PHASES.error);
      setAgentConnected(false);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to start the voice assistant session.",
      );
    }
  };

  const toggleMute = async () => {
    if (!roomRef.current) {
      return;
    }

    const nextMuted = !isMuted;

    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!nextMuted);
      setIsMuted(nextMuted);

      if (nextMuted) {
        setPhase(PHASES.processing);
      } else if (roomRef.current.state === ConnectionState.Connected) {
        setPhase(PHASES.listening);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to change microphone state.",
      );
    }
  };

  const endSession = async () => {
    await disconnectRoom(roomRef.current);
    roomRef.current = null;
    setRoom(null);
    setConnectionState(ConnectionState.Disconnected);
    setPhase(PHASES.idle);
    setIsMuted(false);
    setAgentConnected(false);
    setTokenDetails(null);
    setTranscript([]);
    setError("");
    setSessionIdentity(buildSessionIdentity(selectedDoctorId, selectedLanguageCode));
    awaitingAgentRef.current = false;
    localWasSpeakingRef.current = false;
    remoteWasSpeakingRef.current = false;
  };

  const publishEmotionContext = async (payload) => {
    const activeRoom = roomRef.current;

    if (!activeRoom || activeRoom.state !== ConnectionState.Connected) {
      return false;
    }

    try {
      await activeRoom.localParticipant.publishData(
        encodeRoomEvent({
          ...payload,
          source: "emotion-camera",
          sentAt: Date.now(),
        }),
        {
          reliable: true,
          topic: EMOTION_CONTEXT_TOPIC,
        },
      );
      return true;
    } catch {
      return false;
    }
  };

  const statusText = useMemo(() => {
    switch (phase) {
      case PHASES.connecting:
        return `Connecting to ${sessionIdentity.doctor.name}...`;
      case PHASES.listening:
        return isMuted ? "Microphone muted" : `${sessionIdentity.doctor.name} is listening...`;
      case PHASES.processing:
        return `${sessionIdentity.doctor.name} is preparing a response...`;
      case PHASES.speaking:
        return `${sessionIdentity.doctor.name} is speaking...`;
      case PHASES.error:
        return "Connection issue";
      default:
        return "";
    }
  }, [
    isMuted,
    phase,
    sessionIdentity.doctor.name,
  ]);

  return {
    room,
    phase,
    error,
    transcript,
    isMuted,
    isConnected: connectionState === ConnectionState.Connected,
    isStarting: phase === PHASES.connecting,
    hasStarted,
    agentConnected,
    statusText,
    sessionIdentity,
    tokenDetails,
    startSession,
    toggleMute,
    publishEmotionContext,
    endSession,
  };
}

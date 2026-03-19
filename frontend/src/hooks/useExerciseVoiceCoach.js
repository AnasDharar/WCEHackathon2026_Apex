import { useEffect, useMemo, useRef, useState } from "react";
import { ConnectionState, Room, RoomEvent, Track } from "livekit-client";

import { api } from "@/lib/api";
import { getUserSession } from "@/lib/userSession";

const COACH_PHASES = {
  idle: "idle",
  connecting: "connecting",
  speaking: "speaking",
  ready: "ready",
  error: "error",
};

function buildExerciseRoomName(exerciseId, languageCode) {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `mental-health-exercise-${exerciseId || "calm-breathing"}__${languageCode || "en-IN"}__${suffix}`;
}

function buildCoachIdentity(exerciseId, languageCode) {
  const user = getUserSession();

  return {
    participantName: user?.name || user?.first_name || "Guest User",
    roomName: buildExerciseRoomName(exerciseId, languageCode),
    exerciseId,
    languageCode,
  };
}

function encodeEvent(payload) {
  return new TextEncoder().encode(JSON.stringify(payload));
}

function decodePayload(data) {
  try {
    return JSON.parse(new TextDecoder().decode(data));
  } catch {
    return null;
  }
}

export function useExerciseVoiceCoach(exerciseId, languageCode = "en-IN") {
  const [room, setRoom] = useState(null);
  const [phase, setPhase] = useState(COACH_PHASES.idle);
  const [error, setError] = useState("");
  const [agentConnected, setAgentConnected] = useState(false);
  const [connectionState, setConnectionState] = useState(ConnectionState.Disconnected);
  const [sessionIdentity, setSessionIdentity] = useState(() =>
    buildCoachIdentity(exerciseId, languageCode)
  );
  const [lastExerciseEvent, setLastExerciseEvent] = useState(null);

  const roomRef = useRef(null);
  const startPromiseRef = useRef(null);

  const disconnectRoom = async (targetRoom = roomRef.current) => {
    if (!targetRoom) {
      return;
    }

    try {
      await targetRoom.disconnect();
    } catch {
      // Best effort cleanup so the exercise UI can recover.
    }
  };

  useEffect(() => {
    return () => {
      disconnectRoom();
    };
  }, []);

  useEffect(() => {
    if (roomRef.current) {
      return;
    }

    setSessionIdentity(buildCoachIdentity(exerciseId, languageCode));
  }, [exerciseId, languageCode]);

  const startSession = async () => {
    if (startPromiseRef.current) {
      return startPromiseRef.current;
    }

    if (roomRef.current?.state === ConnectionState.Connected) {
      return true;
    }

    if (phase === COACH_PHASES.connecting) {
      return true;
    }

    startPromiseRef.current = (async () => {
      setError("");
      setAgentConnected(false);
      setPhase(COACH_PHASES.connecting);
      setLastExerciseEvent(null);

      try {
        if (roomRef.current) {
          await disconnectRoom(roomRef.current);
          roomRef.current = null;
          setRoom(null);
          setConnectionState(ConnectionState.Disconnected);
        }

        const identity = buildCoachIdentity(exerciseId, languageCode);
        setSessionIdentity(identity);

        const tokenResponse = await api.get("/voice/token", {
          params: {
            room_name: identity.roomName,
            participant_name: identity.participantName,
          },
        });

        const nextRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        const handleConnectionStateChanged = (nextState) => {
          setConnectionState(nextState);

          if (nextState === ConnectionState.Connected) {
            setPhase(COACH_PHASES.ready);
            return;
          }

          if (nextState === ConnectionState.Disconnected) {
            if (roomRef.current === nextRoom) {
              roomRef.current = null;
              setRoom(null);
            }
            setPhase(COACH_PHASES.idle);
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
            setPhase(COACH_PHASES.ready);
          }
        };

        const handleActiveSpeakersChanged = (speakers) => {
          const localIdentity = nextRoom.localParticipant.identity;
          const remoteIsSpeaking = speakers.some(
            (speaker) => speaker.identity !== localIdentity && speaker.audioLevel > 0
          );

          if (remoteIsSpeaking) {
            setPhase(COACH_PHASES.speaking);
          } else if (nextRoom.state === ConnectionState.Connected) {
            setPhase(COACH_PHASES.ready);
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

        const handleDataReceived = (payload, participant, _kind, topic) => {
          if (
            topic !== "exercise-ui" ||
            participant.identity === nextRoom.localParticipant.identity
          ) {
            return;
          }

          const decoded = decodePayload(payload);
          if (decoded) {
            setLastExerciseEvent({
              ...decoded,
              receivedAt: Date.now(),
            });
          }
        };

        nextRoom
          .on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
          .on(RoomEvent.ParticipantConnected, handleParticipantConnected)
          .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
          .on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)
          .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
          .on(RoomEvent.DataReceived, handleDataReceived);

        roomRef.current = nextRoom;
        setRoom(nextRoom);

        await nextRoom.prepareConnection(tokenResponse.server_url, tokenResponse.token);
        await nextRoom.connect(tokenResponse.server_url, tokenResponse.token);
        await nextRoom.localParticipant.setMicrophoneEnabled(false);
        await nextRoom.startAudio();

        setPhase(COACH_PHASES.ready);
        return true;
      } catch (caughtError) {
        await disconnectRoom(roomRef.current);
        roomRef.current = null;
        setRoom(null);
        setConnectionState(ConnectionState.Disconnected);
        setPhase(COACH_PHASES.error);
        setAgentConnected(false);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to start the exercise voice coach.",
        );
        return false;
      } finally {
        startPromiseRef.current = null;
      }
    })();

    return startPromiseRef.current;
  };

  const publishExerciseEvent = async (payload) => {
    if (!roomRef.current || roomRef.current.state !== ConnectionState.Connected) {
      return false;
    }

    try {
      await roomRef.current.localParticipant.publishData(encodeEvent(payload), {
        reliable: true,
        topic: "exercise-coach",
      });
      return true;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to send exercise guidance event.",
      );
      return false;
    }
  };

  const endSession = async () => {
    await disconnectRoom(roomRef.current);
    roomRef.current = null;
    setRoom(null);
    setConnectionState(ConnectionState.Disconnected);
    setPhase(COACH_PHASES.idle);
    setAgentConnected(false);
    setError("");
    setLastExerciseEvent(null);
    setSessionIdentity(buildCoachIdentity(exerciseId, languageCode));
  };

  const statusText = useMemo(() => {
    switch (phase) {
      case COACH_PHASES.connecting:
        return "Connecting to exercise coach...";
      case COACH_PHASES.speaking:
        return "Exercise coach is guiding you...";
      case COACH_PHASES.ready:
        return agentConnected ? "Exercise coach is ready." : "Waiting for exercise coach...";
      case COACH_PHASES.error:
        return "Exercise coach unavailable";
      default:
        return "";
    }
  }, [agentConnected, phase]);

  return {
    room,
    phase,
    error,
    agentConnected,
    isConnected: connectionState === ConnectionState.Connected,
    isStarting: phase === COACH_PHASES.connecting,
    statusText,
    sessionIdentity,
    lastExerciseEvent,
    startSession,
    publishExerciseEvent,
    endSession,
  };
}

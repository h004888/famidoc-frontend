'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ConnectionQuality,
  ConnectionState,
  Participant,
  RemoteParticipant,
  Room,
  RoomEvent,
  Track,
} from 'livekit-client';
import {
  NetworkQualityScore,
  TelehealthMessageDto,
  TelehealthSessionDto,
  telehealthApi,
} from '@/lib/api/telehealth.api';

export interface UseLivekitTelehealthRoomOptions {
  encounterId?: string | null;
  enabled?: boolean;
}

export interface LivekitTelehealthRoomState {
  connectionState: ConnectionState;
  networkQuality: NetworkQualityScore;
  isFallbackChat: boolean;
  session: TelehealthSessionDto | null;
  elapsedSeconds: number;
  isMicEnabled: boolean;
  isCamEnabled: boolean;
  isScreenSharing: boolean;
  remoteParticipant: RemoteParticipant | null;
  localCameraTrack: Track | null;
  remoteCameraTrack: Track | null;
  remoteScreenTrack: Track | null;
  remoteAudioTrack: Track | null;
  remoteMicMuted: boolean;
  remoteCamMuted: boolean;
  messages: TelehealthMessageDto[];
  error: string | null;
  toggleMic: () => Promise<void>;
  toggleCam: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  uploadAttachment: (file: File, caption?: string) => Promise<void>;
  endCall: () => Promise<TelehealthSessionDto | null>;
}

function mapConnectionQuality(q: ConnectionQuality): NetworkQualityScore {
  switch (q) {
    case ConnectionQuality.Excellent:
      return 'EXCELLENT';
    case ConnectionQuality.Good:
      return 'GOOD';
    case ConnectionQuality.Poor:
      return 'POOR';
    case ConnectionQuality.Lost:
      return 'LOST';
    default:
      return 'GOOD';
  }
}

export function useLivekitTelehealthRoom({
  encounterId,
  enabled = true,
}: UseLivekitTelehealthRoomOptions): LivekitTelehealthRoomState {
  const roomRef = useRef<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected,
  );
  const [networkQuality, setNetworkQuality] = useState<NetworkQualityScore>('GOOD');
  const [isFallbackChat, setIsFallbackChat] = useState(false);
  const [session, setSession] = useState<TelehealthSessionDto | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCamEnabled, setIsCamEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteParticipant, setRemoteParticipant] = useState<RemoteParticipant | null>(null);
  const [localCameraTrack, setLocalCameraTrack] = useState<Track | null>(null);
  const [remoteCameraTrack, setRemoteCameraTrack] = useState<Track | null>(null);
  const [remoteScreenTrack, setRemoteScreenTrack] = useState<Track | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<Track | null>(null);
  const [remoteMicMuted, setRemoteMicMuted] = useState(false);
  const [remoteCamMuted, setRemoteCamMuted] = useState(false);
  const [messages, setMessages] = useState<TelehealthMessageDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const syncTracks = useCallback((room: Room) => {
    const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    setLocalCameraTrack(camPub?.track ?? null);
    setIsMicEnabled(room.localParticipant.isMicrophoneEnabled);
    setIsCamEnabled(room.localParticipant.isCameraEnabled);
    setIsScreenSharing(room.localParticipant.isScreenShareEnabled);

    const remotes = Array.from(room.remoteParticipants.values());
    const remote = remotes[0] ?? null;
    setRemoteParticipant(remote);

    if (!remote) {
      setRemoteCameraTrack(null);
      setRemoteScreenTrack(null);
      setRemoteAudioTrack(null);
      setRemoteMicMuted(false);
      setRemoteCamMuted(false);
      return;
    }

    const rCam = remote.getTrackPublication(Track.Source.Camera);
    const rScreen = remote.getTrackPublication(Track.Source.ScreenShare);
    const rMic = remote.getTrackPublication(Track.Source.Microphone);

    setRemoteCameraTrack(rCam?.track && !rCam.isMuted ? rCam.track : null);
    setRemoteScreenTrack(rScreen?.track && !rScreen.isMuted ? rScreen.track : null);
    setRemoteAudioTrack(rMic?.track && !rMic.isMuted ? rMic.track : null);
    setRemoteCamMuted(rCam ? rCam.isMuted : true);
    setRemoteMicMuted(rMic ? rMic.isMuted : true);
  }, []);

  // Elapsed timer from real session.startedAt
  useEffect(() => {
    if (!session?.startedAt) {
      setElapsedSeconds(0);
      return;
    }
    const startMs = new Date(session.startedAt).getTime();
    const update = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [session?.startedAt]);

  // Connect to LiveKit & load initial messages
  useEffect(() => {
    if (!encounterId || !enabled) return;

    let cancelled = false;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;

    const handleStateChange = (state: ConnectionState) => {
      if (cancelled) return;
      setConnectionState(state);
      const fallback =
        state === ConnectionState.Reconnecting || state === ConnectionState.Disconnected;
      setIsFallbackChat(fallback);
      if (fallback) {
        telehealthApi
          .reportTelemetry(encounterId, { isFallbackChat: true, networkQualityScore: 'LOST' })
          .catch(() => {});
      } else if (state === ConnectionState.Connected) {
        telehealthApi
          .reportTelemetry(encounterId, { isFallbackChat: false })
          .catch(() => {});
      }
    };

    room.on(RoomEvent.ConnectionStateChanged, handleStateChange);
    room.on(RoomEvent.ParticipantConnected, () => syncTracks(room));
    room.on(RoomEvent.ParticipantDisconnected, () => syncTracks(room));
    room.on(RoomEvent.TrackSubscribed, () => syncTracks(room));
    room.on(RoomEvent.TrackUnsubscribed, () => syncTracks(room));
    room.on(RoomEvent.TrackMuted, () => syncTracks(room));
    room.on(RoomEvent.TrackUnmuted, () => syncTracks(room));
    room.on(RoomEvent.LocalTrackPublished, () => syncTracks(room));
    room.on(RoomEvent.LocalTrackUnpublished, () => syncTracks(room));
    room.on(
      RoomEvent.ConnectionQualityChanged,
      (quality: ConnectionQuality, participant: Participant) => {
        if (participant.isLocal) {
          const score = mapConnectionQuality(quality);
          setNetworkQuality(score);
          const fallback = score === 'POOR' || score === 'LOST';
          setIsFallbackChat(fallback);
          telehealthApi
            .reportTelemetry(encounterId, {
              networkQualityScore: score,
              isFallbackChat: fallback,
            })
            .catch(() => {});
        }
      },
    );
    room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
      try {
        const parsed = JSON.parse(new TextDecoder().decode(payload));
        if (parsed?.type === 'chat_message_created' && parsed.message) {
          const incoming = parsed.message as TelehealthMessageDto;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming],
          );
        }
      } catch {
        // Ignore malformed data packets
      }
    });

    (async () => {
      try {
        setError(null);
        const [tokenRes, initialMessages] = await Promise.all([
          telehealthApi.issueSessionToken(encounterId),
          telehealthApi.listMessages(encounterId),
        ]);
        if (cancelled) return;
        setSession(tokenRes.session);
        setMessages(initialMessages);

        await room.connect(tokenRes.url, tokenRes.token);
        if (cancelled) {
          await room.disconnect();
          return;
        }
        try {
          await room.localParticipant.enableCameraAndMicrophone();
        } catch {
          // User may deny camera/mic; keep room connected for chat/audio
        }
        syncTracks(room);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không thể kết nối phòng khám.');
          setIsFallbackChat(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      room.disconnect().catch(() => {});
      roomRef.current = null;
    };
  }, [encounterId, enabled, syncTracks]);

  // HTTP polling fallback when media/DataChannel is degraded
  useEffect(() => {
    if (!encounterId || !enabled || !isFallbackChat) return;
    const interval = setInterval(async () => {
      try {
        const lastId = messages[messages.length - 1]?.id;
        const newer = await telehealthApi.listMessages(encounterId, lastId);
        if (newer.length > 0) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const unique = newer.filter((m) => !ids.has(m.id));
            return unique.length > 0 ? [...prev, ...unique] : prev;
          });
        }
      } catch {
        // Silent retry on next poll
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [encounterId, enabled, isFallbackChat, messages]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    syncTracks(room);
  }, [syncTracks]);

  const toggleCam = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(next);
    syncTracks(room);
  }, [syncTracks]);

  const toggleScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !room.localParticipant.isScreenShareEnabled;
    await room.localParticipant.setScreenShareEnabled(next);
    syncTracks(room);
  }, [syncTracks]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!encounterId) return;
      const saved = await telehealthApi.sendMessage(encounterId, content);
      setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
    },
    [encounterId],
  );

  const uploadAttachment = useCallback(
    async (file: File, caption?: string) => {
      if (!encounterId) return;
      const saved = await telehealthApi.uploadAttachment(encounterId, file, caption);
      setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
    },
    [encounterId],
  );

  const endCall = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect().catch(() => {});
    }
    if (!encounterId) return null;
    return telehealthApi.endSession(encounterId);
  }, [encounterId]);

  return {
    connectionState,
    networkQuality,
    isFallbackChat,
    session,
    elapsedSeconds,
    isMicEnabled,
    isCamEnabled,
    isScreenSharing,
    remoteParticipant,
    localCameraTrack,
    remoteCameraTrack,
    remoteScreenTrack,
    remoteAudioTrack,
    remoteMicMuted,
    remoteCamMuted,
    messages,
    error,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    sendMessage,
    uploadAttachment,
    endCall,
  };
}

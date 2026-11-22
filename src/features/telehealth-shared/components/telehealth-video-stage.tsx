'use client';

import { useEffect, useRef } from 'react';
import { ConnectionState, Track } from 'livekit-client';
import {
  AlertTriangle,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LivekitTelehealthRoomState } from '../hooks/use-livekit-telehealth-room';

function TrackVideo({
  track,
  muted = false,
  className = '',
}: {
  track: Track;
  muted?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  return <video ref={videoRef} autoPlay playsInline muted={muted} className={className} />;
}

function TrackAudio({ track }: { track: Track }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  return <audio ref={audioRef} autoPlay />;
}

export function formatDurationClock(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export interface TelehealthVideoStageProps {
  roomState: LivekitTelehealthRoomState;
  remoteLabel: string;
  allowScreenShare?: boolean;
  endCallLabel?: string;
  onEndCall: () => void;
}

export function TelehealthVideoStage({
  roomState,
  remoteLabel,
  allowScreenShare = false,
  endCallLabel = 'Rời phòng',
  onEndCall,
}: TelehealthVideoStageProps) {
  const mainTrack = roomState.remoteScreenTrack ?? roomState.remoteCameraTrack;
  const isConnected = roomState.connectionState === ConnectionState.Connected;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-lg">
      {/* Top status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/90 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-medium text-emerald-300">
              <Wifi className="h-3.5 w-3.5" />
              Đã kết nối ({roomState.networkQuality})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 font-medium text-amber-300">
              <WifiOff className="h-3.5 w-3.5" />
              {roomState.connectionState === ConnectionState.Reconnecting
                ? 'Đang kết nối lại...'
                : 'Chế độ chat dự phòng'}
            </span>
          )}
          <span className="font-mono text-slate-300">
            {formatDurationClock(roomState.elapsedSeconds)}
          </span>
        </div>

        {roomState.remoteParticipant && (
          <div className="flex items-center gap-2 text-slate-300">
            <span>{remoteLabel}</span>
            {roomState.remoteMicMuted && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-300">
                <MicOff className="h-3 w-3" /> Tắt mic
              </span>
            )}
            {roomState.remoteCamMuted && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-700 px-1.5 py-0.5 text-slate-300">
                <VideoOff className="h-3 w-3" /> Tắt cam
              </span>
            )}
          </div>
        )}
      </div>

      {/* Fallback warning */}
      {roomState.isFallbackChat && (
        <div className="flex items-center gap-2 bg-amber-500/15 px-4 py-2 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            Đường truyền video không ổn định. Kênh chat y tế đã tự động chuyển sang chế độ dự phòng
            và sẽ tiếp tục hoạt động bình thường.
          </span>
        </div>
      )}

      {/* Main video area */}
      <div className="relative aspect-video w-full bg-slate-900">
        {mainTrack ? (
          <TrackVideo track={mainTrack} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-slate-400">
            <VideoOff className="h-10 w-10 text-slate-500" />
            <p className="text-sm font-medium text-slate-200">
              {roomState.remoteParticipant
                ? `${remoteLabel} đang tắt camera`
                : `Đang chờ ${remoteLabel} tham gia phòng...`}
            </p>
          </div>
        )}

        {roomState.remoteAudioTrack && <TrackAudio track={roomState.remoteAudioTrack} />}

        {/* Local PiP */}
        {roomState.localCameraTrack && roomState.isCamEnabled && (
          <div className="absolute bottom-3 right-3 h-28 w-40 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-md">
            <TrackVideo
              track={roomState.localCameraTrack}
              muted
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 border-t border-slate-800/80 bg-slate-900/90 px-4 py-3">
        <Button
          type="button"
          variant={roomState.isMicEnabled ? 'secondary' : 'destructive'}
          size="sm"
          onClick={() => void roomState.toggleMic()}
          aria-label={roomState.isMicEnabled ? 'Tắt micro' : 'Bật micro'}
        >
          {roomState.isMicEnabled ? <Mic className="mr-1.5 h-4 w-4" /> : <MicOff className="mr-1.5 h-4 w-4" />}
          {roomState.isMicEnabled ? 'Micro' : 'Đã tắt mic'}
        </Button>

        <Button
          type="button"
          variant={roomState.isCamEnabled ? 'secondary' : 'destructive'}
          size="sm"
          onClick={() => void roomState.toggleCam()}
          aria-label={roomState.isCamEnabled ? 'Tắt camera' : 'Bật camera'}
        >
          {roomState.isCamEnabled ? <Video className="mr-1.5 h-4 w-4" /> : <VideoOff className="mr-1.5 h-4 w-4" />}
          {roomState.isCamEnabled ? 'Camera' : 'Đã tắt cam'}
        </Button>

        {allowScreenShare && (
          <Button
            type="button"
            variant={roomState.isScreenSharing ? 'default' : 'secondary'}
            size="sm"
            onClick={() => void roomState.toggleScreenShare()}
          >
            <MonitorUp className="mr-1.5 h-4 w-4" />
            {roomState.isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
          </Button>
        )}

        <Button type="button" variant="destructive" size="sm" onClick={onEndCall}>
          <PhoneOff className="mr-1.5 h-4 w-4" />
          {endCallLabel}
        </Button>
      </div>
    </div>
  );
}

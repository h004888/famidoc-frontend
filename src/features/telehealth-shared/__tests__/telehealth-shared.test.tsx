import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionState } from 'livekit-client';
import { TelehealthVideoStage, formatDurationClock } from '../components/telehealth-video-stage';
import { TelehealthChatPanel } from '../components/telehealth-chat-panel';

describe('telehealth-shared components', () => {
  it('formatDurationClock formats seconds properly', () => {
    expect(formatDurationClock(65)).toBe('01:05');
    expect(formatDurationClock(3665)).toBe('01:01:05');
  });

  it('TelehealthVideoStage renders real status without REC badge and triggers controls', () => {
    const toggleMic = vi.fn().mockResolvedValue(undefined);
    const toggleCam = vi.fn().mockResolvedValue(undefined);
    const toggleScreenShare = vi.fn().mockResolvedValue(undefined);
    const onEndCall = vi.fn();

    render(
      <TelehealthVideoStage
        roomState={{
          connectionState: ConnectionState.Connected,
          networkQuality: 'EXCELLENT',
          isFallbackChat: false,
          session: null,
          elapsedSeconds: 125,
          isMicEnabled: true,
          isCamEnabled: true,
          isScreenSharing: false,
          remoteParticipant: null,
          localCameraTrack: null,
          remoteCameraTrack: null,
          remoteScreenTrack: null,
          remoteAudioTrack: null,
          remoteMicMuted: false,
          remoteCamMuted: false,
          messages: [],
          error: null,
          toggleMic,
          toggleCam,
          toggleScreenShare,
          sendMessage: vi.fn(),
          uploadAttachment: vi.fn(),
          endCall: vi.fn(),
        }}
        remoteLabel="BS. Minh"
        allowScreenShare
        onEndCall={onEndCall}
      />,
    );

    expect(screen.queryByText('REC')).toBeNull();
    expect(screen.getByText('02:05')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Tắt micro/i }));
    expect(toggleMic).toHaveBeenCalled();
  });

  it('TelehealthChatPanel renders messages and submits text', async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const onUploadAttachment = vi.fn().mockResolvedValue(undefined);

    render(
      <TelehealthChatPanel
        encounterId="enc-1"
        currentRole="FAMILY_REP"
        messages={[
          {
            id: 'm1',
            sessionId: 's1',
            senderUserId: 'u1',
            senderRole: 'DOCTOR',
            senderName: 'BS. Minh',
            content: 'Xin chào gia đình',
            attachmentKey: null,
            attachmentName: null,
            attachmentMimeType: null,
            attachmentSizeBytes: null,
            createdAt: new Date().toISOString(),
          },
        ]}
        onSendMessage={onSendMessage}
        onUploadAttachment={onUploadAttachment}
      />,
    );

    expect(screen.getByText('Xin chào gia đình')).toBeTruthy();
    const input = screen.getByPlaceholderText('Nhập tin nhắn y tế...');
    fireEvent.change(input, { target: { value: 'Huyết áp 120/80' } });
    fireEvent.submit(input.closest('form')!);
    expect(onSendMessage).toHaveBeenCalledWith('Huyết áp 120/80');
  });
});

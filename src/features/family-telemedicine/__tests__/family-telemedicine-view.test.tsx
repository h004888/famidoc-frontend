import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FamilyTelemedicineView } from '../components/family-telemedicine-view';
import { encountersApi } from '@/lib/api/encounters.api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}));

vi.mock('@/lib/api/encounters.api', () => ({
  encountersApi: {
    getDetail: vi.fn(),
    getFamilyTimetable: vi.fn(),
  },
}));

vi.mock('@/lib/api/patients.api', () => ({
  patientsApi: {
    getMemberVitalSigns: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/features/telehealth-shared', () => ({
  useLivekitTelehealthRoom: () => ({
    connectionState: 'disconnected',
    networkQuality: 'GOOD',
    isFallbackChat: false,
    session: null,
    elapsedSeconds: 0,
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
    toggleMic: vi.fn(),
    toggleCam: vi.fn(),
    toggleScreenShare: vi.fn(),
    sendMessage: vi.fn(),
    uploadAttachment: vi.fn(),
    endCall: vi.fn(),
  }),
  TelehealthVideoStage: () => <div data-testid="video-stage" />,
  TelehealthChatPanel: () => <div data-testid="chat-panel" />,
}));

describe('FamilyTelemedicineView', () => {
  it('hiển thị trạng thái trống rõ ràng khi không có ca khám Telehealth khả dụng', async () => {
    (encountersApi.getFamilyTimetable as any).mockResolvedValue([]);

    render(<FamilyTelemedicineView />);

    await waitFor(() => {
      expect(screen.getByText('Chưa có buổi khám Telehealth khả dụng')).toBeTruthy();
    });
    expect(screen.queryByText(/mem-01/)).toBeNull();
  });
});

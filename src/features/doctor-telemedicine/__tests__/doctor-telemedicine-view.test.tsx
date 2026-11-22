import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DoctorTelemedicineView } from '../components/doctor-telemedicine-view';
import { encountersApi } from '@/lib/api/encounters.api';

const pushMock = vi.fn();
const endCallMock = vi.fn().mockResolvedValue(null);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams('encounterId=enc-doc-1'),
}));

vi.mock('@/lib/api/encounters.api', () => ({
  encountersApi: {
    getDetail: vi.fn(),
    getDoctorTimetable: vi.fn(),
  },
}));

vi.mock('@/features/telehealth-shared', () => ({
  useLivekitTelehealthRoom: () => ({
    connectionState: 'connected',
    networkQuality: 'EXCELLENT',
    isFallbackChat: false,
    session: null,
    elapsedSeconds: 10,
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
    endCall: endCallMock,
  }),
  TelehealthVideoStage: () => <div data-testid="doctor-video-stage" />,
  TelehealthChatPanel: () => <div data-testid="doctor-chat-panel" />,
}));

describe('DoctorTelemedicineView', () => {
  it('không hiển thị REC giả và gọi endCall khi bấm Kết Thúc Ca Khám', async () => {
    (encountersApi.getDoctorTimetable as any).mockResolvedValue({
      data: [
        {
          id: 'enc-doc-1',
          encounterType: 'TELEHEALTH',
          encounterStatus: 'IN_PROGRESS',
          patient: { fullName: 'Nguyễn Văn B' },
        },
      ],
    });

    render(<DoctorTelemedicineView />);

    await waitFor(() => {
      expect(screen.getByText('Phòng Khám Bác Sĩ (Telehealth)')).toBeTruthy();
    });

    expect(screen.queryByText('REC')).toBeNull();
    expect(screen.queryByText('00:14:32')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Kết Thúc Ca Khám' }));
    await waitFor(() => {
      expect(endCallMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith('/doctor/encounters');
    });
  });
});

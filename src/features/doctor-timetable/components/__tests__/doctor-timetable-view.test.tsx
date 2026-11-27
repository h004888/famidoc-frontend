import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DoctorTimetableView } from '@/features/doctor-timetable/components/doctor-timetable-view';
import { encountersApi } from '@/lib/api/encounters.api';
import { doctorsApi } from '@/lib/api/doctors.api';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/api/encounters.api', () => ({
  encountersApi: {
    getDoctorTimetable: vi.fn(),
    getPendingRescheduleRequests: vi.fn(),
    decideRescheduleRequest: vi.fn(),
    requestReschedule: vi.fn(),
  },
}));

vi.mock('@/lib/api/doctors.api', () => ({
  doctorsApi: {
    getDoctorMe: vi.fn(),
  },
}));

describe('DoctorTimetableView (D2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(doctorsApi.getDoctorMe).mockResolvedValue({
      id: 'doc-1',
      doctorName: 'BS. Trần Minh Tâm',
      onboardingStatus: 'ACTIVE',
    } as any);
    vi.mocked(encountersApi.getPendingRescheduleRequests).mockResolvedValue([]);
  });

  it('shows ACTIVE badge and direct Workspace link, Chờ EHR badge, and no check-in buttons', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
    const yesterdayIso = yesterday.toISOString().slice(0, 10);

    vi.mocked(encountersApi.getDoctorTimetable).mockResolvedValue({
      data: [
        {
          id: 'enc-week-active',
          contractId: 'c-1',
          doctorId: 'doc-1',
          scheduledDate: todayIso,
          scheduledTime: '14:00',
          encounterType: 'HOME_VISIT',
          category: 'PERIODIC_ROUTINE',
          encounterStatus: 'CONFIRMED',
          familyConfirmedArrivalAt: null,
          clinicalEmrs: [],
          patient: { id: 'p-1', fullName: 'Hộ Nguyễn Văn A' },
        },
        {
          id: 'enc-week-pending',
          contractId: 'c-2',
          doctorId: 'doc-1',
          scheduledDate: yesterdayIso,
          scheduledTime: '09:00',
          encounterType: 'HOME_VISIT',
          category: 'PERIODIC_ROUTINE',
          encounterStatus: 'CONFIRMED',
          familyConfirmedArrivalAt: yesterday.toISOString(),
          sessionDeadlines: {
            recordDeadlineAt: new Date(now.getTime() + 6 * 3600 * 1000).toISOString(),
          },
          clinicalEmrs: [],
          patient: { id: 'p-2', fullName: 'Hộ Lê Thị B' },
        },
      ] as any,
      pagination: { page: 1, pageSize: 50, totalItems: 2, totalPages: 1 },
    });

    render(<DoctorTimetableView />);

    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText(/Chờ EHR/i)).toBeInTheDocument();
    });

    const activeWorkspaceLink = screen.getByRole('link', { name: /Mở ca/i });
    expect(activeWorkspaceLink).toHaveAttribute(
      'href',
      '/doctor/encounters?encounterId=enc-week-active',
    );

    await user.click(screen.getByRole('button', { name: /Chi tiết/i }));
    expect(screen.queryByRole('button', { name: /Check-in đã đến nhà/i })).not.toBeInTheDocument();
  });
});

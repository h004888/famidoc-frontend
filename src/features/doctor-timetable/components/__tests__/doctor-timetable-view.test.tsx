import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DoctorTimetableView } from '../doctor-timetable-view';
import { encountersApi } from '@/lib/api';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DoctorTimetableView (/doctor/timetable)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(encountersApi, 'getDoctorTimetable').mockResolvedValue({
      data: [
        {
          id: 'enc-home-confirmed',
          contractId: 'ctr-1',
          patientId: 'p-1',
          doctorId: 'doc-1',
          scheduledDate: '2026-11-25T00:00:00.000Z',
          scheduledTime: '08:30:00',
          encounterType: 'HOME_VISIT',
          category: 'PERIODIC_ROUTINE',
          encounterStatus: 'CONFIRMED',
          participants: [{ patientId: 'p-1', patient: { id: 'p-1', fullName: 'Phạm Ngọc Thọ' } }],
          contract: {
            familyUnit: { homeAddress: '123 Nguyễn Trãi, Q.1' },
          },
          rescheduleRequests: [],
        },
        {
          id: 'enc-tele-req',
          contractId: 'ctr-1',
          patientId: 'p-1',
          doctorId: 'doc-1',
          scheduledDate: '2026-11-26T00:00:00.000Z',
          scheduledTime: '16:00:00',
          encounterType: 'TELEHEALTH',
          category: 'AD_HOC_ON_DEMAND',
          encounterStatus: 'REQUESTED',
          cancelReason: 'Đo huyết áp sáng nay hơi cao',
          participants: [{ patientId: 'p-1', patient: { id: 'p-1', fullName: 'Phạm Ngọc Thọ' } }],
          rescheduleRequests: [],
        },
      ],
      pagination: { page: 1, pageSize: 100, totalItems: 2, totalPages: 1 },
    } as any);

    vi.spyOn(encountersApi, 'getPendingRescheduleRequests').mockResolvedValue([]);
  });

  it('shows priority telehealth approval, 1-step arrival check-in, and omits Panel Cap / radius clutter', async () => {
    const arriveSpy = vi
      .spyOn(encountersApi, 'markArrived')
      .mockResolvedValue({ id: 'enc-home-confirmed', encounterStatus: 'ARRIVED' } as any);
    const confirmTeleSpy = vi
      .spyOn(encountersApi, 'confirmEncounter')
      .mockResolvedValue({ id: 'enc-tele-req', encounterStatus: 'CONFIRMED' } as any);

    render(<DoctorTimetableView />);

    await waitFor(() => {
      expect(screen.getByText('123 Nguyễn Trãi, Q.1')).toBeInTheDocument();
      expect(screen.getByText('Đo huyết áp sáng nay hơi cao')).toBeInTheDocument();
    });

    // Clutter removed
    expect(screen.queryByText(/Hạn mức Gia đình \(Panel Cap\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bán Kính Khám Tại Nhà/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bắt đầu di chuyển/i })).not.toBeInTheDocument();

    // 1-step check-in arrival
    fireEvent.click(screen.getByRole('button', { name: /Check-in đã đến nhà/i }));
    await waitFor(() => {
      expect(arriveSpy).toHaveBeenCalledWith('enc-home-confirmed');
    });

    // Priority telehealth approval
    fireEvent.click(screen.getByRole('button', { name: /Nhận lịch Video/i }));
    await waitFor(() => {
      expect(confirmTeleSpy).toHaveBeenCalledWith('enc-tele-req', true);
    });
  });
});

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const pushMock = vi.fn();
const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: any[]) => toastErrorMock(...args),
    success: (...args: any[]) => toastSuccessMock(...args),
  },
}));

const getDoctorVideoAvailabilityMock = vi.fn();
const createAdHocEncounterMock = vi.fn();
const cancelEncounterMock = vi.fn();

vi.mock('@/lib/api', () => ({
  encountersApi: {
    getDoctorVideoAvailability: (...args: any[]) => getDoctorVideoAvailabilityMock(...args),
    createAdHocEncounter: (...args: any[]) => createAdHocEncounterMock(...args),
    cancelEncounter: (...args: any[]) => cancelEncounterMock(...args),
  },
  contractsApi: {
    getFamilyGateStatus: vi.fn().mockResolvedValue({ activeContract: { id: 'ctr-1' } }),
    getMedicalContractDetail: vi.fn().mockResolvedValue({
      id: 'ctr-1',
      doctor: { id: 'doc-1', doctorName: 'BS. Nguyễn Văn A' },
      remainingTelehealth: 3,
      servicePackage: { videoQuotaPolicy: 'FIXED' },
    }),
  },
}));

import BookVideoConsultationPage from '@/app/(dashboard)/family/appointments/book-video/page';

describe('BookVideoConsultationPage (2 ca trọn khung + SLOT_TAKEN)', () => {
  const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const currentMonth = vnNow.toISOString().slice(0, 7);
  const targetDate = `${currentMonth}-15`;

  beforeEach(() => {
    vi.clearAllMocks();
    getDoctorVideoAvailabilityMock.mockResolvedValue({
      month: currentMonth,
      doctorId: 'doc-1',
      nearestAvailableSlot: { date: targetDate, slotWindow: 'MORNING', suggestedTime: '08:00' },
      days: [
        {
          date: targetDate,
          isDayOff: false,
          outOfRange: false,
          morning: { available: true, candidateTimes: ['08:00'], reasonCode: 'AVAILABLE', label: 'Còn trống' },
          afternoon: { available: true, candidateTimes: ['13:30'], reasonCode: 'AVAILABLE', label: 'Còn trống' },
        },
      ],
    });
  });

  it('(a)(b) không render giờ 30 phút; chọn ca Chiều rồi gửi nhận slotWindow AFTERNOON', async () => {
    createAdHocEncounterMock.mockResolvedValueOnce({ id: 'enc-1' });

    render(<BookVideoConsultationPage />);

    await waitFor(() => {
      expect(screen.getByText(/BS\. Nguyễn Văn A/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /15●/ })).not.toBeDisabled();
    });

    // (a) không còn nút giờ 30 phút
    expect(screen.queryByText('08:30')).not.toBeInTheDocument();

    // Chọn ngày 15 và ca Chiều
    fireEvent.click(screen.getByRole('button', { name: /15●/ }));
    fireEvent.click(screen.getByRole('button', { name: /Khung Chiều/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận đặt lịch/i }));

    await waitFor(() => {
      expect(createAdHocEncounterMock).toHaveBeenCalledWith(
        expect.objectContaining({
          desiredDate: targetDate,
          slotWindow: 'AFTERNOON',
        }),
      );
    });
  });

  it('(c) API trả lỗi code SLOT_TAKEN → toast đúng thông báo và gọi lại availability', async () => {
    const slotTakenErr = Object.assign(new Error('Conflict'), {
      code: 'SLOT_TAKEN',
      data: { code: 'SLOT_TAKEN' },
    });
    createAdHocEncounterMock.mockRejectedValueOnce(slotTakenErr);

    render(<BookVideoConsultationPage />);

    await waitFor(() => {
      expect(getDoctorVideoAvailabilityMock).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: /15●/ })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /15●/ }));
    fireEvent.click(screen.getByRole('button', { name: /Khung Chiều/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận đặt lịch/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Ca này vừa có người đặt, vui lòng chọn ca khác',
      );
    });
    expect(getDoctorVideoAvailabilityMock).toHaveBeenCalledTimes(2);
  });
});

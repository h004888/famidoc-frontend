import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FacilityCoordinationView } from '../facility-coordination-view';
import { encountersApi } from '@/lib/api/encounters.api';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

describe('FacilityCoordinationView (/facility/schedules)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(encountersApi, 'getFacilityScheduleBoard').mockResolvedValue({
      encounters: [
        {
          id: 'enc-home-1',
          contractId: 'ctr-1',
          patientId: 'p-1',
          doctorId: 'doc-1',
          scheduledDate: '2026-11-25T00:00:00.000Z',
          scheduledTime: '08:30:00',
          encounterType: 'HOME_VISIT',
          category: 'PERIODIC_ROUTINE',
          encounterStatus: 'CONFIRMED',
          doctor: { id: 'doc-1', doctorName: 'BS. Trần Thị Bích' },
          participants: [{ patientId: 'p-1', patient: { id: 'p-1', fullName: 'Phạm Ngọc Thọ' } }],
          contract: {
            contractNumber: 'MC-001',
            familyUnit: { homeAddress: '123 Nguyễn Trãi, Q.1' },
          },
          rescheduleRequests: [],
        },
        {
          id: 'enc-tele-1',
          contractId: 'ctr-1',
          patientId: 'p-1',
          doctorId: 'doc-1',
          scheduledDate: '2026-11-26T00:00:00.000Z',
          scheduledTime: '15:00:00',
          encounterType: 'TELEHEALTH',
          category: 'AD_HOC_ON_DEMAND',
          encounterStatus: 'CONFIRMED',
          doctor: { id: 'doc-1', doctorName: 'BS. Trần Thị Bích' },
          participants: [{ patientId: 'p-2', patient: { id: 'p-2', fullName: 'Bệnh nhân Video' } }],
          rescheduleRequests: [],
        },
      ],
      pendingRescheduleRequests: [
        {
          id: 'req-fac-1',
          encounterId: 'enc-home-1',
          requestedByRole: 'FAMILY_REP',
          requestedByUserId: 'fam-1',
          proposedDate: '2026-11-27T00:00:00.000Z',
          proposedTime: '14:00:00',
          reason: 'Gia đình bận buổi sáng',
          familyDecision: 'APPROVED',
          doctorDecision: 'APPROVED',
          facilityDecision: 'PENDING',
          status: 'PENDING',
        },
      ],
    } as any);
  });

  it('renders only HOME_VISIT schedules, approves pending 3-party reschedules, and initiates facility reschedule', async () => {
    const decideSpy = vi
      .spyOn(encountersApi, 'decideRescheduleRequest')
      .mockResolvedValue({ id: 'req-fac-1', status: 'APPROVED' } as any);
    const rescheduleSpy = vi
      .spyOn(encountersApi, 'requestReschedule')
      .mockResolvedValue({ id: 'req-fac-2', status: 'PENDING' } as any);

    render(<FacilityCoordinationView />);

    await waitFor(() => {
      expect(screen.getByText('Phạm Ngọc Thọ')).toBeInTheDocument();
    });

    // TELEHEALTH is 2-party only and should not appear on CSYT home-visit coordination board
    expect(screen.queryByText('Bệnh nhân Video')).not.toBeInTheDocument();

    // Compact operational strip & 4-stage field progress bar
    expect(screen.getByText(/Chờ duyệt đổi lịch:/i)).toBeInTheDocument();
    expect(screen.getByText(/Tiến độ thực địa:/i)).toBeInTheDocument();

    // Switch to Weekly Doctor Grid view
    fireEvent.click(screen.getByRole('button', { name: /Lịch tuần Bác sĩ/i }));
    expect(screen.getByRole('columnheader', { name: /Bác sĩ/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Theo ngày/i }));

    // Approve pending 3-party reschedule
    fireEvent.click(screen.getByRole('button', { name: /Đồng ý đổi lịch/i }));
    await waitFor(() => {
      expect(decideSpy).toHaveBeenCalledWith('enc-home-1', 'req-fac-1', { decision: 'APPROVE' });
    });

    // Initiate facility reschedule (only requires Family confirmation)
    fireEvent.click(screen.getByRole('button', { name: /Đổi lịch \(chỉ cần Gia đình XN\)/i }));
    const reasonInput = await screen.findByLabelText(/Lý do điều phối/i);
    fireEvent.change(reasonInput, { target: { value: 'Điều chỉnh tuyến khám buổi sáng' } });
    fireEvent.click(screen.getByRole('button', { name: /Gửi tới Gia đình/i }));

    await waitFor(() => {
      expect(rescheduleSpy).toHaveBeenCalledWith(
        'enc-home-1',
        expect.objectContaining({
          rescheduleReason: 'Điều chỉnh tuyến khám buổi sáng',
        })
      );
    });
  });
});

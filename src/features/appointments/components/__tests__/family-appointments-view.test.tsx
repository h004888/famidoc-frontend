import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FamilyAppointmentsView } from '../family-appointments-view';
import { contractsApi } from '@/lib/api/contracts.api';
import { encountersApi } from '@/lib/api/encounters.api';
import { patientsApi } from '@/lib/api/patients.api';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

describe('FamilyAppointmentsView (/family/appointments)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(contractsApi, 'getFamilyGateStatus').mockResolvedValue({
      hasActiveContract: true,
      activeContract: { id: 'ctr-1' },
      pendingContract: null,
      patientCount: 2,
    } as any);

    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValue({
      id: 'ctr-1',
      remainingHomeVisits: 1,
      remainingTelehealth: 0,
      endDate: '2027-02-19T00:00:00.000Z',
      servicePackage: {
        packageName: 'Gói Gia Đình Toàn Diện',
        periodicVisitsQuota: 1,
        telehealthQuota: 1,
        videoQuotaPolicy: 'FIXED',
        quotaPeriod: 'PER_TERM',
      },
    } as any);

    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValue([
      { id: 'p-1', fullName: 'Phạm Ngọc Thọ', status: 'ACTIVE' },
    ] as any);

    vi.spyOn(encountersApi, 'getFamilyTimetable').mockResolvedValue({
      data: [
        {
          id: 'enc-arrived-1',
          contractId: 'ctr-1',
          patientId: 'p-1',
          doctorId: 'doc-1',
          scheduledDate: '2026-11-25T00:00:00.000Z',
          scheduledTime: '08:30:00',
          encounterType: 'HOME_VISIT',
          category: 'PERIODIC_ROUTINE',
          encounterStatus: 'ARRIVED',
          subjectiveNote: 'Khám định kỳ tại nhà',
          doctor: {
            id: 'doc-1',
            doctorName: 'BS. Trần Thị Bích',
            facility: { id: 'fac-1', facilityName: 'Bệnh Viện Cà Mau' },
          },
          patient: { id: 'p-1', fullName: 'Phạm Ngọc Thọ' },
        },
        {
          id: 'enc-tele-2',
          contractId: 'ctr-1',
          patientId: 'p-1',
          doctorId: 'doc-1',
          scheduledDate: '2026-11-26T00:00:00.000Z',
          scheduledTime: '16:00:00',
          encounterType: 'TELEHEALTH',
          category: 'AD_HOC_ON_DEMAND',
          encounterStatus: 'CONFIRMED',
          subjectiveNote: 'Tư vấn kết quả xét nghiệm qua Video',
          doctor: {
            id: 'doc-1',
            doctorName: 'BS. Trần Thị Bích',
            facility: { id: 'fac-1', facilityName: 'Bệnh Viện Cà Mau' },
          },
          patient: { id: 'p-1', fullName: 'Phạm Ngọc Thọ' },
        },
      ],
      pagination: { page: 1, pageSize: 50, totalItems: 1, totalPages: 1 },
    } as any);

    vi.spyOn(encountersApi, 'getPendingRescheduleRequests').mockResolvedValue([
      {
        id: 'req-1',
        encounterId: 'enc-arrived-1',
        requestedByRole: 'HEALTHCARE_FACILITY',
        requestedByUserId: 'fac-user-1',
        proposedDate: '2026-11-27T00:00:00.000Z',
        proposedTime: '14:00:00',
        reason: 'Điều phối lại tuyến khám',
        familyDecision: 'PENDING',
        doctorDecision: 'APPROVED',
        facilityDecision: 'APPROVED',
        status: 'PENDING',
      },
    ] as any);
  });

  it('omits manual home-visit creation, supports 1-tap arrival confirmation, and handles facility reschedule approval', async () => {
    const confirmSpy = vi
      .spyOn(encountersApi, 'confirmArrival')
      .mockResolvedValue({ id: 'enc-arrived-1', encounterStatus: 'IN_PROGRESS' } as any);
    const decideSpy = vi
      .spyOn(encountersApi, 'decideRescheduleRequest')
      .mockResolvedValue({ id: 'req-1', status: 'APPROVED' } as any);

    render(<FamilyAppointmentsView />);

    await waitFor(() => {
      expect(screen.getByText('Khám định kỳ tại nhà')).toBeInTheDocument();
      expect(screen.getByText('Tư vấn kết quả xét nghiệm qua Video')).toBeInTheDocument();
    });

    // No manual booking button, no internal contract hash, no static doctor card
    expect(screen.queryByRole('button', { name: /Đặt lịch khám mới/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/HĐ #/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bác Sĩ Quản Nhiệm Hộ/i)).not.toBeInTheDocument();

    // Compact quota strip
    expect(screen.getByText('1/1 lượt còn lại')).toBeInTheDocument();

    // 1-tap arrival confirmation
    const arrivalButtons = screen.getAllByRole('button', { name: /Xác nhận Bác sĩ đã đến nhà/i });
    fireEvent.click(arrivalButtons[0]);
    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith('enc-arrived-1');
    });

    // Facility-initiated reschedule request -> only Family needs to approve
    expect(screen.getByText(/Cơ sở y tế đề xuất đổi lịch sang 14:00 ngày 27\/11\/2026/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Đồng ý lịch mới' }));
    await waitFor(() => {
      expect(decideSpy).toHaveBeenCalledWith('enc-arrived-1', 'req-1', { decision: 'APPROVE' });
    });

    // Origin badges distinguish auto-scheduled HOME_VISIT vs on-demand TELEHEALTH
    expect(screen.getByText('Tự động theo gói')).toBeInTheDocument();
    expect(screen.getByText('Đặt theo nhu cầu')).toBeInTheDocument();
  });

  it('allows booking an on-demand TELEHEALTH video consultation when quota permits', async () => {
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValue({
      id: 'ctr-1',
      remainingHomeVisits: 1,
      remainingTelehealth: 2,
      endDate: '2027-02-19T00:00:00.000Z',
      servicePackage: {
        packageName: 'Gói Trải Nghiệm',
        periodicVisitsQuota: 1,
        telehealthQuota: 2,
        videoQuotaPolicy: 'FIXED',
        quotaPeriod: 'PER_TERM',
      },
    } as any);

    const createAdHocSpy = vi
      .spyOn(encountersApi, 'createAdHocEncounter')
      .mockResolvedValue({ id: 'enc-new-tele-1', encounterStatus: 'REQUESTED' } as any);

    render(<FamilyAppointmentsView />);

    const bookBtn = await screen.findByRole('button', { name: /\+ Đặt Tư vấn Video/i });
    await waitFor(() => expect(bookBtn).not.toBeDisabled());

    fireEvent.click(bookBtn);

    const reasonInput = await screen.findByLabelText(/Triệu chứng \/ Vấn đề cần hỏi Bác sĩ/i);
    fireEvent.change(reasonInput, { target: { value: 'Đo huyết áp sáng nay hơi cao' } });

    fireEvent.click(screen.getByRole('button', { name: /Gửi yêu cầu Tư vấn/i }));

    await waitFor(() => {
      expect(createAdHocSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: 'ctr-1',
          patientId: 'p-1',
          encounterType: 'TELEHEALTH',
          reason: 'Đo huyết áp sáng nay hơi cao',
        })
      );
    });
  });
});

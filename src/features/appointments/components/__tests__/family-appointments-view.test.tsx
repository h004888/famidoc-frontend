import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { contractsApi } from '@/lib/api/contracts.api';
import { encountersApi, type EncounterItem } from '@/lib/api/encounters.api';
import { patientsApi } from '@/lib/api/patients.api';
import { FamilyAppointmentsView } from '../family-appointments-view';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const activeGateFixture = {
  hasActiveContract: true,
  activeContract: {
    id: 'ctr-1',
    contractNumber: 'HĐ-2026-001',
    contractStatus: 'ACTIVE' as const,
    memberCount: 2,
    endDate: '2027-01-01T00:00:00.000Z',
    packageName: 'Gói Gia Đình Toàn Diện',
    doctor: {
      id: 'doc-1',
      fullName: 'BS. Nguyễn Trọng Nghĩa',
      title: 'Bác sĩ Gia đình',
      hospitalName: 'BV Đại học Y Dược',
      avatarUrl: null,
      phone: '0901234567',
      experienceYears: 12,
    },
  },
  pendingContract: null,
  familyUnit: {
    id: 'fam-1',
    homeAddress: '123 Nguyễn Trãi, Q.1, TP.HCM',
    emergencyPhone: '0909123456',
    representativeName: 'Phạm Quang Huy',
  },
  patientCount: 2,
};

const membersFixture = [
  {
    id: 'pat-1',
    familyId: 'fam-1',
    fullName: 'Phạm Quang Huy',
    dateOfBirth: '1984-05-10',
    gender: 'MALE' as const,
    relationshipToHead: 'HEAD',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('FamilyAppointmentsView (/family/appointments)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(contractsApi, 'getFamilyGateStatus').mockResolvedValue(activeGateFixture);
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValue({
      id: 'ctr-1',
      contractNumber: 'HĐ-2026-001',
      contractStatus: 'ACTIVE',
      totalAmount: 12000000,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      createdAt: '2026-01-01',
      remainingHomeVisits: 4,
      remainingTelehealth: 10,
      servicePackage: {
        id: 'pkg-1',
        packageName: 'Gói Gia Đình Toàn Diện',
        periodicVisitsQuota: 6,
        telehealthQuota: 12,
      },
      doctor: {
        id: 'doc-1',
        doctorName: 'BS. Nguyễn Trọng Nghĩa',
        user: { fullName: 'BS. Nguyễn Trọng Nghĩa' },
      },
      facility: {
        id: 'fac-1',
        facilityName: 'BV Đại học Y Dược',
      },
    });
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValue(membersFixture);
  });

  it('confirms a doctor counter-offer schedule and handles CONFLICT_ALERT response', async () => {
    const counterOfferEnc: EncounterItem = {
      id: 'enc-counter-1',
      contractId: 'ctr-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      scheduledDate: '2026-12-01T00:00:00.000Z',
      scheduledTime: '1970-01-01T09:00:00.000Z',
      proposedDate: '2026-12-03T00:00:00.000Z',
      proposedTime: '1970-01-01T15:30:00.000Z',
      proposedBy: 'DOCTOR',
      rescheduleReason: 'Bác sĩ đề xuất dời sang 15:30 ngày 03/12',
      encounterType: 'HOME_VISIT',
      category: 'PERIODIC_ROUTINE',
      encounterStatus: 'RESCHEDULE_REQUESTED',
      patient: { id: 'pat-1', fullName: 'Phạm Quang Huy' },
    };

    vi.spyOn(encountersApi, 'getFamilyTimetable').mockResolvedValue({
      data: [counterOfferEnc],
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });

    const confirmSpy = vi.spyOn(encountersApi, 'confirmEncounter').mockResolvedValueOnce({
      ...counterOfferEnc,
      status: 'CONFLICT_ALERT',
      message: 'Trùng ca trực MORNING_CLINIC tại CSYT.',
    });

    render(<FamilyAppointmentsView />);

    await screen.findByText(/Lịch cần bạn xác nhận/i);
    expect(screen.getByText(/Bác sĩ đề xuất giờ mới/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Chấp nhận giờ mới/i }));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith('enc-counter-1', { confirmed: true });
    });
    expect(await screen.findByText(/Trùng ca trực MORNING_CLINIC tại CSYT/i)).toBeInTheDocument();
  });

  it('submits an ad-hoc appointment via createAdHocEncounter', async () => {
    vi.spyOn(encountersApi, 'getFamilyTimetable').mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 100, totalItems: 0, totalPages: 1 },
    });
    const adHocSpy = vi.spyOn(encountersApi, 'createAdHocEncounter').mockResolvedValueOnce({
      id: 'enc-adhoc-1',
      contractId: 'ctr-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      scheduledDate: '2026-12-05T00:00:00.000Z',
      scheduledTime: '1970-01-01T09:00:00.000Z',
      encounterType: 'TELEHEALTH',
      category: 'AD_HOC_ON_DEMAND',
      encounterStatus: 'REQUESTED',
      proposedBy: 'FAMILY_REP',
    });

    render(<FamilyAppointmentsView />);

    const bookBtn = await screen.findByRole('button', { name: /Đặt lịch khám đột xuất/i });
    await waitFor(() => expect(bookBtn).not.toBeDisabled());
    fireEvent.click(bookBtn);

    fireEvent.click(screen.getByRole('button', { name: /Tư vấn Video/i }));
    fireEvent.change(screen.getByLabelText(/Triệu chứng \/ Lý do đặt lịch/i), {
      target: { value: 'Đau đầu nhẹ và chóng mặt từ sáng' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Gửi yêu cầu đặt lịch/i }));

    await waitFor(() => {
      expect(adHocSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: 'ctr-1',
          patientId: 'pat-1',
          encounterType: 'TELEHEALTH',
          reason: 'Đau đầu nhẹ và chóng mặt từ sáng',
        })
      );
    });
  });

  it('warns on < 4h reschedule and shows Hotline alert when AUTO_REJECTED_TOO_LATE', async () => {
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const soonDateIso = `${soon.getFullYear()}-${String(soon.getMonth() + 1).padStart(2, '0')}-${String(
      soon.getDate()
    ).padStart(2, '0')}`;
    const soonTimeHm = `${String(soon.getHours()).padStart(2, '0')}:${String(soon.getMinutes()).padStart(2, '0')}`;

    const confirmedSoonEnc: EncounterItem = {
      id: 'enc-soon-1',
      contractId: 'ctr-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      scheduledDate: `${soonDateIso}T00:00:00.000Z`,
      scheduledTime: `1970-01-01T${soonTimeHm}:00.000Z`,
      encounterType: 'HOME_VISIT',
      category: 'PERIODIC_ROUTINE',
      encounterStatus: 'CONFIRMED',
      patient: { id: 'pat-1', fullName: 'Phạm Quang Huy' },
    };

    vi.spyOn(encountersApi, 'getFamilyTimetable').mockResolvedValue({
      data: [confirmedSoonEnc],
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });

    const rescheduleSpy = vi.spyOn(encountersApi, 'requestReschedule').mockResolvedValueOnce({
      ...confirmedSoonEnc,
      status: 'AUTO_REJECTED_TOO_LATE',
      message: 'Yêu cầu đổi lịch bị từ chối do báo trước dưới 4 giờ.',
    });

    render(<FamilyAppointmentsView />);

    const rescheduleBtn = await screen.findByRole('button', { name: /Xin đổi giờ hẹn/i });
    fireEvent.click(rescheduleBtn);

    expect(await screen.findByText(/Chỉ còn dưới 4 giờ trước giờ khám dự kiến/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Lý do xin đổi giờ/i), {
      target: { value: 'Có việc đột xuất' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Gửi yêu cầu đổi lịch/i }));

    await waitFor(() => {
      expect(rescheduleSpy).toHaveBeenCalledWith(
        'enc-soon-1',
        expect.objectContaining({
          rescheduleReason: 'Có việc đột xuất',
        })
      );
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(/1900 6868/i);
  });

  it('submits valid >= 4h reschedule request successfully', async () => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const nextDateIso = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(
      nextWeek.getDate()
    ).padStart(2, '0')}`;

    const futureEnc: EncounterItem = {
      id: 'enc-future-1',
      contractId: 'ctr-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      scheduledDate: `${nextDateIso}T00:00:00.000Z`,
      scheduledTime: '1970-01-01T09:00:00.000Z',
      encounterType: 'HOME_VISIT',
      category: 'PERIODIC_ROUTINE',
      encounterStatus: 'CONFIRMED',
      patient: { id: 'pat-1', fullName: 'Phạm Quang Huy' },
    };

    vi.spyOn(encountersApi, 'getFamilyTimetable').mockResolvedValue({
      data: [futureEnc],
      pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
    });

    const rescheduleSpy = vi.spyOn(encountersApi, 'requestReschedule').mockResolvedValueOnce({
      ...futureEnc,
      encounterStatus: 'RESCHEDULE_REQUESTED',
      proposedBy: 'FAMILY_REP',
    });

    render(<FamilyAppointmentsView />);

    fireEvent.click(await screen.findByRole('button', { name: /Xin đổi giờ hẹn/i }));
    expect(screen.queryByText(/Chỉ còn dưới 4 giờ trước giờ khám dự kiến/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Lý do xin đổi giờ/i), {
      target: { value: 'Gia đình muốn đổi sang buổi chiều' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Gửi yêu cầu đổi lịch/i }));

    await waitFor(() => {
      expect(rescheduleSpy).toHaveBeenCalledWith(
        'enc-future-1',
        expect.objectContaining({
          rescheduleReason: 'Gia đình muốn đổi sang buổi chiều',
        })
      );
    });
  });
});

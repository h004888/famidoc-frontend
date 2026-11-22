import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { contractsApi, doctorsApi, encountersApi, type EncounterItem } from '@/lib/api';
import { DoctorTimetableView } from '../doctor-timetable-view';

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

const activeContractFixture = {
  id: 'ctr-1',
  contractNumber: 'HĐ-2026-888',
  status: 'ACTIVE' as const,
  packageId: 'pkg-1',
  packageName: 'Gói Gia Đình Cao Cấp',
  packagePrice: 14000000,
  durationMonths: 12,
  familyId: 'fam-1',
  familyRepresentativeName: 'Phạm Quang Huy',
  familyRepresentativePhone: '0909123456',
  familyRepresentativeEmail: 'huy@example.com',
  membersCount: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
  signatures: {},
};

describe('DoctorTimetableView (/doctor/timetable)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(doctorsApi, 'getDoctorMe').mockResolvedValue({
      id: 'doc-1',
      doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
      maxFamilies: 150,
      currentFamilies: 12,
      facility: { id: 'fac-1', facilityName: 'BV Đại học Y Dược TP.HCM' },
    } as any);
    vi.spyOn(contractsApi, 'getMedicalContracts').mockResolvedValue([activeContractFixture]);
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValue({
      id: 'ctr-1',
      contractNumber: 'HĐ-2026-888',
      contractStatus: 'ACTIVE',
      totalAmount: 14000000,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      createdAt: '2026-01-01',
      members: [
        {
          id: 'mem-1',
          patientId: 'pat-1',
          patient: { id: 'pat-1', fullName: 'Phạm Quang Huy' },
        },
      ],
    });
  });

  it('creates a periodic encounter from an ACTIVE family contract', async () => {
    vi.spyOn(encountersApi, 'getDoctorTimetable').mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 150, totalItems: 0, totalPages: 1 },
    });
    const periodicSpy = vi.spyOn(encountersApi, 'createPeriodicEncounter').mockResolvedValueOnce({
      id: 'enc-per-1',
      contractId: 'ctr-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      scheduledDate: '2026-12-01T00:00:00.000Z',
      scheduledTime: '1970-01-01T09:00:00.000Z',
      encounterType: 'HOME_VISIT',
      category: 'PERIODIC_ROUTINE',
      encounterStatus: 'REQUESTED',
      proposedBy: 'DOCTOR',
    });

    render(<DoctorTimetableView />);

    const openBtn = await screen.findByRole('button', { name: /\+ Lên lịch định kỳ/i });
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/Thành viên khám/i)).toHaveValue('pat-1');
    });

    fireEvent.change(screen.getByLabelText(/Ghi chú kế hoạch khám/i), {
      target: { value: 'Đo huyết áp định kỳ hàng tháng' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Gửi lịch cho Gia đình/i }));

    await waitFor(() => {
      expect(periodicSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: 'ctr-1',
          patientId: 'pat-1',
          encounterType: 'HOME_VISIT',
          notes: 'Đo huyết áp định kỳ hàng tháng',
        })
      );
    });
  });

  it('finalizes an ad-hoc request and handles reschedule review options', async () => {
    const adHocEnc: EncounterItem = {
      id: 'enc-adhoc-1',
      contractId: 'ctr-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      scheduledDate: '2026-12-05T00:00:00.000Z',
      scheduledTime: '1970-01-01T10:30:00.000Z',
      encounterType: 'HOME_VISIT',
      category: 'AD_HOC_ON_DEMAND',
      encounterStatus: 'REQUESTED',
      proposedBy: 'FAMILY_REP',
      subjectiveNote: 'Sốt cao 38.5 độ',
      patient: { id: 'pat-1', fullName: 'Phạm Quang Huy' },
      contract: { id: 'ctr-1', contractNumber: 'HĐ-2026-888' },
    };

    const rescheduleEnc: EncounterItem = {
      id: 'enc-res-1',
      contractId: 'ctr-1',
      patientId: 'pat-2',
      doctorId: 'doc-1',
      scheduledDate: '2026-12-06T00:00:00.000Z',
      scheduledTime: '1970-01-01T08:00:00.000Z',
      proposedDate: '2026-12-07T00:00:00.000Z',
      proposedTime: '1970-01-01T15:30:00.000Z',
      proposedBy: 'FAMILY_REP',
      rescheduleReason: 'Gia đình đi vắng buổi sáng',
      encounterType: 'TELEHEALTH',
      category: 'PERIODIC_ROUTINE',
      encounterStatus: 'RESCHEDULE_REQUESTED',
      patient: { id: 'pat-2', fullName: 'Đỗ Thu Thảo' },
    };

    vi.spyOn(encountersApi, 'getDoctorTimetable').mockResolvedValue({
      data: [adHocEnc, rescheduleEnc],
      pagination: { page: 1, pageSize: 150, totalItems: 2, totalPages: 1 },
    });

    const finalizeSpy = vi.spyOn(encountersApi, 'finalizeEncounter').mockResolvedValueOnce({
      ...adHocEnc,
      proposedBy: 'DOCTOR',
    });
    const reviewSpy = vi.spyOn(encountersApi, 'reviewReschedule').mockResolvedValue({
      ...rescheduleEnc,
      proposedBy: 'DOCTOR',
    });

    render(<DoctorTimetableView />);

    await screen.findByText(/Yêu cầu khám đột xuất \(Ad-hoc\)/i);

    fireEvent.click(screen.getByRole('button', { name: /Duyệt & Hoàn tất lịch/i }));
    fireEvent.change(screen.getByLabelText(/Ghi chú của bác sĩ gửi gia đình/i), {
      target: { value: 'Bác sĩ nhận ca khám tại nhà lúc 10:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Gửi lịch cho Gia đình/i }));

    await waitFor(() => {
      expect(finalizeSpy).toHaveBeenCalledWith(
        'enc-adhoc-1',
        expect.objectContaining({
          encounterType: 'HOME_VISIT',
          doctorNotes: 'Bác sĩ nhận ca khám tại nhà lúc 10:30',
        })
      );
    });

    // Test counter-propose on reschedule
    fireEvent.click(screen.getByRole('button', { name: /Đề xuất giờ khác/i }));
    fireEvent.change(screen.getByLabelText(/Lời nhắn tới Gia đình/i), {
      target: { value: 'Bác sĩ rảnh lúc 14:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Gửi giờ đề xuất mới/i }));

    await waitFor(() => {
      expect(reviewSpy).toHaveBeenCalledWith(
        'enc-res-1',
        expect.objectContaining({
          accept: false,
          counterDate: expect.any(String),
          counterTime: expect.any(String),
          notes: 'Bác sĩ rảnh lúc 14:00',
        })
      );
    });

    // Test Accept reschedule
    fireEvent.click(screen.getByRole('button', { name: /Chấp nhận giờ mới/i }));
    await waitFor(() => {
      expect(reviewSpy).toHaveBeenCalledWith('enc-res-1', { accept: true });
    });
  });
});

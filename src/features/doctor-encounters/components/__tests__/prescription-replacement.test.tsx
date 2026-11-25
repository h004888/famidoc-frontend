import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrescriptionForm } from '@/features/doctor-encounters/components/prescription-form';
import { prescriptionsApi } from '@/lib/api/prescriptions.api';
import type { BookVisitDetail } from '@/lib/api/medical-books.api';

vi.mock('@/lib/api/prescriptions.api', () => ({
  prescriptionsApi: {
    share: vi.fn(),
    replace: vi.fn(),
    prescriptionErrorMessage: vi.fn((_err, fallback) => fallback),
  },
}));

const issuedVisit: BookVisitDetail = {
  id: 'enc-rx-1',
  encounterType: 'HOME_VISIT',
  scheduledDate: '2026-11-25',
  scheduledTime: '14:00',
  doctorName: 'BS. Trần Minh Tâm',
  isFinalized: true,
  exam: {
    chiefComplaint: 'Đau đầu nhẹ',
    clinicalFindings: 'Tim đều',
    icd10Code: 'I10',
    icd10Diagnosis: 'Tăng huyết áp vô căn',
    treatmentPlan: 'Đo HA hằng ngày',
  },
  finalizedAt: '2026-11-25T15:00:00+07:00',
  recipient: { id: 'rep-1', name: 'Nguyễn Văn A' },
  patient: {
    id: 'pat-1',
    fullName: 'Nguyễn Văn A',
    familyId: 'fam-1',
    dateOfBirth: '1958-01-01',
    relationshipToHead: 'HEAD',
    gender: 'MALE',
  },
  prescription: {
    id: 'rx-old-1',
    prescriptionCode: 'RX-2026-089',
    status: 'ISSUED',
    instructions: 'Uống đều mỗi sáng sau ăn',
    prescribedDate: '2026-11-25',
    validUntil: '2026-12-25',
    clinicalContext: {},
    details: [
      {
        id: 'line-1',
        medicationType: 'SINGLE_INGREDIENT',
        medicationName: 'Amlodipine',
        strength: '5mg',
        administrationRoute: 'Uống',
        dosage: '1 viên',
        frequency: 'Sáng sau ăn',
        durationDays: 30,
        quantity: 30,
        unit: 'viên',
      },
    ],
  },
};

describe('PrescriptionForm — Lock issued & D4 replacement modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prescriptionsApi.share).mockResolvedValue({ ok: true } as any);
    vi.mocked(prescriptionsApi.replace).mockResolvedValue({ id: 'rx-new-1', prescriptionCode: 'RX-NEW-1' } as any);
  });

  it('locks direct editing when prescription is already issued and shows Hủy đơn cũ & Lập đơn thay thế', () => {
    render(<PrescriptionForm visit={issuedVisit} onConfirmed={vi.fn()} />);

    expect(
      screen.getByText(/Đơn thuốc đã phát hành \(Đã khóa — Không thể sửa đè\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Hủy đơn cũ & Lập đơn thay thế/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Lưu đơn/i })).not.toBeInTheDocument();
  });

  it('requires replacementReason in D4 modal and submits replacement when valid', async () => {
    const user = userEvent.setup();
    const onConfirmed = vi.fn();
    render(<PrescriptionForm visit={issuedVisit} onConfirmed={onConfirmed} />);

    await user.click(screen.getByRole('button', { name: /Hủy đơn cũ & Lập đơn thay thế/i }));

    const submitBtn = screen.getByRole('button', {
      name: /Xác nhận Hủy đơn cũ & Phát hành đơn thay thế/i,
    });
    expect(submitBtn).toBeDisabled();

    await user.type(
      screen.getByLabelText(/Lý do hủy đơn cũ/i),
      'Điều chỉnh hàm lượng Amlodipine từ 5mg lên 10mg',
    );
    expect(submitBtn).toBeEnabled();

    await user.click(submitBtn);

    await waitFor(() => {
      expect(prescriptionsApi.replace).toHaveBeenCalledWith(
        'rx-old-1',
        expect.objectContaining({
          replacementReason: 'Điều chỉnh hàm lượng Amlodipine từ 5mg lên 10mg',
          details: expect.arrayContaining([
            expect.objectContaining({ medicationName: 'Amlodipine' }),
          ]),
        }),
      );
      expect(prescriptionsApi.share).not.toHaveBeenCalled();
      expect(onConfirmed).toHaveBeenCalled();
    });
  });
});

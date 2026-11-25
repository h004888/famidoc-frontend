import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EncounterItem } from '@/lib/api/encounters.api';
import { encountersApi } from '@/lib/api/encounters.api';
import { reviewsApi } from '@/lib/api/reviews.api';
import { FamilyVisitConfirmModal } from '@/features/appointments/components/family-visit-confirm-modal';

vi.mock('@/lib/api/encounters.api', () => ({
  encountersApi: {
    confirmArrival: vi.fn(),
  },
}));

vi.mock('@/lib/api/reviews.api', () => ({
  reviewsApi: {
    submitDoctorReview: vi.fn(),
    submitComplaint: vi.fn(),
  },
}));

const sampleEncounter: EncounterItem = {
  id: 'enc-101',
  contractId: 'contract-101',
  doctorId: 'doc-101',
  scheduledDate: '2026-11-25',
  scheduledTime: '14:00',
  encounterType: 'HOME_VISIT',
  category: 'PERIODIC_ROUTINE',
  encounterStatus: 'CONFIRMED',
  doctor: { id: 'doc-101', doctorName: 'BS. Trần Minh Tâm' },
};

describe('FamilyVisitConfirmModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(encountersApi.confirmArrival).mockResolvedValue(sampleEncounter);
    vi.mocked(reviewsApi.submitDoctorReview).mockResolvedValue({ id: 'rev-1', success: true });
    vi.mocked(reviewsApi.submitComplaint).mockResolvedValue({
      id: 'cmp-1',
      complaintCode: 'CMP-001',
      contractId: 'contract-101',
      complaintCategory: 'DOCTOR_ABSENT',
      description: 'Quá giờ hẹn',
      status: 'SUBMITTED',
      createdAt: '2026-11-25T15:00:00Z',
    });
  });

  it('F3a: confirms arrival and submits doctor review when rating is submitted', async () => {
    const user = userEvent.setup();
    const onCompleted = vi.fn();
    render(
      <FamilyVisitConfirmModal
        open
        mode="ARRIVED"
        encounter={sampleEncounter}
        onClose={vi.fn()}
        onCompleted={onCompleted}
      />,
    );

    expect(screen.getByText(/Bước 1\/2: Xác nhận/i)).toBeInTheDocument();
    expect(screen.getByText(/Bước 2\/2: Đánh giá buổi khám/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '4 sao' }));
    await user.type(screen.getByLabelText(/Lời nhắn thêm/i), 'Bác sĩ khám kỹ');
    await user.click(screen.getByRole('button', { name: /Gửi đánh giá/i }));

    await waitFor(() => {
      expect(encountersApi.confirmArrival).toHaveBeenCalledWith('enc-101');
      expect(reviewsApi.submitDoctorReview).toHaveBeenCalledWith({
        doctorId: 'doc-101',
        rating: 4,
        comment: 'Bác sĩ khám kỹ',
      });
      expect(onCompleted).toHaveBeenCalledWith({ action: 'ARRIVED', reviewed: true });
    });
  });

  it('F3a: confirms arrival without submitting review when user clicks skip', async () => {
    const user = userEvent.setup();
    const onCompleted = vi.fn();
    render(
      <FamilyVisitConfirmModal
        open
        mode="ARRIVED"
        encounter={sampleEncounter}
        onClose={vi.fn()}
        onCompleted={onCompleted}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Để sau, đóng lại/i }));

    await waitFor(() => {
      expect(encountersApi.confirmArrival).toHaveBeenCalledWith('enc-101');
      expect(reviewsApi.submitDoctorReview).not.toHaveBeenCalled();
      expect(onCompleted).toHaveBeenCalledWith({ action: 'ARRIVED', reviewed: false });
    });
  });

  it('F3b: hides star rating and submits NO_SHOW complaint without calling confirmArrival', async () => {
    const user = userEvent.setup();
    const onCompleted = vi.fn();
    render(
      <FamilyVisitConfirmModal
        open
        mode="NO_SHOW"
        encounter={sampleEncounter}
        onClose={vi.fn()}
        onCompleted={onCompleted}
      />,
    );

    expect(screen.queryByRole('button', { name: '4 sao' })).not.toBeInTheDocument();
    expect(screen.getByText(/tạm khóa để Vận hành/i)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Đã quá giờ hẹn, bác sĩ không đến/i));
    await user.type(
      screen.getByLabelText(/Ghi thêm chi tiết/i),
      'Gia đình đợi đến 15:00 không thấy BS',
    );
    await user.click(screen.getByRole('button', { name: /Gửi báo cáo sự cố/i }));

    await waitFor(() => {
      expect(encountersApi.confirmArrival).not.toHaveBeenCalled();
      expect(reviewsApi.submitDoctorReview).not.toHaveBeenCalled();
      expect(reviewsApi.submitComplaint).toHaveBeenCalledWith({
        contractId: 'contract-101',
        encounterId: 'enc-101',
        category: 'DOCTOR_ABSENT',
        description:
          'Đã quá giờ hẹn, bác sĩ không đến — Gia đình đợi đến 15:00 không thấy BS',
      });
      expect(onCompleted).toHaveBeenCalledWith({ action: 'NO_SHOW' });
    });
  });

  it('F3b: shows clear Vietnamese error and stays open when API fails', async () => {
    const user = userEvent.setup();
    const onCompleted = vi.fn();
    vi.mocked(reviewsApi.submitComplaint).mockRejectedValueOnce(new Error('Network error'));

    render(
      <FamilyVisitConfirmModal
        open
        mode="NO_SHOW"
        encounter={sampleEncounter}
        onClose={vi.fn()}
        onCompleted={onCompleted}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Gửi báo cáo sự cố/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Network error|Không thể gửi/i);
    });
    expect(onCompleted).not.toHaveBeenCalled();
  });
});

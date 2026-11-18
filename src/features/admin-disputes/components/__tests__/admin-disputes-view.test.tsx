import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { adminApi, type AdminComplaint, type AdminComplaintDetail } from '@/lib/api/admin.api';
import { AdminDisputesView } from '../admin-disputes-view';

vi.mock('@/lib/api/admin.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/admin.api')>()),
  adminApi: {
    complaints: vi.fn(),
    facilityComplaints: vi.fn(),
    complaint: vi.fn(),
    updateComplaint: vi.fn(),
  },
}));

const familyComplaint: AdminComplaint = {
  id: 'family-complaint',
  complaintCode: 'CP-FAMILY',
  complaintCategory: 'MISSED_VISIT',
  description: 'Gia đình cần xác minh lịch khám.',
  status: 'SUBMITTED',
  createdAt: '2026-11-17T12:00:00Z',
  contractId: 'contract-id',
};

const doctorComplaint: AdminComplaint = {
  ...familyComplaint,
  id: 'doctor-complaint',
  complaintCode: 'CP-DOCTOR',
  description: 'Bác sĩ cần xác minh thông tin hợp đồng.',
};

describe('Admin complaint tabs', () => {
  it('loads complaints by sender before pagination and resets page when changing tabs', async () => {
    vi.mocked(adminApi.complaints).mockImplementation(async ({ complainantRole, page }) => ({
      items: [complainantRole === 'FAMILY_REP' ? familyComplaint : doctorComplaint],
      total: 21,
      page,
      limit: 20,
    }));
    const user = userEvent.setup();
    render(<AdminDisputesView />);

    expect(await screen.findByText('CP-FAMILY')).toBeInTheDocument();
    expect(adminApi.complaints).toHaveBeenLastCalledWith({
      page: 1,
      status: undefined,
      complainantRole: 'FAMILY_REP',
    });
    await user.click(screen.getByRole('button', { name: 'Trang sau' }));
    await waitFor(() =>
      expect(adminApi.complaints).toHaveBeenLastCalledWith({
        page: 2,
        status: undefined,
        complainantRole: 'FAMILY_REP',
      })
    );

    await user.click(screen.getByRole('tab', { name: 'Bác sĩ' }));
    expect(await screen.findByText('CP-DOCTOR')).toBeInTheDocument();
    expect(screen.queryByText('CP-FAMILY')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Trạng thái khiếu nại'), { target: { value: 'INVESTIGATING' } });
    await waitFor(() =>
      expect(adminApi.complaints).toHaveBeenLastCalledWith({
        page: 1,
        status: 'INVESTIGATING',
        complainantRole: 'DOCTOR',
      })
    );
  });

  it('keeps the facility page on its own list without sender tabs', async () => {
    vi.mocked(adminApi.facilityComplaints).mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
    render(<AdminDisputesView facility />);

    expect(await screen.findByText('Chưa có khiếu nại.')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(adminApi.facilityComplaints).toHaveBeenLastCalledWith({ page: 1, status: undefined });
  });

  it('allows Admin to open modal and investigate a SUBMITTED complaint', async () => {
    vi.mocked(adminApi.complaints).mockResolvedValue({
      items: [familyComplaint],
      total: 1,
      page: 1,
      limit: 20,
    });
    const detail: AdminComplaintDetail = {
      ...familyComplaint,
      contract: { contractNumber: 'CTR-2026-001', facility: { facilityName: 'BV Bạch Mai' } },
    };
    vi.mocked(adminApi.complaint).mockResolvedValue(detail);
    vi.mocked(adminApi.updateComplaint).mockResolvedValue({ ...detail, status: 'INVESTIGATING' });

    render(<AdminDisputesView />);

    expect(await screen.findByText('CP-FAMILY')).toBeInTheDocument();
    const actionBtn = screen.getByRole('button', { name: /Thụ lý ngay|Xem chi tiết CP-FAMILY/i });
    fireEvent.click(actionBtn);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Quy trình Thụ lý & Phán quyết Khiếu nại/i)).toBeInTheDocument();

    const investigateBtn = screen.getByRole('button', { name: /Tiếp nhận & Thụ lý hồ sơ/i });
    fireEvent.click(investigateBtn);

    await waitFor(() => {
      expect(adminApi.updateComplaint).toHaveBeenCalledWith('family-complaint', { action: 'INVESTIGATE' });
    });
  });

  it('allows Admin to issue final resolution when facility has submitted verification', async () => {
    const investigatingComplaint: AdminComplaint = {
      ...familyComplaint,
      status: 'INVESTIGATING',
      facilityReviewedAt: '2026-11-18T10:00:00Z',
    };
    vi.mocked(adminApi.complaints).mockResolvedValue({
      items: [investigatingComplaint],
      total: 1,
      page: 1,
      limit: 20,
    });
    const detail: AdminComplaintDetail = {
      ...investigatingComplaint,
      facilityResponse: 'Bác sĩ bị kẹt ca cấp cứu đột xuất, CSYT đã sắp xếp khám bù.',
      contract: { contractNumber: 'CTR-2026-001', facility: { facilityName: 'BV Bạch Mai' } },
    };
    vi.mocked(adminApi.complaint).mockResolvedValue(detail);
    vi.mocked(adminApi.updateComplaint).mockResolvedValue({
      ...detail,
      status: 'RESOLVED',
      resolutionOutcome: 'SERVICE_CORRECTION',
      resolutionNotes: 'Đổi bác sĩ và bù 1 ca khám cho gia đình.',
    });

    render(<AdminDisputesView />);

    expect(await screen.findByText('CP-FAMILY')).toBeInTheDocument();
    const actionBtn = screen.getByRole('button', { name: /Ra phán quyết|Xem chi tiết CP-FAMILY/i });
    fireEvent.click(actionBtn);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Giải trình chuyên môn từ BV Bạch Mai/i)).toBeInTheDocument();

    // Fill notes & submit resolution
    const notesInput = screen.getByLabelText(/Nội dung phán quyết & Hướng khắc phục/i);
    fireEvent.change(notesInput, { target: { value: 'Đổi bác sĩ và bù 1 ca khám cho gia đình.' } });

    const resolveBtn = screen.getByRole('button', { name: /Ban hành Phán Quyết/i });
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(adminApi.updateComplaint).toHaveBeenCalledWith('family-complaint', {
        action: 'RESOLVE',
        outcome: 'NO_VIOLATION',
        notes: 'Đổi bác sĩ và bù 1 ca khám cho gia đình.',
      });
    });
  });
});

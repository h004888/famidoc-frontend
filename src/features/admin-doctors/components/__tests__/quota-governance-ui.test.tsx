import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { FacilityStaffView } from '@/features/facility-staff/components/facility-staff-view';
import { AdminQuotaProposalsPanel } from '../admin-quota-proposals-panel';
import { doctorsApi } from '@/lib/api/doctors.api';

vi.mock('@/lib/api/doctors.api', () => ({
  doctorsApi: {
    getFacilityDoctors: vi.fn(),
    createFacilityDoctor: vi.fn(),
    facilityApproveCredentials: vi.fn(),
    getFacilityQuotaProposals: vi.fn(),
    createQuotaProposal: vi.fn(),
    getAdminQuotaProposals: vi.fn(),
    reviewQuotaProposal: vi.fn(),
  },
}));

describe('Quota Governance UI (Task 5.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('FacilityStaffView allows submitting a quota adjustment proposal for an ACTIVE doctor', async () => {
    vi.mocked(doctorsApi.getFacilityDoctors).mockResolvedValue([
      {
        id: 'doc-1',
        doctorName: 'BS. Nguyễn Văn An',
        specialty: 'Y học gia đình',
        onboardingStatus: 'ACTIVE',
        activePanelCount: 25,
        activeAndHeldCount: 27,
        maxPanelCapacity: 30,
      },
    ]);
    vi.mocked(doctorsApi.getFacilityQuotaProposals).mockResolvedValue([]);
    vi.mocked(doctorsApi.createQuotaProposal).mockResolvedValue({
      id: 'prop-new',
      doctorId: 'doc-1',
      facilityId: 'fac-1',
      currentMaxPanel: 30,
      requestedMaxPanel: 40,
      reason: 'Có thêm 2 điều dưỡng hỗ trợ',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });

    render(<FacilityStaffView />);

    await waitFor(() => {
      expect(screen.getAllByText('BS. Nguyễn Văn An').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Đề xuất Quota' }));
    expect(
      screen.getByText('Đề xuất điều chỉnh Quota hộ gia đình')
    ).toBeInTheDocument();

    const maxInput = screen.getByRole('spinbutton');
    fireEvent.change(maxInput, { target: { value: '40' } });

    const reasonBox = screen.getByPlaceholderText(/Bổ sung điều dưỡng/i);
    fireEvent.change(reasonBox, {
      target: { value: 'Có thêm 2 điều dưỡng hỗ trợ' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Gửi đề xuất lên Admin' })
    );

    await waitFor(() => {
      expect(doctorsApi.createQuotaProposal).toHaveBeenCalledWith('doc-1', {
        requestedMaxPanel: 40,
        reason: 'Có thêm 2 điều dưỡng hỗ trợ',
      });
    });
  });

  it('AdminQuotaProposalsPanel approves and rejects quota proposals', async () => {
    vi.mocked(doctorsApi.getAdminQuotaProposals).mockResolvedValue({
      total: 2,
      items: [
        {
          id: 'prop-1',
          doctorId: 'doc-1',
          facilityId: 'fac-1',
          currentMaxPanel: 30,
          requestedMaxPanel: 40,
          activeAndHeldCount: 28,
          reason: 'Mở rộng đội ngũ điều dưỡng',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          doctor: { id: 'doc-1', doctorName: 'BS. Nguyễn Văn An' },
          facility: { id: 'fac-1', facilityName: 'Phòng khám FamiDoc' },
        },
      ],
    });
    vi.mocked(doctorsApi.reviewQuotaProposal).mockResolvedValue({
      id: 'prop-1',
      doctorId: 'doc-1',
      facilityId: 'fac-1',
      currentMaxPanel: 30,
      requestedMaxPanel: 40,
      reason: 'Mở rộng đội ngũ điều dưỡng',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    });

    render(<AdminQuotaProposalsPanel />);

    await waitFor(() => {
      expect(screen.getByTestId('quota-proposal-row-prop-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Phê duyệt' }));

    await waitFor(() => {
      expect(doctorsApi.reviewQuotaProposal).toHaveBeenCalledWith('prop-1', {
        action: 'APPROVE',
        reviewNote: expect.stringContaining('40'),
      });
    });

    // Test nhánh Từ chối
    const row = screen.getByTestId('quota-proposal-row-prop-1');
    fireEvent.click(within(row).getByRole('button', { name: 'Từ chối' }));
    const noteBox = screen.getByPlaceholderText(/Nhập lý do từ chối/i);
    fireEvent.change(noteBox, {
      target: { value: 'Chưa đủ nhân sự hỗ trợ thực tế' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận từ chối' }));

    await waitFor(() => {
      expect(doctorsApi.reviewQuotaProposal).toHaveBeenCalledWith('prop-1', {
        action: 'REJECT',
        reviewNote: 'Chưa đủ nhân sự hỗ trợ thực tế',
      });
    });
  });
});

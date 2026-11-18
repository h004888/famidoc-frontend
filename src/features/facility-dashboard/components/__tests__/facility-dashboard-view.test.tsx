import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FacilityDashboardView } from '../facility-dashboard-view';
import { facilitiesApi } from '@/lib/api/facilities.api';
import { contractsApi } from '@/lib/api/contracts.api';

vi.mock('@/lib/api/facilities.api', () => ({
  facilitiesApi: {
    getMyFacilityProfile: vi.fn(),
  },
}));

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: {
    getStaffingContracts: vi.fn(),
  },
}));

describe('FacilityDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValue({
      id: 'FAC-1',
      facilityName: 'Bệnh viện An Sinh',
      verificationStatus: 'ACTIVE',
      status: 'ACTIVE',
    } as any);
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValue({ data: [], total: 0 });
  });

  it('renders 4 KPI cards, 3 SLA progress bars, Fast-Track referrals, and service channel chart', () => {
    const { container } = render(<FacilityDashboardView />);

    // 4 KpiStatCards
    expect(screen.getByText('Bác sĩ trực thuộc')).toBeInTheDocument();
    expect(screen.getByText('Lượt khám tháng này')).toBeInTheDocument();
    expect(screen.getByText('Chỉ số SLA đáp ứng')).toBeInTheDocument();
    expect(screen.getByText('Doanh thu B2B tạm tính')).toBeInTheDocument();

    // 3 SLA Progress bars
    expect(screen.getByRole('progressbar', { name: 'Tỷ lệ đáp ứng lịch khám' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Công suất Panel Cap' })).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Thời gian phản hồi cấp cứu Fast-Track' })
    ).toBeInTheDocument();

    // Fast-Track referrals
    expect(screen.getByText('Luồng Tiếp Nhận Fast-Track Chuyển Viện')).toBeInTheDocument();
    expect(screen.getByText('Lê Văn Nam (65 tuổi)')).toBeInTheDocument();
    expect(screen.getByText('Khẩn cấp')).toBeInTheDocument();

    // Channel distribution chart + breakdown
    expect(screen.getByText('Phân Bổ Kênh Dịch Vụ Y Tế')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="chart"]')).toBeTruthy();
    expect(screen.getByText('58% (824 ca)')).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });

  it('displays dynamic B2B signing banner for PENDING_FACILITY_SIGNATURE and hides it for REVISION_REQUESTED', async () => {
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValueOnce({
      data: [
        {
          id: 'stf-1',
          contractNumber: 'STF-2026-082',
          facilityId: 'FAC-1',
          facilityName: 'Bệnh viện An Sinh',
          facilitySharePercent: 82,
          platformSharePercent: 18,
          validFrom: '2026-11-01',
          validTo: '2027-11-01',
          status: 'DRAFT',
          rawStatus: 'PENDING_FACILITY_SIGNATURE',
          facilitySigned: false,
          adminSigned: false,
        },
      ],
      total: 1,
    });

    const { unmount } = render(<FacilityDashboardView />);
    expect(await screen.findByText(/STF-2026-082 \(82% Doanh thu CSYT\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ký số Bước 1/i)).toBeInTheDocument();
    unmount();

    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValueOnce({
      data: [
        {
          id: 'stf-2',
          contractNumber: 'STF-2026-REV',
          facilityId: 'FAC-1',
          facilityName: 'Bệnh viện An Sinh',
          facilitySharePercent: 80,
          platformSharePercent: 20,
          validFrom: '2026-11-01',
          validTo: '2027-11-01',
          status: 'DRAFT',
          rawStatus: 'REVISION_REQUESTED',
          facilitySigned: false,
          adminSigned: false,
        },
      ],
      total: 1,
    });

    render(<FacilityDashboardView />);
    await waitFor(() => {
      expect(contractsApi.getStaffingContracts).toHaveBeenCalledTimes(2);
    });
    expect(screen.queryByText(/STF-2026-REV/i)).not.toBeInTheDocument();
  });
});

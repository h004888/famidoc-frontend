import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FacilityDashboardView } from '../facility-dashboard-view';
import { facilitiesApi, type FacilityOverviewDto } from '@/lib/api/facilities.api';
import { contractsApi } from '@/lib/api/contracts.api';

vi.mock('@/lib/api/facilities.api', () => ({
  facilitiesApi: {
    getMyFacilityProfile: vi.fn(),
    getMyOverview: vi.fn(),
  },
}));

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: {
    getStaffingContracts: vi.fn(),
  },
}));

const MOCK_OVERVIEW: FacilityOverviewDto = {
  doctors: {
    total: 2,
    active: 2,
    pending: 0,
    activePanelCount: 1,
    maxPanelCapacity: 10,
    panelUtilizationPercent: 10,
  },
  encounters: {
    month: 11,
    year: 2026,
    total: 2,
    completed: 1,
    inProgress: 0,
    confirmed: 1,
    requested: 0,
    cancelled: 0,
    completionRatePercent: 50,
    byChannel: {
      HOME_VISIT: 0,
      TELEHEALTH: 2,
      FACILITY_VISIT: 0,
    },
  },
  revenue: {
    month: 11,
    year: 2026,
    grossVnd: 1000000,
    facilityShareVnd: 850000,
    platformFeeVnd: 150000,
    invoiceCount: 1,
    facilitySharePercent: 85,
    platformSharePercent: 15,
    activeB2bContractCode: 'B2B-CAMAU-2026',
    activeB2bValidTo: '2027-11-20',
  },
  recentEncounters: [
    {
      id: 'enc-1',
      encounterType: 'TELEHEALTH',
      encounterStatus: 'CONFIRMED',
      scheduledDate: '2026-11-22',
      scheduledTime: '09:30',
      doctorName: 'BS. Nguyễn Văn An',
      specialty: 'Y học gia đình',
      patientNames: ['Trần Thị B'],
      contractNumber: 'HD-2026-0001',
    },
  ],
  pendingRescheduleCount: 1,
};

describe('FacilityDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValue({
      id: 'FAC-1',
      facilityName: 'Bệnh viện Cà Mau',
      verificationStatus: 'ACTIVE',
      status: 'ACTIVE',
      hasActiveStaffingContract: true,
    } as any);
    vi.mocked(facilitiesApi.getMyOverview).mockResolvedValue(MOCK_OVERVIEW);
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValue({ data: [], total: 0 });
  });

  it('renders real KPI cards, capacity progress bars, channel chart, B2B summary, and recent encounters without mock fallbacks', async () => {
    const { container } = render(<FacilityDashboardView />);

    expect(await screen.findByText('Bệnh viện Cà Mau')).toBeInTheDocument();
    expect(screen.getByText('Bác sĩ trực thuộc')).toBeInTheDocument();
    expect(screen.getByText('Lượt khám tháng này')).toBeInTheDocument();
    expect(screen.getAllByText('Tỷ lệ hoàn thành lịch khám').length).toBeGreaterThan(0);
    expect(screen.getByText('Doanh thu B2B tháng này')).toBeInTheDocument();

    expect(screen.getByText('2 đang hoạt động • 0 chờ duyệt')).toBeInTheDocument();
    expect(screen.getByText('B2B-CAMAU-2026')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    expect(screen.getByText('BS. Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('1 đổi lịch chờ duyệt')).toBeInTheDocument();

    expect(screen.getByRole('progressbar', { name: 'Tỷ lệ hoàn thành lịch khám' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Công suất Panel Cap' })).toBeInTheDocument();

    expect(screen.getByText('Phân Bổ Kênh Dịch Vụ Y Tế')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="chart"]')).toBeTruthy();
    expect(screen.getByText('100% (2 ca)')).toBeInTheDocument();

    // Ensure legacy mocks are completely removed
    expect(screen.queryByText('Lê Văn Nam (65 tuổi)')).not.toBeInTheDocument();
    expect(screen.queryByText('B2B-YDUOC-2026')).not.toBeInTheDocument();
    expect(screen.queryByText('58% (824 ca)')).not.toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });

  it('displays honest zero-state when facility has zero encounters and no active B2B contract', async () => {
    vi.mocked(facilitiesApi.getMyOverview).mockResolvedValueOnce({
      doctors: {
        total: 0,
        active: 0,
        pending: 0,
        activePanelCount: 0,
        maxPanelCapacity: 0,
        panelUtilizationPercent: 0,
      },
      encounters: {
        month: 11,
        year: 2026,
        total: 0,
        completed: 0,
        inProgress: 0,
        confirmed: 0,
        requested: 0,
        cancelled: 0,
        completionRatePercent: 0,
        byChannel: { HOME_VISIT: 0, TELEHEALTH: 0, FACILITY_VISIT: 0 },
      },
      revenue: {
        month: 11,
        year: 2026,
        grossVnd: 0,
        facilityShareVnd: 0,
        platformFeeVnd: 0,
        invoiceCount: 0,
        facilitySharePercent: 85,
        platformSharePercent: 15,
        activeB2bContractCode: null,
        activeB2bValidTo: null,
      },
      recentEncounters: [],
      pendingRescheduleCount: 0,
    });

    render(<FacilityDashboardView />);

    expect(
      await screen.findByText('Chưa có lịch khám nào phát sinh tại cơ sở')
    ).toBeInTheDocument();
    expect(screen.getByText('Chưa có HĐ B2B')).toBeInTheDocument();
  });

  it('displays error alert with retry action when getMyOverview fails and does not substitute mock numbers', async () => {
    vi.mocked(facilitiesApi.getMyOverview)
      .mockRejectedValueOnce(new Error('Mất kết nối máy chủ'))
      .mockResolvedValueOnce(MOCK_OVERVIEW);

    render(<FacilityDashboardView />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Mất kết nối máy chủ/i);
    expect(screen.queryByText('Lê Văn Nam (65 tuổi)')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    await waitFor(() => {
      expect(facilitiesApi.getMyOverview).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText('Trần Thị B')).toBeInTheDocument();
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

  it('adjusts dashboard header CTA according to B2B contract active status', async () => {
    vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValueOnce({
      id: 'FAC-1',
      facilityName: 'Bệnh viện An Sinh',
      verificationStatus: 'ACTIVE',
      status: 'ACTIVE',
      hasActiveStaffingContract: false,
    } as any);
    vi.mocked(facilitiesApi.getMyOverview).mockResolvedValueOnce({
      ...MOCK_OVERVIEW,
      revenue: { ...MOCK_OVERVIEW.revenue, activeB2bContractCode: null },
    });
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValueOnce({
      data: [],
      total: 0,
    });

    const { unmount } = render(<FacilityDashboardView />);
    const b2bCta = await screen.findByRole('link', { name: /Hợp đồng Hợp tác B2B/i });
    expect(b2bCta).toHaveAttribute('href', '/facility/contracts');
    expect(screen.queryByRole('link', { name: /Quản lý Bác sĩ/i })).not.toBeInTheDocument();
    unmount();

    vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValueOnce({
      id: 'FAC-1',
      facilityName: 'Bệnh viện An Sinh',
      verificationStatus: 'ACTIVE',
      status: 'ACTIVE',
      hasActiveStaffingContract: true,
    } as any);
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValueOnce({
      data: [],
      total: 0,
    });

    render(<FacilityDashboardView />);
    const doctorsCta = await screen.findByRole('link', { name: /Quản lý Bác sĩ/i });
    expect(doctorsCta).toHaveAttribute('href', '/facility/doctors');
  });
});

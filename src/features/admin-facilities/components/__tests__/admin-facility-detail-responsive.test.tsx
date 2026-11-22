import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminFacilityDetailView } from '../admin-facility-detail-view';
import { facilitiesApi } from '@/lib/api/facilities.api';
import { contractsApi } from '@/lib/api/contracts.api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/api/facilities.api', () => ({
  facilitiesApi: {
    getAdminFacilityDetail: vi.fn(),
    fetchLegalDocumentBlobUrl: vi.fn().mockResolvedValue('blob:mock-doc'),
    verifyLegal: vi.fn(),
  },
}));

vi.mock('@/lib/api/public.api', () => ({
  publicApi: {
    getBanks: vi.fn().mockResolvedValue([
      {
        id: 43,
        name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
        code: 'VCB',
        bin: '970436',
        shortName: 'Vietcombank',
        logo: 'https://api.vietqr.io/img/VCB.png',
        transferSupported: 1,
        lookupSupported: 1,
      },
    ]),
  },
}));

vi.mock('@/lib/api/contracts.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/contracts.api')>();
  return {
    ...actual,
    contractsApi: {
      ...actual.contractsApi,
      getStaffingContracts: vi.fn(),
      createStaffingContract: vi.fn(),
    },
  };
});

const baseActiveFacility = {
  id: 'FAC-1',
  facilityName: 'Bệnh viện Kiểm Thử',
  representativeName: 'Nguyễn Văn A',
  email: 'fac@test.vn',
  phone: '0901234567',
  address: 'Hà Nội',
  operatingLicense: '01293/BYT-GPHĐ',
  taxCode: '0102030405',
  hasLegalDocument: true,
  hasOperatingLicense: true,
  hasBusinessLicense: true,
  onboardingStatus: 'ACTIVE' as const,
  status: 'ACTIVE' as const,
  createdAt: '2026-11-10T08:00:00.000Z',
};

describe('AdminFacilityDetailView Responsive Contracts Table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(facilitiesApi.getAdminFacilityDetail).mockResolvedValue(baseActiveFacility);
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValue({
      data: [
        {
          id: 'CTR-1',
          contractNumber: 'STAFF-2026-001',
          facilityId: 'FAC-1',
          facilityName: 'Bệnh viện Kiểm Thử',
          platformSharePercent: 15,
          facilitySharePercent: 85,
          validFrom: '2026-11-01',
          validTo: '2027-11-01',
          status: 'ACTIVE',
          rawStatus: 'ACTIVE',
          adminSigned: true,
          facilitySigned: true,
        },
      ],
      total: 1,
    });
  });

  it('renders without nested <main> and shows mobile contract cards when switching to CONTRACTS tab', async () => {
    const { container } = render(<AdminFacilityDetailView facilityId="FAC-1" />);

    await screen.findAllByText('Bệnh viện Kiểm Thử');
    expect(container.querySelector('main')).toBeNull();

    const contractsTab = screen.getByRole('button', { name: /5\. Hợp đồng B2B & Ký kết/i });
    fireEvent.click(contractsTab);

    expect(screen.getByTestId('facility-contracts-mobile')).toBeInTheDocument();
  });

  it('displays separate preview buttons for Operating License and Business Registration Certificate on LEGAL tab', async () => {
    render(<AdminFacilityDetailView facilityId="FAC-1" />);
    await screen.findAllByText('Bệnh viện Kiểm Thử');

    const legalTab = screen.getByRole('button', { name: /2\. Hồ sơ pháp lý & GPHĐ/i });
    fireEvent.click(legalTab);

    expect(screen.getByRole('button', { name: /Xem \/ Tải GPHĐ KBCB/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xem \/ Tải Giấy ĐKKD/i })).toBeInTheDocument();
  });

  it('uses real backend contract response with adminSigned=false when creating B2B contract', async () => {
    const createdDto = {
      id: 'real-b2b-uuid',
      contractCode: 'STF-2026-REAL01',
      facilityId: 'FAC-1',
      platformCommissionRate: 15,
      facilityRevenueRate: 85,
      startDate: '2026-11-01',
      endDate: '2027-11-01',
      status: 'PENDING_FACILITY_SIGNATURE',
      facilitySigned: false,
      adminSigned: false,
    };
    vi.mocked(contractsApi.getStaffingContracts)
      .mockResolvedValueOnce({ data: [], total: 0 })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'real-b2b-uuid',
            contractNumber: 'STF-2026-REAL01',
            facilityId: 'FAC-1',
            facilityName: 'Bệnh viện Kiểm Thử',
            platformSharePercent: 15,
            facilitySharePercent: 85,
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
    vi.mocked(contractsApi.createStaffingContract).mockResolvedValue({
      success: true,
      data: createdDto,
    });

    render(<AdminFacilityDetailView facilityId="FAC-1" />);
    await screen.findAllByText('Bệnh viện Kiểm Thử');

    fireEvent.click(screen.getAllByRole('button', { name: /Tạo Hợp Đồng B2B/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /Tạo & Gửi Dự Thảo tới CSYT/i }));

    await waitFor(() => {
      expect(screen.getAllByText('STF-2026-REAL01').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/Admin: Đã ký số duyệt/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Bước 2 - Admin: Chờ CSYT ký trước/i)).toBeInTheDocument();
  });

  it('hides Re-activate button when REJECTED and disables Create B2B Contract when facility is not ACTIVE', async () => {
    vi.mocked(facilitiesApi.getAdminFacilityDetail).mockResolvedValue({
      ...baseActiveFacility,
      onboardingStatus: 'REJECTED',
      status: 'PENDING',
      legalRejectionReason: 'Thiếu dấu đỏ GPHĐ',
    });

    render(<AdminFacilityDetailView facilityId="FAC-1" />);
    await screen.findAllByText('Bệnh viện Kiểm Thử');

    expect(screen.queryByRole('button', { name: /Kích hoạt lại/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tạo Hợp Đồng B2B/i })).toBeDisabled();
  });

  it('disables Approve Legal & Activate when legal documents or metadata are incomplete', async () => {
    vi.mocked(facilitiesApi.getAdminFacilityDetail).mockResolvedValue({
      ...baseActiveFacility,
      onboardingStatus: 'LEGAL_SUBMITTED',
      status: 'PENDING',
      hasOperatingLicense: true,
      hasLegalDocument: true,
      hasBusinessLicense: false,
    });

    render(<AdminFacilityDetailView facilityId="FAC-1" />);
    await screen.findAllByText('Bệnh viện Kiểm Thử');

    expect(
      screen.getByRole('button', { name: /Duyệt Pháp Lý & Kích Hoạt/i }),
    ).toBeDisabled();
  });

  it('displays bankBin, bankCode, and VietQR preview on BANK tab', async () => {
    vi.mocked(facilitiesApi.getAdminFacilityDetail).mockResolvedValue({
      ...baseActiveFacility,
      bankName: 'Vietcombank - Ngân hàng TMCP Ngoại thương Việt Nam',
      bankBin: '970436',
      bankCode: 'VCB',
      bankAccount: '0011002233445',
      bankAccountHolder: 'BV KIEM THU',
    });

    render(<AdminFacilityDetailView facilityId="FAC-1" />);
    await screen.findAllByText('Bệnh viện Kiểm Thử');

    fireEvent.click(screen.getByRole('button', { name: /3\. Thông tin ngân hàng/i }));

    expect(screen.getAllByText(/VCB · 970436/i).length).toBeGreaterThan(0);
    const qrImg = screen.getByAltText(/Mã VietQR VCB/i);
    expect(qrImg.getAttribute('src')).toBe(
      'https://img.vietqr.io/image/970436-0011002233445-compact2.svg?accountName=BV+KIEM+THU'
    );
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { contractsApi } from '@/lib/api';
import { facilitiesApi } from '@/lib/api/facilities.api';
import { FacilityContractInboundView } from '../facility-contract-inbound-view';
import type { FourPartyContract } from '@/features/four-party-contract';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/facility/coordination',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api/facilities.api', () => ({
  facilitiesApi: {
    getMyFacilityProfile: vi.fn().mockResolvedValue({
      facilityName: 'Bệnh viện Nhi Đồng 1',
    }),
  },
}));

const mockContracts: FourPartyContract[] = [
  {
    id: 'ct-4p-001',
    contractNumber: 'HĐ4B-2026-0842',
    status: 'FAMILY_SIGNED',
    packageId: 'pkg-gold',
    packageName: 'Gói Gia Đình Toàn Diện',
    packagePrice: 14400000,
    durationMonths: 12,
    familyId: 'fam-88219',
    familyRepresentativeName: 'Nguyễn Thị Minh Anh',
    familyRepresentativePhone: '0908412678',
    familyRepresentativeEmail: 'minhanh@example.com',
    familyAddress: '142/8 Võ Thị Sáu, Q.3, TP.HCM',
    membersCount: 4,
    facilityId: 'fac-01',
    facilityName: 'Bệnh viện Nhi Đồng 1',
    doctorId: 'doc-01',
    doctorName: 'BS. CKII Trần Minh Tuấn',
    doctorTitle: 'Nội tổng quát & Lão khoa',
    createdAt: '2026-11-17T09:14:00.000Z',
    signatures: {
      family: {
        signedBy: 'Nguyễn Thị Minh Anh',
        signerRole: 'FAMILY',
        signedAt: '2026-11-17T09:14:00.000Z',
        sha256Hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
      },
    },
  },
  {
    id: 'ct-4p-002',
    contractNumber: 'HĐ4B-2026-0819',
    status: 'ACTIVE',
    packageId: 'pkg-silver',
    packageName: 'Gói Tiêu Chuẩn Người Cao Tuổi',
    packagePrice: 6000000,
    durationMonths: 12,
    familyId: 'fam-44012',
    familyRepresentativeName: 'Trần Thị Mai',
    familyRepresentativePhone: '0987654321',
    familyAddress: '45 Lê Văn Sỹ, Q.3, TP.HCM',
    membersCount: 2,
    facilityId: 'fac-01',
    facilityName: 'Bệnh viện Nhi Đồng 1',
    doctorId: 'doc-02',
    doctorName: 'ThS. BS Lê Thu Hà',
    doctorTitle: 'Bác sĩ Gia đình',
    createdAt: '2026-11-15T10:00:00.000Z',
    signatures: {
      family: {
        signedBy: 'Trần Thị Mai',
        signerRole: 'FAMILY',
        signedAt: '2026-11-15T10:30:00.000Z',
        sha256Hash: 'e1f2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
      },
      facility: {
        signedBy: 'Bệnh viện Nhi Đồng 1',
        signerRole: 'FACILITY',
        signedAt: '2026-11-15T14:00:00.000Z',
        sha256Hash: 'c3d4e5f6a1b27890abcdef1234567890abcdef1234567890abcdef1234567892',
      },
      doctor: {
        signedBy: 'ThS. BS Lê Thu Hà',
        signerRole: 'DOCTOR',
        signedAt: '2026-11-15T15:00:00.000Z',
        sha256Hash: 'd3d4e5f6a1b27890abcdef1234567890abcdef1234567890abcdef1234567892',
      },
      platform: {
        signedBy: 'Nền tảng FamiDoc',
        signerRole: 'PLATFORM',
        signedAt: '2026-11-15T16:00:00.000Z',
        sha256Hash: 'f2c3d4e5f6a17890abcdef1234567890abcdef1234567890abcdef1234567891',
      },
    },
  },
];

describe('FacilityContractInboundView (/facility/coordination — 4-Party Queue)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValue({
      facilityName: 'Bệnh viện Nhi Đồng 1',
    } as never);
  });

  it('renders 3 KPI cards, read-only pre-selected doctor, 4-party progress, and "Xem & Ký" link to /facility/coordination/[id]', async () => {
    const { container } = render(
      <FacilityContractInboundView initialContracts={mockContracts} />
    );

    expect(screen.getByRole('heading', { name: 'Hợp đồng Y tế 4 bên' })).toBeInTheDocument();
    expect(screen.getByText('Tổng hợp đồng')).toBeInTheDocument();
    expect(screen.getByText('Chờ CSYT ký')).toBeInTheDocument();
    expect(screen.getByText('Đã ký số CSYT')).toBeInTheDocument();

    expect(screen.getAllByText('HĐ4B-2026-0842').length).toBeGreaterThan(0);
    expect(screen.getAllByText('BS. CKII Trần Minh Tuấn').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1\/4 · Đến lượt CSYT ký/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/4\/4 · Đang hiệu lực/i).length).toBeGreaterThan(0);

    const viewSignLinks = screen.getAllByRole('link', { name: /Xem & Ký/i });
    expect(viewSignLinks.some((el) => el.getAttribute('href') === '/facility/coordination/ct-4p-001')).toBe(true);
    expect(viewSignLinks.some((el) => el.getAttribute('href') === '/facility/coordination/ct-4p-002')).toBe(true);

    // Zero doctor assignment UI or /assign links
    expect(container.querySelector('a[href*="/assign"]')).toBeNull();
    expect(screen.queryByText(/Phân công & Ký số|Chưa phân công/i)).not.toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });

  it('filters contracts by search, package, and status and resets with "Xóa bộ lọc"', () => {
    render(<FacilityContractInboundView initialContracts={mockContracts} />);

    const statusSelect = screen.getByLabelText(/Lọc theo trạng thái/i);
    fireEvent.change(statusSelect, { target: { value: 'READY_FOR_FACILITY' } });
    expect(screen.getAllByText('HĐ4B-2026-0842').length).toBeGreaterThan(0);
    expect(screen.queryByText('HĐ4B-2026-0819')).not.toBeInTheDocument();

    const searchInput = screen.getByLabelText(/Tìm kiếm hồ sơ/i);
    fireEvent.change(searchInput, { target: { value: 'khong-ton-tai' } });

    expect(
      screen.getAllByText(/Không tìm thấy hợp đồng nào phù hợp với bộ lọc hiện tại/i).length
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: /Xóa bộ lọc/i })[0]);

    expect(screen.getAllByText('HĐ4B-2026-0842').length).toBeGreaterThan(0);
    expect(screen.getAllByText('HĐ4B-2026-0819').length).toBeGreaterThan(0);
  });

  it('renders empty queue message when getMedicalContracts returns []', async () => {
    vi.spyOn(contractsApi, 'getMedicalContracts').mockResolvedValueOnce([]);

    render(<FacilityContractInboundView />);

    expect(
      (await screen.findAllByText('Chưa tiếp nhận hợp đồng y tế 4 bên nào.')).length
    ).toBeGreaterThan(0);
  });

  it('renders error alert with "Thử lại" button when getMedicalContracts fails', async () => {
    const getSpy = vi
      .spyOn(contractsApi, 'getMedicalContracts')
      .mockRejectedValueOnce(new Error('Lỗi kết nối máy chủ hợp đồng'))
      .mockResolvedValueOnce(mockContracts);

    render(<FacilityContractInboundView />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Lỗi kết nối máy chủ hợp đồng');

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith({ limit: 100 });
      expect(getSpy).toHaveBeenCalledTimes(2);
      expect(screen.getAllByText('HĐ4B-2026-0842').length).toBeGreaterThan(0);
    });
  });

  it('treats ACTIVE contract with empty signatures as 4/4, excludes it from WAITING_FAMILY, and guards NaN price', () => {
    const activeEmptySigs: FourPartyContract = {
      ...mockContracts[1],
      id: 'ct-4p-active-empty-sigs',
      contractNumber: 'HĐ4B-2026-ACTIVE-NOSIG',
      packagePrice: Number.NaN,
      signatures: {},
    };

    render(<FacilityContractInboundView initialContracts={[activeEmptySigs]} />);

    expect(screen.getAllByText(/4\/4 · Đang hiệu lực/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();

    const statusSelect = screen.getByLabelText(/Lọc theo trạng thái/i);
    fireEvent.change(statusSelect, { target: { value: 'WAITING_FAMILY' } });
    expect(screen.queryByText('HĐ4B-2026-ACTIVE-NOSIG')).not.toBeInTheDocument();
  });
});

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FacilityContractInboundView } from '../facility-contract-inbound-view';
import type { FourPartyContract } from '@/features/four-party-contract';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/facility/contracts',
  useSearchParams: () => new URLSearchParams(),
}));

const mockContracts: FourPartyContract[] = [
  {
    id: 'ct-4p-001',
    contractNumber: 'HD-4P-2026-0001',
    status: 'PLATFORM_SIGNED',
    packageId: 'pkg-gold',
    packageName: 'Gói Chăm Sóc Toàn Diện Gia Đình',
    packagePrice: 9600000,
    durationMonths: 12,
    familyId: 'fam-88219',
    familyRepresentativeName: 'Nguyễn Văn An',
    familyRepresentativePhone: '0912345678',
    familyRepresentativeEmail: 'nguyenvanan@example.com',
    familyAddress: '123 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
    membersCount: 4,
    facilityId: 'fac-01',
    facilityName: 'Phòng khám Đa khoa Quốc tế Medsev',
    createdAt: '2026-11-09T08:00:00.000Z',
    signatures: {
      family: {
        signedBy: 'Nguyễn Văn An',
        signerRole: 'FAMILY',
        signedAt: '2026-11-09T08:30:00.000Z',
        sha256Hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
      },
      platform: {
        signedBy: 'Ban Điều Hành Famidoc',
        signerRole: 'PLATFORM',
        signedAt: '2026-11-09T09:15:00.000Z',
        sha256Hash: 'b2c3d4e5f6a17890abcdef1234567890abcdef1234567890abcdef1234567891',
      },
    },
  },
  {
    id: 'ct-4p-002',
    contractNumber: 'HD-4P-2026-0002',
    status: 'FACILITY_ASSIGNED',
    packageId: 'pkg-silver',
    packageName: 'Gói Tiêu Chuẩn Người Cao Tuổi',
    packagePrice: 6000000,
    durationMonths: 12,
    familyId: 'fam-44012',
    familyRepresentativeName: 'Trần Thị Mai',
    familyRepresentativePhone: '0987654321',
    familyAddress: '45 Lê Văn Sỹ, Quận 3, TP. Hồ Chí Minh',
    membersCount: 2,
    facilityId: 'fac-01',
    facilityName: 'Phòng khám Đa khoa Quốc tế Medsev',
    doctorId: 'doc-02',
    doctorName: 'BS. CKI Lê Thị Kim Oanh',
    doctorTitle: 'Bác sĩ Gia đình',
    createdAt: '2026-11-08T10:00:00.000Z',
    signatures: {
      family: {
        signedBy: 'Trần Thị Mai',
        signerRole: 'FAMILY',
        signedAt: '2026-11-08T10:30:00.000Z',
        sha256Hash: 'e1f2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
      },
      platform: {
        signedBy: 'Ban Điều Hành Famidoc',
        signerRole: 'PLATFORM',
        signedAt: '2026-11-08T11:00:00.000Z',
        sha256Hash: 'f2c3d4e5f6a17890abcdef1234567890abcdef1234567890abcdef1234567891',
      },
      facility: {
        signedBy: 'Đại diện CSYT - TS.BS Vũ Thành',
        signerRole: 'FACILITY',
        signedAt: '2026-11-08T14:00:00.000Z',
        sha256Hash: 'c3d4e5f6a1b27890abcdef1234567890abcdef1234567890abcdef1234567892',
      },
    },
  },
];

describe('FacilityContractInboundView (Màn 1: Tiếp nhận Hợp đồng 4 bên CSYT)', () => {
  it('renders inbound contract list with PLATFORM_SIGNED contracts', () => {
    render(<FacilityContractInboundView initialContracts={mockContracts} />);

    // Check heading & description
    expect(screen.getByText(/Hợp đồng 4 bên tiếp nhận/i)).toBeInTheDocument();
    expect(screen.getByText(/Danh sách hợp đồng dịch vụ bác sĩ gia đình cần phân công và ký số/i)).toBeInTheDocument();

    // Check contract details
    expect(screen.getByText('HD-4P-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getAllByText('Gói Chăm Sóc Toàn Diện Gia Đình').length).toBeGreaterThanOrEqual(1);

    // Check status badge
    expect(screen.getAllByText(/Chờ phân công|Nền tảng đã duyệt/i).length).toBeGreaterThanOrEqual(1);
  });

  it('filters contracts by package name and status', () => {
    render(<FacilityContractInboundView initialContracts={mockContracts} />);

    // Filter by package
    const packageFilter = screen.getByLabelText(/Lọc theo gói/i);
    fireEvent.change(packageFilter, { target: { value: 'pkg-silver' } });

    expect(screen.queryByText('HD-4P-2026-0001')).not.toBeInTheDocument();
    expect(screen.getByText('HD-4P-2026-0002')).toBeInTheDocument();

    // Reset package filter
    fireEvent.change(packageFilter, { target: { value: 'ALL' } });
    expect(screen.getByText('HD-4P-2026-0001')).toBeInTheDocument();

    // Filter by status
    const statusFilter = screen.getByLabelText(/Lọc theo trạng thái/i);
    fireEvent.change(statusFilter, { target: { value: 'PLATFORM_SIGNED' } });

    expect(screen.getByText('HD-4P-2026-0001')).toBeInTheDocument();
    expect(screen.queryByText('HD-4P-2026-0002')).not.toBeInTheDocument();
  });

  it('provides navigation button "Phân công & Ký số" pointing to assignment route', () => {
    render(<FacilityContractInboundView initialContracts={mockContracts} />);

    const assignLink = screen.getByRole('link', { name: /Phân công & Ký số/i });
    expect(assignLink).toBeInTheDocument();
    expect(assignLink).toHaveAttribute('href', '/facility/contracts/ct-4p-001/assign');
  });

  it('conforms to typography standards without font-mono, font-black, or font-extrabold', () => {
    const { container } = render(<FacilityContractInboundView initialContracts={mockContracts} />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });

  it('renders standard header, breadcrumbs, and responsive container layout', () => {
    const { container } = render(<FacilityContractInboundView initialContracts={mockContracts} />);

    // Verify breadcrumbs
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
    expect(screen.getByText('Cơ sở Y tế')).toBeInTheDocument();
    expect(screen.getByText('Điều phối HĐ 4 bên')).toBeInTheDocument();

    // Verify main responsive container
    const mainEl = container.querySelector('main');
    expect(mainEl).toHaveClass('max-w-7xl', 'mx-auto', 'space-y-6');

    // Verify action buttons and badges
    expect(screen.getByRole('button', { name: /Làm mới/i })).toBeInTheDocument();
    expect(screen.getByText('Hệ thống Điều phối CSYT')).toBeInTheDocument();
  });
});

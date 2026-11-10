import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfficialContractViewer } from '../official-contract-viewer';
import type { FourPartyContract } from '@/features/four-party-contract';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const MOCK_ACTIVE_CONTRACT: FourPartyContract = {
  id: 'contract-001',
  contractNumber: 'FMD-2026-REGR821',
  status: 'ACTIVE',
  packageId: 'pkg-family-gold',
  packageName: 'Gói Chăm Sóc Sức Khỏe Toàn Diện Gia Đình (12 Tháng)',
  packagePrice: 9600000,
  durationMonths: 12,
  familyId: 'fam-101',
  familyRepresentativeName: 'Nguyễn Văn An',
  familyRepresentativePhone: '0901234567',
  familyRepresentativeEmail: 'nguyenvanan@example.com',
  familyAddress: '123 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP.HCM',
  facilityId: 'fac-01',
  facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
  facilityAddress: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
  doctorId: 'doc-01',
  doctorName: 'BS. CKII Lê Hoàng Nam',
  doctorTitle: 'Bác sĩ Gia đình Trưởng khoa',
  createdAt: '2026-11-01T09:00:00Z',
  activatedAt: '2026-11-01T10:15:00Z',
  signatures: {
    family: {
      signedBy: 'Nguyễn Văn An',
      signerRole: 'FAMILY',
      signedAt: '2026-11-01T09:15:00Z',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    platform: {
      signedBy: 'FamiDoc Platform TSA CA',
      signerRole: 'PLATFORM',
      signedAt: '2026-11-01T09:30:00Z',
      sha256Hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    },
    facility: {
      signedBy: 'Bệnh viện Đại học Y Dược TP.HCM - Đại diện TS.BS Trần Minh',
      signerRole: 'FACILITY',
      signedAt: '2026-11-01T09:45:00Z',
      sha256Hash: 'b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01a',
    },
    doctor: {
      signedBy: 'BS. CKII Lê Hoàng Nam',
      signerRole: 'DOCTOR',
      signedAt: '2026-11-01T10:00:00Z',
      sha256Hash: 'c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01ab2',
    },
  },
};

describe('Màn 9: OfficialContractViewer (Xem & Tải bản sao Hợp đồng điện tử chính thức)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders official contract viewer with full document and all 4 digital signatures', () => {
    render(<OfficialContractViewer contract={MOCK_ACTIVE_CONTRACT} />);

    expect(screen.getByText(/Bản sao Hợp đồng điện tử chính thức/i)).toBeInTheDocument();
    expect(screen.getAllByText(/FMD-2026-REGR821/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Nguyễn Văn An/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Bệnh viện Đại học Y Dược TP\.HCM/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/BS\. CKII Lê Hoàng Nam/i).length).toBeGreaterThanOrEqual(1);

    // Verify all 4 digital signatures boxes exist
    expect(screen.getByTestId('signature-box-family')).toBeInTheDocument();
    expect(screen.getByTestId('signature-box-platform')).toBeInTheDocument();
    expect(screen.getByTestId('signature-box-facility')).toBeInTheDocument();
    expect(screen.getByTestId('signature-box-doctor')).toBeInTheDocument();
  });

  it('has document viewing toolbar with zoom in, zoom out and reset functionality', () => {
    render(<OfficialContractViewer contract={MOCK_ACTIVE_CONTRACT} />);

    const zoomInBtn = screen.getByRole('button', { name: /Phóng to/i });
    const zoomOutBtn = screen.getByRole('button', { name: /Thu nhỏ/i });
    const zoomResetBtn = screen.getByRole('button', { name: /100%/i });

    expect(zoomInBtn).toBeInTheDocument();
    expect(zoomOutBtn).toBeInTheDocument();
    expect(zoomResetBtn).toBeInTheDocument();

    // Zoom in increases scale
    fireEvent.click(zoomInBtn);
    expect(screen.getByText(/110%/i)).toBeInTheDocument();

    // Zoom out decreases scale
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText(/100%/i)).toBeInTheDocument();
  });

  it('triggers print and download PDF callbacks or defaults', () => {
    const handlePrint = vi.fn();
    const handleDownload = vi.fn();
    window.print = vi.fn();

    render(
      <OfficialContractViewer
        contract={MOCK_ACTIVE_CONTRACT}
        onPrint={handlePrint}
        onDownloadPdf={handleDownload}
      />
    );

    const printBtn = screen.getByRole('button', { name: /In văn bản/i });
    const downloadBtn = screen.getByRole('button', { name: /Tải file PDF/i });

    fireEvent.click(printBtn);
    expect(handlePrint).toHaveBeenCalledTimes(1);

    fireEvent.click(downloadBtn);
    expect(handleDownload).toHaveBeenCalledTimes(1);
  });

  it('renders online security verification section with SHA-256 hash and verification link', () => {
    render(<OfficialContractViewer contract={MOCK_ACTIVE_CONTRACT} />);

    expect(screen.getByText(/Mã chứng thực số & Tra cứu trực tuyến/i)).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/verify\.famidoc\.vn\/contract\/FMD-2026-REGR821/i)).toBeInTheDocument();
    expect(screen.getAllByText(/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855/i).length).toBeGreaterThanOrEqual(1);
  });

  it('conforms to anti-slop rules: no font-mono/black/extrabold, has tabular-nums and print styles', () => {
    const { container } = render(<OfficialContractViewer contract={MOCK_ACTIVE_CONTRACT} />);

    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    expect(container.innerHTML).toContain('tabular-nums');
    expect(container.innerHTML).toMatch(/print:/);
  });
});

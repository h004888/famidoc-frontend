import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminFourPartyReviewView } from '../admin-four-party-review-view';
import type { FourPartyContract } from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  contractsApi: {
    signContract: vi.fn().mockResolvedValue({ signatureHash: 'simulated-platform-hash' }),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/admin/contracts/ct-4p-001/review',
  useParams: () => ({ id: 'ct-4p-001' }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockContract: FourPartyContract = {
  id: 'ct-4p-001',
  contractNumber: 'HD-4P-2026-0001',
  status: 'FAMILY_SIGNED',
  packageId: 'pkg-gold',
  packageName: 'Gói Chăm Sóc Toàn Diện Gia Đình',
  packagePrice: 9600000,
  durationMonths: 12,
  familyId: 'fam-88219',
  familyRepresentativeName: 'Nguyễn Văn An',
  familyRepresentativePhone: '0912345678',
  familyRepresentativeEmail: 'nguyenvanan@example.com',
  familyAddress: '123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
  membersCount: 3,
  members: [
    {
      id: 'm-1',
      name: 'Nguyễn Văn An',
      age: 48,
      relation: 'Chủ hộ',
      chronic: 'Tăng huyết áp độ 1',
      allergies: 'Penicillin',
    },
    {
      id: 'm-2',
      name: 'Trần Thị Cúc',
      age: 72,
      relation: 'Mẹ',
      chronic: 'Đái tháo đường Type 2',
      allergies: 'Không có ghi nhận',
    },
    {
      id: 'm-3',
      name: 'Nguyễn Minh Quân',
      age: 8,
      relation: 'Con trai',
      chronic: 'Hen phế quản nhẹ',
      allergies: 'Hải sản vỏ cứng',
    },
  ],
  facilityId: 'fac-01',
  facilityName: 'Phòng khám Đa khoa Quốc tế Medsev',
  facilityAddress: '456 Lê Văn Sỹ, Phường 2, Tân Bình, TP. Hồ Chí Minh',
  createdAt: '2026-11-09T08:00:00.000Z',
  signatures: {
    family: {
      signedBy: 'Nguyễn Văn An',
      signerRole: 'FAMILY',
      signedAt: '2026-11-09T08:30:00.000Z',
      sha256Hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
      ipAddress: '14.232.208.55',
    },
  },
};

describe('Màn 4: AdminFourPartyReviewView (Platform Contract Review & Sign)', () => {
  it('renders package benefits snapshot and family registration details', () => {
    render(<AdminFourPartyReviewView contract={mockContract} />);

    // Contract Number and Package Info
    expect(screen.getByText(/HD-4P-2026-0001/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Gói Chăm Sóc Toàn Diện Gia Đình/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/12 tháng/i)).toBeInTheDocument();

    // Family Info
    expect(screen.getAllByText(/Nguyễn Văn An/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/0912345678/i)).toBeInTheDocument();
    expect(screen.getByText(/123 Đường Nguyễn Trãi/i)).toBeInTheDocument();

    // Members snapshot
    expect(screen.getByText(/Trần Thị Cúc/i)).toBeInTheDocument();
    expect(screen.getByText(/Nguyễn Minh Quân/i)).toBeInTheDocument();
    expect(screen.getByText(/Đái tháo đường Type 2/i)).toBeInTheDocument();
  });

  it('renders family digital signature details with timestamp and SHA-256 checksum', () => {
    render(<AdminFourPartyReviewView contract={mockContract} />);

    expect(screen.getByText(/Chữ ký số Đại diện Gia đình/i)).toBeInTheDocument();
    expect(screen.getByText(/a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890/i)).toBeInTheDocument();
    expect(screen.getByText(/14\.232\.208\.55/i)).toBeInTheDocument();
  });

  it('opens digital sign modal, completes platform approval, and transitions status to PLATFORM_SIGNED', async () => {
    const handleSignSuccess = vi.fn();
    render(
      <AdminFourPartyReviewView
        contract={mockContract}
        onSignSuccess={handleSignSuccess}
      />,
    );

    // Initial status: Gia đình đã ký
    expect(screen.getAllByText(/Gia đình đã ký/i).length).toBeGreaterThan(0);

    // Open Sign Modal
    const openSignBtn = screen.getByRole('button', {
      name: /Ký số Duyệt Nền tảng|Phê duyệt & Ký số/i,
    });
    fireEvent.click(openSignBtn);

    // Modal should be visible
    expect(screen.getByText(/Xác nhận Ký số Đại diện Nền tảng/i)).toBeInTheDocument();

    // Confirm checkbox
    const confirmCheckbox = screen.getByRole('checkbox', {
      name: /Tôi xác nhận hồ sơ hợp đồng đã được thẩm định tính hợp lệ/i,
    });
    fireEvent.click(confirmCheckbox);

    // Click confirm sign button
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận Ký số/i });
    fireEvent.click(confirmBtn);

    // Wait for transition to PLATFORM_SIGNED
    await waitFor(() => {
      expect(screen.getAllByText(/Nền tảng đã duyệt/i).length).toBeGreaterThan(0);
    });

    expect(
      screen.getByText(/Đã ký số phê duyệt thành công! Hợp đồng đã chuyển sang PLATFORM_SIGNED/i),
    ).toBeInTheDocument();

    expect(handleSignSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PLATFORM_SIGNED',
        signatures: expect.objectContaining({
          platform: expect.objectContaining({
            signerRole: 'PLATFORM',
            signedBy: expect.any(String),
          }),
        }),
      }),
    );
  });

  it('calls contractsApi.signContract when platform signs the contract', async () => {
    render(<AdminFourPartyReviewView contract={mockContract} />);

    const openSignBtn = screen.getByRole('button', {
      name: /Ký số Duyệt Nền tảng|Phê duyệt & Ký số/i,
    });
    fireEvent.click(openSignBtn);

    const confirmCheckbox = screen.getByRole('checkbox', {
      name: /Tôi xác nhận hồ sơ hợp đồng đã được thẩm định tính hợp lệ/i,
    });
    fireEvent.click(confirmCheckbox);

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận Ký số/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(contractsApi.signContract).toHaveBeenCalledWith('ct-4p-001', expect.any(Object));
    });
  });

  it('renders full contract sheet when switched to full view tab', () => {
    render(<AdminFourPartyReviewView contract={mockContract} />);

    const fullSheetTab = screen.getByRole('tab', { name: /Toàn văn Hợp đồng/i });
    fireEvent.click(fullSheetTab);

    expect(screen.getByText(/CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/i)).toBeInTheDocument();
    expect(screen.getByTestId('signature-box-platform')).toBeInTheDocument();
  });

  it('complies with typography design system (no font-mono, font-black, or font-extrabold)', () => {
    const { container } = render(<AdminFourPartyReviewView contract={mockContract} />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });
});

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DoctorContractReviewView } from '../doctor-contract-review-view';
import type { FourPartyContract } from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  contractsApi: {
    signContract: vi.fn().mockResolvedValue({ signatureHash: 'simulated-doctor-hash' }),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/doctor/contracts/ct-4p-001/review',
  useParams: () => ({ id: 'ct-4p-001' }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockContract: FourPartyContract = {
  id: 'ct-4p-001',
  contractNumber: 'HD-4P-2026-0001',
  status: 'FACILITY_ASSIGNED',
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
      chronic: 'Đái tháo đường Type 2, Thoái hóa khớp',
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
  doctorId: 'doc-01',
  doctorName: 'BS. CKII Lê Hoàng Nam',
  doctorTitle: 'Bác sĩ Gia đình Chuyên khoa II',
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
    facility: {
      signedBy: 'TS.BS Trần Hữu Dũng - GĐ Phòng khám Medsev',
      signerRole: 'FACILITY',
      signedAt: '2026-11-09T10:00:00.000Z',
      sha256Hash: 'c3d4e5f6a1b27890abcdef1234567890abcdef1234567890abcdef1234567892',
    },
  },
};

describe('Màn 3: DoctorContractReviewView (Care Needs Summary & Medical Digital Sign)', () => {
  it('renders Care Needs Summary with demographics, ages, elderly/pediatric tags, chronic conditions, and allergies', () => {
    render(<DoctorContractReviewView contract={mockContract} />);

    // Contract and Family Header
    expect(screen.getByText(/HD-4P-2026-0001/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Gói Chăm Sóc Toàn Diện Gia Đình/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Nguyễn Văn An/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/123 Đường Nguyễn Trãi/i)).toBeInTheDocument();

    // Members list and tags
    expect(screen.getByText(/Trần Thị Cúc/i)).toBeInTheDocument();
    expect(screen.getByText(/72 tuổi/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Cao tuổi/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Đái tháo đường Type 2/i)).toBeInTheDocument();

    expect(screen.getByText(/Nguyễn Minh Quân/i)).toBeInTheDocument();
    expect(screen.getByText(/^8 tuổi/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Trẻ nhỏ/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Hải sản vỏ cứng/i)).toBeInTheDocument();
    expect(screen.getByText(/Hen phế quản nhẹ/i)).toBeInTheDocument();
  });

  it('renders clinical commitment section with primary care doctor responsibilities', () => {
    render(<DoctorContractReviewView contract={mockContract} />);

    expect(
      screen.getByText(/Cam kết trách nhiệm chuyên môn theo dõi sức khỏe ban đầu/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Theo dõi và quản lý hồ sơ sức khỏe điện tử liên tục/i)).toBeInTheDocument();
    expect(screen.getByText(/Bảo mật tuyệt đối thông tin bệnh án y khoa/i)).toBeInTheDocument();
  });

  it('opens digital sign modal, submits doctor signature, and transitions status to DOCTOR_ACCEPTED', async () => {
    const handleSignSuccess = vi.fn();
    render(
      <DoctorContractReviewView contract={mockContract} onSignSuccess={handleSignSuccess} />,
    );

    // Initial state: CSYT đã phân công, waiting doctor accept
    expect(screen.getByText(/CSYT đã phân công/i)).toBeInTheDocument();

    // Open Sign Modal
    const openSignBtn = screen.getByRole('button', {
      name: /Ký số Chấp thuận Chuyên môn|Ký số Y khoa/i,
    });
    fireEvent.click(openSignBtn);

    // Modal dialog should be visible
    expect(screen.getByText(/Xác nhận Ký số Y khoa Chuyên môn/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/BS\. CKII Lê Hoàng Nam/i)).toBeInTheDocument();

    // Fill notes or confirm commitment
    const confirmCheckbox = screen.getByRole('checkbox', {
      name: /Tôi xác nhận đã thẩm định hồ sơ/i,
    });
    fireEvent.click(confirmCheckbox);

    // Click confirm sign button
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận Ký số/i });
    fireEvent.click(confirmBtn);

    // Await transition
    await waitFor(() => {
      expect(screen.getAllByText(/Bác sĩ đã chấp thuận/i).length).toBeGreaterThan(0);
    });

    expect(
      screen.getByText(/Đã ký số y khoa thành công! Hợp đồng đã được chuyển trạng thái sang DOCTOR_ACCEPTED/i),
    ).toBeInTheDocument();

    expect(handleSignSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'DOCTOR_ACCEPTED',
        signatures: expect.objectContaining({
          doctor: expect.objectContaining({
            signerRole: 'DOCTOR',
            signedBy: expect.stringContaining('Lê Hoàng Nam'),
          }),
        }),
      }),
    );
  });

  it('calls contractsApi.signContract when confirming signature', async () => {
    render(<DoctorContractReviewView contract={mockContract} />);

    const openSignBtn = screen.getByRole('button', {
      name: /Ký số Chấp thuận Chuyên môn|Ký số Y khoa/i,
    });
    fireEvent.click(openSignBtn);

    const confirmCheckbox = screen.getByRole('checkbox', {
      name: /Tôi xác nhận đã thẩm định hồ sơ/i,
    });
    fireEvent.click(confirmCheckbox);

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận Ký số/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(contractsApi.signContract).toHaveBeenCalledWith('ct-4p-001', expect.any(Object));
    });
  });

  it('renders full contract sheet when switched to full view tab', () => {
    render(<DoctorContractReviewView contract={mockContract} />);

    const fullSheetTab = screen.getByRole('tab', { name: /Toàn văn Hợp đồng/i });
    fireEvent.click(fullSheetTab);

    expect(
      screen.getByText(/CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('signature-box-doctor')).toBeInTheDocument();
  });

  it('complies with typography design system (no font-mono, font-black, or font-extrabold)', () => {
    const { container } = render(<DoctorContractReviewView contract={mockContract} />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });
});

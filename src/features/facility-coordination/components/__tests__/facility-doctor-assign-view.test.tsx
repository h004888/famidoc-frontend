import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FacilityDoctorAssignView, type AvailableDoctor } from '../facility-doctor-assign-view';
import type { FourPartyContract } from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  contractsApi: {
    assignDoctor: vi.fn().mockResolvedValue({ id: 'ct-4p-001', doctorId: 'doc-01' }),
    signContract: vi.fn().mockResolvedValue({ signatureHash: 'simulated-facility-hash' }),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/facility/contracts/ct-4p-001/assign',
  useParams: () => ({ id: 'ct-4p-001' }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockContract: FourPartyContract = {
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
  familyAddress: '123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
  membersCount: 3,
  members: [
    { id: 'm-1', name: 'Nguyễn Văn An', age: 48, relation: 'Chủ hộ', chronic: 'Tăng huyết áp độ 1', allergies: 'Penicillin' },
    { id: 'm-2', name: 'Trần Thị Mai Phương', age: 45, relation: 'Vợ', chronic: 'Không có', allergies: 'Không có' },
    { id: 'm-3', name: 'Nguyễn Minh Quân', age: 16, relation: 'Con trai', chronic: 'Viêm mũi dị ứng', allergies: 'Hải sản' },
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
    },
    platform: {
      signedBy: 'Ban Điều Hành Famidoc',
      signerRole: 'PLATFORM',
      signedAt: '2026-11-09T09:15:00.000Z',
      sha256Hash: 'b2c3d4e5f6a17890abcdef1234567890abcdef1234567890abcdef1234567891',
    },
  },
};

const mockDoctors: AvailableDoctor[] = [
  {
    id: 'doc-01',
    name: 'BS. CKII Lê Hoàng Nam',
    title: 'Bác sĩ Gia đình Chuyên khoa II',
    specialty: 'Nội tổng quát & Lão khoa',
    currentAssignedHouseholds: 21,
    phone: '0903889901',
    rating: 4.9,
  },
  {
    id: 'doc-02',
    name: 'BS. CKI Lê Thị Kim Oanh',
    title: 'Bác sĩ Chuyên khoa I',
    specialty: 'Nội tim mạch & Huyết áp',
    currentAssignedHouseholds: 28,
    phone: '0903889902',
    rating: 4.8,
  },
  {
    id: 'doc-03',
    name: 'BS. Đỗ Minh Tuấn',
    title: 'Bác sĩ Gia đình',
    specialty: 'Y học Gia đình & Nhi khoa',
    currentAssignedHouseholds: 30, // MAX REACHED!
    phone: '0903889903',
    rating: 4.7,
  },
  {
    id: 'doc-04',
    name: 'BS. Nguyễn Hải Đăng',
    title: 'Bác sĩ Đa khoa',
    specialty: 'Nội khoa tổng quát',
    currentAssignedHouseholds: 31, // EXCEEDED!
    phone: '0903889904',
    rating: 4.6,
  },
];

describe('FacilityDoctorAssignView (Màn 2: Phân công Bác sĩ & Ký số CSYT)', () => {
  it('renders family summary, care package details, and members list', () => {
    render(<FacilityDoctorAssignView contract={mockContract} doctors={mockDoctors} />);

    // Header & Contract info
    expect(screen.getByText(/Phân công Bác sĩ Gia đình & Ký số CSYT/i)).toBeInTheDocument();
    expect(screen.getByText(/HD-4P-2026-0001/i)).toBeInTheDocument();

    // Family and package info
    expect(screen.getAllByText('Nguyễn Văn An').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('0912345678')).toBeInTheDocument();
    expect(screen.getByText('Gói Chăm Sóc Toàn Diện Gia Đình')).toBeInTheDocument();
    expect(screen.getByText(/123 Đường Nguyễn Trãi/i)).toBeInTheDocument();

    // Member list
    expect(screen.getByText(/Trần Thị Mai Phương/i)).toBeInTheDocument();
    expect(screen.getByText(/Nguyễn Minh Quân/i)).toBeInTheDocument();
  });

  it('displays doctors with actual quota ratio (e.g. 21/30 hộ)', () => {
    render(<FacilityDoctorAssignView contract={mockContract} doctors={mockDoctors} />);

    // Check doctor names
    expect(screen.getByText('BS. CKII Lê Hoàng Nam')).toBeInTheDocument();

    // Check quota indicator
    expect(screen.getByText(/21\/30 hộ/i)).toBeInTheDocument();
    expect(screen.getByText(/28\/30 hộ/i)).toBeInTheDocument();
  });

  it('disables selection and displays quota violation warning for doctors with >= 30 households', () => {
    render(<FacilityDoctorAssignView contract={mockContract} doctors={mockDoctors} />);

    // doc-03 has 30/30 (quota limit reached)
    expect(screen.getAllByText(/30\/30 hộ/i).length).toBeGreaterThanOrEqual(1);
    const doc3Btn = screen.getByTestId('select-doctor-doc-03');
    expect(doc3Btn).toBeDisabled();

    // doc-04 has 31/30 (exceeded quota)
    expect(screen.getByText(/31\/30 hộ/i)).toBeInTheDocument();
    const doc4Btn = screen.getByTestId('select-doctor-doc-04');
    expect(doc4Btn).toBeDisabled();

    // doc-01 has 21/30 (available)
    const doc1Btn = screen.getByTestId('select-doctor-doc-01');
    expect(doc1Btn).not.toBeDisabled();

    // Warning text should be visible for capped doctors
    expect(screen.getAllByText(/Đã đạt định biên tối đa|Vượt ngưỡng định biên/i).length).toBeGreaterThanOrEqual(1);
  });

  it('submits digital signature, validates quota < 30, and transitions contract status to FACILITY_ASSIGNED', async () => {
    const handleAssignSuccess = vi.fn();

    render(
      <FacilityDoctorAssignView
        contract={mockContract}
        doctors={mockDoctors}
        onAssignSuccess={handleAssignSuccess}
      />
    );

    // Select available doctor (doc-01)
    const doc1Btn = screen.getByTestId('select-doctor-doc-01');
    fireEvent.click(doc1Btn);

    // Doctor is selected, check selected confirmation
    expect(screen.getByText(/Đã chọn: BS. CKII Lê Hoàng Nam/i)).toBeInTheDocument();

    // Agree to digital signing terms checkbox
    const termsCheckbox = screen.getByLabelText(/Xác nhận phân công bác sĩ và ký duyệt hợp đồng/i);
    fireEvent.click(termsCheckbox);

    // Click Sign & Assign button
    const submitBtn = screen.getByRole('button', { name: /Ký số điện tử & Hoàn tất phân công/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    // Verify success callback is called with updated contract
    await waitFor(() => {
      expect(handleAssignSuccess).toHaveBeenCalledTimes(1);
    });

    const updatedContract = handleAssignSuccess.mock.calls[0][0];
    expect(updatedContract.status).toBe('FACILITY_ASSIGNED');
    expect(updatedContract.doctorId).toBe('doc-01');
    expect(updatedContract.doctorName).toBe('BS. CKII Lê Hoàng Nam');
    expect(updatedContract.signatures.facility).toBeDefined();
    expect(updatedContract.signatures.facility.signerRole).toBe('FACILITY');
    expect(updatedContract.signatures.facility.sha256Hash).toBeDefined();

    // Success UI message appears
    expect(screen.getByText(/Phân công bác sĩ & Ký số CSYT thành công/i)).toBeInTheDocument();
  });

  it('calls contractsApi.assignDoctor and contractsApi.signContract on submission', async () => {
    render(<FacilityDoctorAssignView contract={mockContract} doctors={mockDoctors} />);

    const doc1Btn = screen.getByTestId('select-doctor-doc-01');
    fireEvent.click(doc1Btn);

    const termsCheckbox = screen.getByLabelText(/Xác nhận phân công bác sĩ và ký duyệt hợp đồng/i);
    fireEvent.click(termsCheckbox);

    const submitBtn = screen.getByRole('button', { name: /Ký số điện tử & Hoàn tất phân công/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(contractsApi.assignDoctor).toHaveBeenCalledWith('ct-4p-001', { doctorId: 'doc-01' });
      expect(contractsApi.signContract).toHaveBeenCalledWith('ct-4p-001', expect.any(Object));
    });
  });

  it('conforms to typography standards without font-mono, font-black, or font-extrabold', () => {
    const { container } = render(<FacilityDoctorAssignView contract={mockContract} doctors={mockDoctors} />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });

  it('renders standard header, breadcrumbs, back link, and responsive container layout', () => {
    const { container } = render(<FacilityDoctorAssignView contract={mockContract} doctors={mockDoctors} />);

    // Breadcrumbs & back link
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
    expect(screen.getByText('Cơ sở Y tế')).toBeInTheDocument();
    expect(screen.getByText('Điều phối HĐ 4 bên')).toBeInTheDocument();
    expect(screen.getByText(/Quay lại danh sách tiếp nhận/i)).toBeInTheDocument();

    // Responsive container
    const mainEl = container.querySelector('main');
    expect(mainEl).toHaveClass('max-w-7xl', 'mx-auto', 'space-y-6');

    // System badge
    expect(screen.getByText(/Phân Công Bác Sĩ & Ký Số/i)).toBeInTheDocument();
  });
});

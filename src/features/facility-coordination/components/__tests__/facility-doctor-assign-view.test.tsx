import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FacilityDoctorAssignView, type AvailableDoctor } from '../facility-doctor-assign-view';
import type { FourPartyContract } from '@/features/four-party-contract';
import { contractsApi, publicApi } from '@/lib/api';

vi.mock('@documenso/embed-react', () => ({
  EmbedSignDocument: ({
    token,
    onDocumentCompleted,
  }: {
    token: string;
    onDocumentCompleted?: (detail: unknown) => void;
  }) => (
    <div data-testid="mock-facility-documenso-form" data-token={token}>
      <button
        type="button"
        onClick={() => onDocumentCompleted?.({ completed: true })}
      >
        Hoàn tất ký trên Documenso
      </button>
    </div>
  ),
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    contractsApi: {
      ...actual.contractsApi,
      getMedicalContractById: vi.fn(),
      assignDoctor: vi.fn().mockResolvedValue({ id: 'ct-4p-001', doctorId: 'doc-01' }),
      getSigningSession: vi.fn(),
      syncDocumenso: vi.fn(),
    },
    publicApi: {
      ...actual.publicApi,
      getDoctors: vi.fn(),
    },
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/facility/contracts/ct-4p-001/assign',
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
    currentAssignedHouseholds: 30,
    phone: '0903889903',
    rating: 4.7,
  },
  {
    id: 'doc-04',
    name: 'BS. Nguyễn Hải Đăng',
    title: 'Bác sĩ Đa khoa',
    specialty: 'Nội khoa tổng quát',
    currentAssignedHouseholds: 31,
    phone: '0903889904',
    rating: 4.6,
  },
];

describe('FacilityDoctorAssignView (Phân công Bác sĩ & Ký Documenso CSYT)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contractsApi.getSigningSession).mockResolvedValue({
      contractId: 'ct-4p-001',
      contractNumber: 'HD-4P-2026-0001',
      contractStatus: 'PENDING_APPROVAL',
      signerRole: 'HEALTHCARE_FACILITY',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-facility',
      signingUrl: 'https://sign.famidoc.online/sign/tok-facility',
      signedRoles: ['FAMILY_REP'],
      signedPdfUrl: null,
    });
    vi.mocked(contractsApi.syncDocumenso).mockResolvedValue({
      synced: true,
      contractId: 'ct-4p-001',
      contractStatus: 'PENDING_APPROVAL',
      signedRoles: ['FAMILY_REP', 'HEALTHCARE_FACILITY'],
      signedPdfUrl: null,
    });
  });

  it('loads real contract and doctors by contractId when props are omitted', async () => {
    vi.mocked(contractsApi.getMedicalContractById).mockResolvedValueOnce(mockContract);
    vi.mocked(publicApi.getDoctors).mockResolvedValueOnce({
      items: [
        {
          id: 'doc-01',
          doctorName: 'BS. CKII Lê Hoàng Nam',
          specialty: 'Nội tổng quát',
          academicTitle: 'BSCKII',
          isAvailable: true,
        },
      ],
    });

    render(<FacilityDoctorAssignView contractId="ct-4p-001" />);

    await waitFor(() => {
      expect(contractsApi.getMedicalContractById).toHaveBeenCalledWith('ct-4p-001');
      expect(publicApi.getDoctors).toHaveBeenCalledWith({ facilityId: 'fac-01', limit: 50 });
      expect(screen.getAllByText(/HD-4P-2026-0001/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('mock-facility-documenso-form')).toHaveAttribute(
        'data-token',
        'tok-facility'
      );
    });
  });

  it('renders family summary, care package details, and disables capped doctors (>= 30)', async () => {
    render(<FacilityDoctorAssignView contract={mockContract} doctors={mockDoctors} />);

    expect(screen.getByText(/HD-4P-2026-0001/i)).toBeInTheDocument();
    expect(screen.getAllByText('Nguyễn Văn An').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/21\/30 hộ/i)).toBeInTheDocument();

    expect(screen.getByTestId('select-doctor-doc-03')).toBeDisabled();
    expect(screen.getByTestId('select-doctor-doc-04')).toBeDisabled();
    expect(screen.getByTestId('select-doctor-doc-01')).not.toBeDisabled();

    await waitFor(() => {
      expect(contractsApi.getSigningSession).toHaveBeenCalledWith('ct-4p-001');
    });
  });

  it('calls contractsApi.assignDoctor when saving doctor assignment and syncs Documenso on embed complete', async () => {
    const handleAssignSuccess = vi.fn();

    render(
      <FacilityDoctorAssignView
        contract={mockContract}
        doctors={mockDoctors}
        onAssignSuccess={handleAssignSuccess}
      />
    );

    fireEvent.click(screen.getByTestId('select-doctor-doc-01'));
    fireEvent.click(screen.getByRole('button', { name: /Lưu phân công bác sĩ/i }));

    await waitFor(() => {
      expect(contractsApi.assignDoctor).toHaveBeenCalledWith('ct-4p-001', { doctorId: 'doc-01' });
      expect(handleAssignSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          doctorId: 'doc-01',
          doctorName: 'BS. CKII Lê Hoàng Nam',
        })
      );
    });

    const completeBtn = await screen.findByRole('button', {
      name: /Hoàn tất ký trên Documenso/i,
    });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(contractsApi.syncDocumenso).toHaveBeenCalledWith('ct-4p-001');
    });
  });

  it('conforms to typography standards without tracking-wide, font-black, or font-extrabold', () => {
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

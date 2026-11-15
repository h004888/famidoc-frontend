import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DoctorContractReviewView } from '../doctor-contract-review-view';
import type { FourPartyContract } from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@documenso/embed-react', () => ({
  EmbedSignDocument: ({
    token,
    onDocumentCompleted,
  }: {
    token: string;
    onDocumentCompleted?: (detail: unknown) => void;
  }) => (
    <div data-testid="mock-documenso-form" data-token={token}>
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
      getSigningSession: vi.fn(),
      syncDocumenso: vi.fn(),
    },
  };
});

const mockContract: FourPartyContract = {
  id: 'ct-4p-doc-01',
  contractNumber: 'HD-4P-2026-0001',
  status: 'FAMILY_SIGNED',
  createdAt: '2026-03-31T08:00:00Z',
  packageId: 'pkg-family-comp',
  packageName: 'Gói Chăm Sóc Toàn Diện Gia Đình',
  packagePrice: 6800000,
  durationMonths: 12,
  membersCount: 4,
  familyId: 'fam-101',
  familyRepresentativeName: 'Nguyễn Văn An',
  familyRepresentativePhone: '0912345678',
  familyAddress: '123 Đường Nguyễn Trãi, Quận 1, TP.HCM',
  facilityId: 'fac-01',
  facilityName: 'Phòng khám Đa khoa Quốc tế FamiCare Sài Gòn',
  doctorId: 'doc-01',
  doctorName: 'BS. CKII Lê Hoàng Nam',
  doctorTitle: 'Bác sĩ Gia đình • Phó trưởng khoa Nội tổng quát',
  members: [
    {
      id: 'm1',
      name: 'Nguyễn Văn An',
      age: 38,
      relation: 'Chủ hộ',
      chronic: 'Không',
      allergies: 'Không',
    },
    {
      id: 'm2',
      name: 'Trần Thị Mai Phương',
      age: 65,
      relation: 'Mẹ (Cao tuổi)',
      chronic: 'Tăng huyết áp, Đái tháo đường Type 2',
      allergies: 'Dị ứng Penicillin',
    },
  ],
  signatures: {
    family: {
      signedBy: 'Nguyễn Văn An',
      signerRole: 'FAMILY',
      signedAt: '2026-03-31T08:15:00Z',
      sha256Hash: 'fam-sha256-hash-89a2',
    },
  },
};

describe('DoctorContractReviewView (Documenso 4-Party Contract Review)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contractsApi.getSigningSession).mockResolvedValue({
      contractId: 'ct-4p-doc-01',
      contractNumber: 'HD-4P-2026-0001',
      contractStatus: 'PENDING_APPROVAL',
      signerRole: 'ASSIGNED_DOCTOR',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-doctor',
      signingUrl: 'https://sign.famidoc.online/sign/tok-doctor',
      signedRoles: ['FAMILY_REP'],
      signedPdfUrl: null,
    });
    vi.mocked(contractsApi.syncDocumenso).mockResolvedValue({
      synced: true,
      contractId: 'ct-4p-doc-01',
      contractStatus: 'PENDING_APPROVAL',
      signedRoles: ['FAMILY_REP', 'ASSIGNED_DOCTOR'],
      signedPdfUrl: null,
    });
  });

  it('displays Care Needs Summary including elderly, chronic conditions, and allergies', async () => {
    render(<DoctorContractReviewView contract={mockContract} />);

    expect(screen.getByText(/HD-4P-2026-0001/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Nguyễn Văn An/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Gói Chăm Sóc Toàn Diện Gia Đình/)).toBeInTheDocument();

    expect(screen.getByText('Trần Thị Mai Phương')).toBeInTheDocument();
    expect(screen.getByText(/Tăng huyết áp, Đái tháo đường Type 2/)).toBeInTheDocument();
    expect(screen.getByText(/Dị ứng Penicillin/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('mock-documenso-form')).toHaveAttribute(
        'data-token',
        'tok-doctor'
      );
    });
  });

  it('loads real contract by contractId when members list is empty (post-signature member setup flow)', async () => {
    vi.mocked(contractsApi.getMedicalContractById).mockResolvedValueOnce({
      ...mockContract,
      members: [],
      membersCount: 4,
    });

    render(<DoctorContractReviewView contractId="ct-4p-doc-01" />);

    await waitFor(() => {
      expect(contractsApi.getMedicalContractById).toHaveBeenCalledWith('ct-4p-doc-01');
      expect(screen.getAllByText(/4\s*thành viên/i).length).toBeGreaterThanOrEqual(1);
    });

    expect(
      screen.getByText(/Danh sách hồ sơ sức khỏe từng thành viên sẽ được gia đình bổ sung ngay sau khi hợp đồng được kích hoạt/i)
    ).toBeInTheDocument();
  });

  it('triggers Documenso sync when doctor completes signing on Documenso embed', async () => {
    const handleSignSuccess = vi.fn();

    render(
      <DoctorContractReviewView
        contract={mockContract}
        onSignSuccess={handleSignSuccess}
      />
    );

    const completeBtn = await screen.findByRole('button', {
      name: /Hoàn tất ký trên Documenso/i,
    });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(contractsApi.syncDocumenso).toHaveBeenCalledWith('ct-4p-doc-01');
      expect(handleSignSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'DOCTOR_ACCEPTED',
          signatures: expect.objectContaining({
            doctor: expect.objectContaining({
              signerRole: 'DOCTOR',
            }),
          }),
        })
      );
    });

    expect(
      screen.getByText(/Đã đồng bộ chữ ký Bác sĩ trên Documenso thành công \(2\/4 bên\)/i)
    ).toBeInTheDocument();
  });

  it('displays waiting state when Bên A (FAMILY_REP) has not signed yet (HTTP 409)', async () => {
    vi.mocked(contractsApi.getSigningSession).mockRejectedValueOnce(
      Object.assign(new Error('Chờ Đại diện gia đình (Bên A) ký hợp đồng trước.'), {
        status: 409,
      })
    );

    render(<DoctorContractReviewView contract={mockContract} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Chờ Đại diện gia đình \(Bên A\) ký hợp đồng trước/i)
      ).toBeInTheDocument();
    });
  });

  it('renders full Vietnamese legal document sheet in Full View tab', async () => {
    render(<DoctorContractReviewView contract={mockContract} />);

    fireEvent.click(screen.getByRole('tab', { name: /Toàn văn Hợp đồng & 4 Chữ ký/i }));

    expect(
      screen.getByText(/CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('signature-box-doctor')).toBeInTheDocument();

    await waitFor(() => {
      expect(contractsApi.getSigningSession).toHaveBeenCalled();
    });
  });

  it('complies with medical design system (zero font-mono, font-black, font-extrabold)', async () => {
    const { container } = render(<DoctorContractReviewView contract={mockContract} />);
    await waitFor(() => {
      expect(contractsApi.getSigningSession).toHaveBeenCalled();
    });
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });
});

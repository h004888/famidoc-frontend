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
      downloadSignedPdf: vi.fn(),
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
  members: [],
  signatures: {
    family: {
      signedBy: 'Nguyễn Văn An',
      signerRole: 'FAMILY',
      signedAt: '2026-03-31T08:15:00Z',
      sha256Hash: 'fam-sha256-hash-89a2',
    },
  },
};

describe('DoctorContractReviewView (Documenso signing, tracking & 4/4 PDF preview)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:doctor-signed-pdf');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.mocked(contractsApi.downloadSignedPdf).mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    );
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

  it('renders only back link and Documenso signing embed before doctor signs', async () => {
    render(<DoctorContractReviewView contract={mockContract} />);

    expect(
      screen.getByRole('link', { name: /Quay lại Danh sách Hợp đồng/i })
    ).toHaveAttribute('href', '/doctor/contracts');
    expect(screen.queryByTestId('doctor-post-signing-tracking')).toBeNull();
    expect(screen.queryByTestId('doctor-signed-pdf-preview-section')).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId('mock-documenso-form')).toHaveAttribute(
        'data-token',
        'tok-doctor'
      );
    });
  });

  it('transitions to 4-party tracking view after doctor signs (2/4) without duplicate green banners', async () => {
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
      expect(handleSignSuccess).toHaveBeenCalled();
    });

    expect(
      screen.getByTestId('doctor-post-signing-tracking')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('doctor-signing-progress-count')
    ).toHaveTextContent('2 / 4 bên (50%)');
    expect(screen.getByTestId('doctor-party-status-family')).toHaveTextContent(
      'Đã ký'
    );
    expect(screen.getByTestId('doctor-party-status-doctor')).toHaveTextContent(
      'Đã ký'
    );
    expect(
      screen.getByTestId('doctor-party-status-facility')
    ).toHaveTextContent('Đang chờ ký');
    expect(
      screen.getByTestId('doctor-party-status-platform')
    ).toHaveTextContent('Đang chờ ký');
    expect(screen.queryByTestId('mock-documenso-form')).toBeNull();
  });

  it('renders inline PDF preview when all 4/4 parties have signed', async () => {
    const allSignedContract: FourPartyContract = {
      ...mockContract,
      status: 'PENDING_PAYMENT',
      signatures: {
        ...mockContract.signatures,
        doctor: {
          signedBy: 'BS. CKII Lê Hoàng Nam',
          signerRole: 'DOCTOR',
          signedAt: '2026-03-31T08:20:00Z',
          sha256Hash: 'doc-sha256-hash-1234',
        },
        facility: {
          signedBy: 'Phòng khám Đa khoa Quốc tế FamiCare Sài Gòn',
          signerRole: 'FACILITY',
          signedAt: '2026-03-31T08:25:00Z',
          sha256Hash: 'fac-sha256-hash-5678',
        },
        platform: {
          signedBy: 'Nền tảng FamiDoc',
          signerRole: 'PLATFORM',
          signedAt: '2026-03-31T08:30:00Z',
          sha256Hash: 'adm-sha256-hash-9012',
        },
      },
    };

    render(<DoctorContractReviewView contract={allSignedContract} />);

    expect(
      screen.getByTestId('doctor-signed-pdf-preview-section')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Hợp đồng đã hoàn tất đủ 4\/4 chữ ký/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(contractsApi.downloadSignedPdf).toHaveBeenCalledWith('ct-4p-doc-01');
      expect(screen.getByTestId('doctor-signed-pdf-iframe')).toHaveAttribute(
        'src',
        'blob:doctor-signed-pdf'
      );
    });
  });

  it('displays waiting state when Bên A (FAMILY_REP) has not signed yet (HTTP 409)', async () => {
    vi.mocked(contractsApi.getSigningSession).mockRejectedValueOnce(
      Object.assign(
        new Error('Chờ Đại diện gia đình (Bên A) ký hợp đồng trước.'),
        { status: 409 }
      )
    );

    render(<DoctorContractReviewView contract={mockContract} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Chờ Đại diện gia đình \(Bên A\) ký hợp đồng trước/i)
      ).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminFourPartyReviewView } from '../admin-four-party-review-view';
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
  id: 'ct-4p-admin-01',
  contractNumber: 'HD-4P-2026-0008',
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
  facilityId: 'fac-01',
  facilityName: 'Phòng khám Đa khoa FamiCare',
  doctorId: 'doc-01',
  doctorName: 'BS. Lê Hoàng Nam',
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

describe('AdminFourPartyReviewView (Full-page Documenso signing, tracking & 4/4 PDF preview)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:admin-signed-pdf');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.mocked(contractsApi.downloadSignedPdf).mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    );
    vi.mocked(contractsApi.getSigningSession).mockResolvedValue({
      contractId: 'ct-4p-admin-01',
      contractNumber: 'HD-4P-2026-0008',
      contractStatus: 'PENDING_APPROVAL',
      signerRole: 'ADMIN',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-admin',
      signingUrl: 'https://sign.famidoc.online/sign/tok-admin',
      signedRoles: ['FAMILY_REP'],
      signedPdfUrl: null,
    });
    vi.mocked(contractsApi.syncDocumenso).mockResolvedValue({
      synced: true,
      contractId: 'ct-4p-admin-01',
      contractStatus: 'PENDING_APPROVAL',
      signedRoles: ['FAMILY_REP', 'ADMIN'],
      signedPdfUrl: null,
    });
  });

  it('loads real contract by contractId and mounts DocumensoSigningEmbed', async () => {
    vi.mocked(contractsApi.getMedicalContractById).mockResolvedValueOnce(
      mockContract
    );

    render(<AdminFourPartyReviewView contractId="ct-4p-admin-01" pollingIntervalMs={0} />);

    await waitFor(() => {
      expect(contractsApi.getMedicalContractById).toHaveBeenCalledWith(
        'ct-4p-admin-01'
      );
      expect(screen.getByTestId('mock-documenso-form')).toHaveAttribute(
        'data-token',
        'tok-admin'
      );
    });
  });

  it('transitions to 4-party tracking view after Admin signs (2/4)', async () => {
    const handleSignSuccess = vi.fn();

    render(
      <AdminFourPartyReviewView
        contract={mockContract}
        onSignSuccess={handleSignSuccess}
        pollingIntervalMs={0}
      />
    );

    const completeBtn = await screen.findByRole('button', {
      name: /Hoàn tất ký trên Documenso/i,
    });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(contractsApi.syncDocumenso).toHaveBeenCalledWith('ct-4p-admin-01');
      expect(handleSignSuccess).toHaveBeenCalled();
    });

    expect(screen.getByTestId('admin-post-signing-tracking')).toBeInTheDocument();
    expect(screen.getByText('2 / 4 bên (50%)')).toBeInTheDocument();
  });

  it('renders inline PDF preview when all 4/4 parties have signed', async () => {
    const allSignedContract: FourPartyContract = {
      ...mockContract,
      status: 'PENDING_PAYMENT',
      signatures: {
        ...mockContract.signatures,
        facility: {
          signedBy: 'Phòng khám Đa khoa FamiCare',
          signerRole: 'FACILITY',
          signedAt: '2026-03-31T08:20:00Z',
          sha256Hash: 'fac-hash-1234',
        },
        doctor: {
          signedBy: 'BS. Lê Hoàng Nam',
          signerRole: 'DOCTOR',
          signedAt: '2026-03-31T08:25:00Z',
          sha256Hash: 'doc-hash-5678',
        },
        platform: {
          signedBy: 'Nền tảng FamiDoc',
          signerRole: 'PLATFORM',
          signedAt: '2026-03-31T08:30:00Z',
          sha256Hash: 'adm-hash-9012',
        },
      },
    };

    render(<AdminFourPartyReviewView contract={allSignedContract} pollingIntervalMs={0} />);

    expect(
      screen.getByTestId('admin-signed-pdf-preview-section')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(contractsApi.downloadSignedPdf).toHaveBeenCalledWith('ct-4p-admin-01');
      expect(screen.getByTestId('admin-signed-pdf-iframe')).toHaveAttribute(
        'src',
        'blob:admin-signed-pdf'
      );
    });
  });
});

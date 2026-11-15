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
    },
  };
});

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

describe('AdminFourPartyReviewView (Documenso Platform Review & Sign)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contractsApi.getSigningSession).mockResolvedValue({
      contractId: 'ct-4p-001',
      contractNumber: 'HD-4P-2026-0001',
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
      contractId: 'ct-4p-001',
      contractStatus: 'PENDING_APPROVAL',
      signedRoles: ['FAMILY_REP', 'ADMIN'],
      signedPdfUrl: null,
    });
  });

  it('loads real contract by contractId when contract prop is omitted', async () => {
    vi.mocked(contractsApi.getMedicalContractById).mockResolvedValueOnce(mockContract);

    render(<AdminFourPartyReviewView contractId="ct-4p-001" />);

    await waitFor(() => {
      expect(contractsApi.getMedicalContractById).toHaveBeenCalledWith('ct-4p-001');
      expect(screen.getAllByText(/HD-4P-2026-0001/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('mock-documenso-form')).toHaveAttribute(
        'data-token',
        'tok-admin'
      );
    });
  });

  it('renders package benefits snapshot and family digital signature details', async () => {
    render(<AdminFourPartyReviewView contract={mockContract} />);

    expect(screen.getByText(/HD-4P-2026-0001/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Gói Chăm Sóc Toàn Diện Gia Đình/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Trần Thị Cúc/i)).toBeInTheDocument();
    expect(
      screen.getByText(/a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/14\.232\.208\.55/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(contractsApi.getSigningSession).toHaveBeenCalledWith('ct-4p-001');
    });
  });

  it('triggers Documenso sync when Admin completes signing on Documenso embed', async () => {
    const handleSignSuccess = vi.fn();
    render(
      <AdminFourPartyReviewView
        contract={mockContract}
        onSignSuccess={handleSignSuccess}
      />
    );

    const completeBtn = await screen.findByRole('button', {
      name: /Hoàn tất ký trên Documenso/i,
    });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(contractsApi.syncDocumenso).toHaveBeenCalledWith('ct-4p-001');
      expect(handleSignSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PLATFORM_SIGNED',
          signatures: expect.objectContaining({
            platform: expect.objectContaining({
              signerRole: 'PLATFORM',
            }),
          }),
        })
      );
    });

    expect(
      screen.getByText(/Đã đồng bộ chữ ký Nền tảng trên Documenso \(2\/4 bên\)/i)
    ).toBeInTheDocument();
  });

  it('renders full contract sheet when switched to full view tab', async () => {
    render(<AdminFourPartyReviewView contract={mockContract} />);

    const fullSheetTab = screen.getByRole('tab', { name: /Toàn văn Hợp đồng/i });
    fireEvent.click(fullSheetTab);

    expect(screen.getByText(/CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/i)).toBeInTheDocument();
    expect(screen.getByTestId('signature-box-platform')).toBeInTheDocument();

    await waitFor(() => {
      expect(contractsApi.getSigningSession).toHaveBeenCalled();
    });
  });

  it('complies with typography design system (no tracking-wide, font-black, or font-extrabold)', async () => {
    const { container } = render(<AdminFourPartyReviewView contract={mockContract} />);
    await waitFor(() => {
      expect(contractsApi.getSigningSession).toHaveBeenCalled();
    });
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminContractsView } from '../admin-contracts-view';
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
  EmbedSignDocument: ({ token, host }: { token: string; host?: string }) => (
    <div data-testid="mock-admin-documenso-form" data-token={token} data-host={host} />
  ),
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    contractsApi: {
      ...actual.contractsApi,
      getMedicalContracts: vi.fn(),
      getSigningSession: vi.fn(),
      syncDocumenso: vi.fn(),
    },
  };
});

describe('AdminContractsView (Real API & Documenso Modal)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contractsApi.getMedicalContracts).mockResolvedValue([
      {
        id: 'ct-real-001',
        contractNumber: 'CTR-2026-888',
        status: 'FAMILY_SIGNED',
        createdAt: '2026-04-10T09:00:00Z',
        packageId: 'pkg-1',
        packageName: 'Gói Chăm Sóc Gia Đình Tiêu Chuẩn',
        packagePrice: 5200000,
        durationMonths: 12,
        membersCount: 3,
        familyId: 'fam-1',
        familyRepresentativeName: 'Phạm Hoàng Minh',
        familyRepresentativePhone: '0909123456',
        facilityId: 'fac-1',
        facilityName: 'Phòng khám FamiCare Quận 3',
        doctorId: 'doc-1',
        doctorName: 'BS. Nguyễn Thị Lan',
        members: [],
        signatures: {
          family: {
            signedBy: 'Phạm Hoàng Minh',
            signerRole: 'FAMILY',
            signedAt: '2026-04-10T09:05:00Z',
            sha256Hash: 'Documenso-family',
          },
        },
      },
    ]);

    vi.mocked(contractsApi.getSigningSession).mockResolvedValue({
      contractId: 'ct-real-001',
      contractNumber: 'CTR-2026-888',
      contractStatus: 'PENDING_APPROVAL',
      signerRole: 'ADMIN',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-admin',
      signingUrl: 'https://sign.famidoc.online/sign/tok-admin',
      signedRoles: ['FAMILY_REP'],
      signedPdfUrl: null,
    });
  });

  it('loads real contracts from contractsApi.getMedicalContracts and opens Documenso modal for Bên D signing', async () => {
    render(<AdminContractsView />);

    await waitFor(() => {
      expect(contractsApi.getMedicalContracts).toHaveBeenCalledWith({ limit: 50 });
      expect(screen.getAllByText(/CTR-2026-888/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('Phạm Hoàng Minh').length).toBeGreaterThan(0);
    });

    const signBtn = screen.getAllByRole('button', { name: /Ký trên Documenso/i })[0];
    fireEvent.click(signBtn);

    await waitFor(() => {
      expect(contractsApi.getSigningSession).toHaveBeenCalledWith('ct-real-001');
      expect(screen.getByTestId('mock-admin-documenso-form')).toHaveAttribute(
        'data-token',
        'tok-admin'
      );
    });
  });
});

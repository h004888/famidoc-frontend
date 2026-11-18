import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { B2bDocumensoSignPanel } from '../b2b-documenso-sign-panel';
import { contractsApi } from '@/lib/api';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@documenso/embed-react', () => ({
  EmbedSignDocument: () => <div data-testid="documenso-embed-mock" />,
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    contractsApi: {
      ...actual.contractsApi,
      getStaffingSigningSession: vi.fn(),
      signStaffingContract: vi.fn(),
      syncStaffingDocumenso: vi.fn(),
      fetchStaffingSignedPdfBlobUrl: vi.fn(),
    },
  };
});

describe('B2bDocumensoSignPanel fallback signing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fallback sign action when signingToken is null and calls signStaffingContract for Facility Step 1', async () => {
    const onSyncCompleted = vi.fn();
    vi.mocked(contractsApi.getStaffingSigningSession)
      .mockResolvedValueOnce({
        contractId: 'b2b-1',
        contractCode: 'STF-2026-001',
        status: 'PENDING_FACILITY_SIGNATURE',
        signerRole: 'HEALTHCARE_FACILITY',
        alreadySigned: false,
        canSign: true,
        signingToken: null,
        signingUrl: null,
        facilitySigned: false,
        adminSigned: false,
        signedPdfUrl: null,
      })
      .mockResolvedValueOnce({
        contractId: 'b2b-1',
        contractCode: 'STF-2026-001',
        status: 'PENDING_ADMIN_SIGNATURE',
        signerRole: 'HEALTHCARE_FACILITY',
        alreadySigned: true,
        canSign: false,
        signingToken: null,
        signingUrl: null,
        facilitySigned: true,
        adminSigned: false,
        signedPdfUrl: null,
      });
    vi.mocked(contractsApi.signStaffingContract).mockResolvedValueOnce({} as any);

    render(<B2bDocumensoSignPanel contractId="b2b-1" onSyncCompleted={onSyncCompleted} />);

    const fallbackBox = await screen.findByTestId('b2b-documenso-unavailable');
    expect(fallbackBox).toBeInTheDocument();

    const signBtn = screen.getByRole('button', { name: /Ký xác nhận Bước 1 \(Nội bộ\)/i });
    fireEvent.click(signBtn);

    await waitFor(() => {
      expect(contractsApi.signStaffingContract).toHaveBeenCalledWith('b2b-1', {});
      expect(onSyncCompleted).toHaveBeenCalledTimes(1);
    });
  });

  it('calls signStaffingContract with signedPdfUrl when Admin signs Step 2 without Documenso token', async () => {
    vi.mocked(contractsApi.getStaffingSigningSession).mockResolvedValue({
      contractId: 'b2b-2',
      contractCode: 'STF-2026-002',
      status: 'PENDING_ADMIN_SIGNATURE',
      signerRole: 'ADMIN',
      alreadySigned: false,
      canSign: true,
      signingToken: null,
      signingUrl: null,
      facilitySigned: true,
      adminSigned: false,
      signedPdfUrl: null,
    });
    vi.mocked(contractsApi.signStaffingContract).mockResolvedValueOnce({} as any);

    render(<B2bDocumensoSignPanel contractId="b2b-2" />);

    const signBtn = await screen.findByRole('button', {
      name: /Ký kích hoạt Bước 2 \(Nội bộ\)/i,
    });
    fireEvent.click(signBtn);

    await waitFor(() => {
      expect(contractsApi.signStaffingContract).toHaveBeenCalledWith('b2b-2', {
        signedPdfUrl: 'https://sign.famidoc.online/contracts/staffing/b2b-2/signed.pdf',
      });
    });
  });
});

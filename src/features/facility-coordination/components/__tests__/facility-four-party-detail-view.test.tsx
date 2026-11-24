import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { contractsApi, type MedicalContractDetailDto } from '@/lib/api';
import { FacilityFourPartyDetailView } from '../facility-four-party-detail-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/facility/coordination/ct-4p-001',
}));

vi.mock('@documenso/embed-react', () => ({
  EmbedSignDocument: ({ token }: { token: string }) => (
    <div data-testid="mock-documenso-embed" data-token={token} />
  ),
}));

const baseDetail: MedicalContractDetailDto = {
  id: 'ct-4p-001',
  contractNumber: 'HĐ4B-2026-0842',
  contractStatus: 'PENDING_APPROVAL',
  totalAmount: 14400000,
  startDate: '2026-11-17T00:00:00.000Z',
  endDate: '2027-11-17T00:00:00.000Z',
  createdAt: '2026-11-17T09:08:00.000Z',
  memberCount: 2,
  documensoEnvelopeId: 'env-001',
  signedPdfUrl: null,
  familyUnit: {
    id: 'fam-1',
    homeAddress: '142/8 Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
    emergencyPhone: '0908412678',
    representativeUser: {
      fullName: 'Nguyễn Thị Minh Anh',
      phoneNumber: '0908412678',
    },
  },
  facility: {
    id: 'fac-1',
    facilityName: 'Bệnh viện Nhi Đồng 1',
  },
  doctor: {
    id: 'doc-1',
    doctorName: 'BS. CKII Trần Minh Tuấn',
    specialty: 'Nội tổng quát & Lão khoa',
    cchnNumber: '004821/SYT-HCM',
    experienceYears: 14,
  },
  servicePackage: {
    id: 'pkg-1',
    packageName: 'Gói Gia Đình Toàn Diện',
    durationMonths: 12,
  },
  signatures: [
    {
      signerRole: 'FAMILY_REP',
      signerUserId: 'u-fam',
      signedAt: '2026-11-17T09:14:00.000Z',
    },
  ],
  members: [],
};

describe('FacilityFourPartyDetailView (/facility/coordination/[id])', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:facility-signed-pdf');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  it('renders only back link and DocumensoSigningEmbed when facility has not signed', async () => {
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValueOnce(
      baseDetail
    );
    vi.spyOn(contractsApi, 'getSigningSession').mockResolvedValueOnce({
      contractId: 'ct-4p-001',
      contractNumber: 'HĐ4B-2026-0842',
      contractStatus: 'PENDING_APPROVAL',
      signerRole: 'HEALTHCARE_FACILITY',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-fac',
      signingUrl: 'https://sign.famidoc.online/sign/tok-fac',
      signedRoles: ['FAMILY_REP'],
      signedPdfUrl: null,
    });

    render(<FacilityFourPartyDetailView contractId="ct-4p-001" pollingIntervalMs={0} />);

    expect(
      await screen.findByRole('link', { name: /Quay lại Quản lý Hợp đồng/i })
    ).toHaveAttribute('href', '/facility/contracts');
    expect(screen.getByTestId('facility-documenso-signing-section')).toBeInTheDocument();
    expect(screen.queryByTestId('facility-post-signing-tracking')).toBeNull();
    expect(screen.queryByTestId('facility-signed-pdf-preview-section')).toBeNull();
  });

  it('shows 4-party progress tracking when facility signed but not all 4/4 signed', async () => {
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValueOnce({
      ...baseDetail,
      signatures: [
        ...baseDetail.signatures!,
        {
          signerRole: 'HEALTHCARE_FACILITY',
          signerUserId: 'u-fac',
          signedAt: '2026-11-17T10:00:00.000Z',
        },
      ],
    });

    render(<FacilityFourPartyDetailView contractId="ct-4p-001" pollingIntervalMs={0} />);

    expect(
      await screen.findByTestId('facility-post-signing-tracking')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('facility-signing-progress-count')
    ).toHaveTextContent('2 / 4 bên (50%)');
    expect(
      screen.getByTestId('facility-party-status-FAMILY_REP')
    ).toHaveTextContent('Đã ký');
    expect(
      screen.getByTestId('facility-party-status-HEALTHCARE_FACILITY')
    ).toHaveTextContent('Đã ký');
    expect(
      screen.getByTestId('facility-party-status-ASSIGNED_DOCTOR')
    ).toHaveTextContent('Đang chờ ký');
    expect(
      screen.getByTestId('facility-party-status-ADMIN')
    ).toHaveTextContent('Đang chờ ký');
  });

  it('renders inline PDF preview when all 4/4 parties have signed', async () => {
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValueOnce({
      ...baseDetail,
      contractStatus: 'PENDING_PAYMENT',
      signatures: [
        ...baseDetail.signatures!,
        {
          signerRole: 'HEALTHCARE_FACILITY',
          signerUserId: 'u-fac',
          signedAt: '2026-11-17T10:00:00.000Z',
        },
        {
          signerRole: 'ASSIGNED_DOCTOR',
          signerUserId: 'u-doc',
          signedAt: '2026-11-17T10:15:00.000Z',
        },
        {
          signerRole: 'ADMIN',
          signerUserId: 'u-adm',
          signedAt: '2026-11-17T10:20:00.000Z',
        },
      ],
    });
    const downloadSpy = vi
      .spyOn(contractsApi, 'downloadSignedPdf')
      .mockResolvedValueOnce(new Blob(['%PDF-1.7'], { type: 'application/pdf' }));

    render(<FacilityFourPartyDetailView contractId="ct-4p-001" pollingIntervalMs={0} />);

    expect(
      await screen.findByTestId('facility-signed-pdf-preview-section')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith('ct-4p-001');
      expect(screen.getByTestId('facility-signed-pdf-iframe')).toHaveAttribute(
        'src',
        'blob:facility-signed-pdf'
      );
    });
  });
});

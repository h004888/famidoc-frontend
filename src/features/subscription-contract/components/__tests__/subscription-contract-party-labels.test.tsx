import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { contractsApi, mapMedicalContractToFourParty } from '@/lib/api';
import { SubscriptionContractDetailView } from '../subscription-contract-detail-view';
import { SubscriptionContractView } from '../subscription-contract-view';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    contractsApi: {
      ...actual.contractsApi,
      getMedicalContracts: vi.fn(),
      getMedicalContractDetail: vi.fn(),
      downloadSignedPdf: vi.fn(),
    },
  };
});

describe('SubscriptionContractView (table) & SubscriptionContractDetailView (PDF viewer)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contractsApi.getMedicalContracts).mockResolvedValue([
      {
        id: 'ctr-real-1',
        contractNumber: 'MCFDA0E65',
        status: 'ACTIVE',
        packageId: 'pkg-1',
        packageName: 'Đồng hành 124',
        packagePrice: 150000,
        facilityId: 'fac-1',
        facilityName: 'Bệnh viện Nhi Đồng 1',
        doctorId: 'doc-1',
        doctorName: 'Lâm Khánh Chi',
        familyId: 'fam-1',
        familyRepresentativeName: 'Nguyễn Văn An',
        membersCount: 4,
        startDate: '2026-11-24T00:00:00.000Z',
        endDate: '2026-12-24T00:00:00.000Z',
        createdAt: '2026-11-24T00:00:00.000Z',
        updatedAt: '2026-11-24T00:00:00.000Z',
        signatures: {},
      } as any,
    ]);
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      id: 'ctr-real-1',
      contractNumber: 'MCFDA0E65',
      contractStatus: 'ACTIVE',
      totalAmount: 150000,
      startDate: '2026-11-24T00:00:00.000Z',
      endDate: '2026-12-24T00:00:00.000Z',
      createdAt: '2026-11-24T00:00:00.000Z',
      memberCount: 4,
      remainingHomeVisits: 2,
      remainingTelehealth: 8,
      signedPdfUrl: '/api/v1/contracts/medical/ctr-real-1/signed-pdf',
      familyUnit: {
        id: 'fam-1',
        representativeUser: {
          fullName: 'Nguyễn Văn An',
          phoneNumber: '0912345678',
        },
      },
      facility: {
        id: 'fac-1',
        facilityName: 'Bệnh viện Nhi Đồng 1',
      },
      doctor: {
        id: 'doc-1',
        doctorName: 'Lâm Khánh Chi',
        cchnNumber: '004128/HCM',
      },
      servicePackage: {
        id: 'pkg-1',
        packageName: 'Đồng hành 124',
        durationMonths: 1,
        periodicVisitsQuota: 3,
        telehealthQuota: 10,
      },
      signatures: [],
    });
    vi.mocked(contractsApi.downloadSignedPdf).mockResolvedValue(
      new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
    );
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(
      'blob:http://localhost:3000/mock-pdf-url',
    );
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  it('renders packages in a table and navigates to /family/subscription/[id] when clicking a row', async () => {
    render(<SubscriptionContractView />);

    const table = await screen.findByRole('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByText('Đồng hành 124')).toBeInTheDocument();
    expect(screen.getByText(/#MCFDA0E65/)).toBeInTheDocument();
    expect(screen.getByText(/150\.000 đ/)).toBeInTheDocument();
    expect(screen.getByText('24/11/2026 – 24/12/2026')).toBeInTheDocument();

    const mapped = mapMedicalContractToFourParty({
      id: 'ctr-real-1',
      contractNumber: 'MCFDA0E65',
      contractStatus: 'ACTIVE',
      totalAmount: 150000,
      startDate: '2026-11-24T00:00:00.000Z',
      endDate: '2026-12-24T00:00:00.000Z',
      createdAt: '2026-11-24T00:00:00.000Z',
    });
    expect(mapped.startDate).toBe('2026-11-24T00:00:00.000Z');
    expect(mapped.endDate).toBe('2026-12-24T00:00:00.000Z');

    fireEvent.click(screen.getByText('Đồng hành 124'));
    expect(mockPush).toHaveBeenCalledWith('/family/subscription/ctr-real-1');
  });

  it('renders package detail, quotas, and authenticated blob PDF viewer on detail page', async () => {
    render(<SubscriptionContractDetailView contractId="ctr-real-1" />);

    expect(await screen.findByText('Đồng hành 124')).toBeInTheDocument();
    expect(screen.getByText(/#MCFDA0E65/)).toBeInTheDocument();
    expect(screen.getByText(/150\.000 đ/)).toBeInTheDocument();
    expect(screen.getByText(/Còn 2 \/ 3 lượt/)).toBeInTheDocument();
    expect(screen.getByText(/Còn 8 \/ 10 lượt/)).toBeInTheDocument();

    const iframe = await screen.findByTitle('Bản PDF hợp đồng MCFDA0E65');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      'src',
      'blob:http://localhost:3000/mock-pdf-url',
    );
    expect(contractsApi.downloadSignedPdf).toHaveBeenCalledWith('ctr-real-1');
    expect(
      screen.getByRole('link', { name: /Quay lại danh sách Gói & Hợp đồng/i }),
    ).toHaveAttribute('href', '/family/subscription');
  });

  it('shows friendly Vietnamese error with retry button when signed PDF download fails', async () => {
    vi.mocked(contractsApi.downloadSignedPdf).mockRejectedValueOnce(
      Object.assign(new Error('Conflict'), { status: 409 }),
    );
    render(<SubscriptionContractDetailView contractId="ctr-real-1" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/chưa hoàn tất đủ 4\/4 chữ ký/i);
    expect(
      screen.getByRole('button', { name: /Thử tải lại PDF/i }),
    ).toBeInTheDocument();
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ContractRenewalDialog } from '../contract-renewal-dialog';
import { SubscriptionContractDetailView } from '../subscription-contract-detail-view';
import { contractsApi } from '@/lib/api/contracts.api';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/api/contracts.api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/contracts.api')>(
    '@/lib/api/contracts.api',
  );
  return {
    ...actual,
    contractsApi: {
      ...actual.contractsApi,
      getRenewalPreview: vi.fn(),
      confirmRenewal: vi.fn(),
      createVietQRPayment: vi.fn(),
      getPaymentStatus: vi.fn(),
      cancelDraftContract: vi.fn(),
      getMedicalContractDetail: vi.fn(),
      downloadSignedPdf: vi.fn(),
    },
  };
});

describe('ContractRenewalDialog & SubscriptionContractDetailView (R1–R10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hiển thị lý do chặn và nút Mua gói mới khi không đủ điều kiện gia hạn', async () => {
    vi.mocked((contractsApi as any).getRenewalPreview).mockResolvedValue({
      sourceContractId: 'ctr-1',
      sourceContractNumber: 'HD-001',
      sourceStatus: 'EXPIRED',
      eligible: false,
      suggestBuyNew: true,
      caseType: null,
      graceDays: 7,
      graceEndsAt: '2026-11-20',
      expectedStartDate: null,
      expectedEndDate: null,
      paymentDeadlineAt: null,
      blockingReasons: [
        {
          code: 'GRACE_PERIOD_EXPIRED',
          message: 'Hợp đồng đã quá thời gian ân hạn 7 ngày.',
        },
      ],
      existingRenewal: null,
      package: null,
      doctor: null,
      facility: null,
      members: [],
      pricing: null,
      termsHash: null,
    });

    render(<ContractRenewalDialog contractId="ctr-1" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText('Hợp đồng đã quá thời gian ân hạn 7 ngày.'),
      ).toBeTruthy();
    });
    const buyNewLink = screen.getByRole('link', { name: /Mua gói mới/i });
    expect(buyNewLink.getAttribute('href')).toBe('/doctors');
    expect(screen.queryByRole('button', { name: /Xác nhận gia hạn/i })).toBeNull();
  });

  it('hiển thị xem trước chỉ đọc cho Case A, yêu cầu tick đồng ý trước khi xác nhận và hiển thị VietQR -> PAID', async () => {
    vi.mocked((contractsApi as any).getRenewalPreview).mockResolvedValue({
      sourceContractId: 'ctr-1',
      sourceContractNumber: 'HD-001',
      sourceStatus: 'ACTIVE',
      eligible: true,
      suggestBuyNew: false,
      caseType: 'CASE_A',
      graceDays: 7,
      graceEndsAt: '2026-12-17',
      expectedStartDate: '2026-12-11',
      expectedEndDate: '2027-03-11',
      paymentDeadlineAt: '2026-11-27T05:00:00.000Z',
      blockingReasons: [],
      existingRenewal: null,
      package: {
        id: 'pkg-1',
        code: 'GOI_3_THANG',
        name: 'Gói Chăm Sóc 3 Tháng',
        durationMonths: 3,
        quotas: { homeVisits: 3, videoConsultations: 20 },
      },
      doctor: { id: 'doc-1', fullName: 'BS. Lê Văn C' },
      facility: { id: 'fac-1', name: 'Phòng khám Gia Đình' },
      members: [
        { id: 'pat-1', fullName: 'Nguyễn Văn A', relationshipToRep: 'SELF' },
      ],
      pricing: {
        basePriceVnd: 3_500_000,
        additionalMembersTotalVnd: 0,
        totalPriceVnd: 3_500_000,
        currency: 'VND',
      },
      termsHash: 'a'.repeat(64),
    });

    vi.mocked((contractsApi as any).confirmRenewal).mockResolvedValue({
      id: 'ren-1',
      contractNumber: 'MC-REN-1',
      contractStatus: 'PENDING_PAYMENT',
      holdExpiresAt: '2026-11-27T05:00:00.000Z',
    });

    vi.mocked(contractsApi.createVietQRPayment).mockResolvedValue({
      id: 'pay-1',
      contractId: 'ren-1',
      familyId: 'fam-1',
      environment: 'TEST',
      attempt: 1,
      paymentCode: 'FD123456',
      amountVnd: 3_500_000,
      currency: 'VND',
      qrUrl: 'https://vietqr.app/img?acc=000',
      expectedAccountNumber: '000',
      expectedGateway: 'TEST_BANK',
      status: 'PENDING',
      createdAt: '2026-11-26T05:00:00.000Z',
      expiresAt: '2026-11-26T05:15:00.000Z',
      paidAt: null,
      acceptedTransactionId: null,
    });

    vi.mocked(contractsApi.getPaymentStatus).mockResolvedValue({
      id: 'pay-1',
      contractId: 'ren-1',
      familyId: 'fam-1',
      environment: 'TEST',
      attempt: 1,
      paymentCode: 'FD123456',
      amountVnd: 3_500_000,
      currency: 'VND',
      status: 'PAID',
      expectedAccountNumber: '000',
      expectedGateway: 'TEST_BANK',
      createdAt: '2026-11-26T05:00:00.000Z',
      expiresAt: '2026-11-26T05:15:00.000Z',
      paidAt: '2026-11-26T05:02:00.000Z',
      acceptedTransactionId: 'tx-1',
      activation: {
        activated: false,
        blockingReasons: ['AWAITING_START_DATE'],
      },
    });

    render(<ContractRenewalDialog contractId="ctr-1" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Gói Chăm Sóc 3 Tháng')).toBeTruthy();
    });
    expect(screen.getByText(/BS\. Lê Văn C/)).toBeTruthy();
    expect(screen.getByText(/Nguyễn Văn A/)).toBeTruthy();

    const confirmBtn = screen.getByRole('button', {
      name: /Xác nhận gia hạn/i,
    }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(confirmBtn.disabled).toBe(false);

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect((contractsApi as any).confirmRenewal).toHaveBeenCalledWith(
        'ctr-1',
        { acceptedTerms: true, termsHash: 'a'.repeat(64) },
      );
      expect(contractsApi.createVietQRPayment).toHaveBeenCalledWith('ren-1');
    });

    await waitFor(() => {
      expect(screen.getByText(/FD123456/)).toBeTruthy();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Kiểm tra thanh toán/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/Đã thanh toán – chờ hiệu lực/i)).toBeTruthy();
    });
  });

  it('SubscriptionContractDetailView: TERMINATED ẩn nút Gia hạn, kỳ gia hạn không gọi downloadSignedPdf', async () => {
    vi.mocked(contractsApi.downloadSignedPdf).mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValueOnce({
      id: 'ctr-term',
      contractNumber: 'HD-TERM',
      contractStatus: 'TERMINATED',
      totalAmount: 3_000_000,
      startDate: '2026-01-01',
      endDate: '2026-04-01',
      createdAt: '2026-01-01',
      upgradedFromId: null,
      documensoItemId: 'item-1',
      signedPdfUrl: 'https://example.com/signed.pdf',
    } as any);

    const { unmount } = render(
      <SubscriptionContractDetailView contractId="ctr-term" />,
    );

    await waitFor(() => {
      expect(screen.getByText(/#HD-TERM/)).toBeTruthy();
    });
    expect(
      screen.queryByRole('button', { name: /Gia hạn hợp đồng/i }),
    ).toBeNull();
    expect(screen.getByRole('link', { name: /Mua gói mới/i })).toBeTruthy();
    unmount();
    vi.mocked(contractsApi.downloadSignedPdf).mockClear();

    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValueOnce({
      id: 'ctr-ren',
      contractNumber: 'HD-REN',
      contractStatus: 'PENDING_ACTIVATION' as any,
      totalAmount: 3_500_000,
      startDate: '2026-12-11',
      endDate: '2027-03-11',
      createdAt: '2026-11-26',
      upgradedFromId: 'ctr-old',
      documensoItemId: null,
      signedPdfUrl: null,
      billingSnapshot: {
        package: { name: 'Gói 3 tháng' },
        pricing: { totalPriceVnd: 3_500_000 },
        renewalConfirmation: {
          confirmedAt: '2026-11-26T05:00:00.000Z',
          termsHash: 'a'.repeat(64),
        },
      },
    } as any);

    render(<SubscriptionContractDetailView contractId="ctr-ren" />);

    await waitFor(() => {
      expect(
        screen.getByText(/Bản ghi xác nhận gia hạn trực tuyến/i),
      ).toBeTruthy();
    });
    expect(contractsApi.downloadSignedPdf).not.toHaveBeenCalled();
  });
});

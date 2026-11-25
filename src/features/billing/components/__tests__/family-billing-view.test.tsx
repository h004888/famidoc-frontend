import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { paymentsApi, supportCasesApi, type SupportCaseDetail } from '@/lib/api';
import { ApiError } from '@/lib/http/errors';
import { FamilyBillingDetailView } from '../family-billing-detail-view';
import { FamilyBillingView } from '../family-billing-view';

let query: URLSearchParams;
let pending: { id: string; contractStatus: string } | undefined;
let activeContract:
  | {
      id: string;
      contractNumber: string;
      memberCount: number;
      endDate: string;
      packageName?: string | null;
    }
  | undefined;
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => query,
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));
vi.mock('@/components/layout/family-subscription-gate', () => ({
  useFamilySubscriptionGateState: () => ({
    gateStatus: {
      hasActiveContract: Boolean(activeContract),
      activeContract: activeContract ?? null,
      pendingContract: pending ?? null,
    },
    isLoadingGate: false,
    gateError: null,
  }),
}));
vi.mock('@/features/booking', () => ({
  BookingPaymentStep: ({ contractId, addendumId }: { contractId: string; addendumId?: string }) =>
    <div data-testid="payment-step">{contractId} {addendumId}</div>,
}));
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    paymentsApi: {
      ...actual.paymentsApi,
      listMyPaymentRequests: vi.fn(),
    },
    supportCasesApi: {
      ...actual.supportCasesApi,
      list: vi.fn(),
      detail: vi.fn(),
      createPaymentIssueCase: vi.fn(),
      uploadAttachment: vi.fn(),
    },
  };
});

describe('FamilyBillingView & FamilyBillingDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query = new URLSearchParams();
    pending = undefined;
    activeContract = undefined;
    vi.mocked(paymentsApi.listMyPaymentRequests).mockResolvedValue([]);
    vi.mocked(supportCasesApi.list).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 30,
    });
  });

  it('uses the pending contract returned by the family gate', () => {
    pending = { id: 'contract-1', contractStatus: 'PENDING_PAYMENT' };
    render(<FamilyBillingView />);
    expect(screen.getByTestId('payment-step')).toHaveTextContent('contract-1');
  });

  it('passes a signed addendum payment link to the VietQR screen', () => {
    query = new URLSearchParams('contractId=contract-1&addendumId=addendum-1');
    render(<FamilyBillingView />);
    expect(screen.getByTestId('payment-step')).toHaveTextContent('contract-1 addendum-1');
  });

  it('shows an empty state without back button, KPI strip, or filter bar', async () => {
    render(<FamilyBillingView />);
    expect(
      await screen.findByText(/Không có hợp đồng nào đang chờ thanh toán/),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('payment-step')).not.toBeInTheDocument();
    expect(screen.queryByText(/Bảng sức khỏe gia đình/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tổng đã thanh toán/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('renders invoices as a table without filters/back-link and navigates to /family/billing/[id] on row click', async () => {
    activeContract = {
      id: 'ctr-active-1',
      contractNumber: 'MCFDA0E65',
      memberCount: 4,
      endDate: '2026-12-24T00:00:00.000Z',
      packageName: 'Đồng hành 124',
    };
    vi.mocked(paymentsApi.listMyPaymentRequests).mockResolvedValue([
      {
        id: 'inv-paid-1',
        contractId: 'ctr-active-1',
        contractNumber: 'MCFDA0E65',
        contractStatus: 'ACTIVE',
        packageName: 'Đồng hành 124',
        facilityName: 'Bệnh viện Nhi Đồng 1',
        paymentCode: 'INV-20261124-882',
        transferContent: 'FAMIDOC INV20261124882',
        amountVnd: 150000,
        status: 'PAID',
        expectedAccountNumber: '0123456789',
        expectedGateway: 'MBBank',
        createdAt: '2026-11-24T02:00:00Z',
        expiresAt: '2026-11-24T02:15:00Z',
        paidAt: '2026-11-24T02:14:00Z',
        latestTransaction: null,
        openSupportCase: null,
      },
      {
        id: 'inv-exp-1',
        contractId: 'ctr-active-1',
        contractNumber: 'MCFDA0E65',
        contractStatus: 'ACTIVE',
        packageName: 'Đồng hành 124',
        facilityName: 'Bệnh viện Nhi Đồng 1',
        paymentCode: 'FD-EXP-001',
        transferContent: 'FAMIDOC EXP1',
        amountVnd: 150000,
        status: 'EXPIRED',
        expectedAccountNumber: '0123456789',
        expectedGateway: 'MBBank',
        createdAt: '2026-11-24T01:00:00Z',
        expiresAt: '2026-11-24T01:15:00Z',
        paidAt: null,
        latestTransaction: null,
        openSupportCase: null,
      },
    ]);

    render(<FamilyBillingView />);

    const table = await screen.findByRole('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByText('INV-20261124-882')).toBeInTheDocument();
    expect(screen.queryByText(/Bảng sức khỏe gia đình/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tổng đã thanh toán/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();

    // Mã QR hết hạn thu gọn mặc định khi đã có hóa đơn PAID
    expect(screen.queryByText('FD-EXP-001')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /Xem thêm 1 mã QR cũ đã hết hạn \/ hủy/i }),
    );
    expect(screen.getByText('FD-EXP-001')).toBeInTheDocument();

    // Bấm vào hàng PAID để đi vào trang chi tiết
    fireEvent.click(screen.getByText('INV-20261124-882'));
    expect(mockPush).toHaveBeenCalledWith('/family/billing/inv-paid-1');
  });

  it.each(['new', 'duplicate', 'notification'])('opens the payment support thread via %s on detail view or notification query', async (mode) => {
    vi.mocked(paymentsApi.listMyPaymentRequests).mockResolvedValue([
      {
        id: 'inv-1',
        contractId: 'ctr-1',
        contractNumber: 'HD-2026-009',
        contractStatus: 'PENDING_PAYMENT',
        packageName: 'Gói Chăm Sóc 6 Tháng',
        facilityName: 'Phòng khám FamiCare',
        paymentCode: 'FD998877',
        transferContent: 'NGUYEN VAN A FD998877',
        amountVnd: 1500000,
        grossAmountVnd: 1500000,
        vatAmountVnd: 0,
        status: 'EXPIRED',
        expectedAccountNumber: '0987654321',
        expectedGateway: 'MBBank',
        createdAt: '2026-11-22T08:00:00Z',
        expiresAt: '2026-11-22T08:15:00Z',
        paidAt: null,
        latestTransaction: null,
        openSupportCase: null,
      },
    ]);
    const createdCase: SupportCaseDetail = {
      id: 'case-pay-1',
      caseCode: 'CK-99887766',
      caseType: 'PAYMENT_ISSUE',
      status: 'OPEN',
      familyUserId: 'fam-1',
      contractId: 'ctr-1',
      complaintId: null,
      invoiceId: 'inv-1',
      transactionId: null,
      contextSnapshot: {},
      resolutionSummary: null,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: '2026-11-22T09:00:00Z',
      updatedAt: '2026-11-22T09:00:00Z',
      familyUser: { id: 'fam-1', fullName: 'Nguyễn Văn A', phone: '0901234567' },
      contract: {
        id: 'ctr-1',
        contractNumber: 'HD-2026-009',
        contractStatus: 'PENDING_PAYMENT',
        facilityName: 'Phòng khám FamiCare',
        doctorName: null,
        packageName: 'Gói Chăm Sóc 6 Tháng',
      },
      complaint: null,
      invoice: null,
      relatedTransactions: [],
      familyCanReply: true,
      remainingFamilyMessages: 1,
      messages: [
        {
          id: 'msg-1',
          caseId: 'case-pay-1',
          senderUserId: 'fam-1',
          senderRole: 'FAMILY_REP',
          senderName: 'Nguyễn Văn A',
          body: 'Tôi đã chuyển tiền thành công nhưng gói chăm sóc vẫn chưa kích hoạt.',
          attachmentKeys: [],
          createdAt: '2026-11-22T09:00:00Z',
        },
      ],
    };
    vi.mocked(supportCasesApi.detail).mockResolvedValue(createdCase);
    if (mode === 'notification') {
      query = new URLSearchParams('supportCaseId=' + createdCase.id);
      pending = { id: createdCase.contractId, contractStatus: 'PENDING_PAYMENT' };
      render(<FamilyBillingView />);
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(await screen.findByText(createdCase.caseCode)).toBeInTheDocument();
      expect(supportCasesApi.detail).toHaveBeenCalledWith(createdCase.id);
      expect(screen.queryByTestId('payment-step')).not.toBeInTheDocument();
      return;
    }
    if (mode === 'duplicate') {
      vi.mocked(supportCasesApi.createPaymentIssueCase).mockRejectedValueOnce(
        new ApiError('Hóa đơn đã có hồ sơ đang xử lý', 409, {
          error: { existingCaseId: createdCase.id },
        }),
      );
    } else {
      vi.mocked(supportCasesApi.createPaymentIssueCase).mockResolvedValue(createdCase);
    }

    render(<FamilyBillingDetailView invoiceId="inv-1" />);

    expect(await screen.findByText(/Chi tiết Hóa đơn #FD998877/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Báo lỗi chuyển khoản/i }));

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('FD998877')).toBeInTheDocument();
    expect(dialog.getByText('HD-2026-009')).toBeInTheDocument();

    fireEvent.click(
      dialog.getByRole('button', {
        name: 'Tôi đã chuyển tiền thành công nhưng gói chăm sóc vẫn chưa kích hoạt.',
      }),
    );
    fireEvent.click(
      dialog.getByRole('button', { name: 'Gửi báo lỗi chuyển khoản' }),
    );

    await waitFor(() => {
      expect(supportCasesApi.createPaymentIssueCase).toHaveBeenCalledWith({
        contractId: 'ctr-1',
        invoiceId: 'inv-1',
        message:
          'Tôi đã chuyển tiền thành công nhưng gói chăm sóc vẫn chưa kích hoạt.',
      });
    });
    expect(await dialog.findByText('CK-99887766')).toBeInTheDocument();
    if (mode === 'duplicate') {
      expect(supportCasesApi.detail).toHaveBeenCalledWith(createdCase.id);
    }
  });
});

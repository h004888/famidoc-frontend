import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  paymentsApi,
  supportCasesApi,
  type SupportCaseDetail,
  type SupportCaseSummary,
} from '@/lib/api';
import { AdminPaymentIssuesView } from '../admin-payment-issues-view';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    supportCasesApi: {
      ...actual.supportCasesApi,
      list: vi.fn(),
      detail: vi.fn(),
      postMessage: vi.fn(),
      updateStatus: vi.fn(),
    },
    paymentsApi: {
      ...actual.paymentsApi,
      recheckPaymentActivation: vi.fn(),
    },
  };
});

const summaryItem: SupportCaseSummary = {
  id: 'case-pay-1',
  caseCode: 'CK-AABBCC11',
  caseType: 'PAYMENT_ISSUE',
  status: 'OPEN',
  familyUserId: 'fam-1',
  contractId: 'ctr-1',
  complaintId: null,
  invoiceId: 'inv-1',
  transactionId: 'tx-1',
  contextSnapshot: {},
  resolutionSummary: null,
  resolvedAt: null,
  createdAt: '2026-11-22T08:00:00Z',
  updatedAt: '2026-11-22T08:15:00Z',
  messageCount: 1,
  lastMessage: {
    id: 'msg-1',
    senderRole: 'FAMILY_REP',
    body: 'Tôi đã chuyển khoản 1.500.000đ nhưng gói chưa kích hoạt.',
    createdAt: '2026-11-22T08:00:00Z',
  },
  familyUser: {
    id: 'fam-1',
    fullName: 'Lê Thị Hoa',
    phone: '0912345678',
  },
  contract: {
    id: 'ctr-1',
    contractNumber: 'HD-2026-009',
    contractStatus: 'PENDING_PAYMENT',
    facilityName: 'Phòng khám FamiCare',
    packageName: 'Gói Gia Đình 6 Tháng',
  },
  complaint: null,
  invoice: {
    id: 'inv-1',
    invoiceCode: 'FD998877',
    totalPayable: 1500000,
    paymentStatus: 'PAID',
    paidAt: '2026-11-22T07:55:00Z',
  },
};

const detailItem: SupportCaseDetail = {
  ...summaryItem,
  resolvedBy: null,
  contract: {
    ...summaryItem.contract,
    doctorName: 'BS. Trần Minh',
  },
  complaint: null,
  invoice: {
    id: 'inv-1',
    invoiceCode: 'FD998877',
    transferContent: 'LE THI HOA FD998877',
    totalPayable: 1500000,
    paymentStatus: 'PAID',
    expectedAccountNumber: '0987654321',
    expectedGateway: 'MBBank',
    expiredAt: '2026-11-22T08:10:00Z',
    paidAt: '2026-11-22T07:55:00Z',
    createdAt: '2026-11-22T07:50:00Z',
  },
  relatedTransactions: [
    {
      id: 'tx-1',
      providerTransactionId: 'SP-991',
      amountReceived: 1500000,
      paymentTime: '2026-11-22T07:55:00Z',
      outcome: 'REVIEW_REQUIRED',
      reason: 'LATE_PAYMENT',
      referenceCode: 'FT261122991',
      gateway: 'MBBank',
      accountNumber: '0987654321',
      paymentCode: 'FD998877',
      transferContent: 'LE THI HOA FD998877',
    },
  ],
  familyCanReply: true,
  remainingFamilyMessages: 1,
  messages: [
    {
      id: 'msg-1',
      caseId: 'case-pay-1',
      senderUserId: 'fam-1',
      senderRole: 'FAMILY_REP',
      senderName: 'Lê Thị Hoa',
      body: 'Tôi đã chuyển khoản 1.500.000đ nhưng gói chưa kích hoạt.',
      attachmentKeys: [],
      createdAt: '2026-11-22T08:00:00Z',
    },
  ],
};

describe('AdminPaymentIssuesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supportCasesApi.list).mockResolvedValue({
      items: [summaryItem],
      total: 1,
      page: 1,
      limit: 20,
    });
    vi.mocked(supportCasesApi.detail).mockResolvedValue(detailItem);
    vi.mocked(paymentsApi.recheckPaymentActivation).mockResolvedValue({
      activated: true,
      blockingReasons: [],
    });
  });

  it('hiển thị danh sách báo lỗi chuyển khoản, mở đối soát SePay và cho phép kích hoạt bù hợp đồng', async () => {
    render(<AdminPaymentIssuesView />);

    expect(await screen.findByText('CK-AABBCC11')).toBeInTheDocument();
    expect(screen.getByText(/FD998877/)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Đối soát & Phản hồi/ }),
    );

    const dialog = within(await screen.findByRole('dialog'));
    expect(await dialog.findByText('FT261122991')).toBeInTheDocument();
    expect(dialog.getByText('Cần soát xét')).toBeInTheDocument();
    expect(dialog.getByText(/LATE_PAYMENT/)).toBeInTheDocument();

    fireEvent.click(
      dialog.getByRole('button', { name: /Kiểm tra kích hoạt hợp đồng/ }),
    );

    await waitFor(() => {
      expect(paymentsApi.recheckPaymentActivation).toHaveBeenCalledWith('inv-1');
    });
  });
});

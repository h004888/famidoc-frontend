import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FamilyPaymentRequestItem } from '@/lib/api';
import { FamilyReceiptDetailDialog } from '../family-receipt-detail-dialog';

function makePaidItem(
  overrides: Partial<FamilyPaymentRequestItem> = {},
): FamilyPaymentRequestItem {
  return {
    id: 'inv-1',
    contractId: 'ctr-1',
    contractNumber: 'HD-2026-0042',
    contractStatus: 'ACTIVE',
    packageName: 'Gói Đồng Hành Gia Đình (3 Tháng)',
    facilityName: 'BV Đại học Y Dược TP.HCM',
    paymentCode: 'INV-20261101-882',
    transferContent: 'FAMIDOC INV20261101882 NGUYEN VAN AN',
    amountVnd: 2850000,
    grossAmountVnd: 2850000,
    vatAmountVnd: 0,
    paymentGateway: 'VIETQR',
    addendumId: null,
    addendumNumber: null,
    addendumType: null,
    contractStartDate: '2026-11-01T00:00:00.000Z',
    contractEndDate: '2027-01-31T00:00:00.000Z',
    memberCount: 4,
    status: 'PAID',
    expectedAccountNumber: '0123456789',
    expectedGateway: 'MBBank',
    createdAt: '2026-11-01T02:00:00.000Z',
    expiresAt: '2026-11-01T02:15:00.000Z',
    paidAt: '2026-11-01T02:14:22.000Z',
    latestTransaction: {
      id: 'tx-1',
      providerTransactionId: 'SEPAY-TX-1',
      amountReceived: 2850000,
      paymentTime: '2026-11-01T02:14:22.000Z',
      outcome: 'MATCHED',
      reason: null,
      referenceCode: 'FT2630591827',
      gateway: 'MBBank',
    },
    openSupportCase: null,
    ...overrides,
  };
}

describe('FamilyReceiptDetailDialog', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders full receipt details for a paid base contract invoice', () => {
    render(
      <FamilyReceiptDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        item={makePaidItem()}
        onReportIssue={vi.fn()}
      />,
    );

    expect(screen.getByText('INV-20261101-882')).toBeInTheDocument();
    expect(screen.getByText('Đã thanh toán')).toBeInTheDocument();
    expect(screen.getByText('Hợp đồng dịch vụ gốc')).toBeInTheDocument();
    expect(screen.getByText('FT2630591827')).toBeInTheDocument();
    expect(screen.getByText(/MBBank/)).toBeInTheDocument();
    expect(
      screen.getByText('FAMIDOC INV20261101882 NGUYEN VAN AN'),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/2\.850\.000/).length).toBeGreaterThanOrEqual(2);
  });

  it('renders addendum label when invoice belongs to a contract addendum', () => {
    render(
      <FamilyReceiptDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        item={makePaidItem({
          addendumId: 'add-1',
          addendumNumber: 'PL-01',
          addendumType: 'ADD_MEMBER',
          grossAmountVnd: 500000,
          vatAmountVnd: 0,
          amountVnd: 500000,
        })}
        onReportIssue={vi.fn()}
      />,
    );

    expect(screen.getByText(/Phụ lục hợp đồng #PL-01/i)).toBeInTheDocument();
  });

  it('calls window.print() when clicking In / Lưu PDF', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(
      <FamilyReceiptDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        item={makePaidItem()}
        onReportIssue={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /In \/ Lưu PDF/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('calls onReportIssue with current item when clicking Báo lỗi / Khiếu nại', () => {
    const item = makePaidItem();
    const onReportIssue = vi.fn();
    render(
      <FamilyReceiptDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        item={item}
        onReportIssue={onReportIssue}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Báo lỗi \/ Khiếu nại/i }),
    );
    expect(onReportIssue).toHaveBeenCalledWith(item);
  });

  it('falls back to amountVnd without NaN when grossAmountVnd is omitted', () => {
    render(
      <FamilyReceiptDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        item={makePaidItem({
          grossAmountVnd: undefined,
          vatAmountVnd: undefined,
          amountVnd: 1500000,
        })}
        onReportIssue={vi.fn()}
      />,
    );

    expect(screen.getAllByText(/1\.500\.000/).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});

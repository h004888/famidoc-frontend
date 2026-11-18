import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';
import { financeApi } from '@/lib/api/finance.api';
import { paymentsApi } from '@/lib/api/payments.api';
import { AdminReconciliationView } from '../admin-reconciliation-view';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() } }));
vi.mock('@/lib/api/finance.api', () => ({
  financeApi: {
    getSePayReconciliationStatus: vi.fn(),
    listSePayReconciliations: vi.fn(),
    runSePayReconciliation: vi.fn(),
  },
}));
vi.mock('@/lib/api/payments.api', () => ({
  paymentsApi: { listTransactions: vi.fn(), recheckPaymentActivation: vi.fn() },
}));

describe('AdminReconciliationView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(paymentsApi.listTransactions).mockResolvedValue({
      items: [{
        id: 'tx-1',
        environment: 'TEST',
        providerTransactionId: '789012',
        gateway: 'MB',
        amountVnd: 9600000,
        transactionAt: '2026-11-16T10:00:00Z',
        receivedAt: '2026-11-16T10:00:02Z',
        accountNumber: '123456789',
        paymentCode: 'FMD000001',
        paymentRequestId: 'pay-1',
        referenceCode: 'REF123',
        outcome: 'MATCHED',
        reason: null,
        ingestionSource: 'WEBHOOK',
      }],
      total: 1,
      page: 1,
      limit: 20,
    });
    vi.mocked(financeApi.getSePayReconciliationStatus).mockResolvedValue({
      enabled: true,
      environment: 'TEST',
      state: null,
      latestRun: null,
      unreconciledTransactions: 1,
    });
    vi.mocked(financeApi.listSePayReconciliations).mockResolvedValue([]);
  });

  it('shows the webhook source and refreshes the real transaction list', async () => {
    render(<AdminReconciliationView />);
    const desktop = within(await screen.findByTestId('desktop-view'));
    const mobile = within(screen.getByTestId('mobile-view'));
    expect(desktop.getByText('Thông báo SePay')).toBeInTheDocument();
    expect(desktop.getByText('789012')).toBeInTheDocument();
    expect(desktop.getByText('FMD000001')).toBeInTheDocument();
    expect(mobile.getByText('Thông báo SePay')).toBeInTheDocument();
    expect(mobile.getByText('789012')).toBeInTheDocument();

    vi.mocked(paymentsApi.listTransactions).mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 20 });
    fireEvent.click(screen.getByRole('button', { name: 'Làm mới' }));
    expect(await screen.findByText('Không có giao dịch phù hợp.')).toBeInTheDocument();
    expect(screen.queryByText('789012')).not.toBeInTheDocument();
  });

  it('uses the payment request ID and reports backend activation refusal', async () => {
    vi.mocked(paymentsApi.recheckPaymentActivation).mockResolvedValue({ activated: false, blockingReasons: ['PANEL_CAP'] });
    render(<AdminReconciliationView />);
    const mobile = within(await screen.findByTestId('mobile-view'));
    fireEvent.click(mobile.getByRole('button', { name: 'Kiểm tra kích hoạt hợp đồng' }));
    await waitFor(() => {
      expect(paymentsApi.recheckPaymentActivation).toHaveBeenCalledWith('pay-1');
      expect(toast.info).toHaveBeenCalledWith('PANEL_CAP');
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it('runs API reconciliation in the current environment', async () => {
    vi.mocked(financeApi.runSePayReconciliation).mockResolvedValue({
      id: 'run-1', trigger: 'MANUAL', environment: 'TEST', status: 'SUCCEEDED',
      fetchedCount: 1, backfilledCount: 0, linkedCount: 1, matchedCount: 1,
      reviewRequiredCount: 0, ignoredCount: 0, localOnlyCount: 0,
      startedAt: '2026-11-16T10:00:02Z',
    });
    render(<AdminReconciliationView />);
    fireEvent.click(screen.getByText('Đồng bộ giao dịch từ SePay', { selector: 'summary' }));
    fireEvent.change(screen.getByLabelText('Loại dữ liệu đồng bộ'), { target: { value: 'TEST' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đồng bộ ngay' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Đồng bộ ngay' }));
    await waitFor(() => expect(financeApi.runSePayReconciliation).toHaveBeenCalledWith({ environment: 'TEST' }));
  });
});

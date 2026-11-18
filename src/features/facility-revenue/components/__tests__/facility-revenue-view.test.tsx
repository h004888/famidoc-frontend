import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { financeApi, type FacilitySettlementDto } from '@/lib/api/finance.api';
import { FacilityRevenueView } from '../facility-revenue-view';

vi.mock('@/lib/api/finance.api', () => ({
  financeApi: { getAnalytics: vi.fn(), reviewSettlement: vi.fn() },
}));

const statement: FacilitySettlementDto = {
  id: 'statement-1', settlementCode: 'ST-01', facilityId: 'facility-1',
  environment: 'LIVE', month: 10, year: 2026, disbursementStatus: 'PENDING',
  reviewStatus: 'PENDING', reviewVersion: 3, totalRealizedRevenue: 1000000,
  platformFeeAmount: 150000, facilityPayoutAmount: 850000,
  bankDestination: { bankName: 'MB', accountNumber: '1234567', accountHolder: 'CSYT' },
  createdAt: '2026-11-05T01:00:00Z',
};

describe('FacilityRevenueView', () => {
  it('shows API totals and can reload a selected period', async () => {
    vi.mocked(financeApi.getAnalytics).mockResolvedValue({
      currency: 'VND', environment: 'LIVE', year: 2026, month: 10, invoiceCount: 2,
      recognitionBasis: 'SERVICE_DAYS', grossVnd: 1000000, vatVnd: 0, netVnd: 1000000,
      facilityShareVnd: 850000, platformFeeVnd: 150000, settlements: [],
    });
    render(<FacilityRevenueView />);

    expect(await screen.findByText('Tháng 10/2026 · LIVE')).toBeInTheDocument();
    expect(screen.getByText(/850[.,]000/)).toBeInTheDocument();
    expect(screen.getByText(/150[.,]000/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Kỳ báo cáo'), { target: { value: '2026-09' } });
    await waitFor(() => expect(financeApi.getAnalytics).toHaveBeenLastCalledWith({ environment: 'LIVE', year: 2026, month: 9 }));
  });

  it('surfaces API errors and hides sample reports', async () => {
    vi.mocked(financeApi.getAnalytics).mockRejectedValueOnce(new Error('Không có quyền xem kỳ này'));
    render(<FacilityRevenueView />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền xem kỳ này');
    expect(screen.queryByText('Bảng quyết toán của kỳ')).not.toBeInTheDocument();
  });

  it.each([
    ['Xác nhận bảng', 'Xác nhận số liệu', 'CONFIRM', 'CONFIRMED', 'CSYT đã xác nhận'],
    ['Báo sai lệch', 'Gửi sai lệch', 'REPORT_DISCREPANCY', 'DISPUTED', 'Đã báo sai lệch'],
  ] as const)('sends %s for the current settlement version', async (open, submit, action, status, label) => {
    const reason = 'Hóa đơn tháng 10 chưa khớp.';
    vi.mocked(financeApi.getAnalytics).mockResolvedValueOnce({
      currency: 'VND', environment: 'LIVE', year: 2026, month: 10, invoiceCount: 2,
      recognitionBasis: 'SERVICE_DAYS', grossVnd: 1000000, vatVnd: 0, netVnd: 1000000,
      facilityShareVnd: 850000, platformFeeVnd: 150000, settlements: [statement],
    });
    vi.mocked(financeApi.reviewSettlement).mockResolvedValueOnce({
      ...statement,
      reviewStatus: status,
      reviewDisputeReason: action === 'REPORT_DISCREPANCY' ? reason : null,
    });
    render(<FacilityRevenueView />);

    const table = within(await screen.findByRole('table'));
    fireEvent.click(table.getByRole('button', { name: open }));
    const dialog = within(await screen.findByRole('dialog'));
    if (action === 'REPORT_DISCREPANCY') {
      fireEvent.change(dialog.getByLabelText('Nội dung sai lệch'), { target: { value: reason } });
    }
    fireEvent.click(dialog.getByRole('button', { name: submit }));
    await waitFor(() => expect(financeApi.reviewSettlement).toHaveBeenCalledWith('statement-1', {
      action,
      environment: 'LIVE',
      reviewVersion: 3,
      ...(action === 'REPORT_DISCREPANCY' ? { reason } : {}),
    }));
    expect(await table.findByText(label)).toBeInTheDocument();
  });
});

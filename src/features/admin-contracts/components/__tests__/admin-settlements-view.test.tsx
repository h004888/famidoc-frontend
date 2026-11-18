import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminSettlementsView } from '../admin-settlements-view';
import { financeApi } from '@/lib/api/finance.api';

vi.mock('@/lib/api/finance.api', () => ({
  financeApi: {
    getAnalytics: vi.fn().mockResolvedValue({
      year: 2026,
      month: 10,
      environment: 'LIVE',
      grossVnd: 809714000,
      facilityShareVnd: 688256900,
      platformFeeVnd: 121457100,
      settlements: [
        {
          id: 'st-yduoc-202610',
          settlementCode: 'ST202610YDUOC01',
          facilityId: 'fac-001',
          month: 10,
          year: 2026,
          environment: 'LIVE',
          totalRealizedRevenue: 489714000,
          platformFeeAmount: 73457100,
          facilityPayoutAmount: 416256900,
          disbursementStatus: 'PENDING',
          reviewStatus: 'CONFIRMED',
          reviewVersion: 2,
          bankDestination: {
            bankName: 'BIDV',
            accountNumber: '119000288819',
            accountHolder: 'BV DAI HOC Y DUOC TPHCM',
          },
          createdAt: '2026-11-05T01:00:00.000Z',
          facility: {
            id: 'fac-001',
            facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
          },
        },
      ],
    }),
    executeMonthlySettlement: vi.fn().mockResolvedValue({
      transferExecuted: true,
      message: 'Settlement confirmed',
    }),
    uploadSettlementEvidence: vi.fn().mockResolvedValue({
      evidenceKey: 'user-1/settlements/st-yduoc-202610/evidence.pdf',
    }),
  },
}));

describe('AdminSettlementsView (BF5 Quyết Toán & Giải Ngân CSYT)', () => {
  it('shows the payout summary and keeps bank information in the details', async () => {
    render(<AdminSettlementsView />);

    expect(screen.getByRole('heading', { name: 'Chi trả cơ sở y tế' })).toBeInTheDocument();
    expect(await screen.findByText('Phần chi trả cơ sở y tế')).toBeInTheDocument();
    expect(screen.getByText('Phí nền tảng')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ST202610YDUOC01')).toBeInTheDocument();
      expect(screen.getByText('Bệnh viện Đại học Y Dược TP.HCM')).toBeInTheDocument();
    });
    expect(screen.queryByText(/119000288819/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết' }));
    expect(screen.getByText(/119000288819/)).toBeInTheDocument();
  });

  it('prepares a statement for the selected month', async () => {
    render(<AdminSettlementsView />);

    await screen.findByText('ST202610YDUOC01');
    const prepareBtn = screen.getByRole('button', { name: 'Lập bảng đối soát' });
    fireEvent.click(prepareBtn);

    await waitFor(() => {
      expect(financeApi.executeMonthlySettlement).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PREPARE',
          environment: 'LIVE',
          year: 2026,
          month: 10,
        })
      );
    });
  });

  it('uploads bank evidence and keeps the statement pending when confirmation is rejected', async () => {
    vi.mocked(financeApi.executeMonthlySettlement).mockRejectedValueOnce(new Error('Tệp chứng từ quyết toán chưa được tải lên.'));
    render(<AdminSettlementsView />);

    await waitFor(() => {
      expect(screen.getByText('ST202610YDUOC01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết' }));
    fireEvent.click(screen.getByRole('button', { name: 'Chuẩn bị chuyển khoản' }));

    expect(screen.getByRole('heading', { name: 'Chuyển khoản cho cơ sở y tế' })).toBeInTheDocument();
    const qrUrl = new URL(screen.getByRole('link', { name: 'Mở mã QR chuyển khoản' }).getAttribute('href')!);
    expect(qrUrl.searchParams.get('acc')).toBe('119000288819');
    expect(qrUrl.searchParams.get('amount')).toBe('416256900');

    fireEvent.change(screen.getByLabelText(/Mã giao dịch trên chứng từ/i), { target: { value: 'FT1234' } });
    fireEvent.change(screen.getByLabelText(/Số tiền đã chuyển/i), { target: { value: '416256900' } });
    fireEvent.change(screen.getByLabelText(/Thời điểm chuyển khoản/i), { target: { value: '2026-11-06T08:00:00' } });
    const evidence = new File(['%PDF-1.7'], 'bien-lai.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Tệp chứng từ chuyển khoản'), { target: { files: [evidence] } });
    const submitBtn = screen.getByRole('button', { name: 'Lưu xác nhận đã chuyển' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(financeApi.uploadSettlementEvidence).toHaveBeenCalledWith('st-yduoc-202610', 'LIVE', evidence);
      expect(financeApi.executeMonthlySettlement).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CONFIRM_TRANSFER',
          settlementId: 'st-yduoc-202610',
          bankTransferOrderId: 'FT1234',
          amountPaidVnd: 416256900,
          transferMemo: 'DOSOAT ST202610YDUOC01',
          reviewVersion: 2,
          evidenceKey: 'user-1/settlements/st-yduoc-202610/evidence.pdf',
        })
      );
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Tệp chứng từ quyết toán chưa được tải lên.');
    expect(screen.queryByText('Đã chi trả')).not.toBeInTheDocument();
  });

  it('lets Admin reopen a disputed table and hides the payment confirmation action', async () => {
    const report = await financeApi.getAnalytics();
    const statement = report.settlements[0];
    vi.mocked(financeApi.getAnalytics).mockResolvedValueOnce({
      ...report,
      settlements: [{ ...statement, reviewStatus: 'DISPUTED', reviewDisputeReason: 'Thiếu số liệu kỳ này.' }],
    });
    render(<AdminSettlementsView />);

    fireEvent.click(await screen.findByRole('button', { name: 'Xem chi tiết' }));
    expect(screen.getByText(/Thiếu số liệu kỳ này/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Chuẩn bị chuyển khoản' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gửi lại để xác nhận' }));
    await waitFor(() => expect(financeApi.executeMonthlySettlement).toHaveBeenCalledWith({
      action: 'REOPEN_REVIEW',
      settlementId: statement.id,
      environment: 'LIVE',
      reviewVersion: 2,
    }));
  });
});

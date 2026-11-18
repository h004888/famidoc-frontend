import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminSettlementsView } from '../admin-settlements-view';
import { financeApi } from '@/lib/api/finance.api';

vi.mock('@/lib/api/public.api', () => ({
  publicApi: {
    getBanks: vi.fn().mockResolvedValue([
      {
        id: 4,
        name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
        code: 'BIDV',
        bin: '970418',
        shortName: 'BIDV',
        logo: 'https://api.vietqr.io/img/BIDV.png',
        transferSupported: 1,
        lookupSupported: 1,
      },
      {
        id: 43,
        name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
        code: 'VCB',
        bin: '970436',
        shortName: 'Vietcombank',
        logo: 'https://api.vietqr.io/img/VCB.png',
        transferSupported: 1,
        lookupSupported: 1,
      },
    ]),
  },
}));

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
    const expectedQrUrl =
      'https://img.vietqr.io/image/970418-119000288819-compact2.svg?amount=416256900&addInfo=DOSOAT+ST202610YDUOC01&accountName=BV+DAI+HOC+Y+DUOC+TPHCM';
    const qrLink = screen.getByRole('link', { name: 'Mở mã QR chuyển khoản' });
    expect(qrLink.getAttribute('href')).toBe(expectedQrUrl);
    const qrImg = screen.getByAltText(/Mã VietQR BIDV/i);
    expect(qrImg.getAttribute('src')).toBe(expectedQrUrl);

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

  it('generates img.vietqr.io SVG QR when bankDestination uses full Vietnamese bankName with bankBin', async () => {
    const report = await financeApi.getAnalytics();
    const statement = report.settlements[0];
    vi.mocked(financeApi.getAnalytics).mockResolvedValueOnce({
      ...report,
      settlements: [
        {
          ...statement,
          bankDestination: {
            bankName: 'Vietcombank - Ngân hàng TMCP Ngoại thương Việt Nam',
            bankBin: '970436',
            bankCode: 'VCB',
            accountNumber: '0071000889922',
            accountHolder: 'BENH VIEN AN SINH',
          },
        },
      ],
    });

    render(<AdminSettlementsView />);
    fireEvent.click(await screen.findByRole('button', { name: 'Xem chi tiết' }));
    fireEvent.click(screen.getByRole('button', { name: 'Chuẩn bị chuyển khoản' }));

    const qrLink = screen.getByRole('link', { name: 'Mở mã QR chuyển khoản' });
    expect(qrLink.getAttribute('href')).toBe(
      'https://img.vietqr.io/image/970436-0071000889922-compact2.svg?amount=416256900&addInfo=DOSOAT+ST202610YDUOC01&accountName=BENH+VIEN+AN+SINH'
    );
  });
});

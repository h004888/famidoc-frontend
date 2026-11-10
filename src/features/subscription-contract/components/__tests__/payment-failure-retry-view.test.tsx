import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentFailureRetryView } from '../payment-failure-retry-view';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Màn 8: PaymentFailureRetryView (Báo lỗi thanh toán & Hướng dẫn xử lý VietQR)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders payment failure details and specific failure reason for invalid syntax', () => {
    render(
      <PaymentFailureRetryView
        errorDetails={{
          reasonCode: 'INVALID_SYNTAX',
          message: 'Cú pháp chuyển khoản ngân hàng không trùng khớp với mã hợp đồng',
          transactionCode: 'TXN-882910',
          contractId: 'FMD-2026-REGR821',
          amountExpected: 9600000,
          amountReceived: 9600000,
        }}
      />
    );

    expect(screen.getByText(/Giao dịch thanh toán chưa được ghi nhận/i)).toBeInTheDocument();
    expect(screen.getAllByText(/TXN-882910/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/FMD-2026-REGR821/i)).toBeInTheDocument();
    expect(screen.getByText(/Cú pháp chuyển khoản ngân hàng không trùng khớp/i)).toBeInTheDocument();
    expect(screen.getAllByText(/9\.600\.000/i).length).toBeGreaterThanOrEqual(1);
  });

  it('displays accurate explanation when failure reason is expired QR session', () => {
    render(
      <PaymentFailureRetryView
        errorDetails={{
          reasonCode: 'EXPIRED_QR',
          message: 'Mã QR động đã quá thời hạn hiệu lực 15 phút',
          contractId: 'FMD-2026-REGR821',
        }}
      />
    );

    expect(screen.getByText(/Mã QR động đã quá thời hạn hiệu lực/i)).toBeInTheDocument();
    expect(screen.getByText(/Phiên giao dịch VietQR đã hết hạn/i)).toBeInTheDocument();
  });

  it('displays accurate explanation when failure reason is insufficient amount', () => {
    render(
      <PaymentFailureRetryView
        errorDetails={{
          reasonCode: 'INSUFFICIENT_AMOUNT',
          message: 'Số tiền chuyển khoản thực tế thấp hơn giá trị gói hợp đồng',
          amountExpected: 9600000,
          amountReceived: 9000000,
        }}
      />
    );

    expect(screen.getByText(/Số tiền chuyển khoản thực tế thấp hơn/i)).toBeInTheDocument();
    expect(screen.getByText(/Chuyển thiếu số tiền gói/i)).toBeInTheDocument();
    expect(screen.getByText(/9\.000\.000/i)).toBeInTheDocument();
  });

  it('provides step-by-step resolution guide to avoid user anxiety', () => {
    render(<PaymentFailureRetryView />);

    expect(screen.getByText(/Hướng dẫn xử lý an toàn & đối soát tự động/i)).toBeInTheDocument();
    expect(screen.getByText(/Kiểm tra lịch sử biến động số dư ngân hàng/i)).toBeInTheDocument();
    expect(screen.getByText(/Nếu tài khoản đã bị trừ tiền/i)).toBeInTheDocument();
    expect(screen.getByText(/Nếu tài khoản chưa bị trừ tiền/i)).toBeInTheDocument();
  });

  it('fires onRetry callback or navigates when clicking "Tạo lại mã VietQR mới"', () => {
    const handleRetry = vi.fn();
    render(<PaymentFailureRetryView onRetryPayment={handleRetry} />);

    const retryBtn = screen.getByRole('button', { name: /Tạo lại mã VietQR mới/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('navigates to billing page if onRetryPayment is not provided', () => {
    render(<PaymentFailureRetryView />);

    const retryBtn = screen.getByRole('button', { name: /Tạo lại mã VietQR mới/i });
    fireEvent.click(retryBtn);
    expect(mockPush).toHaveBeenCalledWith('/family/billing');
  });

  it('provides emergency contact support button and tracking link', () => {
    const handleContact = vi.fn();
    render(<PaymentFailureRetryView onContactSupport={handleContact} />);

    const supportBtn = screen.getByRole('button', { name: /Liên hệ hỗ trợ khẩn cấp/i });
    expect(supportBtn).toBeInTheDocument();

    fireEvent.click(supportBtn);
    expect(handleContact).toHaveBeenCalledTimes(1);

    const trackingLink = screen.getByRole('link', { name: /Xem tiến trình hợp đồng/i });
    expect(trackingLink).toHaveAttribute('href', '/family/subscription/tracking');
  });

  it('conforms to anti-slop rules: no font-mono/black/extrabold and has tabular-nums', () => {
    const { container } = render(<PaymentFailureRetryView />);

    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    expect(container.innerHTML).toContain('tabular-nums');
  });
});

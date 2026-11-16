import { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  BOOKING_STEPS,
  BookingOnboardingShell,
  resolveBookingStepIndex,
} from '../booking-onboarding-shell';
import { useBookingNavigation } from '../booking-navigation-context';

let mockPathname = '/booking';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

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

vi.mock('@/features/landing/components/landing-header', () => ({
  LandingHeader: ({ hideMobileBottomNav }: { hideMobileBottomNav?: boolean }) => (
    <header
      data-testid="landing-header"
      data-hide-mobile-bottom-nav={String(Boolean(hideMobileBottomNav))}
    />
  ),
}));

vi.mock('@/features/landing/components/landing-footer', () => ({
  LandingFooter: () => <footer data-testid="landing-footer" />,
}));

/** Bước giả lập báo ngữ cảnh hợp đồng lên shell để kiểm tra nút Quay lại. */
function ContextProbe({
  doctorId,
  contractId,
  contractStatus,
}: {
  doctorId?: string;
  contractId?: string;
  contractStatus?: string;
}) {
  const { update } = useBookingNavigation();
  useEffect(() => {
    update({ doctorId, contractId, contractStatus });
  }, [contractId, contractStatus, doctorId, update]);
  return <div data-testid="booking-children">Nội dung bước</div>;
}

describe('BookingOnboardingShell', () => {
  beforeEach(() => {
    mockPathname = '/booking';
  });

  it('hiển thị stepper 3 bước theo đúng thứ tự', () => {
    render(
      <BookingOnboardingShell>
        <div data-testid="booking-children">Nội dung bước 1</div>
      </BookingOnboardingShell>
    );

    expect(BOOKING_STEPS.map((step) => step.index)).toEqual([1, 2, 3]);
    expect(screen.getByTestId('booking-step-1')).toHaveTextContent('Xác nhận gói');
    expect(screen.getByTestId('booking-step-2')).toHaveTextContent('Ký hợp đồng 4 bên');
    expect(screen.getByTestId('booking-step-3')).toHaveTextContent('Thanh toán VietQR');
    expect(screen.getByTestId('booking-step-1')).toHaveAttribute('data-step-state', 'current');
    expect(screen.getByTestId('booking-step-2')).toHaveAttribute('data-step-state', 'pending');
  });

  it('dùng header/footer công khai với khung max-w-7xl và ẩn thanh điều hướng đáy mobile', () => {
    render(
      <BookingOnboardingShell>
        <div data-testid="booking-children">Nội dung</div>
      </BookingOnboardingShell>
    );

    expect(screen.getByTestId('landing-header')).toHaveAttribute(
      'data-hide-mobile-bottom-nav',
      'true'
    );
    expect(screen.getByTestId('landing-footer')).toBeInTheDocument();
    expect(screen.getByTestId('booking-children')).toBeInTheDocument();
    expect(document.querySelector('.max-w-7xl')).not.toBeNull();
    expect(document.querySelector('.bg-slate-50')).not.toBeNull();

    // Không còn menu Family Dashboard
    expect(screen.queryByText(/Bảng Sức Khỏe Gia Đình/i)).toBeNull();
    expect(screen.queryByText(/Quản lý Thành viên/i)).toBeNull();
  });

  it('không render menu Family Dashboard mà chỉ có top bar tối giản', () => {
    render(
      <BookingOnboardingShell>
        <div data-testid="booking-children">Nội dung</div>
      </BookingOnboardingShell>
    );

    expect(screen.queryByText(/Thanh toán VietQR & Biên lai/i)).toBeNull();
    expect(screen.queryByText(/Gói Chăm sóc & Tiến trình ký/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Bật hoặc tắt thanh điều hướng/i })).toBeNull();
  });

  it('đánh dấu bước hiện tại theo từng tuyến của luồng đặt gói', () => {
    mockPathname = '/booking/tracking';
    const { unmount } = render(
      <BookingOnboardingShell>
        <div />
      </BookingOnboardingShell>
    );
    expect(screen.getByTestId('booking-step-1')).toHaveAttribute('data-step-state', 'done');
    expect(screen.getByTestId('booking-step-2')).toHaveAttribute('data-step-state', 'current');
    unmount();

    mockPathname = '/booking/payment';
    render(
      <BookingOnboardingShell>
        <div />
      </BookingOnboardingShell>
    );
    expect(screen.getByTestId('booking-step-2')).toHaveAttribute('data-step-state', 'done');
    expect(screen.getByTestId('booking-step-3')).toHaveAttribute('data-step-state', 'current');
  });

  it('resolveBookingStepIndex trả về chỉ số bước đúng và mặc định bước 1', () => {
    expect(resolveBookingStepIndex('/booking')).toBe(0);
    expect(resolveBookingStepIndex('/booking/')).toBe(0);
    expect(resolveBookingStepIndex('/booking/tracking')).toBe(1);
    expect(resolveBookingStepIndex('/booking/payment')).toBe(2);
    expect(resolveBookingStepIndex(null)).toBe(0);
  });

  it('nút Quay lại ở Bước 1 trỏ về đúng hồ sơ bác sĩ đã chọn', () => {
    render(
      <BookingOnboardingShell>
        <ContextProbe doctorId="doc-9" />
      </BookingOnboardingShell>
    );

    expect(screen.getByRole('link', { name: /Quay lại hồ sơ bác sĩ/i })).toHaveAttribute(
      'href',
      '/doctors/doc-9'
    );
  });

  it('Bước 2 cho phép quay lại Bước 1 kèm contractId qua nút và stepper', () => {
    mockPathname = '/booking/tracking';
    render(
      <BookingOnboardingShell>
        <ContextProbe contractId="ctr-1" contractStatus="PENDING_APPROVAL" />
      </BookingOnboardingShell>
    );

    expect(screen.getByRole('link', { name: /Quay lại bước xác nhận gói/i })).toHaveAttribute(
      'href',
      '/booking?contractId=ctr-1'
    );
    expect(
      screen.getByRole('link', { name: /Quay lại bước 1: Xác nhận gói/i })
    ).toHaveAttribute('href', '/booking?contractId=ctr-1');
  });

  it('Bước 3 quay lại Bước 2 với cùng contractId', () => {
    mockPathname = '/booking/payment';
    render(
      <BookingOnboardingShell>
        <ContextProbe contractId="ctr-1" contractStatus="PENDING_PAYMENT" />
      </BookingOnboardingShell>
    );

    expect(
      screen.getByRole('link', { name: /Quay lại theo dõi ký hợp đồng/i })
    ).toHaveAttribute('href', '/booking/tracking?contractId=ctr-1');
    expect(
      screen.getByRole('link', { name: /Quay lại bước 2: Ký hợp đồng 4 bên/i })
    ).toHaveAttribute('href', '/booking/tracking?contractId=ctr-1');
    // Chưa ACTIVE nên vẫn quay lại được Bước 1
    expect(
      screen.getByRole('link', { name: /Quay lại bước 1: Xác nhận gói/i })
    ).toHaveAttribute('href', '/booking?contractId=ctr-1');
  });

  it('khóa quay lại Bước 1 khi hợp đồng đã ACTIVE', () => {
    mockPathname = '/booking/payment';
    render(
      <BookingOnboardingShell>
        <ContextProbe contractId="ctr-1" contractStatus="ACTIVE" />
      </BookingOnboardingShell>
    );

    expect(
      screen.queryByRole('link', { name: /Quay lại bước 1: Xác nhận gói/i })
    ).toBeNull();
    expect(screen.getByTestId('booking-step-1')).toHaveAttribute('data-step-state', 'done');
    // Bước 2 vẫn là đích quay lại của Bước 3
    expect(
      screen.getByRole('link', { name: /Quay lại bước 2: Ký hợp đồng 4 bên/i })
    ).toHaveAttribute('href', '/booking/tracking?contractId=ctr-1');
  });

  it('hiển thị chỉ báo gọn Bước N/3 cho màn hình nhỏ', () => {
    mockPathname = '/booking/tracking';
    render(
      <BookingOnboardingShell>
        <ContextProbe contractId="ctr-1" />
      </BookingOnboardingShell>
    );

    expect(screen.getByTestId('booking-step-compact')).toHaveTextContent(
      'Bước 2/3: Ký hợp đồng 4 bên'
    );
  });
});

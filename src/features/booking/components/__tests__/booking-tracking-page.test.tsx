import { describe, it, expect, vi } from 'vitest';
import React, { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import BookingTrackingPage from '@/app/booking/tracking/page';

vi.mock('@/features/booking', () => ({
  BookingTrackingStep: ({ contractId }: { contractId?: string }) => (
    <div data-testid="booking-tracking-step" data-contract-id={contractId ?? ''} />
  ),
}));

/**
 * Trang là synchronous Server Component bọc async loader trong `<Suspense>`.
 * React DOM (jsdom) không tự resolve async component, nên test lấy element con
 * của boundary, chờ loader phân giải `searchParams` rồi render kết quả.
 */
async function resolveSuspended(ui: React.ReactElement) {
  expect(ui.type).toBe(Suspense);
  const child = React.Children.only(
    (ui.props as { children: React.ReactNode }).children
  ) as React.ReactElement;
  const loader = child.type as (props: unknown) => Promise<React.ReactElement>;
  return loader(child.props);
}

describe('Trang /booking/tracking (Bước 2 luồng đặt gói)', () => {
  it('page là synchronous và bọc searchParams trong boundary <Suspense>', () => {
    const ui = BookingTrackingPage({ searchParams: new Promise(() => {}) });
    expect(ui).not.toBeInstanceOf(Promise);
    expect(ui.type).toBe(Suspense);
  });

  it('truyền contractId từ query param xuống BookingTrackingStep', async () => {
    const ui = BookingTrackingPage({
      searchParams: Promise.resolve({ contractId: 'ctr-123' }),
    });
    render(await resolveSuspended(ui));

    expect(screen.getByTestId('booking-tracking-step')).toHaveAttribute(
      'data-contract-id',
      'ctr-123'
    );
  });

  it('không truyền contractId khi thiếu tham số hoặc tham số là mảng', async () => {
    const withoutParam = BookingTrackingPage({
      searchParams: Promise.resolve({}),
    });
    const { unmount } = render(await resolveSuspended(withoutParam));
    expect(screen.getByTestId('booking-tracking-step')).toHaveAttribute(
      'data-contract-id',
      ''
    );
    unmount();

    const withArray = BookingTrackingPage({
      searchParams: Promise.resolve({ contractId: ['a', 'b'] }),
    });
    render(await resolveSuspended(withArray));
    expect(screen.getByTestId('booking-tracking-step')).toHaveAttribute(
      'data-contract-id',
      ''
    );
  });
});

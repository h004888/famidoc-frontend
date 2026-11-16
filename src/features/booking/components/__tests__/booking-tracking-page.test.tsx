import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BookingTrackingPage from '@/app/booking/tracking/page';

vi.mock('@/features/booking', () => ({
  BookingTrackingStep: ({ contractId }: { contractId?: string }) => (
    <div data-testid="booking-tracking-step" data-contract-id={contractId ?? ''} />
  ),
}));

describe('Trang /booking/tracking (Bước 2 luồng đặt gói)', () => {
  it('truyền contractId từ query param xuống BookingTrackingStep', async () => {
    const ui = await BookingTrackingPage({
      searchParams: Promise.resolve({ contractId: 'ctr-123' }),
    });
    render(ui);

    expect(screen.getByTestId('booking-tracking-step')).toHaveAttribute(
      'data-contract-id',
      'ctr-123'
    );
  });

  it('không truyền contractId khi thiếu tham số hoặc tham số là mảng', async () => {
    const withoutParam = await BookingTrackingPage({
      searchParams: Promise.resolve({}),
    });
    const { unmount } = render(withoutParam);
    expect(screen.getByTestId('booking-tracking-step')).toHaveAttribute('data-contract-id', '');
    unmount();

    const withArray = await BookingTrackingPage({
      searchParams: Promise.resolve({ contractId: ['a', 'b'] }),
    });
    render(withArray);
    expect(screen.getByTestId('booking-tracking-step')).toHaveAttribute('data-contract-id', '');
  });
});

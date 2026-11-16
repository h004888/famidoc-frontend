import { describe, it, expect, vi } from 'vitest';
import React, { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import BookingSummaryPage from '@/app/booking/page';
import BookingPaymentPage from '@/app/booking/payment/page';

vi.mock('@/features/booking', () => ({
  BookingSummaryStep: (props: {
    packageId?: string;
    doctorId?: string;
    facilityId?: string;
    contractId?: string;
    requestedMembers?: number;
  }) => (
    <div
      data-testid="booking-summary-step"
      data-package-id={props.packageId ?? ''}
      data-doctor-id={props.doctorId ?? ''}
      data-facility-id={props.facilityId ?? ''}
      data-contract-id={props.contractId ?? ''}
      data-members={props.requestedMembers ?? ''}
    />
  ),
  BookingPaymentStep: ({ contractId }: { contractId?: string }) => (
    <div data-testid="booking-payment-step" data-contract-id={contractId ?? ''} />
  ),
}));

/**
 * Page là synchronous Server Component bọc async loader trong `<Suspense>`;
 * helper này lấy loader con, chờ phân giải `searchParams` rồi render kết quả.
 */
async function resolveSuspended(ui: React.ReactElement) {
  expect(ui.type).toBe(Suspense);
  const child = React.Children.only(
    (ui.props as { children: React.ReactNode }).children
  ) as React.ReactElement;
  const loader = child.type as (props: unknown) => Promise<React.ReactElement>;
  return loader(child.props);
}

describe('Trang /booking (Bước 1 luồng đặt gói)', () => {
  it('page là synchronous và bọc searchParams trong boundary <Suspense>', () => {
    const ui = BookingSummaryPage({ searchParams: new Promise(() => {}) });
    expect(ui).not.toBeInstanceOf(Promise);
    expect(ui.type).toBe(Suspense);
  });

  it('đọc searchParams bên trong <Suspense> và truyền đủ tham số xuống BookingSummaryStep', async () => {
    const ui = BookingSummaryPage({
      searchParams: Promise.resolve({
        packageId: 'pkg-1',
        doctorId: 'doc-1',
        facilityId: 'fac-1',
        members: '4',
      }),
    });
    render(await resolveSuspended(ui));

    const step = screen.getByTestId('booking-summary-step');
    expect(step).toHaveAttribute('data-package-id', 'pkg-1');
    expect(step).toHaveAttribute('data-doctor-id', 'doc-1');
    expect(step).toHaveAttribute('data-facility-id', 'fac-1');
    expect(step).toHaveAttribute('data-members', '4');
  });
});

describe('Trang /booking/payment (Bước 3 luồng đặt gói)', () => {
  it('page là synchronous và bọc searchParams trong boundary <Suspense>', () => {
    const ui = BookingPaymentPage({ searchParams: new Promise(() => {}) });
    expect(ui).not.toBeInstanceOf(Promise);
    expect(ui.type).toBe(Suspense);
  });

  it('truyền contractId đã phân giải (trim) xuống BookingPaymentStep', async () => {
    const ui = BookingPaymentPage({
      searchParams: Promise.resolve({ contractId: ' ctr-999 ' }),
    });
    render(await resolveSuspended(ui));

    expect(screen.getByTestId('booking-payment-step')).toHaveAttribute(
      'data-contract-id',
      'ctr-999'
    );
  });

  it('không truyền contractId khi tham số là mảng', async () => {
    const ui = BookingPaymentPage({
      searchParams: Promise.resolve({ contractId: ['a', 'b'] }),
    });
    render(await resolveSuspended(ui));

    expect(screen.getByTestId('booking-payment-step')).toHaveAttribute(
      'data-contract-id',
      ''
    );
  });
});

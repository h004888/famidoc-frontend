import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FamilyBillingView } from '../family-billing-view';

let query: URLSearchParams;
let pending: { id: string; contractStatus: string } | undefined;

vi.mock('next/navigation', () => ({ useSearchParams: () => query }));
vi.mock('@/components/layout/family-subscription-gate', () => ({
  useFamilySubscriptionGateState: () => ({
    gateStatus: { pendingContract: pending },
    isLoadingGate: false,
    gateError: null,
  }),
}));
vi.mock('@/features/booking', () => ({
  BookingPaymentStep: ({ contractId, addendumId }: { contractId: string; addendumId?: string }) =>
    <div data-testid="payment-step">{contractId} {addendumId}</div>,
}));

describe('FamilyBillingView', () => {
  beforeEach(() => {
    query = new URLSearchParams();
    pending = undefined;
  });

  it('uses the pending contract returned by the family gate', () => {
    pending = { id: 'contract-1', contractStatus: 'PENDING_PAYMENT' };
    render(<FamilyBillingView />);
    expect(screen.getByTestId('payment-step')).toHaveTextContent('contract-1');
  });

  it('passes a signed addendum payment link to the VietQR screen', () => {
    query = new URLSearchParams('contractId=contract-1&addendumId=addendum-1');
    render(<FamilyBillingView />);
    expect(screen.getByTestId('payment-step')).toHaveTextContent('contract-1 addendum-1');
  });

  it('shows an empty state without a demo payment option', () => {
    render(<FamilyBillingView />);
    expect(screen.getByText(/Không có hợp đồng nào đang chờ thanh toán/)).toBeInTheDocument();
    expect(screen.queryByTestId('payment-step')).not.toBeInTheDocument();
  });
});

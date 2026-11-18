import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FacilityRevenueView } from '../facility-revenue-view';

vi.mock('@/lib/api/finance.api', () => ({
  financeApi: {
    getAnalytics: vi.fn().mockResolvedValue({
      year: 2026,
      month: 10,
      environment: 'LIVE',
      grossVnd: 0,
      facilityShareVnd: 0,
      platformFeeVnd: 0,
      invoiceCount: 0,
      settlements: [],
    }),
  },
}));

describe('FacilityRevenueView Responsive Layout', () => {
  it('renders cleanly without nested <main> and includes mobile card container', async () => {
    const { container } = render(<FacilityRevenueView />);
    await screen.findByText('Bảng quyết toán của kỳ');
    expect(container.querySelector('main')).toBeNull();
    expect(container.querySelector('.md\\:hidden')).not.toBeNull();
  });
});

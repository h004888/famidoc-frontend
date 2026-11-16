import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FacilityRevenueView } from '../facility-revenue-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/facility/revenue',
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    contractsApi: {
      ...actual.contractsApi,
      getFacilitySettlements: vi.fn().mockResolvedValue([]),
    },
  };
});

describe('FacilityRevenueView Responsive Layout', () => {
  it('renders cleanly without nested <main> and includes mobile card container', () => {
    const { container } = render(<FacilityRevenueView />);
    expect(container.querySelector('main')).toBeNull();
    expect(container.querySelector('.md\\:hidden')).not.toBeNull();
  });
});

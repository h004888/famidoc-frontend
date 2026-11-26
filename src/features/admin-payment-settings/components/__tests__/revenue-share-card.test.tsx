import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RevenueShareCard, validateFacilityShare } from '../revenue-share-card';
import { adminApi } from '@/lib/api/admin.api';

vi.mock('@/lib/api/admin.api', () => ({
  adminApi: { revenueConfig: vi.fn(), updateRevenueConfig: vi.fn() },
}));

describe('validateFacilityShare', () => {
  it('accepts 50–95 integers only', () => {
    expect(validateFacilityShare(85)).toBeNull();
    expect(validateFacilityShare(49)).not.toBeNull();
    expect(validateFacilityShare(96)).not.toBeNull();
    expect(validateFacilityShare(80.5)).not.toBeNull();
  });
});

describe('RevenueShareCard', () => {
  beforeEach(() => {
    vi.mocked(adminApi.revenueConfig).mockResolvedValue({ facilityRevenueRate: 85, platformCommissionRate: 15, updatedAt: null });
    vi.mocked(adminApi.updateRevenueConfig).mockResolvedValue({ facilityRevenueRate: 80, platformCommissionRate: 20, updatedAt: '2026-11-25T00:00:00Z' });
  });

  it('loads config and saves platform share as 100 - facility share', async () => {
    render(<RevenueShareCard />);
    const input = await screen.findByLabelText('Cơ sở y tế nhận');
    expect(screen.getByRole('button', { name: 'Lưu tỷ lệ' })).toBeDisabled();
    fireEvent.change(input, { target: { value: '80' } });
    expect(screen.getByText('20%')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Lưu tỷ lệ' }));
    await waitFor(() =>
      expect(adminApi.updateRevenueConfig).toHaveBeenCalledWith({ facilityRevenueRate: 80, platformCommissionRate: 20 }),
    );
    expect(await screen.findByText('Đã lưu tỷ lệ doanh thu.')).toBeTruthy();
  });

  it('blocks out-of-range values', async () => {
    render(<RevenueShareCard />);
    const input = await screen.findByLabelText('Cơ sở y tế nhận');
    fireEvent.change(input, { target: { value: '99' } });
    expect(screen.getByRole('alert').textContent).toContain('50–95');
    expect(screen.getByRole('button', { name: 'Lưu tỷ lệ' })).toBeDisabled();
  });
});

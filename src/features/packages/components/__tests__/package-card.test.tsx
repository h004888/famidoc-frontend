import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PackageCard } from '../package-card';
import { PackageItem } from '../../schemas/package.schema';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockPkg: PackageItem = {
  id: 'pkg-family',
  name: 'Gia Đình Toàn Diện',
  price: 1290000,
  period: 'tháng',
  tier: 'Toàn diện',
  badgeColor: 'amber',
  isPopular: true,
  features: ['6 lượt khám tận nhà / năm', 'Bác sĩ riêng chỉ định'],
};

describe('UT-CMP-04, UT-ACT-06: PackageCard Component Interactions', () => {
  it('renders package title, formatted price, and features', () => {
    render(<PackageCard pkg={mockPkg} />);
    expect(screen.getByRole('heading', { level: 3, name: /Gia Đình Toàn Diện/i })).toBeInTheDocument();
    expect(screen.getByText(/1.290.000/)).toBeInTheDocument();
    expect(screen.getByText(/6 lượt khám tận nhà \/ năm/i)).toBeInTheDocument();
  });

  it('UT-ACT-06 (FL-03): navigates to /register?packageId=... when clicking register button', async () => {
    render(<PackageCard pkg={mockPkg} />);
    const btn = screen.getByRole('button', { name: /Đăng ký gói này/i });
    await userEvent.click(btn);
    expect(mockPush).toHaveBeenCalledWith('/register?packageId=pkg-family');
  });
});

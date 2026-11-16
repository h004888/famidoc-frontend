import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DashboardSidebar } from '../dashboard-sidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/contracts/CTR-4P-2026-88219/review',
}));

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    role: 'ADMIN',
    user: {
      name: 'Super Admin',
      phone: '0901234567',
      facilityOrTitle: 'Ban Điều Hành FamiDoc',
      avatarText: 'AD',
    },
    logout: vi.fn(),
  }),
  getDefaultPathForRole: (role: string) => `/${role.toLowerCase()}`,
}));

describe('DashboardSidebar Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders sidebar with default expanded state (w-64) and without pin button', () => {
    const { container } = render(<DashboardSidebar />);

    // Pin button should no longer exist
    const pinBtn = screen.queryByRole('button', { name: /Bỏ ghim thanh điều hướng|Ghim thanh điều hướng/i });
    expect(pinBtn).not.toBeInTheDocument();

    // Default aside should have w-64
    const aside = container.querySelector('aside');
    expect(aside).toHaveAttribute('data-state', 'expanded');
    expect(aside).toHaveClass('w-64');
  });

  it('renders collapsed state (w-20) with icon logo and page icons when collapsed', () => {
    localStorage.setItem('famidoc_sidebar_pinned', 'false');
    const { container } = render(<DashboardSidebar />);

    const aside = container.querySelector('aside')!;
    expect(aside).toHaveAttribute('data-state', 'collapsed');
    expect(aside).toHaveClass('w-20');

    // Shows compact logo without text
    const iconLogo = screen.getByAltText('FamiDoc Icon');
    expect(iconLogo).toBeInTheDocument();
    expect(iconLogo).toHaveAttribute('src', '/images/logo_khong_chu.png');

    // Page icon elements should be visible inside aside
    expect(within(aside).getByText('monitoring')).toBeInTheDocument();
    expect(within(aside).getByText('local_hospital')).toBeInTheDocument();

    // Hover should NOT expand the sidebar (stays w-20)
    fireEvent.mouseEnter(aside);
    expect(aside).toHaveAttribute('data-state', 'collapsed');
    expect(aside).toHaveClass('w-20');
  });

  it('respects pre-existing localStorage preference if pinned was saved as false', () => {
    localStorage.setItem('famidoc_sidebar_pinned', 'false');

    const { container } = render(<DashboardSidebar />);

    const aside = container.querySelector('aside');
    expect(aside).toHaveAttribute('data-state', 'collapsed');
    expect(aside).toHaveClass('w-20');
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('DashboardSidebar Navigation Pinning', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders sidebar with default pinned state (w-64) and pin button', () => {
    const { container } = render(<DashboardSidebar />);

    // Pin button should be present in the document
    const pinBtn = screen.getByRole('button', { name: /Bỏ ghim thanh điều hướng|Ghim thanh điều hướng/i });
    expect(pinBtn).toBeInTheDocument();

    // Default aside should have w-64
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('w-64');
    expect(pinBtn).toHaveAttribute('title', expect.stringContaining('Bỏ ghim'));
  });

  it('toggles pin state when pin button is clicked and persists in localStorage', () => {
    const { container } = render(<DashboardSidebar />);

    const pinBtn = screen.getByRole('button', { name: /Bỏ ghim thanh điều hướng/i });
    expect(pinBtn).toBeInTheDocument();

    // Click to unpin
    fireEvent.click(pinBtn);

    expect(localStorage.getItem('famidoc_sidebar_pinned')).toBe('false');

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('w-20');

    // Click to pin again
    const pinAgainBtn = screen.getByRole('button', { name: /Ghim thanh điều hướng/i });
    fireEvent.click(pinAgainBtn);

    expect(localStorage.getItem('famidoc_sidebar_pinned')).toBe('true');
    expect(aside).toHaveClass('w-64');
  });

  it('respects pre-existing localStorage preference if pinned was saved as false', () => {
    localStorage.setItem('famidoc_sidebar_pinned', 'false');

    const { container } = render(<DashboardSidebar />);

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('w-20');
  });
});

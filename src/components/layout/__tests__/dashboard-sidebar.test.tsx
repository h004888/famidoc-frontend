import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DashboardSidebar, ROLE_MENUS } from '../dashboard-sidebar';
import type { LoginRole } from '@/features/auth/schemas/auth.schema';

let mockPathname = '/admin/contracts/CTR-4P-2026-88219/review';
let mockRole: LoginRole = 'ADMIN';
const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    role: mockRole,
    user: {
      name: 'Super Admin',
      phone: '0901234567',
      facilityOrTitle: 'Ban Điều Hành FamiDoc',
      avatarText: 'AD',
    },
    logout,
  }),
  getDefaultPathForRole: (role: string) => `/${role.toLowerCase()}`,
}));

describe('DashboardSidebar Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockPathname = '/admin/contracts/CTR-4P-2026-88219/review';
    mockRole = 'ADMIN';
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
    expect(within(aside).getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument();

    // Hover should NOT expand the sidebar (stays w-20)
    fireEvent.mouseEnter(aside);
    expect(aside).toHaveAttribute('data-state', 'collapsed');
    expect(aside).toHaveClass('w-20');
  });

  it('lets an admin sign out from the sidebar on a nested admin page', () => {
    render(<DashboardSidebar />);

    const button = within(screen.getByRole('complementary')).getByRole('button', { name: 'Đăng xuất' });
    expect(button).toHaveTextContent('Đăng xuất');
    fireEvent.click(button);
    expect(logout).toHaveBeenCalledOnce();
  });

  it('lets an admin sign out from the mobile drawer', () => {
    render(<DashboardSidebar />);

    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }));
    const drawer = screen.getByRole('dialog');
    fireEvent.click(within(drawer).getByRole('button', { name: 'Đăng xuất' }));
    expect(logout).toHaveBeenCalledOnce();
  });

  it('respects pre-existing localStorage preference if pinned was saved as false', () => {
    localStorage.setItem('famidoc_sidebar_pinned', 'false');

    const { container } = render(<DashboardSidebar />);

    const aside = container.querySelector('aside');
    expect(aside).toHaveAttribute('data-state', 'collapsed');
    expect(aside).toHaveClass('w-20');
  });

  it('configures FACILITY sidebar IA with separate B2B contracts, 4-party contracts, and doctor directory routes', () => {
    const facilityItems = ROLE_MENUS.FACILITY.items;
    const b2bItem = facilityItems.find((item) => item.href === '/facility/contracts');
    const fourPartyItem = facilityItems.find((item) => item.href === '/facility/coordination');
    const doctorsItem = facilityItems.find((item) => item.href === '/facility/doctors');

    expect(b2bItem).toMatchObject({
      href: '/facility/contracts',
      label: 'Hợp đồng Hợp tác B2B',
      shortLabel: 'HĐ B2B',
    });
    expect(fourPartyItem).toMatchObject({
      href: '/facility/coordination',
      label: 'Hợp đồng Y tế 4 bên',
      shortLabel: 'HĐ 4 bên',
    });
    expect(doctorsItem).toMatchObject({
      href: '/facility/doctors',
    });

    mockPathname = '/facility/coordination';
    render(<DashboardSidebar initialRole="FACILITY" />);
    expect(screen.getAllByText('Hợp đồng Hợp tác B2B').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hợp đồng Y tế 4 bên').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Đăng xuất' }).length).toBeGreaterThan(0);
  });

  it('excludes training and package catalog from ADMIN sidebar and shows "Cài đặt" without BHYT', () => {
    const adminItems = ROLE_MENUS.ADMIN.items;
    const trainingItem = adminItems.find((item) => item.href === '/admin/training');
    expect(trainingItem).toBeUndefined();

    render(<DashboardSidebar />);

    const aside = within(screen.getByRole('complementary'));
    expect(aside.getByRole('link', { name: 'Cấu hình AI Matching' })).toHaveAttribute('href', '/admin/matching-config');

    // Bottom utilities should not contain 'Danh mục Gói Dịch vụ'
    expect(screen.queryByText('Danh mục Gói Dịch vụ')).not.toBeInTheDocument();

    // Settings item should be 'Cài đặt' and not 'Cài đặt & Hồ sơ BHYT'
    expect(screen.getAllByText('Cài đặt').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Hồ sơ BHYT/i)).not.toBeInTheDocument();
  });

  it.each([
    ['/family', 'FAMILY'],
    ['/doctor', 'DOCTOR'],
    ['/facility', 'FACILITY'],
    ['/settings', 'PATIENT'],
  ] as const)('keeps the original utilities at %s for %s', (pathname, role) => {
    mockPathname = pathname;
    mockRole = role;
    render(<DashboardSidebar />);

    const aside = within(screen.getByRole('complementary'));
    expect(aside.queryByRole('link', { name: 'Danh mục Gói Dịch vụ' })).not.toBeInTheDocument();
    const settingsLabel = role === 'FAMILY' || role === 'PATIENT' ? 'Cài đặt & Hồ sơ BHYT' : 'Cài đặt tài khoản';
    expect(aside.getByRole('link', { name: settingsLabel })).toHaveAttribute('href', '/settings');
    expect(aside.getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument();
  });

  it('uses the admin sidebar on shared settings when signed in as an admin', () => {
    mockPathname = '/settings';
    render(<DashboardSidebar />);

    const aside = within(screen.getByRole('complementary'));
    expect(aside.getByRole('link', { name: 'Cài đặt' })).toHaveAttribute('href', '/settings');
    expect(aside.queryByRole('link', { name: 'Danh mục Gói Dịch vụ' })).not.toBeInTheDocument();
    expect(aside.getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument();
  });

  it('renders full doctor contract sidebar label without truncation when expanded', () => {
    mockPathname = '/doctor/contracts';
    const { container } = render(<DashboardSidebar initialRole="DOCTOR" />);

    const aside = container.querySelector('aside')!;
    const label = within(aside).getByText('Hợp đồng & Phụ trách Hộ');
    expect(label).toBeInTheDocument();
    expect(label).not.toHaveClass('truncate');
    expect(label.parentElement).not.toHaveClass('truncate');
  });
});

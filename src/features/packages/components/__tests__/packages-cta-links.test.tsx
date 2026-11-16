import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PackagesCatalogView } from '../packages-catalog-view';
import { PackageDetailView } from '../package-detail-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/packages',
  useSearchParams: () => new URLSearchParams(),
}));

let mockIsAuthenticated = true;

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: mockIsAuthenticated
      ? {
          id: 'usr-1',
          name: 'Nguyễn Văn A',
          phone: '0901234567',
          email: 'a@famidoc.vn',
          role: 'FAMILY',
          avatarText: 'NA',
        }
      : null,
    role: 'FAMILY',
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    getDefaultPathForRole: () => '/family',
  }),
  getDefaultPathForRole: () => '/family',
}));

vi.mock('@/features/landing', () => ({
  LandingHeader: () => <div data-testid="landing-header" />,
  LandingFooter: () => <div data-testid="landing-footer" />,
}));

describe('CTA chọn gói trên các trang công khai dẫn vào luồng /doctors -> /booking', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
  });

  it('PackagesCatalogView: người dùng đã đăng nhập chọn gói sẽ sang /doctors?packageId=<code>', () => {
    render(<PackagesCatalogView />);

    const doctorLinks = screen
      .getAllByRole('link')
      .map((el) => el.getAttribute('href'))
      .filter((href): href is string => Boolean(href?.startsWith('/doctors?packageId=')));

    expect(doctorLinks).toContain('/doctors?packageId=BASIC');
    expect(doctorLinks).toContain('/doctors?packageId=FAMILY');
    expect(doctorLinks).toContain('/doctors?packageId=ELDERLY');
    expect(doctorLinks).toContain('/doctors?packageId=ROYAL');

    const allLinks = screen.getAllByRole('link');
    expect(
      allLinks.some((el) => (el.getAttribute('href') ?? '').includes('/family/subscription'))
    ).toBe(false);
  });

  it('PackagesCatalogView: khách chưa đăng nhập vẫn được đưa tới /register?packageId=...', () => {
    mockIsAuthenticated = false;
    render(<PackagesCatalogView />);

    const registerLinks = screen
      .getAllByRole('link')
      .map((el) => el.getAttribute('href'))
      .filter((href): href is string => Boolean(href?.startsWith('/register?packageId=')));

    expect(registerLinks).toContain('/register?packageId=FAMILY');
    expect(registerLinks.length).toBeGreaterThan(0);
  });

  it('PackageDetailView: CTA chính dẫn sang /doctors?packageId=... thay vì mở modal ký hợp đồng', () => {
    render(<PackageDetailView packageId="pkg-toan-dien" />);

    const primary = screen.getByRole('link', { name: /Chọn bác sĩ & đăng ký gói/i });
    expect(primary).toHaveAttribute('href', '/doctors?packageId=pkg-toan-dien');

    expect(screen.queryByText(/Ký Hợp Đồng Gói Khám/i)).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

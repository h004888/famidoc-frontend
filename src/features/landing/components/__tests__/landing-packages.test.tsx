import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingPackages } from '../landing-packages';

let mockIsAuthenticated = false;

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
  }),
}));

describe('LandingPackages', () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
  });

  it('đưa người dùng chưa đăng nhập tới /register?packageId=... và không trỏ vào /family/subscription', () => {
    render(<LandingPackages />);

    const links = screen.getAllByRole('link');
    const packageLinks = links.filter((el) =>
      el.getAttribute('href')?.startsWith('/register?packageId=')
    );

    expect(packageLinks.map((el) => el.getAttribute('href'))).toEqual([
      '/register?packageId=BASIC',
      '/register?packageId=FAMILY',
      '/register?packageId=ELDERLY',
      '/register?packageId=ROYAL',
    ]);
    for (const link of links) {
      expect(link.getAttribute('href')).not.toContain('/family/subscription');
    }
  });

  it('đưa người dùng đã đăng nhập tới /doctors?packageId=... để chọn bác sĩ trước khi đặt gói', () => {
    mockIsAuthenticated = true;
    render(<LandingPackages />);

    const links = screen.getAllByRole('link');
    const doctorLinks = links.filter((el) =>
      el.getAttribute('href')?.startsWith('/doctors?packageId=')
    );

    expect(doctorLinks.map((el) => el.getAttribute('href'))).toEqual([
      '/doctors?packageId=BASIC',
      '/doctors?packageId=FAMILY',
      '/doctors?packageId=ELDERLY',
      '/doctors?packageId=ROYAL',
    ]);
    for (const link of links) {
      expect(link.getAttribute('href')).not.toContain('/family/subscription');
    }
  });
});

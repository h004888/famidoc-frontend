import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingPackages } from '../landing-packages';
import { mockPublicPackages } from '@/test/mocks/handlers/landing.handler';

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

  it('đưa người dùng chưa đăng nhập tới /register?packageId=<uuid>', () => {
    render(<LandingPackages packages={mockPublicPackages} />);

    const links = screen.getAllByRole('link');
    const packageLinks = links.filter((el) =>
      el.getAttribute('href')?.startsWith('/register?packageId=')
    );

    expect(packageLinks.map((el) => el.getAttribute('href'))).toEqual([
      '/register?packageId=10000000-0000-4000-8000-000000000001',
      '/register?packageId=20000000-0000-4000-8000-000000000002',
      '/register?packageId=30000000-0000-4000-8000-000000000003',
      '/register?packageId=40000000-0000-4000-8000-000000000004',
    ]);
  });

  it('đưa người dùng đã đăng nhập tới /doctors?packageId=<uuid> để chọn bác sĩ trước khi đặt gói', () => {
    mockIsAuthenticated = true;
    render(<LandingPackages packages={mockPublicPackages} />);

    const links = screen.getAllByRole('link');
    const doctorLinks = links.filter((el) =>
      el.getAttribute('href')?.startsWith('/doctors?packageId=')
    );

    expect(doctorLinks.map((el) => el.getAttribute('href'))).toEqual([
      '/doctors?packageId=10000000-0000-4000-8000-000000000001',
      '/doctors?packageId=20000000-0000-4000-8000-000000000002',
      '/doctors?packageId=30000000-0000-4000-8000-000000000003',
      '/doctors?packageId=40000000-0000-4000-8000-000000000004',
    ]);
  });

  it('hiển thị trạng thái rỗng an toàn khi không có gói nào từ Backend', () => {
    render(<LandingPackages packages={[]} />);
    expect(screen.getByRole('link', { name: /Xem tất cả gói dịch vụ/i })).toHaveAttribute(
      'href',
      '/packages'
    );
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingPackages } from '../landing-packages';
import { mockPublicPackages } from '@/test/mocks/handlers/landing.handler';

let mockIsAuthenticated = false;
let mockIsLoading = false;
let mockRole = 'FAMILY';

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
    isLoading: mockIsLoading,
    role: mockRole,
  }),
}));

describe('LandingPackages', () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
    mockIsLoading = false;
    mockRole = 'FAMILY';
  });

  it('không hiển thị link /register khi auth đang isLoading', () => {
    mockIsLoading = true;
    render(<LandingPackages packages={mockPublicPackages} />);

    const registerLinks = screen
      .queryAllByRole('link')
      .filter((el) => el.getAttribute('href')?.startsWith('/register'));
    expect(registerLinks).toHaveLength(0);
    expect(screen.queryByText(/Đăng ký ngay/i)).not.toBeInTheDocument();
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

  it.each(['ADMIN', 'FACILITY', 'DOCTOR'])(
    'giữ nút "Đăng ký ngay" tới /register?packageId=<uuid> khi role là %s',
    (staffRole) => {
      mockIsAuthenticated = true;
      mockRole = staffRole;
      render(<LandingPackages packages={mockPublicPackages} />);

      const links = screen.getAllByRole('link');
      const registerLinks = links.filter((el) =>
        el.getAttribute('href')?.startsWith('/register?packageId='),
      );
      expect(registerLinks).toHaveLength(4);
      expect(screen.getAllByText(/Đăng ký ngay/i)).toHaveLength(4);
      expect(screen.queryByText(/Chọn gói này/i)).not.toBeInTheDocument();
    },
  );

  it('hiển thị trạng thái rỗng an toàn khi không có gói nào từ Backend', () => {
    render(<LandingPackages packages={[]} />);
    expect(screen.getByRole('link', { name: /Xem tất cả gói dịch vụ/i })).toHaveAttribute(
      'href',
      '/packages'
    );
  });
});

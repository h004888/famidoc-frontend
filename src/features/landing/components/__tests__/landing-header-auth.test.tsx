import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingHeader } from '../landing-header';
import * as authContextModule from '@/features/auth/context/auth-context';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('Task 4: LandingHeader Authentication and Session State Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Login and Register action links when user is unauthenticated', () => {
    vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      user: null,
      role: 'FAMILY',
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getDefaultPathForRole: authContextModule.getDefaultPathForRole,
    });

    render(<LandingHeader />);

    expect(screen.getByRole('link', { name: /Đăng nhập/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Đăng ký/i })).toHaveAttribute('href', '/register');
    expect(screen.queryByLabelText(/Đăng xuất tài khoản/i)).not.toBeInTheDocument();
  });

  it('renders user avatar, user name, dashboard navigation and logout button when user is authenticated with FAMILY role', async () => {
    const mockLogout = vi.fn();
    vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 'usr-123',
        name: 'Nguyễn Văn Đại Diện',
        email: 'rep@famidoc.vn',
        phone: '0987654321',
        role: 'FAMILY',
        avatarText: 'NV',
      },
      role: 'FAMILY',
      isLoading: false,
      login: vi.fn(),
      logout: mockLogout,
      getDefaultPathForRole: authContextModule.getDefaultPathForRole,
    });

    render(<LandingHeader />);

    expect(screen.getByText('Nguyễn Văn Đại Diện')).toBeInTheDocument();
    expect(screen.getByText('NV')).toBeInTheDocument();

    const dashboardLink = screen.getByTitle('Vào Bảng Điều Khiển');
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute('href', '/family');

    const logoutBtn = screen.getByLabelText('Đăng xuất tài khoản');
    expect(logoutBtn).toBeInTheDocument();
    await userEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

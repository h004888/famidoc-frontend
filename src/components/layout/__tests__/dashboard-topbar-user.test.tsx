import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardTopbarUser } from '../dashboard-topbar-user';

const logoutMock = vi.fn();

let mockAuthState = {
  role: 'ADMIN' as const,
  isAuthenticated: true,
  user: {
    id: 'adm-1',
    name: 'Quản trị viên',
    email: 'admin@famidoc.vn',
    phone: '0901888999',
    role: 'ADMIN' as const,
    avatarText: 'QU',
  },
  logout: logoutMock,
};

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => mockAuthState,
}));

describe('DashboardTopbarUser', () => {
  beforeEach(() => {
    logoutMock.mockReset();
    mockAuthState = {
      role: 'ADMIN',
      isAuthenticated: true,
      user: {
        id: 'adm-1',
        name: 'Quản trị viên',
        email: 'admin@famidoc.vn',
        phone: '0901888999',
        role: 'ADMIN',
        avatarText: 'QU',
      },
      logout: logoutMock,
    };
  });

  it('mở dropdown khi bấm vào cụm tài khoản, hiển thị liên kết đúng vai trò và đóng bằng Escape', async () => {
    const user = userEvent.setup();
    render(<DashboardTopbarUser />);

    const trigger = screen.getByRole('button', { name: 'Mở menu tài khoản' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('admin@famidoc.vn')).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /Tài khoản & phân quyền/i }),
    ).toHaveAttribute('href', '/admin/users');
    expect(
      screen.getByRole('menuitem', { name: /Cài đặt tài khoản & bảo mật/i }),
    ).toHaveAttribute('href', '/settings');
    expect(
      screen.getByRole('menuitem', { name: /Trung tâm thông báo/i }),
    ).toHaveAttribute('href', '/notifications');

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('gọi logout() khi chọn Đăng xuất trong dropdown', async () => {
    const user = userEvent.setup();
    render(<DashboardTopbarUser />);

    await user.click(screen.getByRole('button', { name: 'Mở menu tài khoản' }));
    const logoutItem = await screen.findByRole('menuitem', { name: /Đăng xuất/i });
    await user.click(logoutItem);

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});

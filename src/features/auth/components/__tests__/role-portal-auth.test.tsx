import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleLoginForm } from '../role-login-form';
import { LoginForm } from '../login-form';
import { AuthProvider, useAuth } from '../../context/auth-context';
import * as authStorage from '@/lib/auth-storage';

let mockSearchParams = new URLSearchParams();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: replaceMock,
  }),
  useSearchParams: () => mockSearchParams,
}));

function setBrowserLocation(host: string, pathname = '/login') {
  const protocol = host.includes('localhost') ? 'http:' : 'https:';
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: {
      href: `${protocol}//${host}${pathname}`,
      origin: `${protocol}//${host}`,
      protocol,
      host,
      hostname: host.split(':')[0],
      pathname,
      search: '',
      hash: '',
      replace: replaceMock,
      assign: vi.fn(),
    },
  });
}

describe('Role portal isolation & Logout flow', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    authStorage.clearAuthSession();
    mockSearchParams = new URLSearchParams();
  });

  it('LoginForm từ chối lưu phiên khi ADMIN đăng nhập tại localhost:3000/login', async () => {
    setBrowserLocation('localhost:3000', '/login');
    const saveSpy = vi.spyOn(authStorage, 'saveAuthSession');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        code: 200,
        data: {
          accessToken: 'admin-jwt-token',
          role: 'ADMIN',
          user: {
            id: 'adm-1',
            email: 'admin@famidoc.vn',
            fullName: 'Quản trị viên',
            role: 'ADMIN',
            status: 'ACTIVE',
          },
        },
      }),
    } as Response);

    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/Email/i), 'admin@famidoc.vn');
    await userEvent.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password@123');
    await userEvent.click(screen.getByRole('button', { name: /Đăng nhập hệ thống/i }));

    expect(
      await screen.findByText(/chỉ dành riêng cho Khách hàng Gia đình/i),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Chuyển tới Cổng Quản Trị Viên/i });
    expect(link).toHaveAttribute('href', '/admin/login');
    expect(saveSpy).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();

    saveSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('LoginForm trên famidoc.online hiển thị link sang subdomain bác sĩ khi DOCTOR đăng nhập nhầm', async () => {
    setBrowserLocation('famidoc.online', '/login');
    const saveSpy = vi.spyOn(authStorage, 'saveAuthSession');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        code: 200,
        data: {
          accessToken: 'doc-jwt-token',
          role: 'DOCTOR',
          user: {
            id: 'doc-1',
            email: 'doctor@famidoc.vn',
            fullName: 'BS Nguyễn Văn B',
            role: 'DOCTOR',
            status: 'ACTIVE',
          },
        },
      }),
    } as Response);

    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/Email/i), 'doctor@famidoc.vn');
    await userEvent.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password@123');
    await userEvent.click(screen.getByRole('button', { name: /Đăng nhập hệ thống/i }));

    const link = await screen.findByRole('link', {
      name: /Chuyển tới Cổng Bác Sĩ Gia Đình/i,
    });
    expect(link).toHaveAttribute('href', 'https://bacsi.famidoc.online/login');
    expect(saveSpy).not.toHaveBeenCalled();

    saveSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('RoleLoginForm(ADMIN) từ chối lưu phiên khi FAMILY đăng nhập nhầm vào cổng Admin', async () => {
    setBrowserLocation('admin.famidoc.online', '/login');
    const saveSpy = vi.spyOn(authStorage, 'saveAuthSession');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        code: 200,
        data: {
          accessToken: 'family-jwt-token',
          role: 'FAMILY_REP',
          user: {
            id: 'fam-1',
            email: 'family@famidoc.vn',
            fullName: 'Chủ Hộ',
            role: 'FAMILY_REP',
            status: 'ACTIVE',
          },
        },
      }),
    } as Response);

    render(<RoleLoginForm targetRole="ADMIN" />);
    await userEvent.type(screen.getByLabelText(/Email Quản trị viên/i), 'family@famidoc.vn');
    await userEvent.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password@123');
    await userEvent.click(screen.getByRole('button', { name: /Đăng nhập cổng làm việc/i }));

    expect(
      await screen.findByText(/không thể đăng nhập tại Cổng Quản Trị Viên/i),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', {
      name: /Chuyển tới Cổng Khách Hàng Gia Đình/i,
    });
    expect(link).toHaveAttribute('href', 'https://famidoc.online/login');
    expect(saveSpy).not.toHaveBeenCalled();

    saveSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('RoleLoginForm(ADMIN) cho phép ADMIN đăng nhập và điều hướng tới /admin', async () => {
    setBrowserLocation('admin.famidoc.online', '/login');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        code: 200,
        data: {
          accessToken: 'admin-jwt-token',
          role: 'ADMIN',
          user: {
            id: 'adm-1',
            email: 'admin@famidoc.vn',
            fullName: 'Super Admin',
            role: 'ADMIN',
            status: 'ACTIVE',
          },
        },
      }),
    } as Response);

    render(<RoleLoginForm targetRole="ADMIN" />);
    await userEvent.type(screen.getByLabelText(/Email Quản trị viên/i), 'admin@famidoc.vn');
    await userEvent.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password@123');
    await userEvent.click(screen.getByRole('button', { name: /Đăng nhập cổng làm việc/i }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/admin');
    });

    fetchSpy.mockRestore();
  });

  it('AuthProvider.logout gọi API thu hồi token và quay về /login trên admin.famidoc.online hoặc /admin/login trên localhost', async () => {
    authStorage.saveAuthSession(
      'ADMIN',
      {
        id: 'adm-1',
        name: 'Super Admin',
        phone: '0901888999',
        email: 'admin@famidoc.vn',
        role: 'ADMIN',
        avatarText: 'SA',
      },
      'real-admin-jwt',
      true,
    );
    setBrowserLocation('admin.famidoc.online', '/settings');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    function LogoutProbe() {
      const { logout } = useAuth();
      return (
        <button type="button" onClick={logout}>
          Đăng xuất ngay
        </button>
      );
    }

    const { unmount } = render(
      <AuthProvider>
        <LogoutProbe />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Đăng xuất ngay' }));
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/logout'),
      expect.objectContaining({ method: 'POST', keepalive: true }),
    );
    expect(replaceMock).toHaveBeenCalledWith('/login');
    unmount();

    // Kiểm tra lại trường hợp localhost không subdomain -> /admin/login
    replaceMock.mockReset();
    authStorage.saveAuthSession(
      'ADMIN',
      {
        id: 'adm-1',
        name: 'Super Admin',
        phone: '0901888999',
        email: 'admin@famidoc.vn',
        role: 'ADMIN',
        avatarText: 'SA',
      },
      'real-admin-jwt',
      true,
    );
    setBrowserLocation('localhost:3000', '/settings');

    render(
      <AuthProvider>
        <LogoutProbe />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Đăng xuất ngay' }));
    expect(replaceMock).toHaveBeenCalledWith('/admin/login');

    fetchSpy.mockRestore();
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth-context';
import { InitialAuthSessionProvider } from '../initial-auth-session-context';
import { authApi } from '@/lib/api/auth.api';
import { httpClient } from '@/lib/api/http-client';
import * as authStorage from '@/lib/auth-storage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('Task 2: AuthContext integration with authApi.login and session sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.clearAuthSession();
    httpClient.clearToken();
  });

  it('calls authApi.login with email and password, maps FAMILY_REP to FAMILY, and stores session', async () => {
    const authApiSpy = vi.spyOn(authApi, 'login').mockResolvedValueOnce({
      accessToken: 'real-jwt-token-123',
      role: 'FAMILY_REP',
      user: {
        id: 'usr-123',
        email: 'rep@famidoc.vn',
        phone: '0987654321',
        fullName: 'Nguyễn Văn Đại Diện',
        role: 'FAMILY_REP',
        status: 'ACTIVE',
        avatarUrl: null,
      },
    });

    const setTokenSpy = vi.spyOn(httpClient, 'setToken');
    const saveSessionSpy = vi.spyOn(authStorage, 'saveAuthSession');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('rep@famidoc.vn', 'Password@123');
    });

    expect(authApiSpy).toHaveBeenCalledWith({
      email: 'rep@famidoc.vn',
      password: 'Password@123',
      rememberMe: true,
    });
    expect(setTokenSpy).toHaveBeenCalledWith('real-jwt-token-123', true);
    expect(saveSessionSpy).toHaveBeenCalledWith(
      'FAMILY',
      expect.objectContaining({
        id: 'usr-123',
        email: 'rep@famidoc.vn',
        name: 'Nguyễn Văn Đại Diện',
        role: 'FAMILY',
      }),
      'real-jwt-token-123',
      true
    );
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.role).toBe('FAMILY');
    expect(result.current.user?.name).toBe('Nguyễn Văn Đại Diện');

    authApiSpy.mockRestore();
  });

  it('exposes applySession to update in-memory auth state and persist session', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.applySession(
        'FAMILY',
        {
          id: 'usr-sync',
          name: 'Trần Minh',
          phone: '0901234567',
          role: 'FAMILY',
          avatarText: 'TM',
        },
        'jwt-sync-1',
        true
      );
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user?.name).toBe('Trần Minh');
  });

  it('uses InitialAuthSessionProvider when AuthProvider is still loading', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <InitialAuthSessionProvider
        initialSession={{
          role: 'FAMILY',
          token: 'jwt-ssr',
          user: {
            id: 'usr-ssr',
            name: 'Lê Thị Hoa',
            phone: '0909999888',
            role: 'FAMILY',
            avatarText: 'LH',
          },
        }}
      >
        {children}
      </InitialAuthSessionProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user?.name).toBe('Lê Thị Hoa');
  });

  describe('Portal Audience Guard khi mount AuthProvider', () => {
    function setLocation(host: string, pathname = '/') {
      const protocol = host.includes('localhost') || host.startsWith('127.') ? 'http:' : 'https:';
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
          replace: vi.fn(),
          assign: vi.fn(),
        },
      });
    }

    it.each(['ADMIN', 'FACILITY', 'DOCTOR'] as const)(
      'từ chối hydrate phiên %s trên host khách hàng (localhost:3000 / famidoc.online) và xóa token/cookie sai cổng',
      (staffRole) => {
        setLocation('localhost:3000', '/packages');
        authStorage.saveAuthSession(
          staffRole,
          {
            id: `usr-${staffRole.toLowerCase()}`,
            name: `Staff ${staffRole}`,
            phone: '0901112223',
            role: staffRole,
            avatarText: 'ST',
          },
          `jwt-${staffRole}`,
          true,
        );
        httpClient.setToken(`jwt-${staffRole}`, true);

        const clearSessionSpy = vi.spyOn(authStorage, 'clearAuthSession');
        const clearTokenSpy = vi.spyOn(httpClient, 'clearToken');

        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <AuthProvider>{children}</AuthProvider>
        );
        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(clearTokenSpy).toHaveBeenCalled();
        expect(clearSessionSpy).toHaveBeenCalled();
        expect(authStorage.getStoredAuthSession().role).toBeNull();
        expect(httpClient.getToken()).toBeNull();
        clearSessionSpy.mockRestore();
        clearTokenSpy.mockRestore();
      },
    );

    it('hydrate bình thường khi DOCTOR ở đúng subdomain bacsi.localhost:3000', () => {
      setLocation('bacsi.localhost:3000', '/doctor/contracts');
      authStorage.saveAuthSession(
        'DOCTOR',
        {
          id: 'doc-1',
          name: 'BS Nguyễn Văn A',
          phone: '0901112223',
          role: 'DOCTOR',
          avatarText: 'BS',
        },
        'jwt-doctor-ok',
        true,
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.role).toBe('DOCTOR');
      expect(result.current.user?.name).toBe('BS Nguyễn Văn A');
    });

    it('trên IP thuần (127.0.0.1:3000): không hydrate ADMIN ở trang khách hàng nhưng không xóa cookie chung của cổng /admin', () => {
      setLocation('127.0.0.1:3000', '/');
      authStorage.saveAuthSession(
        'ADMIN',
        {
          id: 'adm-1',
          name: 'Admin IP',
          phone: '0901112223',
          role: 'ADMIN',
          avatarText: 'AD',
        },
        'jwt-admin-ip',
        true,
      );

      const clearSessionSpy = vi.spyOn(authStorage, 'clearAuthSession');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(clearSessionSpy).not.toHaveBeenCalled();
      expect(authStorage.getCookie(authStorage.COOKIE_KEYS.ROLE)).toBe('ADMIN');
      clearSessionSpy.mockRestore();
    });
  });
});

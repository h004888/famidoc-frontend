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
});

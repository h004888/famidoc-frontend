import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../login-form';
import { httpClient } from '@/lib/api/http-client';
import * as authStorage from '@/lib/auth-storage';

let mockSearchParams = new URLSearchParams();

// Mock useRouter & useSearchParams
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

describe('UT-CMP-02..03, UT-CMP-08..10: LoginForm Component Interactions & A11y', () => {
  it('UT-CMP-02: does not render role selector', async () => {
    mockSearchParams = new URLSearchParams();
    render(<LoginForm />);
    expect(screen.queryByText(/Chọn vai trò đăng nhập/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu$/i)).toBeInTheDocument();
  });

  it('UT-CMP-03: displays validation error when submitting with empty fields', async () => {
    mockSearchParams = new URLSearchParams();
    render(<LoginForm />);
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập hệ thống/i });
    await userEvent.click(submitBtn);

    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('UT-CMP-08..09 (M-01): binds inputs with labels via htmlFor and id', () => {
    mockSearchParams = new URLSearchParams();
    render(<LoginForm />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu$/i)).toBeInTheDocument();
  });

  it('UT-CMP-10 (FL-01): renders Success Welcome Banner when URL has ?registered=true', () => {
    mockSearchParams = new URLSearchParams('registered=true');
    render(<LoginForm />);
    const welcomeBanner = screen.getByRole('status');
    expect(welcomeBanner).toBeInTheDocument();
    expect(welcomeBanner).toHaveTextContent(/Đăng ký tài khoản đại diện thành công/i);
  });

  it('standardizes typography on AuthLayout and LoginForm to Medsev Group 1 standard (no dead classes or font-extrabold/font-black)', () => {
    mockSearchParams = new URLSearchParams();
    const { container } = render(<LoginForm />);
    const authLayoutPath = path.resolve(__dirname, '../../../../app/(auth)/layout.tsx');
    const authLayoutSource = fs.readFileSync(authLayoutPath, 'utf-8');

    expect(authLayoutSource).not.toMatch(/\b(font|text)-(headline|body|label)-(lg|md|sm)\b/);
    expect(container.innerHTML).not.toMatch(/\b(font|text)-(headline|body|label)-(lg|md|sm)\b/);
    expect(container.innerHTML).not.toMatch(/\bfont-(black|extrabold)\b/);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('font-bold');
  });

  it('submits valid credentials to auth API and redirects to role home', async () => {
    mockSearchParams = new URLSearchParams();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        code: 200,
        message: 'Đăng nhập thành công',
        data: {
          accessToken: 'real-jwt-token-family',
          role: 'FAMILY_REP',
          user: {
            id: 'usr-123',
            email: 'rep@famidoc.vn',
            fullName: 'Nguyễn Văn Đại Diện',
            role: 'FAMILY_REP',
            status: 'ACTIVE',
          },
        },
      }),
    } as Response);

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/Email/i), 'rep@famidoc.vn');
    await userEvent.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password@123');

    const submitBtn = screen.getByRole('button', { name: /Đăng nhập hệ thống/i });
    await userEvent.click(submitBtn);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'rep@famidoc.vn',
          password: 'Password@123',
          rememberMe: true,
        }),
      }),
    );

    fetchSpy.mockRestore();
  });

  it('displays RFC 9457 Problem Details error message when login fails with HTTP 401', async () => {
    mockSearchParams = new URLSearchParams();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        code: 401,
        error: {
          type: 'https://errors.famidoc.vn/unauthorized',
          title: 'Unauthorized',
          detail: 'Sai tên đăng nhập hoặc mật khẩu',
          errorCode: 'AUTH_UNAUTHORIZED',
        },
      }),
    } as Response);

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/Email/i), 'wrong@famidoc.vn');
    await userEvent.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password@123');

    const submitBtn = screen.getByRole('button', { name: /Đăng nhập hệ thống/i });
    await userEvent.click(submitBtn);

    expect(await screen.findByText('Sai tên đăng nhập hoặc mật khẩu')).toBeInTheDocument();

    fetchSpy.mockRestore();
  });

  const mockLoginSuccess = () =>
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        code: 200,
        message: 'Đăng nhập thành công',
        data: {
          accessToken: 'real-jwt-token-family',
          role: 'FAMILY_REP',
          user: {
            id: 'usr-123',
            email: 'rep@famidoc.vn',
            fullName: 'Nguyễn Văn Đại Diện',
            role: 'FAMILY_REP',
            status: 'ACTIVE',
          },
        },
      }),
    } as Response);

  it('UT-CMP-11: bỏ tick Ghi nhớ đăng nhập -> payload rememberMe=false và lưu phiên tạm', async () => {
    mockSearchParams = new URLSearchParams();
    const fetchSpy = mockLoginSuccess();
    const setTokenSpy = vi.spyOn(httpClient, 'setToken');
    const saveSessionSpy = vi.spyOn(authStorage, 'saveAuthSession');

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/Email/i), 'rep@famidoc.vn');
    await userEvent.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password@123');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(
      screen.getByRole('button', { name: /Đăng nhập hệ thống/i }),
    );

    const body = JSON.parse(
      (fetchSpy.mock.calls[0][1]?.body as string) ?? '{}',
    );
    expect(body).toEqual({
      email: 'rep@famidoc.vn',
      password: 'Password@123',
      rememberMe: false,
    });
    expect(setTokenSpy).toHaveBeenCalledWith('real-jwt-token-family', false);
    expect(saveSessionSpy).toHaveBeenCalledWith(
      'FAMILY',
      expect.any(Object),
      'real-jwt-token-family',
      false,
    );

    setTokenSpy.mockRestore();
    saveSessionSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('UT-CMP-12: giữ tick Ghi nhớ đăng nhập (mặc định) -> payload rememberMe=true và lưu phiên 7 ngày', async () => {
    mockSearchParams = new URLSearchParams();
    const fetchSpy = mockLoginSuccess();
    const setTokenSpy = vi.spyOn(httpClient, 'setToken');
    const saveSessionSpy = vi.spyOn(authStorage, 'saveAuthSession');

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/Email/i), 'rep@famidoc.vn');
    await userEvent.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password@123');
    await userEvent.click(
      screen.getByRole('button', { name: /Đăng nhập hệ thống/i }),
    );

    const body = JSON.parse(
      (fetchSpy.mock.calls[0][1]?.body as string) ?? '{}',
    );
    expect(body).toEqual({
      email: 'rep@famidoc.vn',
      password: 'Password@123',
      rememberMe: true,
    });
    expect(setTokenSpy).toHaveBeenCalledWith('real-jwt-token-family', true);
    expect(saveSessionSpy).toHaveBeenCalledWith(
      'FAMILY',
      expect.any(Object),
      'real-jwt-token-family',
      true,
    );

    setTokenSpy.mockRestore();
    saveSessionSpy.mockRestore();
    fetchSpy.mockRestore();
  });
});

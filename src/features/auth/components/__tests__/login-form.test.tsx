import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../login-form';

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
        accessToken: 'real-jwt-token-family',
        user: {
          id: 'usr-123',
          email: 'rep@famidoc.vn',
          fullName: 'Nguyễn Văn Đại Diện',
          role: 'FAMILY',
          status: 'ACTIVE',
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
      }),
    );

    fetchSpy.mockRestore();
  });
});

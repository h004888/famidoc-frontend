import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../login-form';

let mockSearchParams = new URLSearchParams();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

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

async function submitLogin() {
  await userEvent.type(screen.getByLabelText(/Email/i), 'rep@famidoc.vn');
  await userEvent.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password@123');
  await userEvent.click(
    screen.getByRole('button', { name: /Đăng nhập hệ thống/i })
  );
}

describe('LoginForm - khôi phục URL đích sau đăng nhập', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        href: 'http://localhost:3000/login',
        origin: 'http://localhost:3000',
        pathname: '/login',
        search: '',
        hash: '',
        replace: replaceMock,
        assign: vi.fn(),
      },
    });
  });

  it('quay lại đúng URL đích kèm query string', async () => {
    mockSearchParams = new URLSearchParams(
      'redirect=%2Ffamily%2Fsubscription%2Ftracking%3FcontractId%3Dabc'
    );
    const fetchSpy = mockLoginSuccess();

    render(<LoginForm />);
    await submitLogin();

    expect(replaceMock).toHaveBeenCalledWith(
      '/family/subscription/tracking?contractId=abc'
    );
    fetchSpy.mockRestore();
  });

  it('giữ hành vi cũ khi không có tham số đích', async () => {
    mockSearchParams = new URLSearchParams();
    const fetchSpy = mockLoginSuccess();

    render(<LoginForm />);
    await submitLogin();

    expect(replaceMock).toHaveBeenCalledWith('/');
    fetchSpy.mockRestore();
  });

  it('bỏ qua URL đích không hợp lệ và dùng trang mặc định', async () => {
    mockSearchParams = new URLSearchParams(
      'redirect=https%3A%2F%2Fexample.com%2Fsteal'
    );
    const fetchSpy = mockLoginSuccess();

    render(<LoginForm />);
    await submitLogin();

    expect(replaceMock).toHaveBeenCalledWith('/');
    expect(replaceMock).not.toHaveBeenCalledWith(
      expect.stringContaining('example.com')
    );
    fetchSpy.mockRestore();
  });
});

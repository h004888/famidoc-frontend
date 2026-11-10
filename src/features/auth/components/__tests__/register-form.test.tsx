'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../register-form';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('UT-CMP-11..13: RegisterForm Accessibility & Real-time Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('UT-CMP-11 (M-02): links all form labels with inputs via htmlFor and id', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/Họ và tên người đại diện/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số điện thoại liên hệ/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Xác nhận mật khẩu/i)).toBeInTheDocument();
  });

  it('UT-CMP-12 (M-03): triggers real-time onBlur validation when leaving invalid field', async () => {
    render(<RegisterForm />);
    const phoneInput = screen.getByLabelText(/Số điện thoại liên hệ/i);
    await userEvent.type(phoneInput, '12345');
    await userEvent.tab();

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent(/Số điện thoại không đúng định dạng/i);
  });

  it('UT-CMP-13 (m-01): configures type="tel" on phone field', () => {
    render(<RegisterForm />);
    const phoneInput = screen.getByLabelText(/Số điện thoại liên hệ/i);
    expect(phoneInput).toHaveAttribute('type', 'tel');
  });

  it('standardizes typography on RegisterForm to Medsev Group 1 standard (tabular-nums without font-mono, font-bold without font-black/font-extrabold)', () => {
    const { container } = render(<RegisterForm />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('font-bold');

    const phoneInput = screen.getByLabelText(/Số điện thoại liên hệ/i);
    expect(phoneInput).toHaveClass('tabular-nums');
    expect(phoneInput).not.toHaveClass('font-mono');
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });

  it('submits valid registration to API and redirects to /verify-otp with encoded email', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: 'Gửi OTP thành công đến email đăng ký' }),
    } as Response);

    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText(/Họ và tên người đại diện/i), 'Nguyễn Văn Đại Diện');
    await userEvent.type(screen.getByLabelText(/Số điện thoại liên hệ/i), '0912345678');
    await userEvent.type(screen.getByLabelText(/Email/i), 'rep@famidoc.vn');
    await userEvent.type(screen.getByLabelText(/^Mật khẩu/i), 'Password@123');
    await userEvent.type(screen.getByLabelText(/Xác nhận mật khẩu/i), 'Password@123');

    const submitBtn = screen.getByRole('button', { name: /Đăng ký tài khoản/i });
    await userEvent.click(submitBtn);

    expect(pushMock).toHaveBeenCalledWith('/verify-otp?email=rep%40famidoc.vn');
    fetchSpy.mockRestore();
  });
});

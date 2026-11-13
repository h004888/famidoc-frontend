'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../register-form';

const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  useSearchParams: () => ({ get: () => null }),
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
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        code: 201,
        data: { email: 'rep@famidoc.vn', expiresInSeconds: 300, devOtp: '654321' },
      }),
    } as Response);

    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText(/Họ và tên người đại diện/i), 'Nguyễn Văn Đại Diện');
    await userEvent.type(screen.getByLabelText(/Số điện thoại liên hệ/i), '0912345678');
    await userEvent.type(screen.getByLabelText(/Email/i), 'rep@famidoc.vn');
    await userEvent.type(screen.getByLabelText(/^Mật khẩu/i), 'Password@123');
    await userEvent.type(screen.getByLabelText(/Xác nhận mật khẩu/i), 'Password@123');

    const submitBtn = screen.getByRole('button', { name: /Đăng ký tài khoản/i });
    await act(async () => {
      submitBtn.click();
    });

    expect(pushMock).toHaveBeenCalledWith('/verify-otp?email=rep%40famidoc.vn');
  });

  // ===========================================================================
  // RegisterForm integration with authApi (Task 3)
  // ===========================================================================
  describe('RegisterForm integration with authApi (Task 3)', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.clearAllMocks();
      Object.defineProperty(global, 'sessionStorage', {
        value: {
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('saves OTP metadata to sessionStorage on successful registration (HTTP 201 envelope)', async () => {
      const mockData = {
        email: 'rep@famidoc.vn',
        expiresInSeconds: 300,
        devOtp: '654321',
      };
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, code: 201, data: mockData }),
      } as Response);

      render(<RegisterForm />);

      await userEvent.type(screen.getByLabelText(/Họ và tên người đại diện/i), 'Nguyễn Văn An');
      await userEvent.type(screen.getByLabelText(/Số điện thoại liên hệ/i), '0912345678');
      await userEvent.type(screen.getByLabelText(/Email/i), 'rep@famidoc.vn');
      await userEvent.type(screen.getByLabelText(/^Mật khẩu/i), 'Password@123');
      await userEvent.type(screen.getByLabelText(/Xác nhận mật khẩu/i), 'Password@123');

      const submitBtn = screen.getByRole('button', { name: /Đăng ký tài khoản/i });
      await act(async () => {
        submitBtn.click();
      });

      // Kiểm tra sessionStorage đã lưu metadata
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith(
        'famidoc_pending_otp_meta',
        JSON.stringify({ email: 'rep@famidoc.vn', expiresInSeconds: 300, devOtp: '654321' })
      );

      // Kiểm tra điều hướng đúng
      expect(pushMock).toHaveBeenCalledWith('/verify-otp?email=rep%40famidoc.vn');
    });

    it('displays 409 AUTH_EMAIL_ALREADY_EXISTS error and does NOT redirect', async () => {
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          code: 409,
          error: { errorCode: 'AUTH_EMAIL_ALREADY_EXISTS', detail: 'This email is already registered' },
        }),
      } as Response);

      render(<RegisterForm />);

      await userEvent.type(screen.getByLabelText(/Họ và tên người đại diện/i), 'Nguyễn Văn A');
      await userEvent.type(screen.getByLabelText(/Số điện thoại liên hệ/i), '0912345678');
      await userEvent.type(screen.getByLabelText(/Email/i), 'existing@email.com');
      await userEvent.type(screen.getByLabelText(/^Mật khẩu/i), 'Password@123');
      await userEvent.type(screen.getByLabelText(/Xác nhận mật khẩu/i), 'Password@123');

      const submitBtn = screen.getByRole('button', { name: /Đăng ký tài khoản/i });
      await act(async () => {
        submitBtn.click();
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Email này đã được đăng ký/i);
      });

      // Không chuyển trang khi có lỗi 409
      expect(pushMock).not.toHaveBeenCalled();
    });

    it('does NOT redirect when API returns network error', async () => {
      // Test rằng RegisterForm không tự ý chuyển trang khi gặp lỗi mạng
      // bằng cách kiểm tra handleSubmit catch block không gọi router.push
      vi.clearAllMocks();
      Reflect.deleteProperty(globalThis, 'sessionStorage');

      fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Network Error'));

      render(<RegisterForm />);

      await userEvent.type(screen.getByLabelText(/Họ và tên người đại diện/i), 'Nguyễn Văn A');
      await userEvent.type(screen.getByLabelText(/Số điện thoại liên hệ/i), '0912345678');
      await userEvent.type(screen.getByLabelText(/Email/i), 'rep@famidoc.vn');
      await userEvent.type(screen.getByLabelText(/^Mật khẩu/i), 'Password@123');
      await userEvent.type(screen.getByLabelText(/Xác nhận mật khẩu/i), 'Password@123');

      const submitBtn = screen.getByRole('button', { name: /Đăng ký tài khoản/i });

      // Submit và đợi async effects hoàn tất qua Next.js router events
      await act(async () => {
        submitBtn.click();
      });
      // Flush React batched state updates
      await act(async () => {});
      await act(async () => {});

      // Quan trọng nhất: KHÔNG redirect khi lỗi
      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});

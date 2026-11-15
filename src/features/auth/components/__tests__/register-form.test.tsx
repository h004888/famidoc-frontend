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
    expect(screen.getByLabelText(/H? và tên ngu?i d?i di?n/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/S? di?n tho?i liên h?/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^M?t kh?u/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Xác nh?n m?t kh?u/i)).toBeInTheDocument();
  });

  it('UT-CMP-12 (M-03): triggers real-time onBlur validation when leaving invalid field', async () => {
    render(<RegisterForm />);
    const phoneInput = screen.getByLabelText(/S? di?n tho?i liên h?/i);
    await userEvent.type(phoneInput, '12345');
    await userEvent.tab();

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent(/S? di?n tho?i không dúng d?nh d?ng/i);
  });

  it('UT-CMP-13 (m-01): configures type="tel" on phone field', () => {
    render(<RegisterForm />);
    const phoneInput = screen.getByLabelText(/S? di?n tho?i liên h?/i);
    expect(phoneInput).toHaveAttribute('type', 'tel');
  });

  it('standardizes typography on RegisterForm to Medsev Group 1 standard (tabular-nums without tracking-wide, font-bold without font-black/font-extrabold)', () => {
    const { container } = render(<RegisterForm />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('font-bold');

    const phoneInput = screen.getByLabelText(/S? di?n tho?i liên h?/i);
    expect(phoneInput).toHaveClass('tabular-nums');
    expect(phoneInput).not.toHaveClass('tracking-wide');
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

    await userEvent.type(screen.getByLabelText(/H? và tên ngu?i d?i di?n/i), 'Nguy?n Van Ð?i Di?n');
    await userEvent.type(screen.getByLabelText(/S? di?n tho?i liên h?/i), '0912345678');
    await userEvent.type(screen.getByLabelText(/Email/i), 'rep@famidoc.vn');
    await userEvent.type(screen.getByLabelText(/^M?t kh?u/i), 'Password@123');
    await userEvent.type(screen.getByLabelText(/Xác nh?n m?t kh?u/i), 'Password@123');

    const submitBtn = screen.getByRole('button', { name: /Ðang ký tài kho?n/i });
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

      await userEvent.type(screen.getByLabelText(/H? và tên ngu?i d?i di?n/i), 'Nguy?n Van An');
      await userEvent.type(screen.getByLabelText(/S? di?n tho?i liên h?/i), '0912345678');
      await userEvent.type(screen.getByLabelText(/Email/i), 'rep@famidoc.vn');
      await userEvent.type(screen.getByLabelText(/^M?t kh?u/i), 'Password@123');
      await userEvent.type(screen.getByLabelText(/Xác nh?n m?t kh?u/i), 'Password@123');

      const submitBtn = screen.getByRole('button', { name: /Ðang ký tài kho?n/i });
      await act(async () => {
        submitBtn.click();
      });

      // Ki?m tra sessionStorage dã luu metadata
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith(
        'famidoc_pending_otp_meta',
        JSON.stringify({ email: 'rep@famidoc.vn', expiresInSeconds: 300, devOtp: '654321' })
      );

      // Ki?m tra di?u hu?ng dúng
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

      await userEvent.type(screen.getByLabelText(/H? và tên ngu?i d?i di?n/i), 'Nguy?n Van A');
      await userEvent.type(screen.getByLabelText(/S? di?n tho?i liên h?/i), '0912345678');
      await userEvent.type(screen.getByLabelText(/Email/i), 'existing@email.com');
      await userEvent.type(screen.getByLabelText(/^M?t kh?u/i), 'Password@123');
      await userEvent.type(screen.getByLabelText(/Xác nh?n m?t kh?u/i), 'Password@123');

      const submitBtn = screen.getByRole('button', { name: /Ðang ký tài kho?n/i });
      await act(async () => {
        submitBtn.click();
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Email này dã du?c dang ký/i);
      });

      // Không chuy?n trang khi có l?i 409
      expect(pushMock).not.toHaveBeenCalled();
    });

    it('does NOT redirect when API returns network error', async () => {
      // Test r?ng RegisterForm không t? ý chuy?n trang khi g?p l?i m?ng
      // b?ng cách ki?m tra handleSubmit catch block không g?i router.push
      vi.clearAllMocks();
      Reflect.deleteProperty(globalThis, 'sessionStorage');

      fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Network Error'));

      render(<RegisterForm />);

      await userEvent.type(screen.getByLabelText(/H? và tên ngu?i d?i di?n/i), 'Nguy?n Van A');
      await userEvent.type(screen.getByLabelText(/S? di?n tho?i liên h?/i), '0912345678');
      await userEvent.type(screen.getByLabelText(/Email/i), 'rep@famidoc.vn');
      await userEvent.type(screen.getByLabelText(/^M?t kh?u/i), 'Password@123');
      await userEvent.type(screen.getByLabelText(/Xác nh?n m?t kh?u/i), 'Password@123');

      const submitBtn = screen.getByRole('button', { name: /Ðang ký tài kho?n/i });

      // Submit và d?i async effects hoàn t?t qua Next.js router events
      await act(async () => {
        submitBtn.click();
      });
      // Flush React batched state updates
      await act(async () => {});
      await act(async () => {});

      // Quan tr?ng nh?t: KHÔNG redirect khi l?i
      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});

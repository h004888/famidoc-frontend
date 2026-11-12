'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VerifyEmailOtpView } from '../verify-email-otp-view';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

describe('Màn 6: VerifyEmailOtpView (Xác thực mã OTP qua Email)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders 6 separate OTP input slots and auto-tabs when user types', () => {
    render(<VerifyEmailOtpView email="nguyen.van.an@gmail.com" />);

    expect(screen.getByText(/Xác thực mã OTP qua Email/i)).toBeInTheDocument();
    expect(screen.getByText(/nguyen.van.an@gmail.com/i)).toBeInTheDocument();

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);

    // Initial focus on first input
    expect(document.activeElement).toBe(inputs[0]);

    // Type digit into slot 1 -> advances focus to slot 2
    act(() => {
      fireEvent.change(inputs[0], { target: { value: '8' } });
    });
    expect(inputs[0]).toHaveValue('8');
    expect(document.activeElement).toBe(inputs[1]);

    // Type into slot 2 -> advances focus to slot 3
    act(() => {
      fireEvent.change(inputs[1], { target: { value: '3' } });
    });
    expect(inputs[1]).toHaveValue('3');
    expect(document.activeElement).toBe(inputs[2]);
  });

  it('handles paste event for 6-digit OTP code', () => {
    render(<VerifyEmailOtpView email="nguyen.van.an@gmail.com" />);

    const inputs = screen.getAllByRole('textbox');

    // Simulate paste 6 digits into the first input
    act(() => {
      fireEvent.paste(inputs[0], {
        clipboardData: {
          getData: () => '987654',
        },
      });
    });

    expect(inputs[0]).toHaveValue('9');
    expect(inputs[1]).toHaveValue('8');
    expect(inputs[2]).toHaveValue('7');
    expect(inputs[3]).toHaveValue('6');
    expect(inputs[4]).toHaveValue('5');
    expect(inputs[5]).toHaveValue('4');
  });

  it('cooldown timer counts down from 60s and enables resend button after expiration', () => {
    render(<VerifyEmailOtpView email="nguyen.van.an@gmail.com" cooldownSeconds={60} />);

    const resendBtn = screen.getByRole('button', { name: /Gửi lại/i });
    expect(resendBtn).toBeDisabled();
    expect(screen.getByText(/Gửi lại sau 60s/i)).toBeInTheDocument();

    // Fast-forward 30s
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(screen.getByText(/Gửi lại sau 30s/i)).toBeInTheDocument();
    expect(resendBtn).toBeDisabled();

    // Fast-forward another 30s (total 60s)
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(resendBtn).not.toBeDisabled();
    expect(resendBtn).toHaveTextContent(/Gửi lại mã OTP/i);

    // Clicking resend restarts cooldown
    act(() => {
      fireEvent.click(resendBtn);
    });
    expect(resendBtn).toBeDisabled();
    expect(screen.getByText(/Gửi lại sau 60s/i)).toBeInTheDocument();
  });

  it('displays error message when OTP is incorrect or incomplete', () => {
    render(
      <VerifyEmailOtpView
        email="nguyen.van.an@gmail.com"
        expectedOtp="123456"
      />
    );

    const inputs = screen.getAllByRole('textbox');
    const submitBtn = screen.getByRole('button', { name: /Xác nhận|Xác thực/i });

    // Submit with empty
    act(() => {
      fireEvent.click(submitBtn);
    });
    expect(
      screen.getByText(/Vui lòng nhập đủ 6 chữ số mã xác thực OTP/i)
    ).toBeInTheDocument();

    // Type wrong OTP "000000"
    act(() => {
      inputs.forEach((input) => {
        fireEvent.change(input, { target: { value: '0' } });
      });
    });

    act(() => {
      fireEvent.click(submitBtn);
    });
    expect(
      screen.getByText(/Mã xác thực OTP không chính xác hoặc đã hết hạn/i)
    ).toBeInTheDocument();
  });

  it('successfully verifies correct OTP and triggers callback/redirect', () => {
    const handleSuccess = vi.fn();
    render(
      <VerifyEmailOtpView
        email="nguyen.van.an@gmail.com"
        expectedOtp="123456"
        onSuccess={handleSuccess}
        redirectUrl="/family/subscription/tracking"
      />
    );

    const inputs = screen.getAllByRole('textbox');
    act(() => {
      ['1', '2', '3', '4', '5', '6'].forEach((digit, idx) => {
        fireEvent.change(inputs[idx], { target: { value: digit } });
      });
    });

    const submitBtn = screen.getByRole('button', { name: /Xác nhận|Xác thực/i });
    act(() => {
      fireEvent.click(submitBtn);
    });

    expect(handleSuccess).toHaveBeenCalledWith('123456');
    expect(mockPush).toHaveBeenCalledWith('/family/subscription/tracking');
  });

  it('calls POST /api/v1/auth/verify-email-otp when expectedOtp is not provided', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 'usr-1', email: 'an.nguyen@famidoc.vn' }),
    } as Response);

    render(<VerifyEmailOtpView email="an.nguyen@famidoc.vn" />);

    const inputs = screen.getAllByRole('textbox');
    ['6', '5', '4', '3', '2', '1'].forEach((digit, idx) => {
      act(() => {
        fireEvent.change(inputs[idx], { target: { value: digit } });
      });
    });

    const submitBtn = screen.getByRole('button', { name: /Xác nhận|Xác thực/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/verify-email-otp'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'an.nguyen@famidoc.vn',
          otp: '654321',
        }),
      }),
    );

    fetchSpy.mockRestore();
  });

  it('adheres to typography standards without font-mono, font-black, or font-extrabold', () => {
    const { container } = render(<VerifyEmailOtpView />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    expect(container.innerHTML).toContain('tabular-nums');
  });

  // ===========================================================================
  // VerifyEmailOtpView integration with authApi & sessionStorage (Task 4)
  // ===========================================================================
  describe('VerifyEmailOtpView integration with authApi & sessionStorage (Task 4)', () => {
    it('reads devOtp from sessionStorage and displays development hint badge', async () => {
      const removeSpy = vi.fn();
      const setItemSpy = vi.fn();
      // Override sessionStorage của outer beforeEach để inject data
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: (key: string) => {
            if (key === 'famidoc_pending_otp_meta') {
              return JSON.stringify({
                email: 'an.nguyen@famidoc.vn',
                expiresInSeconds: 300,
                devOtp: '888999',
              });
            }
            return null;
          },
          setItem: setItemSpy,
          removeItem: removeSpy,
        } as unknown as Storage,
        writable: true,
      });

      render(<VerifyEmailOtpView email="an.nguyen@famidoc.vn" />);

      // đợi useEffect đọc sessionStorage
      await act(async () => {});

      // Hiển thị gợi ý devOtp
      expect(screen.getByText(/Mã OTP môi trường dev/)).toBeInTheDocument();
      expect(screen.getByText('888999')).toBeInTheDocument();
    });

    it('deletes sessionStorage metadata after successful OTP verification', async () => {
      const removeSpy = vi.fn();
      // Override sessionStorage của outer beforeEach
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: (key: string) => {
            if (key === 'famidoc_pending_otp_meta') {
              return JSON.stringify({
                email: 'an.nguyen@famidoc.vn',
                expiresInSeconds: 300,
                devOtp: '888999',
              });
            }
            return null;
          },
          setItem: vi.fn(),
          removeItem: removeSpy,
        } as unknown as Storage,
        writable: true,
      });

      // Mock success response với Unified Envelope unwrap
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          code: 200,
          message: 'Xác thực thành công',
          data: { accessToken: 'mock-token', role: 'FAMILY', user: { id: 'u1', email: 'a', fullName: '', role: '' } },
        }),
      } as Response);

      render(<VerifyEmailOtpView email="an.nguyen@famidoc.vn" />);

      const inputs = screen.getAllByRole('textbox');

      act(() => {
        ['1', '2', '3', '4', '5', '6'].forEach((digit, idx) => {
          fireEvent.change(inputs[idx], { target: { value: digit } });
        });
      });

      const submitBtn = screen.getByRole('button', { name: /Xác nhận|Xác thực/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(mockPush).toHaveBeenCalledWith('/login?registered=true');
      // Kiểm tra đã gọi removeItem đúng key
      expect(removeSpy).toHaveBeenCalledWith('famidoc_pending_otp_meta');

      fetchSpy.mockRestore();
    });

    it('displays RFC 9457 error on HTTP 401 verify failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          code: 401,
          error: { detail: 'Invalid or expired OTP' },
        }),
      } as Response);

      render(<VerifyEmailOtpView email="an.nguyen@famidoc.vn" />);

      const inputs = screen.getAllByRole('textbox');

      act(() => {
        inputs.forEach((input) => {
          fireEvent.change(input, { target: { value: '0' } });
        });
      });

      const submitBtn = screen.getByRole('button', { name: /Xác nhận|Xác thực/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(screen.getByRole('alert')).toHaveTextContent(/Mã xác thực OTP không chính xác hoặc đã hết hạn/i);
    });
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChangePasswordForm } from '../change-password-form';
import { authApi } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/http/errors';

const mockPush = vi.fn();
let mockRole: 'ADMIN' | 'FACILITY' | 'DOCTOR' | 'FAMILY' = 'FACILITY';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('../../context/auth-context', () => ({
  useAuth: () => ({
    role: mockRole,
    getDefaultPathForRole: () => '/facility',
    clearMustChangePassword: vi.fn(),
  }),
}));

vi.mock('@/lib/api/auth.api', () => ({
  authApi: {
    changePassword: vi.fn(),
  },
}));

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'FACILITY';
  });

  it('links back to the active portal login page instead of hardcoded /login', () => {
    render(<ChangePasswordForm />);
    const backLink = screen.getByRole('link', { name: /Quay lại trang Đăng nhập/i });
    expect(backLink).toHaveAttribute('href', 'http://csyt.localhost:3000/login');
  });

  it('extracts Vietnamese API error message via extractErrorMessage on failure', async () => {
    vi.mocked(authApi.changePassword).mockRejectedValueOnce(
      new ApiError('API error (400)', 400, {
        message: 'Mật khẩu hiện tại không chính xác',
        error: { detail: 'Bad Request' },
      })
    );

    render(<ChangePasswordForm />);
    fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu hiện tại'), {
      target: { value: 'OldPass!123' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Tối thiểu 8 ký tự, có hoa, thường, số, ký tự đặc biệt'),
      { target: { value: 'NewStrong!123' } }
    );
    fireEvent.change(screen.getByPlaceholderText('Nhập lại chính xác mật khẩu mới'), {
      target: { value: 'NewStrong!123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Xác Nhận Đổi Mật Khẩu/i }));

    await waitFor(() => {
      expect(screen.getByText('Mật khẩu hiện tại không chính xác')).toBeInTheDocument();
    });
  });
});

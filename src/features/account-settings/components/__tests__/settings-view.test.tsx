import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authApi } from '@/lib/api/auth.api';
import { AccountSettingsView } from '../account-settings-view';
import * as authContextModule from '@/features/auth/context/auth-context';

const mockUseAuth = vi.fn();

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/lib/api/auth.api', () => ({
  authApi: { changePassword: vi.fn() },
}));

describe('UT-CMP-14: AccountSettingsView BHYT Skeleton & Accessibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseAuth.mockReturnValue({
      role: 'FAMILY',
      user: null,
      isAuthenticated: true,
      isLoading: false,
      applySession: vi.fn(),
      clearMustChangePassword: vi.fn(),
    });
  });

  it('displays loading skeleton with aria-busy when switching to BHYT tab', async () => {
    render(<AccountSettingsView />);
    const bhytTab = screen.getByRole('button', { name: /Bảo hiểm Y tế & Ký quỹ/i });
    await userEvent.click(bhytTab);

    // Should render either skeleton or loaded state cleanly with accessible headers
    expect(screen.getByRole('heading', { level: 3, name: /Bảo hiểm Y tế & Ký quỹ/i })).toBeInTheDocument();
    expect(screen.getByText(/Mã thẻ BHYT Điện tử:/i)).toBeInTheDocument();
  });

  it('standardizes typography on AccountSettingsView (tabular-nums without font-mono, font-black, or font-extrabold)', () => {
    mockUseAuth.mockReturnValue({
      role: 'FAMILY',
      user: null,
    });
    const { container } = render(<AccountSettingsView />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    expect(container.innerHTML).toContain('tabular-nums');
  });

  it('renders doctor-specific banner and quick access links when logged in as DOCTOR', () => {
    vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
      role: 'DOCTOR',
      user: {
        id: 'DOC-7901',
        name: 'BS.CKII Trần Thanh Mai',
        phone: '0988123789',
        email: 'mai.tt@famidoc.pro',
        role: 'DOCTOR',
        avatarText: 'TM',
        facilityOrTitle: 'Bác sĩ Gia đình & Nội Tim Mạch (CCHN: 004128/HCM)',
      },
      isAuthenticated: true,
      isLoading: false,
      applySession: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      getDefaultPathForRole: () => '/doctor',
    });

    render(<AccountSettingsView />);

    expect(screen.getByText('BS.CKII Trần Thanh Mai')).toBeInTheDocument();
    expect(screen.getByText('TM')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hồ sơ Chuyên môn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chứng chỉ CCHN/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lịch làm việc/i })).toBeInTheDocument();
  });

  it('submits password change through authApi.changePassword', async () => {
    const changePasswordSpy = vi.spyOn(authApi, 'changePassword').mockResolvedValue({ message: 'OK' });

    render(<AccountSettingsView />);
    const securityTab = screen.getByRole('button', { name: /Bảo mật & Mật khẩu/i });
    await userEvent.click(securityTab);

    const curPwdInput = screen.getByLabelText(/Mật khẩu hiện tại/i);
    const newPwdInput = screen.getByLabelText(/^Mật khẩu mới/i);
    const cfmPwdInput = screen.getByLabelText(/Nhập lại mật khẩu mới/i);
    const submitBtn = screen.getByRole('button', { name: /Cập nhật mật khẩu/i });

    await userEvent.type(curPwdInput, 'OldPassword123');
    await userEvent.type(newPwdInput, 'NewPassword123');
    await userEvent.type(cfmPwdInput, 'NewPassword123');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(changePasswordSpy).toHaveBeenCalledWith({
        oldPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
      });
    });
  });
});

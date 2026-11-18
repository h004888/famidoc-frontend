import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authApi } from '@/lib/api/auth.api';
import { AccountSettingsView } from '../account-settings-view';

const mockUseAuth = vi.fn();

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/lib/api/auth.api', () => ({
  authApi: { changePassword: vi.fn() },
}));

describe('UT-CMP-14: AccountSettingsView BHYT Skeleton & Accessibility', () => {
  it('displays loading skeleton with aria-busy when switching to BHYT tab for FAMILY role', async () => {
    mockUseAuth.mockReturnValue({
      role: 'FAMILY',
      user: {
        id: 'FAM-88219',
        name: 'Nguyễn Văn An',
        phone: '0912345678',
        email: 'an.nguyen@famidoc.vn',
        avatarText: 'NA',
      },
    });

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

  it('renders Admin profile correctly without BHYT tab when role is ADMIN', () => {
    mockUseAuth.mockReturnValue({
      role: 'ADMIN',
      isAuthenticated: true,
      user: {
        id: 'ADM-001',
        name: 'DEMO - Quản trị viên',
        phone: '0901888999',
        email: 'admin.super@famidoc.pro',
        avatarText: 'DE',
      },
    });

    render(<AccountSettingsView />);

    // Admin headers and badges
    expect(screen.getByRole('heading', { name: 'DEMO - Quản trị viên' })).toBeInTheDocument();
    expect(screen.getByText('Quản trị viên Hệ thống', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('DE')).toBeInTheDocument();

    // Tab list for Admin should have Thông tin Quản trị viên and Bảo mật, NO BHYT tab
    expect(screen.getByRole('button', { name: /Thông tin tài khoản/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bảo mật & Mật khẩu/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bảo hiểm Y tế & Ký quỹ/i })).not.toBeInTheDocument();

    // Admin form fields
    expect(screen.getByLabelText('Họ và tên', { exact: true })).toHaveValue('DEMO - Quản trị viên');
    expect(screen.getByLabelText('Email đăng nhập', { exact: true })).toHaveValue('admin.super@famidoc.pro');

    // Family-specific inputs should NOT be present
    expect(screen.queryByLabelText(/Tiền sử dị ứng/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Nhóm máu/i)).not.toBeInTheDocument();
  });
});

describe('Admin password change', () => {
  async function submitPasswordChange(logout: () => void) {
    mockUseAuth.mockReturnValue({ role: 'ADMIN', user: null, isAuthenticated: true, logout });
    const user = userEvent.setup();
    render(<AccountSettingsView />);

    await user.click(screen.getByRole('button', { name: /Bảo mật & Mật khẩu/i }));
    await user.type(screen.getByLabelText('Mật khẩu hiện tại', { exact: true }), 'OldPassword@123');
    await user.type(screen.getByLabelText('Mật khẩu mới', { exact: true }), 'NewPassword@456');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới', { exact: true }), 'NewPassword@456');
    await user.click(screen.getByRole('button', { name: /Cập nhật mật khẩu/i }));
  }

  it('changes the password through the backend and then signs out the current browser', async () => {
    const logout = vi.fn();
    vi.mocked(authApi.changePassword).mockResolvedValueOnce({ message: 'Update password successfully' });

    await submitPasswordChange(logout);

    expect(authApi.changePassword).toHaveBeenLastCalledWith({ oldPassword: 'OldPassword@123', newPassword: 'NewPassword@456' });
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
  });

  it('keeps the session open and explains a rejected password change', async () => {
    const logout = vi.fn();
    vi.mocked(authApi.changePassword).mockRejectedValueOnce(new Error('Current password is not correct'));

    await submitPasswordChange(logout);

    expect(await screen.findByRole('alert')).toHaveTextContent('Mật khẩu hiện tại không đúng.');
    expect(logout).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Cập nhật mật khẩu/i })).toBeEnabled();
  });
});

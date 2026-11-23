import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountSettingsView } from '../components/account-settings-view';
import { authApi } from '@/lib/api/auth.api';

let mockRole: 'ADMIN' | 'FACILITY' | 'DOCTOR' | 'FAMILY' = 'ADMIN';
let mockUser = {
  id: 'adm-1',
  name: 'Quản trị viên Hệ thống',
  email: 'admin@famidoc.vn',
  phone: '0901888999',
  role: 'ADMIN' as const,
  avatarText: 'QT',
};

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    role: mockRole,
    user: mockUser,
    isAuthenticated: true,
    applySession: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('AccountSettingsView - thích ứng theo vai trò', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'ADMIN';
    mockUser = {
      id: 'adm-1',
      name: 'Quản trị viên Hệ thống',
      email: 'admin@famidoc.vn',
      phone: '0901888999',
      role: 'ADMIN',
      avatarText: 'QT',
    };
  });

  it('ẩn tab BHYT, badge BYT và các trường y tế gia đình khi vai trò là ADMIN', () => {
    render(<AccountSettingsView />);

    expect(screen.getByRole('heading', { name: 'Quản trị viên Hệ thống' })).toBeInTheDocument();
    expect(screen.queryByText(/Đã Định Danh BYT/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bảo hiểm Y tế & Ký quỹ/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Nhóm máu/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Tiền sử dị ứng/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Quản lý Tài khoản & RBAC/i })).toHaveAttribute(
      'href',
      '/admin/users',
    );
  });

  it('hiển thị đầy đủ tab BHYT và các trường y tế khi vai trò là FAMILY', () => {
    mockRole = 'FAMILY';
    mockUser = {
      id: 'FAM-123',
      name: 'Nguyễn Gia Đình',
      email: 'family@famidoc.vn',
      phone: '0912345678',
      role: 'FAMILY' as unknown as 'ADMIN',
      avatarText: 'NG',
    };

    render(<AccountSettingsView />);

    expect(screen.getByText(/Tài khoản Hộ gia đình/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Bảo hiểm Y tế & Ký quỹ/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày sinh/i)).toBeInTheDocument();
  });

  it('gọi authApi.changePassword khi gửi biểu mẫu đổi mật khẩu hợp lệ', async () => {
    const user = userEvent.setup();
    const changePwdSpy = vi
      .spyOn(authApi, 'changePassword')
      .mockResolvedValueOnce({ message: 'Đổi mật khẩu thành công' });

    render(<AccountSettingsView />);

    await user.click(screen.getByRole('button', { name: /Bảo mật & Mật khẩu/i }));
    await user.type(screen.getByLabelText(/Mật khẩu hiện tại/i), 'OldPass@123');
    await user.type(screen.getByLabelText(/^Mật khẩu mới$/i), 'NewPass@123');
    await user.type(screen.getByLabelText(/Nhập lại mật khẩu mới/i), 'NewPass@123');
    await user.click(screen.getByRole('button', { name: /Cập nhật mật khẩu/i }));

    expect(changePwdSpy).toHaveBeenCalledWith({
      oldPassword: 'OldPass@123',
      newPassword: 'NewPass@123',
    });

    changePwdSpy.mockRestore();
  });
});

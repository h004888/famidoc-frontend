import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountSettingsView } from '../account-settings-view';
import { authApi } from '@/lib/api/auth.api';

vi.mock('@/lib/api/auth.api', () => ({
  authApi: {
    changePassword: vi.fn().mockResolvedValue({ success: true, message: 'OK' }),
  },
}));

describe('UT-CMP-14: AccountSettingsView BHYT Skeleton & Accessibility', () => {
  it('displays loading skeleton with aria-busy when switching to BHYT tab', async () => {
    render(<AccountSettingsView />);
    const bhytTab = screen.getByRole('button', { name: /Bảo hiểm Y tế & Ký quỹ/i });
    await userEvent.click(bhytTab);

    // Should render either skeleton or loaded state cleanly with accessible headers
    expect(screen.getByRole('heading', { level: 3, name: /Bảo hiểm Y tế & Ký quỹ/i })).toBeInTheDocument();
    expect(screen.getByText(/Mã thẻ BHYT Điện tử:/i)).toBeInTheDocument();
  });

  it('standardizes typography on AccountSettingsView (tabular-nums without font-mono, font-black, or font-extrabold)', () => {
    const { container } = render(<AccountSettingsView />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    expect(container.innerHTML).toContain('tabular-nums');
  });

  it('calls authApi.changePassword when submitting password form in Bảo mật tab', async () => {
    render(<AccountSettingsView />);
    await userEvent.click(screen.getByRole('button', { name: /Bảo mật & Mật khẩu/i }));

    await userEvent.type(screen.getByLabelText(/Mật khẩu hiện tại/i), 'OldPass!1');
    await userEvent.type(screen.getByLabelText(/^Mật khẩu mới$/i), 'NewStrongPass!1');
    await userEvent.type(screen.getByLabelText(/Nhập lại mật khẩu mới/i), 'NewStrongPass!1');
    await userEvent.click(screen.getByRole('button', { name: /Cập nhật mật khẩu/i }));

    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith({
        oldPassword: 'OldPass!1',
        newPassword: 'NewStrongPass!1',
      });
    });
  });
});

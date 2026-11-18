import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardTopbarNotifications } from '../dashboard-topbar-notifications';

const mockUseAuth = vi.fn();

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('DashboardTopbarNotifications - Nút thông báo tiếp nhận 2 loại đơn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification bell button and opens dropdown menu on click for ADMIN', () => {
    mockUseAuth.mockReturnValue({
      role: 'ADMIN',
      user: { name: 'Super Admin' },
    });

    render(<DashboardTopbarNotifications />);

    const bellBtn = screen.getByRole('button', { name: /Thông báo hệ thống/i });
    expect(bellBtn).toBeInTheDocument();

    // Menu initially closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(bellBtn);

    // Menu opened
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getByText('Thông báo Quản trị viên')).toBeInTheDocument();
  });

  it('only displays 2 notification types for Admin: (1) Đơn thanh toán lỗi của gia đình & (2) Đơn khiếu nại tranh chấp giữa gia đình và bác sĩ', () => {
    mockUseAuth.mockReturnValue({
      role: 'ADMIN',
      user: { name: 'Super Admin' },
    });

    render(<DashboardTopbarNotifications />);

    const bellBtn = screen.getByRole('button', { name: /Thông báo hệ thống/i });
    fireEvent.click(bellBtn);

    // Scope note
    expect(screen.getByText(/Tiếp nhận:/i)).toBeInTheDocument();

    // Type 1: Đơn thanh toán lỗi (Gia đình)
    expect(screen.getByText('Đơn thanh toán lỗi (Gia đình)')).toBeInTheDocument();
    expect(screen.getByText(/Lỗi đối soát thanh toán VietQR - Hộ FAM-88219/i)).toBeInTheDocument();
    const reconLink = screen.getByRole('link', { name: /Xử lý đối soát/i });
    expect(reconLink).toHaveAttribute('href', '/admin/reconciliation');

    // Type 2: Đơn khiếu nại tranh chấp (Gia đình - Bác sĩ)
    expect(screen.getByText('Khiếu nại tranh chấp (Gia đình - Bác sĩ)')).toBeInTheDocument();
    expect(screen.getByText(/Khiếu nại tranh chấp buổi khám - Hộ FAM-042 & BS Trần Mai Phương/i)).toBeInTheDocument();
    const disputeLink = screen.getByRole('link', { name: /Thụ lý khiếu nại/i });
    expect(disputeLink).toHaveAttribute('href', '/admin/disputes');
  });

  it('allows marking all notifications as read and provides link to full notification center', () => {
    mockUseAuth.mockReturnValue({
      role: 'ADMIN',
      user: { name: 'Super Admin' },
    });

    render(<DashboardTopbarNotifications />);

    const bellBtn = screen.getByRole('button', { name: /Thông báo hệ thống/i });
    fireEvent.click(bellBtn);

    const markAllBtn = screen.getByRole('button', { name: /Đọc tất cả/i });
    fireEvent.click(markAllBtn);

    // Link to full notifications view
    const allNotifsLink = screen.getByRole('link', { name: /Xem tất cả tại Trung tâm thông báo/i });
    expect(allNotifsLink).toHaveAttribute('href', '/notifications');
  });
});

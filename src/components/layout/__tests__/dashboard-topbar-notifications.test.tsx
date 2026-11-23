import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardTopbarNotifications } from '../dashboard-topbar-notifications';
import { httpClient } from '@/lib/api/http-client';

const mockUseAuth = vi.fn();

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/lib/api/http-client', () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
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
    expect(screen.getByTestId('notification-unread-badge')).toHaveTextContent('2');

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

  it('fetches real notifications and marks as read via API when role is FACILITY', async () => {
    mockUseAuth.mockReturnValue({
      role: 'FACILITY',
      isAuthenticated: true,
      user: { id: 'fac-user-1', name: 'Bệnh viện Cà Mau' },
    });

    vi.mocked(httpClient.get).mockResolvedValue({
      items: [
        {
          id: 'notif-fac-1',
          title: 'Hồ sơ chứng chỉ bác sĩ mới cần thẩm định',
          content: 'Bác sĩ Nguyễn Văn An đã nộp đủ 3 tài liệu.',
          type: 'DOCTOR_CREDENTIALS_SUBMITTED',
          referenceId: 'doc-1',
          isRead: false,
          createdAt: '2026-11-22T10:00:00.000Z',
        },
      ],
      total: 1,
      unreadCount: 1,
    });
    vi.mocked(httpClient.patch).mockResolvedValue({ id: 'notif-fac-1', isRead: true });

    render(<DashboardTopbarNotifications />);

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith(
        '/api/v1/notifications',
        expect.objectContaining({ page: 1, limit: 8 }),
        expect.any(Object),
      );
    });

    const bellBtn = screen.getByRole('button', { name: /Thông báo hệ thống/i });
    fireEvent.click(bellBtn);

    expect(await screen.findByText('Thông báo Cơ sở Y tế')).toBeInTheDocument();
    expect(screen.getByText('Hồ sơ chứng chỉ bác sĩ mới cần thẩm định')).toBeInTheDocument();
    expect(screen.queryByText(/Xác nhận lịch bác sĩ khám tại nhà/i)).not.toBeInTheDocument();

    const actionLink = screen.getByRole('link', { name: /Quản lý bác sĩ/i });
    expect(actionLink).toHaveAttribute('href', '/facility/doctors');

    fireEvent.click(screen.getByRole('button', { name: 'Đã đọc' }));
    await waitFor(() => {
      expect(httpClient.patch).toHaveBeenCalledWith('/api/v1/notifications/notif-fac-1/read');
    });
  });
});

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationsView } from '../notifications-view';
import * as authContext from '@/features/auth/context/auth-context';
import { isRestrictedFamilyPath } from '@/components/layout/family-subscription-gate';
import { getNotificationAction } from '../../hooks/use-family-notifications';

describe('UT-NOTIF: Multi-Channel Notification Hub', () => {
  it.each([
    ['SUPPORT_CASE_PAYMENT', '/family/billing'],
    ['SUPPORT_CASE_COMPLAINT', '/family/feedback'],
  ])('links %s to the specific support case even without an active contract', (type, path) => {
    const action = getNotificationAction({
      id: 'notification-1',
      title: 'Cập nhật hồ sơ',
      content: '',
      type,
      referenceId: 'case-1',
      isRead: false,
      createdAt: '2026-11-22T09:00:00Z',
    });
    expect(action?.href).toBe(path + '?supportCaseId=case-1');
    expect(isRestrictedFamilyPath(action?.href)).toBe(false);
    expect(isRestrictedFamilyPath('/family/appointments')).toBe(true);
  });

  it('renders heading and notification items correctly', () => {
    render(<NotificationsView />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Thông Báo Gia Đình|Multi-Channel Notification Hub/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/Huyết áp của Ông Nguyễn Văn Phúc hơi cao/i)).toBeInTheDocument();
    expect(screen.getByText(/Đã cập nhật đơn thuốc mới cho Ông Nguyễn Văn Phúc/i)).toBeInTheDocument();
  });

  it('marks all notifications as read when clicking "Đọc tất cả"', () => {
    render(<NotificationsView />);

    const markAllBtn = screen.getByRole('button', { name: /Đọc tất cả|Đánh dấu đã đọc/i });
    expect(markAllBtn).toBeInTheDocument();

    fireEvent.click(markAllBtn);

    // Unread count badge should disappear and display "Đã xem tất cả"
    expect(screen.queryByText(/tin chưa đọc/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Đã xem tất cả/i)).toBeInTheDocument();
  });

  it('filters notifications when selecting category tabs', () => {
    render(<NotificationsView />);

    const healthTab = screen.getByRole('button', { name: /Sức khỏe/i });
    fireEvent.click(healthTab);

    expect(screen.getByText(/Huyết áp của Ông Nguyễn Văn Phúc hơi cao/i)).toBeInTheDocument();
    expect(screen.queryByText(/Đã phát hành biên lai điện tử/i)).not.toBeInTheDocument();
  });

  it('standardizes typography on NotificationsView (tabular-nums without tracking-wide, font-bold without font-extrabold)', () => {
    const { container } = render(<NotificationsView />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    expect(container.innerHTML).toContain('tabular-nums');
  });

  it('renders ADMIN portal notifications: only receives (1) payment errors of families & (2) dispute complaints between family and doctor', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      role: 'ADMIN',
      user: {
        id: 'ADM-001',
        name: 'Super Admin',
        phone: '0901888999',
        role: 'ADMIN',
        avatarText: 'AD',
      },
      isAuthenticated: true,
      isLoading: false,
      applySession: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      getDefaultPathForRole: () => '/admin',
    });

    render(<NotificationsView />);

    // Header for Admin
    expect(
      screen.getByRole('heading', { level: 1, name: /Thông Báo Quản Trị Viên/i })
    ).toBeInTheDocument();

    // 2 specific stream categories
    expect(screen.getByRole('button', { name: /1\. Đơn thanh toán lỗi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2\. Khiếu nại tranh chấp/i })).toBeInTheDocument();

    // Type 1: Đơn thanh toán lỗi
    expect(screen.getByText(/Lỗi đối soát thanh toán VietQR - Hộ gia đình FAM-88219/i)).toBeInTheDocument();
    const reconLink = screen.getByRole('link', { name: /Xử lý đối soát doanh thu/i });
    expect(reconLink).toHaveAttribute('href', '/admin/reconciliation');

    // Type 2: Khiếu nại tranh chấp
    expect(screen.getByText(/Đơn khiếu nại tranh chấp buổi khám - Hộ FAM-042 & BS.CKII Trần Mai Phương/i)).toBeInTheDocument();
    const disputeLink = screen.getByRole('link', { name: /Thụ lý giải quyết khiếu nại/i });
    expect(disputeLink).toHaveAttribute('href', '/admin/disputes');
  });
});

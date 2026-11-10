import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationsView } from '../notifications-view';

describe('UT-NOTIF: Multi-Channel Notification Hub', () => {
  it('renders heading and notification items correctly', () => {
    render(<NotificationsView />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Thông Báo Gia Đình/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/Huyết áp của Ông Nguyễn Văn Phúc hơi cao/i)).toBeInTheDocument();
    expect(screen.getByText(/Đã cập nhật đơn thuốc mới cho Ông Nguyễn Văn Phúc/i)).toBeInTheDocument();
  });

  it('marks all notifications as read when clicking "Đọc tất cả"', () => {
    render(<NotificationsView />);

    const markAllBtn = screen.getByRole('button', { name: /Đọc tất cả/i });
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
    expect(screen.queryByText(/Đã phát hành biên lai điện tử gói Xét nghiệm/i)).not.toBeInTheDocument();
  });

  it('standardizes typography on NotificationsView (tabular-nums without font-mono, font-bold without font-extrabold)', () => {
    const { container } = render(<NotificationsView />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    expect(container.innerHTML).toContain('tabular-nums');
  });
});

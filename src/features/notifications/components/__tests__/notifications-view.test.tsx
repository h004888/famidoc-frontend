import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationsView } from '../notifications-view';

describe('UT-NOTIF: Multi-Channel Notification Hub', () => {
  it('renders heading and notification items correctly', () => {
    render(<NotificationsView />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Multi-Channel Notification Hub/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/Cảnh báo Chỉ số Huyết áp Vượt ngưỡng Mục tiêu/i)).toBeInTheDocument();
    expect(screen.getByText(/Bác sĩ Đã Phát hành & Ký số Đơn Thuốc Điện Tử/i)).toBeInTheDocument();
  });

  it('marks all notifications as read when clicking "Đánh dấu đã đọc"', () => {
    render(<NotificationsView />);

    const markAllBtn = screen.getByRole('button', { name: /Đánh dấu đã đọc/i });
    expect(markAllBtn).toBeInTheDocument();

    fireEvent.click(markAllBtn);

    // Unread count badge should disappear
    expect(screen.queryByText(/chưa đọc/i)).not.toBeInTheDocument();
  });

  it('filters notifications when selecting category tabs', () => {
    render(<NotificationsView />);

    const telemetryTab = screen.getByRole('button', { name: /Cảnh báo Sinh tồn IoT/i });
    fireEvent.click(telemetryTab);

    expect(screen.getByText(/Cảnh báo Chỉ số Huyết áp Vượt ngưỡng Mục tiêu/i)).toBeInTheDocument();
    expect(screen.queryByText(/Xác nhận Quyết toán VietQR/i)).not.toBeInTheDocument();
  });
});


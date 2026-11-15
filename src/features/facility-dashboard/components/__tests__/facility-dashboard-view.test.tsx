import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FacilityDashboardView } from '../facility-dashboard-view';

describe('FacilityDashboardView', () => {
  it('renders 4 KPI cards, 3 SLA progress bars, Fast-Track referrals, and service channel chart', () => {
    const { container } = render(<FacilityDashboardView />);

    // 4 KpiStatCards
    expect(screen.getByText('Bác sĩ trực thuộc')).toBeInTheDocument();
    expect(screen.getByText('Lượt khám tháng này')).toBeInTheDocument();
    expect(screen.getByText('Chỉ số SLA đáp ứng')).toBeInTheDocument();
    expect(screen.getByText('Doanh thu B2B tạm tính')).toBeInTheDocument();

    // 3 SLA Progress bars
    expect(screen.getByRole('progressbar', { name: 'Tỷ lệ đáp ứng lịch khám' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Công suất Panel Cap' })).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Thời gian phản hồi cấp cứu Fast-Track' })
    ).toBeInTheDocument();

    // Fast-Track referrals
    expect(screen.getByText('Luồng Tiếp Nhận Fast-Track Chuyển Viện')).toBeInTheDocument();
    expect(screen.getByText('Lê Văn Nam (65 tuổi)')).toBeInTheDocument();
    expect(screen.getByText('Khẩn cấp')).toBeInTheDocument();

    // Channel distribution chart + breakdown
    expect(screen.getByText('Phân Bổ Kênh Dịch Vụ Y Tế')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="chart"]')).toBeTruthy();
    expect(screen.getByText('58% (824 ca)')).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });
});

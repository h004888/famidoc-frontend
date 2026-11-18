import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { adminApi, type AdminOverview } from '@/lib/api/admin.api';
import { AdminDashboardView } from '../admin-dashboard-view';

vi.mock('@/features/admin-doctors/components/admin-quota-proposals-panel', () => ({
  AdminQuotaProposalsPanel: () => <section aria-label="Đề xuất hạn mức" />,
}));
vi.mock('@/features/admin-doctors/components/admin-matching-queue-panel', () => ({
  AdminMatchingQueuePanel: () => <section aria-label="Hàng đợi ghép bác sĩ" />,
}));

vi.mock('@/lib/api/admin.api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api/admin.api')>(),
  adminApi: { overview: vi.fn() },
}));

const stats: AdminOverview = {
  gmvVnd: 520000, activeContracts: 4, doctors: 3, facilities: 2, openComplaints: 1,
  counts: { total: 6314, completed: 7, pending: 1, cancelled: 9 },
  queue: [{ id: 'complaint-1', complaintCode: 'DISP-004', status: 'SUBMITTED', description: 'Lịch khám chưa được xác nhận.', complaintCategory: 'MISSED_VISIT', createdAt: '2026-11-17', contractId: 'contract-1' }],
  series: [],
};

beforeEach(() => vi.clearAllMocks());

describe('AdminDashboardView', () => {
  it('requests statistics when the selected period changes', async () => {
    vi.mocked(adminApi.overview).mockImplementation(async (period) => period === 'weekly'
      ? { ...stats, counts: { ...stats.counts, total: 1482 } } : stats);
    render(<AdminDashboardView />);
    expect(await screen.findByText(new Intl.NumberFormat('vi-VN').format(6314))).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Đề xuất hạn mức' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Hàng đợi ghép bác sĩ' })).toBeInTheDocument();
    const weekTab = screen.getByRole('tab', { name: 'Tuần' });
    fireEvent.mouseDown(weekTab);
    fireEvent.click(weekTab);
    expect(await screen.findByText(new Intl.NumberFormat('vi-VN').format(1482))).toBeInTheDocument();
    expect(adminApi.overview).toHaveBeenCalledWith('weekly', 'LIVE');
  });

  it('opens the actual complaint from the overview response', async () => {
    vi.mocked(adminApi.overview).mockResolvedValue(stats);
    render(<AdminDashboardView />);
    fireEvent.click(await screen.findByRole('button', { name: 'Xem nhanh' }));
    expect(screen.getByRole('heading', { name: 'Khiếu nại DISP-004' })).toBeInTheDocument();
    expect(screen.getByText('Lịch khám chưa được xác nhận.')).toBeInTheDocument();
  });

  it('shows API errors without replacing them with sample metrics', async () => {
    vi.mocked(adminApi.overview).mockRejectedValue(new Error('Không có quyền quản trị'));
    render(<AdminDashboardView />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền quản trị');
    expect(screen.queryByText('Tiền đã thu từ đầu năm')).not.toBeInTheDocument();
  });
});

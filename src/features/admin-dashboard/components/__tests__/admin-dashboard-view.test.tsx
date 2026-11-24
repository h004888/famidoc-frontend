import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { adminApi, type AdminFinanceReport, type AdminOverview } from '@/lib/api/admin.api';
import { formatCurrencyVND } from '@/lib/utils';
import { AdminDashboardView } from '../admin-dashboard-view';

vi.mock('@/features/admin-doctors/components/admin-quota-proposals-panel', () => ({
  AdminQuotaProposalsPanel: () => <section aria-label="Đề xuất hạn mức" />,
}));
vi.mock('@/features/admin-doctors/components/admin-matching-queue-panel', () => ({
  AdminMatchingQueuePanel: () => <section aria-label="Hàng đợi ghép bác sĩ" />,
}));

vi.mock('@/lib/api/admin.api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api/admin.api')>(),
  adminApi: { overview: vi.fn(), financeReport: vi.fn() },
}));

const stats: AdminOverview = {
  gmvVnd: 520000, activeContracts: 4, doctors: 3, facilities: 2, openComplaints: 1,
  counts: { total: 6314, completed: 7, pending: 1, cancelled: 9 },
  queue: [{ id: 'complaint-1', complaintCode: 'DISP-004', status: 'SUBMITTED', description: 'Lịch khám chưa được xác nhận.', complaintCategory: 'MISSED_VISIT', createdAt: '2026-11-17', contractId: 'contract-1' }],
  series: [],
};

const currentYear = Number(new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));
const report: AdminFinanceReport = {
  year: currentYear, environment: 'LIVE',
  totals: { purchasingFamilies: 2, receivedVnd: 800000, paidVnd: 200000, netVnd: 600000 },
  months: Array.from({ length: 12 }, (_, index) => ({
    month: index + 1, receivedVnd: index === 9 ? 800000 : 0, paidVnd: index === 10 ? 200000 : 0,
  })),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminApi.overview).mockResolvedValue(stats);
  vi.mocked(adminApi.financeReport).mockImplementation(async (year, environment) => ({ ...report, year, environment }));
});

describe('AdminDashboardView', () => {
  it('shows yearly totals and exact amounts for each of the twelve months', async () => {
    render(<AdminDashboardView />);
    expect(await screen.findByText(formatCurrencyVND(600000))).toBeInTheDocument();
    const finance = within(screen.getByRole('region', { name: 'Báo cáo tài chính năm' }));
    expect(finance.getByText('Gia đình đã mua gói').nextElementSibling).toHaveTextContent(/^2$/);
    expect(finance.getByText('Tổng tiền đã thu').nextElementSibling).toHaveTextContent(formatCurrencyVND(800000));
    expect(finance.getByText('Đã chi trả CSYT').nextElementSibling).toHaveTextContent(formatCurrencyVND(200000));
    expect(finance.getByText('Còn lại sau chi trả').nextElementSibling).toHaveTextContent(formatCurrencyVND(600000));
    expect(screen.queryByText('Tiền đã thu từ đầu năm')).not.toBeInTheDocument();
    expect(screen.queryByText(formatCurrencyVND(stats.gmvVnd))).not.toBeInTheDocument();
    expect(screen.queryByText('Lịch hẹn theo loại dịch vụ')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Đề xuất hạn mức' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Hàng đợi ghép bác sĩ' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Xem số liệu từng tháng'));
    const table = screen.getByRole('table', { name: `Thu và chi trả từng tháng năm ${currentYear}` });
    expect(within(table).getAllByRole('rowheader')).toHaveLength(12);
    const october = within(table).getByRole('row', { name: /Tháng 10/ });
    const november = within(table).getByRole('row', { name: /Tháng 11/ });
    expect(within(october).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([formatCurrencyVND(800000), formatCurrencyVND(0)]);
    expect(within(november).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([formatCurrencyVND(0), formatCurrencyVND(200000)]);
  });

  it('reloads financial data for the selected year and environment', async () => {
    render(<AdminDashboardView />);
    await waitFor(() => expect(adminApi.financeReport).toHaveBeenCalledWith(currentYear, 'LIVE'));

    fireEvent.change(screen.getByRole('combobox', { name: 'Năm báo cáo tài chính' }), { target: { value: String(currentYear - 1) } });
    await waitFor(() => expect(adminApi.financeReport).toHaveBeenLastCalledWith(currentYear - 1, 'LIVE'));
    expect(adminApi.overview).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByRole('combobox', { name: 'Môi trường tổng quan' }), { target: { value: 'TEST' } });
    await waitFor(() => expect(adminApi.financeReport).toHaveBeenLastCalledWith(currentYear - 1, 'TEST'));
    expect(adminApi.overview).toHaveBeenLastCalledWith('monthly', 'TEST');
    await screen.findByText('Còn lại sau chi trả');
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

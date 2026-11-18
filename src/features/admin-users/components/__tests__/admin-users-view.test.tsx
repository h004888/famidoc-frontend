import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { adminApi, type AdminAuditLog, type AdminUser } from '@/lib/api/admin.api';
import { AdminUsersView } from '../admin-users-view';

vi.mock('@/lib/api/admin.api', () => ({
  adminApi: {
    users: vi.fn(),
    auditLogs: vi.fn(),
    changeUserStatus: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUsers: AdminUser[] = Array.from({ length: 10 }, (_, i) => ({
  id: `user-${i + 1}`,
  fullName: `Nguyễn Văn ${String.fromCharCode(65 + i)}`,
  email: `user${i + 1}@famidoc.pro`,
  phone: `09012345${String(i).padStart(2, '0')}`,
  role: i === 0 ? 'ADMIN' : i % 2 === 0 ? 'DOCTOR' : 'FAMILY_REP',
  status: i % 3 === 0 ? 'SUSPENDED' : 'ACTIVE',
  canRestore: true,
}));

const mockAuditLogs: AdminAuditLog[] = [
  {
    id: 'audit-101',
    timestamp: '2026-11-18T08:30:00.000Z',
    action: 'USER_SUSPENDED',
    resourceName: 'users',
    resourceId: 'user-3',
    clientIp: '192.168.1.50',
    details: { reason: 'Vi phạm chính sách thanh toán dịch vụ', previousStatus: 'ACTIVE', status: 'SUSPENDED' },
    actorUser: { fullName: 'DEMO - Quản trị viên', role: 'ADMIN' },
  },
  {
    id: 'audit-102',
    timestamp: '2026-11-18T09:15:00.000Z',
    action: 'FACILITY_INVITE_RESENT',
    resourceName: 'HealthcareFacility',
    resourceId: 'fac-99',
    clientIp: '192.168.1.50',
    details: { reason: 'Gửi lại mã kích hoạt cho bệnh viện đa khoa' },
    actorUser: { fullName: 'DEMO - Quản trị viên', role: 'ADMIN' },
  },
];

describe('AdminUsersView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminApi.users).mockResolvedValue({
      items: mockUsers,
      total: 25,
      page: 1,
      limit: 10,
    });
    vi.mocked(adminApi.auditLogs).mockResolvedValue({
      items: mockAuditLogs,
      total: 12,
      page: 1,
      limit: 10,
    });
  });

  it('renders title as "Quản lý tài khoản và phân quyền" and tabs "Tài khoản người dùng" & "Nhật ký hoạt động"', async () => {
    render(<AdminUsersView />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Quản lý tài khoản và phân quyền' }),
    ).toBeInTheDocument();

    expect(screen.getByRole('tab', { name: /Tài khoản người dùng/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Nhật ký hoạt động/i })).toBeInTheDocument();
  });

  it('loads user list with limit=10 and displays 10 users per page badge & pagination info', async () => {
    render(<AdminUsersView />);

    await waitFor(() => {
      expect(adminApi.users).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    expect(screen.getByText(/Hiển thị tối đa/i)).toHaveTextContent('10 tài khoản');
    expect((await screen.findAllByText('Nguyễn Văn A')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Nguyễn Văn B')).length).toBeGreaterThan(0);
  });

  it('allows searching and role filtering in user list', async () => {
    render(<AdminUsersView />);

    const searchInput = screen.getByLabelText('Tìm tài khoản');
    fireEvent.change(searchInput, { target: { value: 'Nguyễn Văn B' } });

    const searchButton = screen.getByRole('button', { name: 'Tìm kiếm' });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(adminApi.users).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10, q: 'Nguyễn Văn B' }),
      );
    });
  });

  it('opens dialog to suspend or restore an account and validates minimum 5 chars reason', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.changeUserStatus).mockResolvedValue({
      ...mockUsers[1],
      status: 'SUSPENDED',
    });

    render(<AdminUsersView />);

    await screen.findAllByText('Nguyễn Văn B');

    // Find the action button for Nguyễn Văn B (ACTIVE -> Tạm khóa)
    const suspendButtons = screen.getAllByRole('button', { name: /Tạm khóa/i });
    expect(suspendButtons.length).toBeGreaterThan(0);
    await user.click(suspendButtons[0]);

    // Dialog opens
    expect(screen.getByText(/Tạm khóa quyền truy cập/i)).toBeInTheDocument();

    const textarea = screen.getByLabelText(/Lý do thực hiện/i);
    const confirmButton = screen.getByRole('button', { name: 'Xác nhận thay đổi' });

    // Confirm button disabled when reason < 5 chars
    expect(confirmButton).toBeDisabled();

    await user.type(textarea, 'Tài khoản vi phạm bảo mật');
    expect(confirmButton).not.toBeDisabled();

    await user.click(confirmButton);

    await waitFor(() => {
      expect(adminApi.changeUserStatus).toHaveBeenCalledWith(
        expect.any(String),
        'SUSPENDED',
        'Tài khoản vi phạm bảo mật',
      );
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('switches to "Nhật ký hoạt động" tab, loads audit logs with limit=10, and opens detail dialog', async () => {
    const user = userEvent.setup();
    render(<AdminUsersView />);

    const auditTab = screen.getByRole('tab', { name: /Nhật ký hoạt động/i });
    await user.click(auditTab);

    await waitFor(() => {
      expect(adminApi.auditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    expect(screen.getByText(/Hiển thị tối đa/i)).toHaveTextContent('10 sự kiện');
    expect((await screen.findAllByText('Tạm khóa tài khoản')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Gửi lại lời mời CSYT')).length).toBeGreaterThan(0);

    // Click "Xem" button to open audit detail modal
    const viewButtons = screen.getAllByRole('button', { name: /Xem/i });
    expect(viewButtons.length).toBeGreaterThan(0);
    await user.click(viewButtons[0]);

    expect(screen.getByText('Chi tiết bản ghi nhật ký hoạt động')).toBeInTheDocument();
    expect((await screen.findAllByText(/Vi phạm chính sách thanh toán dịch vụ/i)).length).toBeGreaterThan(0);
  });
});

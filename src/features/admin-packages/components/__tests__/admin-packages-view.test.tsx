import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { adminPackagesApi, type AdminCarePackageItem } from '@/lib/api/admin-packages.api';
import { AdminPackagesView } from '../admin-packages-view';

vi.mock('@/lib/api/admin-packages.api', () => ({
  adminPackagesApi: {
    listPackages: vi.fn(),
    publishPackage: vi.fn(),
    updatePackage: vi.fn(),
    createVersion: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

const draftItem: AdminCarePackageItem = {
  id: 'draft-id', code: 'VISITS', version: 1, status: 'DRAFT', name: 'Gói theo dõi',
  description: '', durationMonths: 3, priceVnd: 990000, includedMembers: 1,
  maxMembers: 2, additionalMemberMonthlyPriceVnd: 75000, quotaPeriod: 'PER_TERM',
  quotas: { homeVisits: 2, videoConsultations: 3, facilityVisits: 0 },
};

it('renders page header as Quản lý gói dịch vụ, layout with 3 packages per row (lg:grid-cols-3), and replaces Khám tại CSYT with Bác sĩ phụ trách', async () => {
  vi.mocked(adminPackagesApi.listPackages).mockResolvedValue({
    items: [draftItem], page: 1, limit: 6, total: 1,
  });

  const { container } = render(<AdminPackagesView />);

  // Title check (Requirement 1)
  expect(screen.getByRole('heading', { level: 1, name: 'Quản lý gói dịch vụ' })).toBeInTheDocument();

  // Wait for items to load
  await screen.findByText('Gói theo dõi');

  // Grid check: 3 packages per row on desktop (Requirement 2)
  const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
  expect(gridContainer).toBeInTheDocument();

  // Quotas check: Bác sĩ phụ trách is present, Khám tại CSYT is removed (Requirement 2)
  expect(await screen.findByText('Bác sĩ phụ trách')).toBeInTheDocument();
  expect(screen.getByText('Bác sĩ CCHN riêng')).toBeInTheDocument();
  expect(screen.queryByText('Khám tại CSYT')).not.toBeInTheDocument();
});

it('opens package detail dialog when clicking "Xem" button, showing all inner details', async () => {
  const activeItem: AdminCarePackageItem = {
    ...draftItem,
    id: 'active-item-view',
    status: 'ACTIVE',
    name: 'Gói Chăm Sóc Tiêu Chuẩn',
    description: 'Chăm sóc sức khỏe gia đình định kỳ với bác sĩ riêng',
    priceVnd: 1500000,
    durationMonths: 6,
    includedMembers: 2,
    maxMembers: 4,
    additionalMemberMonthlyPriceVnd: 80000,
  };

  vi.mocked(adminPackagesApi.listPackages).mockResolvedValue({
    items: [activeItem], page: 1, limit: 6, total: 1,
  });

  render(<AdminPackagesView />);

  const viewBtn = await screen.findByRole('button', { name: 'Xem' });
  expect(viewBtn).toBeInTheDocument();

  fireEvent.click(viewBtn);

  // Dialog should open with full package specifications
  expect(screen.getByRole('heading', { name: 'Gói Chăm Sóc Tiêu Chuẩn' })).toBeInTheDocument();
  expect(screen.getByText('Chăm sóc sức khỏe gia đình định kỳ với bác sĩ riêng')).toBeInTheDocument();
  expect(screen.getAllByText(/1\.500\.000/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/2 người trong giá/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/80\.000/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sửa gói này' })).toBeInTheDocument();

  // Close dialog
  fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
  expect(screen.queryByRole('button', { name: 'Sửa gói này' })).not.toBeInTheDocument();
});

it('shows "Sửa" button instead of "Tạo phiên bản mới", and edits package directly without creating a new version', async () => {
  const activeItem: AdminCarePackageItem = {
    ...draftItem,
    id: 'active-item-1',
    status: 'ACTIVE',
    name: 'Gói Chăm Sóc Toàn Diện',
  };

  vi.mocked(adminPackagesApi.listPackages).mockResolvedValue({
    items: [activeItem], page: 1, limit: 6, total: 1,
  });
  vi.mocked(adminPackagesApi.updatePackage).mockResolvedValue({
    ...activeItem,
    name: 'Gói Chăm Sóc Toàn Diện (Đã sửa)',
  });

  render(<AdminPackagesView />);

  // Should have "Sửa" button and NOT "Tạo phiên bản mới" (Requirement 3)
  expect(screen.queryByRole('button', { name: /Tạo phiên bản mới/i })).not.toBeInTheDocument();
  const editBtn = await screen.findByRole('button', { name: 'Sửa' });
  expect(editBtn).toBeInTheDocument();

  // Click "Sửa" opens edit dialog directly (Requirement 4)
  fireEvent.click(editBtn);
  expect(screen.getByRole('heading', { name: 'Sửa gói dịch vụ' })).toBeInTheDocument();
  expect(screen.getByLabelText(/Tên gói/i)).toHaveValue('Gói Chăm Sóc Toàn Diện');

  // Submit edits
  const saveBtn = screen.getByRole('button', { name: 'Lưu thay đổi' });
  fireEvent.click(saveBtn);

  await waitFor(() => {
    // Should call updatePackage on existing id directly without createVersion
    expect(adminPackagesApi.updatePackage).toHaveBeenCalledWith('active-item-1', expect.any(Object));
    expect(adminPackagesApi.createVersion).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Đã lưu thay đổi gói dịch vụ.');
  });
});

it('keeps a draft unpublished and shows the backend error if publishing fails', async () => {
  vi.mocked(adminPackagesApi.listPackages).mockImplementation(async ({ status } = {}) => ({
    items: status ? [] : [draftItem], page: 1, limit: 6, total: status ? 0 : 1,
  }));
  vi.mocked(adminPackagesApi.publishPackage).mockRejectedValue(new Error('Phiên bản đã thay đổi'));
  render(<AdminPackagesView />);
  fireEvent.click(within(screen.getByRole('group', { name: 'Trạng thái gói' })).getByRole('button', { name: 'Tất cả' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Xuất bản' }));
  expect(adminPackagesApi.publishPackage).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Phiên bản đã thay đổi');
  expect(adminPackagesApi.publishPackage).toHaveBeenCalledWith('draft-id');
  expect(toast.success).not.toHaveBeenCalled();
  expect(screen.getByText('Bản nháp', { selector: '[data-slot="badge"]' })).toBeInTheDocument();
});

it('starts with active packages, loads six per page, and returns to page one when the status changes', async () => {
  const activeItems = Array.from({ length: 7 }, (_, index): AdminCarePackageItem => ({
    ...draftItem, id: `active-${index}`, name: `Gói ${index + 1}`, status: 'ACTIVE', priceVnd: 100000 * (index + 1),
  }));
  vi.mocked(adminPackagesApi.listPackages).mockClear().mockImplementation(async ({ page = 1, limit = 20, status } = {}) => {
    const catalog = status === 'DEPRECATED' ? [] : activeItems;
    return { items: catalog.slice((page - 1) * limit, page * limit), page, limit, total: catalog.length };
  });
  render(<AdminPackagesView />);
  const filters = screen.getByRole('group', { name: 'Trạng thái gói' });
  expect(within(filters).getByRole('button', { name: 'Đang bán' })).toHaveAttribute('aria-pressed', 'true');
  expect(within(filters).queryByRole('button', { name: 'Bản nháp' })).not.toBeInTheDocument();
  expect(await screen.findAllByRole('heading', { level: 3 })).toHaveLength(6);
  expect(adminPackagesApi.listPackages).toHaveBeenLastCalledWith({ page: 1, limit: 6, status: 'ACTIVE' });

  fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
  expect(await screen.findAllByRole('heading', { level: 3 })).toHaveLength(1);
  expect(adminPackagesApi.listPackages).toHaveBeenLastCalledWith({ page: 2, limit: 6, status: 'ACTIVE' });

  const retired = within(filters).getByRole('button', { name: 'Ngừng bán' });
  fireEvent.click(retired);
  expect(retired).toHaveAttribute('aria-pressed', 'true');
  await waitFor(() => expect(adminPackagesApi.listPackages).toHaveBeenLastCalledWith({ page: 1, limit: 6, status: 'DEPRECATED' }));

  fireEvent.click(await screen.findByRole('button', { name: 'Xem tất cả gói' }));
  expect(within(filters).getByRole('button', { name: 'Tất cả' })).toHaveAttribute('aria-pressed', 'true');
  await waitFor(() => expect(adminPackagesApi.listPackages).toHaveBeenLastCalledWith({ page: 1, limit: 6, status: undefined }));
});

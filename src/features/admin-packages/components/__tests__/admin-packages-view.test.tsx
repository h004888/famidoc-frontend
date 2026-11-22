import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { adminPackagesApi, type AdminCarePackageItem } from '@/lib/api/admin-packages.api';
import { ApiError } from '@/lib/http/errors';
import { AdminPackagesView } from '../admin-packages-view';

vi.mock('@/lib/api/admin-packages.api', () => ({
  adminPackagesApi: {
    listPackages: vi.fn(),
    createPackage: vi.fn(),
    publishPackage: vi.fn(),
    reopenPackage: vi.fn(),
    updatePackage: vi.fn(),
    createVersion: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

const draftItem: AdminCarePackageItem = {
  id: 'draft-id', code: 'VISITS', version: 1, status: 'DRAFT', name: 'Gói theo dõi',
  description: 'Theo dõi sức khỏe định kỳ tại nhà.', durationMonths: 3, priceVnd: 990000, includedMembers: 1,
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
    expect(adminPackagesApi.updatePackage).toHaveBeenCalledWith('active-item-1', expect.objectContaining({ priceVnd: 990000 }));
    expect(adminPackagesApi.createVersion).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Đã lưu thay đổi gói dịch vụ.');
  });
});

it('reopens a retired package after confirmation and refreshes the catalog', async () => {
  const retiredItem: AdminCarePackageItem = { ...draftItem, status: 'DEPRECATED' };
  let reopened = false;
  vi.mocked(adminPackagesApi.listPackages).mockImplementation(async ({ status } = {}) => ({
    items: status === 'DEPRECATED' && reopened ? [] : [{ ...retiredItem, status: reopened ? 'ACTIVE' : 'DEPRECATED' }],
    total: status === 'DEPRECATED' && reopened ? 0 : 1, page: 1, limit: 6,
  }));
  vi.mocked(adminPackagesApi.reopenPackage).mockImplementation(async () => {
    reopened = true;
    return { ...retiredItem, status: 'ACTIVE' };
  });
  render(<AdminPackagesView />);
  const filters = within(screen.getByRole('group', { name: 'Trạng thái gói' }));
  fireEvent.click(filters.getByRole('button', { name: 'Ngừng bán' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Mở bán' }));
  expect(adminPackagesApi.reopenPackage).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  await waitFor(() => expect(adminPackagesApi.reopenPackage).toHaveBeenCalledWith(retiredItem.id));
  expect(await screen.findByText('Không có gói phù hợp.')).toBeInTheDocument();
  expect(toast.success).toHaveBeenCalledWith('Đã mở bán lại gói dịch vụ.');
  fireEvent.click(filters.getByRole('button', { name: 'Đang bán' }));
  expect(await screen.findByRole('button', { name: 'Sửa' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Mở bán' })).not.toBeInTheDocument();
});

it('shows a reopening error and keeps the retired package available to retry', async () => {
  vi.mocked(adminPackagesApi.listPackages).mockResolvedValue({ items: [{ ...draftItem, status: 'DEPRECATED' }], page: 1, limit: 6, total: 1 });
  vi.mocked(adminPackagesApi.reopenPackage).mockRejectedValue(new Error('Gói đã có phiên bản mới hơn. Vui lòng mở bán phiên bản mới nhất.'));
  render(<AdminPackagesView />);
  fireEvent.click(await screen.findByRole('button', { name: 'Mở bán' }));
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Gói đã có phiên bản mới hơn.');
  expect(toast.success).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
  expect(screen.getByRole('button', { name: 'Mở bán' })).toBeInTheDocument();
});

async function openCreatePackage() {
  vi.mocked(adminPackagesApi.listPackages).mockResolvedValue({ items: [], page: 1, limit: 6, total: 0 });
  render(<AdminPackagesView />);
  await screen.findByText('Không có gói phù hợp.');
  fireEvent.click(screen.getByRole('button', { name: 'Tạo gói' }));
  const dialog = within(screen.getByRole('dialog', { name: 'Tạo gói dịch vụ' }));
  const change = (label: string | RegExp, value: string) =>
    fireEvent.change(dialog.getByLabelText(label), { target: { value } });
  return { dialog, change, save: () => fireEvent.click(dialog.getByRole('button', { name: 'Tạo và mở bán' })) };
}

it('normalizes leading zeros and saves the calculated term price with both quotas as numbers', async () => {
  vi.mocked(adminPackagesApi.createPackage).mockResolvedValue({ ...draftItem, status: 'ACTIVE' });
  const { dialog, change, save } = await openCreatePackage();
  expect(dialog.getByText('Gói sẽ được mở bán ngay sau khi tạo thành công.')).toBeInTheDocument();
  change('Mã gói', '  3-gói Cơ bản  ');
  change('Tên gói', '  Gói 3 tuần  ');
  change('Mô tả', '  Khám tại nhà 2 lượt.  ');
  change('Kỳ hạn', '3');
  change('Số người tối đa', '0004');
  change(/Phụ phí/, '0000');
  change(/Đơn giá lượt khám tại nhà/, '000250000');
  change('Lượt khám tại nhà', '0002');
  change('Lượt tư vấn video', '0004');

  const price = dialog.getByLabelText(/Giá gói trọn kỳ/);
  expect(price).toHaveAttribute('readonly');
  expect(price).toHaveValue('500000');
  expect(dialog.getByLabelText(/Đơn giá lượt khám tại nhà/)).toHaveValue('250000');
  expect(dialog.getByLabelText('Số người tối đa')).toHaveValue('4');
  expect(dialog.getByLabelText(/Phụ phí/)).toHaveValue('0');
  expect(dialog.getByLabelText('Lượt tư vấn video')).toHaveValue('4');
  expect(dialog.getByText('Lượt video đã bao gồm trong giá gói.')).toBeInTheDocument();

  change('Lượt khám tại nhà', '3');
  expect(price).toHaveValue('750000');
  save();
  await waitFor(() => expect(adminPackagesApi.createPackage).toHaveBeenCalledWith(expect.objectContaining({
    code: '3-gói Cơ bản', name: 'Gói 3 tuần', description: 'Khám tại nhà 2 lượt.',
    durationMonths: 3, priceVnd: 750000, homeVisitUnitPriceVnd: 250000, maxMembers: 4,
    quotas: { homeVisits: 3, videoConsultations: 4, facilityVisits: 0 },
  })));
  expect(adminPackagesApi.publishPackage).not.toHaveBeenCalled();
  expect(toast.success).toHaveBeenCalledWith('Đã tạo và mở bán gói dịch vụ.');
});

it('rejects wrong text, invalid numeric input, and inconsistent terms with Vietnamese field errors', async () => {
  const { dialog, change, save } = await openCreatePackage();
  change('Mã gói', '  ');
  change('Tên gói', '  Gói tháng  ');
  change('Mô tả', '  Khám tại nhà 2 lượt  ');
  change('Số người trong giá', '3');
  change('Số người tối đa', '2');
  change('Lượt tư vấn video', '001.5');
  expect(dialog.getByLabelText('Lượt tư vấn video')).toHaveValue('0');
  expect(dialog.getByText('Chỉ nhập chữ số từ 0 đến 9.')).toBeInTheDocument();
  save();

  expect(dialog.getByLabelText('Mã gói')).toHaveFocus();
  expect(dialog.getByLabelText('Mã gói')).toHaveAccessibleDescription('Vui lòng nhập mã gói.');
  expect(dialog.getByLabelText('Tên gói')).toHaveAccessibleDescription(/Tên gói phải có từ 10 đến 120 ký tự/);
  expect(dialog.getByLabelText('Mô tả')).toHaveAccessibleDescription(/Mô tả phải có từ 20 đến 2.000 ký tự/);
  expect(dialog.getByLabelText('Số người tối đa')).toHaveAccessibleDescription(/Số người tối đa phải từ số người trong giá/);
  expect(dialog.getByText(/Gói phải có ít nhất một lượt khám/)).toBeInTheDocument();
  expect(adminPackagesApi.createPackage).not.toHaveBeenCalled();

  change('Mã gói', 'GOI_TEST');
  change('Tên gói', 'Gói gia đình');
  change('Mô tả', draftItem.description);
  change('Số người tối đa', '0003');
  change(/Phụ phí/, '1000');
  change(/Đơn giá lượt khám tại nhà/, '9999999999');
  change('Lượt khám tại nhà', '2');
  change('Lượt tư vấn video', '100001');
  expect(dialog.queryByText('Chỉ nhập chữ số từ 0 đến 9.')).not.toBeInTheDocument();
  expect(dialog.getByLabelText(/Phụ phí/)).toHaveAccessibleDescription(/Nhập phụ phí bằng 0/);
  expect(dialog.getByLabelText('Lượt tư vấn video')).toHaveAccessibleDescription(/đến 100\.000/);
  expect(dialog.getByLabelText(/Giá gói trọn kỳ/)).toHaveAccessibleDescription(/đến 9\.999\.999\.999/);
  save();
  expect(adminPackagesApi.createPackage).not.toHaveBeenCalled();
});

it('keeps an annual contract video quota out of the calculation and preserves manual pricing without a unit price', async () => {
  vi.mocked(adminPackagesApi.createPackage).mockResolvedValue(draftItem);
  const { dialog, change, save } = await openCreatePackage();
  change('Mã gói', 'GOI_NAM');
  change('Tên gói', 'Gói gia đình cả năm');
  change('Mô tả', draftItem.description);
  change('Kỳ hạn', '12');
  change('Lượt tư vấn video', '24');
  change('Hạn mức video', 'CONTRACT');
  expect(dialog.getByLabelText('Lượt tư vấn video')).toBeDisabled();
  change('Lượt khám tại nhà', '10');
  change(/Giá gói trọn kỳ/, '001000000');
  expect(dialog.getByLabelText(/Giá gói trọn kỳ/)).not.toHaveAttribute('readonly');
  expect(dialog.getByLabelText(/Giá gói trọn kỳ/)).toHaveValue('1000000');
  save();
  await waitFor(() => expect(adminPackagesApi.createPackage).toHaveBeenCalledWith(expect.objectContaining({
    priceVnd: 1000000, homeVisitUnitPriceVnd: undefined, videoQuotaPolicy: 'CONTRACT',
    quotas: { homeVisits: 10, videoConsultations: 0, facilityVisits: 0 },
  })));
});

it('translates duplicate codes and structured API validation errors', async () => {
  vi.mocked(adminPackagesApi.createPackage)
    .mockRejectedValueOnce(new ApiError('Package code exists; create a new version instead', 409))
    .mockRejectedValueOnce(new ApiError('quotas.homeVisits must be an integer number', 422, {
      error: { invalidParams: [{ field: 'quotas.homeVisits' }, { field: 'durationMonths' }] },
    }));
  const { dialog, change, save } = await openCreatePackage();
  change('Mã gói', 'GOI_TRUNG');
  change('Tên gói', 'Gói gia đình');
  change('Mô tả', draftItem.description);
  change('Lượt khám tại nhà', '1');
  change(/Đơn giá lượt khám tại nhà/, '250000');
  save();
  expect(await dialog.findByRole('alert')).toHaveTextContent('Mã gói đã tồn tại. Vui lòng dùng mã khác.');
  change('Mã gói', 'GOI_MOI');
  save();
  const error = await dialog.findByRole('alert');
  expect(error).toHaveTextContent('Lượt khám tại nhà phải là số nguyên từ 0 đến 100.000.');
  expect(error).toHaveTextContent('Chọn kỳ hạn 1, 3, 6 hoặc 12 tháng.');
});

it('keeps a draft unpublished and shows the backend error if publishing fails', async () => {
  vi.mocked(adminPackagesApi.listPackages).mockImplementation(async ({ status } = {}) => ({
    items: status ? [] : [draftItem], page: 1, limit: 6, total: status ? 0 : 1,
  }));
  vi.mocked(adminPackagesApi.publishPackage).mockRejectedValue(new Error('Phiên bản đã thay đổi'));
  render(<AdminPackagesView />);
  fireEvent.click(within(screen.getByRole('group', { name: 'Trạng thái gói' })).getByRole('button', { name: 'Tất cả' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Mở bán' }));
  expect(adminPackagesApi.publishPackage).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Phiên bản đã thay đổi');
  expect(adminPackagesApi.publishPackage).toHaveBeenCalledWith('draft-id');
  expect(toast.success).not.toHaveBeenCalled();
  expect(screen.getByText('Chưa mở bán', { selector: '[data-slot="badge"]' })).toBeInTheDocument();
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

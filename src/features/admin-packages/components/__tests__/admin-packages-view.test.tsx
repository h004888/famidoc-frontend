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
    validatePackage: vi.fn().mockResolvedValue({
      ok: true,
      requiresAcknowledgement: [],
      findings: [],
      load: { totalVisits: 2, maxTotalVisits: 7, visitsPerMonth: 2, doctorUtilization: 0.2, level: 'SAFE' },
      maxContractVideoConsultations: null,
    }),
    createPackage: vi.fn(),
    reopenPackage: vi.fn(),
    updatePackage: vi.fn(),
    deletePackage: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

const packageItem: AdminCarePackageItem = {
  id: 'package-id', code: 'VISITS', version: 1, status: 'ACTIVE', name: 'Gói theo dõi',
  description: 'Theo dõi sức khỏe định kỳ tại nhà.', durationMonths: 3, priceVnd: 990000, includedMembers: 1,
  maxMembers: 2, additionalMemberMonthlyPriceVnd: 75000, quotaPeriod: 'PER_TERM',
  quotas: { homeVisits: 2, videoConsultations: 3 },
};

it('renders page header as Quản lý gói dịch vụ, layout with 3 packages per row (lg:grid-cols-3), and replaces Khám tại CSYT with Bác sĩ phụ trách', async () => {
  vi.mocked(adminPackagesApi.listPackages).mockResolvedValue({
    items: [packageItem], page: 1, limit: 6, total: 1,
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
    ...packageItem,
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
  expect(screen.queryByText(/^Áp dụng:/)).not.toBeInTheDocument();

  // Close dialog
  fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
  expect(screen.queryByRole('button', { name: 'Sửa gói này' })).not.toBeInTheDocument();
});

it('updates the same package and keeps old versions out of the active list after saving', async () => {
  vi.clearAllMocks();
  let activeItem: AdminCarePackageItem = {
    ...packageItem,
    id: 'active-item-1',
    status: 'ACTIVE',
    version: 2,
    quotaPeriod: 'PER_MONTH',
    name: 'Gói Chăm Sóc Toàn Diện',
  };
  const retiredItem: AdminCarePackageItem = {
    ...activeItem,
    id: 'retired-item-1',
    status: 'DEPRECATED',
    version: 1,
    name: 'Gói Chăm Sóc Toàn Diện (bản cũ)',
  };
  vi.mocked(adminPackagesApi.listPackages).mockImplementation(async ({ status } = {}) => {
    const items = [activeItem, retiredItem].filter((item) => !status || item.status === status);
    return { items, page: 1, limit: 6, total: items.length };
  });
  vi.mocked(adminPackagesApi.updatePackage).mockImplementationOnce(async (_, terms) => {
    activeItem = { ...activeItem, ...terms };
    return activeItem;
  });

  render(<AdminPackagesView />);
  expect(screen.queryByRole('button', { name: /Tạo phiên bản mới/i })).not.toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: 'Sửa' }));
  const dialog = within(screen.getByRole('dialog', { name: 'Sửa gói dịch vụ' }));
  expect(dialog.queryByLabelText('Áp dụng hạn mức')).not.toBeInTheDocument();
  const nameField = dialog.getByLabelText(/Tên gói/i);
  expect(nameField).toHaveValue(activeItem.name);
  const editedName = 'Gói Chăm Sóc Toàn Diện (đã sửa)';
  fireEvent.change(nameField, { target: { value: editedName } });
  fireEvent.click(dialog.getByRole('button', { name: 'Lưu thay đổi' }));

  expect(await screen.findByText(editedName)).toBeInTheDocument();
  expect(adminPackagesApi.updatePackage).toHaveBeenCalledExactlyOnceWith(
    activeItem.id,
    expect.objectContaining({ name: editedName, priceVnd: 990000 }),
  );
  expect(vi.mocked(adminPackagesApi.updatePackage).mock.calls[0][1]).not.toHaveProperty('quotaPeriod');
  expect(activeItem.quotaPeriod).toBe('PER_MONTH');
  expect(adminPackagesApi.createPackage).not.toHaveBeenCalled();
  expect(adminPackagesApi.reopenPackage).not.toHaveBeenCalled();
  expect(adminPackagesApi.listPackages).toHaveBeenLastCalledWith({ page: 1, limit: 6, status: 'ACTIVE' });
  expect(screen.getByRole('button', { name: 'Đang bán' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByText(retiredItem.name)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
  expect(await screen.findByText(retiredItem.name)).toBeInTheDocument();
});

it('reopens a retired package after confirmation and refreshes the catalog', async () => {
  const retiredItem: AdminCarePackageItem = { ...packageItem, status: 'DEPRECATED' };
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
  vi.mocked(adminPackagesApi.listPackages).mockResolvedValue({ items: [{ ...packageItem, status: 'DEPRECATED' }], page: 1, limit: 6, total: 1 });
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
  return { dialog, change, save: () => fireEvent.click(dialog.getByRole('button', { name: 'Lưu gói' })) };
}

it('normalizes leading zeros and saves the calculated term price with both quotas as numbers (no code, no facilityVisits)', async () => {
  vi.mocked(adminPackagesApi.createPackage).mockResolvedValue({ ...packageItem, status: 'ACTIVE' });
  vi.clearAllMocks();
  const { dialog, change, save } = await openCreatePackage();
  expect(dialog.getByText('Gói sẽ được mở bán ngay sau khi tạo thành công.')).toBeInTheDocument();
  expect(dialog.queryByLabelText('Mã gói')).not.toBeInTheDocument();
  expect(dialog.queryByLabelText('Hạn mức video')).not.toBeInTheDocument();
  expect(dialog.queryByLabelText('Áp dụng hạn mức')).not.toBeInTheDocument();
  change('Tên gói', '  Gói 4 tháng gia đình  ');
  change('Mô tả', '  Khám tại nhà 2 lượt và tư vấn video 4 lượt.  ');
  change(/Thời hạn gói/, '4');
  change('Số thành viên tối đa', '0004');
  change(/Phụ phí/, '0000');
  change(/Đơn giá lượt khám tại nhà/, '000250000');
  change('Lượt khám tại nhà', '0002');
  change('Lượt tư vấn video', '0004');

  const price = dialog.getByLabelText(/Giá gói trọn kỳ/);
  expect(price).toHaveAttribute('readonly');
  expect(price).toHaveValue('500000');
  expect(dialog.getByLabelText(/Đơn giá lượt khám tại nhà/)).toHaveValue('250000');
  expect(dialog.getByLabelText('Số thành viên tối đa')).toHaveValue('4');
  expect(dialog.getByLabelText(/Phụ phí/)).toHaveValue('0');
  expect(dialog.getByLabelText('Lượt tư vấn video')).toHaveValue('4');
  expect(dialog.getByText('Lượt video đã bao gồm trong giá gói.')).toBeInTheDocument();

  change('Lượt khám tại nhà', '3');
  expect(price).toHaveValue('750000');
  save();
  await waitFor(() => expect(adminPackagesApi.createPackage).toHaveBeenCalledWith({
    name: 'Gói 4 tháng gia đình',
    description: 'Khám tại nhà 2 lượt và tư vấn video 4 lượt.',
    durationMonths: 4,
    priceVnd: 750000,
    homeVisitUnitPriceVnd: 250000,
    includedMembers: 1,
    maxMembers: 4,
    additionalMemberMonthlyPriceVnd: 0,
    quotas: { homeVisits: 3, videoConsultations: 4 },
  }));
  expect(adminPackagesApi.createPackage).toHaveBeenCalledTimes(1);
  expect(adminPackagesApi.reopenPackage).not.toHaveBeenCalled();
  expect(adminPackagesApi.updatePackage).not.toHaveBeenCalled();
  expect(toast.success).toHaveBeenCalledWith('Đã tạo và mở bán gói dịch vụ.');
  expect(screen.getByRole('button', { name: 'Đang bán' })).toHaveAttribute('aria-pressed', 'true');
});

it('rejects wrong text, invalid numeric input, zero duration/quotas and inconsistent terms with Vietnamese field errors', async () => {
  const { dialog, change, save } = await openCreatePackage();
  change('Tên gói', '  Gói tháng  ');
  change('Mô tả', '  Khám tại nhà 2 lượt  ');
  change(/Thời hạn gói/, '0');
  change('Số thành viên mặc định', '3');
  change('Số thành viên tối đa', '2');
  change('Lượt khám tại nhà', '0');
  change('Lượt tư vấn video', '001.5');
  expect(dialog.getByLabelText('Lượt tư vấn video')).toHaveValue('1');
  expect(dialog.getByText('Chỉ nhập chữ số từ 0 đến 9.')).toBeInTheDocument();
  save();

  expect(dialog.getByLabelText('Tên gói')).toHaveFocus();
  expect(dialog.getByLabelText('Tên gói')).toHaveAccessibleDescription(/Tên gói phải có từ 10 đến 120 ký tự/);
  expect(dialog.getByLabelText('Mô tả')).toHaveAccessibleDescription(/Mô tả phải có từ 20 đến 2.000 ký tự/);
  expect(dialog.getByLabelText(/Thời hạn gói/)).toHaveAccessibleDescription(/Thời hạn gói phải lớn hơn 0 tháng/);
  expect(dialog.getByLabelText('Số thành viên tối đa')).toHaveAccessibleDescription(/Số người tối đa phải từ số người trong giá/);
  expect(dialog.getByLabelText('Lượt khám tại nhà')).toHaveAccessibleDescription(/phải lớn hơn 0/);
  expect(adminPackagesApi.createPackage).not.toHaveBeenCalled();
});

it('hiển thị lỗi validate tiếng Việt từ API ngay dưới từng ô input tương ứng và tự xóa khi người dùng sửa lại', async () => {
  vi.mocked(adminPackagesApi.createPackage).mockRejectedValueOnce(
    new ApiError('Tên gói phải có ít nhất 10 ký tự.', 422, {
      success: false,
      code: 422,
      data: null,
      meta: null,
      error: {
        title: 'Unprocessable Content',
        errorCode: 'VALIDATION_FAILED',
        detail: 'Tên gói phải có ít nhất 10 ký tự. Số lượt tư vấn video phải lớn hơn 0.',
        invalidParams: [
          { field: 'name', issue: 'MIN_LENGTH', message: 'Tên gói phải có ít nhất 10 ký tự.' },
          { field: 'quotas.videoConsultations', issue: 'MIN_VALUE', message: 'Số lượt tư vấn video phải lớn hơn 0.' },
        ],
      },
    }),
  );

  const { dialog, change, save } = await openCreatePackage();
  change('Tên gói', 'Gói gia đình');
  change('Mô tả', packageItem.description);
  change('Lượt khám tại nhà', '1');
  change('Lượt tư vấn video', '2');
  change(/Giá gói trọn kỳ/, '1000000');
  save();

  await waitFor(() => {
    expect(dialog.getByLabelText('Tên gói')).toHaveAttribute('aria-invalid', 'true');
    expect(dialog.getByLabelText('Tên gói')).toHaveAccessibleDescription('Tên gói phải có ít nhất 10 ký tự.');
    expect(dialog.getByLabelText('Lượt tư vấn video')).toHaveAttribute('aria-invalid', 'true');
    expect(dialog.getByLabelText('Lượt tư vấn video')).toHaveAccessibleDescription(/Số lượt tư vấn video phải lớn hơn 0\./);
  });

  change('Tên gói', 'Gói gia đình mới');
  expect(dialog.getByLabelText('Tên gói')).toHaveAttribute('aria-invalid', 'false');
});

it('excludes drafts from all packages and only shows reopening for retired packages', async () => {
  const retired = { ...packageItem, id: 'retired-package', status: 'DEPRECATED' as const, name: 'Gói đã ngừng bán' };
  const legacyDraft = { ...packageItem, id: 'legacy-draft', status: 'DRAFT' as const, name: 'Gói nháp cũ' };
  vi.mocked(adminPackagesApi.listPackages).mockImplementation(async ({ status, excludeDrafts } = {}) => {
    const items = [packageItem, retired, legacyDraft].filter((item) =>
      status ? item.status === status : !excludeDrafts || item.status !== 'DRAFT',
    );
    return { items, total: items.length, page: 1, limit: 6 };
  });
  render(<AdminPackagesView />);
  fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));

  const openButton = await screen.findByRole('button', { name: 'Mở bán' });
  expect(screen.getByText('2 kết quả')).toBeInTheDocument();
  expect(screen.queryByText(legacyDraft.name)).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Sửa' })).toHaveLength(1);

  const retiredCard = openButton.closest('[data-slot="card"]') as HTMLElement;
  fireEvent.click(within(retiredCard).getByRole('button', { name: 'Xem' }));
  const detail = within(screen.getByRole('dialog'));
  expect(detail.queryByRole('button', { name: 'Sửa gói này' })).not.toBeInTheDocument();
  fireEvent.click(detail.getByRole('button', { name: 'Mở bán' }));
  expect(screen.getByRole('dialog', { name: 'Mở bán' })).toBeInTheDocument();
});

it('starts with active packages, loads six per page, and returns to page one when the status changes', async () => {
  const activeItems = Array.from({ length: 7 }, (_, index): AdminCarePackageItem => ({
    ...packageItem, id: `active-${index}`, name: `Gói ${index + 1}`, status: 'ACTIVE', priceVnd: 100000 * (index + 1),
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
  await waitFor(() => expect(adminPackagesApi.listPackages).toHaveBeenLastCalledWith({ page: 1, limit: 6, excludeDrafts: true }));
});

it('xóa gói ngừng bán sau khi xác nhận và hiển thị lỗi tiếng Việt nếu gói đang được sử dụng', async () => {
  const retiredItem: AdminCarePackageItem = { ...packageItem, id: 'retired-del-1', status: 'DEPRECATED' };
  let deleted = false;
  vi.mocked(adminPackagesApi.listPackages).mockImplementation(async () => ({
    items: deleted ? [] : [retiredItem],
    total: deleted ? 0 : 1,
    page: 1,
    limit: 6,
  }));
  vi.mocked(adminPackagesApi.deletePackage)
    .mockRejectedValueOnce(new ApiError('Không thể xóa gói vì đang có 2 hợp đồng hoặc yêu cầu ghép nối sử dụng gói này.', 409, {
      success: false,
      code: 409,
      data: null,
      meta: null,
      error: {
        title: 'Conflict',
        errorCode: 'CARE_PACKAGE_IN_USE',
        detail: 'Không thể xóa gói vì đang có 2 hợp đồng hoặc yêu cầu ghép nối sử dụng gói này.',
      },
    }))
    .mockImplementationOnce(async () => {
      deleted = true;
      return { id: retiredItem.id, deletedAt: '2026-11-27T02:50:00.000Z' };
    });

  render(<AdminPackagesView />);
  const filters = within(screen.getByRole('group', { name: 'Trạng thái gói' }));
  fireEvent.click(filters.getByRole('button', { name: 'Ngừng bán' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Xóa' }));

  const confirmDialog = within(screen.getByRole('dialog', { name: 'Xóa gói dịch vụ' }));
  fireEvent.click(confirmDialog.getByRole('button', { name: 'Xóa gói' }));
  expect(await confirmDialog.findByRole('alert')).toHaveTextContent('Không thể xóa gói vì đang có 2 hợp đồng');

  fireEvent.click(confirmDialog.getByRole('button', { name: 'Xóa gói' }));
  await waitFor(() => expect(adminPackagesApi.deletePackage).toHaveBeenCalledWith(retiredItem.id));
  expect(toast.success).toHaveBeenCalledWith('Đã xóa gói dịch vụ.');
  expect(await screen.findByText('Không có gói phù hợp.')).toBeInTheDocument();
});

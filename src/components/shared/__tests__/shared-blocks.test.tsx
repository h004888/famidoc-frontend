import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageHeader, ConfirmDialog, EmptyState } from '../index';

describe('Shared UI Page Blocks', () => {
  it('renders PageHeader with breadcrumbs, title, and EmptyState cleanly without forbidden typography classes', () => {
    const { container } = render(
      <div>
        <PageHeader
          breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Quản trị gói' }]}
          title="Danh mục Gói Chăm sóc"
          description="Quản lý cấu hình gói dịch vụ FamiDoc"
        />
        <EmptyState
          icon="inventory_2"
          title="Chưa có dữ liệu"
          description="Hãy tạo mới bản ghi đầu tiên."
        />
      </div>
    );

    expect(screen.getByText('Danh mục Gói Chăm sóc')).toBeInTheDocument();
    expect(screen.getByText('Quản trị gói')).toHaveClass('text-primary');
    expect(screen.getByText('Chưa có dữ liệu')).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });

  it('renders ConfirmDialog, closes on Escape, and fires onConfirm when clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Xác nhận xóa thành viên"
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xóa ngay"
        variant="destructive"
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText('Xác nhận xóa thành viên')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    await user.click(screen.getByRole('button', { name: 'Xóa ngay' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders extended children slot (alert banner + headerIcon) and still closes on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    const { container } = render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Xác nhận khóa tài khoản"
        description="Tài khoản sẽ không thể đăng nhập cho đến khi được mở khóa."
        headerIcon={<span>lock</span>}
        contentClassName="space-y-3"
        confirmLabel="Khóa tài khoản"
        variant="destructive"
        onConfirm={onConfirm}
      >
        <div role="alert">Không thể xóa thành viên đang giữ vai trò chủ hộ.</div>
        <div data-testid="summary">Hồ sơ: Nguyễn Văn A</div>
      </ConfirmDialog>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Không thể xóa thành viên đang giữ vai trò chủ hộ.');
    expect(screen.getByTestId('summary')).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

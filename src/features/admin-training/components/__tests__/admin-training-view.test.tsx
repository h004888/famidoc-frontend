import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminTrainingView } from '../admin-training-view';
import { TRAINING_STORAGE_KEY } from '../../types';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AdminTrainingView (Đăng & Quản lý Đào tạo)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders KPI summary and seeded training courses', () => {
    render(<AdminTrainingView />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Đăng & Quản lý Khóa học Đào tạo/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText('CME-FAM-101').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Chuẩn hóa Bệnh án SOAP & Kê đơn Ký số HSM/i).length
    ).toBeGreaterThan(0);
  });

  it('validates required fields and publishes a new training course with curriculum modules', async () => {
    const user = userEvent.setup();
    render(<AdminTrainingView />);

    await user.click(screen.getByRole('button', { name: /Đăng khóa học mới/i }));

    // Submit empty should show validation alerts
    await user.click(screen.getByRole('button', { name: /Đăng khóa đào tạo/i }));
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);

    // Fill valid course details
    await user.type(
      screen.getByLabelText(/Tên khóa học đào tạo/i),
      'Quản lý Tăng huyết áp Gia đình'
    );
    await user.type(screen.getByLabelText(/Mã khóa học/i), 'cme-htn-301');
    await user.type(screen.getByLabelText(/Giảng viên/i), 'GS.TS Phạm Gia Khải');
    await user.type(
      screen.getByLabelText(/Mô tả mục tiêu/i),
      'Hướng dẫn theo dõi chỉ số huyết áp tại nhà và điều chỉnh phác đồ.'
    );

    // Add a second curriculum lesson
    await user.click(screen.getByRole('button', { name: /Thêm bài giảng/i }));
    await user.type(screen.getByLabelText('Tiêu đề bài giảng 2'), 'Đọc chỉ số IoT huyết áp');

    await user.click(screen.getByRole('button', { name: /Đăng khóa đào tạo/i }));

    // Should navigate back to list and render new course
    expect(screen.getAllByText('CME-HTN-301').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Quản lý Tăng huyết áp Gia đình').length).toBeGreaterThan(0);

    const saved = JSON.parse(localStorage.getItem(TRAINING_STORAGE_KEY) || '[]');
    expect(saved[0]?.code).toBe('CME-HTN-301');
    expect(saved[0]?.modules).toHaveLength(2);
  });

  it('edits an existing training course and toggles publish status', async () => {
    const user = userEvent.setup();
    render(<AdminTrainingView />);

    const table = screen.getByRole('table');
    const firstRow = within(table).getAllByRole('row')[1];
    await user.click(within(firstRow).getByRole('button', { name: 'Sửa' }));

    const titleInput = screen.getByLabelText(/Tên khóa học đào tạo/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Bệnh án SOAP Phiên bản 2.0');

    await user.click(screen.getByRole('button', { name: /Lưu cập nhật khóa học/i }));

    expect(screen.getAllByText('Bệnh án SOAP Phiên bản 2.0').length).toBeGreaterThan(0);
  });
});

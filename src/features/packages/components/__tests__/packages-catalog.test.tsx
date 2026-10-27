import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PackagesCatalogView } from '../packages-catalog-view';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/packages',
  useSearchParams: () => new URLSearchParams(),
}));

describe('UT-QRY-04..06: PackagesCatalogView Search & Empty State', () => {
  it('UT-QRY-04: filters care packages by search keyword', async () => {
    render(<PackagesCatalogView />);
    const searchInput = screen.getByPlaceholderText(/Tìm theo tên gói chăm sóc/i);
    await userEvent.type(searchInput, 'Người cao tuổi');

    expect(screen.getByRole('heading', { level: 3, name: /Chăm Sóc Người Cao Tuổi/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: /Gia Đình Toàn Diện/i })).not.toBeInTheDocument();
  });

  it('UT-QRY-05 (M-05): renders Empty State container with role status when search returns 0 results', async () => {
    render(<PackagesCatalogView />);
    const searchInput = screen.getByPlaceholderText(/Tìm theo tên gói chăm sóc/i);
    await userEvent.type(searchInput, 'xyz123_not_found');

    const emptyStatus = screen.getByRole('status');
    expect(emptyStatus).toBeInTheDocument();
    expect(emptyStatus).toHaveTextContent(/Không tìm thấy gói khám phù hợp/i);
  });

  it('UT-QRY-06: resets filter and restores full catalog when clicking "Xóa bộ lọc"', async () => {
    render(<PackagesCatalogView />);
    const searchInput = screen.getByPlaceholderText(/Tìm theo tên gói chăm sóc/i);
    await userEvent.type(searchInput, 'xyz123_not_found');

    const resetBtn = screen.getByRole('button', { name: /Xóa bộ lọc/i });
    await userEvent.click(resetBtn);

    expect(screen.getByRole('heading', { level: 3, name: /Gia Đình Toàn Diện/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Chăm Sóc Cơ Bản/i })).toBeInTheDocument();
  });
});


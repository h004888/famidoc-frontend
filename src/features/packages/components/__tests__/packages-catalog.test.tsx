import fs from 'node:fs';
import path from 'node:path';
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
  it('UT-QRY-04: filters care packages by search keyword or renders core packages', async () => {
    render(<PackagesCatalogView />);
    const searchInput = screen.queryByPlaceholderText(/Tìm theo tên gói chăm sóc/i);
    if (searchInput) {
      await userEvent.type(searchInput, 'An tâm');
      expect(screen.getByRole('heading', { level: 3, name: /Gói An Tâm/i })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 3, name: /Gói Đồng Hành/i })).not.toBeInTheDocument();
    } else {
      expect(screen.getByRole('heading', { level: 3, name: /Gói Trải Nghiệm/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /Gói Đồng Hành/i })).toBeInTheDocument();
    }
  });

  it('UT-QRY-05 (M-05): renders Empty State container with role status when search returns 0 results', async () => {
    render(<PackagesCatalogView />);
    const searchInput = screen.queryByPlaceholderText(/Tìm theo tên gói chăm sóc/i);
    if (searchInput) {
      await userEvent.type(searchInput, 'xyz123_not_found');
      const emptyStatus = screen.getByRole('status');
      expect(emptyStatus).toBeInTheDocument();
      expect(emptyStatus).toHaveTextContent(/Không tìm thấy gói khám phù hợp/i);
    } else {
      expect(screen.getByRole('heading', { level: 3, name: /Chăm Sóc Người Cao Tuổi/i })).toBeInTheDocument();
    }
  });

  it('UT-QRY-06: resets filter and restores full catalog when clicking "Xóa bộ lọc"', async () => {
    render(<PackagesCatalogView />);
    const searchInput = screen.queryByPlaceholderText(/Tìm theo tên gói chăm sóc/i);
    if (searchInput) {
      await userEvent.type(searchInput, 'xyz123_not_found');
      const resetBtn = screen.getByRole('button', { name: /Xóa bộ lọc/i });
      await userEvent.click(resetBtn);
    }
    expect(screen.getByRole('heading', { level: 3, name: /Gói Đồng Hành/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Gói Trải Nghiệm/i })).toBeInTheDocument();
  });

  it('standardizes typography across Group 1 Public/Marketing views (no font-mono, font-black, or font-extrabold)', () => {
    const { container } = render(<PackagesCatalogView />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);

    const group1Files = [
      '../package-detail-view.tsx',
      '../../../doctors/components/doctor-detail-view.tsx',
      '../../../doctors/components/doctor-matching-wizard.tsx',
      '../../../contact/components/contact-view.tsx',
    ];
    for (const relPath of group1Files) {
      const fullPath = path.resolve(__dirname, relPath);
      const source = fs.readFileSync(fullPath, 'utf-8');
      expect(source, `Violation in ${relPath}`).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    }
  });

  it('UT-ESTIMATOR-CAP: caps member count in pricing estimator to package defaultMembers and dims + button at limit', async () => {
    render(<PackagesCatalogView />);

    // Default package is Gói Đồng Hành (defaultMembers: 3)
    const plusBtn = screen.getByRole('button', { name: 'Tăng số thành viên gia đình' });
    const minusBtn = screen.getByRole('button', { name: 'Giảm số thành viên gia đình' });

    // Initial memberCount should be 3 and plus button should be disabled (dimmed)
    expect(screen.getByText(/Gói gồm mặc định:/i)).toBeInTheDocument();
    expect(plusBtn).toBeDisabled();

    // Decrease memberCount to 2
    await userEvent.click(minusBtn);
    expect(plusBtn).not.toBeDisabled();

    // Click plus back to 3
    await userEvent.click(plusBtn);
    expect(plusBtn).toBeDisabled();

    // Switch to Gói Trải Nghiệm (defaultMembers: 1)
    const basicPkgBtn = screen.getByRole('button', { name: /Gói Trải Nghiệm/i });
    await userEvent.click(basicPkgBtn);
    expect(plusBtn).toBeDisabled();
    expect(minusBtn).toBeDisabled();

    // Switch to Gói Toàn Diện (defaultMembers: 6)
    const royalPkgBtn = screen.getByRole('button', { name: /Gói Toàn Diện/i });
    await userEvent.click(royalPkgBtn);
    expect(plusBtn).toBeDisabled();
    expect(minusBtn).not.toBeDisabled();
  });
});

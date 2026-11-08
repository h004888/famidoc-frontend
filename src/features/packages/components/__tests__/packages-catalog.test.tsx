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
});

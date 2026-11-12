import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { DoctorDashboardView } from '../doctor-dashboard-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/doctor',
  useSearchParams: () => new URLSearchParams(),
}));

describe('UT-CMP-15: DoctorDashboardView Touch Target & Accessibility', () => {
  it('renders "Mở Phiếu khám" button with accessible touch target styling', () => {
    render(<DoctorDashboardView />);
    const openBtns = screen.getAllByRole('button', { name: /Mở Phiếu khám/i });
    expect(openBtns.length).toBeGreaterThan(0);
    // Button must have py-2 or min-h-[40px]
    expect(openBtns[0].className).toContain('py-2');
  });

  it('standardizes typography across all 9 Doctor & Facility Portal views (no font-mono, font-black, or font-extrabold)', () => {
    const { container } = render(<DoctorDashboardView />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);

    const doctorAndFacilityFiles = [
      '../doctor-dashboard-view.tsx',
      '../../../doctor-encounters/components/doctor-encounters-view.tsx',
      '../../../doctor-telemedicine/components/doctor-telemedicine-view.tsx',
      '../../../doctor-timetable/components/doctor-timetable-view.tsx',
      '../../../doctor-verification/components/doctor-verification-view.tsx',
      '../../../facility-dashboard/components/facility-dashboard-view.tsx',
      '../../../facility-staff/components/facility-staff-view.tsx',
      '../../../facility-coordination/components/facility-coordination-view.tsx',
      '../../../facility-revenue/components/facility-revenue-view.tsx',
    ];

    for (const relPath of doctorAndFacilityFiles) {
      const fullPath = path.resolve(__dirname, relPath);
      const source = fs.readFileSync(fullPath, 'utf-8');
      expect(source, `Typography violation in ${relPath}`).not.toMatch(
        /\bfont-(mono|black|extrabold)\b/,
      );
    }
  });
});

describe('UT-CMP-QueuePagination: Patient queue pagination on Doctor Dashboard', () => {
  it('displays queue pagination info showing total waiting count', () => {
    render(<DoctorDashboardView />);

    // Queue header should show 3 ca chờ (total)
    expect(screen.getByText(/3 ca chờ/i)).toBeInTheDocument();

    // Pagination control should exist (shared Pagination component)
    const paginationNav = document.querySelector('[aria-label="Phân trang"]') as HTMLElement;
    expect(paginationNav).toBeTruthy();

    // Page number buttons should be visible (3 patients / 2 per page = 2 pages)
    expect(within(paginationNav).getByText('1')).toBeInTheDocument();
    expect(within(paginationNav).getByText('2')).toBeInTheDocument();
  });

  it('Prev button is disabled initially when on first page', () => {
    render(<DoctorDashboardView />);
    const prevBtn = screen.getByText('Trước');
    expect(prevBtn).toBeDisabled();
  });

  it('Next button is enabled initially when more than one page', () => {
    render(<DoctorDashboardView />);
    const nextBtn = screen.getByText('Sau');
    expect(nextBtn).not.toBeDisabled();
  });

  it('clicking Next button shows patients from the next page', async () => {
    render(<DoctorDashboardView />);

    // Page 1 should show exactly 2 patients (pageSize=2)
    expect(screen.getAllByRole('button', { name: /Mở Phiếu khám/i }).length).toBe(2);

    fireEvent.click(screen.getByText('Sau'));

    await waitFor(() => {
      const page2OpenBtns = screen.getAllByRole('button', { name: /Mở Phiếu khám/i });
      expect(page2OpenBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('has minimum touch target size (min-h-[40px]) on pagination buttons', () => {
    render(<DoctorDashboardView />);
    const prevBtn = screen.getByText('Trước');
    const nextBtn = screen.getByText('Sau');

    expect(prevBtn.className.includes('min-h-[40px]') || prevBtn.className.includes('py-2')).toBe(
      true,
    );
    expect(nextBtn.className.includes('min-h-[40px]') || nextBtn.className.includes('py-2')).toBe(
      true,
    );
  });
});

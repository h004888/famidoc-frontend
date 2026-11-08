import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

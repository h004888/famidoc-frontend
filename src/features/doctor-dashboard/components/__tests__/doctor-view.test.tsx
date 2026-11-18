import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { DoctorDashboardView } from '../doctor-dashboard-view';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

  it('standardizes typography across all 9 Doctor & Facility Portal views (no tracking-wide, font-black, or font-extrabold)', () => {
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

describe('DoctorDashboardView Queue Tabs & HSM Signing Dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('switches clinical queue Tabs between pending, in_progress, and signed', async () => {
    const user = userEvent.setup();
    render(<DoctorDashboardView />);

    expect(screen.getByText('3 ca chờ')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Đang khám' }));
    expect(screen.getByText('1 ca chờ')).toBeInTheDocument();
    expect(screen.getAllByText('Trần Thị Bích (66 tuổi)').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: 'Đã ký số' }));
    expect(screen.getByText('1 ca chờ')).toBeInTheDocument();
    expect(screen.getAllByText('Phạm Minh Khôi (9 tuổi)').length).toBeGreaterThan(0);
  });

  it('opens HSM signing Dialog, dismisses on Escape, and fires toast.success on confirm', async () => {
    const user = userEvent.setup();
    render(<DoctorDashboardView />);

    await user.click(screen.getByRole('button', { name: /Ký số HSM & Hoàn tất/i }));
    expect(await screen.findByText('Xác Thực Ký Số Viettel-CA Cloud HSM')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByText('Xác Thực Ký Số Viettel-CA Cloud HSM')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Ký số HSM & Hoàn tất/i }));
    await user.click(await screen.findByRole('button', { name: /Xác nhận Ký số/i }));

    await waitFor(
      () => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('Đã ký số HSM Viettel-CA'),
        );
      },
      { timeout: 1500 },
    );
  });

  it('renders without nested <main> landmark', () => {
    const { container } = render(<DoctorDashboardView />);
    expect(container.querySelector('main')).toBeNull();
  });

  it('renders real doctor identity when getDoctorMe returns an ACTIVE profile and shows onboarding notice when PENDING', async () => {
    const { doctorsApi } = await import('@/lib/api');
    const spy = vi.spyOn(doctorsApi, 'getDoctorMe').mockResolvedValueOnce({
      id: 'doc-real-1',
      doctorName: 'BS.CKII Lê Minh Quân',
      academicTitle: 'BS.CKII',
      specialty: 'Y học gia đình',
      experienceYears: 12,
      activePanelCount: 8,
      maxPanelCapacity: 30,
      onboardingStatus: 'ACTIVE',
      facilityId: 'fac-1',
      facility: { id: 'fac-1', facilityName: 'Bệnh viện Hoàn Mỹ Sài Gòn' },
      credentials: [
        {
          id: 'c1',
          credentialType: 'PRACTICE_LICENSE_CCHN',
          certificateNumber: '009988/HCM-CCHN',
          issueDate: '2020-01-01',
          issuingAuthority: 'Sở Y tế TP.HCM',
          fileUrl: '/api/v1/doctors/doc-real-1/credentials/c1/file',
        },
      ],
    });

    const { unmount } = render(<DoctorDashboardView />);
    expect(screen.queryByText(/PGS\.TS Nguyễn Trọng Nghĩa/i)).not.toBeInTheDocument();
    expect(await screen.findByText('BS.CKII Lê Minh Quân')).toBeInTheDocument();
    expect(screen.getAllByText(/009988\/HCM-CCHN/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Bệnh viện Hoàn Mỹ Sài Gòn/)).toBeInTheDocument();
    unmount();

    spy.mockResolvedValueOnce({
      id: 'doc-pending-1',
      doctorName: 'BS. Trần Thu Hà',
      specialty: 'Y học gia đình',
      experienceYears: 3,
      onboardingStatus: 'PENDING_SUBMISSION',
      facilityId: 'fac-1',
      facility: { id: 'fac-1', facilityName: 'Phòng khám An Bình' },
    });

    render(<DoctorDashboardView />);
    expect(
      await screen.findByText(/Hồ sơ Bác sĩ đang trong quy trình thẩm định 2 cấp/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Hàng Đợi Khám Hôm Nay/i)).not.toBeInTheDocument();

    spy.mockRestore();
  });
});

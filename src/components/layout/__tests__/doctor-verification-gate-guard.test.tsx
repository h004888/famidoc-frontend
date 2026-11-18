import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import {
  DoctorVerificationGateGuard,
  DoctorVerificationGateProvider,
} from '../doctor-verification-gate';
import { DashboardSidebar } from '../dashboard-sidebar';
import { doctorsApi, type DoctorProfileDto } from '@/lib/api/doctors.api';

let mockPathname = '/doctor';
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
}));

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    role: 'DOCTOR',
    isAuthenticated: true,
    isLoading: false,
    user: {
      id: 'doc-user-1',
      name: 'BS. Nguyễn Văn An',
      phone: '0909000222',
      avatarText: 'NA',
    },
    logout: vi.fn(),
  }),
  getDefaultPathForRole: () => '/doctor',
}));

vi.mock('@/lib/api/doctors.api', () => ({
  doctorsApi: {
    getDoctorMe: vi.fn(),
  },
}));

const pendingDoctor: DoctorProfileDto = {
  id: 'doc-1',
  doctorName: 'BS. Nguyễn Văn An',
  specialty: 'Y học gia đình',
  experienceYears: 5,
  onboardingStatus: 'PENDING_SUBMISSION',
  facilityId: 'fac-1',
  facilityName: 'Bệnh viện An Sinh',
};

const activeDoctor: DoctorProfileDto = {
  ...pendingDoctor,
  onboardingStatus: 'ACTIVE',
};

describe('DoctorVerificationGateGuard & DashboardSidebar Doctor Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/doctor';
  });

  it('blocks clinical doctor routes and redirects to /doctor/verification when onboardingStatus is not ACTIVE', async () => {
    vi.mocked(doctorsApi.getDoctorMe).mockResolvedValue(pendingDoctor);

    for (const restrictedPath of [
      '/doctor',
      '/doctor/contracts',
      '/doctor/timetable',
      '/doctor/encounters',
      '/doctor/telemedicine',
    ]) {
      mockPathname = restrictedPath;
      mockReplace.mockClear();

      const { unmount } = render(
        <DoctorVerificationGateProvider>
          <DoctorVerificationGateGuard>
            <div data-testid="protected-doctor-content">Clinical Content</div>
          </DoctorVerificationGateGuard>
        </DoctorVerificationGateProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('doctor-gate-blocked')).toBeInTheDocument();
        expect(mockReplace).toHaveBeenCalledWith('/doctor/verification');
      });
      expect(screen.queryByTestId('protected-doctor-content')).not.toBeInTheDocument();
      unmount();
    }
  });

  it('allows /doctor/verification, /doctor/credentials, and /doctor/profile while PENDING', async () => {
    vi.mocked(doctorsApi.getDoctorMe).mockResolvedValue(pendingDoctor);

    for (const allowedPath of ['/doctor/verification', '/doctor/credentials', '/doctor/profile']) {
      mockPathname = allowedPath;
      mockReplace.mockClear();

      const { unmount } = render(
        <DoctorVerificationGateProvider>
          <DoctorVerificationGateGuard>
            <div data-testid="doctor-onboarding-allowed">Allowed</div>
          </DoctorVerificationGateGuard>
        </DoctorVerificationGateProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('doctor-onboarding-allowed')).toBeInTheDocument();
      });
      expect(mockReplace).not.toHaveBeenCalled();
      unmount();
    }
  });

  it('locks clinical Doctor items in DashboardSidebar when PENDING and unlocks when ACTIVE', async () => {
    mockPathname = '/doctor/verification';
    vi.mocked(doctorsApi.getDoctorMe).mockResolvedValue(pendingDoctor);

    const { container, unmount } = render(
      <DoctorVerificationGateProvider>
        <DashboardSidebar initialRole="DOCTOR" />
      </DoctorVerificationGateProvider>,
    );

    await waitFor(() => {
      const mobileNav = container.querySelector(
        'nav[aria-label="Điều hướng chính trên điện thoại"]',
      ) as HTMLElement;
      expect(
        within(mobileNav).getByRole('button', { name: 'Bảng Lâm sàng (Đã khóa)' }),
      ).toBeDisabled();
      expect(
        within(mobileNav).getByRole('button', { name: 'Hợp đồng & Phụ trách Hộ (Đã khóa)' }),
      ).toBeDisabled();
    });

    unmount();

    vi.mocked(doctorsApi.getDoctorMe).mockResolvedValue(activeDoctor);
    const activeRender = render(
      <DoctorVerificationGateProvider>
        <DashboardSidebar initialRole="DOCTOR" />
      </DoctorVerificationGateProvider>,
    );

    await waitFor(() => {
      const mobileNav = activeRender.container.querySelector(
        'nav[aria-label="Điều hướng chính trên điện thoại"]',
      ) as HTMLElement;
      const clinicalLinks = within(mobileNav)
        .getAllByRole('link')
        .filter((el) => el.getAttribute('href') === '/doctor');
      expect(clinicalLinks).toHaveLength(1);
    });
  });
});

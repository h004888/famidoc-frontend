import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import {
  FacilityVerificationGateGuard,
  FacilityVerificationGateProvider,
} from '../facility-verification-gate';
import { DashboardSidebar } from '../dashboard-sidebar';
import { facilitiesApi, type AdminFacilityItem } from '@/lib/api/facilities.api';

let mockPathname = '/facility/staff';
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
    role: 'FACILITY',
    isAuthenticated: true,
    isLoading: false,
    user: {
      id: 'fac-user-1',
      name: 'Bệnh viện An Sinh',
      phone: '0909000111',
      avatarText: 'AS',
    },
    logout: vi.fn(),
  }),
  getDefaultPathForRole: () => '/facility',
}));

vi.mock('@/lib/api/facilities.api', () => ({
  facilitiesApi: {
    getMyFacilityProfile: vi.fn(),
  },
}));

const pendingProfile: AdminFacilityItem = {
  id: 'fac-1',
  facilityName: 'Bệnh viện An Sinh',
  representativeName: 'BS. Nguyễn Văn A',
  email: 'ansinh@famidoc.vn',
  phone: '0909000111',
  address: 'TP.HCM',
  onboardingStatus: 'PENDING_LEGAL',
  createdAt: '2026-11-17T00:00:00Z',
  verificationStatus: 'PENDING',
  status: 'PENDING',
  legalRejectionReason: null,
};

const activeProfile: AdminFacilityItem = {
  id: 'fac-1',
  facilityName: 'Bệnh viện An Sinh',
  representativeName: 'BS. Nguyễn Văn A',
  email: 'ansinh@famidoc.vn',
  phone: '0909000111',
  address: 'TP.HCM',
  onboardingStatus: 'ACTIVE',
  createdAt: '2026-11-17T00:00:00Z',
  verificationStatus: 'ACTIVE',
  status: 'ACTIVE',
  legalRejectionReason: null,
};

describe('FacilityVerificationGateGuard & DashboardSidebar Facility Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/facility/staff';
  });

  it('blocks /facility, /facility/staff, /facility/doctors and redirects directly to /facility/legal-profile when PENDING', async () => {
    vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValue(pendingProfile);

    for (const restrictedPath of ['/facility', '/facility/staff', '/facility/doctors', '/facility/contracts']) {
      mockPathname = restrictedPath;
      mockReplace.mockClear();

      const { unmount } = render(
        <FacilityVerificationGateProvider>
          <FacilityVerificationGateGuard>
            <div data-testid="protected-facility-content">Protected Content</div>
          </FacilityVerificationGateGuard>
        </FacilityVerificationGateProvider>,
      );

      expect(screen.queryByTestId('protected-facility-content')).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('facility-gate-blocked')).toBeInTheDocument();
        expect(mockReplace).toHaveBeenCalledWith('/facility/legal-profile');
      });

      expect(screen.queryByTestId('protected-facility-content')).not.toBeInTheDocument();
      unmount();
    }
  });

  it('allows /facility/legal-profile when PENDING without redirecting', async () => {
    mockPathname = '/facility/legal-profile';
    vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValue(pendingProfile);

    render(
      <FacilityVerificationGateProvider>
        <FacilityVerificationGateGuard>
          <div data-testid="legal-profile-content">Legal Profile Form</div>
        </FacilityVerificationGateGuard>
      </FacilityVerificationGateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('legal-profile-content')).toBeInTheDocument();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('allows /facility/doctors when verificationStatus is ACTIVE', async () => {
    mockPathname = '/facility/doctors';
    vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValue(activeProfile);

    render(
      <FacilityVerificationGateProvider>
        <FacilityVerificationGateGuard>
          <div data-testid="doctors-content">Doctors Directory</div>
        </FacilityVerificationGateGuard>
      </FacilityVerificationGateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('doctors-content')).toBeInTheDocument();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('locks restricted facility items on BOTH Desktop Sidenav and Mobile Bottom Tab Bar when PENDING, and unlocks when ACTIVE', async () => {
    mockPathname = '/facility/legal-profile';
    vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValue(pendingProfile);

    const { container, unmount } = render(
      <FacilityVerificationGateProvider>
        <DashboardSidebar initialRole="FACILITY" />
      </FacilityVerificationGateProvider>,
    );

    await waitFor(() => {
      const mobileNav = container.querySelector('nav[aria-label="Điều hướng chính trên điện thoại"]') as HTMLElement;
      expect(mobileNav).toBeTruthy();

      // Mobile Bottom Bar: Tổng quan, HĐ B2B, Bác sĩ must be disabled buttons (locked)
      expect(
        within(mobileNav).getByRole('button', { name: 'Quản lý Bác sĩ & CCHN (Đã khóa)' }),
      ).toBeDisabled();
      expect(
        within(mobileNav).getByRole('button', { name: 'Hợp đồng Hợp tác B2B (Đã khóa)' }),
      ).toBeDisabled();
      expect(
        within(mobileNav).getByRole('button', { name: 'Tổng quan Cơ sở (Đã khóa)' }),
      ).toBeDisabled();

      // Legal profile remains an active Link
      const legalLinks = within(mobileNav)
        .getAllByRole('link')
        .filter((el) => el.getAttribute('href') === '/facility/legal-profile');
      expect(legalLinks).toHaveLength(1);
    });

    unmount();

    // Now test ACTIVE facility unlocks navigation
    vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValue(activeProfile);
    const activeRender = render(
      <FacilityVerificationGateProvider>
        <DashboardSidebar initialRole="FACILITY" />
      </FacilityVerificationGateProvider>,
    );

    await waitFor(() => {
      const mobileNav = activeRender.container.querySelector(
        'nav[aria-label="Điều hướng chính trên điện thoại"]',
      ) as HTMLElement;
      const doctorLinks = within(mobileNav)
        .getAllByRole('link')
        .filter((el) => el.getAttribute('href') === '/facility/doctors');
      expect(doctorLinks).toHaveLength(1);
    });
  });
});

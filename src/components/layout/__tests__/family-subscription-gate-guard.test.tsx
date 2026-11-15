import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  FamilySubscriptionGateGuard,
  FamilySubscriptionGateProvider,
} from '../family-subscription-gate';
import { DashboardSidebar } from '../dashboard-sidebar';
import { contractsApi } from '@/lib/api/contracts.api';

const mockReplace = vi.fn();
let mockPathname = '/family/members';
let mockAuthState: {
  role: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { name: string; avatarText: string; phone: string } | null;
  logout: () => void;
} = {
  role: 'FAMILY',
  isAuthenticated: true,
  isLoading: false,
  user: { name: 'Nguyễn Văn A', avatarText: 'NA', phone: '0901234567' },
  logout: vi.fn(),
};

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => mockAuthState,
  getDefaultPathForRole: (role: string) => (role === 'ADMIN' ? '/admin' : '/family'),
}));

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: {
    getFamilyGateStatus: vi.fn(),
  },
}));

describe('FamilySubscriptionGateGuard & DashboardSidebar gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/family/members';
    mockAuthState = {
      role: 'FAMILY',
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Nguyễn Văn A', avatarText: 'NA', phone: '0901234567' },
      logout: vi.fn(),
    };
  });

  it.each([
    '/family',
    '/family/members',
    '/family/members/member-123',
    '/family/appointments',
    '/family/telemedicine',
    '/family/vitals',
  ])(
    'redirects restricted route %s to /doctors when hasActiveContract is false and pendingContract is null',
    async (restrictedPath) => {
      mockPathname = restrictedPath;
      vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
        hasActiveContract: false,
        activeContract: null,
        pendingContract: null,
        patientCount: 0,
      });

      render(
        <FamilySubscriptionGateProvider>
          <FamilySubscriptionGateGuard>
            <div data-testid="protected-content">Nội dung được bảo vệ</div>
          </FamilySubscriptionGateGuard>
        </FamilySubscriptionGateProvider>,
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/doctors');
      });
      expect(screen.queryByTestId('protected-content')).toBeNull();
      expect(screen.getByTestId('family-gate-blocked')).toBeTruthy();
    },
  );

  it('redirects to /family/subscription/tracking?contractId=<id> when pendingContract exists', async () => {
    mockPathname = '/family/members';
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: {
        id: 'mc-pending-42',
        contractNumber: 'HD-4P-2026-0042',
        contractStatus: 'PENDING_APPROVAL',
        memberCount: 3,
      },
      patientCount: 0,
    });

    render(
      <FamilySubscriptionGateProvider>
        <FamilySubscriptionGateGuard>
          <div data-testid="protected-content">Danh sách thành viên</div>
        </FamilySubscriptionGateGuard>
      </FamilySubscriptionGateProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/family/subscription/tracking?contractId=mc-pending-42');
    });
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it.each([
    '/family/subscription',
    '/family/subscription/tracking',
    '/family/subscription/contract',
    '/family/billing',
  ])('allows %s even when hasActiveContract is false', async (allowedPath) => {
    mockPathname = allowedPath;
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      patientCount: 0,
    });

    render(
      <FamilySubscriptionGateProvider>
        <FamilySubscriptionGateGuard>
          <div data-testid="allowed-content">Trang cho phép</div>
        </FamilySubscriptionGateGuard>
      </FamilySubscriptionGateProvider>,
    );

    expect(screen.getByTestId('allowed-content')).toBeTruthy();
    await waitFor(() => {
      expect(contractsApi.getFamilyGateStatus).toHaveBeenCalledTimes(1);
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('unlocks all restricted routes when hasActiveContract is true', async () => {
    mockPathname = '/family/members';
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
      hasActiveContract: true,
      activeContract: {
        id: 'mc-active-1',
        contractNumber: 'HD-4P-2026-0001',
        contractStatus: 'ACTIVE',
        memberCount: 4,
        endDate: '2027-01-01T00:00:00.000Z',
      },
      pendingContract: null,
      patientCount: 2,
    });

    render(
      <FamilySubscriptionGateProvider>
        <FamilySubscriptionGateGuard>
          <div data-testid="protected-content">Quản lý thành viên</div>
        </FamilySubscriptionGateGuard>
      </FamilySubscriptionGateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not block non-family roles', () => {
    mockAuthState.role = 'ADMIN';
    mockPathname = '/family/members';

    render(
      <FamilySubscriptionGateProvider>
        <FamilySubscriptionGateGuard>
          <div data-testid="admin-content">Nội dung Admin</div>
        </FamilySubscriptionGateGuard>
      </FamilySubscriptionGateProvider>,
    );

    expect(screen.getByTestId('admin-content')).toBeTruthy();
    expect(contractsApi.getFamilyGateStatus).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('locks restricted menu items with activation notice in DashboardSidebar when locked, and unlocks when ACTIVE', async () => {
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValueOnce({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: {
        id: 'mc-pending-7',
        contractNumber: 'HD-4P-2026-0007',
        contractStatus: 'PENDING_PAYMENT',
        memberCount: 2,
      },
      patientCount: 0,
    });

    const { container, rerender } = render(
      <FamilySubscriptionGateProvider>
        <DashboardSidebar />
      </FamilySubscriptionGateProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', {
          name: /Quản lý Thành viên \(Đã khóa/i,
        }).length,
      ).toBeGreaterThan(0);
    });

    // Hover desktop sidebar to expand and inspect activation notice + allowed links
    const aside = container.querySelector('aside');
    expect(aside).toBeTruthy();
    fireEvent.mouseEnter(aside!);

    await waitFor(() => {
      expect(screen.getByTestId('sidebar-family-gate-notice')).toBeTruthy();
    });

    // Restricted items should be disabled buttons
    const lockedMembersBtns = screen.getAllByRole('button', {
      name: /Quản lý Thành viên \(Đã khóa/i,
    });
    expect(lockedMembersBtns.length).toBeGreaterThan(0);
    expect(lockedMembersBtns[0]).toHaveAttribute('aria-disabled', 'true');
    expect(lockedMembersBtns[0]).toBeDisabled();

    // Allowed subscription & billing items remain active links
    const billingLinks = screen.getAllByRole('link', { name: /Thanh toán VietQR & Biên lai/i });
    expect(billingLinks[0]).toHaveAttribute('href', '/family/billing');
    const subscriptionLinks = screen.getAllByRole('link', { name: /Gói Chăm sóc & Tiến trình ký/i });
    expect(subscriptionLinks[0]).toHaveAttribute('href', '/family/subscription');

    // Now simulate unlocked state (ACTIVE) on a fresh mount
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValueOnce({
      hasActiveContract: true,
      activeContract: {
        id: 'mc-active-7',
        contractNumber: 'HD-4P-2026-0007',
        contractStatus: 'ACTIVE',
        memberCount: 2,
        endDate: '2027-01-01T00:00:00.000Z',
      },
      pendingContract: null,
      patientCount: 1,
    });

    rerender(<div />);
    rerender(
      <FamilySubscriptionGateProvider>
        <DashboardSidebar />
      </FamilySubscriptionGateProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: /Quản lý Thành viên/i })[0]).toHaveAttribute(
        'href',
        '/family/members',
      );
    });
    expect(screen.queryByTestId('sidebar-family-gate-notice')).toBeNull();
  });
});

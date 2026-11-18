import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
  DashboardShellGate,
  FamilySubscriptionGateGuard,
  FamilySubscriptionGateProvider,
} from '../family-subscription-gate';
import { DashboardSidebar } from '../dashboard-sidebar';
import { contractsApi } from '@/lib/api/contracts.api';
import { ApiError } from '@/lib/http/errors';

const mockReplace = vi.fn();
let mockPathname = '/family/members';
let mockSearchParams = new URLSearchParams();
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
  useSearchParams: () => mockSearchParams,
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
    mockSearchParams = new URLSearchParams();
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

  it('redirects to /booking/tracking?contractId=<id> when pendingContract is awaiting signatures', async () => {
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
      expect(mockReplace).toHaveBeenCalledWith('/booking/tracking?contractId=mc-pending-42');
    });
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('redirects to /booking/payment?contractId=<id> when pendingContract is PENDING_PAYMENT', async () => {
    mockPathname = '/family/members';
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: {
        id: 'mc-pending-99',
        contractNumber: 'HD-4P-2026-0099',
        contractStatus: 'PENDING_PAYMENT',
        memberCount: 2,
      },
      patientCount: 0,
    });

    render(
      <FamilySubscriptionGateProvider>
        <FamilySubscriptionGateGuard>
          <div data-testid="protected-content">Nội dung bị khóa</div>
        </FamilySubscriptionGateGuard>
      </FamilySubscriptionGateProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/booking/payment?contractId=mc-pending-99');
    });
  });

  it.each([
    '/family/subscription',
    '/family/subscription/tracking',
    '/family/subscription/contract',
    '/family/billing',
  ])('blocks legacy route %s when hasActiveContract is false', async (legacyPath) => {
    mockPathname = legacyPath;
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      patientCount: 0,
    });

    render(
      <FamilySubscriptionGateProvider>
        <FamilySubscriptionGateGuard>
          <div data-testid="legacy-content">Trang kế thừa</div>
        </FamilySubscriptionGateGuard>
      </FamilySubscriptionGateProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/doctors');
    });
    expect(screen.queryByTestId('legacy-content')).toBeNull();
    expect(screen.getByTestId('family-gate-blocked')).toBeTruthy();
  });

  it('chuyển link đặt gói cũ /family/subscription?packageId&doctorId&facilityId sang /booking giữ nguyên query', async () => {
    mockPathname = '/family/subscription';
    mockSearchParams = new URLSearchParams(
      'packageId=p1&doctorId=d1&facilityId=f1&members=2',
    );
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      patientCount: 0,
    });

    render(
      <FamilySubscriptionGateProvider>
        <FamilySubscriptionGateGuard>
          <div data-testid="legacy-content">Trang kế thừa</div>
        </FamilySubscriptionGateGuard>
      </FamilySubscriptionGateProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        '/booking?packageId=p1&doctorId=d1&facilityId=f1&members=2',
      );
    });
  });

  it('chuyển link theo dõi cũ /family/subscription/tracking?contractId=<id> sang /booking/tracking', async () => {
    mockPathname = '/family/subscription/tracking';
    mockSearchParams = new URLSearchParams('contractId=ctr-legacy');
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      patientCount: 0,
    });

    render(
      <FamilySubscriptionGateProvider>
        <FamilySubscriptionGateGuard>
          <div data-testid="legacy-content">Trang kế thừa</div>
        </FamilySubscriptionGateGuard>
      </FamilySubscriptionGateProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/booking/tracking?contractId=ctr-legacy');
    });
  });

  it('chuyển link thanh toán cũ /family/billing?contractId=<id> sang /booking/payment', async () => {
    mockPathname = '/family/billing';
    mockSearchParams = new URLSearchParams('contractId=ctr-billing');
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      patientCount: 0,
    });

    render(
      <FamilySubscriptionGateProvider>
        <FamilySubscriptionGateGuard>
          <div data-testid="legacy-content">Trang kế thừa</div>
        </FamilySubscriptionGateGuard>
      </FamilySubscriptionGateProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/booking/payment?contractId=ctr-billing');
    });
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

    // Khi chưa ACTIVE, toàn bộ menu /family/* (kể cả gói & thanh toán) đều bị khóa
    expect(
      screen.queryAllByRole('link', { name: /Thanh toán VietQR & Biên lai/i })
    ).toHaveLength(0);
    expect(
      screen.queryAllByRole('link', { name: /Gói Chăm sóc & Tiến trình ký/i })
    ).toHaveLength(0);
    const lockedBillingBtns = screen.getAllByRole('button', {
      name: /Thanh toán VietQR & Biên lai \(Đã khóa/i,
    });
    expect(lockedBillingBtns.length).toBeGreaterThan(0);
    expect(lockedBillingBtns[0]).toBeDisabled();

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
      expect(screen.getByRole('link', { name: /Quản lý Thành viên/i })).toHaveAttribute(
        'href',
        '/family/members',
      );
    });
    expect(screen.queryByTestId('sidebar-family-gate-notice')).toBeNull();
  });

  it('hiển thị nút dự phòng trỏ tới /doctors (không về /family/subscription) khi kiểm tra gate bị lỗi', async () => {
    mockPathname = '/family/members';
    vi.mocked(contractsApi.getFamilyGateStatus).mockRejectedValue(
      new Error('Mất kết nối máy chủ'),
    );

    render(
      <FamilySubscriptionGateProvider>
        <FamilySubscriptionGateGuard>
          <div data-testid="protected-content">Nội dung được bảo vệ</div>
        </FamilySubscriptionGateGuard>
      </FamilySubscriptionGateProvider>,
    );

    expect(
      await screen.findByText(/Không thể xác minh trạng thái gói gia đình/i),
    ).toBeTruthy();
    const fallbackLink = screen.getByRole('link', { name: /Tìm bác sĩ/i });
    expect(fallbackLink).toHaveAttribute('href', '/doctors');
    expect(screen.queryByRole('link', { name: /Xem tiến trình hợp đồng/i })).toBeNull();
  });

  it('KHÔNG đẩy người dùng chưa kích hoạt vào vòng lặp /family: sidebar trỏ /onboarding khi chưa có pendingContract', async () => {
    mockPathname = '/settings';
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      patientCount: 1,
    });

    render(
      <FamilySubscriptionGateProvider>
        <DashboardSidebar />
      </FamilySubscriptionGateProvider>,
    );

    const notice = await screen.findByTestId('sidebar-family-gate-notice');
    const primaryLink = within(notice).getByRole('link', { name: /Chọn bác sĩ & gói ngay/i });
    expect(primaryLink).toHaveAttribute('href', '/onboarding');
    expect(primaryLink).not.toHaveAttribute('href', '/family');
  });

  it('sidebar trỏ đúng bước /booking tương ứng khi có pendingContract và vẫn mở lối tắt /onboarding', async () => {
    mockPathname = '/settings';
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: {
        id: 'mc-pending-55',
        contractNumber: 'HD-4P-2026-0055',
        contractStatus: 'PENDING_APPROVAL',
        memberCount: 3,
      },
      patientCount: 1,
    });

    render(
      <FamilySubscriptionGateProvider>
        <DashboardSidebar />
      </FamilySubscriptionGateProvider>,
    );

    const notice = await screen.findByTestId('sidebar-family-gate-notice');
    expect(
      within(notice).getByRole('link', { name: /Theo dõi tiến trình hợp đồng/i })
    ).toHaveAttribute('href', '/booking/tracking?contractId=mc-pending-55');
    expect(
      within(notice).getByRole('link', { name: /Không gian chuẩn bị/i })
    ).toHaveAttribute('href', '/onboarding');
  });

  it.each([401, 403])(
    'ẩn toàn bộ shell/nội dung và chuyển hướng sang /403 khi kiểm tra quyền trả về HTTP %i',
    async (statusCode) => {
      mockPathname = '/family';
      vi.mocked(contractsApi.getFamilyGateStatus).mockRejectedValue(
        new ApiError(statusCode === 401 ? 'Unauthorized' : 'Forbidden', statusCode),
      );

      render(
        <FamilySubscriptionGateProvider>
          <DashboardShellGate>
            <div data-testid="dashboard-shell">
              <div data-testid="sidebar-stub">Sidebar</div>
              <FamilySubscriptionGateGuard>
                <div data-testid="protected-content">Bảng Sức khỏe Gia đình</div>
              </FamilySubscriptionGateGuard>
            </div>
          </DashboardShellGate>
        </FamilySubscriptionGateProvider>,
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/403');
      });
      expect(screen.queryByTestId('dashboard-shell')).toBeNull();
      expect(screen.queryByTestId('sidebar-stub')).toBeNull();
      expect(screen.queryByTestId('protected-content')).toBeNull();
      expect(screen.queryByText(/Không thể xác minh trạng thái gói gia đình/i)).toBeNull();
    },
  );
});

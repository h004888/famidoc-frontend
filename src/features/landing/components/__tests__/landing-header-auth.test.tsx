import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingHeader } from '../landing-header';
import * as authContextModule from '@/features/auth/context/auth-context';
import { contractsApi, type FamilyGateStatusDto } from '@/lib/api/contracts.api';
import { FAMILY_GATE_REFRESH_EVENT } from '@/components/layout/family-subscription-gate';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: {
    getFamilyGateStatus: vi.fn(),
  },
}));

type MockRole = 'FAMILY' | 'PATIENT' | 'DOCTOR' | 'FACILITY' | 'ADMIN';

function mockAuth(
  role: MockRole,
  overrides?: { isAuthenticated?: boolean; user?: null; isLoading?: boolean }
) {
  const isAuthenticated = overrides?.isAuthenticated ?? true;
  const isLoading = overrides?.isLoading ?? false;
  vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
    isAuthenticated,
    user: isAuthenticated
      ? {
          id: 'usr-123',
          name: 'Nguyễn Văn Đại Diện',
          email: 'rep@famidoc.vn',
          phone: '0987654321',
          role,
          avatarText: 'NV',
        }
      : null,
    role,
    isLoading,
    applySession: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getDefaultPathForRole: authContextModule.getDefaultPathForRole,
  });
}

function gateStatus(overrides: Partial<FamilyGateStatusDto>): FamilyGateStatusDto {
  return {
    hasActiveContract: false,
    activeContract: null,
    pendingContract: null,
    patientCount: 2,
    ...overrides,
  };
}

async function openUserMenu() {
  const trigger = screen.getByRole('button', { name: /Nguyễn Văn Đại Diện/i });
  await userEvent.click(trigger);
  return trigger;
}

describe('LandingHeader - menu tài khoản nhận biết vai trò và trạng thái cổng hợp đồng', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue(
      gateStatus({})
    );
  });

  it('renders a neutral skeleton and never shows Login or Register while auth is loading (desktop & mobile)', async () => {
    mockAuth('FAMILY', { isAuthenticated: false, isLoading: true });

    render(<LandingHeader />);

    expect(screen.getByTestId('landing-header-auth-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Đăng nhập/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Đăng ký/i })).not.toBeInTheDocument();

    const mobileToggle = screen.getByRole('button', { name: /Mở menu điều hướng/i });
    await userEvent.click(mobileToggle);
    expect(screen.getByTestId('landing-header-mobile-auth-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Đăng nhập tài khoản/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Đăng ký Bác sĩ Gia đình/i })).not.toBeInTheDocument();
  });

  it('renders Login and Register action links when user is unauthenticated and never calls the gate API', () => {
    mockAuth('FAMILY', { isAuthenticated: false });

    render(<LandingHeader />);

    expect(screen.getByRole('link', { name: /Đăng nhập/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Đăng ký/i })).toHaveAttribute('href', '/register');
    expect(screen.queryByLabelText(/Đăng xuất tài khoản/i)).not.toBeInTheDocument();
    expect(contractsApi.getFamilyGateStatus).not.toHaveBeenCalled();
  });

  it('opens the account menu with identity header, role badge, utilities and a single logout entry', async () => {
    const logout = vi.fn();
    vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 'usr-123',
        name: 'Nguyễn Văn Đại Diện',
        email: 'rep@famidoc.vn',
        phone: '0987654321',
        role: 'FAMILY',
        avatarText: 'NV',
      },
      role: 'FAMILY',
      isLoading: false,
      applySession: vi.fn(),
      login: vi.fn(),
      logout,
      getDefaultPathForRole: authContextModule.getDefaultPathForRole,
    });

    render(<LandingHeader />);

    expect(screen.getByText('Nguyễn Văn Đại Diện')).toBeInTheDocument();
    const userMenuTrigger = screen.getByRole('button', { name: /Nguyễn Văn Đại Diện/i });
    expect(userMenuTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await openUserMenu();

    expect(userMenuTrigger).toHaveAttribute('aria-expanded', 'true');
    const menu = screen.getByRole('menu');
    expect(menu).toHaveAttribute('id', 'landing-user-menu');
    expect(menu).toHaveTextContent('rep@famidoc.vn');
    expect(menu).toHaveTextContent('Đại diện Hộ gia đình');
    expect(screen.getByRole('menuitem', { name: /Trung tâm thông báo/i })).toHaveAttribute(
      'href',
      '/notifications'
    );
    expect(screen.getByRole('menuitem', { name: /Cài đặt tài khoản & bảo mật/i })).toHaveAttribute(
      'href',
      '/settings'
    );

    const logoutItems = screen.getAllByRole('menuitem', { name: /Đăng xuất/i });
    expect(logoutItems).toHaveLength(1);
    await userEvent.click(logoutItems[0]);
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('shows the trigger with keyboard_arrow_down and no standalone logout button beside it', async () => {
    mockAuth('FAMILY');
    render(<LandingHeader />);

    const trigger = screen.getByRole('button', { name: /Nguyễn Văn Đại Diện/i });
    expect(trigger).toHaveTextContent('keyboard_arrow_down');
    expect(screen.queryByLabelText(/Đăng xuất tài khoản/i)).not.toBeInTheDocument();
  });

  it('closes the dropdown on Escape', async () => {
    mockAuth('FAMILY');
    render(<LandingHeader />);

    const trigger = await openUserMenu();
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the dropdown when clicking outside (mousedown on document.body)', async () => {
    mockAuth('FAMILY');
    render(<LandingHeader />);

    const trigger = await openUserMenu();
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('FAMILY with no contract: primary action goes to /doctors with /onboarding and /packages shortcuts', async () => {
    mockAuth('FAMILY');
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue(gateStatus({}));

    render(<LandingHeader />);
    expect(screen.queryByRole('link', { name: /Không gian gia đình/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Vào Dashboard/i })).not.toBeInTheDocument();
    await openUserMenu();

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Chọn bác sĩ & gói chăm sóc/i })).toHaveAttribute(
        'href',
        '/doctors'
      );
    });
    expect(
      screen.getByRole('menuitem', { name: /Không gian chuẩn bị gia đình/i })
    ).toHaveAttribute('href', '/onboarding');
    expect(screen.getByRole('menuitem', { name: /Xem bảng giá gói/i })).toHaveAttribute(
      'href',
      '/packages'
    );
    expect(screen.getByRole('menu')).toHaveTextContent(/Chưa kích hoạt gói/i);
    expect(contractsApi.getFamilyGateStatus).toHaveBeenCalledTimes(1);
  });

  it('FAMILY with a contract awaiting signatures: primary action goes to /booking/tracking', async () => {
    mockAuth('FAMILY');
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue(
      gateStatus({
        pendingContract: {
          id: 'mc-pending-42',
          contractNumber: 'HD-4P-2026-0042',
          contractStatus: 'PENDING_APPROVAL',
          memberCount: 3,
        },
      })
    );

    render(<LandingHeader />);
    await openUserMenu();

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Tiếp tục ký hợp đồng/i })).toHaveAttribute(
        'href',
        '/booking/tracking?contractId=mc-pending-42'
      );
    });
    expect(screen.getByRole('menu')).toHaveTextContent(/Đang chờ ký 4 bên/i);
  });

  it('FAMILY with PENDING_PAYMENT: primary action goes to /booking/payment and tracks progress', async () => {
    mockAuth('FAMILY');
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue(
      gateStatus({
        pendingContract: {
          id: 'mc-pending-99',
          contractNumber: 'HD-4P-2026-0099',
          contractStatus: 'PENDING_PAYMENT',
          memberCount: 2,
        },
      })
    );

    render(<LandingHeader />);
    await openUserMenu();

    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: /Thanh toán kích hoạt gói/i })
      ).toHaveAttribute('href', '/booking/payment?contractId=mc-pending-99');
    });
    expect(screen.getByRole('menuitem', { name: /Xem tiến độ hợp đồng/i })).toHaveAttribute(
      'href',
      '/booking/tracking?contractId=mc-pending-99'
    );
    expect(screen.getByRole('menu')).toHaveTextContent(/Chờ thanh toán VietQR/i);
  });

  it('FAMILY with an ACTIVE contract: primary action goes to /family with appointments and members shortcuts', async () => {
    mockAuth('PATIENT');
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue(
      gateStatus({
        hasActiveContract: true,
        activeContract: {
          id: 'mc-active-1',
          contractNumber: 'HD-4P-2026-0001',
          contractStatus: 'ACTIVE',
          memberCount: 4,
          endDate: '2027-01-01T00:00:00.000Z',
        },
      })
    );

    render(<LandingHeader />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Vào Dashboard/i })).toHaveAttribute('href', '/family');
    });

    await openUserMenu();

    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: /Bảng Sức khỏe Gia đình/i })
      ).toHaveAttribute('href', '/family');
    });
    expect(screen.getByRole('menuitem', { name: /Lịch hẹn khám tại nhà/i })).toHaveAttribute(
      'href',
      '/family/appointments'
    );
    expect(screen.getByRole('menuitem', { name: /Quản lý thành viên/i })).toHaveAttribute(
      'href',
      '/family/members'
    );
    expect(screen.getByRole('menu')).toHaveTextContent(/Gói đang hoạt động/i);
  });

  it('falls back to /onboarding when the gate API fails, without crashing the menu', async () => {
    mockAuth('FAMILY');
    vi.mocked(contractsApi.getFamilyGateStatus).mockRejectedValue(new Error('Mất kết nối máy chủ'));

    render(<LandingHeader />);
    await openUserMenu();

    expect(
      screen.getByRole('menuitem', { name: /Không gian chuẩn bị gia đình/i })
    ).toHaveAttribute('href', '/onboarding');
    expect(
      screen.queryByRole('menuitem', { name: /Bảng Sức khỏe Gia đình/i })
    ).not.toBeInTheDocument();
  });

  it('refreshes the gate status when FAMILY_GATE_REFRESH_EVENT is dispatched', async () => {
    mockAuth('FAMILY');
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValueOnce(gateStatus({}));

    render(<LandingHeader />);

    await waitFor(() => {
      expect(contractsApi.getFamilyGateStatus).toHaveBeenCalledTimes(1);
    });

    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValueOnce(
      gateStatus({
        hasActiveContract: true,
        activeContract: {
          id: 'mc-active-7',
          contractNumber: 'HD-4P-2026-0007',
          contractStatus: 'ACTIVE',
          memberCount: 2,
          endDate: '2027-01-01T00:00:00.000Z',
        },
      })
    );

    window.dispatchEvent(new Event(FAMILY_GATE_REFRESH_EVENT));

    await waitFor(() => {
      expect(contractsApi.getFamilyGateStatus).toHaveBeenCalledTimes(2);
    });

    await openUserMenu();
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Bảng Sức khỏe Gia đình/i })).toHaveAttribute(
        'href',
        '/family'
      );
    });
  });

  it.each([
    ['DOCTOR', '/doctor', '/doctor/profile', 'Bác sĩ Gia đình'],
    ['FACILITY', '/facility', '/facility/legal-profile', 'Cơ sở Y tế đối tác'],
    ['ADMIN', '/admin', '/admin/users', 'Quản trị viên'],
  ] as const)(
    'role %s links to %s and its role profile %s without calling the family gate API',
    async (role, dashboardHref, profileHref, roleLabel) => {
      mockAuth(role);

      render(<LandingHeader />);
      await openUserMenu();

      expect(
        screen.getByRole('menuitem', { name: /Vào bảng điều khiển/i })
      ).toHaveAttribute('href', dashboardHref);
      expect(screen.getByRole('menu')).toHaveTextContent(roleLabel);
      expect(screen.getByRole('menuitem', { name: /Trung tâm thông báo/i })).toHaveAttribute(
        'href',
        '/notifications'
      );
      expect(screen.getByRole('menuitem', { name: /Cài đặt tài khoản & bảo mật/i })).toHaveAttribute(
        'href',
        '/settings'
      );
      const profileLabels: Record<string, RegExp> = {
        DOCTOR: /Hồ sơ chuyên môn/i,
        FACILITY: /Hồ sơ pháp lý cơ sở/i,
        ADMIN: /Tài khoản & phân quyền/i,
      };
      expect(screen.getByRole('menuitem', { name: profileLabels[role] })).toHaveAttribute(
        'href',
        profileHref
      );
      expect(contractsApi.getFamilyGateStatus).not.toHaveBeenCalled();
    }
  );

  it('renders identity, gate status badge, primary action, /notifications, /settings and logout inside mobile drawer when authenticated', async () => {
    const logout = vi.fn();
    vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 'usr-123',
        name: 'Nguyễn Văn Đại Diện',
        email: 'rep@famidoc.vn',
        phone: '0987654321',
        role: 'FAMILY',
        avatarText: 'NV',
      },
      role: 'FAMILY',
      isLoading: false,
      applySession: vi.fn(),
      login: vi.fn(),
      logout,
      getDefaultPathForRole: authContextModule.getDefaultPathForRole,
    });
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue(gateStatus({}));

    render(<LandingHeader />);

    const mobileToggle = screen.getByRole('button', { name: /Mở menu điều hướng/i });
    expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(mobileToggle);
    expect(mobileToggle).toHaveAttribute('aria-expanded', 'true');

    await waitFor(() => {
      expect(screen.getByText(/Chưa kích hoạt gói/i)).toBeInTheDocument();
    });
    expect(screen.getByText('rep@famidoc.vn')).toBeInTheDocument();
    expect(screen.getByText('Đại diện Hộ gia đình')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Chọn bác sĩ & gói chăm sóc/i })).toHaveAttribute(
      'href',
      '/doctors'
    );
    expect(screen.getByRole('link', { name: /Không gian chuẩn bị gia đình/i })).toHaveAttribute(
      'href',
      '/onboarding'
    );
    expect(screen.getByRole('link', { name: /Thông báo/i })).toHaveAttribute(
      'href',
      '/notifications'
    );
    expect(screen.getByRole('link', { name: /Cài đặt/i })).toHaveAttribute('href', '/settings');

    const mobileLogoutBtn = screen.getByRole('button', { name: /Đăng xuất tài khoản/i });
    await userEvent.click(mobileLogoutBtn);
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent getFamilyGateStatus calls when multiple LandingHeader consumers mount together', async () => {
    mockAuth('FAMILY');
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue(gateStatus({}));

    render(
      <>
        <LandingHeader />
        <LandingHeader />
      </>
    );

    await waitFor(() => {
      expect(contractsApi.getFamilyGateStatus).toHaveBeenCalledTimes(1);
    });
  });
});

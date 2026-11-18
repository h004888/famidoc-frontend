import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardSidebar } from '../dashboard-sidebar';
import { SiteHeader } from '../site-header';
import { FamilySubscriptionGateProvider } from '../family-subscription-gate';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

let mockPathname = '/admin/disputes';
let mockRole = 'ADMIN';
let mockGateStatus: {
  hasActiveContract: boolean;
  activeContract: null | {
    id: string;
    contractNumber: string;
    contractStatus: string;
    memberCount: number;
    endDate: string;
  };
  pendingContract: null | {
    id: string;
    contractNumber: string;
    contractStatus: string;
    memberCount: number;
  };
  patientCount: number;
} = {
  hasActiveContract: true,
  activeContract: null,
  pendingContract: null,
  patientCount: 1,
};

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
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

const mockLogout = vi.fn();

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    role: mockRole,
    isAuthenticated: true,
    isLoading: false,
    user: { name: 'Nguyễn Admin', avatarText: 'NA', phone: '0909000111' },
    logout: mockLogout,
  }),
  getDefaultPathForRole: (role: string) =>
    role === 'ADMIN' ? '/admin' : role === 'FACILITY' ? '/facility' : role === 'DOCTOR' ? '/doctor' : '/family',
}));

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: {
    getFamilyGateStatus: vi.fn().mockImplementation(() => Promise.resolve(mockGateStatus)),
  },
}));

function renderShell() {
  return render(
    <FamilySubscriptionGateProvider>
      <TooltipProvider>
        <SidebarProvider defaultOpen={false}>
          <DashboardSidebar />
          <SiteHeader />
        </SidebarProvider>
      </TooltipProvider>
    </FamilySubscriptionGateProvider>
  );
}

describe('Dashboard Shell Navigation (Sidebar + SiteHeader)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/admin/disputes';
    mockRole = 'ADMIN';
    mockGateStatus = {
      hasActiveContract: true,
      activeContract: null,
      pendingContract: null,
      patientCount: 1,
    };
  });

  it('renders dynamic Breadcrumb in SiteHeader and toggles sidebar expansion with SidebarTrigger', async () => {
    const user = userEvent.setup();
    const { container } = renderShell();

    expect(screen.getByText('Quản trị viên')).toBeInTheDocument();
    expect(screen.getAllByText('Trọng tài & Tranh chấp').length).toBeGreaterThan(0);

    const aside = container.querySelector('aside');
    expect(aside).toHaveAttribute('data-state', 'collapsed');

    const trigger = screen.getByRole('button', { name: 'Bật hoặc tắt thanh điều hướng' });
    await user.click(trigger);

    expect(aside).toHaveAttribute('data-state', 'expanded');
  });

  it('deduplicates FACILITY and DOCTOR contract routes and opens mobile Sheet when clicking "Thêm"', async () => {
    const user = userEvent.setup();
    mockRole = 'FACILITY';
    mockPathname = '/facility';
    const facilityRender = renderShell();

    await user.click(screen.getByRole('button', { name: 'Bật hoặc tắt thanh điều hướng' }));
    const facilityAside = facilityRender.container.querySelector('aside')!;
    const facilityContractLinks = within(facilityAside)
      .getAllByRole('link')
      .filter((el) => el.getAttribute('href') === '/facility/contracts');
    expect(facilityContractLinks).toHaveLength(1);
    facilityRender.unmount();

    mockRole = 'DOCTOR';
    mockPathname = '/doctor';
    const doctorRender = renderShell();
    await user.click(screen.getByRole('button', { name: 'Bật hoặc tắt thanh điều hướng' }));
    const doctorAside = doctorRender.container.querySelector('aside')!;
    const doctorContractLinks = within(doctorAside)
      .getAllByRole('link')
      .filter((el) => el.getAttribute('href') === '/doctor/contracts');
    expect(doctorContractLinks).toHaveLength(1);
    doctorRender.unmount();

    // Open mobile drawer via "Thêm" overflow tab on ADMIN (>5 items)
    mockRole = 'ADMIN';
    mockPathname = '/admin';
    renderShell();
    const moreBtn = screen.getByRole('button', { name: /Thêm/i });
    await user.click(moreBtn);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('points SiteHeader "Trang chủ" and the sidebar gate notice to /onboarding for a locked family account', async () => {
    mockRole = 'FAMILY';
    mockPathname = '/settings';
    mockGateStatus = {
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      patientCount: 2,
    };

    const { container } = renderShell();
    await userEvent.click(screen.getByRole('button', { name: 'Bật hoặc tắt thanh điều hướng' }));

    await waitFor(() => {
      expect(screen.getByTestId('sidebar-family-gate-notice')).toBeInTheDocument();
    });

    const notice = screen.getByTestId('sidebar-family-gate-notice');
    const onboardingLink = within(notice).getByRole('link', { name: /Chọn bác sĩ & gói ngay/i });
    expect(onboardingLink).toHaveAttribute('href', '/onboarding');

    // Breadcrumb "Trang chủ" in SiteHeader must not loop back into /family
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
    const breadcrumbHome = within(header as HTMLElement)
      .getAllByRole('link')
      .find((el) => el.textContent === 'Trang chủ');
    expect(breadcrumbHome).toHaveAttribute('href', '/onboarding');
  });

  it('keeps the sidebar gate notice on the pending /booking step while offering the onboarding hub', async () => {
    mockRole = 'FAMILY';
    mockPathname = '/settings';
    mockGateStatus = {
      hasActiveContract: false,
      activeContract: null,
      pendingContract: {
        id: 'mc-pending-7',
        contractNumber: 'HD-4P-2026-0007',
        contractStatus: 'PENDING_PAYMENT',
        memberCount: 2,
      },
      patientCount: 2,
    };

    renderShell();
    await userEvent.click(screen.getByRole('button', { name: 'Bật hoặc tắt thanh điều hướng' }));

    await waitFor(() => {
      expect(screen.getByTestId('sidebar-family-gate-notice')).toBeInTheDocument();
    });

    const notice = screen.getByTestId('sidebar-family-gate-notice');
    expect(
      within(notice).getByRole('link', { name: /Theo dõi tiến trình hợp đồng/i })
    ).toHaveAttribute('href', '/booking/payment?contractId=mc-pending-7');
    expect(
      within(notice).getByRole('link', { name: /Không gian chuẩn bị/i })
    ).toHaveAttribute('href', '/onboarding');
  });

  it('treats 768px tablet as mobile drawer mode and 1024px as desktop sidebar mode', () => {
    const originalInnerWidth = window.innerWidth;
    const originalMatchMedia = window.matchMedia;

    const setViewportWidth = (width: number) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: width < 1024 && query.includes('1023px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    };

    function MobileProbe() {
      const { isMobile } = useSidebar();
      return <div data-testid="is-mobile-probe">{String(isMobile)}</div>;
    }

    try {
      setViewportWidth(768);
      const { unmount } = render(
        <SidebarProvider>
          <MobileProbe />
        </SidebarProvider>
      );
      expect(screen.getByTestId('is-mobile-probe')).toHaveTextContent('true');
      unmount();

      setViewportWidth(1024);
      render(
        <SidebarProvider>
          <MobileProbe />
        </SidebarProvider>
      );
      expect(screen.getByTestId('is-mobile-probe')).toHaveTextContent('false');
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
      window.matchMedia = originalMatchMedia;
    }
  });

  it('removes "Danh mục Gói Dịch vụ" from sidebar and provides Đăng xuất in DashboardTopbarUser dropdown', async () => {
    const user = userEvent.setup();
    mockRole = 'DOCTOR';
    mockPathname = '/doctor/profile';

    renderShell();

    expect(screen.queryByRole('link', { name: /Danh mục Gói Dịch vụ/i })).not.toBeInTheDocument();

    const [userMenuBtn] = screen.getAllByRole('button', { name: 'Mở menu tài khoản' });
    await user.click(userMenuBtn);

    const logoutItem = await screen.findByRole('menuitem', { name: /Đăng xuất/i });
    expect(logoutItem).toBeInTheDocument();

    await user.click(logoutItem);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

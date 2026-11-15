import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardSidebar } from '../dashboard-sidebar';
import { SiteHeader } from '../site-header';
import { FamilySubscriptionGateProvider } from '../family-subscription-gate';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

let mockPathname = '/admin/disputes';
let mockRole = 'ADMIN';

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

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    role: mockRole,
    isAuthenticated: true,
    isLoading: false,
    user: { name: 'Nguyễn Admin', avatarText: 'NA', phone: '0909000111' },
    logout: vi.fn(),
  }),
  getDefaultPathForRole: (role: string) =>
    role === 'ADMIN' ? '/admin' : role === 'FACILITY' ? '/facility' : role === 'DOCTOR' ? '/doctor' : '/family',
}));

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: {
    getFamilyGateStatus: vi.fn().mockResolvedValue({
      hasActiveContract: true,
      activeContract: null,
      pendingContract: null,
      patientCount: 1,
    }),
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

  it('opens Clinic Switcher DropdownMenu, dismisses on Escape, and switches clinic on select', async () => {
    const user = userEvent.setup();
    renderShell();

    // Pin sidebar expanded so Clinic Switcher button is visible
    await user.click(screen.getByRole('button', { name: 'Bật hoặc tắt thanh điều hướng' }));

    const switcherTrigger = screen.getByRole('button', { name: 'Chuyển cơ sở y tế phụ trách' });
    await user.click(switcherTrigger);

    expect(await screen.findByText('Vinmec Central Park')).toBeInTheDocument();

    // Dismiss via Escape
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByText('Vinmec Central Park')).not.toBeInTheDocument();
    });

    // Re-open and choose a different clinic
    await user.click(switcherTrigger);
    await user.click(await screen.findByText('Vinmec Central Park'));

    expect(switcherTrigger).toHaveTextContent('Vinmec Central Park');
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
});

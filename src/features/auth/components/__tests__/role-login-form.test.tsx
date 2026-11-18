import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleAuthShell } from '../role-auth-shell';
import { RoleLoginForm } from '../role-login-form';

const mockSearchParams = { get: vi.fn<(key: string) => string | null>(() => null) };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ applySession: vi.fn() }),
  getDefaultPathForRole: (r: string) => `/${r.toLowerCase()}`,
}));

describe('RoleAuthShell & RoleLoginForm (ADMIN / FACILITY / DOCTOR)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.get.mockReturnValue(null);
  });

  it.each([
    {
      role: 'ADMIN' as const,
      heading: 'Đăng nhập Quản trị viên',
      emailLabel: /Email Quản trị viên/i,
    },
    {
      role: 'FACILITY' as const,
      heading: 'Đăng nhập Cơ sở Y tế',
      emailLabel: /Email Cơ sở y tế \/ Bệnh viện/i,
    },
    {
      role: 'DOCTOR' as const,
      heading: 'Đăng nhập Bác sĩ CCHN',
      emailLabel: /Email Bác sĩ chuyên khoa/i,
    },
  ])('renders clean centered shadcn login card for $role portal', ({ role, heading, emailLabel }) => {
    render(
      <RoleAuthShell role={role} mode="login">
        <RoleLoginForm targetRole={role} />
      </RoleAuthShell>
    );

    // Centered larger logo inside card header
    const logo = screen.getByAltText('FamiDoc Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass('h-10', 'sm:h-12');

    // Main heading & inputs
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByLabelText(emailLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu$/i)).toBeInTheDocument();

    // Removed elements per design feedback
    expect(screen.queryByText(/Admin Backoffice|Quản trị hệ thống|Bệnh viện \/ Phòng khám|^Bác sĩ CCHN$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hệ thống điều phối nền tảng|Cổng B2B quản lý nhân sự|Không gian lâm sàng/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Thông tin phân hệ' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Bạn là Hộ gia đình\?/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Trang chủ/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Chuyển cổng đăng nhập dashboard' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Chuyển cổng đăng nhập/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/FamiDoc@Facility2026|FamiDoc@Doctor2026/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Đăng ký gia nhập đối tác CSYT/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it('toggles password visibility and displays validation alerts on empty submit', async () => {
    const user = userEvent.setup();
    render(
      <RoleAuthShell role="FACILITY" mode="login">
        <RoleLoginForm targetRole="FACILITY" />
      </RoleAuthShell>
    );

    const passwordInput = screen.getByLabelText(/^Mật khẩu$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Đăng nhập cổng làm việc' }));
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('renders register heading when mode="register"', () => {
    render(
      <RoleAuthShell role="DOCTOR" mode="register">
        <div>Register form</div>
      </RoleAuthShell>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Đăng ký Bác sĩ Gia đình' })).toBeInTheDocument();
  });

  it('displays facility-provisioned guidance when Doctor login is opened with ?from=provisioned-only', () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === 'from' ? 'provisioned-only' : null
    );

    render(
      <RoleAuthShell role="DOCTOR" mode="login">
        <RoleLoginForm targetRole="DOCTOR" />
      </RoleAuthShell>
    );

    expect(
      screen.getByText(/Tài khoản Bác sĩ được cấp trực tiếp bởi Cơ sở Y tế đối tác/i)
    ).toBeInTheDocument();
  });
});

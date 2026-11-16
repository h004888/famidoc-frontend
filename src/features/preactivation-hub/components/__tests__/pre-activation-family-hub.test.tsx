import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  PreActivationFamilyHub,
  resolveCurrentActivationStep,
  resolveActivationSteps,
} from '../pre-activation-family-hub';
import type { FamilyGateStatusDto } from '@/lib/api/contracts.api';

const mockReplace = vi.fn();
const mockPush = vi.fn();
let mockRouteParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  usePathname: () => '/onboarding',
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useSearchParams: () => mockRouteParams,
}));

vi.mock('@/features/landing/components/landing-header', () => ({
  LandingHeader: () => <div data-testid="landing-header" />,
}));

vi.mock('@/features/landing/components/landing-footer', () => ({
  LandingFooter: () => <div data-testid="landing-footer" />,
}));

const mockGetFamilyGateStatus = vi.fn();

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: {
    getFamilyGateStatus: () => mockGetFamilyGateStatus(),
  },
}));

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

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => mockAuthState,
  getDefaultPathForRole: (role: string) =>
    role === 'ADMIN'
      ? '/admin'
      : role === 'FACILITY'
        ? '/facility'
        : role === 'DOCTOR'
          ? '/doctor'
          : '/family',
}));

function gateStatus(overrides: Partial<FamilyGateStatusDto>): FamilyGateStatusDto {
  return {
    hasActiveContract: false,
    activeContract: null,
    pendingContract: null,
    patientCount: 3,
    ...overrides,
  };
}

describe('PreActivationFamilyHub (/onboarding)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouteParams = new URLSearchParams();
    mockAuthState = {
      role: 'FAMILY',
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Nguyễn Văn A', avatarText: 'NA', phone: '0901234567' },
      logout: vi.fn(),
    };
    mockGetFamilyGateStatus.mockResolvedValue(gateStatus({}));
  });

  it('renders the 3-step activation roadmap and next action for a family without a contract', async () => {
    render(<PreActivationFamilyHub disableRedirect />);

    expect(screen.getByTestId('landing-header')).toBeInTheDocument();
    expect(screen.getByTestId('landing-footer')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Lộ trình kích hoạt gói chăm sóc/i })
    ).toBeInTheDocument();

    for (const step of resolveActivationSteps()) {
      expect(screen.getByText(step.title)).toBeInTheDocument();
    }

    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: /Chọn bác sĩ & gói chăm sóc/i })
      ).toHaveAttribute('href', '/doctors');
    });
    expect(screen.getByRole('link', { name: /Ghép nối bác sĩ phù hợp/i })).toHaveAttribute(
      'href',
      '/doctors/matching'
    );
    expect(screen.getByRole('link', { name: /Xem bảng giá gói/i })).toHaveAttribute(
      'href',
      '/packages'
    );

    // Bước 1 đang là bước hiện tại
    const currentStep = screen.getByText('Chọn Bác sĩ & Gói').closest('li');
    expect(currentStep).toHaveAttribute('data-step-state', 'current');
  });

  it('shows preparation profile summary with links to /settings and /notifications', async () => {
    mockGetFamilyGateStatus.mockResolvedValue(
      gateStatus({
        familyUnit: {
          id: 'fam-1',
          homeAddress: '12 Nguyễn Trãi, Quận 5',
          emergencyPhone: '0909888777',
          representativeName: 'Trần Thị B',
        },
      })
    );

    render(<PreActivationFamilyHub disableRedirect />);

    await waitFor(() => {
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    });
    expect(screen.getByText('0909888777')).toBeInTheDocument();
    expect(screen.getByText('12 Nguyễn Trãi, Quận 5')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Cập nhật hồ sơ & BHYT/i })
    ).toHaveAttribute('href', '/settings');
    expect(
      screen.getByRole('link', { name: /Trung tâm thông báo/i })
    ).toHaveAttribute('href', '/notifications');
  });

  it('flags missing preparation data as not updated yet', async () => {
    mockGetFamilyGateStatus.mockResolvedValue(gateStatus({ familyUnit: null }));

    render(<PreActivationFamilyHub disableRedirect />);

    await waitFor(() => {
      expect(screen.getAllByText('Chưa cập nhật').length).toBe(3);
    });
    expect(screen.getByText(/Một số thông tin hồ sơ chưa cập nhật/i)).toBeInTheDocument();
  });

  it('lists features unlocked after activation', async () => {
    render(<PreActivationFamilyHub disableRedirect />);

    expect(
      screen.getByRole('heading', { name: /Sẽ được mở khóa sau khi hợp đồng ACTIVE/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Bảng Sức khỏe Gia đình')).toBeInTheDocument();
    expect(screen.getByText('Đặt lịch Home Visit & Telehealth')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockGetFamilyGateStatus).toHaveBeenCalled();
    });
  });

  it('continues to /booking/tracking when the contract is awaiting signatures', async () => {
    mockGetFamilyGateStatus.mockResolvedValue(
      gateStatus({
        pendingContract: {
          id: 'mc-pending-42',
          contractNumber: 'HD-4P-2026-0042',
          contractStatus: 'PENDING_APPROVAL',
          memberCount: 3,
        },
      })
    );

    render(<PreActivationFamilyHub disableRedirect />);

    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: /Tiếp tục ký hợp đồng/i })
      ).toHaveAttribute('href', '/booking/tracking?contractId=mc-pending-42');
    });
    expect(screen.getByText(/HD-4P-2026-0042/)).toBeInTheDocument();
    const currentStep = screen.getByText('Ký Hợp đồng 4 bên').closest('li');
    expect(currentStep).toHaveAttribute('data-step-state', 'current');
  });

  it('continues to /booking/payment when the contract is PENDING_PAYMENT', async () => {
    mockGetFamilyGateStatus.mockResolvedValue(
      gateStatus({
        pendingContract: {
          id: 'mc-pending-99',
          contractNumber: 'HD-4P-2026-0099',
          contractStatus: 'PENDING_PAYMENT',
          memberCount: 2,
        },
      })
    );

    render(<PreActivationFamilyHub disableRedirect />);

    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: /Thanh toán kích hoạt gói/i })
      ).toHaveAttribute('href', '/booking/payment?contractId=mc-pending-99');
    });
    const currentStep = screen.getByText('Thanh toán VietQR').closest('li');
    expect(currentStep).toHaveAttribute('data-step-state', 'current');
  });

  it('redirects unauthenticated visitors to /login?redirect=/onboarding', async () => {
    mockAuthState.isAuthenticated = false;
    mockAuthState.user = null;

    render(<PreActivationFamilyHub />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login?redirect=/onboarding');
    });
  });

  it.each([
    ['DOCTOR', '/doctor'],
    ['FACILITY', '/facility'],
    ['ADMIN', '/admin'],
  ])('redirects role %s to %s', async (role, expected) => {
    mockAuthState.role = role;

    render(<PreActivationFamilyHub />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(expected);
    });
  });

  it('redirects FAMILY accounts with an ACTIVE contract to /family', async () => {
    mockGetFamilyGateStatus.mockResolvedValue(
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

    render(<PreActivationFamilyHub />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/family');
    });
  });

  it('falls back to the onboarding action when the gate API fails', async () => {
    mockGetFamilyGateStatus.mockRejectedValue(new Error('Mất kết nối'));

    render(<PreActivationFamilyHub disableRedirect />);

    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: /Chọn bác sĩ & gói chăm sóc/i })
      ).toHaveAttribute('href', '/doctors');
    });
    expect(screen.getByText(/Chưa thể xác minh trạng thái hợp đồng/i)).toBeInTheDocument();
  });

  it('maps gate state to the right activation step', () => {
    expect(resolveCurrentActivationStep('inactive')).toBe(0);
    expect(resolveCurrentActivationStep('pending_signature')).toBe(1);
    expect(resolveCurrentActivationStep('pending_payment')).toBe(2);
    expect(resolveCurrentActivationStep('active')).toBe(3);
    expect(resolveCurrentActivationStep('loading')).toBe(0);
    expect(resolveCurrentActivationStep('error')).toBe(0);
  });

  it('treats explicit gateStatus={null} as inactive without calling the gate API', () => {
    render(<PreActivationFamilyHub gateStatus={null} disableRedirect />);

    expect(screen.getByText(/Trạng thái hiện tại: Chưa kích hoạt gói/i)).toBeInTheDocument();
    expect(mockGetFamilyGateStatus).not.toHaveBeenCalled();
  });
});

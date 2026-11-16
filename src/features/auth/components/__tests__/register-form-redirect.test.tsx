import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { RegisterForm } from '../register-form';

const replaceMock = vi.fn();
let mockSearchParams = new URLSearchParams();
let mockIsLoading = false;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: mockIsLoading,
    role: 'FAMILY',
    getDefaultPathForRole: () => '/family',
  }),
}));

describe('RegisterForm - điều hướng tài khoản hộ gia đình đã đăng nhập', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockIsLoading = false;
  });

  it('không điều hướng sớm khi auth vẫn đang isLoading', () => {
    mockIsLoading = true;
    render(<RegisterForm />);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('không đưa tài khoản chưa kích hoạt gói vào /family/subscription', async () => {
    render(<RegisterForm />);

    await vi.waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/doctors');
    });
    expect(replaceMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/family/subscription')
    );
  });

  it('giữ nguyên URL đích từ query redirect nếu có', async () => {
    mockSearchParams = new URLSearchParams(
      'packageId=p1&redirect=%2Fbooking%3FpackageId%3Dp1%26doctorId%3Dd1%26facilityId%3Df1%26members%3D2'
    );

    render(<RegisterForm />);

    await vi.waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        '/booking?packageId=p1&doctorId=d1&facilityId=f1&members=2'
      );
    });
  });
});

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../login-form';

let mockSearchParams = new URLSearchParams();

// Mock useRouter & useSearchParams
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

describe('UT-CMP-02..03, UT-CMP-08..10: LoginForm Component Interactions & A11y', () => {
  it('UT-CMP-02: renders multi-role tab selector', async () => {
    mockSearchParams = new URLSearchParams();
    render(<LoginForm />);
    expect(screen.getByText(/Bệnh nhân \/ Gia đình/i)).toBeInTheDocument();
    expect(screen.getByText(/Bác sĩ gia đình/i)).toBeInTheDocument();
    expect(screen.getByText(/Quản trị viên/i)).toBeInTheDocument();
  });

  it('UT-CMP-03: displays validation error when submitting with empty fields', async () => {
    mockSearchParams = new URLSearchParams();
    render(<LoginForm />);
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập hệ thống/i });
    await userEvent.click(submitBtn);

    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('UT-CMP-08..09 (M-01): binds inputs with labels via htmlFor and id', () => {
    mockSearchParams = new URLSearchParams();
    render(<LoginForm />);
    expect(screen.getByLabelText(/Số điện thoại/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu$/i)).toBeInTheDocument();
  });

  it('UT-CMP-10 (FL-01): renders Success Welcome Banner when URL has ?registered=true', () => {
    mockSearchParams = new URLSearchParams('registered=true');
    render(<LoginForm />);
    const welcomeBanner = screen.getByRole('status');
    expect(welcomeBanner).toBeInTheDocument();
    expect(welcomeBanner).toHaveTextContent(/Đăng ký tài khoản đại diện thành công/i);
  });
});

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../register-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('UT-CMP-11..13: RegisterForm Accessibility & Real-time Validation', () => {
  it('UT-CMP-11 (M-02): links all form labels with inputs via htmlFor and id', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/Họ và tên người đại diện/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số điện thoại liên hệ/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số CCCD/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Xác nhận mật khẩu/i)).toBeInTheDocument();
  });

  it('UT-CMP-12 (M-03): triggers real-time onBlur validation when leaving invalid field', async () => {
    render(<RegisterForm />);
    const cccdInput = screen.getByLabelText(/Số CCCD/i);
    await userEvent.type(cccdInput, '12345');
    await userEvent.tab(); // trigger blur

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent(/12 chữ số/i);
  });

  it('UT-CMP-13 (m-01): configures inputMode="numeric" and maxLength={12} on CCCD field', () => {
    render(<RegisterForm />);
    const cccdInput = screen.getByLabelText(/Số CCCD/i);
    expect(cccdInput).toHaveAttribute('inputMode', 'numeric');
    expect(cccdInput).toHaveAttribute('maxLength', '12');
  });
});

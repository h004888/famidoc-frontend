import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MustChangePasswordBanner } from '../must-change-password-banner';

let mockAuthState = {
  isAuthenticated: true,
  role: 'FACILITY',
  user: { id: 'u1', mustChangePassword: true },
};

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
}));

describe('MustChangePasswordBanner', () => {
  beforeEach(() => {
    mockAuthState = {
      isAuthenticated: true,
      role: 'FACILITY',
      user: { id: 'u1', mustChangePassword: true },
    };
  });

  it('renders single-row nowrap layout on desktop without wrapping action button', () => {
    render(<MustChangePasswordBanner />);

    const banner = screen.getByTestId('must-change-password-banner');
    expect(banner.className).toContain('md:flex-nowrap');
    expect(banner.className).not.toContain('flex-wrap');

    const textParagraph = screen.getByText(/Đề xuất bảo mật tài khoản:/i).closest('p');
    expect(textParagraph?.parentElement?.className).toContain('min-w-0');
    expect(textParagraph?.parentElement?.className).toContain('flex-1');

    const actionLink = screen.getByRole('link', { name: 'Đổi mật khẩu' });
    expect(actionLink.className).toContain('whitespace-nowrap');
    expect(actionLink.parentElement?.className).toContain('shrink-0');
  });

  it('dismisses banner when clicking close button', () => {
    render(<MustChangePasswordBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Đóng đề xuất đổi mật khẩu' }));
    expect(screen.queryByTestId('must-change-password-banner')).not.toBeInTheDocument();
  });
});

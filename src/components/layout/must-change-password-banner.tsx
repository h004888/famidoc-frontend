'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, X } from 'lucide-react';
import { useAuth } from '@/features/auth/context/auth-context';

/**
 * Thông báo khuyến nghị (không chặn luồng làm việc) khi Cơ sở Y tế hoặc Bác sĩ
 * vẫn đang dùng mật khẩu khởi tạo (`mustChangePassword === true`).
 */
export function MustChangePasswordBanner() {
  const { isAuthenticated, user, role } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (
    dismissed ||
    !isAuthenticated ||
    !user?.mustChangePassword ||
    (role !== 'FACILITY' && role !== 'DOCTOR')
  ) {
    return null;
  }

  return (
    <div
      role="status"
      data-testid="must-change-password-banner"
      className="mx-4 mt-4 flex flex-col gap-3 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-xs text-amber-950 shadow-2xs sm:mx-6 md:flex-row md:flex-nowrap md:items-center md:justify-between lg:mx-8"
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.5 md:items-center">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-amber-700 md:mt-0" aria-hidden="true" />
        <p
          className="leading-relaxed md:truncate"
          title="Đề xuất bảo mật tài khoản: Bạn đang sử dụng mật khẩu khởi tạo được cấp qua email. Bạn vẫn có thể nộp hồ sơ ngay bây giờ và nên đổi mật khẩu cá nhân khi thuận tiện."
        >
          <strong className="font-semibold">Đề xuất bảo mật tài khoản:</strong> Bạn đang sử dụng mật khẩu khởi tạo được cấp qua email. Bạn vẫn có thể nộp hồ sơ ngay bây giờ và nên{' '}
          <Link href="/change-password" className="font-semibold text-blue-700 underline hover:text-blue-900">
            đổi mật khẩu cá nhân
          </Link>{' '}
          khi thuận tiện.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/change-password"
          className="inline-flex h-8 items-center whitespace-nowrap rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
        >
          Đổi mật khẩu
        </Link>
        <button
          type="button"
          aria-label="Đóng đề xuất đổi mật khẩu"
          onClick={() => setDismissed(true)}
          className="inline-flex size-8 items-center justify-center rounded-lg text-amber-700 transition-colors hover:bg-amber-100"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

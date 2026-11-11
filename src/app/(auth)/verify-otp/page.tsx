import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { VerifyEmailOtpView } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Xác thực OTP Email | FamiDoc',
  description:
    'Xác thực mã bảo mật gửi qua hòm thư điện tử để kích hoạt tài khoản hoặc ký số hợp đồng y tế gia đình FamiDoc.',
};

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          Đang tải trình xác thực OTP...
        </div>
      }
    >
      <VerifyEmailOtpView />
    </Suspense>
  );
}

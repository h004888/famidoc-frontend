import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Đăng nhập FamiDoc - Nền tảng Quản lý Bác sĩ Gia đình & Chăm sóc Sức khỏe',
  description:
    'Kết nối hồ sơ sức khỏe gia đình và cổng nghiệp vụ y tế chuyên nghiệp FamiDoc Pro. Bảo mật dữ liệu y tế theo Nghị định 13/2023/NĐ-CP.',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[560px] mx-auto my-auto p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0037c1]/20 border-t-[#0037c1] rounded-full animate-spin" />
          <span className="text-xs font-medium text-on-surface-variant">
            Đang tải cổng đăng nhập y tế FamiDoc...
          </span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

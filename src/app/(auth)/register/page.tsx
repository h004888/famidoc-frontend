import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Đăng ký Đại diện Gia đình | FamiDoc Pro',
  description:
    'Đăng ký tài khoản đại diện gia đình FamiDoc Pro - Quản lý y tế gia đình thông minh và kết nối bác sĩ riêng.',
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-2xl mx-auto my-auto p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0037c1]/20 border-t-[#0037c1] rounded-full animate-spin" />
          <span className="text-xs font-medium text-[#444654]">Đang tải biểu mẫu đăng ký y tế...</span>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

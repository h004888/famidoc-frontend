import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Đăng ký Hợp tác Cơ sở Y tế | FamiDoc Partners',
  description:
    'Đăng ký tham gia mạng lưới cơ sở y tế đối tác FamiDoc. Quản lý nhân lực y tế, tiếp nhận hộ gia đình và chia sẻ doanh thu minh bạch.',
};

export default function FacilityRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen mx-auto my-auto p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0037c1]/20 border-t-[#0037c1] rounded-full animate-spin" />
          <span className="text-xs font-medium text-[#444654]">Đang tải biểu mẫu đăng ký đối tác y tế...</span>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

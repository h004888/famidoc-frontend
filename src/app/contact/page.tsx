import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { ContactView } from '@/features/contact';
import { LandingFloatingActions } from '@/features/landing';

export const metadata: Metadata = {
  title: 'Liên Hệ & Đăng Ký Tư Vấn Gói Dịch Vụ | FamiDoc Pro',
  description:
    'Gửi yêu cầu đăng ký tư vấn gói chăm sóc sức khỏe gia đình FamiDoc Pro. Đội ngũ bác sĩ chuyên khoa sẵn sàng liên hệ và hỗ trợ 24/7.',
};

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0046c0]/20 border-t-[#0046c0] rounded-full animate-spin" />
        </div>
      }
    >
      <ContactView />
      <LandingFloatingActions />
    </Suspense>
  );
}

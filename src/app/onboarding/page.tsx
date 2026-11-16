import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { PreActivationFamilyHub } from '@/features/preactivation-hub';
import { ServerAuthSessionBoundary } from '@/features/auth/components/server-auth-session-boundary';

export const metadata: Metadata = {
  title: 'Không gian chuẩn bị gia đình | FamiDoc Pro',
  description:
    'Hoàn tất 3 bước chọn bác sĩ, ký hợp đồng 4 bên và thanh toán VietQR để kích hoạt gói chăm sóc sức khỏe gia đình FamiDoc Pro.',
};

/**
 * Không gian Chuẩn bị Gia đình nằm ngoài `(dashboard)` để dùng khung công khai
 * (`LandingHeader` + `LandingFooter`), không render `DashboardSidebar` đầy ổ khóa
 * cho tài khoản `FAMILY`/`PATIENT` chưa có hợp đồng `ACTIVE`.
 */
export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0046c0]/20 border-t-[#0046c0] rounded-full animate-spin" />
        </div>
      }
    >
      <ServerAuthSessionBoundary>
        <PreActivationFamilyHub />
      </ServerAuthSessionBoundary>
    </Suspense>
  );
}

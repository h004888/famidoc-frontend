import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { BookingOnboardingShell } from '@/features/booking';
import { ServerAuthSessionBoundary } from '@/features/auth/components/server-auth-session-boundary';

export const metadata: Metadata = {
  title: 'Đăng ký gói chăm sóc gia đình | FamiDoc',
  description:
    'Hoàn tất đăng ký gói chăm sóc sức khỏe gia đình: xác nhận gói với bác sĩ, ký hợp đồng 4 bên trên Documenso và thanh toán VietQR để kích hoạt.',
};

/**
 * Layout độc lập cho luồng đặt gói nằm ngoài `(dashboard)`: không render
 * `DashboardSidebar`, `SiteHeader` hay `FamilySubscriptionGateGuard`.
 */
export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center p-6 text-xs text-slate-500">
          Đang tải quy trình đặt gói...
        </div>
      }
    >
      <ServerAuthSessionBoundary>
        <BookingOnboardingShell>{children}</BookingOnboardingShell>
      </ServerAuthSessionBoundary>
    </Suspense>
  );
}

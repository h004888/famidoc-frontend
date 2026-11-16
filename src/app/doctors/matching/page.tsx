import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DoctorMatchingWizard } from '@/features/doctors';
import { LandingFloatingActions } from '@/features/landing';
import { ServerAuthSessionBoundary } from '@/features/auth/components/server-auth-session-boundary';

export const metadata: Metadata = {
  title: 'Ghép Nối Bác Sĩ Gia Đình Thông Minh | FamiDoc Pro',
  description:
    'Thuật toán ghép nối Bác sĩ Gia đình thông minh theo khoảng cách địa lý GPS, thời gian di chuyển ETA, bệnh lý mạn tính và hạn mức chăm sóc Panel Cap.',
};

export default function DoctorMatchingPage() {
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <ServerAuthSessionBoundary>
          <DoctorMatchingWizard />
        </ServerAuthSessionBoundary>
      </Suspense>
      <LandingFloatingActions />
    </>
  );
}

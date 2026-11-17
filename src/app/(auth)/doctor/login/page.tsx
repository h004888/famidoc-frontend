import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { RoleAuthShell, RoleLoginForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Đăng nhập Cổng Bác Sĩ | FamiDoc Healthcare',
  description: 'Không gian lâm sàng dành cho Bác sĩ gia đình quản lý bệnh án điện tử, lịch trực và tư vấn Telemedicine.',
};

export default function DoctorLoginPage() {
  return (
    <RoleAuthShell role="DOCTOR" mode="login">
      <Suspense fallback={<div className="h-40 flex items-center justify-center text-xs text-slate-400">Đang tải...</div>}>
        <RoleLoginForm targetRole="DOCTOR" />
      </Suspense>
    </RoleAuthShell>
  );
}

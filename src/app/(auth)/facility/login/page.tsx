import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { RoleAuthShell, RoleLoginForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Đăng nhập Cổng Cơ Sở Y Tế | FamiDoc B2B Portal',
  description: 'Cổng quản trị B2B dành cho Bệnh viện, Phòng khám đa khoa đối tác quản lý nhân sự, hợp đồng và đối soát.',
};

export default function FacilityLoginPage() {
  return (
    <RoleAuthShell role="FACILITY" mode="login">
      <Suspense fallback={<div className="h-40 flex items-center justify-center text-xs text-slate-400">Đang tải...</div>}>
        <RoleLoginForm targetRole="FACILITY" />
      </Suspense>
    </RoleAuthShell>
  );
}

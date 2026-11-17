import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { RoleAuthShell, RoleLoginForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Đăng nhập Cổng Quản Trị Hệ Thống | FamiDoc Admin Portal',
  description: 'Cổng điều hành và thẩm định hệ thống FamiDoc dành cho Quản trị viên và Kiểm định viên.',
};

export default function AdminLoginPage() {
  return (
    <RoleAuthShell role="ADMIN" mode="login">
      <Suspense fallback={<div className="h-40 flex items-center justify-center text-xs text-slate-400">Đang tải...</div>}>
        <RoleLoginForm targetRole="ADMIN" />
      </Suspense>
    </RoleAuthShell>
  );
}

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { RoleAuthShell, FacilityRegisterForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Đăng ký Hợp Tác Cơ Sở Y Tế | FamiDoc B2B Partnership',
  description: 'Đăng ký hợp tác B2B cung ứng nhân lực y tế và bảo trợ chuyên môn cho mạng lưới bác sĩ gia đình FamiDoc.',
};

export default function FacilityRegisterPage() {
  return (
    <RoleAuthShell role="FACILITY" mode="register">
      <Suspense fallback={<div className="h-40 flex items-center justify-center text-xs text-slate-400">Đang tải...</div>}>
        <FacilityRegisterForm />
      </Suspense>
    </RoleAuthShell>
  );
}

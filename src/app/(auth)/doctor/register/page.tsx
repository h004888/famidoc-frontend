import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { RoleAuthShell, DoctorRegisterForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Đăng ký Gia Nhập Mạng Lưới Bác Sĩ | FamiDoc Healthcare',
  description: 'Nộp hồ sơ chuyên môn và chứng chỉ hành nghề CCHN để tham gia mạng lưới Bác sĩ Gia đình FamiDoc.',
};

export default function DoctorRegisterPage() {
  return (
    <RoleAuthShell role="DOCTOR" mode="register">
      <Suspense fallback={<div className="h-40 flex items-center justify-center text-xs text-slate-400">Đang tải...</div>}>
        <DoctorRegisterForm />
      </Suspense>
    </RoleAuthShell>
  );
}

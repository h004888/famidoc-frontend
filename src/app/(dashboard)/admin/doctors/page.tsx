import React, { Suspense } from 'react';
import { AdminDoctorsView } from '@/features/admin-doctors';

export const instant = false;

export const metadata = {
  title: 'Thẩm định Nhân sự Y tế & CCHN Bác sĩ (Tầng 2) | FamiDoc Admin',
  description: 'Admin nền tảng hậu kiểm CSDL Quốc gia và phê duyệt chứng chỉ hành nghề Bác sĩ theo Flow 2.1',
};

export default function AdminDoctorsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <AdminDoctorsView />
    </Suspense>
  );
}

import React, { Suspense } from 'react';
import { DoctorProfileView } from '@/features/doctor-dashboard';

export const instant = false;

export const metadata = {
  title: 'Hồ sơ Bác sĩ & Trạng thái Hành nghề | FamiDoc Doctor',
  description: 'Hồ sơ chuyên môn, CCHN và định mức dung lượng quản lý hộ gia đình của bác sĩ theo Flow 2.1',
};

export default function DoctorProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <DoctorProfileView />
    </Suspense>
  );
}

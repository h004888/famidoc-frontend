import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { DoctorTimetableView } from '@/features/doctor-timetable';

export const instant = false;

export const metadata: Metadata = {
  title: 'Lịch Làm Việc Lâm Sàng & Quản Lý Panel Cap | FamiDoc Pro',
  description:
    'Quản lý thời gian biểu khám tại nhà, lịch tư vấn từ xa và hạn mức bệnh nhân quản nhiệm của bác sĩ gia đình.',
};

export default function DoctorTimetablePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <DoctorTimetableView />
    </Suspense>
  );
}


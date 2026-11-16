import React, { Suspense } from 'react';
import { DoctorVerificationView } from '@/features/doctor-verification';

export const instant = false;

export const metadata = {
  title: 'Nộp Chứng chỉ Hành nghề Y tế (CCHN) | FamiDoc Doctor',
  description: 'Bác sĩ tải lên văn bằng và chứng chỉ hành nghề y để thực hiện quy trình thẩm định 2 tầng',
};

export default function DoctorCredentialsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <DoctorVerificationView />
    </Suspense>
  );
}

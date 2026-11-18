import React, { Suspense } from 'react';
import { AdminMatchingConfigView } from '@/features/admin-matching-config';

export const metadata = {
  title: 'Cấu hình Model Decision System One | FamiDoc Admin',
  description:
    'Quản trị endpoint, model decision chuẩn /v1/systemone và trọng số ghép nối Track B tại runtime',
};

export default function AdminMatchingConfigPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <AdminMatchingConfigView />
    </Suspense>
  );
}

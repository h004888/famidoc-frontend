import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { AdminTrainingView } from '@/features/admin-training';

export const metadata: Metadata = {
  title: 'Đăng & Quản lý Đào tạo (Training) | FamiDoc Admin',
  description: 'Trang quản trị đăng mới, chỉnh sửa và xuất bản các khóa học đào tạo CME & quy trình FamiDoc.',
};

export default function AdminTrainingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 text-xs text-muted-foreground">
          Đang tải phân hệ Đào tạo...
        </div>
      }
    >
      <AdminTrainingView />
    </Suspense>
  );
}

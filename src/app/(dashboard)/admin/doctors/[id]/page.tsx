import React, { Suspense } from 'react';
import { AdminDoctorDetailView } from '@/features/admin-doctors';

export const instant = false;

export const metadata = {
  title: 'Chi tiết & Thẩm định CCHN Bác sĩ | FamiDoc Admin',
  description: 'Thẩm định hồ sơ chứng chỉ hành nghề và kích hoạt tài khoản bác sĩ theo Flow 2.1',
};

interface AdminDoctorDetailPageProps {
  params: Promise<{ id: string }>;
}

async function AdminDoctorDetailPageContent({ params }: AdminDoctorDetailPageProps) {
  const { id } = await params;
  return <AdminDoctorDetailView doctorId={id} />;
}

export default function AdminDoctorDetailPage({ params }: AdminDoctorDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <AdminDoctorDetailPageContent params={params} />
    </Suspense>
  );
}

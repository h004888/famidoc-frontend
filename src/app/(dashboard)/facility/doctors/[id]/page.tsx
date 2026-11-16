import React, { Suspense } from 'react';
import { FacilityDoctorDetailView } from '@/features/facility-staff';

export const instant = false;

export const metadata = {
  title: 'Thẩm định Hồ sơ Bác sĩ (Tầng 1 - CSYT) | Cơ Sở Y Tế FamiDoc',
  description: 'Cơ sở Y tế thẩm định tính xác thực của CCHN và hồ sơ bác sĩ trực thuộc theo Flow 2.1',
};

interface FacilityDoctorDetailPageProps {
  params: Promise<{ id: string }>;
}

async function FacilityDoctorDetailPageContent({ params }: FacilityDoctorDetailPageProps) {
  const { id } = await params;
  return <FacilityDoctorDetailView doctorId={id} />;
}

export default function FacilityDoctorDetailPage({ params }: FacilityDoctorDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <FacilityDoctorDetailPageContent params={params} />
    </Suspense>
  );
}

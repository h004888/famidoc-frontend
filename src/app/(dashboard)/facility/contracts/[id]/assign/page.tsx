import React, { Suspense } from 'react';
import { FacilityDoctorAssignView } from '@/features/facility-coordination';

export const instant = false;

export const metadata = {
  title: 'Phân công Bác sĩ Gia đình & Ký số CSYT | FamiDoc',
  description: 'Chỉ định bác sĩ gia đình phụ trách theo định biên quota và ký số hợp đồng 4 bên',
};

interface FacilityDoctorAssignPageProps {
  params: Promise<{ id: string }>;
}

async function FacilityDoctorAssignPageContent({ params }: FacilityDoctorAssignPageProps) {
  const { id } = await params;
  return <FacilityDoctorAssignView contractId={id} />;
}

export default function FacilityDoctorAssignPage({ params }: FacilityDoctorAssignPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#2E37A4]/20 border-t-[#2E37A4] rounded-full animate-spin" />
        </div>
      }
    >
      <FacilityDoctorAssignPageContent params={params} />
    </Suspense>
  );
}

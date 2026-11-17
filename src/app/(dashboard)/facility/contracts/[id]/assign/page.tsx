import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';

export const instant = false;

interface LegacyFacilityAssignRedirectProps {
  params: Promise<{ id: string }>;
}

async function LegacyFacilityAssignRedirectContent({
  params,
}: LegacyFacilityAssignRedirectProps) {
  const { id } = await params;
  return redirect(`/facility/coordination/${id}`);
}

export default function FacilityDoctorAssignPage({
  params,
}: LegacyFacilityAssignRedirectProps) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-[300px] items-center justify-center bg-[#f6f7f9] text-sm text-[#4a4f63]"
        >
          Đang chuyển hướng tới trang Hợp đồng Y tế 4 bên...
        </div>
      }
    >
      <LegacyFacilityAssignRedirectContent params={params} />
    </Suspense>
  );
}

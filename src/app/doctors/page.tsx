import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DoctorDirectoryView } from '@/features/doctors';
import { LandingFloatingActions } from '@/features/landing';

export const metadata: Metadata = {
  title: 'Đội ngũ Bác sĩ Gia đình & Chuyên gia Y tế | FamiDoc Pro',
  description:
    'Tra cứu danh bạ hơn 1.200 bác sĩ gia đình có chứng chỉ hành nghề Bộ Y Tế, đặt lịch thăm khám tận nhà và tư vấn Telehealth trực tuyến 24/7 cùng chuyên gia FamiDoc Pro.',
};

/**
 * Đọc `searchParams.packageId` bên trong `<Suspense>` để phần vỏ trang vẫn được
 * prerender tĩnh, chỉ phần phụ thuộc query string được stream ở thời điểm request.
 */
async function DoctorsDirectoryWithSearchParams({
  searchParams,
}: {
  searchParams: Promise<{ packageId?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawPackageId = resolvedSearchParams?.packageId;
  const packageId = Array.isArray(rawPackageId) ? rawPackageId[0] : rawPackageId;

  return <DoctorDirectoryView packageId={packageId ?? null} />;
}

export default function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ packageId?: string | string[] }>;
}) {
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <DoctorsDirectoryWithSearchParams searchParams={searchParams} />
      </Suspense>
      <LandingFloatingActions />
    </>
  );
}

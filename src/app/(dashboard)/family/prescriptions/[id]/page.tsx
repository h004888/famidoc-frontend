import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FamilyPrescriptionDetailView } from '@/features/prescriptions/components/family-prescriptions-view';

export const metadata: Metadata = { title: 'Chi tiết đơn thuốc | FamiDoc' };

type PageProps = { params: Promise<{ id: string }> };

async function PrescriptionDetailContent({ params }: PageProps) {
  const { id } = await params;
  return <FamilyPrescriptionDetailView key={id} id={id} />;
}

export default function FamilyPrescriptionDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<p role="status" className="p-6 text-sm">Đang tải đơn thuốc…</p>}>
      <PrescriptionDetailContent {...props} />
    </Suspense>
  );
}

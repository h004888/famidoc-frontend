import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FamilyPrescriptionsView } from '@/features/prescriptions/components/family-prescriptions-view';

export const metadata: Metadata = { title: 'Đơn thuốc | FamiDoc' };

type PageProps = { searchParams: Promise<{ patientId?: string | string[] }> };

async function PrescriptionsPageContent({ searchParams }: PageProps) {
  const { patientId } = await searchParams;
  const filter = typeof patientId === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(patientId)
    ? patientId : undefined;
  return <FamilyPrescriptionsView key={filter ?? 'all'} patientId={filter} />;
}

export default function FamilyPrescriptionsPage(props: PageProps) {
  return (
    <Suspense fallback={<p role="status" className="p-6 text-sm">Đang tải đơn thuốc…</p>}>
      <PrescriptionsPageContent {...props} />
    </Suspense>
  );
}

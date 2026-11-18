import { Suspense } from 'react';
import type { Metadata } from 'next';
import { MedicalBookView } from '@/features/prescriptions/components/medical-book-view';

export const metadata: Metadata = { title: 'Sổ khám gia đình | FamiDoc' };

type PageProps = { searchParams: Promise<{ patientId?: string | string[] }> };

async function MedicalBookContent({ searchParams }: PageProps) {
  const { patientId } = await searchParams;
  const initialPatientId =
    typeof patientId === 'string' ? patientId : undefined;
  return (
    <MedicalBookView
      key={initialPatientId}
      doctor={false}
      initialPatientId={initialPatientId}
    />
  );
}

export default function FamilyMedicalBookPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-6 text-sm">
          Đang tải sổ khám…
        </p>
      }
    >
      <MedicalBookContent {...props} />
    </Suspense>
  );
}

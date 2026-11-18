import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DoctorEncountersView } from '@/features/doctor-encounters';

export const metadata: Metadata = {
  title: 'Sổ khám và kê đơn | FamiDoc',
  description: 'Xem lịch sử và ghi nhận lần khám cho từng thành viên.',
};

type Props = { searchParams: Promise<{ encounterId?: string; patientId?: string }> };

async function DoctorEncountersContent({ searchParams }: Props) {
  const { encounterId, patientId } = await searchParams;
  return (
    <DoctorEncountersView
      encounterId={typeof encounterId === 'string' ? encounterId.trim() : undefined}
      patientId={typeof patientId === 'string' ? patientId.trim() || undefined : undefined}
    />
  );
}

export default function DoctorEncountersPage(props: Props) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Đang tải hồ sơ khám...</div>}>
      <DoctorEncountersContent {...props} />
    </Suspense>
  );
}

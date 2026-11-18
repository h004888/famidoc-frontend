import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingSummaryStep } from '@/features/booking';

export const metadata: Metadata = {
  title: 'Xác Nhận Gói & Khởi Tạo Hợp Đồng 4 Bên | FamiDoc Pro',
  description:
    'Xác nhận 1 bác sĩ gia đình, cơ sở y tế phụ trách và thành viên trước khi khởi tạo hợp đồng y tế điện tử 4 bên.',
};

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

function readParam(
  params: { [key: string]: string | string[] | undefined },
  key: string
): string | undefined {
  const raw = params[key];
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : undefined;
}

async function FamilySubscriptionNewLoader({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawMembers = readParam(params, 'members');
  const parsedMembers = rawMembers !== undefined ? Number(rawMembers) : undefined;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <BookingSummaryStep
        packageId={readParam(params, 'packageId')}
        doctorId={readParam(params, 'doctorId')}
        facilityId={readParam(params, 'facilityId')}
        matchSessionId={readParam(params, 'matchSessionId')}
        queueId={readParam(params, 'queueId')}
        contractId={readParam(params, 'contractId')}
        requestedMembers={
          parsedMembers !== undefined && Number.isFinite(parsedMembers)
            ? Math.trunc(parsedMembers)
            : undefined
        }
        trackingPath="/family/subscription/tracking"
      />
    </main>
  );
}

export default function FamilySubscriptionNewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8 text-slate-500 font-sans text-xs">
          Đang tải thông tin xác nhận gói chăm sóc...
        </div>
      }
    >
      <FamilySubscriptionNewLoader searchParams={searchParams} />
    </Suspense>
  );
}

import { Suspense } from 'react';
import { BookingTrackingStep } from '@/features/booking/components/booking-tracking-step';

type BookingSearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

async function BookingSignLoader({
  searchParams,
}: {
  searchParams: BookingSearchParams;
}) {
  const params = await searchParams;
  const contractId = readParam(params, 'contractId');
  return <BookingTrackingStep contractId={contractId} />;
}

export default function BookingSignPage({
  searchParams,
}: {
  searchParams: BookingSearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Đang tải khung ký hợp đồng điện tử...
        </div>
      }
    >
      <BookingSignLoader searchParams={searchParams} />
    </Suspense>
  );
}

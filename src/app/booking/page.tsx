import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingSummaryStep } from '@/features/booking';

export const metadata: Metadata = {
  title: 'Xác nhận gói chăm sóc | FamiDoc',
  description:
    'Xác nhận bác sĩ gia đình, gói chăm sóc và số suất thành viên trước khi khởi tạo hợp đồng 4 bên.',
};

type BookingSearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

function readParam(
  params: { [key: string]: string | string[] | undefined },
  key: string
): string | undefined {
  const raw = params[key];
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : undefined;
}

/**
 * Đọc `searchParams` bên trong boundary `<Suspense>` để tương thích
 * `cacheComponents: true` + `partialPrefetching: true` của Next.js.
 */
async function BookingSummaryLoader({
  searchParams,
}: {
  searchParams: BookingSearchParams;
}) {
  const params = await searchParams;
  const rawMembers = readParam(params, 'members');
  const parsedMembers = rawMembers !== undefined ? Number(rawMembers) : undefined;

  return (
    <BookingSummaryStep
      packageId={readParam(params, 'packageId')}
      doctorId={readParam(params, 'doctorId')}
      facilityId={readParam(params, 'facilityId')}
      contractId={readParam(params, 'contractId')}
      requestedMembers={
        parsedMembers !== undefined && Number.isFinite(parsedMembers)
          ? Math.trunc(parsedMembers)
          : undefined
      }
    />
  );
}

function BookingSummaryFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3"
    >
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <p className="text-xs font-medium text-slate-500">
        Đang tải thông tin gói chăm sóc...
      </p>
    </div>
  );
}

export default function BookingSummaryPage({
  searchParams,
}: {
  searchParams: BookingSearchParams;
}) {
  return (
    <Suspense fallback={<BookingSummaryFallback />}>
      <BookingSummaryLoader searchParams={searchParams} />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingPaymentStep } from '@/features/booking';

export const metadata: Metadata = {
  title: 'Thanh toán VietQR kích hoạt gói | FamiDoc',
  description:
    'Thanh toán VietQR để kích hoạt hợp đồng 4 bên và mở khóa Bảng điều khiển Gia đình.',
};

type BookingSearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

function readContractId(
  params: { [key: string]: string | string[] | undefined }
): string | undefined {
  const raw = params.contractId;
  return typeof raw === 'string' && raw.trim().length > 0
    ? raw.trim()
    : undefined;
}

/**
 * Đọc `searchParams` bên trong boundary `<Suspense>` để tương thích
 * `cacheComponents: true` + `partialPrefetching: true` của Next.js.
 */
async function BookingPaymentLoader({
  searchParams,
}: {
  searchParams: BookingSearchParams;
}) {
  const params = await searchParams;
  return <BookingPaymentStep contractId={readContractId(params)} />;
}

function BookingPaymentFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3"
    >
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <p className="text-xs font-medium text-slate-500">
        Đang khởi tạo mã thanh toán VietQR...
      </p>
    </div>
  );
}

export default function BookingPaymentPage({
  searchParams,
}: {
  searchParams: BookingSearchParams;
}) {
  return (
    <Suspense fallback={<BookingPaymentFallback />}>
      <BookingPaymentLoader searchParams={searchParams} />
    </Suspense>
  );
}

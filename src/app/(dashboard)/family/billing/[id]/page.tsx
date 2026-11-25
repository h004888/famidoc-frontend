import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FamilyBillingDetailView } from '@/features/billing';

export const metadata: Metadata = {
  title: 'Chi tiết Hóa đơn & Biên lai | FamiDoc Pro',
  description: 'Chi tiết biên lai thanh toán và chứng từ giao dịch VietQR của hộ gia đình.',
};

export default async function FamilyBillingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-500">
          Đang tải chi tiết hóa đơn…
        </div>
      }
    >
      <FamilyBillingDetailView invoiceId={id} />
    </Suspense>
  );
}

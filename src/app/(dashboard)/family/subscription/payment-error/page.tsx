import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { PaymentFailureRetryView } from '@/features/subscription-contract';

export const metadata: Metadata = {
  title: 'Xử Lý Lỗi Thanh Toán VietQR | FamiDoc Family',
  description:
    'Hướng dẫn khắc phục và đối soát lỗi giao dịch VietQR thanh toán hợp đồng 4 bên FamiDoc.',
};

export default function PaymentErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          Đang tải thông tin giao dịch lỗi...
        </div>
      }
    >
      <PaymentFailureRetryView />
    </Suspense>
  );
}

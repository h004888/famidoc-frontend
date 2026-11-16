import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FamilyBillingView } from '@/features/billing';

export const metadata: Metadata = {
  title: 'Thanh Toán VietQR & Biên Lai Thu Tiền Điện Tử | FamiDoc Pro',
  description:
    'Thanh toán phí dịch vụ chăm sóc sức khỏe gia đình qua mã VietQR chuẩn Napas 24/7 và tải hóa đơn điện tử.',
};

export default function FamilyBillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#2E37A4]/20 border-t-[#2E37A4] rounded-full animate-spin" />
        </div>
      }
    >
      <FamilyBillingView />
    </Suspense>
  );
}


import type { Metadata } from 'next';
import { FamilyBillingView } from '@/features/billing';

export const metadata: Metadata = {
  title: 'Thanh Toán VietQR & Biên Lai Thu Tiền Điện Tử | FamiDoc Pro',
  description:
    'Thanh toán phí dịch vụ chăm sóc sức khỏe gia đình qua mã VietQR chuẩn Napas 24/7 và tải hóa đơn điện tử.',
};

export default function FamilyBillingPage() {
  return <FamilyBillingView />;
}


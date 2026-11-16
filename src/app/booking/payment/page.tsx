import type { Metadata } from 'next';
import { BookingPaymentStep } from '@/features/booking';

export const metadata: Metadata = {
  title: 'Thanh toán VietQR kích hoạt gói | FamiDoc',
  description:
    'Thanh toán VietQR để kích hoạt hợp đồng 4 bên và mở khóa Bảng điều khiển Gia đình.',
};

export default async function BookingPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rawContractId = params.contractId;
  const contractId =
    typeof rawContractId === 'string' && rawContractId.trim().length > 0
      ? rawContractId.trim()
      : undefined;

  return <BookingPaymentStep contractId={contractId} />;
}

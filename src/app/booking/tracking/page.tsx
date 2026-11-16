import type { Metadata } from 'next';
import { BookingTrackingStep } from '@/features/booking';

export const metadata: Metadata = {
  title: 'Theo dõi ký hợp đồng 4 bên | FamiDoc',
  description:
    'Theo dõi tiến trình ký số Documenso 4 bên và chuyển sang bước thanh toán VietQR kích hoạt gói.',
};

export default async function BookingTrackingPage({
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

  return <BookingTrackingStep contractId={contractId} />;
}

import type { Metadata } from 'next';
import { SubscriptionContractView } from '@/features/subscription-contract';

export const metadata: Metadata = {
  title: 'Gói Dịch Vụ & Hợp Đồng Điện Tử 4 Bên | FamiDoc Pro',
  description:
    'Quản lý gói dịch vụ chăm sóc sức khỏe gia đình, hạn mức lượt khám và hợp đồng y tế 4 bên có chữ ký số điện tử hợp pháp.',
};

export default function FamilySubscriptionPage() {
  return <SubscriptionContractView />;
}


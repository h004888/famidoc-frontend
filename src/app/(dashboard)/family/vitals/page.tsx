import type { Metadata } from 'next';
import { ChronicCareView } from '@/features/chronic-care';

export const metadata: Metadata = {
  title: 'Theo Dõi Chỉ Số Sức Khỏe Mạn Tính & Cảnh Báo | FamiDoc Pro',
  description:
    'Theo dõi biến thiên chỉ số sinh tồn (Huyết áp, Đường huyết, SpO2), cảnh báo sớm và liên hệ bác sĩ gia đình hội chẩn 24/7.',
};

export default function FamilyVitalsPage() {
  return <ChronicCareView />;
}


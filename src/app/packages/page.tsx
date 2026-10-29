import { Metadata } from 'next';
import { PackagesCatalogView } from '@/features/packages';
import { LandingFloatingActions } from '@/features/landing';

export const metadata: Metadata = {
  title: 'Tra Cứu Gói Chăm Sóc Sức Khỏe Gia Đình | FamiDoc Pro',
  description: 'Tìm kiếm, so sánh và đăng ký các gói dịch vụ bác sĩ gia đình FamiDoc Pro chuẩn Bộ Y Tế & WONCA.',
};

export default function PackagesPage() {
  return (
    <>
      <PackagesCatalogView />
      <LandingFloatingActions />
    </>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import FamilyContractOnboardingView from '@/features/subscription-contract/components/family-contract-onboarding-view';

export const metadata: Metadata = {
  title: 'Đăng Ký Bác Sĩ Gia Đình & Ký Hợp Đồng Y Tế 4 Bên | FamiDoc Pro',
  description:
    'Quy trình chọn Bác sĩ gia đình uy tín, chọn gói chăm sóc sức khỏe và ký kết hợp đồng y tế điện tử 4 bên theo chuẩn Bộ Y Tế.',
};

export default function FamilySubscriptionNewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8 text-slate-500 font-sans">
          Đang khởi tạo quy trình chọn Bác sĩ &amp; Gói chăm sóc...
        </div>
      }
    >
      <FamilyContractOnboardingView />
    </Suspense>
  );
}

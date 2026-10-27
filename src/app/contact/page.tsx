import type { Metadata } from 'next';
import { ContactView } from '@/features/contact';

export const metadata: Metadata = {
  title: 'Liên Hệ & Đăng Ký Tư Vấn Gói Dịch Vụ | FamiDoc Pro',
  description:
    'Gửi yêu cầu đăng ký tư vấn gói chăm sóc sức khỏe gia đình FamiDoc Pro. Đội ngũ bác sĩ chuyên khoa sẵn sàng liên hệ và hỗ trợ 24/7.',
};

export default function ContactPage() {
  return <ContactView />;
}

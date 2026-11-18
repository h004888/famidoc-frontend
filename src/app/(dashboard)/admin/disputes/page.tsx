import { AdminDisputesView } from '@/features/admin-disputes';

export const metadata = {
  title: 'Xử lý khiếu nại | FamiDoc Admin',
  description: 'Tiếp nhận và xử lý khiếu nại do gia đình hoặc bác sĩ gửi.',
};

export default function AdminDisputesPage() {
  return <AdminDisputesView />;
}


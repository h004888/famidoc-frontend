import type { Metadata } from 'next';
import { FamilyFeedbackView } from '@/features/family-feedback';

export const metadata: Metadata = {
  title: 'Đánh Giá Bác Sĩ & Khiếu Nại Dịch Vụ | FamiDoc Pro',
  description:
    'Đánh giá chất lượng bác sĩ sau mỗi ca khám và gửi phản ánh, khiếu nại dịch vụ bảo đảm quyền lợi hộ gia đình theo chuẩn SLA.',
};

export default function FamilyFeedbackPage() {
  return <FamilyFeedbackView />;
}

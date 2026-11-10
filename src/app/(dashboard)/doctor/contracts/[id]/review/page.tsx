import { DoctorContractReviewView } from '@/features/doctor-dashboard';

export const metadata = {
  title: 'Thẩm định Hồ sơ Chăm sóc & Ký số Y khoa | FamiDoc',
  description: 'Bác sĩ gia đình xem Care Needs Summary và thực hiện ký số điện tử chấp thuận chuyên môn hợp đồng 4 bên',
};

interface DoctorContractReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function DoctorContractReviewPage({ params }: DoctorContractReviewPageProps) {
  const { id } = await params;
  return <DoctorContractReviewView contractId={id} />;
}

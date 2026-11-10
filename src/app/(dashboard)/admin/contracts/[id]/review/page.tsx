import { AdminFourPartyReviewView } from '@/features/admin-contracts';

export const metadata = {
  title: 'Thẩm định Hồ sơ Hợp đồng 4 Bên & Ký số Duyệt Platform | FamiDoc Admin',
  description: 'Admin nền tảng thẩm định chi tiết snapshot hồ sơ gia đình và ký duyệt điện tử hợp đồng chăm sóc sức khỏe 4 bên',
};

interface AdminFourPartyReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminFourPartyReviewPage({ params }: AdminFourPartyReviewPageProps) {
  const { id } = await params;
  return <AdminFourPartyReviewView contractId={id} />;
}

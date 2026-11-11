import { AdminReconciliationView } from '@/features/admin-contracts';

export const metadata = {
  title: 'Đối Soát Giao Dịch SePay & Kích Hoạt Bù | FamiDoc Admin',
  description: 'Tra cứu log webhook chuyển khoản VietQR từ SePay và thực hiện kích hoạt bù hợp đồng 4 bên khi có sự cố mạng',
};

export default function AdminReconciliationPage() {
  return <AdminReconciliationView />;
}

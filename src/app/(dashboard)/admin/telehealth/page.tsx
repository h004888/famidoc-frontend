import { Metadata } from 'next';
import { AdminTelehealthView } from '@/features/admin-telehealth/components/admin-telehealth-view';

export const metadata: Metadata = {
  title: 'Giám sát Lịch khám Trực tuyến | FamiDoc Admin',
  description: 'Trung tâm giám sát và điều phối các phiên khám bệnh trực tuyến (Telehealth) giữa bác sĩ gia đình và bệnh nhân trên toàn hệ thống FamiDoc.',
};

export default function AdminTelehealthPage() {
  return <AdminTelehealthView />;
}

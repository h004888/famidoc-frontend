import { Metadata } from 'next';
import { AdminTelehealthView } from '@/features/admin-telehealth/components/admin-telehealth-view';

export const metadata: Metadata = {
  title: 'Giám sát lịch khám | FamiDoc Admin',
  description: 'Theo dõi lịch khám, bác sĩ phụ trách và trạng thái các ca khám trên FamiDoc.',
};

export default function AdminTelehealthPage() {
  return <AdminTelehealthView />;
}

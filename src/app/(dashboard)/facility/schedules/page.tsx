import { FacilityCoordinationView } from '@/features/facility-coordination';

export const metadata = {
  title: 'Điều phối Lịch Khám Bác sĩ | Cơ sở Y tế FamiDoc',
  description:
    'Theo dõi lịch khám ngoại viện tại nhà của đội ngũ bác sĩ, phê duyệt yêu cầu đổi lịch 3 bên và chủ động điều phối lịch tới gia đình.',
};

export default function FacilitySchedulesPage() {
  return <FacilityCoordinationView />;
}

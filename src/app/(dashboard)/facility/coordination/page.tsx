import { FacilityCoordinationHub } from '@/features/facility-coordination';

export const metadata = {
  title: 'Điều phối & Hợp đồng Y tế | Cơ sở Y tế FamiDoc',
  description:
    'Rà soát hợp đồng y tế 4 bên, phân ca trực nội viện và giám sát lịch khám ngoại viện của bác sĩ thuộc Cơ sở Y tế.',
};

export default function FacilityCoordinationPage() {
  return <FacilityCoordinationHub />;
}

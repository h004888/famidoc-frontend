import { FacilityDoctorAssignView } from '@/features/facility-coordination';

export const metadata = {
  title: 'Phân công Bác sĩ Gia đình & Ký số CSYT | FamiDoc',
  description: 'Chỉ định bác sĩ gia đình phụ trách theo định biên quota và ký số hợp đồng 4 bên',
};

interface FacilityDoctorAssignPageProps {
  params: Promise<{ id: string }>;
}

export default async function FacilityDoctorAssignPage({ params }: FacilityDoctorAssignPageProps) {
  const { id } = await params;
  return <FacilityDoctorAssignView contractId={id} />;
}

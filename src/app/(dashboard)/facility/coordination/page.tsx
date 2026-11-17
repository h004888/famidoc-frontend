import { FacilityContractInboundView } from '@/features/facility-coordination';

export const metadata = {
  title: 'Hợp đồng Y tế 4 bên | Cơ sở Y tế FamiDoc',
  description:
    'Rà soát thông tin hộ gia đình, bác sĩ đã chọn và ký số hợp đồng y tế 4 bên trên Documenso dành cho Cơ sở Y tế.',
};

export default function FacilityCoordinationPage() {
  return <FacilityContractInboundView />;
}

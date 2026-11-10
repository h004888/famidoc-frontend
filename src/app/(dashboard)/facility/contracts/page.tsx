import { FacilityContractInboundView } from '@/features/facility-coordination';

export const metadata = {
  title: 'Hợp đồng 4 Bên Tiếp Nhận | Cơ Sở Y Tế FamiDoc',
  description: 'Tiếp nhận, phân công bác sĩ gia đình và ký số hợp đồng chăm sóc sức khỏe ban đầu',
};

export default function FacilityContractsPage() {
  return <FacilityContractInboundView />;
}

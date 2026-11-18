import { AdminDisputesView } from '@/features/admin-disputes/components/admin-disputes-view';

export const metadata = { title: 'Khiếu nại | Cơ sở y tế FamiDoc' };

export default function FacilityComplaintsPage() {
  return <AdminDisputesView facility />;
}

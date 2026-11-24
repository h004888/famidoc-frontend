import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Quản lý Hợp đồng | Cơ sở Y tế FamiDoc',
  description:
    'Chuyển hướng về trang Quản lý Hợp đồng tập trung của Cơ sở Y tế.',
};

export default function FacilityCoordinationPage() {
  redirect('/facility/contracts?type=FOUR_PARTY');
}

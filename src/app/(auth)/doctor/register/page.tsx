import { redirect } from 'next/navigation';

export default function DoctorRegisterRedirectPage() {
  redirect('/doctor/login?from=provisioned-only');
}

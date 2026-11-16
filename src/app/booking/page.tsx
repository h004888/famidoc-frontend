import type { Metadata } from 'next';
import { BookingSummaryStep } from '@/features/booking';

export const metadata: Metadata = {
  title: 'Xác nhận gói chăm sóc | FamiDoc',
  description:
    'Xác nhận bác sĩ gia đình, gói chăm sóc và số suất thành viên trước khi khởi tạo hợp đồng 4 bên.',
};

function readParam(
  params: { [key: string]: string | string[] | undefined },
  key: string
): string | undefined {
  const raw = params[key];
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : undefined;
}

export default async function BookingSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rawMembers = readParam(params, 'members');
  const parsedMembers = rawMembers !== undefined ? Number(rawMembers) : undefined;

  return (
    <BookingSummaryStep
      packageId={readParam(params, 'packageId')}
      doctorId={readParam(params, 'doctorId')}
      facilityId={readParam(params, 'facilityId')}
      contractId={readParam(params, 'contractId')}
      requestedMembers={
        parsedMembers !== undefined && Number.isFinite(parsedMembers)
          ? Math.trunc(parsedMembers)
          : undefined
      }
    />
  );
}

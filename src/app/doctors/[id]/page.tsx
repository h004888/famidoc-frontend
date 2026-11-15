import { Suspense } from 'react';
import { Metadata } from 'next';
import { getDoctorDetail, DoctorDetailPageContent } from './doctor-detail-loader';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const doctor = await getDoctorDetail(id);
    const doctorTitle = doctor?.academicTitle
      ? `${doctor.academicTitle} ${doctor.doctorName}`
      : doctor?.doctorName || `Chuyên gia ${id}`;

    return {
      title: `${doctorTitle} | FamiDoc Pro`,
      description:
        doctor?.bio ||
        `Xem chi tiết tiểu sử chuyên môn, chứng chỉ hành nghề Bộ Y Tế, bằng cấp và đặt lịch khám cùng chuyên gia ${doctorTitle}.`,
    };
  } catch {
    return {
      title: 'Hồ Sơ Bác Sĩ & Chuyên Gia Y Tế | FamiDoc Pro',
      description: `Xem chi tiết tiểu sử chuyên môn, chứng chỉ hành nghề Bộ Y Tế, bằng cấp và đặt lịch khám cùng chuyên gia ${id}.`,
    };
  }
}

export default function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0046c0]/20 border-t-[#0046c0] rounded-full animate-spin" />
        </div>
      }
    >
      <DoctorDetailPageContent params={params} />
    </Suspense>
  );
}

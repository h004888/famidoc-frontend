import { Suspense, cache } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DoctorDetailView } from '@/features/doctors';
import { ServerAuthSessionBoundary } from '@/features/auth/components/server-auth-session-boundary';
import { publicApi, type PublicDoctorDetailDto } from '@/lib/api/public.api';
import { ApiError } from '@/lib/http/errors';

export const getDoctorDetail = cache(
  (() => {
    const inFlight = new Map<string, Promise<PublicDoctorDetailDto>>();

    return (id: string): Promise<PublicDoctorDetailDto> => {
      const existing = inFlight.get(id);
      if (existing) {
        return existing;
      }

      const pending = publicApi
        .getDoctorDetail(id)
        .finally(() => inFlight.delete(id));
      inFlight.set(id, pending);
      return pending;
    };
  })()
);

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

export async function DoctorDetailPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let doctor: PublicDoctorDetailDto | null = null;

  try {
    doctor = await getDoctorDetail(id);
  } catch (error) {
    console.error('[DoctorDetailPageContent] Failed to load doctor detail:', id, error);
    if (error instanceof ApiError && error.status >= 500) {
      throw error;
    }
    notFound();
  }

  if (!doctor || !doctor.id) {
    notFound();
  }

  return <DoctorDetailView initialDoctor={doctor} />;
}

export default function DoctorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ packageId?: string | string[] }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0046c0]/20 border-t-[#0046c0] rounded-full animate-spin" />
        </div>
      }
    >
      <ServerAuthSessionBoundary>
        <DoctorDetailPageContent params={params} />
      </ServerAuthSessionBoundary>
    </Suspense>
  );
}

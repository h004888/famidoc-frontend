import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { DoctorDetailView, type Facility } from '@/features/doctors';
import { publicApi, type PublicDoctorDetailDto } from '@/lib/api/public.api';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const doctor = await publicApi.getDoctorDetail(id);
    const doctorTitle = doctor?.academicTitle
      ? `${doctor.academicTitle} ${doctor.doctorName}`
      : doctor?.doctorName || doctor?.fullName || `Chuyên gia ${id}`;

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
  let facilityItem: Facility | null = null;

  try {
    doctor = await publicApi.getDoctorDetail(id);
  } catch {
    try {
      const facilityDetail = await publicApi.getFacilityDetail(id);
      if (facilityDetail && facilityDetail.id) {
        const rawAddr = facilityDetail.address || '';
        const detectedCity =
          rawAddr.toLowerCase().includes('hà nội') || rawAddr.toLowerCase().includes('ha noi')
            ? 'Hà Nội'
            : rawAddr.toLowerCase().includes('đà nẵng') || rawAddr.toLowerCase().includes('da nang')
              ? 'Đà Nẵng'
              : 'TP. Hồ Chí Minh';
        const displayName = facilityDetail.facilityName || facilityDetail.facility_name || facilityDetail.name || 'Cơ sở y tế';
        facilityItem = {
          id: facilityDetail.id,
          name: displayName,
          facility_name: displayName,
          type: 'Bệnh viện Tuyến Trung Ương',
          address: rawAddr,
          city: detectedCity,
          phone: facilityDetail.phone || facilityDetail.hotline || '1900 6868',
          hotline: facilityDetail.phone || facilityDetail.hotline || '1900 6868',
          workingHours: '24/7 (Cấp cứu & Ngoại trú)',
          imageUrl: (facilityDetail.imageUrl as string) || '/images/medsev/home-one/4.jpg',
          specialties: ['Nội Tổng Quát', 'Lão Khoa', 'Nhi Khoa'],
          privileges: ['Ưu tiên luồng khám Fast-Track', 'Bảo lãnh viện phí trực tiếp'],
          bedCount: '500+ giường',
        };
      } else {
        const facilities = await publicApi.getFacilities();
        const cleanId = (id || '').trim().toLowerCase();
        const found = Array.isArray(facilities)
          ? facilities.find((f) => (f.id || '').toLowerCase() === cleanId)
          : undefined;

        if (found) {
          const rawAddr = found.address || '';
          const detectedCity =
            rawAddr.toLowerCase().includes('hà nội') || rawAddr.toLowerCase().includes('ha noi')
              ? 'Hà Nội'
              : rawAddr.toLowerCase().includes('đà nẵng') || rawAddr.toLowerCase().includes('da nang')
                ? 'Đà Nẵng'
                : 'TP. Hồ Chí Minh';
          const displayName = found.facilityName || found.facility_name || found.name || 'Cơ sở y tế';
          facilityItem = {
            id: found.id,
            name: displayName,
            facility_name: displayName,
            type: 'Bệnh viện Tuyến Trung Ương',
            address: rawAddr,
            city: detectedCity,
            phone: found.phone || found.hotline || '1900 6868',
            hotline: found.phone || found.hotline || '1900 6868',
            workingHours: '24/7 (Cấp cứu & Ngoại trú)',
            imageUrl: (found.imageUrl as string) || '/images/medsev/home-one/4.jpg',
            specialties: ['Nội Tổng Quát', 'Lão Khoa', 'Nhi Khoa'],
            privileges: ['Ưu tiên luồng khám Fast-Track', 'Bảo lãnh viện phí trực tiếp'],
            bedCount: '500+ giường',
          };
        }
      }
    } catch {}
  }

  if (!doctor && !facilityItem) {
    notFound();
  }

  if (facilityItem) {
    redirect(`/facilities/${id}`);
  }

  return <DoctorDetailView id={id} initialDoctor={doctor} />;
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

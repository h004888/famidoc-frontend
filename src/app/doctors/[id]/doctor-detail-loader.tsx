import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { DoctorDetailView, type Facility } from '@/features/doctors';
import { publicApi, type PublicDoctorDetailDto } from '@/lib/api/public.api';

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

export async function DoctorDetailPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let doctor: PublicDoctorDetailDto | null = null;
  let facilityItem: Facility | null = null;

  try {
    doctor = await getDoctorDetail(id);
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

  return <DoctorDetailView initialDoctor={doctor} />;
}

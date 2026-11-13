import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FacilityDetailView } from '@/features/facilities';
import { publicApi, type PublicFacilityDto } from '@/lib/api';
import type { Facility } from '@/features/doctors';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const detail = await publicApi.getFacilityDetail(id);
    if (detail && detail.id) {
      const name = detail.facilityName || detail.name || `Cơ sở y tế ${id}`;
      return {
        title: `${name} | Mạng Lưới FamiDoc Pro`,
        description: `Thông tin chi tiết, quy mô giường bệnh, chuyên khoa và chính sách khám ưu tiên Fast-Track tại ${name}.`,
      };
    }

    const facilities = await publicApi.getFacilities();
    const cleanId = (id || '').trim().toLowerCase();
    const found = Array.isArray(facilities)
      ? facilities.find((f: PublicFacilityDto) => (f.id || '').toLowerCase() === cleanId)
      : undefined;
    const name = found?.facilityName || found?.name || `Cơ sở y tế ${id}`;
    return {
      title: `${name} | Mạng Lưới FamiDoc Pro`,
      description: `Thông tin chi tiết, quy mô giường bệnh, chuyên khoa và chính sách khám ưu tiên Fast-Track tại ${name}.`,
    };
  } catch {
    return {
      title: 'Chi Tiết Cơ Sở Y Tế Đối Tác | FamiDoc Pro',
      description: 'Thông tin chi tiết cơ sở y tế đối tác trong hệ sinh thái FamiDoc.',
    };
  }
}

function mapDtoToFacility(dto: PublicFacilityDto): Facility {
  const rawAddr = dto.address || '';
  const detectedCity =
    rawAddr.toLowerCase().includes('hà nội') || rawAddr.toLowerCase().includes('ha noi')
      ? 'Hà Nội'
      : rawAddr.toLowerCase().includes('đà nẵng') || rawAddr.toLowerCase().includes('da nang')
        ? 'Đà Nẵng'
        : 'TP. Hồ Chí Minh';
  const displayName = dto.facilityName || dto.facility_name || dto.name || 'Cơ sở y tế đối tác';
  const displayPhone = dto.phone || dto.hotline || '1900 6868';
  const displayHotline = dto.hotline || dto.phone || '1900 6868';
  const displayLicense = dto.licenseNumber || dto.license_number || dto.operatingLicense;

  const determinedType =
    dto.type ||
    (displayName.toLowerCase().includes('quốc tế') || displayName.toLowerCase().includes('vinmec')
      ? 'Bệnh viện Đa Khoa Quốc Tế'
      : displayName.toLowerCase().includes('phòng khám') || displayName.toLowerCase().includes('clinic')
        ? 'Phòng khám Đa Khoa Kỹ Thuật Cao'
        : 'Bệnh viện Tuyến Trung Ương');

  const specialties =
    Array.isArray(dto.specialties) && dto.specialties.length > 0
      ? dto.specialties
      : ['Nội Tổng Quát', 'Lão Khoa', 'Nhi Khoa', 'Tim Mạch Can Thiệp'];

  const privileges =
    Array.isArray(dto.privileges) && dto.privileges.length > 0
      ? dto.privileges
      : [
        'Lối đi tiếp đón ưu tiên FamiDoc Fast-Track',
        'Bảo lãnh viện phí trực tiếp và liên thông BHYT',
        'Đồng bộ dữ liệu xét nghiệm vào Bệnh án điện tử EMR FamiDoc',
      ];

  const bedCount =
    dto.bedCount ||
    (dto as { bed_count?: string }).bed_count ||
    (displayName.toLowerCase().includes('phòng khám') ? 'Lưu viện ngắn hạn' : '500+ giường');

  const workingHours =
    dto.workingHours ||
    (dto as { working_hours?: string }).working_hours ||
    'Thứ 2 - Thứ 6: 06:30 - 16:30 | Thứ 7: 06:30 - 11:30 | Cấp cứu: 24/7';

  return {
    id: dto.id,
    name: displayName,
    facility_name: displayName,
    type: determinedType,
    tier: dto.tier,
    status: dto.status || 'ACTIVE',
    address: rawAddr || 'Địa chỉ liên kết hệ thống FamiDoc',
    city: detectedCity,
    phone: displayPhone,
    hotline: displayHotline,
    email: dto.email,
    websiteUrl: dto.websiteUrl || (dto as { website?: string }).website,
    workingHours,
    imageUrl: (dto.imageUrl as string) || (dto as { image_url?: string }).image_url || '/images/medsev/home-one/4.jpg',
    logoUrl: (dto.logoUrl as string) || (dto as { logo_url?: string }).logo_url,
    specialties,
    privileges,
    bedCount,
    license_number: typeof displayLicense === 'string' ? displayLicense : undefined,
    tax_code: typeof dto.taxCode === 'string' ? dto.taxCode : (typeof dto.tax_code === 'string' ? dto.tax_code : undefined),
    featuredDoctors: Array.isArray(dto.featuredDoctors) ? dto.featuredDoctors : undefined,
  };
}

async function FacilityDetailPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let facilityItem: Facility | null = null;

  try {
    const detail = await publicApi.getFacilityDetail(id);
    if (detail && detail.id) {
      facilityItem = mapDtoToFacility(detail);
    } else {
      const facilities = await publicApi.getFacilities();
      const cleanId = (id || '').trim().toLowerCase();
      const found = Array.isArray(facilities)
        ? facilities.find((f: PublicFacilityDto) => (f.id || '').toLowerCase() === cleanId)
        : undefined;

      if (found) {
        facilityItem = mapDtoToFacility(found);
      }
    }
  } catch {
    // Để client-side component tiếp tục fetch từ trình duyệt nếu SSR bị timeout/chặn mạng
  }

  return <FacilityDetailView id={id} initialFacility={facilityItem} />;
}

export default async function FacilityDetailPage({
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
      <FacilityDetailPageContent params={params} />
    </Suspense>
  );
}

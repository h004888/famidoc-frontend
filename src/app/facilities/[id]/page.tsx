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
      const rawAddr = detail.address || '';
      const detectedCity =
        rawAddr.toLowerCase().includes('hà nội') || rawAddr.toLowerCase().includes('ha noi')
          ? 'Hà Nội'
          : rawAddr.toLowerCase().includes('đà nẵng') || rawAddr.toLowerCase().includes('da nang')
            ? 'Đà Nẵng'
            : 'TP. Hồ Chí Minh';
      const displayName = detail.facilityName || detail.facility_name || detail.name || 'Cơ sở y tế đối tác';
      const displayPhone = detail.phone || detail.hotline || '1900 6868';
      const displayLicense = detail.licenseNumber || detail.license_number || detail.operatingLicense;

      facilityItem = {
        id: detail.id,
        name: displayName,
        facility_name: displayName,
        type: 'Bệnh viện Tuyến Trung Ương',
        address: rawAddr || 'Địa chỉ liên kết hệ thống FamiDoc',
        city: detectedCity,
        phone: displayPhone,
        hotline: displayPhone,
        license_number: typeof displayLicense === 'string' ? displayLicense : undefined,
        tax_code: typeof detail.taxCode === 'string' ? detail.taxCode : (typeof detail.tax_code === 'string' ? detail.tax_code : undefined),
        workingHours: '24/7 (Cấp cứu & Ngoại trú)',
        imageUrl: (detail.imageUrl as string) || '/images/medsev/home-one/4.jpg',
        specialties: ['Nội Tổng Quát', 'Lão Khoa', 'Nhi Khoa', 'Tim Mạch Can Thiệp'],
        privileges: [
          'Lối đi ưu tiên FamiDoc Fast-Track',
          'Liên thông dữ liệu bệnh án điện tử EMR',
          'Bảo lãnh viện phí trực tiếp',
        ],
        bedCount: displayName.toLowerCase().includes('phòng khám') ? 'Lưu viện ngắn hạn' : '500+ giường',
      };
    } else {
      const facilities = await publicApi.getFacilities();
      const cleanId = (id || '').trim().toLowerCase();
      const found = Array.isArray(facilities)
        ? facilities.find((f: PublicFacilityDto) => (f.id || '').toLowerCase() === cleanId)
        : undefined;

      if (found) {
        const rawAddr = found.address || '';
        const detectedCity =
          rawAddr.toLowerCase().includes('hà nội') || rawAddr.toLowerCase().includes('ha noi')
            ? 'Hà Nội'
            : rawAddr.toLowerCase().includes('đà nẵng') || rawAddr.toLowerCase().includes('da nang')
              ? 'Đà Nẵng'
              : 'TP. Hồ Chí Minh';
        const displayName = found.facilityName || found.facility_name || found.name || 'Cơ sở y tế đối tác';
        const displayPhone = found.phone || found.hotline || '1900 6868';
        const displayLicense = found.licenseNumber || found.license_number || found.operatingLicense;

        facilityItem = {
          id: found.id,
          name: displayName,
          facility_name: displayName,
          type: 'Bệnh viện Tuyến Trung Ương',
          address: rawAddr || 'Địa chỉ liên kết hệ thống FamiDoc',
          city: detectedCity,
          phone: displayPhone,
          hotline: displayPhone,
          license_number: typeof displayLicense === 'string' ? displayLicense : undefined,
          tax_code: typeof found.taxCode === 'string' ? found.taxCode : (typeof found.tax_code === 'string' ? found.tax_code : undefined),
          workingHours: '24/7 (Cấp cứu & Ngoại trú)',
          imageUrl: (found.imageUrl as string) || '/images/medsev/home-one/4.jpg',
          specialties: ['Nội Tổng Quát', 'Lão Khoa', 'Nhi Khoa', 'Tim Mạch Can Thiệp'],
          privileges: [
            'Lối đi ưu tiên FamiDoc Fast-Track',
            'Liên thông dữ liệu bệnh án điện tử EMR',
            'Bảo lãnh viện phí trực tiếp',
          ],
          bedCount: displayName.toLowerCase().includes('phòng khám') ? 'Lưu viện ngắn hạn' : '500+ giường',
        };
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

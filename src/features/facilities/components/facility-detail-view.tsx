'use client';

import React, { useState, useEffect } from 'react';
import { DoctorDetailView, type Facility } from '@/features/doctors';
import { publicApi, type PublicFacilityDto } from '@/lib/api';

export interface FacilityDetailViewProps {
  id: string;
  initialFacility?: Facility | null;
}

export function FacilityDetailView({ id, initialFacility }: FacilityDetailViewProps) {
  const [facility, setFacility] = useState<Facility | null>(initialFacility || null);
  const [isLoading, setIsLoading] = useState(!initialFacility);

  useEffect(() => {
    if (initialFacility) return;

    let isMounted = true;

    const buildFacilityModel = (found: PublicFacilityDto): Facility => {
      const rawAddress = found.address || '';
      const detectedCity =
        rawAddress.toLowerCase().includes('hà nội') || rawAddress.toLowerCase().includes('ha noi')
          ? 'Hà Nội'
          : rawAddress.toLowerCase().includes('đà nẵng') || rawAddress.toLowerCase().includes('da nang')
            ? 'Đà Nẵng'
            : 'TP. Hồ Chí Minh';

      const displayName = found.facilityName || found.facility_name || found.name || 'Cơ sở y tế đối tác';
      const displayPhone = found.phone || found.hotline || '1900 6868';
      const displayHotline = found.hotline || found.phone || '1900 6868';
      const displayLicense = found.licenseNumber || found.license_number || found.operatingLicense;

      const determinedType =
        found.type ||
        (displayName.toLowerCase().includes('quốc tế') || displayName.toLowerCase().includes('vinmec')
          ? 'Bệnh viện Đa Khoa Quốc Tế'
          : displayName.toLowerCase().includes('phòng khám') || displayName.toLowerCase().includes('clinic')
            ? 'Phòng khám Đa Khoa Kỹ Thuật Cao'
            : 'Bệnh viện Tuyến Trung Ương');

      const specialties =
        Array.isArray(found.specialties) && found.specialties.length > 0
          ? found.specialties
          : ['Nội Tổng Quát', 'Lão Khoa', 'Nhi Khoa', 'Tim Mạch Can Thiệp'];

      const privileges =
        Array.isArray(found.privileges) && found.privileges.length > 0
          ? found.privileges
          : [
            'Lối đi tiếp đón ưu tiên FamiDoc Fast-Track',
            'Bảo lãnh viện phí trực tiếp và liên thông BHYT',
            'Đồng bộ dữ liệu xét nghiệm vào Bệnh án điện tử EMR FamiDoc',
          ];

      const bedCount =
        found.bedCount ||
        (found as { bed_count?: string }).bed_count ||
        (displayName.toLowerCase().includes('phòng khám') ? 'Lưu viện ngắn hạn' : '500+ giường');

      const workingHours =
        found.workingHours ||
        (found as { working_hours?: string }).working_hours ||
        'Thứ 2 - Thứ 6: 06:30 - 16:30 | Thứ 7: 06:30 - 11:30 | Cấp cứu: 24/7';

      return {
        id: found.id,
        name: displayName,
        facility_name: displayName,
        type: determinedType,
        tier: found.tier,
        status: found.status || 'ACTIVE',
        address: rawAddress || 'Địa chỉ liên kết hệ thống FamiDoc',
        city: detectedCity,
        phone: displayPhone,
        hotline: displayHotline,
        email: found.email,
        websiteUrl: found.websiteUrl || (found as { website?: string }).website,
        workingHours,
        imageUrl: (found.imageUrl as string) || (found as { image_url?: string }).image_url || '/images/medsev/home-one/4.jpg',
        logoUrl: (found.logoUrl as string) || (found as { logo_url?: string }).logo_url,
        specialties,
        privileges,
        bedCount,
        license_number: typeof displayLicense === 'string' ? displayLicense : undefined,
        tax_code: typeof found.taxCode === 'string' ? found.taxCode : (typeof found.tax_code === 'string' ? found.tax_code : undefined),
        featuredDoctors: Array.isArray(found.featuredDoctors) ? found.featuredDoctors : undefined,
      };
    };

    publicApi
      .getFacilityDetail(id)
      .then((detail) => {
        if (!isMounted) return;
        if (detail && detail.id) {
          setFacility(buildFacilityModel(detail));
          return;
        }

        return publicApi.getFacilities().then((facs) => {
          if (!isMounted) return;
          const cleanId = (id || '').trim().toLowerCase();
          const found = Array.isArray(facs)
            ? facs.find((f: PublicFacilityDto) => (f.id || '').toLowerCase() === cleanId)
            : undefined;
          if (found) {
            setFacility(buildFacilityModel(found));
          }
        });
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, initialFacility]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8 text-slate-500 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#0046c0]/30 border-t-[#0046c0] rounded-full animate-spin" />
          <span>Đang tải thông tin cơ sở y tế...</span>
        </div>
      </div>
    );
  }

  return <DoctorDetailView id={id} type="facility" initialFacility={facility} />;
}

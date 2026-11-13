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
      const displayLicense = found.licenseNumber || found.license_number || found.operatingLicense;

      const determinedType =
        found.type ||
        (displayName.toLowerCase().includes('quốc tế') || displayName.toLowerCase().includes('vinmec')
          ? 'Bệnh viện Đa Khoa Quốc Tế'
          : displayName.toLowerCase().includes('phòng khám') || displayName.toLowerCase().includes('clinic')
            ? 'Phòng khám Đa Khoa Kỹ Thuật Cao'
            : 'Bệnh viện Tuyến Trung Ương');

      return {
        id: found.id,
        name: displayName,
        facility_name: displayName,
        type: determinedType as Facility['type'],
        address: rawAddress || 'Địa chỉ liên kết hệ thống FamiDoc',
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

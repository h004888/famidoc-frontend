'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { LandingHeader, LandingFooter } from '@/features/landing';
import { publicApi, type PublicFacilityDto } from '@/lib/api';

export interface FacilityItem {
  id: string;
  name: string;
  facility_name?: string;
  type: string;
  address: string;
  city: 'Hà Nội' | 'TP. Hồ Chí Minh' | 'Đà Nẵng';
  phone: string;
  workingHours: string;
  imageUrl: string;
  specialties: string[];
  privileges: string[];
  bedCount: string;
  license_number?: string;
  tax_code?: string;
}

const FALLBACK_IMAGES = [
  '/images/medsev/home-one/4.jpg',
  '/images/medsev/home-one/1.jpg',
  '/images/medsev/home-one/6.jpg',
  '/images/medsev/home-one/7.jpg',
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
];

export function FacilitiesDirectoryView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [facilitiesList, setFacilitiesList] = useState<FacilityItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    publicApi
      .getFacilities()
      .then((facs) => {
        if (!isMounted) return;
        const list = Array.isArray(facs)
          ? facs
          : Array.isArray((facs as unknown as { data?: unknown })?.data)
            ? ((facs as unknown as { data: PublicFacilityDto[] }).data)
            : [];

        if (list.length > 0) {
          const mapped: FacilityItem[] = list.map((f: PublicFacilityDto, idx: number) => {
            const rawAddress = f.address || '';
            const detectedCity: FacilityItem['city'] =
              rawAddress.toLowerCase().includes('hà nội') || rawAddress.toLowerCase().includes('ha noi')
                ? 'Hà Nội'
                : rawAddress.toLowerCase().includes('đà nẵng') || rawAddress.toLowerCase().includes('da nang')
                  ? 'Đà Nẵng'
                  : 'TP. Hồ Chí Minh';

            const displayName = f.facilityName || f.facility_name || f.name || 'Cơ sở y tế đối tác';
            const displayPhone = f.phone || f.hotline || '1900 6868';
            const displayLicense = f.licenseNumber || f.license_number || f.operatingLicense;

            const determinedType =
              f.type ||
              (displayName.toLowerCase().includes('quốc tế') || displayName.toLowerCase().includes('vinmec')
                ? 'Bệnh viện Đa Khoa Quốc Tế'
                : displayName.toLowerCase().includes('phòng khám') || displayName.toLowerCase().includes('clinic')
                  ? 'Phòng khám Đa Khoa Kỹ Thuật Cao'
                  : 'Bệnh viện Tuyến Trung Ương');

            return {
              id: f.id,
              name: displayName,
              facility_name: displayName,
              type: determinedType,
              address: rawAddress || 'Địa chỉ liên kết hệ thống FamiDoc',
              city: detectedCity,
              phone: displayPhone,
              license_number: typeof displayLicense === 'string' ? displayLicense : undefined,
              tax_code: typeof f.taxCode === 'string' ? f.taxCode : (typeof f.tax_code === 'string' ? f.tax_code : undefined),
              workingHours: '24/7 (Cấp cứu & Ngoại trú)',
              imageUrl: (typeof f.imageUrl === 'string' && f.imageUrl) ? f.imageUrl : FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length],
              specialties: ['Nội Tổng Quát', 'Lão Khoa', 'Nhi Khoa', 'Tim Mạch Can Thiệp'],
              privileges: [
                'Lối đi ưu tiên FamiDoc Fast-Track',
                'Liên thông dữ liệu bệnh án điện tử EMR',
                'Bảo lãnh viện phí trực tiếp',
              ],
              bedCount: displayName.toLowerCase().includes('phòng khám') ? 'Lưu viện ngắn hạn' : '500+ giường',
            };
          });
          setFacilitiesList(mapped);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFacilities = useMemo(() => {
    return facilitiesList.filter((fac) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        fac.name.toLowerCase().includes(q) ||
        fac.address.toLowerCase().includes(q) ||
        (fac.license_number && fac.license_number.toLowerCase().includes(q));

      const matchCity = selectedCity === 'all' || fac.city === selectedCity;
      const matchType = selectedType === 'all' || fac.type === selectedType;

      return matchSearch && matchCity && matchType;
    });
  }, [facilitiesList, searchQuery, selectedCity, selectedType]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between">
      {/* 1. Header */}
      <LandingHeader />

      <main className="flex-1 pb-16">
        {/* 2. Hero Title Area */}
        <section
          className="relative bg-cover bg-center py-20 sm:py-28 text-center text-white"
          style={{ backgroundImage: "url('/images/medsev/doctor/1.jpg')" }}
        >
          <div className="absolute inset-0 bg-[#0046c0]/75 backdrop-brightness-90" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs border border-white/30">
              <span className="material-symbols-outlined text-sm">apartment</span>
              <span>Bên C · Mạng Lưới Bệnh Viện &amp; Cơ Sở Y Tế Đối Tác</span>
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-xs">
              Mạng Lưới Cơ Sở Y Tế Bảo Trợ
            </h1>

            <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Hơn 18 bệnh viện tuyến trung ương và phòng khám đa khoa hàng đầu, cam kết phân luồng đón tiếp ưu tiên Fast-Track và liên thông dữ liệu hồ sơ sức khỏe cho hội viên FamiDoc.
            </p>

            <nav aria-label="Breadcrumb" className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm text-blue-200 font-medium pt-2">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-base">home</span>
                Trang chủ
              </Link>
              <span>/</span>
              <span className="text-white font-semibold">Cơ sở y tế</span>
            </nav>
          </div>
        </section>

        {/* 3. Search & Filter Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
              {/* Search keyword input */}
              <div className="md:col-span-6 relative">
                <span className="material-symbols-outlined text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-xl">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên bệnh viện, phòng khám, địa chỉ..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0046c0] focus:ring-1 focus:ring-[#0046c0] bg-slate-50/60"
                />
              </div>

              {/* City Filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50/60 focus:outline-none focus:border-[#0046c0] cursor-pointer"
                >
                  <option value="all">Tất cả tỉnh thành ({facilitiesList.length})</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50/60 focus:outline-none focus:border-[#0046c0] cursor-pointer"
                >
                  <option value="all">Tất cả phân tuyến</option>
                  <option value="Bệnh viện Tuyến Trung Ương">Tuyến Trung Ương</option>
                  <option value="Bệnh viện Đa Khoa Quốc Tế">Bệnh viện Quốc Tế</option>
                  <option value="Phòng khám Đa Khoa Kỹ Thuật Cao">Phòng khám Đa Khoa</option>
                </select>
              </div>
            </div>

            {/* Quick Filter summary bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Hiển thị: <strong className="text-slate-900 font-semibold">{filteredFacilities.length}</strong> cơ sở y tế</span>
                {(searchQuery || selectedCity !== 'all' || selectedType !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCity('all');
                      setSelectedType('all');
                    }}
                    className="text-[#0046c0] hover:underline font-semibold cursor-pointer ml-2"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang hoạt động 24/7
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Facilities Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
                  <div className="h-52 bg-slate-100 rounded-xl" />
                  <div className="h-6 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-10 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div role="status" className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
              <div className="w-14 h-14 bg-blue-50 text-[#0046c0] rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">apartment</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Không tìm thấy cơ sở y tế phù hợp
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Vui lòng thử lại với tên bệnh viện hoặc khu vực thành phố khác.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('all');
                  setSelectedType('all');
                }}
                className="px-5 py-2.5 bg-[#0046c0] hover:bg-[#003899] text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                Xem toàn bộ danh sách cơ sở y tế
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {filteredFacilities.map((fac) => (
                <article
                  key={fac.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_25px_0_rgba(0,0,0,0.05)] hover:shadow-[0_15px_35px_0_rgba(0,70,192,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Image banner */}
                    <Link
                      href={`/facilities/${fac.id}`}
                      className="relative h-52 w-full overflow-hidden bg-slate-100 block"
                    >
                      <img
                        src={fac.imageUrl}
                        alt={fac.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-white/95 text-slate-900 text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                        {fac.type}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1 backdrop-blur-xs">
                        <span className="material-symbols-outlined text-xs">bed</span>
                        {fac.bedCount}
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <div>
                        <Link
                          href={`/facilities/${fac.id}`}
                          className="text-lg font-bold text-slate-900 group-hover:text-[#0046c0] transition-colors block leading-snug"
                        >
                          {fac.name}
                        </Link>
                        {fac.license_number && (
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                            Giấy phép KCB: {fac.license_number}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                          <span className="material-symbols-outlined text-base text-slate-400 shrink-0">location_on</span>
                          <span>{fac.address}</span>
                        </p>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-[#0046c0]">schedule</span>
                          <span><strong>Giờ làm việc:</strong> {fac.workingHours}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-emerald-600">call</span>
                          <span><strong>Hotline viện:</strong> <strong className="text-slate-800">{fac.phone}</strong></span>
                        </div>
                      </div>

                      {/* Privileges */}
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-1.5">
                        <h4 className="text-xs font-bold text-[#0046c0] flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">stars</span>
                          Đặc quyền hội viên FamiDoc:
                        </h4>
                        <ul className="text-xs text-slate-700 space-y-1">
                          {fac.privileges.map((priv, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="material-symbols-outlined text-sm text-[#0046c0] shrink-0 mt-0.5">check_circle</span>
                              <span>{priv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                    <Link
                      href={`/facilities/${fac.id}`}
                      className="w-full py-2.5 px-3 rounded-lg bg-[#0046c0] hover:bg-[#003899] text-white text-xs font-semibold text-center transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Xem chi tiết cơ sở</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </Link>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${fac.phone.replace(/[^0-9+]/g, '')}`}
                        className="flex-1 py-2 px-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 bg-white text-[11px] font-semibold text-slate-700 text-center transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 shadow-2xs truncate"
                      >
                        <span className="material-symbols-outlined text-sm text-emerald-600">call</span>
                        <span className="truncate">{fac.phone}</span>
                      </a>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fac.name + ' ' + fac.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 bg-white text-[11px] font-semibold text-slate-700 text-center transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-sm text-[#0046c0]">near_me</span>
                        <span>Chỉ đường</span>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 5. Footer */}
      <LandingFooter />
    </div>
  );
}

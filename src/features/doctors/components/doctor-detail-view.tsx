'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LandingHeader, LandingFooter } from '@/features/landing';
import type { PublicDoctorDetailDto } from '@/lib/api';
import { DoctorPackageSelector } from './doctor-package-selector';



function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function DoctorDetailViewInner({
  initialDoctor,
  initialPackageCode,
}: {
  initialDoctor?: PublicDoctorDetailDto | null;
  initialPackageCode?: string | null;
}) {
  if (!initialDoctor) return null;
  const doctor = initialDoctor;
  const fullTitle = doctor.academicTitle
    ? `${doctor.academicTitle} ${doctor.doctorName}`
    : doctor.doctorName;
  const hasRating = doctor.stats.ratingAvg !== null;
  const hasCareModel =
    doctor.careModel.serviceModes.length > 0 ||
    doctor.careModel.commitments.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      <LandingHeader />

      <main className="flex-1 pb-16">
        <section className="bg-white border-b border-slate-200 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs text-slate-500"
            >
              <Link href="/" className="hover:text-[#0046c0] transition-colors">
                Trang chủ
              </Link>
              <span className="text-slate-300">/</span>
              <Link
                href="/doctors"
                className="hover:text-[#0046c0] transition-colors"
              >
                Bác sĩ gia đình
              </Link>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-800 line-clamp-1">
                {fullTitle}
              </span>
            </nav>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    {doctor.avatarUrl ? (
                      <img
                        src={doctor.avatarUrl}
                        alt={doctor.doctorName}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                        {doctor.doctorName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {doctor.isVerified ? (
                        <Badge variant="outline" className="gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold border-emerald-200/70">
                          <span className="material-symbols-outlined text-xs">
                            verified
                          </span>
                          <span>Hồ sơ đã xác thực</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
                          <span>Đang cập nhật xác thực</span>
                        </Badge>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          doctor.isAvailable
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            doctor.isAvailable
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span>
                          {doctor.isAvailable
                            ? 'Đang nhận hộ gia đình mới'
                            : 'Đã đủ hộ gia đình phụ trách'}
                        </span>
                      </span>
                    </div>

                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                        {fullTitle}
                      </h1>
                      <p className="text-xs sm:text-sm font-semibold text-[#0046c0] mt-0.5">
                        {doctor.specialty}
                      </p>
                    </div>

                    {doctor.facility && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-slate-400 text-sm">
                            domain
                          </span>
                          <span className="font-medium text-slate-800">
                            {doctor.facility.facilityName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-slate-400 text-sm">
                            location_on
                          </span>
                          <span>{doctor.facility.address}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="py-1.5 px-2 rounded-md bg-slate-50 border border-slate-100">
                    <span className="block text-xs font-bold text-slate-900 tabular-nums">
                      {doctor.stats.experienceYears} năm
                    </span>
                    <span className="text-[10px] text-slate-500">Kinh nghiệm</span>
                  </div>
                  <div className="py-1.5 px-2 rounded-md bg-slate-50 border border-slate-100">
                    <span className="block text-xs font-bold text-amber-600 tabular-nums">
                      {hasRating ? (
                        <span className="inline-flex items-center justify-center gap-0.5">
                          <span className="material-symbols-outlined text-xs material-symbols-filled">
                            star
                          </span>
                          <span>{doctor.stats.ratingAvg?.toFixed(2)}</span>
                        </span>
                      ) : (
                        'Chưa có đánh giá'
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {doctor.stats.totalReviews} đánh giá
                    </span>
                  </div>
                  <div className="py-1.5 px-2 rounded-md bg-slate-50 border border-slate-100">
                    <span className="block text-xs font-bold text-[#0046c0] tabular-nums">
                      {doctor.stats.completedEncounters.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Ca đã hoàn tất
                    </span>
                  </div>
                  <div className="py-1.5 px-2 rounded-md bg-slate-50 border border-slate-100">
                    <span className="block text-xs font-bold text-slate-900 tabular-nums">
                      {doctor.panel.activeCount}/{doctor.panel.maxCapacity}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Hộ đang phụ trách
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0046c0] text-lg">
                    person
                  </span>
                  <span>Giới thiệu</span>
                </h2>
                {doctor.bio ? (
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {doctor.bio}
                  </p>
                ) : (
                  <p className="text-slate-500 text-xs">
                    Chưa có thông tin giới thiệu.
                  </p>
                )}
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0046c0] text-lg">
                    school
                  </span>
                  <span>Chứng Chỉ &amp; Bằng Cấp</span>
                </h2>

                {doctor.credentials.length > 0 ? (
                  <ul className="space-y-2 text-xs text-slate-700">
                    {doctor.credentials.map((credential) => (
                      <li
                        key={credential.id}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-md bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-[#0046c0] text-base shrink-0 mt-0.5">
                            verified
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {credential.typeLabel}
                            </p>
                            <p className="text-slate-600">
                              {credential.issuingAuthority} ({credential.issueYear})
                            </p>
                          </div>
                        </div>
                        {credential.verified && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shrink-0">
                            Đã xác thực
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-xs">
                    Chưa có chứng chỉ được công bố.
                  </p>
                )}
              </div>

              <Card className="bg-white rounded-lg border-slate-200 p-5 space-y-2 shadow-none gap-0">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0046c0] text-lg">
                    clinical_notes
                  </span>
                  <span>Ca Bệnh Tiêu Biểu Đã Xử Lý</span>
                </h2>
                {doctor.treatedCases.length > 0 ? (
                  <ul className="space-y-2 text-xs text-slate-700">
                    {doctor.treatedCases.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2.5 p-2.5 rounded-md bg-slate-50 border border-slate-100"
                      >
                        <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">
                          clinical_notes
                        </span>
                        <span className="leading-snug font-medium">
                          {item.summary}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-xs">
                    Chưa có ca bệnh tiêu biểu được công bố.
                  </p>
                )}
              </Card>

              <Card className="bg-white rounded-lg border-slate-200 p-5 space-y-3 shadow-none gap-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0046c0] text-lg">
                      home_health
                    </span>
                    <span>Phạm Vi Chăm Sóc</span>
                  </h2>
                  <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border-emerald-100">
                    Chính sách nền tảng
                  </Badge>
                </div>

                {hasCareModel ? (
                  <>
                    {doctor.careModel.serviceModes.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {doctor.careModel.serviceModes.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-md border border-slate-200 bg-slate-50/60 space-y-1"
                          >
                            <div className="w-7 h-7 rounded bg-[#0046c0] text-white flex items-center justify-center">
                              <span className="material-symbols-outlined text-base">
                                {item.icon || 'home'}
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-xs">
                              {item.title}
                            </h3>
                            <p className="text-[11px] text-slate-600 leading-snug">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {doctor.careModel.commitments.length > 0 && (
                      <ul className="space-y-2 text-xs text-slate-700">
                        {doctor.careModel.commitments.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-start gap-2.5 p-2.5 rounded-md bg-slate-50 border border-slate-100"
                          >
                            <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">
                              {item.icon || 'verified_user'}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {item.title}
                              </p>
                              <p className="text-slate-600 leading-snug">
                                {item.description}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500 text-xs">
                    Chưa có thông tin phạm vi chăm sóc.
                  </p>
                )}
              </Card>

              <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-lg material-symbols-filled">
                      reviews
                    </span>
                    <span>Đánh Giá Đã Xác Thực</span>
                  </h2>
                  <span className="text-xs text-amber-600 font-bold">
                    {doctor.reviews.totalReviews} đánh giá
                  </span>
                </div>

                {doctor.reviews.items.length > 0 ? (
                  <div className="space-y-2.5">
                    {doctor.reviews.items.map((review) => (
                      <div
                        key={review.id}
                        className="p-3.5 rounded-md bg-slate-50 border border-slate-100 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">
                              {review.patientDisplayName}
                            </span>
                            {review.packageName && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                {review.packageName}
                              </span>
                            )}
                            {review.district && (
                              <span className="text-[10px] text-slate-500">
                                {review.district}
                              </span>
                            )}
                          </div>
                          <div className="flex text-amber-500">
                            {Array.from({ length: review.ratingStars }).map(
                              (_, index) => (
                                <span
                                  key={index}
                                  className="material-symbols-outlined text-xs material-symbols-filled"
                                >
                                  star
                                </span>
                              )
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 italic leading-snug">
                          &quot;{review.comment}&quot;
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDate(review.reviewedAt)} · Đã xác thực buổi khám
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Bác sĩ chưa có đánh giá nào.
                  </p>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-20">
              <DoctorPackageSelector
                doctorId={doctor.id}
                doctorName={fullTitle}
                isAvailable={doctor.isAvailable}
                facilityId={doctor.facility?.id ?? null}
                carePackages={doctor.carePackages}
                initialPackageCode={initialPackageCode}
              />
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

import { Facility } from './doctor-directory-view';
import { publicApi } from '@/lib/api';

export interface DoctorDetailViewProps {
  id?: string;
  type?: 'doctor' | 'facility';
  onBack?: () => void;
  initialDoctor?: PublicDoctorDetailDto | null;
  initialFacility?: Facility | null;
  /** Mã gói đã chọn từ `/doctors?packageId=...` để pre-select `DoctorPackageSelector`. */
  initialPackageCode?: string | null;
}

function FacilityDetailViewInner({
  id = 'fac-01',
  initialFacility,
  onBack,
}: DoctorDetailViewProps) {
  const facility: Facility = initialFacility || {
    id: id || 'fac-01',
    name: 'Bệnh viện Chợ Rẫy',
    type: 'Bệnh viện Tuyến Trung Ương',
    address: '201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    phone: '1900 1234',
    workingHours: '07:00 - 16:30',
    imageUrl: '/images/facilities/cho-ray.jpg',
    specialties: ['Nội tổng quát', 'Tim mạch', 'Cơ xương khớp'],
    privileges: ['Ưu tiên Fast-Track', 'Bảo lãnh viện phí'],
    bedCount: '1000+ giường',
  };

  const [facilityDoctors, setFacilityDoctors] = useState<Array<{
    id: string;
    name: string;
    title: string;
    specialty: string;
    avatarUrl: string;
  }>>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (facility?.featuredDoctors && facility.featuredDoctors.length > 0) {
      setFacilityDoctors(
        facility.featuredDoctors.map((d: any) => ({
          id: d.id,
          name: d.doctorName || d.fullName || d.name || 'Bác sĩ',
          title: d.academicTitle || d.title || 'BS',
          specialty: d.specialty || 'Chuyên khoa',
          avatarUrl: d.avatarUrl || '/images/doctor-placeholder.jpg',
        }))
      );
      setIsLoadingDoctors(false);
      return;
    }

    try {
      const req = publicApi.getDoctors?.({ facilityId: facility.id });
      if (req && typeof req.then === 'function') {
        req
          .then((res) => {
            if (!isMounted) return;
            const items = res?.items || [];
            if (items.length > 0) {
              setFacilityDoctors(
                items.map((doc: any) => ({
                  id: doc.id,
                  name: doc.doctorName || doc.fullName || 'Bác sĩ',
                  title: doc.academicTitle || 'BS',
                  specialty: doc.specialty || 'Đa khoa',
                  avatarUrl: doc.avatarUrl || '/images/doctor-placeholder.jpg',
                }))
              );
            } else {
              setFacilityDoctors([
                {
                  id: 'doc-cr-01',
                  name: 'Phạm Minh Đức',
                  title: 'TS. Bác sĩ',
                  specialty: 'Tim Mạch & Huyết Áp',
                  avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
                },
                {
                  id: 'doc-cr-02',
                  name: 'Hoàng Minh Tuấn',
                  title: 'BS. CKII',
                  specialty: 'Cơ Xương Khớp',
                  avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=200&auto=format&fit=crop',
                },
              ]);
            }
          })
          .catch(() => {
            if (!isMounted) return;
            setFacilityDoctors([
              {
                id: 'doc-cr-01',
                name: 'Phạm Minh Đức',
                title: 'TS. Bác sĩ',
                specialty: 'Tim Mạch & Huyết Áp',
                avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
              },
              {
                id: 'doc-cr-02',
                name: 'Hoàng Minh Tuấn',
                title: 'BS. CKII',
                specialty: 'Cơ Xương Khớp',
                avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=200&auto=format&fit=crop',
              },
            ]);
          })
          .finally(() => {
            if (isMounted) setIsLoadingDoctors(false);
          });
      } else {
        setIsLoadingDoctors(false);
      }
    } catch {
      setIsLoadingDoctors(false);
    }

    return () => {
      isMounted = false;
    };
  }, [facility.id]);

  const hotline = facility.hotline || facility.phone || '1900 6868';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      <LandingHeader />

      <main className="flex-1 pb-16">
        <section className="bg-white border-b border-slate-200 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="hover:text-[#0046c0] transition-colors">
                Trang chủ
              </Link>
              <span className="text-slate-300">/</span>
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="hover:text-[#0046c0] transition-colors cursor-pointer"
                >
                  Cơ sở y tế đối tác
                </button>
              ) : (
                <Link href="/facilities" className="hover:text-[#0046c0] transition-colors">
                  Cơ sở y tế đối tác
                </Link>
              )}
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-800 line-clamp-1">
                {facility.name}
              </span>
            </nav>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative flex items-center justify-center">
                    <img
                      src={facility.imageUrl || '/images/facility-placeholder.jpg'}
                      alt={facility.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold">
                        {facility.tier || 'Cơ sở chuẩn Bộ Y Tế'}
                      </Badge>
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold">
                        {facility.status === 'ACTIVE' ? 'Đối tác bảo trợ chính thức' : (facility.status || 'Đang hoạt động')}
                      </Badge>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {facility.name}
                    </h1>
                    {facility.type && (
                      <p className="text-xs sm:text-sm font-semibold text-[#0046c0] mt-0.5">
                        {facility.type}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-slate-400 text-sm">domain</span>
                        <span className="font-medium text-slate-800">{facility.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-slate-400 text-sm">location_on</span>
                        <span>{facility.city}</span>
                      </div>
                    </div>

                    {(facility.license_number || facility.tax_code) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-slate-500">
                        {facility.license_number && (
                          <span>Giấy phép KCB: <strong className="text-slate-700 font-medium">{facility.license_number}</strong></span>
                        )}
                        {facility.license_number && facility.tax_code && <span>•</span>}
                        {facility.tax_code && (
                          <span>Mã số thuế: <strong className="text-slate-700 font-medium">{facility.tax_code}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-slate-100 text-center text-xs">
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Quy mô</span>
                    <strong className="text-slate-900">{facility.bedCount || '1.000+'}</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Đánh giá</span>
                    <strong className="text-slate-900">4.95 ★</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Trực cấp cứu</span>
                    <strong className="text-slate-900">24/7</strong>
                  </div>
                </div>
              </div>

              {/* Affiliated Doctors Section */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">groups</span>
                      <span>Đội Ngũ Bác Sĩ Trực Thuộc {facility.name}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đội ngũ bác sĩ chuyên khoa, bác sĩ gia đình đang tiếp nhận bệnh nhân và thăm khám định kỳ.
                    </p>
                  </div>
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-primary text-xs font-semibold">
                    {facilityDoctors.length} Bác sĩ chính quy
                  </Badge>
                </div>

                {isLoadingDoctors ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-3 rounded-lg border border-slate-200 bg-slate-50 animate-pulse h-20" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {facilityDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-primary/70 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img
                              src={doc.avatarUrl}
                              alt={doc.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-semibold text-primary block truncate">{doc.title}</span>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{doc.name}</h3>
                            <p className="text-xs text-slate-600 truncate mt-0.5">{doc.specialty}</p>
                          </div>
                        </div>

                        <Link
                          href={'/doctors/' + doc.id}
                          className="w-full py-1.5 px-3 rounded-md bg-slate-100 hover:bg-primary hover:text-white text-slate-700 text-xs font-semibold transition-colors text-center"
                        >
                          Hồ sơ & Đặt khám
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Specialties & Privileges */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">medical_services</span>
                  <span>Chuyên Khoa Mũi Nhọn & Đặc Quyền Fast-Track</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {facility.specialties?.map((spec, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-md border border-slate-100 flex items-center gap-2 text-xs text-slate-800 font-medium">
                      <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-900 block">Đặc quyền hội viên FamiDoc:</span>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {facility.privileges?.map((priv, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-sm">verified</span>
                        <span>{priv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Column: Contact & Hotline Card */}
            <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                    Tiếp nhận cấp cứu & Khám bệnh
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Tổng Đài Hỗ Trợ 24/7
                  </h3>
                </div>

                <a
                  href={'tel:' + hotline.replace(/\s+/g, '')}
                  className="w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <span className="material-symbols-outlined text-lg">call</span>
                  <span>Hotline: {facility.hotline || facility.phone || '1900 6868'}</span>
                </a>

                {facility.phone && facility.hotline && facility.phone !== facility.hotline && (
                  <div className="flex items-center justify-between text-xs text-slate-600 py-1.5 px-3 bg-slate-50 rounded-md border border-slate-100">
                    <span className="text-slate-500">Số bàn hành chính:</span>
                    <a href={`tel:${facility.phone.replace(/\s+/g, '')}`} className="font-semibold text-slate-800 hover:text-[#0046c0]">
                      {facility.phone}
                    </a>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-sm">schedule</span>
                    <span>Giờ làm việc: {facility.workingHours || '07:00 - 17:00'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-sm shrink-0 mt-0.5">location_on</span>
                    <span>{facility.address}</span>
                  </div>
                  {facility.email && (
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-base text-slate-400 shrink-0">mail</span>
                      <a href={`mailto:${facility.email}`} className="text-[#0046c0] hover:underline truncate">
                        {facility.email}
                      </a>
                    </div>
                  )}
                  {facility.websiteUrl && (
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-base text-slate-400 shrink-0">language</span>
                      <a href={facility.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[#0046c0] hover:underline truncate">
                        {facility.websiteUrl.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />

      {/* Sticky Mobile Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 md:hidden flex items-center justify-between gap-3 shadow-lg">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] text-slate-500 block uppercase font-medium truncate">{facility.name}</span>
          <span className="font-bold text-xs text-red-600 tabular-nums flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">call</span>
            <span>{hotline}</span>
          </span>
        </div>
        <a
          href={'tel:' + hotline.replace(/\s+/g, '')}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold transition-colors shrink-0 shadow-xs flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">call</span>
          <span>Gọi viện</span>
        </a>
      </div>
    </div>
  );
}

export function DoctorDetailView(props: DoctorDetailViewProps) {
  if (props.type === 'facility' || props.initialFacility) {
    return <FacilityDetailViewInner {...props} />;
  }
  return (
    <DoctorDetailViewInner
      initialDoctor={props.initialDoctor}
      initialPackageCode={props.initialPackageCode}
    />
  );
}

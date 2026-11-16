'use client';

import React from 'react';
import Link from 'next/link';
import type { LandingDoctorItem } from '../types';

export interface LandingDoctorsProps {
  doctors?: LandingDoctorItem[];
  totalDoctors?: number;
}

const FALLBACK_AVATARS = [
  '/images/medsev/home-one/doctor/1.jpg',
  '/images/medsev/home-one/doctor/2.jpg',
  '/images/medsev/home-one/doctor/3.jpg',
];

export function LandingDoctors({ doctors = [], totalDoctors }: LandingDoctorsProps = {}) {
  const featuredDoctors = doctors.slice(0, 3);
  const totalCount = totalDoctors && totalDoctors > 0 ? totalDoctors : featuredDoctors.length;

  return (
    <section className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-1">
            <span className="sr-only">ĐỘI NGŨ CHUYÊN GIA HÀNG ĐẦU</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Bác Sĩ Tiêu Biểu &amp; Chuyên Gia Đầu Ngành
            </h2>
            <p className="text-sm text-slate-600">
              Đội ngũ bác sĩ giàu y đức, chứng chỉ hành nghề chính quy và tận tâm đồng hành dài lâu cùng gia đình.
            </p>
          </div>

          <Link
            href="/doctors"
            className="text-xs sm:text-sm font-semibold text-[#0046c0] hover:text-[#003899] flex items-center gap-1.5 py-1 group"
          >
            <span>
              {totalCount > 0
                ? `Xem toàn bộ ${totalCount.toLocaleString('vi-VN')} bác sĩ`
                : 'Xem toàn bộ bác sĩ'}
            </span>
            <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </Link>
        </div>

        {featuredDoctors.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
            <p className="text-sm text-slate-600">
              Danh sách bác sĩ tiêu biểu đang được cập nhật từ hệ thống.
            </p>
            <Link
              href="/doctors"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#0046c0] hover:bg-[#003899] text-white text-xs font-semibold transition-colors"
            >
              <span>Khám phá danh bạ bác sĩ</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredDoctors.map((doc, idx) => {
              const avatarSrc =
                doc.avatarUrl || FALLBACK_AVATARS[idx % FALLBACK_AVATARS.length]!;
              const ratingLabel =
                doc.ratingAvg && doc.ratingAvg > 0
                  ? `${doc.ratingAvg.toFixed(1)} (${doc.totalReviews ?? 0} đánh giá)`
                  : 'Bác sĩ đã xác thực';
              const expLabel =
                doc.experienceYears && doc.experienceYears > 0
                  ? ` • ${doc.experienceYears} năm KN`
                  : '';

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between group cursor-default"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={avatarSrc}
                      alt={doc.doctorName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded bg-white/95 text-slate-700 text-[11px] font-medium border border-slate-200 shadow-xs flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            doc.isAvailable !== false
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-slate-400'
                          }`}
                        />
                        {doc.isAvailable !== false ? 'Sẵn sàng tiếp nhận' : 'Đang kín lịch'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                        {doc.facility?.facilityName || doc.academicTitle || 'Bác sĩ Gia đình'}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0046c0] transition-colors">
                        {doc.doctorName}
                      </h3>
                      <div className="text-xs font-semibold text-[#0046c0]">
                        {doc.specialty}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pt-1 font-normal">
                        {doc.bio || 'Bác sĩ chuyên khoa Y học gia đình đồng hành chăm sóc sức khỏe toàn diện.'}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                          <span>
                            {ratingLabel}
                            {expLabel}
                          </span>
                        </span>
                      </div>

                      <div>
                        <Link
                          href={`/doctors/${doc.id}`}
                          className="w-full py-2.5 rounded bg-slate-100 hover:bg-[#0046c0] hover:text-white text-slate-700 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Xem hồ sơ chi tiết</span>
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

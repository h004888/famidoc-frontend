'use client';

import React from 'react';
import Link from 'next/link';

interface DoctorItem {
  id: string;
  name: string;
  role: string;
  ratingText: string;
  bio: string;
  cchn: string;
  badge: string;
  avatar: string;
}

const DOCTORS: DoctorItem[] = [
  {
    id: 'DOC-01',
    name: 'PGS.TS Nguyễn Trọng Nghĩa',
    role: 'Trưởng khoa Nội tổng quát & Y học gia đình',
    ratingText: '5.0 (480+ đánh giá) • 24 năm KN',
    bio: 'Nguyên Trưởng khoa Khám bệnh BV Đại học Y Dược TP.HCM. Chuyên gia đầu ngành về quản lý tăng huyết áp và đái tháo đường typ 2 tại gia đình.',
    cchn: 'CCHN: 004128/BYT',
    badge: 'Lịch trống hôm nay',
    avatar: '/images/medsev/home-one/doctor/1.jpg',
  },
  {
    id: 'DOC-02',
    name: 'BSCKII Trần Mai Phương',
    role: 'Chuyên gia Nhi & Dinh dưỡng phát triển',
    ratingText: '4.9 (620+ đánh giá) • 18 năm KN',
    bio: 'Từng công tác tại BV Nhi Đồng 1. Cố vấn phác đồ phát triển thể chất và miễn dịch cho trẻ từ sơ sinh đến vị thành niên.',
    cchn: 'CCHN: 009821/BYT',
    badge: 'Bác sĩ gia đình yêu thích',
    avatar: '/images/medsev/home-one/doctor/2.jpg',
  },
  {
    id: 'DOC-03',
    name: 'ThS.BS Lê Hoàng Nam',
    role: 'Trưởng Ban Hội Chẩn Lão Khoa & Tim Mạch',
    ratingText: 'CCHN Cấp bởi Bộ Y Tế • 22 năm KN',
    bio: 'Anh Lê Hoàng Nam - Chuyên gia hội chẩn cấp cao, chuyên sâu điều trị bệnh đa cơ quan ở người cao tuổi, tối ưu hóa phác đồ sử dụng thuốc an toàn tại nhà.',
    cchn: 'CCHN: 007612/BYT',
    badge: 'Tư vấn chuyên sâu',
    avatar: '/images/medsev/home-one/doctor/3.jpg',
  },
];

export function LandingDoctors() {
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
            <span>Xem toàn bộ 1.200+ bác sĩ</span>
            <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* Faculty Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DOCTORS.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-lg overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between group cursor-default"
            >
              {/* Doctor Portrait Header */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={doc.avatar}
                  alt={doc.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded bg-white/95 text-slate-700 text-[11px] font-medium border border-slate-200 shadow-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {doc.badge}
                  </span>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    {doc.cchn}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0046c0] transition-colors">
                    {doc.name}
                  </h3>
                  <div className="text-xs font-semibold text-[#0046c0]">
                    {doc.role}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pt-1 font-normal">
                    {doc.bio}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                      <span>{doc.ratingText}</span>
                    </span>
                  </div>

                  <div>
                    <Link
                      href={`/doctors/${doc.id.toLowerCase()}`}
                      className="w-full py-2.5 rounded bg-slate-100 hover:bg-[#0046c0] hover:text-white text-slate-700 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Xem hồ sơ chi tiết</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

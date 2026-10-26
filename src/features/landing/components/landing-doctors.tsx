'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface DoctorItem {
  id: string;
  name: string;
  role: string;
  ratingText: string;
  bio: string;
  cchn: string;
  badge: string;
  badgeColor: string;
  fee: string;
  avatar?: string;
  icon?: string;
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
    badgeColor: 'bg-[#f6ffed] text-[#52c41a]',
    fee: '350.000đ',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAuHmZZ-AjQ3V3EHVn3Zl50pQWoGMVEomQvOT78CwjV_zQ1pXgIE1ohGP5F_dVA0wYR0eq09yHtuJbiGPX5X-Ug85qsSgl1SDghHPhWK7i5Gdgt1yYQANVxl2kGz1I8tXZzg4GIjfqDvyD4Gprhk5DgtIk6DF8EsPhORaBNjpP0UD5sd2KVTi9tfs2mZnwpcMK4MMt_CBEk-fjGuX32KSxqDJXmCljTGW1UgrnvJu74XuyVdgKykM7tsw',
  },
  {
    id: 'DOC-02',
    name: 'BSCKII Trần Mai Phương',
    role: 'Chuyên gia Nhi & Dinh dưỡng phát triển',
    ratingText: '4.9 (620+ đánh giá) • 18 năm KN',
    bio: 'Từng công tác tại BV Nhi Đồng 1. Cố vấn phác đồ phát triển thể chất và miễn dịch cho trẻ từ sơ sinh đến vị thành niên.',
    cchn: 'CCHN: 009821/BYT',
    badge: 'Bác sĩ gia đình yêu thích',
    badgeColor: 'bg-[#fff7e6] text-[#fa8c16]',
    fee: '300.000đ',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBVFPvjHiePB6Tzc0DZTNDgXt8iVSqbzY94uuiPhlChF5Ou8hV6cYKYxw3sKdjJ2DJr8nQ1Egivwt0QBF9DXnU0R2yJSPRbENhek6PGYxwY-ljI0jMIVQkjxGEoov4ARw3U79LxZS_Le4vjvwzf02Svt_TW45g2YbBxWWaeibTvdNL-zLv_g_gm8M0yr2VEsnouCuVkVqUJrgk6AvIlTIw-FOsn6xnFgbM83zjxwQTW6rEQFkYVtfwSUg',
  },
  {
    id: 'DOC-03',
    name: 'ThS.BS Lê Hoàng Nam',
    role: 'Trưởng Ban Hội Chẩn Lão Khoa & Tim Mạch',
    ratingText: 'CCHN Cấp bởi Bộ Y Tế • 22 năm KN',
    bio: 'Anh Lê Hoàng Nam - Chuyên gia hội chẩn cấp cao, chuyên sâu điều trị bệnh đa cơ quan ở người cao tuổi, tối ưu hóa phác đồ sử dụng thuốc an toàn tại nhà.',
    cchn: 'CCHN: 007612/BYT',
    badge: 'Tư vấn chuyên sâu',
    badgeColor: 'bg-[#f2f3ff] text-[#0037c1]',
    fee: '400.000đ',
    icon: 'clinical_notes',
  },
];

export function LandingDoctors() {
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

  return (
    <section id="bac-si" className="py-20 bg-[#faf8ff] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="sr-only">ĐỘI NGŨ CHUYÊN GIA HÀNG ĐẦU</span>
            <span className="px-3 py-1 rounded-full bg-[#f6ffed] text-[#52c41a] text-xs font-bold uppercase tracking-wider inline-block">
              Đội Ngũ Tinh Hoa Y Học
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#131b2f] tracking-tight mt-2">
              Bác Sĩ Tiêu Biểu &amp; Trưởng Khoa Quản Nhiệm
            </h2>
          </div>

          <Link
            href="/doctor"
            className="text-xs font-bold text-[#0037c1] flex items-center gap-1 hover:underline"
          >
            <span>Xem toàn bộ 1.200+ bác sĩ</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DOCTORS.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl p-6 border border-[#c4c5d7]/70 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {doc.avatar ? (
                    <img
                      alt={doc.name}
                      src={doc.avatar}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#0037c1]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#eaedff] text-[#0037c1] flex items-center justify-center shrink-0 border-2 border-[#0037c1]">
                      <span className="material-symbols-outlined text-3xl">{doc.icon}</span>
                    </div>
                  )}

                  <div>
                    <h4 className="text-base font-bold text-[#131b2f]">{doc.name}</h4>
                    <p className="text-xs font-semibold text-[#0037c1]">{doc.role}</p>
                    <div className="flex items-center gap-1 text-[11px] text-[#fa8c16] font-bold mt-1">
                      <span className="material-symbols-filled text-xs">star</span>
                      <span>{doc.ratingText}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#444654] leading-relaxed">{doc.bio}</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-[#eaedff] text-[#0037c1] text-[10px] font-semibold">
                    {doc.cchn}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${doc.badgeColor}`}
                  >
                    {doc.badge}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#f2f3ff] flex items-center justify-between">
                <span className="text-xs text-[#747686]">Phí khám: {doc.fee}</span>
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(doc.name)}
                  className="px-4 py-2 rounded-xl bg-[#0037c1] hover:bg-[#00258b] text-white text-xs font-bold transition-colors"
                >
                  Đặt lịch khám
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal notification when clicking booking */}
        {selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-[#c4c5d7]">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#131b2f]">Đặt lịch hẹn bác sĩ</h3>
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="text-[#747686] hover:text-[#131b2f]"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-[#444654]">
                Bạn đang chọn đặt lịch khám cùng <strong>{selectedDoctor}</strong>. Bộ phận điều phối y tế
                sẽ liên lạc xác nhận khung giờ thăm khám tận nơi trong vòng 10 phút.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="px-4 py-2 rounded-xl bg-[#0037c1] text-white text-xs font-bold"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

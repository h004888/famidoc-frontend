'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function LandingHero() {
  const [specialty, setSpecialty] = useState('Chuyên khoa: Bác sĩ Gia đình');
  const [location, setLocation] = useState('TP. Hồ Chí Minh');
  const [mode, setMode] = useState('Khám tại nhà riêng');

  return (
    <section
      id="tong-quan"
      className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden bg-gradient-to-b from-[#f2f3ff] via-[#faf8ff] to-white scroll-mt-20"
    >
      {/* Ambient Lighting Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0037c1]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] bg-[#fa8c16]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40rem] h-64 bg-[#52c41a]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* LEFT HERO CONTENT */}
          <div className="lg:col-span-7 space-y-6">
            {/* Innovation Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#c4c5d7]/50 shadow-sm">
              <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0037c1] via-[#fa8c16] to-[#52c41a]">
                ✨ Đột phá Y tế Gia đình Thông minh 4.0
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#fa8c16]" />
              <span className="text-[11px] font-semibold text-[#444654]">
                Bộ Y Tế cấp phép · CCHN chính quy
              </span>
              <span className="sr-only">Prologue · Khúc Mở Đầu</span>
            </div>

            {/* Main Power Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold text-[#131b2f] tracking-tight leading-[1.12]">
              Chăm sóc Y học Gia đình Tận tâm, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0037c1] via-[#1e61ea] to-[#306de4]">
                Chuẩn Y Khoa Toàn Diện
              </span>
            </h1>

            {/* Sharp Subtitle */}
            <p className="text-base sm:text-lg text-[#444654] leading-relaxed max-w-2xl font-normal">
              Gắn kết trực tiếp mỗi gia đình với một Bác sĩ Chuyên khoa gia đình riêng. Khám bệnh chu
              đáo tận nhà, tư vấn Telehealth trực tuyến 24/7 và đồng hành chăm sóc sức khỏe toàn diện
              cho cả gia đình.
            </p>

            {/* Dual Interactive CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="#dang-ky"
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-[#0037c1] to-[#1c55d9] hover:from-[#00258b] hover:to-[#0037c1] text-white text-sm font-bold shadow-glow-cobalt hover:shadow-lg flex items-center gap-2 group transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                  person_add
                </span>
                <span>Đăng ký Bác sĩ Riêng</span>
              </Link>

              <Link
                href="#he-sinh-thai"
                className="px-6 py-4 rounded-xl bg-white hover:bg-[#eaedff]/60 border border-[#c4c5d7] text-[#0037c1] text-sm font-bold flex items-center gap-2 shadow-sm hover:shadow transition-all duration-200"
              >
                <span className="material-symbols-filled text-[#fa8c16] text-[20px]">
                  play_circle
                </span>
                <span>Khám phá quy chuẩn chăm sóc riêng tư</span>
              </Link>
            </div>

            {/* QUICK CONSULTATION FINDER BAR */}
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl border border-[#c4c5d7]/70 shadow-[0_12px_40px_-10px_rgba(0,37,139,0.12)]">
              <div className="text-xs font-bold text-[#0037c1] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">travel_explore</span>
                Tìm Nhanh Bác Sĩ &amp; Đặt Lịch Khám Tại Chỗ
              </div>
              <form
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = document.getElementById('mang-luoi-bac-si');
                  target?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="sm:col-span-4 relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-[#747686] text-lg pointer-events-none">
                    stethoscope
                  </span>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 text-xs font-medium bg-[#f2f3ff] border-0 rounded-xl focus:ring-2 focus:ring-[#0037c1] text-[#131b2f]"
                  >
                    <option>Chuyên khoa: Bác sĩ Gia đình</option>
                    <option>Khoa Nhi &amp; Tiêm chủng</option>
                    <option>Nội Tim Mạch &amp; Huyết Áp</option>
                    <option>Nội Tiết &amp; Đái Tháo Đường</option>
                    <option>Lão Khoa &amp; Phục Hồi Chức Năng</option>
                  </select>
                </div>
                <div className="sm:col-span-3 relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-[#747686] text-lg pointer-events-none">
                    location_on
                  </span>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 text-xs font-medium bg-[#f2f3ff] border-0 rounded-xl focus:ring-2 focus:ring-[#0037c1] text-[#131b2f]"
                  >
                    <option>TP. Hồ Chí Minh</option>
                    <option>TP. Hà Nội</option>
                    <option>TP. Đà Nẵng</option>
                    <option>Bình Dương</option>
                  </select>
                </div>
                <div className="sm:col-span-3 relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-[#747686] text-lg pointer-events-none">
                    home_health
                  </span>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 text-xs font-medium bg-[#f2f3ff] border-0 rounded-xl focus:ring-2 focus:ring-[#0037c1] text-[#131b2f]"
                  >
                    <option>Khám tại nhà riêng</option>
                    <option>Tư vấn Video Telehealth</option>
                    <option>Khám tại Trạm y tế đối tác</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button
                    className="w-full h-11 rounded-xl bg-[#fa8c16] hover:bg-[#e07b10] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md hover:scale-[1.02] active:scale-95 transition-all"
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    <span>Tìm BS</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Micro Trust Tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#444654] pt-1">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-filled text-[#52c41a] text-base">
                  check_circle
                </span>
                Bảo hiểm Bảo Việt, PVI thanh toán 100%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-filled text-[#52c41a] text-base">
                  check_circle
                </span>
                Thăm khám tận nhà mọi lúc
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-filled text-[#52c41a] text-base">
                  check_circle
                </span>
                Mã hóa HIPAA &amp; HL7 FHIR
              </span>
            </div>
          </div>

          {/* RIGHT DYNAMIC BENTO HEALTHCARE HUB VISUAL */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Backdrop Glow Canvas */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0037c1]/20 via-[#fa8c16]/10 to-[#52c41a]/20 rounded-3xl filter blur-xl transform -rotate-1 pointer-events-none" />

              {/* Main Visual Card */}
              <div className="relative bg-white rounded-3xl p-3 sm:p-4 border border-[#c4c5d7]/80 shadow-2xl overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#eaedff]">
                  <img
                    alt="Bác sĩ gia đình đối thoại chuyên môn tại tư gia"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDX2bqO_NsB1pdcIi4WOqJ8fL8LiiOkBgaivK0yDYlvE825vNxEms-3asAppGBLBtBdzI6QdNNJczanFoQQAavEiCf7VQtx4JyM9fnP49PZeUFDZpEGSLE37JKdxVirTeXyoAqNUSwMxrYqLHoHcGJ73IAZ70JGNuEmaNOLaAHdLVWp1KUO4iJ1KfHyDNlSxJWBW5E72R5Uqjjdof0P-SMOZfwMVtyjAiNsPm728boPbTEv6SgvRbiUMA"
                  />
                  {/* Gradient overlay for legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#00258b]/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold">
                        Gia đình Bác Ba • Quận 1
                      </span>
                      <span className="text-emerald-300 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Đã kiểm tra 10 phút trước
                      </span>
                    </div>
                    <p className="text-xs text-white/90 font-medium">
                      Bác sĩ phụ trách:{' '}
                      <span className="font-bold text-white">BS.CKI Nguyễn Văn An</span> (Bệnh viện
                      ĐHYD)
                    </p>
                  </div>
                </div>

                {/* Bento Sub-Metrics Bar inside Main Card */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-[#eaedff]">
                  <div className="text-center p-2 rounded-xl bg-[#f2f3ff]">
                    <div className="text-[11px] text-[#747686]">Lịch tái khám</div>
                    <div className="text-xs font-bold text-[#0037c1]">Thứ Tư, 09:30</div>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-[#f2f3ff]">
                    <div className="text-[11px] text-[#747686]">Toa thuốc</div>
                    <div className="text-xs font-bold text-[#52c41a]">Đã giao 100%</div>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-[#f2f3ff]">
                    <div className="text-[11px] text-[#747686]">Đánh giá</div>
                    <div className="text-xs font-bold text-[#fa8c16] flex items-center justify-center gap-0.5">
                      <span className="material-symbols-filled text-[13px]">star</span> 5.0/5
                    </div>
                  </div>
                </div>
              </div>

              {/* FLOATING WIDGET: Doctor Response Time */}
              <div className="absolute -bottom-6 -right-3 sm:-right-6 bg-white/95 backdrop-blur-md border border-[#c4c5d7] rounded-2xl p-3 shadow-xl max-w-[270px]">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      alt="BS CKI Nguyễn Văn An"
                      className="w-11 h-11 rounded-full object-cover border-2 border-[#0037c1]"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPVaZVQ2uDKuIJ5QF6UI_tKLXNuifz8exCJ5i1p-vgJ8WDXGyyoEjqXdldXkMdD1kVE7PX5pbDYrzTi_ED28zllnZQ2opQlTgulj9Zw1mQps5Sq67DTxsRLxCpjLFZzPjrGqfBTAixcVWC5E5wRpX1oL8wk-xDWQE4LxGVYpiGKKmed4uz1tHAE5GmDSVgdw5sEGCMAu3lsLoZAogj9R-JnTxGTgxJgco9YQICEMXOiBQNwfDCGDMUzA"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#131b2f]">BS. CKI Nguyễn Văn An</div>
                    <div className="text-[11px] text-[#0037c1] font-semibold">
                      Bác sĩ gia đình phụ trách
                    </div>
                    <div className="text-[10px] text-[#52c41a] font-bold mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">bolt</span> Phản hồi
                      &lt; 2 phút
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Descriptive Monograph Text */}
            <div className="mt-8 pt-4 border-t border-[#c4c5d7]/40 text-xs text-[#444654] space-y-1">
              <span className="font-semibold text-[#0037c1] block">Biên khảo hiện trường</span>
              <p className="italic">
                &ldquo;Mỗi gia đình là một tiểu vũ trụ sức khỏe với tiền sử di truyền và thói quen
                sinh hoạt độc bản.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

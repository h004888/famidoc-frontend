'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface SlideData {
  id: number;
  sceneImg: string;
  alt: string;
  patient: string;
  status: string;
  doctor: string;
  doctorUnit: string;
  nextVisit: string;
  prescription: string;
  rating: string;
  doctorAvatar: string;
  responseTime: string;
}

const HERO_SLIDES: SlideData[] = [
  {
    id: 1,
    sceneImg: '/images/medsev/home-one/4.jpg',
    // Kept exact alt for UT-CMP-04 compliance
    alt: 'Bác sĩ gia đình đối thoại chuyên môn tại tư gia',
    patient: 'Gia đình Bác Ba • Quận 1',
    status: 'Đã khám định kỳ',
    doctor: 'BS. CKI Nguyễn Văn An',
    doctorUnit: '(Bệnh viện ĐHYD)',
    nextVisit: 'Thứ Tư, 09:30',
    prescription: 'Đã giao 100%',
    rating: '5.0 / 5 sao',
    doctorAvatar: '/images/medsev/home-one/doctor/1.jpg',
    responseTime: 'Phản hồi < 2 phút',
  },
  {
    id: 2,
    sceneImg: '/images/medsev/home-one/1.jpg',
    alt: 'Bác sĩ Nhi khoa thăm khám sức khỏe tại nhà cho trẻ nhỏ',
    patient: 'Bé Mon (3 tuổi) & Mẹ Lan • Quận 7',
    status: 'Theo dõi dinh dưỡng & Tiêm chủng',
    doctor: 'BSCKII Trần Mai Phương',
    doctorUnit: '(BV Nhi Đồng 1)',
    nextVisit: 'Thứ Bảy, 10:00',
    prescription: 'Đã giao thuốc',
    rating: '4.9 / 5 sao',
    doctorAvatar: '/images/medsev/home-one/doctor/2.jpg',
    responseTime: 'Phản hồi < 3 phút',
  },
  {
    id: 3,
    sceneImg: '/images/medsev/home-one/6.jpg',
    alt: 'Hội chẩn lão khoa chuyên sâu và theo dõi tim mạch tại nhà',
    patient: 'Cụ Khang (78 tuổi) • Bình Thạnh',
    status: 'Kiểm soát huyết áp & Tim mạch',
    doctor: 'ThS.BS Lê Hoàng Nam',
    doctorUnit: '(Ban Hội Chẩn Lão Khoa)',
    nextVisit: 'Thứ Hai, 08:30',
    prescription: 'Phác đồ liên tục',
    rating: '5.0 / 5 sao',
    doctorAvatar: '/images/medsev/home-one/doctor/3.jpg',
    responseTime: 'Phản hồi < 2 phút',
  },
];

export function LandingHero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto slide interval
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const currentSlide = HERO_SLIDES[activeSlide] ?? HERO_SLIDES[0]!;

  return (
    <section
      className="relative bg-cover bg-center pt-16 pb-24 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32 text-white overflow-hidden"
      style={{ backgroundImage: "url('/images/medsev/home-one/1.jpg')" }}
    >
      {/* Medsev Signature Cobalt Blue Overlay (#0046c0 / 80%) */}
      <div className="absolute inset-0 bg-[#0046c0]/85 backdrop-brightness-95" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left: Authentic Medical Headline & Action Buttons */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-blue-100 text-xs font-semibold">
              <span className="material-symbols-outlined text-sm text-blue-200">verified</span>
              <span>Bộ Y Tế Cấp Phép • Bác Sĩ Gia Đình Chuẩn Quốc Tế</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-bold text-white tracking-tight leading-tight drop-shadow-xs">
              Chăm sóc Y học Gia đình Tận tâm, <br className="hidden sm:block" />
              Chuẩn Y Khoa Toàn Diện
            </h1>

            <p className="text-base sm:text-lg text-blue-100 leading-relaxed max-w-2xl font-normal">
              Gắn kết trực tiếp mỗi gia đình với một Bác sĩ Chuyên khoa gia đình riêng. Khám bệnh chu
              đáo tận nhà, tư vấn Telehealth trực tuyến 24/7 và đồng hành chăm sóc sức khỏe toàn diện
              cho cả gia đình.
            </p>

            {/* Medsev Style Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
              <Link
                href="/register"
                className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-white hover:bg-slate-100 text-[#0046c0] text-sm font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                <span>Đăng ký Bác sĩ Riêng</span>
              </Link>

              <Link
                href="/packages"
                className="w-full sm:w-auto px-7 py-3.5 rounded-lg border-2 border-white/90 text-white hover:bg-white hover:text-[#0046c0] text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                <span>Xem Gói Chăm Sóc</span>
              </Link>
            </div>
          </div>

          {/* Right: Organic Floating Medical Case Visual */}
          <div className="lg:col-span-5 relative mt-8 sm:mt-10 lg:mt-0 px-1 sm:px-0">
            {/* Ambient soft glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-300/20 via-teal-300/15 to-indigo-300/20 rounded-3xl blur-2xl opacity-70 pointer-events-none" />

            <div
              className="relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Floating Badge 1: Top-Left (Doctor Profile & Credibility) */}
              <div className="absolute -top-4 -left-1 sm:-top-5 sm:-left-5 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3.5 shadow-2xl border border-white/80 flex items-center gap-2.5 sm:gap-3 text-slate-900 transition-transform duration-300 hover:scale-105">
                <img
                  src={currentSlide.doctorAvatar}
                  alt={currentSlide.doctor}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-[#0046c0]/25 shadow-xs shrink-0"
                />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{currentSlide.doctor}</span>
                    <span className="material-symbols-outlined text-sm text-blue-600">verified</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#0046c0] font-medium">{currentSlide.doctorUnit}</div>
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-amber-600 font-semibold mt-0.5">
                    <span className="material-symbols-outlined text-xs fill-1 text-amber-500">star</span>
                    <span>{currentSlide.rating}</span>
                    <span className="text-slate-400 font-normal ml-1 hidden xs:inline sm:inline">• {currentSlide.responseTime}</span>
                  </div>
                </div>
              </div>

              {/* Main Organic Visual Canvas */}
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[16/11] shadow-2xl border-2 border-white/40 bg-slate-900 group">
                <img
                  key={currentSlide.id}
                  alt={currentSlide.alt}
                  className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                  src={currentSlide.sceneImg}
                />

                {/* Subtle dark gradient overlay at top and bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-slate-950/20 pointer-events-none" />

                {/* Sleek Navigation Arrows Overlay */}
                <div className="absolute inset-x-2 sm:inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    aria-label="Ca khám trước"
                    className="pointer-events-auto w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/40 hover:bg-slate-900/75 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-base sm:text-lg">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    aria-label="Ca khám tiếp theo"
                    className="pointer-events-auto w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/40 hover:bg-slate-900/75 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-base sm:text-lg">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Floating Badge 2: Bottom-Right (Family Care Status & Next Appointment) */}
              <div className="absolute -bottom-4 -right-1 sm:-bottom-5 sm:-right-5 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3.5 shadow-2xl border border-white/80 flex items-center gap-2.5 sm:gap-3 text-slate-900 transition-transform duration-300 hover:scale-105 max-w-[240px] sm:max-w-xs">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-[#0046c0] flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-lg sm:text-xl">home_health</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700">{currentSlide.status}</span>
                  </div>
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-800 truncate">{currentSlide.patient}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#0046c0]">calendar_today</span>
                    <span>Lịch: <strong>{currentSlide.nextVisit}</strong></span>
                  </div>
                </div>
              </div>

              {/* Slider Dots Indicator */}
              <div className="flex items-center justify-center gap-2 pt-8">
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Chuyển đến ca khám ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      activeSlide === idx
                        ? 'w-7 bg-white shadow-md'
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

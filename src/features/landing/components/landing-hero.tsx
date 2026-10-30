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
      id="tong-quan"
      className="relative bg-cover bg-center pt-16 pb-24 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32 text-white scroll-mt-20 overflow-hidden"
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
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/register"
                className="px-7 py-3.5 rounded-lg bg-white hover:bg-slate-100 text-[#0046c0] text-sm font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                <span>Đăng ký Bác sĩ Riêng</span>
              </Link>

              <Link
                href="/packages"
                className="px-7 py-3.5 rounded-lg border-2 border-white/90 text-white hover:bg-white hover:text-[#0046c0] text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                <span>Xem Gói Chăm Sóc</span>
              </Link>
            </div>
          </div>

          {/* Right: Interactive Medical Case Slider */}
          <div className="lg:col-span-5">
            <div
              className="bg-white rounded-2xl p-4 sm:p-5 border border-white/40 shadow-2xl space-y-4 relative text-slate-900"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Slider Image Box */}
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 group shadow-inner">
                {/* Primary Slide Image */}
                <img
                  key={currentSlide.id}
                  alt={currentSlide.alt}
                  className="w-full h-full object-cover animate-fade-in"
                  src={currentSlide.sceneImg}
                />

                {/* Slider Navigation Arrows */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-900/60 backdrop-blur-xs p-1 rounded-md text-white">
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    aria-label="Ca khám trước"
                    className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>
                  <span className="text-[11px] px-1 font-mono font-medium">
                    {activeSlide + 1}/{HERO_SLIDES.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    aria-label="Ca khám tiếp theo"
                    className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Slider Info Content */}
              <div className="space-y-3 px-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentSlide.doctorAvatar}
                      alt={currentSlide.doctor}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-100 shadow-xs"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{currentSlide.doctor}</div>
                      <div className="text-[11px] text-[#0046c0] font-medium">{currentSlide.doctorUnit}</div>
                    </div>
                  </div>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                    {currentSlide.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#0046c0]">calendar_today</span>
                    <span>Lịch khám: <strong>{currentSlide.nextVisit}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-amber-500">star</span>
                    <span>Đánh giá: <strong>{currentSlide.rating}</strong></span>
                  </div>
                </div>
              </div>

              {/* Slider Dots Indicator */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Chuyển đến ca khám ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeSlide === idx
                        ? 'w-6 bg-[#0046c0]'
                        : 'w-2 bg-slate-200 hover:bg-slate-300'
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

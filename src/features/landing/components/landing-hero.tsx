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
  const [specialty, setSpecialty] = useState('Chuyên khoa: Bác sĩ Gia đình');
  const [location, setLocation] = useState('TP. Hồ Chí Minh');
  const [mode, setMode] = useState('Khám tại nhà riêng');
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      const target = document.getElementById('bac-si') || document.getElementById('mang-luoi-bac-si');
      target?.scrollIntoView({ behavior: 'smooth' });
    }, 350);
  };

  const currentSlide = HERO_SLIDES[activeSlide] ?? HERO_SLIDES[0]!;

  return (
    <section
      id="tong-quan"
      className="pt-8 pb-16 lg:pt-14 lg:pb-20 bg-slate-50 border-b border-slate-200 scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left: Authentic Medical Headline & Doctor Search */}
          <div className="lg:col-span-7 space-y-6">

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
              Chăm sóc Y học Gia đình Tận tâm, <br className="hidden sm:block" />
              Chuẩn Y Khoa Toàn Diện
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Gắn kết trực tiếp mỗi gia đình với một Bác sĩ Chuyên khoa gia đình riêng. Khám bệnh chu
              đáo tận nhà, tư vấn Telehealth trực tuyến 24/7 và đồng hành chăm sóc sức khỏe toàn diện
              cho cả gia đình.
            </p>

            {/* Medsev Style Flat Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/register"
                className="px-6 py-3 rounded-md bg-[#0046c0] hover:bg-[#003899] text-white text-sm font-medium transition-all duration-200 shadow-sm hover:shadow hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                <span>Đăng ký Bác sĩ Riêng</span>
              </Link>
            </div>
          </div>

          {/* Right: Interactive Medical Case Slider */}
          <div className="lg:col-span-5">
            <div
              className="bg-white rounded-lg p-4 border border-slate-200 space-y-4 shadow-sm hover:shadow-md transition-shadow relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Slider Image Box */}
              <div className="relative rounded overflow-hidden aspect-[4/3] bg-slate-100 group">
                {/* Primary Slide Image */}
                <img
                  key={currentSlide.id}
                  alt={currentSlide.alt}
                  className="w-full h-full object-cover animate-fade-in"
                  src={currentSlide.sceneImg}
                />

                {/* Slider Navigation Arrows (Subtle & Clinical) */}
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

              {/* Slider Dots Indicator */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Chuyển đến ca khám ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${activeSlide === idx
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


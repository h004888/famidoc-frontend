import {
  LandingHeader,
  LandingHero,
  LandingStats,
  LandingAbout,
  LandingProcess,
  LandingDoctors,
  LandingPackages,
  LandingCtaBanner,
  LandingFooter,
} from '@/features/landing';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden pb-16 md:pb-0">
      <LandingHeader />
      <main className="flex-1">
        {/* 1. Medsev Hero Banner & Quick Doctor Finder */}
        <LandingHero />

        {/* 2. Medsev Counter: Số Liệu & Thành Tựu Y Khoa */}
        <LandingStats />

        {/* 3. Medsev About: Giới Thiệu Hệ Thống FamiDoc */}
        <LandingAbout />

        {/* 4. FamiDoc 4 Trụ Cột Đổi Mới Chăm Sóc Y Tế Gia Đình */}
        <LandingProcess />

        {/* 5. Medsev Doctors: Đội Ngũ Bác Sĩ Tiêu Biểu */}
        <LandingDoctors />

        {/* 6. FamiDoc Care Packages: Gói Chăm Sóc Sức Khỏe Gia Đình */}
        <LandingPackages />

        {/* 7. Medsev Consultation & Hotline Cấp Cứu 24/7 */}
        <LandingCtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}

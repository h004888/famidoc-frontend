import { Suspense } from 'react';
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
import { fetchHomePageData } from '@/features/landing/api/landing-queries';

async function HomeDynamicSections() {
  const { metrics, doctors, totalDoctors, packages } = await fetchHomePageData();

  return (
    <>
      {/* 2. Medsev Counter: Số Liệu & Thành Tựu Y Khoa */}
      <LandingStats metrics={metrics} />

      {/* 3. Medsev About: Giới Thiệu Hệ Thống FamiDoc */}
      <LandingAbout />

      {/* 4. FamiDoc 4 Trụ Cột Đổi Mới Chăm Sóc Y Tế Gia Đình */}
      <LandingProcess />

      {/* 5. Medsev Doctors: Đội Ngũ Bác Sĩ Tiêu Biểu */}
      <LandingDoctors doctors={doctors} totalDoctors={totalDoctors} />

      {/* 6. FamiDoc Care Packages: Gói Chăm Sóc Sức Khỏe Gia Đình */}
      <LandingPackages packages={packages} />

      {/* 7. Medsev Consultation & Hotline Cấp Cứu 24/7 */}
      <LandingCtaBanner packages={packages} />
    </>
  );
}

function HomeDynamicFallback() {
  return (
    <>
      <LandingStats />
      <LandingAbout />
      <LandingProcess />
      <LandingDoctors />
      <LandingPackages />
      <LandingCtaBanner />
    </>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden pb-16 md:pb-0">
      <LandingHeader />
      <main className="flex-1">
        {/* 1. Medsev Hero Banner & Quick Doctor Finder */}
        <LandingHero />

        <Suspense fallback={<HomeDynamicFallback />}>
          <HomeDynamicSections />
        </Suspense>
      </main>
      <LandingFooter />
    </div>
  );
}

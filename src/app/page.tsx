import {
  LandingHeader,
  LandingHero,
  LandingStats,
  LandingProcess,
  LandingPackages,
  LandingDoctors,
  LandingCtaBanner,
  LandingFooter,
} from '@/features/landing';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#faf8ff] text-[#131b2f] font-sans antialiased selection:bg-[#dde1ff] selection:text-[#00258b] overflow-x-hidden">
      <LandingHeader />
      <main className="flex-1">
        {/* Sảnh Đón & Tuyên Ngôn Y Đức: Hero & Quick Doctor Finder */}
        <LandingHero />

        {/* Số Liệu & Bảo Chứng: Stats Banner 50k+ Gia Đình & 1.200+ Bác Sĩ */}
        <LandingStats />

        {/* 4 Trụ Cột Đổi Mới Toàn Diện Trải Nghiệm Khám Chữa Bệnh */}
        <LandingProcess />

        {/* Mạng Lưới Bác Sĩ Tiêu Biểu & Trưởng Khoa Quản Nhiệm */}
        <LandingDoctors />

        {/* Gói Chăm Sóc Sức Khỏe Gia Đình & Minh Bạch Chi Phí */}
        <LandingPackages />

        {/* Tiêu Chuẩn Bảo Mật & Đăng Ký Tư Vấn Đồng Hành */}
        <LandingCtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}

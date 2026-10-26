import React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-on-surface antialiased font-body-md text-body-md min-h-screen flex flex-col justify-between selection:bg-surface-container-high selection:text-primary border-t-2 border-[#4338ca]">
      {/* Header Y Tế Tinh Gọn FamiDoc theo chuẩn Stitch */}
      <header className="bg-surface-container-lowest sticky top-0 z-40 w-full shadow-sm border-b border-outline-variant/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo FamiDoc */}
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-95 focus:outline-none"
          >
            <img
              alt="FamiDoc Logo"
              className="h-12 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB09IDlcE5GcUZmtrA1bkMmfDry7h-cK33XseWir7o6mnTYMx2xntl3SIR6kUS6OF_vJ6zIiWLaa8fz6jOvRMIKQKhGP7ORv8VpNap5fvewTq1Q0AcgY_VrW02vvJENJsm-ZG1zY2XiAec3_JZT7VQKo7TAejrHsWoby6YyJJOJjMLDxQ6ei9iuTFBTzhsv1pVsqQFlmBfYLknc-kE2R7e5jI8QPbxAOIELT1EzDzyJYpKlpDPWZqtPO9hfXxjIqB7R1qw"
            />
          </Link>

          {/* Menu Điều Hướng Trung Tâm */}
          <nav className="hidden md:flex items-center gap-8 font-label-lg text-sm font-semibold text-on-surface-variant">
            <Link href="/#he-sinh-thai" className="hover:text-primary transition-colors duration-150">
              Dịch vụ &amp; Gói khám
            </Link>
            <Link href="/#mang-luoi-bac-si" className="hover:text-primary transition-colors duration-150">
              Mạng lưới Bác sĩ
            </Link>
            <Link href="/#bang-gia" className="hover:text-primary transition-colors duration-150">
              Bảng giá
            </Link>
          </nav>

          {/* Nút Chuyển Đổi Nhanh / Hotline */}
          <div className="flex items-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-surface-container-low text-primary border border-surface-container-highest hover:bg-surface-container font-label-lg text-sm font-semibold px-5 py-2.5 rounded-lg transition-all duration-150 shadow-sm hover:shadow"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </header>

      {/* Khu Vực Trọng Tâm: Multi-Role Sign In Canvas */}
      <main className="flex-grow flex items-center justify-center py-10 md:py-14 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-surface-container-low via-background to-surface">
        {/* Subtle Ambient Medical Gradient Elements */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-surface-variant/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none" />
        {children}
      </main>

      {/* Chân Trang Đa Tầng Chuẩn Y Tế FamiDoc */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/60 text-on-surface-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          {/* Lưới Nội Dung Chân Trang */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
            {/* Cột 1: Thương Hiệu & Giấy Phép (chiếm 2 cột trên lg) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <img
                  alt="FamiDoc Logo"
                  className="h-10 w-auto object-contain"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB09IDlcE5GcUZmtrA1bkMmfDry7h-cK33XseWir7o6mnTYMx2xntl3SIR6kUS6OF_vJ6zIiWLaa8fz6jOvRMIKQKhGP7ORv8VpNap5fvewTq1Q0AcgY_VrW02vvJENJsm-ZG1zY2XiAec3_JZT7VQKo7TAejrHsWoby6YyJJOJjMLDxQ6ei9iuTFBTzhsv1pVsqQFlmBfYLknc-kE2R7e5jI8QPbxAOIELT1EzDzyJYpKlpDPWZqtPO9hfXxjIqB7R1qw"
                />
              </div>
              <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-sm">
                FamiDoc Pro - Hệ sinh thái Y tế Bác sĩ Gia đình Toàn diện. Tiên phong giải pháp chăm sóc
                sức khỏe ban đầu, theo dõi bệnh mạn tính và quản lý hồ sơ liên thông.
              </p>
            </div>

            {/* Cột 2: Dịch Vụ Y Tế */}
            <div>
              <h4 className="font-label-lg text-sm text-on-surface mb-3.5 tracking-tight font-semibold">
                Dịch vụ Y tế
              </h4>
              <ul className="space-y-2 font-body-sm text-xs sm:text-sm">
                <li>
                  <Link href="/#he-sinh-thai" className="hover:text-primary transition-colors">
                    Bác sĩ gia đình tận nơi
                  </Link>
                </li>
                <li>
                  <Link href="/#he-sinh-thai" className="hover:text-primary transition-colors">
                    Tư vấn sức khỏe từ xa (Telehealth)
                  </Link>
                </li>
                <li>
                  <Link href="/#he-sinh-thai" className="hover:text-primary transition-colors">
                    Lấy mẫu xét nghiệm tại nhà
                  </Link>
                </li>
                <li>
                  <Link href="/#he-sinh-thai" className="hover:text-primary transition-colors">
                    Theo dõi huyết áp &amp; đái tháo đường
                  </Link>
                </li>
                <li>
                  <Link href="/#he-sinh-thai" className="hover:text-primary transition-colors">
                    Kê đơn điện tử liên thông
                  </Link>
                </li>
              </ul>
            </div>

            {/* Cột 3: Gói Khám Gia Đình */}
            <div>
              <h4 className="font-label-lg text-sm text-on-surface mb-3.5 tracking-tight font-semibold">
                Gói khám &amp; Quyền lợi
              </h4>
              <ul className="space-y-2 font-body-sm text-xs sm:text-sm">
                <li>
                  <Link href="/#bang-gia" className="hover:text-primary transition-colors">
                    Gói Chăm sóc Sức khỏe Tam Đại
                  </Link>
                </li>
                <li>
                  <Link href="/#bang-gia" className="hover:text-primary transition-colors">
                    Gói Quản lý Người cao tuổi
                  </Link>
                </li>
                <li>
                  <Link href="/#bang-gia" className="hover:text-primary transition-colors">
                    Gói Nhi khoa &amp; Tiêm chủng định kỳ
                  </Link>
                </li>
                <li>
                  <Link href="/#bang-gia" className="hover:text-primary transition-colors">
                    Bảo lãnh viện phí liên kết
                  </Link>
                </li>
                <li>
                  <Link href="/#bang-gia" className="hover:text-primary transition-colors">
                    Tra cứu lịch tiêm vắc xin
                  </Link>
                </li>
              </ul>
            </div>

            {/* Cột 4: Tổng Đài Trực Ban & Hỗ Trợ */}
            <div>
              <h4 className="font-label-lg text-sm text-on-surface mb-3.5 tracking-tight font-semibold">
                Hỗ trợ &amp; Khẩn cấp
              </h4>
              <div className="space-y-3 font-body-sm text-xs sm:text-sm">
                <div>
                  <p className="text-on-surface-variant font-label-sm text-xs">
                    Tổng đài y tế trực ban 24/7:
                  </p>
                  <p className="font-headline-sm text-lg sm:text-xl text-primary font-bold">1900 6868</p>
                </div>
                <div>
                  <p className="text-on-surface-variant font-label-sm text-xs">
                    Đường dây nóng chuyên môn:
                  </p>
                  <p className="font-label-lg text-xs sm:text-sm text-on-surface font-semibold">
                    (024) 7300 8821
                  </p>
                </div>
                <div>
                  <p className="text-on-surface-variant font-label-sm text-xs">
                    Hòm thư tiếp nhận nghiệp vụ:
                  </p>
                  <p className="text-on-surface">hotro@famidoc.vn</p>
                </div>
              </div>
            </div>
          </div>

          {/* Đường Phân Tách Phía Dưới */}
          <div className="border-t border-outline-variant/50 pt-6 flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-label-sm text-xs text-on-surface-variant">
              <Link href="/#bao-mat" className="hover:text-primary transition-colors">
                Chính sách bảo mật y tế
              </Link>
              <span className="text-outline/40">•</span>
              <Link href="/#bao-mat" className="hover:text-primary transition-colors">
                Tiêu chuẩn HIPAA/HL7
              </Link>
              <span className="text-outline/40">•</span>
              <Link href="/#bao-mat" className="hover:text-primary transition-colors">
                Quy chuẩn kỹ thuật Bộ Y Tế
              </Link>
              <span className="text-outline/40">•</span>
              <Link href="/#bao-mat" className="hover:text-primary transition-colors">
                Điều khoản dịch vụ
              </Link>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant/80 max-w-3xl">
              &copy; 2024 FamiDoc Pro. Hệ sinh thái Y tế Bác sĩ Gia đình Toàn diện. Tuân thủ tiêu chuẩn an
              toàn bảo mật dữ liệu y tế và liên thông hồ sơ sức khỏe điện tử Bộ Y Tế.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
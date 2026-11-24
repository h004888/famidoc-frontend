import React from 'react';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-[#c4c5d7]/70 text-[#444654] text-sm pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <img
                alt="FamiDoc Logo"
                className="h-10 w-auto object-contain"
                src="/images/FamiDoc Healthcare Logo.png"
              />
            </Link>

            <p className="text-sm text-[#444654] leading-relaxed max-w-md">
              FamiDoc là cầu nối tin cậy giữa gia đình bạn và các cơ sở y tế được cấp phép, mang đến
              dịch vụ bác sĩ gia đình chăm sóc sức khỏe xuyên suốt tại nhà và tư vấn trực tuyến. Bác sĩ
              phụ trách được cơ sở y tế xác thực và phân công riêng cho từng hộ gia đình.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <Link
                href="#"
                className="w-8 h-8 rounded-full bg-[#f2f3ff] text-[#0037c1] hover:bg-[#0037c1] hover:text-white flex items-center justify-center transition-colors"
                aria-label="Website quốc tế"
              >
                <span className="material-symbols-outlined text-sm">public</span>
              </Link>
              <Link
                href="mailto:hotro@famidoc.vn"
                className="w-8 h-8 rounded-full bg-[#f2f3ff] text-[#0037c1] hover:bg-[#0037c1] hover:text-white flex items-center justify-center transition-colors"
                aria-label="Gửi email"
              >
                <span className="material-symbols-outlined text-sm">mail</span>
              </Link>
              <Link
                href="#"
                className="w-8 h-8 rounded-full bg-[#f2f3ff] text-[#0037c1] hover:bg-[#0037c1] hover:text-white flex items-center justify-center transition-colors"
                aria-label="Chia sẻ"
              >
                <span className="material-symbols-outlined text-sm">share</span>
              </Link>
            </div>
          </div>

          {/* Links Col 1: Dịch Vụ Y Tế */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#131b2f] text-base">Dịch Vụ Y Tế</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/doctors" className="hover:text-[#0037c1] transition-colors">
                  Bác sĩ thăm khám tại nhà
                </Link>
              </li>
              <li>
                <Link href="/facilities" className="hover:text-[#0037c1] transition-colors">
                  Mạng lưới bệnh viện đối tác
                </Link>
              </li>
              <li>
                <Link href="/packages" className="hover:text-[#0037c1] transition-colors">
                  Quản lý bệnh mạn tính gia đình
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-[#0037c1] transition-colors">
                  Tư vấn Telehealth trực tuyến 24/7
                </Link>
              </li>
              <li>
                <Link href="/packages" className="hover:text-[#0037c1] transition-colors">
                  Lập phác đồ dinh dưỡng &amp; lối sống
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 2: Chuyên Khoa & Gói Khám */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#131b2f] text-base">Chuyên Khoa &amp; Gói Khám</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/packages" className="hover:text-[#0037c1] transition-colors">
                  Gói Gia Đình Toàn Diện
                </Link>
              </li>
              <li>
                <Link href="/packages" className="hover:text-[#0037c1] transition-colors">
                  Gói Chăm Sóc Người Cao Tuổi
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-[#0037c1] transition-colors">
                  Nhi khoa &amp; Tiêm chủng
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-[#0037c1] transition-colors">
                  Tim mạch &amp; Huyết áp
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-[#0037c1] transition-colors">
                  Nội tiết &amp; Đái tháo đường
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 3: Liên Hệ & Trực Ban */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#131b2f] text-base">Liên Hệ &amp; Trực Ban</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#fa8c16]">call</span>
                <span>
                  <strong>1900 6868</strong> (Hotline 24/7)
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#0037c1]">mail</span>
                <span>hotro@famidoc.vn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Policy Strip */}
        <div className="pt-8 border-t border-[#c4c5d7]/50 flex flex-col lg:flex-row justify-between items-center gap-4 text-xs sm:text-sm">
          <div className="text-slate-600 text-center lg:text-left">
            FamiDoc — Nền tảng Quản lý Bác sĩ Gia đình
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-x-3 gap-y-2">
            <Link href="/contact" className="hover:text-[#0037c1] hover:underline whitespace-nowrap">
              Chính sách bảo mật
            </Link>
            <span className="text-[#c4c5d7]" aria-hidden="true">•</span>
            <Link href="/contact" className="hover:text-[#0037c1] hover:underline whitespace-nowrap">
              Tiêu chuẩn HIPAA/HL7
            </Link>
            <span className="text-[#c4c5d7]" aria-hidden="true">•</span>
            <Link href="/contact" className="hover:text-[#0037c1] hover:underline whitespace-nowrap">
              Quy chuẩn Bộ Y Tế
            </Link>
            <span className="text-[#c4c5d7]" aria-hidden="true">•</span>
            <Link href="/contact" className="hover:text-[#0037c1] hover:underline whitespace-nowrap">
              Điều khoản dịch vụ
            </Link>
            <span className="text-[#c4c5d7]" aria-hidden="true">•</span>
            <a
              href="tel:19008821"
              className="hover:text-[#0037c1] hover:underline font-semibold text-[#0037c1] whitespace-nowrap"
            >
              Hotline: 1900 8821
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

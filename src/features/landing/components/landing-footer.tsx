import React from 'react';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer
      id="bao-mat"
      className="bg-white border-t border-[#c4c5d7]/70 text-[#444654] text-xs pt-14 pb-8 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <img
                alt="FamiDoc Logo"
                className="h-10 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP2vLQlo-MlGsI60EM5op1cowa65mzi3lQCTKVDEhd4eOaX_AXD-_4doTHhY3JsZHdyJlWx3ltpzrzhvAPzoe5ZPqr69VWvahuedT5UOCn908_fbKE8Sx-szaLJm6wj50WPDvkCB5G_09YUJCBIM-OfKscXyFy5UKaO3_PBYaH8q_K5KgYZnyl7ZZy4kUUbwsud2gALiXSlvdTtGhcubqJgE8TlyaZjRsXyjKcmN3QCFaCti5EqT90rByysgWpb4D_Qoc"
              />
            </Link>

            <p className="text-xs text-[#444654] leading-relaxed max-w-sm">
              FamiDoc Pro là nền tảng quản trị bác sĩ gia đình và kết nối y tế thông minh toàn diện tại
              Việt Nam. Tuân thủ tiêu chuẩn an toàn bảo mật dữ liệu y tế, cấp chứng chỉ hành nghề chính
              thức bởi Bộ Y Tế.
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
            <h4 className="font-bold text-[#131b2f] text-sm">Dịch Vụ Y Tế</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#tru-cot" className="hover:text-[#0037c1] transition-colors">
                  Bác sĩ thăm khám tại nhà
                </Link>
              </li>
              <li>
                <Link href="#tru-cot" className="hover:text-[#0037c1] transition-colors">
                  Quản lý bệnh mạn tính gia đình
                </Link>
              </li>
              <li>
                <Link href="#tru-cot" className="hover:text-[#0037c1] transition-colors">
                  Tư vấn Telehealth trực tuyến 24/7
                </Link>
              </li>
              <li>
                <Link href="#tru-cot" className="hover:text-[#0037c1] transition-colors">
                  Lập phác đồ dinh dưỡng &amp; lối sống
                </Link>
              </li>
              <li>
                <Link href="#tru-cot" className="hover:text-[#0037c1] transition-colors">
                  Giao thuốc tận nơi 24/7
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 2: Chuyên Khoa & Gói Khám */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#131b2f] text-sm">Chuyên Khoa &amp; Gói Khám</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#goi-kham" className="hover:text-[#0037c1] transition-colors">
                  Gói Gia Đình Toàn Diện
                </Link>
              </li>
              <li>
                <Link href="#goi-kham" className="hover:text-[#0037c1] transition-colors">
                  Gói Chăm Sóc Người Cao Tuổi
                </Link>
              </li>
              <li>
                <Link href="#mang-luoi-bac-si" className="hover:text-[#0037c1] transition-colors">
                  Nhi khoa &amp; Tiêm chủng
                </Link>
              </li>
              <li>
                <Link href="#mang-luoi-bac-si" className="hover:text-[#0037c1] transition-colors">
                  Tim mạch &amp; Huyết áp
                </Link>
              </li>
              <li>
                <Link href="#mang-luoi-bac-si" className="hover:text-[#0037c1] transition-colors">
                  Nội tiết &amp; Đái tháo đường
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 3: Liên Hệ & Trực Ban */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#131b2f] text-sm">Liên Hệ &amp; Trực Ban</h4>
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
              <li>VP Chính: Tòa nhà Y Dược Innovation, Quận 1, TP. Hồ Chí Minh</li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Policy Strip */}
        <div className="pt-8 border-t border-[#c4c5d7]/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div>
            &copy; 2026 FamiDoc Pro. Tất cả quyền được bảo lưu. Giấy phép hoạt động khám bệnh, chữa
            bệnh số 08821/BYT-GPHĐ.
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="#bao-mat" className="hover:text-[#0037c1] hover:underline">
              Chính sách bảo mật y tế
            </Link>
            <span className="text-[#c4c5d7]">•</span>
            <Link href="#bao-mat" className="hover:text-[#0037c1] hover:underline">
              Tiêu chuẩn HIPAA/HL7
            </Link>
            <span className="text-[#c4c5d7]">•</span>
            <Link href="#bao-mat" className="hover:text-[#0037c1] hover:underline">
              Quy chuẩn kỹ thuật Bộ Y Tế
            </Link>
            <span className="text-[#c4c5d7]">•</span>
            <Link href="#bao-mat" className="hover:text-[#0037c1] hover:underline">
              Điều khoản dịch vụ
            </Link>
            <span className="text-[#c4c5d7]">•</span>
            <a
              href="tel:19008821"
              className="hover:text-[#0037c1] hover:underline font-medium text-[#0037c1]"
            >
              Đường dây nóng: 1900 8821
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

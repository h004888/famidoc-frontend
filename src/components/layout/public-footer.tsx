import React from 'react';
import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="w-full bg-[#0f172a] text-slate-400 pt-14 pb-8 border-t border-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Brand & Certification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-fit">
              <img
                src="https://lh3.googleusercontent.com/aida/AEtjO1VGFBkcBnjb_yQ3Pilw06uvJveo64o_OJ8cvSXUbxFJb1_SGb4mCSZwI1Zh4P_hCDxpV_j1zwAP3TtDTuNfhMQI4Zc0isRUQ8rtqCyleXqu7yW_upN6Zg5iMiy-DhB5Ux6rFYcwntyUYQ2eg5zzE-vaSS-UXk4q4T-F-esp6vbHESlnsdOuuEPVVdF5W5H1oqZQEb1x56ErH3NRNEPBQocHS7s8hPxg8y2bOOlMOPfy"
                alt="FamiDoc Logo"
                className="h-9 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hệ thống y tế bác sĩ gia đình chuẩn mực, kết nối liên tục giữa bác sĩ chuyên khoa và từng hộ gia đình Việt
              Nam. Chăm sóc tận tâm, bảo vệ trọn đời.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="material-symbols-outlined text-[#10b981] text-base">verified_user</span>
              <span>Chứng nhận Bộ Y Tế &amp; Tiêu chuẩn HIPAA</span>
            </div>
          </div>

          {/* Column 2: Emergency & Hotline */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-base">Hỗ Trợ &amp; Cấp Cứu 24/7</h4>
            <div className="p-4 rounded-xl bg-[#1e293b] border border-slate-700 space-y-1">
              <div className="text-xs text-slate-300 font-medium">Tổng đài tư vấn y tế toàn quốc</div>
              <div className="text-xl font-bold text-[#f59e0b] flex items-center gap-2">
                <span className="material-symbols-outlined">call</span>
                1900 6868
              </div>
              <p className="text-[11px] text-slate-400">Hỗ trợ kết nối khẩn cấp với bác sĩ trực tuyến 24/7.</p>
            </div>
            <div className="text-xs text-slate-300 space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-blue-400">mail</span>
                <span>hotro@famidoc.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-blue-400">location_on</span>
                <span>Hà Nội: 128 Hai Bà Trưng, Q. Hoàn Kiếm</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-blue-400">location_on</span>
                <span>TP.HCM: 215 Hồng Bàng, Phường 11, Quận 5</span>
              </div>
            </div>
          </div>

          {/* Column 3: Medical Specialties */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-base">Danh Mục Bác Sĩ</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link className="hover:text-blue-400 transition-colors flex items-center gap-1" href="/doctors?specialty=general">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                  Bác sĩ Gia đình Tổng quát
                </Link>
              </li>
              <li>
                <Link className="hover:text-blue-400 transition-colors flex items-center gap-1" href="/doctors?specialty=pediatric">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                  Nhi khoa &amp; Sức khỏe Trẻ em
                </Link>
              </li>
              <li>
                <Link className="hover:text-blue-400 transition-colors flex items-center gap-1" href="/doctors?specialty=elderly">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                  Lão khoa &amp; Bệnh mạn tính
                </Link>
              </li>
              <li>
                <Link className="hover:text-blue-400 transition-colors flex items-center gap-1" href="/doctors?specialty=cardiology">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                  Tim mạch &amp; Chuyển hóa
                </Link>
              </li>
              <li>
                <Link className="hover:text-blue-400 transition-colors flex items-center gap-1" href="/doctors?tab=facilities">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                  Cơ sở liên kết &amp; Bệnh viện đối tác
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Policy & Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-base">Pháp Lý &amp; Chính Sách</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link className="hover:text-blue-400 transition-colors flex items-center gap-1" href="/privacy">
                  <span className="material-symbols-outlined text-sm">security</span>
                  Chính sách bảo mật dữ liệu y tế
                </Link>
              </li>
              <li>
                <Link className="hover:text-blue-400 transition-colors flex items-center gap-1" href="/terms">
                  <span className="material-symbols-outlined text-sm">description</span>
                  Điều khoản sử dụng dịch vụ
                </Link>
              </li>
              <li>
                <Link className="hover:text-blue-400 transition-colors flex items-center gap-1" href="/privacy">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Cam kết quyền riêng tư bệnh nhân
                </Link>
              </li>
              <li>
                <Link className="hover:text-blue-400 transition-colors flex items-center gap-1" href="/packages">
                  <span className="material-symbols-outlined text-sm">assignment_return</span>
                  Quy chế bồi hoàn &amp; Đổi gói dịch vụ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 FamiDoc Vietnam Healthcare JSC. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-blue-400">lock</span>
              Bảo mật đường truyền SSL 256-bit
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#10b981]">shield</span>
              Tuân thủ quy chuẩn BYT
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}


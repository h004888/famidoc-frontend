import React from 'react';
import Link from 'next/link';

export function LandingAbout() {
  return (
    <section id="ve-chung-toi" className="py-20 bg-white border-b border-slate-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Real Clinic Image */}
          <div className="lg:col-span-6">
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src="/images/medsev/home-one/1.jpg"
                alt="FamiDoc Clinic & Family Healthcare"
                className="w-full h-auto object-cover aspect-[4/3]"
              />
            </div>
          </div>

          {/* Right: Hospital Introduction Content */}
          <div className="lg:col-span-6 space-y-5">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Mô Hình Bác Sĩ Gia Đình Toàn Diện, <br />
              Đồng Hành Sức Khỏe Cho Mọi Thế Hệ
            </h2>

            <p className="text-base text-slate-600 leading-relaxed font-normal">
              FamiDoc gắn kết trực tiếp mỗi hộ gia đình với một Bác sĩ Chuyên khoa gia đình uy tín. Chúng tôi kết hợp giữa thăm khám trực tiếp tại gia đình, hệ thống chẩn đoán đa khoa liên thông tuyến trên và nền tảng Telemedicine hiện đại đạt chuẩn an toàn dữ liệu y tế.
            </p>

            {/* Checklist */}
            <ul className="space-y-3 pt-2 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0 mt-0.5">check</span>
                <span>Bác sĩ phụ trách định kỳ khám tận nhà, theo dõi sát sao bệnh mãn tính và tiền sử gia đình.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0 mt-0.5">check</span>
                <span>Tư vấn Video Telehealth WebRTC 24/7 trực tiếp cùng đội ngũ bác sĩ nội trú, chuyên gia đầu ngành.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0 mt-0.5">check</span>
                <span>Hồ sơ sức khỏe điện tử EHR gia đình liên thông, đơn thuốc điện tử và giao thuốc tận nhà an toàn.</span>
              </li>
            </ul>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Link
                href="/packages"
                className="px-6 py-2.5 rounded-md bg-[#0046c0] hover:bg-[#003899] text-white text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>Xem Gói Khám Gia Đình</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>

              <Link
                href="/doctors"
                className="px-6 py-2.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-medium transition-colors"
              >
                Mạng Lưới Bác Sĩ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

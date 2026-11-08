'use client';

import React from 'react';
import Link from 'next/link';

interface PackageItem {
  id: string;
  badge: string;
  name: string;
  altName: string;
  popular?: boolean;
  price: string;
  periodText: string;
  subPrice: string;
  features: { text: string; strong?: boolean; highlighted?: boolean }[];
  ctaText: string;
}

const PACKAGES: PackageItem[] = [
  {
    id: 'BASIC',
    badge: 'Kỳ hạn 1 Tháng',
    name: 'Gói Trải Nghiệm',
    altName: 'Thử nghiệm y tế gia đình',
    price: '1.000.000đ',
    periodText: '/kỳ',
    subPrice: 'Trọn gói 1 tháng • 1 lần bác sĩ khám tận nhà',
    features: [
      { text: 'Quy mô: 1 người (thêm tối đa 2 người)', strong: true },
      { text: '1 lần bác sĩ khám tận nhà / kỳ' },
      { text: '1 lượt video tư vấn cùng bác sĩ' },
      { text: 'Nhắn tin miễn phí với bác sĩ trong kỳ' },
      { text: 'Hồ sơ bệnh án điện tử (EHR) & theo dõi chỉ số' },
      { text: 'Phụ phí thêm người: 75.000đ/người/tháng' },
    ],
    ctaText: 'Chọn gói này',
  },
  {
    id: 'FAMILY',
    badge: 'Kỳ hạn 3 Tháng',
    name: 'Gói Đồng Hành',
    altName: 'Chăm sóc gia đình tiêu chuẩn',
    popular: true,
    price: '2.850.000đ',
    periodText: '/kỳ',
    subPrice: 'Trọn gói 3 tháng • Đơn giá 950.000đ/lần khám',
    features: [
      { text: 'Quy mô: 3 người (thêm tối đa 6 người)', strong: true, highlighted: true },
      { text: '3 lần bác sĩ khám tận nhà / kỳ' },
      { text: '4 lượt video tư vấn cùng bác sĩ' },
      { text: 'Nhắn tin miễn phí với bác sĩ trong kỳ' },
      { text: 'Bác sĩ gia đình phụ trách & lập kế hoạch chăm sóc' },
      { text: 'Hồ sơ EHR từng thành viên & nhắc lịch tự động' },
      { text: 'Phụ phí thêm người: 75.000đ/người/tháng' },
    ],
    ctaText: 'Chọn gói này',
  },
  {
    id: 'ELDERLY',
    badge: 'Kỳ hạn 6 Tháng',
    name: 'Gói An Tâm',
    altName: 'Chăm sóc sức khỏe trung hạn',
    price: '6.475.000đ',
    periodText: '/kỳ',
    subPrice: 'Trọn gói 6 tháng • Đơn giá 925.000đ/lần khám',
    features: [
      { text: 'Quy mô: 4 người (thêm tối đa 8 người)', strong: true },
      { text: '7 lần bác sĩ khám tận nhà / kỳ' },
      { text: '8 lượt video tư vấn cùng bác sĩ' },
      { text: 'Nhắn tin miễn phí với bác sĩ trong kỳ' },
      { text: 'Bác sĩ theo dõi bệnh mạn tính & rà soát định kỳ' },
      { text: 'Hồ sơ EHR tập trung & nhắc gia hạn trước 15 ngày' },
      { text: 'Phụ phí thêm người: 75.000đ/người/tháng' },
    ],
    ctaText: 'Chọn gói này',
  },
  {
    id: 'ROYAL',
    badge: 'Kỳ hạn 12 Tháng',
    name: 'Gói Toàn Diện',
    altName: 'Bảo trợ y tế gia đình toàn diện',
    price: '12.600.000đ',
    periodText: '/kỳ',
    subPrice: 'Trọn gói 12 tháng • Đơn giá ưu đãi 900.000đ/lần khám',
    features: [
      { text: 'Quy mô: 6 người (thêm tối đa 10 người)', strong: true },
      { text: '14 lần bác sĩ khám tận nhà / năm' },
      { text: 'Tư vấn video theo kế hoạch cùng bác sĩ' },
      { text: 'Nhắn tin miễn phí trọn vẹn 365 ngày' },
      { text: 'Bác sĩ gia đình quản trị sức khỏe đa thế hệ' },
      { text: 'Hồ sơ EHR trọn đời & lưu trữ chuẩn quốc tế' },
      { text: 'Phụ phí thêm người: 75.000đ/người/tháng' },
    ],
    ctaText: 'Đăng ký ngay',
  },
];

export function LandingPackages() {
  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Gói Chăm Sóc Sức Khỏe Gia Đình &amp; Bảng Giá
          </h2>

          <p className="text-base text-slate-600">
            Giá gói = số lần khám tại nhà × đơn giá theo gói. Lịch khám linh hoạt do gia đình và bác sĩ thống nhất, video và nhắn tin đã bao gồm trọn gói.
          </p>
        </div>

        {/* Pricing Cards: Horizontal Snap Carousel on Mobile, Grid on Tablet/Desktop */}
        <div className="flex md:grid overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory md:snap-none -mx-4 px-4 sm:mx-0 sm:px-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`w-[85vw] sm:w-[320px] md:w-auto shrink-0 md:shrink snap-center rounded-xl p-6 flex flex-col justify-between relative bg-white hover:-translate-y-2 hover:shadow-xl transition-all duration-300 ease-out group cursor-default ${
                pkg.popular
                  ? 'border-2 border-[#0046c0] shadow-md ring-4 ring-[#0046c0]/10'
                  : 'border border-slate-200 hover:border-blue-300'
              }`}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0046c0] text-white text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  <span>Phổ biến nhất</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-[#0046c0]">{pkg.badge}</div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0046c0] transition-colors">
                    {pkg.name}
                  </h3>
                  <div className="text-xs text-slate-500">{pkg.altName}</div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight animate-fade-in">
                      {pkg.price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{pkg.periodText}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{pkg.subPrice}</div>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 pt-3 border-t border-slate-100 text-xs leading-relaxed text-slate-700">
                  {pkg.features.map((f, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">
                        check
                      </span>
                      <span className={f.strong ? 'font-semibold text-slate-900' : 'text-slate-600'}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-slate-100">
                <Link
                  href={`/register?packageId=${pkg.id}`}
                  className={`w-full py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 shadow-xs cursor-pointer ${
                    pkg.popular
                      ? 'bg-[#0046c0] hover:bg-[#003899] text-white hover:shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <span>{pkg.ctaText}</span>
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Swipe Hint */}
        <p className="md:hidden text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 -mt-6">
          <span className="material-symbols-outlined text-sm text-[#0046c0]">swipe</span>
          <span>Vuốt ngang để so sánh 4 gói dịch vụ</span>
        </p>

        {/* Additional Transparent Terms & Policy from Excel Sheet */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-3">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-sm">
            <span className="material-symbols-outlined text-[#0046c0] text-lg">verified</span>
            <span>Quy chuẩn &amp; Quyền lợi chung đã bao gồm trong bảng giá</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-semibold text-slate-800">Lịch Khám Linh Hoạt</div>
              <p className="text-slate-500 leading-relaxed">
                Gia đình và bác sĩ chủ động thống nhất thời điểm khám trong kỳ, không khóa cứng 1 lần/tháng.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-slate-800">Bác Sĩ Phụ Trách</div>
              <p className="text-slate-500 leading-relaxed">
                Đã bao gồm bác sĩ cơ sở (250k). Có thể nâng cấp Thạc sĩ (+50k), Tiến sĩ (+100k), GS/PGS (+200k)/lần khám tại nhà.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-slate-800">Thêm Thành Viên</div>
              <p className="text-slate-500 leading-relaxed">
                75.000đ/người/tháng trong trần gói (tối đa 2, 6, 8, 10 người). Sử dụng chung số lượt khám &amp; video của gói.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-slate-800">Minh Bạch Chi Phí</div>
              <p className="text-slate-500 leading-relaxed">
                Nhắn tin miễn phí trong kỳ. Không bao gồm chi phí thuốc và xét nghiệm chuyên sâu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

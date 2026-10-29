'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface PackageItem {
  id: string;
  badge: string;
  name: string;
  altName: string;
  popular?: boolean;
  price: string;
  annualPrice?: string;
  periodText: string;
  subPrice: string;
  annualSubPrice?: string;
  features: { text: string; strong?: boolean; highlighted?: boolean }[];
  ctaText: string;
}

const PACKAGES: PackageItem[] = [
  {
    id: 'BASIC',
    badge: 'Kỳ hạn 1 Tháng',
    name: 'Chăm Sóc Cơ Bản',
    altName: 'Gói Trải Nghiệm',
    price: '1.490.000đ',
    annualPrice: '1.290.000đ',
    periodText: '/kỳ',
    subPrice: 'Tương đương 1.490.000đ / tháng',
    annualSubPrice: 'Tiết kiệm 200.000đ / tháng khi thanh toán năm',
    features: [
      { text: 'Quy mô: 2 thành viên gia đình', strong: true },
      { text: '3 lượt bác sĩ khám tận nhà' },
      { text: '5 lượt tư vấn video call cùng bác sĩ' },
      { text: 'Hồ sơ bệnh án điện tử gia đình (EHR)' },
      { text: 'Trợ lý AI theo dõi sức khỏe 24/7' },
    ],
    ctaText: 'Chọn gói này',
  },
  {
    id: 'FAMILY',
    badge: 'Kỳ hạn 3 Tháng',
    name: 'Gia Đình Toàn Diện',
    altName: 'Gói Đồng Hành',
    popular: true,
    price: '4.245.000đ',
    annualPrice: '3.600.000đ',
    periodText: '/kỳ',
    subPrice: 'Khoảng 1.415.000đ / tháng (Tiết kiệm hơn)',
    annualSubPrice: 'Khoảng 1.200.000đ / tháng (Ưu đãi gia đình)',
    features: [
      { text: 'Quy mô: 4 thành viên gia đình', strong: true, highlighted: true },
      { text: '5 lượt bác sĩ khám tận nhà' },
      { text: '20 lượt tư vấn video call cùng bác sĩ' },
      { text: '1 Bác sĩ Chuyên khoa gia đình chỉ định riêng' },
      { text: 'Đo & lập phác đồ dinh dưỡng, lối sống gia đình' },
      { text: 'Hỗ trợ kết nối đơn thuốc & giao thuốc tận nơi' },
    ],
    ctaText: 'Chọn gói này',
  },
  {
    id: 'ELDERLY',
    badge: 'Kỳ hạn 12 Tháng',
    name: 'Chăm Sóc Người Cao Tuổi',
    altName: 'Gói Toàn Diện Đại Gia Đình',
    price: '14.900.000đ',
    annualPrice: '12.900.000đ',
    periodText: '/kỳ',
    subPrice: 'Khoảng 1.241.000đ / tháng (Ưu đãi tối đa)',
    annualSubPrice: 'Khoảng 1.075.000đ / tháng (Trọn vẹn 365 ngày)',
    features: [
      { text: 'Quy mô: Người cao tuổi / Đại gia đình', strong: true },
      { text: '12 lượt bác sĩ khám tận nhà (1 lượt/tháng)' },
      { text: 'Tư vấn video call không giới hạn lượt' },
      { text: 'Bác sĩ Tim Mạch / Lão Khoa theo dõi riêng' },
      { text: 'Xét nghiệm máu & điện tim ECG định kỳ tại nhà' },
      { text: 'Hỗ trợ kết nối điều phối cấp cứu ưu tiên 24/7' },
    ],
    ctaText: 'Chọn gói này',
  },
  {
    id: 'ROYAL',
    badge: 'Kỳ hạn VIP 12 Tháng',
    name: 'Gia Đình Hoàng Gia',
    altName: 'Gói Thượng Lưu Concierge',
    price: '29.900.000đ',
    annualPrice: '25.900.000đ',
    periodText: '/kỳ',
    subPrice: 'Đặc quyền chăm sóc sức khỏe riêng biệt',
    annualSubPrice: 'Đặc quyền hội chẩn giáo sư chuyên biệt 24/7',
    features: [
      { text: 'Quy mô: Toàn bộ thành viên gia đình (lên đến 8 người)', strong: true },
      { text: 'Khám tận nhà không giới hạn theo chỉ định' },
      { text: 'Hội đồng PGS, TS đầu ngành hội chẩn riêng' },
      { text: 'Điều phối xe cấp cứu chuyên dụng phục vụ riêng' },
      { text: 'Giao thuốc hỏa tốc & Miễn phí xét nghiệm cơ bản' },
    ],
    ctaText: 'Đăng ký ngay',
  },
];

export function LandingPackages() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="bang-gia" className="py-20 bg-white border-b border-slate-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Gói Chăm Sóc Sức Khỏe Gia Đình &amp; Bảng Giá
          </h2>

          <p className="text-base text-slate-600">
            Lựa chọn gói dịch vụ phù hợp với quy mô và tình trạng sức khỏe của từng gia đình. Không phát sinh phụ phí ẩn.
          </p>

          {/* Interactive Billing Mode Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                !isAnnual
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gói Tiêu Chuẩn Theo Kỳ
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                isAnnual
                  ? 'bg-[#0046c0] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Thanh Toán Năm</span>
              <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full uppercase">
                -15%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PACKAGES.map((pkg) => {
            const displayPrice = isAnnual && pkg.annualPrice ? pkg.annualPrice : pkg.price;
            const displaySub = isAnnual && pkg.annualSubPrice ? pkg.annualSubPrice : pkg.subPrice;

            return (
              <div
                key={pkg.id}
                className={`rounded-xl p-6 flex flex-col justify-between relative bg-white hover:-translate-y-2 hover:shadow-xl transition-all duration-300 ease-out group cursor-default ${
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
                      <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight animate-fade-in key={displayPrice}">
                        {displayPrice}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{pkg.periodText}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{displaySub}</div>
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
            );
          })}
        </div>
      </div>
    </section>
  );
}

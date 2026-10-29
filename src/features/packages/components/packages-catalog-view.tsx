'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LandingHeader, LandingFooter } from '@/features/landing';

export interface CatalogPackageItem {
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

const PACKAGES: CatalogPackageItem[] = [
  {
    id: 'pkg-basic',
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
    id: 'pkg-toan-dien',
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
    id: 'pkg-nguoi-cao-tuoi',
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
    id: 'pkg-hoang-gia',
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

export function PackagesCatalogView() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      {/* 1. SHARED UNIFIED HEADER */}
      <LandingHeader />

      <main className="w-full flex-1">
        <div className="flex flex-col w-full">
          {/* MEDSEV CLINICAL BREADCRUMB & HERO INTRO */}
          <section className="w-full bg-white border-b border-slate-200 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              {/* Breadcrumb Navigation */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Link href="/" className="hover:text-[#0046c0] transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">home</span>
                  Trang chủ
                </Link>
                <span className="text-slate-400">/</span>
                <span className="text-[#0046c0] font-semibold">Gói chăm sóc</span>
              </nav>

              {/* Header Title & Billing Mode Toggle */}
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  Gói Chăm Sóc Sức Khỏe Gia Đình &amp; Bảng Giá
                </h1>

                <p className="text-base text-slate-600 leading-relaxed font-normal">
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
            </div>
          </section>

          {/* MAIN PRICING CARDS SECTION (MATCHING HOME PAGE LANDING PACKAGES) */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
            {/* 4-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
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
                      {/* Badge & Titles */}
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-[#0046c0]">{pkg.badge}</div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0046c0] transition-colors">
                          {pkg.name}
                        </h3>
                        <div className="text-xs text-slate-500">{pkg.altName}</div>
                      </div>

                      {/* Price display */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
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

                    {/* Action Buttons: Primary (Register) & Secondary (Detail) */}
                    <div className="pt-6 mt-6 border-t border-slate-100 space-y-2">
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

                      <Link
                        href={`/packages/${pkg.id}`}
                        className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Xem chi tiết quyền lợi</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TRUST & SERVICE GUARANTEES */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div className="space-y-1 md:pr-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0046c0] flex items-center justify-center mx-auto md:mx-0 mb-2">
                    <span className="material-symbols-outlined text-xl">verified_user</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Bác sĩ CKI - CKII riêng</h4>
                  <p className="text-xs text-slate-500">100% bác sĩ có chứng chỉ hành nghề và trên 10 năm kinh nghiệm bệnh viện lớn.</p>
                </div>

                <div className="space-y-1 pt-4 md:pt-0 md:px-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto md:mx-0 mb-2">
                    <span className="material-symbols-outlined text-xl">home_health</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Khám tận nhà chu đáo</h4>
                  <p className="text-xs text-slate-500">Có mặt nhanh chóng trong 45 phút cho trường hợp khẩn cấp, trang thiết bị di động chuẩn y khoa.</p>
                </div>

                <div className="space-y-1 pt-4 md:pt-0 md:px-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto md:mx-0 mb-2">
                    <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Tài khoản Escrow bảo chứng</h4>
                  <p className="text-xs text-slate-500">Thanh toán minh bạch, cam kết giữ tiền và chỉ giải ngân theo từng tháng khi bạn hài lòng.</p>
                </div>

                <div className="space-y-1 pt-4 md:pt-0 md:pl-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mx-auto md:mx-0 mb-2">
                    <span className="material-symbols-outlined text-xl">support_agent</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Hỗ trợ khẩn cấp 24/7</h4>
                  <p className="text-xs text-slate-500">Tổng đài y tế trực tuyến 1900 8821 luôn sẵn sàng hỗ trợ điều phối xe cứu thương ưu tiên.</p>
                </div>
              </div>
            </div>

            {/* SUMMARY BAR */}
            <div className="bg-white px-4 sm:px-6 py-3.5 rounded-xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 font-medium">
                Hiển thị <strong className="text-slate-900">4</strong> trên tổng số{' '}
                <strong className="text-slate-900">4</strong> gói chăm sóc y tế gia đình
              </span>
              <div className="flex items-center gap-1 text-slate-500">
                <span className="material-symbols-outlined text-sm text-[#0046c0]">lock</span>
                <span>Bảo mật dữ liệu y tế gia đình theo chuẩn HIPAA quốc tế</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 3. SHARED UNIFIED FOOTER */}
      <LandingFooter />
    </div>
  );
}

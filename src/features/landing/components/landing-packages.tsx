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
    name: 'Chăm Sóc Cơ Bản',
    altName: 'Gói Trải Nghiệm',
    price: '1.490.000đ',
    periodText: '/kỳ',
    subPrice: 'Tương đương 1.490.000đ / tháng',
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
    periodText: '/kỳ',
    subPrice: 'Khoảng 1.415.000đ / tháng (Tiết kiệm hơn)',
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
    price: '16.490.000đ',
    periodText: '/kỳ',
    subPrice: 'Chỉ ~1.374.167đ / tháng (Ưu đãi cao nhất)',
    features: [
      { text: 'Quy mô: 6 thành viên (bao gồm người cao tuổi)', strong: true },
      { text: '20 lượt bác sĩ khám chuyên sâu tận nhà' },
      { text: '96 lượt tư vấn video call không giới hạn giờ' },
      { text: 'Hội đồng bác sĩ chuyên khoa & Lão khoa đồng hành' },
      { text: 'Lấy mẫu xét nghiệm tổng quát định kỳ tại nhà' },
      { text: 'Ưu tiên tiếp đón phòng khám đối tác & giao thuốc 2h' },
    ],
    ctaText: 'Chọn gói này',
  },
  {
    id: 'ROYAL',
    badge: 'Đặc Quyền VIP',
    name: 'Gia Đình Hoàng Gia',
    altName: 'Gói Concierge Độc Bản',
    price: '28.900.000đ',
    periodText: '/năm',
    subPrice: 'Trọn gói y tế tư gia cao cấp không giới hạn',
    features: [
      { text: 'Quy mô: Không giới hạn thành viên đại gia đình', strong: true },
      { text: 'Bác sĩ Trưởng khoa phụ trách riêng 24/7' },
      { text: 'Khám chuyên sâu tại gia không giới hạn lượt' },
      { text: 'Hội đồng Giáo sư đầu ngành cố vấn chuyên biệt' },
      { text: 'Điều phối xe cấp cứu chuyên dụng ưu tiên số 1' },
      { text: 'Bảo lãnh viện phí quốc tế & quản trị y bạ số' },
    ],
    ctaText: 'Chọn gói này',
  },
];

export function LandingPackages() {
  return (
    <section
      id="goi-kham"
      className="py-20 bg-white border-y border-[#c4c5d7]/70 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#eaedff] text-[#0037c1] text-xs font-bold uppercase tracking-wider inline-block">
            Gói Chăm Sóc Sức Khỏe Gia Đình
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#131b2f] tracking-tight">
            Minh Bạch Chi Phí - Quyền Lợi Toàn Diện
          </h2>
          <p className="text-sm sm:text-base text-[#444654]">
            Linh hoạt lựa chọn theo quy mô gia đình. Đổi hoặc hủy gói bất kỳ lúc nào với quỹ hoàn tiền cam kết.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative ${
                pkg.popular
                  ? 'bg-white border-2 border-[#0037c1] shadow-glow-cobalt lg:-translate-y-2'
                  : 'bg-[#faf8ff] border border-[#c4c5d7]/80 hover:shadow-lg hover:border-[#0037c1]'
              }`}
            >
              {/* Popular Tag */}
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#0037c1] via-[#1554e8] to-[#0037c1] text-white text-[11px] font-extrabold px-4 py-1 rounded-full shadow-md tracking-wider uppercase flex items-center gap-1.5 whitespace-nowrap">
                  <span className="material-symbols-filled text-xs text-[#fa8c16]">star</span>
                  <span>Phổ biến nhất</span>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border inline-block ${
                      pkg.popular
                        ? 'bg-[#fff7e6] text-[#fa8c16] border-[#ffd591]'
                        : 'bg-[#eaedff] text-[#0037c1] border-[#eaedff]'
                    }`}
                  >
                    {pkg.badge}
                  </span>
                  <h3 className="text-xl font-bold text-[#131b2f] mt-3">{pkg.name}</h3>
                  <p className="text-xs text-[#747686] mt-0.5">{pkg.altName}</p>
                </div>

                {/* Price Display */}
                <div className="py-2.5 border-y border-[#eaedff]">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0037c1]">
                    {pkg.price}
                    <span className="text-xs text-[#747686] font-normal">{pkg.periodText}</span>
                  </div>
                  <div className="text-xs text-[#52c41a] font-bold mt-0.5">{pkg.subPrice}</div>
                </div>

                {/* Feature Checklist */}
                <ul className="space-y-2.5 text-xs text-[#444654]">
                  {pkg.features.map((feat, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2 ${
                        feat.highlighted ? 'font-bold text-[#0037c1]' : ''
                      }`}
                    >
                      <span className="material-symbols-filled text-[#52c41a] text-base shrink-0">
                        check_circle
                      </span>
                      <span>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <Link
                href={`/register?packageId=${pkg.id}`}
                className={`mt-8 w-full py-3.5 rounded-xl font-bold text-xs text-center transition-all ${
                  pkg.popular
                    ? 'bg-gradient-to-r from-[#0037c1] to-[#1c55d9] hover:from-[#00258b] hover:to-[#0037c1] text-white shadow-md hover:scale-[1.02] active:scale-95'
                    : 'border-2 border-[#0037c1] text-[#0037c1] hover:bg-[#0037c1] hover:text-white'
                }`}
              >
                {pkg.ctaText}
              </Link>
            </div>
          ))}
        </div>

        {/* Transparent Policy Strip */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#444654]">
          <div className="flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-[#0037c1] text-lg shrink-0">info</span>
            <span>
              <strong>Quy định minh bạch:</strong> Hạn mức lượt khám và video tư vấn được dùng chung
              linh hoạt cho cả gia đình trong suốt cả kỳ hạn.
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#c4c5d7]/50 text-[#0037c1] font-semibold shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-base text-[#fa8c16]">group_add</span>
            <span>
              Thêm thành viên: <strong>75.000đ</strong>/người/tháng
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

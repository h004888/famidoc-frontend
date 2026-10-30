'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { LandingHeader, LandingFooter } from '@/features/landing';

export interface CatalogPackageItem {
  id: string;
  badge: string;
  category: 'all' | 'family' | 'elderly' | 'maternity' | 'clinical';
  icon: string;
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
    category: 'family',
    icon: 'health_and_safety',
    name: 'Chăm Sóc Cơ Bản',
    altName: 'Gói Trải Nghiệm Gia Đình',
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
    ctaText: 'Đăng ký gói',
  },
  {
    id: 'pkg-toan-dien',
    badge: 'Kỳ hạn 3 Tháng',
    category: 'family',
    icon: 'diversity_1',
    name: 'Gia Đình Toàn Diện',
    altName: 'Gói Đồng Hành Tiêu Chuẩn',
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
    ctaText: 'Đăng ký gói',
  },
  {
    id: 'pkg-nguoi-cao-tuoi',
    badge: 'Kỳ hạn 12 Tháng',
    category: 'elderly',
    icon: 'elderly',
    name: 'Chăm Sóc Người Cao Tuổi',
    altName: 'Quản Lý Bệnh Mạn Tính & Lão Khoa',
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
    ctaText: 'Đăng ký gói',
  },
  {
    id: 'pkg-me-va-be',
    badge: 'Kỳ hạn 6 Tháng',
    category: 'maternity',
    icon: 'child_care',
    name: 'Chăm Sóc Mẹ & Bé Sơ Sinh',
    altName: 'Y Khoa Sản - Nhi & Dinh Dưỡng Đầu Đời',
    price: '7.850.000đ',
    annualPrice: '6.650.000đ',
    periodText: '/kỳ',
    subPrice: 'Khoảng 1.308.000đ / tháng',
    annualSubPrice: 'Tặng kèm cẩm nang ăn dặm & tiêm chủng',
    features: [
      { text: 'Quy mô: Mẹ sau sinh và bé dưới 36 tháng', strong: true },
      { text: '6 lượt khám tổng quát & phát triển thể chất' },
      { text: 'Tư vấn nuôi con bằng sữa mẹ & dinh dưỡng 24/7' },
      { text: 'Nhắc lịch tiêm chủng & theo dõi phản ứng sau tiêm' },
      { text: 'Bác sĩ Chuyên khoa Nhi trực tiếp đồng hành' },
    ],
    ctaText: 'Đăng ký gói',
  },
  {
    id: 'pkg-tim-mach',
    badge: 'Kỳ hạn 6 Tháng',
    category: 'clinical',
    icon: 'cardiology',
    name: 'Tầm Soát Tim Mạch & Đột Quỵ',
    altName: 'Dự Phòng Tai Biến Mạch Máu Não',
    price: '8.400.000đ',
    annualPrice: '7.200.000đ',
    periodText: '/kỳ',
    subPrice: 'Khoảng 1.400.000đ / tháng',
    annualSubPrice: 'Bao gồm Holter điện tim & xét nghiệm lipid máu',
    features: [
      { text: 'Quy mô: Cá nhân hoặc người thân có tiền sử tim mạch', strong: true },
      { text: 'Khám tim mạch chuyên sâu & đo ECG tại nhà' },
      { text: 'Lập biểu đồ phân tầng nguy cơ đột quỵ SCORE' },
      { text: 'Điều chỉnh đơn thuốc huyết áp & mỡ máu định kỳ' },
      { text: 'Hội chẩn cùng chuyên gia Viện Tim / Chợ Rẫy' },
    ],
    ctaText: 'Đăng ký gói',
  },
  {
    id: 'pkg-xet-nghiem',
    badge: 'Kỳ hạn Theo Lượt',
    category: 'clinical',
    icon: 'biotechnology',
    name: 'Khám Tổng Quát & Xét Nghiệm Tại Nhà',
    altName: 'Xét Nghiệm Máu 18 Chỉ Số & Siêu Âm',
    price: '2.850.000đ',
    annualPrice: '2.450.000đ',
    periodText: '/lượt',
    subPrice: 'Kết quả trả về ứng dụng trong 4 giờ',
    annualSubPrice: 'Tặng 1 buổi tư vấn phác đồ phòng bệnh',
    features: [
      { text: 'Quy mô: 1 - 2 thành viên', strong: true },
      { text: 'Điều dưỡng đến tận nhà lấy máu an toàn' },
      { text: 'Tổng phân tích tế bào máu, men gan, chức năng thận' },
      { text: 'Tầm soát tiểu đường (HbA1c) & mỡ máu toàn phần' },
      { text: 'Bác sĩ gọi điện giải thích từng chỉ số xét nghiệm' },
    ],
    ctaText: 'Đặt lịch xét nghiệm',
  },
  {
    id: 'pkg-phuc-hoi',
    badge: 'Kỳ hạn 1 Tháng',
    category: 'clinical',
    icon: 'physical_therapy',
    name: 'Phục Hồi Chức Năng & Vật Lý Trị Liệu',
    altName: 'Trị Liệu Cơ Xương Khớp & Sau Phẫu Thuật',
    price: '5.200.000đ',
    annualPrice: '4.400.000đ',
    periodText: '/kỳ',
    subPrice: '10 buổi tập trị liệu trực tiếp cùng KTV',
    annualSubPrice: 'Hỗ trợ dụng cụ tập luyện tại nhà',
    features: [
      { text: 'Quy mô: Bệnh nhân đau cột sống, sau tai biến, sau mổ', strong: true },
      { text: 'Kỹ thuật viên phục hồi chức năng đến tận nhà' },
      { text: 'Xoa bóp trị liệu, kéo giãn & tập vận động thụ động' },
      { text: 'Đánh giá thang điểm hồi phục chức năng hàng tuần' },
      { text: 'Bác sĩ Y học cổ truyền & Phục hồi giám sát' },
    ],
    ctaText: 'Đăng ký trị liệu',
  },
  {
    id: 'pkg-hoang-gia',
    badge: 'Kỳ hạn VIP 12 Tháng',
    category: 'family',
    icon: 'workspace_premium',
    name: 'Gia Đình Hoàng Gia',
    altName: 'Đặc Quyền Bác Sĩ Riêng Concierge VIP',
    price: '29.900.000đ',
    annualPrice: '25.900.000đ',
    periodText: '/kỳ',
    subPrice: 'Đặc quyền chăm sóc sức khỏe thượng lưu 24/7',
    annualSubPrice: 'Đặc quyền hội đồng Giáo sư chuyên biệt 24/7',
    features: [
      { text: 'Quy mô: Đại gia đình (lên đến 8 thành viên)', strong: true },
      { text: 'Khám tận nhà không giới hạn theo chỉ định' },
      { text: 'Hội đồng PGS, TS đầu ngành hội chẩn riêng' },
      { text: 'Điều phối xe cấp cứu chuyên dụng phục vụ riêng' },
      { text: 'Giao thuốc hỏa tốc & Miễn phí xét nghiệm cơ bản' },
    ],
    ctaText: 'Đăng ký VIP',
  },
];

const BLOG_POSTS = [
  {
    id: 'blog-01',
    img: '/images/medsev/home-one/11.jpg',
    title: 'Hướng dẫn kiểm soát huyết áp & đường huyết tại nhà cho người cao tuổi',
    desc: 'Những nguyên tắc đo huyết áp chuẩn y khoa, biểu hiện cảnh báo nguy cơ đột quỵ sớm và chế độ ăn giảm natri tốt cho tim mạch.',
    date: '28/10/2026',
    author: 'BS.CKII Lê Hoàng Nam',
  },
  {
    id: 'blog-02',
    img: '/images/medsev/home-one/12.jpg',
    title: 'Lịch tiêm chủng và dinh dưỡng tăng cường miễn dịch cho bé dưới 3 tuổi',
    desc: 'Cập nhật phác đồ tiêm vắc-xin 6 trong 1, phế cầu và các vi chất dinh dưỡng thiết yếu giúp trẻ phát triển chiều cao và trí não tối ưu.',
    date: '24/10/2026',
    author: 'BS.CKI Nguyễn Minh Tuấn',
  },
  {
    id: 'blog-03',
    img: '/images/medsev/home-one/13.jpg',
    title: 'Mô hình bác sĩ gia đình: Giải pháp giảm tải bệnh viện và phòng bệnh liên tục',
    desc: 'Tại sao việc có một bác sĩ gia đình am hiểu tiền sử sức khỏe cả nhà lại giúp tiết kiệm tới 40% chi phí y tế không cần thiết.',
    date: '15/10/2026',
    author: 'TS.BS Phạm Minh Đức',
  },
];

export function PackagesCatalogView() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'family' | 'elderly' | 'maternity' | 'clinical'>('all');
  const [isAnnual, setIsAnnual] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Filter packages based on keyword and category
  const filteredPackages = useMemo(() => {
    return PACKAGES.filter((pkg) => {
      const matchKeyword =
        !searchKeyword.trim() ||
        pkg.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        pkg.altName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        pkg.features.some((f) => f.text.toLowerCase().includes(searchKeyword.toLowerCase()));

      const matchCategory = selectedCategory === 'all' || pkg.category === selectedCategory;

      return matchKeyword && matchCategory;
    });
  }, [searchKeyword, selectedCategory]);

  const handleResetFilter = () => {
    setSearchKeyword('');
    setSelectedCategory('all');
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubmitted(true);
      setNewsletterEmail('');
    }
  };

  return (
    <div className="bg-white min-h-screen text-[#232323] font-sans antialiased flex flex-col justify-between">
      {/* 1. SHARED UNIFIED HEADER */}
      <LandingHeader />

      <main className="w-full flex-1">
        {/* 2. MEDSEV PAGE TITLE AREA (.page-title-area.page-title-four) */}
        <section
          className="relative bg-cover bg-center py-24 sm:py-32 text-center text-white"
          style={{ backgroundImage: "url('/images/medsev/service-details-bg.jpg')" }}
        >
          {/* Cobalt Blue Overlay (Matching Medsev #0046c0 / 75%) */}
          <div className="absolute inset-0 bg-[#0046c0]/75" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-xs">
              Gói Dịch Vụ Y Tế &amp; Chăm Sóc Sức Khỏe Gia Đình
            </h1>

            {/* Medsev Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="inline-flex items-center justify-center gap-2 text-sm text-blue-100 font-medium"
            >
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-base">home</span>
                Trang chủ
              </Link>
              <span className="text-blue-200">/</span>
              <span className="text-white font-semibold">Gói dịch vụ</span>
            </nav>
          </div>
        </section>

        {/* 3. INTERACTIVE SEARCH & CATEGORY FILTER BAR */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-20">
          <div className="bg-white rounded-2xl shadow-[0_10px_35px_0_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
              {/* Search Input */}
              <div className="relative w-full lg:max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  search
                </span>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm theo tên gói chăm sóc..."
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0046c0] focus:bg-white transition-all"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm p-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                )}
              </div>

              {/* Annual Billing Mode Toggle */}
              <div className="inline-flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold w-full sm:w-auto justify-center">
                <button
                  type="button"
                  onClick={() => setIsAnnual(false)}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    !isAnnual ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Gói Tiêu Chuẩn Theo Kỳ
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnnual(true)}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    isAnnual ? 'bg-[#0046c0] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Thanh Toán Năm</span>
                  <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full uppercase">
                    -15%
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Category Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 mr-1">Phân loại:</span>
              {[
                { id: 'all', label: 'Tất cả các gói' },
                { id: 'family', label: 'Gia đình & Đa thế hệ' },
                { id: 'elderly', label: 'Người cao tuổi & Mạn tính' },
                { id: 'maternity', label: 'Mẹ bầu & Bé sơ sinh' },
                { id: 'clinical', label: 'Khám & Xét nghiệm tại nhà' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id as typeof selectedCategory)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === tab.id
                      ? 'bg-[#0046c0] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. MEDSEV SERVICES AREA (.services-area.pt-100.pb-70) */}
        <section className="pt-20 lg:pt-24 pb-16 lg:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#232323] tracking-tight relative pb-4 inline-block after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-20 after:h-1 after:bg-[#0046c0] after:rounded">
              Danh Mục Gói Chăm Sóc Sức Khỏe
            </h2>
            <p className="text-sm sm:text-base text-[#676767] leading-relaxed pt-2">
              Các gói y tế gia đình được thiết kế theo tiêu chuẩn Y học Gia đình quốc tế, cá nhân hóa theo từng độ tuổi và bệnh lý.
            </p>
          </div>

          {/* Empty State when search returns 0 items */}
          {filteredPackages.length === 0 ? (
            <div
              role="status"
              className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm"
            >
              <div className="w-16 h-16 bg-blue-50 text-[#0046c0] rounded-full flex items-center justify-center mx-auto text-3xl">
                <span className="material-symbols-outlined text-3xl">search_off</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Không tìm thấy gói khám phù hợp</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Không tìm thấy kết quả phù hợp với từ khóa &ldquo;{searchKeyword}&rdquo;. Vui lòng thử từ khóa khác hoặc xóa bộ lọc.
              </p>
              <button
                type="button"
                onClick={handleResetFilter}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#0046c0] hover:bg-[#003899] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>Xóa bộ lọc</span>
              </button>
            </div>
          ) : (
            /* 4-Column Grid matching Medsev .service-item */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-stretch">
              {filteredPackages.map((pkg) => {
                const displayPrice = isAnnual && pkg.annualPrice ? pkg.annualPrice : pkg.price;
                const displaySub = isAnnual && pkg.annualSubPrice ? pkg.annualSubPrice : pkg.subPrice;

                return (
                  <div
                    key={pkg.id}
                    className={`group relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-500 ease-out bg-white border overflow-hidden ${
                      pkg.popular
                        ? 'border-[#0046c0] shadow-[0_0_25px_0_rgba(0,70,192,0.18)] ring-2 ring-[#0046c0]/20'
                        : 'border-slate-100 shadow-[0_0_25px_0_rgba(221,221,221,0.75)] hover:shadow-xl hover:border-blue-200'
                    }`}
                  >
                    {/* Medsev Blue Background Hover Overlay */}
                    <div className="absolute inset-0 bg-[#0046c0] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0 pointer-events-none" />

                    {/* Watermark Big Icon in Background on Hover */}
                    <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-[150px] text-white opacity-0 group-hover:opacity-10 transition-all duration-500 pointer-events-none select-none z-0">
                      {pkg.icon}
                    </span>

                    {/* Popular Badge */}
                    {pkg.popular && (
                      <div className="absolute top-3 right-3 bg-[#0046c0] text-white group-hover:bg-white group-hover:text-[#0046c0] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs transition-colors z-10 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        <span>Phổ biến nhất</span>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="relative z-10 space-y-4">
                      {/* Big Icon */}
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0046c0] group-hover:bg-white/15 group-hover:text-white flex items-center justify-center text-3xl transition-all duration-300 shadow-xs">
                        <span className="material-symbols-outlined text-3xl">{pkg.icon}</span>
                      </div>

                      {/* Titles */}
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-[#0046c0] group-hover:text-blue-100 transition-colors">
                          {pkg.badge}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-white transition-colors leading-snug">
                          {pkg.name}
                        </h3>
                        <div className="text-xs text-slate-500 group-hover:text-blue-100 transition-colors">
                          {pkg.altName}
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="pt-3 border-t border-slate-100 group-hover:border-white/20 transition-colors">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-900 group-hover:text-white font-mono tracking-tight transition-colors">
                            {displayPrice}
                          </span>
                          <span className="text-xs text-slate-500 group-hover:text-blue-100 font-medium transition-colors">
                            {pkg.periodText}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 group-hover:text-blue-100 mt-0.5 transition-colors leading-tight">
                          {displaySub}
                        </div>
                      </div>

                      {/* Features List */}
                      <ul className="space-y-2 pt-3 border-t border-slate-100 group-hover:border-white/20 text-xs leading-relaxed text-slate-700 group-hover:text-blue-50 transition-colors">
                        {pkg.features.map((f, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 group-hover:text-white text-base shrink-0 mt-0.5 transition-colors">
                              check
                            </span>
                            <span className={f.strong ? 'font-semibold' : ''}>{f.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Card Actions */}
                    <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 group-hover:border-white/20 space-y-2 transition-colors">
                      <Link
                        href={`/packages/${pkg.id}`}
                        className="w-full py-2.5 px-4 rounded-lg bg-slate-100 group-hover:bg-white text-slate-700 group-hover:text-[#0046c0] text-xs font-semibold text-center transition-all duration-300 flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span>Xem chi tiết gói</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </Link>

                      <Link
                        href="/contact"
                        className="w-full py-2 px-4 rounded-lg bg-[#0046c0] group-hover:bg-[#111111] text-white text-xs font-semibold text-center transition-all duration-300 flex items-center justify-center gap-1 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-base">assignment</span>
                        <span>{pkg.ctaText}</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 5. MEDSEV EXPERTISE SECTION (.expertise-area.pb-70) */}
        <section className="py-16 sm:py-20 bg-slate-50 border-t border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#232323] tracking-tight relative pb-4 inline-block after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-20 after:h-1 after:bg-[#0046c0] after:rounded">
                Năng Lực Y Khoa &amp; Tiêu Chuẩn Dịch Vụ
              </h2>
              <p className="text-sm sm:text-base text-[#676767] leading-relaxed pt-2">
                Hệ sinh thái y tế toàn diện đồng hành cùng gia đình Việt với chuẩn mực chuyên môn khắt khe nhất.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: 4 Blue Expertise Cards (2x2 Grid) */}
              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Item 1 */}
                  <div className="bg-[#0046c0] text-white p-7 rounded-2xl text-center space-y-3 shadow-md hover:-translate-y-1 transition-transform">
                    <div className="w-16 h-16 rounded-full bg-white text-[#0046c0] flex items-center justify-center text-3xl mx-auto shadow-md ring-8 ring-white/20">
                      <span className="material-symbols-outlined text-3xl font-bold">stethoscope</span>
                    </div>
                    <h3 className="font-semibold text-lg sm:text-xl text-white">Bác Sĩ Cấp Phép Chính Quy</h3>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      100% bác sĩ có Chứng Chỉ Hành Nghề (CCHN) do Bộ Y Tế cấp, tối thiểu 10 năm kinh nghiệm tại các bệnh viện tuyến Trung Ương.
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="bg-[#0046c0] text-white p-7 rounded-2xl text-center space-y-3 shadow-md hover:-translate-y-1 transition-transform">
                    <div className="w-16 h-16 rounded-full bg-white text-[#0046c0] flex items-center justify-center text-3xl mx-auto shadow-md ring-8 ring-white/20">
                      <span className="material-symbols-outlined text-3xl font-bold">emergency</span>
                    </div>
                    <h3 className="font-semibold text-lg sm:text-xl text-white">Tổng Đài Cấp Cứu 24/7</h3>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      Đường dây nóng 1900 8821 trực tuyến cả ngày Lễ, Tết. Điều phối bác sĩ cấp cứu và xe cứu thương có mặt trong 15 - 30 phút.
                    </p>
                  </div>

                  {/* Item 3 */}
                  <div className="bg-[#0046c0] text-white p-7 rounded-2xl text-center space-y-3 shadow-md hover:-translate-y-1 transition-transform">
                    <div className="w-16 h-16 rounded-full bg-white text-[#0046c0] flex items-center justify-center text-3xl mx-auto shadow-md ring-8 ring-white/20">
                      <span className="material-symbols-outlined text-3xl font-bold">medical_information</span>
                    </div>
                    <h3 className="font-semibold text-lg sm:text-xl text-white">Bệnh Án Điện Tử &amp; AI</h3>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      Hồ sơ sức khỏe số EMR liên thông, trợ lý AI theo dõi liên tục chỉ số đường huyết, huyết áp và cảnh báo bất thường sớm.
                    </p>
                  </div>

                  {/* Item 4 */}
                  <div className="bg-[#0046c0] text-white p-7 rounded-2xl text-center space-y-3 shadow-md hover:-translate-y-1 transition-transform">
                    <div className="w-16 h-16 rounded-full bg-white text-[#0046c0] flex items-center justify-center text-3xl mx-auto shadow-md ring-8 ring-white/20">
                      <span className="material-symbols-outlined text-3xl font-bold">local_shipping</span>
                    </div>
                    <h3 className="font-semibold text-lg sm:text-xl text-white">Khám &amp; Dược Phẩm Tận Nhà</h3>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      Lấy mẫu máu, đo điện tim ECG và siêu âm tại phòng khách. Hỗ trợ giao đơn thuốc tận cửa hỏa tốc trong 2 giờ.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Medsev Clinical Image */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                  <img
                    src="/images/medsev/home-one/6.jpg"
                    alt="Tiêu chuẩn y tế FamiDoc"
                    className="w-full h-[460px] object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-6 sm:p-8">
                    <div className="text-white space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-blue-200">
                        Chuẩn Mực Y Khoa Quốc Tế
                      </div>
                      <h4 className="text-lg font-bold">Bệnh Viện Đại Học Y Dược &amp; Bạch Mai Hợp Tác</h4>
                      <p className="text-xs text-slate-200">
                        Đảm bảo chuyển viện Fast-Track và hội chẩn chuyên sâu khi gia đình cần can thiệp kỹ thuật cao.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. MEDSEV BLOG SECTION (.blog-area.pt-100.pb-70) */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#232323] tracking-tight relative pb-4 inline-block after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-20 after:h-1 after:bg-[#0046c0] after:rounded">
              Cẩm Nang Y Học Gia Đình
            </h2>
            <p className="text-sm sm:text-base text-[#676767] leading-relaxed pt-2">
              Kiến thức y khoa thường thức được biên soạn bởi hội đồng bác sĩ chuyên khoa FamiDoc Pro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_0_20px_0_rgba(221,221,221,0.6)] hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={post.img}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-[#0046c0] text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                      <span className="material-symbols-outlined text-xs">calendar_today</span>
                      <span>{post.date}</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-[#0046c0]">person</span>
                      <span>{post.author}</span>
                    </div>

                    <h3 className="font-bold text-base sm:text-lg text-[#232323] group-hover:text-[#0046c0] transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-xs text-[#676767] leading-relaxed line-clamp-3">
                      {post.desc}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0046c0] group-hover:text-[#002d80] transition-colors"
                  >
                    <span>Đọc tiếp cẩm nang</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. MEDSEV NEWSLETTER AREA (.newsletter-area) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mb-16 relative z-30 pb-16">
          <div className="bg-white rounded-2xl shadow-[0_0_25px_0_rgba(221,221,221,0.67)] p-8 sm:p-12 border border-slate-100">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-2">
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#232323]">
                  Đăng Ký Nhận Bản Tin Y Học Gia Đình
                </h2>
                <p className="text-sm text-[#676767] leading-relaxed max-w-xl">
                  Nhận các cẩm nang chăm sóc sức khỏe dự phòng, cảnh báo dịch tễ theo mùa và các chính sách ưu đãi thành viên mới từ FamiDoc.
                </p>
              </div>

              <div className="lg:col-span-5">
                {newsletterSubmitted ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg">
                    <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                    <span>Cảm ơn bạn đã đăng ký nhận bản tin sức khỏe FamiDoc!</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="relative">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Nhập địa chỉ email của bạn..."
                      required
                      className="w-full h-[65px] pl-5 pr-36 rounded-lg border border-[#0046c0] text-sm text-[#232323] placeholder:text-[#676767] focus:outline-hidden focus:border-[#111111] transition-all"
                    />
                    <button
                      type="submit"
                      className="absolute top-2 right-2 h-[49px] px-6 bg-[#0046c0] hover:bg-[#111111] text-white text-sm font-medium rounded-md transition-colors cursor-pointer flex items-center justify-center"
                    >
                      Đăng Ký
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 8. SHARED UNIFIED FOOTER */}
      <LandingFooter />
    </div>
  );
}

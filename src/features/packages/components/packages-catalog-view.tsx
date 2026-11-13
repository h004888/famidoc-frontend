'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { LandingHeader, LandingFooter } from '@/features/landing';
import { useAuth } from '@/features/auth/context/auth-context';

export interface CatalogPackageItem {
  id: string;
  badge: string;
  category: 'all' | 'trial' | 'standard' | 'annual';
  icon: string;
  name: string;
  altName: string;
  popular?: boolean;
  months: number;
  defaultMembers: number;
  maxMembers: number;
  homeVisits: number;
  unitPrice: number;
  videoCalls: string;
  price: string;
  monthlyPrice: string;
  periodText: string;
  subPrice: string;
  monthlySubPrice: string;
  features: { text: string; strong?: boolean; highlighted?: boolean }[];
  ctaText: string;
}

const PACKAGES: CatalogPackageItem[] = [
  {
    id: 'pkg-basic',
    badge: 'Kỳ hạn 1 Tháng',
    category: 'trial',
    icon: 'health_and_safety',
    name: 'Gói Trải Nghiệm',
    altName: 'Thử nghiệm dịch vụ y tế tại gia',
    months: 1,
    defaultMembers: 1,
    maxMembers: 2,
    homeVisits: 1,
    unitPrice: 1000000,
    videoCalls: '1 lượt',
    price: '1.000.000đ',
    monthlyPrice: '1.000.000đ',
    periodText: '/kỳ',
    subPrice: 'Bình quân 1.000.000đ / tháng (1 lần khám tại nhà)',
    monthlySubPrice: 'Trọn gói cả kỳ: 1.000.000đ (1 tháng)',
    features: [
      { text: 'Quy mô: 1 người (thêm tối đa 2 người)', strong: true },
      { text: '1 lần bác sĩ khám tận nhà / kỳ' },
      { text: '1 lượt tư vấn video call cùng bác sĩ' },
      { text: 'Nhắn tin miễn phí với bác sĩ trong kỳ' },
      { text: 'Hồ sơ bệnh án điện tử (EHR) cá nhân' },
      { text: 'Phụ phí thêm người: 75.000đ/người/tháng' },
    ],
    ctaText: 'Đăng ký gói',
  },
  {
    id: 'pkg-toan-dien',
    badge: 'Kỳ hạn 3 Tháng',
    category: 'standard',
    icon: 'diversity_1',
    name: 'Gói Đồng Hành',
    altName: 'Chăm sóc gia đình tiêu chuẩn',
    popular: true,
    months: 3,
    defaultMembers: 3,
    maxMembers: 6,
    homeVisits: 3,
    unitPrice: 950000,
    videoCalls: '4 lượt',
    price: '2.850.000đ',
    monthlyPrice: '950.000đ',
    periodText: '/kỳ',
    subPrice: 'Bình quân 950.000đ / tháng (Đơn giá 950.000đ/lần)',
    monthlySubPrice: 'Trọn gói cả kỳ: 2.850.000đ (3 tháng)',
    features: [
      { text: 'Quy mô: 3 người (thêm tối đa 6 người)', strong: true, highlighted: true },
      { text: '3 lần bác sĩ khám tận nhà / kỳ' },
      { text: '4 lượt tư vấn video call cùng bác sĩ' },
      { text: 'Nhắn tin miễn phí với bác sĩ trong kỳ' },
      { text: 'Bác sĩ gia đình phụ trách & lập kế hoạch chăm sóc' },
      { text: 'Hồ sơ EHR từng thành viên & nhắc lịch tự động' },
      { text: 'Phụ phí thêm người: 75.000đ/người/tháng' },
    ],
    ctaText: 'Đăng ký gói',
  },
  {
    id: 'pkg-nguoi-cao-tuoi',
    badge: 'Kỳ hạn 6 Tháng',
    category: 'standard',
    icon: 'elderly',
    name: 'Gói An Tâm',
    altName: 'Theo dõi & quản lý bệnh mạn tính',
    months: 6,
    defaultMembers: 4,
    maxMembers: 8,
    homeVisits: 7,
    unitPrice: 925000,
    videoCalls: '8 lượt',
    price: '6.475.000đ',
    monthlyPrice: '1.079.167đ',
    periodText: '/kỳ',
    subPrice: 'Bình quân ~1.079.000đ / tháng (Đơn giá 925.000đ/lần)',
    monthlySubPrice: 'Trọn gói cả kỳ: 6.475.000đ (6 tháng)',
    features: [
      { text: 'Quy mô: 4 người (thêm tối đa 8 người)', strong: true },
      { text: '7 lần bác sĩ khám tận nhà / kỳ' },
      { text: '8 lượt tư vấn video call cùng bác sĩ' },
      { text: 'Nhắn tin miễn phí với bác sĩ trong kỳ' },
      { text: 'Bác sĩ theo dõi bệnh mạn tính & rà soát định kỳ' },
      { text: 'Hồ sơ EHR tập trung & nhắc gia hạn trước 15 ngày' },
      { text: 'Phụ phí thêm người: 75.000đ/người/tháng' },
    ],
    ctaText: 'Đăng ký gói',
  },
  {
    id: 'pkg-hoang-gia',
    badge: 'Kỳ hạn 12 Tháng',
    category: 'annual',
    icon: 'workspace_premium',
    name: 'Gói Toàn Diện',
    altName: 'Bảo trợ y tế gia tộc trọn năm',
    months: 12,
    defaultMembers: 6,
    maxMembers: 10,
    homeVisits: 14,
    unitPrice: 900000,
    videoCalls: 'Trao đổi với bác sĩ',
    price: '12.600.000đ',
    monthlyPrice: '1.050.000đ',
    periodText: '/kỳ',
    subPrice: 'Bình quân 1.050.000đ / tháng (Đơn giá 900.000đ/lần)',
    monthlySubPrice: 'Trọn gói cả kỳ: 12.600.000đ (12 tháng)',
    features: [
      { text: 'Quy mô: 6 người (thêm tối đa 10 người)', strong: true },
      { text: '14 lần bác sĩ khám tận nhà / năm' },
      { text: 'Tư vấn video theo kế hoạch cùng bác sĩ' },
      { text: 'Nhắn tin miễn phí trọn vẹn 365 ngày' },
      { text: 'Bác sĩ gia đình quản trị sức khỏe đa thế hệ' },
      { text: 'Hồ sơ EHR trọn đời & lưu trữ chuẩn quốc tế' },
      { text: 'Phụ phí thêm người: 75.000đ/người/tháng' },
    ],
    ctaText: 'Đăng ký gói',
  },
];

const DOCTOR_LEVELS = [
  { id: 'standard', name: 'Bác sĩ thường (Mặc định)', surcharge: 0, desc: 'Đã gồm trong gói (mốc cơ sở 250k)' },
  { id: 'master', name: 'Thạc sĩ Y Khoa', surcharge: 50000, desc: '+50.000đ / lần khám tại nhà' },
  { id: 'phd', name: 'Tiến sĩ Y Khoa', surcharge: 100000, desc: '+100.000đ / lần khám tại nhà' },
  { id: 'professor', name: 'Giáo sư / Phó Giáo sư', surcharge: 200000, desc: '+200.000đ / lần khám tại nhà' },
];

const BLOG_POSTS = [
  {
    id: 'blog-01',
    img: '/images/medsev/home-one/11.jpg',
    title: 'Hướng dẫn theo dõi huyết áp & đường huyết định kỳ tại nhà',
    desc: 'Những nguyên tắc đo huyết áp chuẩn y khoa, biểu hiện cảnh báo sớm bệnh lý tim mạch và xây dựng chế độ sinh hoạt giảm natri.',
    date: '28/10/2026',
    author: 'BS.CKII Lê Hoàng Nam',
  },
  {
    id: 'blog-02',
    img: '/images/medsev/home-one/12.jpg',
    title: 'Mô hình Bác sĩ Gia đình: Chăm sóc liên tục và dự phòng chủ động',
    desc: 'Tại sao việc có một bác sĩ gia đình am hiểu tiền sử y khoa cả nhà giúp phát hiện sớm nguy cơ và tiết kiệm chi phí điều trị.',
    date: '24/10/2026',
    author: 'BS.CKI Nguyễn Minh Tuấn',
  },
  {
    id: 'blog-03',
    img: '/images/medsev/home-one/13.jpg',
    title: 'Hồ sơ bệnh án điện tử EHR: Quản lý y bạ tập trung cho đa thế hệ',
    desc: 'Bảo mật dữ liệu sức khỏe, liên thông chuẩn HL7 FHIR và phương pháp theo dõi biểu đồ diễn tiến sức khỏe người cao tuổi.',
    date: '15/10/2026',
    author: 'TS.BS Phạm Minh Đức',
  },
];

export function PackagesCatalogView() {
  const { isAuthenticated } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'trial' | 'standard' | 'annual'>('all');
  const [isMonthlyView, setIsMonthlyView] = useState(false);

  const getPackageHref = (pkgId: string) => {
    const code =
      pkgId === 'pkg-basic'
        ? 'BASIC'
        : pkgId === 'pkg-toan-dien'
          ? 'FAMILY'
          : pkgId === 'pkg-nguoi-cao-tuoi'
            ? 'ELDERLY'
            : 'ROYAL';
    return isAuthenticated
      ? `/family/subscription?packageId=${code}`
      : `/register?packageId=${code}`;
  };

  // Estimator interactive state
  const [selectedEstimatorPkgId, setSelectedEstimatorPkgId] = useState<string>('pkg-toan-dien');
  const [memberCount, setMemberCount] = useState<number>(3);
  const [selectedDoctorLevel, setSelectedDoctorLevel] = useState<string>('standard');

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

  // Estimator calculation
  const estimatorPkg = useMemo(() => {
    return PACKAGES.find((p) => p.id === selectedEstimatorPkgId) || PACKAGES[1]!;
  }, [selectedEstimatorPkgId]);

  const doctorLevelObj = useMemo(() => {
    return DOCTOR_LEVELS.find((d) => d.id === selectedDoctorLevel) || DOCTOR_LEVELS[0]!;
  }, [selectedDoctorLevel]);

  // Adjust member count when package changes if needed
  const handleSelectEstimatorPkg = (pkgId: string) => {
    setSelectedEstimatorPkgId(pkgId);
    const p = PACKAGES.find((item) => item.id === pkgId);
    if (p) {
      setMemberCount(p.defaultMembers);
    }
  };

  const extraMembers = Math.max(0, memberCount - estimatorPkg.defaultMembers);
  const isOverMaxLimit = memberCount > estimatorPkg.maxMembers;
  const extraMemberFeeTotal = extraMembers * 75000 * estimatorPkg.months;
  const doctorSurchargeTotal = estimatorPkg.homeVisits * doctorLevelObj.surcharge;
  const basePriceNumber = estimatorPkg.homeVisits * estimatorPkg.unitPrice;
  const totalEstimatedPrice = basePriceNumber + extraMemberFeeTotal + doctorSurchargeTotal;
  const monthlyAverageEstimated = Math.round(totalEstimatedPrice / estimatorPkg.months);

  return (
    <div className="bg-white min-h-screen text-[#232323] font-sans antialiased flex flex-col justify-between">
      {/* 1. SHARED UNIFIED HEADER */}
      <LandingHeader />

      <main className="w-full flex-1">
        {/* 2. MEDSEV PAGE TITLE AREA */}
        <section
          className="relative bg-cover bg-center py-20 sm:py-28 text-center text-white"
          style={{ backgroundImage: "url('/images/medsev/service-details-bg.jpg')" }}
        >
          <div className="absolute inset-0 bg-[#0046c0]/80" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-xs">
              Gói Bác Sĩ Gia Đình &amp; Bảng Giá Dịch Vụ
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto font-normal">
              Khám tại gia (Home Visit) và Tư vấn Telehealth 24/7. Minh bạch chi phí, không phụ phí ẩn, chuẩn Bộ Y Tế.
            </p>

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

        {/* 3. INTERACTIVE SEARCH & PRICING MODE TOGGLE BAR */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-20">
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

              {/* Pricing Mode Toggle: Cả kỳ vs Bình quân tháng */}
              <div className="inline-flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold w-full sm:w-auto justify-center">
                <button
                  type="button"
                  onClick={() => setIsMonthlyView(false)}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    !isMonthlyView ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Giá Trọn Gói Cả Kỳ
                </button>
                <button
                  type="button"
                  onClick={() => setIsMonthlyView(true)}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    isMonthlyView ? 'bg-[#0046c0] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Bình Quân Theo Tháng</span>
                </button>
              </div>
            </div>

            {/* Quick Category Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 mr-1">Kỳ hạn gói:</span>
              {[
                { id: 'all', label: 'Tất cả các gói' },
                { id: 'trial', label: '1 Tháng (Trải nghiệm)' },
                { id: 'standard', label: '3 - 6 Tháng (Gia đình)' },
                { id: 'annual', label: '12 Tháng (Toàn diện)' },
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

        {/* 4. MEDSEV SERVICES AREA: 4 CORE PACKAGES GRID */}
        <section className="pt-16 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#232323] tracking-tight relative pb-4 inline-block after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-20 after:h-1 after:bg-[#0046c0] after:rounded">
              Danh Mục Gói Chăm Sóc Sức Khỏe
            </h2>
            <p className="text-sm sm:text-base text-[#676767] leading-relaxed pt-2">
              Giá gói = Số lần khám tại nhà × Đơn giá gói. Lịch khám linh hoạt do gia đình và bác sĩ thống nhất, video và nhắn tin đã bao gồm trọn gói.
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
            /* 4-Column Grid matching packages */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-stretch">
              {filteredPackages.map((pkg) => {
                const displayPrice = isMonthlyView ? pkg.monthlyPrice : pkg.price;
                const displayPeriod = isMonthlyView ? '/tháng' : pkg.periodText;
                const displaySub = isMonthlyView ? pkg.monthlySubPrice : pkg.subPrice;

                return (
                  <div
                    key={pkg.id}
                    className={`group relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ease-out bg-white border overflow-hidden ${
                      pkg.popular
                        ? 'border-[#0046c0] shadow-xl ring-2 ring-[#0046c0]/20'
                        : 'border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300'
                    }`}
                  >
                    {/* Popular Badge */}
                    {pkg.popular && (
                      <div className="absolute top-3.5 right-3.5 bg-[#0046c0] text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs z-10 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        <span>Phổ biến nhất</span>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="relative z-10 space-y-4">
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-xl bg-blue-50 text-[#0046c0] group-hover:bg-[#0046c0] group-hover:text-white flex items-center justify-center text-3xl transition-all duration-300 shadow-xs">
                        <span className="material-symbols-outlined text-2xl">{pkg.icon}</span>
                      </div>

                      {/* Titles */}
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-[#0046c0]">
                          {pkg.badge}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#0046c0] transition-colors leading-snug">
                          {pkg.name}
                        </h3>
                        <div className="text-xs text-slate-500">
                          {pkg.altName}
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
                            {displayPrice}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {displayPeriod}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          {displaySub}
                        </div>
                      </div>

                      {/* Features List */}
                      <ul className="space-y-2 pt-3 border-t border-slate-100 text-xs leading-relaxed text-slate-700">
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

                    {/* Card Actions */}
                    <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 space-y-2">
                      <Link
                        href={getPackageHref(pkg.id)}
                        className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-center transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                          pkg.popular
                            ? 'bg-[#0046c0] hover:bg-[#003899] text-white shadow-md'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        <span>{isAuthenticated ? 'Chọn đăng ký gói này' : pkg.ctaText}</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 5. INTERACTIVE PRICING ESTIMATOR SECTION */}
        <section className="py-16 bg-slate-50 border-t border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-[#0046c0] uppercase tracking-wider">
                Công Cụ Tính Dự Toán Trực Tuyến
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Dự Toán Chi Phí Thực Tế Theo Gia Đình Bạn
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Minh bạch phụ phí thêm người và phụ thu học vị bác sĩ theo biểu phí chính thức.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-7 space-y-6">
                {/* Step 1: Chọn gói */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                    Bước 1: Chọn gói dịch vụ
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {PACKAGES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectEstimatorPkg(p.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedEstimatorPkgId === p.id
                            ? 'border-[#0046c0] bg-blue-50/50 ring-2 ring-[#0046c0]/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="font-bold text-xs sm:text-sm text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-[#0046c0] font-medium">{p.badge}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Số người cần chăm sóc */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Bước 2: Số thành viên gia đình
                    </label>
                    <span className="text-xs text-slate-500">
                      Gói gồm mặc định: <strong>{estimatorPkg.defaultMembers} người</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={memberCount <= 1}
                      onClick={() => setMemberCount((prev) => Math.max(1, prev - 1))}
                      aria-label="Giảm số thành viên gia đình"
                      title={memberCount <= 1 ? 'Tối thiểu 1 người' : 'Giảm thành viên'}
                      className="w-11 h-11 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      -
                    </button>
                    <div className="w-24 text-center tabular-nums font-bold text-xl text-slate-900">
                      {memberCount} <span className="text-xs font-normal text-slate-500">người</span>
                    </div>
                    <button
                      type="button"
                      disabled={memberCount >= estimatorPkg.defaultMembers}
                      onClick={() => setMemberCount((prev) => Math.min(estimatorPkg.defaultMembers, prev + 1))}
                      aria-label="Tăng số thành viên gia đình"
                      title={
                        memberCount >= estimatorPkg.defaultMembers
                          ? `Gói ${estimatorPkg.name} áp dụng tối đa ${estimatorPkg.defaultMembers} thành viên`
                          : 'Tăng thành viên'
                      }
                      className="w-11 h-11 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      +
                    </button>
                  </div>

                  {memberCount >= estimatorPkg.defaultMembers ? (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-blue-600 text-sm">info</span>
                      <span>
                        Gói {estimatorPkg.name} áp dụng tối đa <strong>{estimatorPkg.defaultMembers} người</strong>. Nếu cần chăm sóc thêm thành viên, bạn có thể chọn gói quy mô lớn hơn ở Bước 1.
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Gói này hỗ trợ tối đa {estimatorPkg.defaultMembers} người theo định mức tiêu chuẩn.
                    </p>
                  )}
                </div>

                {/* Step 3: Loại Bác sĩ phụ trách */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                    Bước 3: Học vị Bác sĩ phụ trách
                  </label>
                  <select
                    value={selectedDoctorLevel}
                    onChange={(e) => setSelectedDoctorLevel(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-[#0046c0] outline-none"
                  >
                    {DOCTOR_LEVELS.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.desc})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    * Phụ thu loại bác sĩ chỉ tính cho số lần khám tại nhà ({estimatorPkg.homeVisits} lần), không nhân số người.
                  </p>
                </div>
              </div>

              {/* Right Column: Pricing Summary Card */}
              <div className="lg:col-span-5 bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                <h4 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#0046c0] text-base">receipt_long</span>
                  <span>Bảng Bóc Tách Dự Toán</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Gói cơ bản ({estimatorPkg.months} tháng · {estimatorPkg.defaultMembers} người):</span>
                    <span className="font-semibold text-slate-900">{basePriceNumber.toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Phụ phí thêm người ({extraMembers} người):</span>
                    <span className="font-semibold text-slate-900">
                      {extraMembers > 0
                        ? `+${extraMemberFeeTotal.toLocaleString('vi-VN')} đ`
                        : '0 đ (Đã gồm trong gói)'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Phụ thu Bác sĩ ({doctorLevelObj.name}):</span>
                    <span className="font-semibold text-slate-900">+{doctorSurchargeTotal.toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Lượt khám tại nhà:</span>
                    <span className="font-semibold text-slate-900">{estimatorPkg.homeVisits} lần toàn kỳ</span>
                  </div>

                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Tư vấn video miễn phí:</span>
                    <span className="font-semibold text-slate-900">{estimatorPkg.videoCalls}</span>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">TỔNG DỰ TOÁN THANH TOÁN:</div>
                  <div className="text-2xl font-bold text-[#0046c0] tabular-nums tracking-tight mt-0.5">
                    {totalEstimatedPrice.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Bình quân tương đương: <strong>{monthlyAverageEstimated.toLocaleString('vi-VN')} đ / tháng</strong>
                  </div>
                </div>

                <Link
                  href={getPackageHref(estimatorPkg.id)}
                  className="w-full py-2.5 rounded-lg bg-[#0046c0] hover:bg-[#003899] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>{isAuthenticated ? 'Tiến hành ký hợp đồng gói này' : 'Tiến hành đăng ký theo cấu hình này'}</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 6. COMPARISON MATRIX SECTION */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Đối Chiếu Quyền Lợi Chi Tiết 4 Gói Dịch Vụ
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              So sánh nhanh hạn mức thăm khám tại nhà, quyền lợi Telehealth và chính sách gia hạn.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="p-3.5 sm:p-4 min-w-[180px]">Tiêu chí / Quyền lợi</th>
                  <th className="p-3.5 sm:p-4 min-w-[140px]">Gói Trải Nghiệm</th>
                  <th className="p-3.5 sm:p-4 min-w-[140px] bg-blue-50/60 text-[#0046c0]">Gói Đồng Hành (★)</th>
                  <th className="p-3.5 sm:p-4 min-w-[140px]">Gói An Tâm</th>
                  <th className="p-3.5 sm:p-4 min-w-[140px]">Gói Toàn Diện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-3.5 sm:p-4 font-semibold text-slate-900 bg-slate-50/50">Thời hạn gói</td>
                  <td className="p-3.5 sm:p-4">1 tháng</td>
                  <td className="p-3.5 sm:p-4 bg-blue-50/20 font-semibold text-slate-900">3 tháng</td>
                  <td className="p-3.5 sm:p-4">6 tháng</td>
                  <td className="p-3.5 sm:p-4">12 tháng</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-semibold text-slate-900 bg-slate-50/50">Thành viên mặc định / Tối đa</td>
                  <td className="p-3.5 sm:p-4">1 / 2 người</td>
                  <td className="p-3.5 sm:p-4 bg-blue-50/20 font-semibold text-slate-900">3 / 6 người</td>
                  <td className="p-3.5 sm:p-4">4 / 8 người</td>
                  <td className="p-3.5 sm:p-4">6 / 10 người</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-semibold text-slate-900 bg-slate-50/50">Khám tại nhà toàn kỳ</td>
                  <td className="p-3.5 sm:p-4">1 lần (1.000k/lần)</td>
                  <td className="p-3.5 sm:p-4 bg-blue-50/20 font-semibold text-slate-900">3 lần (950k/lần)</td>
                  <td className="p-3.5 sm:p-4">7 lần (925k/lần)</td>
                  <td className="p-3.5 sm:p-4">14 lần (900k/lần)</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-semibold text-slate-900 bg-slate-50/50">Tư vấn Video miễn phí</td>
                  <td className="p-3.5 sm:p-4">1 lượt</td>
                  <td className="p-3.5 sm:p-4 bg-blue-50/20 font-semibold text-slate-900">4 lượt</td>
                  <td className="p-3.5 sm:p-4">8 lượt</td>
                  <td className="p-3.5 sm:p-4">Theo kế hoạch bác sĩ</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-semibold text-slate-900 bg-slate-50/50">Nhắn tin với Bác sĩ</td>
                  <td className="p-3.5 sm:p-4">Miễn phí trong kỳ</td>
                  <td className="p-3.5 sm:p-4 bg-blue-50/20 font-semibold text-slate-900">Miễn phí trong kỳ</td>
                  <td className="p-3.5 sm:p-4">Miễn phí trong kỳ</td>
                  <td className="p-3.5 sm:p-4">Miễn phí 365 ngày</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-semibold text-slate-900 bg-slate-50/50">Hồ sơ bệnh án điện tử (EHR)</td>
                  <td className="p-3.5 sm:p-4">Chuẩn HL7 cá nhân</td>
                  <td className="p-3.5 sm:p-4 bg-blue-50/20 font-semibold text-slate-900">EHR Gia đình</td>
                  <td className="p-3.5 sm:p-4">EHR Liên thông</td>
                  <td className="p-3.5 sm:p-4">Y bạ Gia tộc trọn đời</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-semibold text-slate-900 bg-slate-50/50">Phụ phí thêm người</td>
                  <td className="p-3.5 sm:p-4">75.000đ/người/tháng</td>
                  <td className="p-3.5 sm:p-4 bg-blue-50/20 font-semibold text-slate-900">75.000đ/người/tháng</td>
                  <td className="p-3.5 sm:p-4">75.000đ/người/tháng</td>
                  <td className="p-3.5 sm:p-4">75.000đ/người/tháng</td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-semibold text-slate-900 bg-slate-50/50">Giá trọn gói cơ bản</td>
                  <td className="p-3.5 sm:p-4 font-bold text-slate-900">1.000.000 đ</td>
                  <td className="p-3.5 sm:p-4 bg-blue-50/20 font-bold text-[#0046c0]">2.850.000 đ</td>
                  <td className="p-3.5 sm:p-4 font-bold text-slate-900">6.475.000 đ</td>
                  <td className="p-3.5 sm:p-4 font-bold text-slate-900">12.600.000 đ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. SCOPE DISCLOSURES & RULES */}
        <section className="py-12 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-sm">
              <span className="material-symbols-outlined text-[#0046c0] text-lg">info</span>
              <span>Nguyên Tắc Dịch Vụ &amp; Phạm Vi Loại Trừ Quan Trọng</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#0046c0]">calendar_month</span>
                  <span>Lịch khám linh hoạt</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Thời điểm khám do gia đình và bác sĩ phụ trách chủ động thống nhất theo ca, không bắt buộc khóa cứng 1 lần/tháng.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#0046c0]">medical_services</span>
                  <span>Bác sĩ phụ trách</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Đã bao gồm bác sĩ cơ sở (250k). Có thể nâng cấp Thạc sĩ (+50k), Tiến sĩ (+100k), GS/PGS (+200k) cho mỗi lần khám tại nhà.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#0046c0]">group_add</span>
                  <span>Phí thêm người</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  75.000đ/người/tháng theo trần gói (tối đa 2, 6, 8, 10 người). Các thành viên sử dụng chung hạn mức khám và video của gói.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-amber-600">block</span>
                  <span>Không bao gồm trong gói</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  KHÔNG gồm tiền thuốc, xét nghiệm máu, chẩn đoán hình ảnh và cấp cứu. Cơ sở y tế đủ điều kiện sẽ báo giá và thu tiền trực tiếp.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. BLOG / CAM NANG SECTION */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
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
      </main>

      {/* 9. SHARED UNIFIED FOOTER */}
      <LandingFooter />
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicHeader, PublicFooter } from '@/components/layout';

export interface PackageData {
  id: string;
  name: string;
  tag: string;
  scaleText: string;
  familySize: string; // '1' | '2' | '3-4' | '5-6' | 'vip'
  careNeed: string; // 'basic' | 'family' | 'elderly' | 'vip'
  commitment: string; // '1' | '3' | '12'
  description: string;
  price: number;
  priceDisplay: string;
  periodDisplay: string;
  billingSub: string;
  topBadge?: string;
  hotBadge?: boolean;
  topBorderClass?: string;
  isPopular?: boolean;
  isVip?: boolean;
  features: { text: string; strongText?: string; icon: string; iconFill?: boolean; iconColorClass?: string }[];
  ctaText: string;
  ctaPath: string;
}

const PACKAGES_DATA: PackageData[] = [
  {
    id: 'pkg-basic',
    name: 'Gói Chăm Sóc Cơ Bản',
    tag: '1 Tháng Khởi Đầu',
    scaleText: 'Tối đa 2 người',
    familySize: '1',
    careNeed: 'basic',
    commitment: '1',
    description: 'Làm quen với dịch vụ bác sĩ gia đình chuyên nghiệp, hỗ trợ giải đáp 24/7.',
    price: 1490000,
    priceDisplay: '1.490.000',
    periodDisplay: 'đ/tháng',
    billingSub: 'Thanh toán theo tháng linh hoạt',
    topBorderClass: 'bg-blue-400',
    features: [
      { strongText: '3 lượt', text: 'bác sĩ khám tận nhà (Home Visit)', icon: 'check_circle', iconColorClass: 'text-[#059669]' },
      { strongText: '5 lượt', text: 'tư vấn video Telehealth', icon: 'check_circle', iconColorClass: 'text-[#059669]' },
      { text: 'Bác sĩ Tổng quát chỉ định theo dõi', icon: 'badge', iconColorClass: 'text-[#2563eb]' },
      { text: 'Hồ sơ EMR điện tử liên thông', icon: 'medical_information', iconColorClass: 'text-[#2563eb]' },
      { text: 'Trợ lý AI phân tích sinh hiệu 24/7', icon: 'smart_toy', iconColorClass: 'text-[#2563eb]' },
    ],
    ctaText: 'Chọn gói này',
    ctaPath: '/register?packageId=pkg-basic',
  },
  {
    id: 'pkg-toan-dien',
    name: 'Gói Gia Đình Toàn Diện',
    tag: 'Kỳ 3 Tháng (Khuyên dùng)',
    scaleText: 'Hộ 3 - 4 người',
    familySize: '3-4',
    careNeed: 'family',
    commitment: '3',
    description: 'Quản lý trọn vẹn sức khỏe con nhỏ và cha mẹ, can thiệp kịp thời 24/7.',
    price: 4245000,
    priceDisplay: '4.245.000',
    periodDisplay: 'đ/kỳ 3T',
    billingSub: '1.415.000 đ/tháng (Tiết kiệm 10%)',
    topBadge: '★ 68% Gia đình lựa chọn phổ biến',
    hotBadge: true,
    isPopular: true,
    features: [
      { strongText: '5 lượt', text: 'bác sĩ khám tại nhà', icon: 'check_circle', iconFill: true, iconColorClass: 'text-[#059669]' },
      { strongText: '20 lượt', text: 'video call chuyên sâu', icon: 'check_circle', iconFill: true, iconColorClass: 'text-[#059669]' },
      { strongText: '1 Bác sĩ CKI gia đình', text: 'phụ trách riêng', icon: 'badge', iconFill: true, iconColorClass: 'text-[#2563eb]' },
      { text: 'Kê đơn & Cấp thuốc GPP tận nơi 2h', icon: 'medication', iconFill: true, iconColorClass: 'text-[#2563eb]' },
      { text: 'Lập phác đồ dinh dưỡng & bệnh lý', icon: 'nutrition', iconFill: true, iconColorClass: 'text-[#2563eb]' },
    ],
    ctaText: 'Đăng ký gói này',
    ctaPath: '/register?packageId=pkg-toan-dien',
  },
  {
    id: 'pkg-nguoi-cao-tuoi',
    name: 'Gói Chăm Sóc Người Cao Tuổi & Mạn Tính',
    tag: '12 Tháng Đồng Hành',
    scaleText: 'Tối đa 6 người',
    familySize: '5-6',
    careNeed: 'elderly',
    commitment: '12',
    description: 'Kiểm soát huyết áp, tim mạch, tiểu đường cho cha mẹ già an tâm sống vui khỏe.',
    price: 16490000,
    priceDisplay: '16.490.000',
    periodDisplay: 'đ/năm',
    billingSub: 'Tặng máy HA Omron Bluetooth (-20%)',
    topBorderClass: 'bg-[#ea580c]',
    features: [
      { strongText: '20 lượt', text: 'khám chuyên sâu tại nhà', icon: 'check_circle', iconColorClass: 'text-[#059669]' },
      { strongText: '96 lượt', text: 'video call telehealth', icon: 'check_circle', iconColorClass: 'text-[#059669]' },
      { text: 'Hội đồng Bác sĩ Lão khoa phụ trách', icon: 'diversity_1', iconColorClass: 'text-[#2563eb]' },
      { strongText: '2 đợt', text: 'xét nghiệm máu tại nhà', icon: 'biotech', iconColorClass: 'text-[#2563eb]' },
      { text: 'Tích hợp IoT đo huyết áp tự động', icon: 'devices', iconColorClass: 'text-[#2563eb]' },
    ],
    ctaText: 'Chọn gói này',
    ctaPath: '/register?packageId=pkg-nguoi-cao-tuoi',
  },
  {
    id: 'pkg-hoang-gia',
    name: 'Gói Gia Đình Hoàng Gia',
    tag: 'VIP Concierge',
    scaleText: 'Đại gia đình',
    familySize: 'vip',
    careNeed: 'vip',
    commitment: '12',
    description: 'Quản trị y tế tư gia thượng lưu không giới hạn lượt cho đại gia đình.',
    price: 28900000,
    priceDisplay: '28.900.000',
    periodDisplay: 'đ/năm',
    billingSub: 'Đặc quyền quản gia y tế tư gia 24/7',
    topBorderClass: 'bg-[#f59e0b]',
    isVip: true,
    features: [
      { text: 'Khám tại nhà', strongText: 'không giới hạn lượt', icon: 'check_circle', iconColorClass: 'text-[#059669]' },
      { text: 'Bác sĩ Trưởng khoa phụ trách 24/7', icon: 'stars', iconColorClass: 'text-[#f59e0b]' },
      { text: 'Ekip phản ứng nhanh & xe cấp cứu VIP', icon: 'emergency', iconColorClass: 'text-[#ea580c]' },
      { text: 'Bảo lãnh viện phí & Fast-Track quốc tế', icon: 'flight_takeoff', iconColorClass: 'text-[#2563eb]' },
      { text: 'Bảo mật dữ liệu tuyệt đối theo HIPAA', icon: 'shield', iconColorClass: 'text-[#10b981]' },
    ],
    ctaText: 'Liên hệ tư vấn VIP',
    ctaPath: '/register?packageId=pkg-hoang-gia&type=vip',
  },
];

export function PackagesCatalogView() {
  const router = useRouter();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [familyScale, setFamilyScale] = useState<string>('ALL');
  const [careNeed, setCareNeed] = useState<string>('ALL');
  const [commitment, setCommitment] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('popular');

  // Testing State View Toggle ('active' | 'empty' | 'loading')
  const [testViewMode, setTestViewMode] = useState<'active' | 'empty' | 'loading'>('active');

  // Filter logic
  const filteredPackages = useMemo(() => {
    let result = PACKAGES_DATA.filter((pkg) => {
      // 1. Search keyword
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = pkg.name.toLowerCase().includes(term);
        const matchDesc = pkg.description.toLowerCase().includes(term);
        const matchFeatures = pkg.features.some((f) => f.text.toLowerCase().includes(term));
        if (!matchName && !matchDesc && !matchFeatures) return false;
      }

      // 2. Family Scale
      if (familyScale !== 'ALL') {
        if (familyScale === '1' && pkg.familySize !== '1') return false;
        if (familyScale === '2' && pkg.familySize !== '1' && pkg.familySize !== '2') return false;
        if (familyScale === '3-4' && pkg.familySize !== '3-4') return false;
        if (familyScale === '5-6' && pkg.familySize !== '5-6' && pkg.familySize !== 'vip') return false;
        if (familyScale === 'vip' && pkg.familySize !== 'vip') return false;
      }

      // 3. Care Need
      if (careNeed !== 'ALL') {
        if (careNeed !== pkg.careNeed && pkg.careNeed !== 'family') return false;
      }

      // 4. Commitment
      if (commitment !== 'ALL') {
        if (pkg.commitment !== commitment) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [searchTerm, familyScale, careNeed, commitment, sortBy]);

  const resetAllFilters = () => {
    setSearchTerm('');
    setFamilyScale('ALL');
    setCareNeed('ALL');
    setCommitment('ALL');
    setSortBy('popular');
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen text-[#0f172a] font-sans antialiased selection:bg-blue-100 selection:text-[#1d4ed8]">
      {/* 1. SHARED UNIFIED PUBLIC HEADER */}
      <PublicHeader />

      {/* 2. MAIN CONTAINER */}
      <main className="w-full pt-20 bg-[#f8fafc]">
        <div className="flex flex-col w-full">
          {/* BREADCRUMB & INTRO HERO SECTION */}
          <section className="w-full bg-gradient-to-b from-blue-50/70 via-slate-50 to-[#f8fafc] py-6 sm:py-8 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-[#475569] mb-4">
                <Link className="hover:text-[#2563eb] transition-colors flex items-center gap-1" href="/">
                  <span className="material-symbols-outlined text-sm">home</span>
                  Trang chủ
                </Link>
                <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
                <span className="text-[#475569]">Gói chăm sóc</span>
                <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
                <span className="font-semibold text-[#2563eb]">Danh sách gói y tế gia đình</span>
              </nav>

              {/* Grid: Hero Title & Fast Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#1d4ed8] text-xs font-semibold border border-blue-200">
                    <span className="material-symbols-outlined text-sm text-[#2563eb] material-symbols-filled">
                      verified
                    </span>
                    Y học gia đình chuẩn hóa theo khuyến nghị BYT &amp; WONCA
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-[40px] text-[#0f172a] font-extrabold tracking-tight leading-tight">
                    Tìm gói chăm sóc phù hợp cho{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] to-blue-700">
                      gia đình bạn
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base text-[#475569] max-w-3xl leading-relaxed">
                    Giải pháp chủ động theo dõi sức khỏe liên tục, kết nối tức thì cùng đội ngũ bác sĩ chuyên khoa riêng.
                    Bác sĩ thăm khám tận nhà, tư vấn Telehealth 24/7 và đồng hành bảo vệ đa thế hệ người thân.
                  </p>
                </div>

                {/* Fast Stats Metric Card */}
                <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm space-y-3 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2563eb] text-xl">medical_services</span>
                      <span className="text-xs font-bold text-[#475569]">Hệ thống FamiDoc</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[11px] font-bold text-[#2563eb] border border-blue-200">
                      4 Gói Tiêu Chuẩn
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2563eb] text-base">group</span>
                      <span className="text-sm font-semibold text-[#0f172a]">12.800+ gia đình đã tin dùng</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#059669] text-base">verified_user</span>
                      <span className="text-xs text-[#475569] font-medium">
                        Cam kết hoàn tiền 100% trong 30 ngày nếu không hài lòng
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-[#475569] bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-[#2563eb]">schedule</span>
                      Trực cấp cứu 24/7
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-[#10b981]">lock</span>
                      Bảo mật EMR HL7/FHIR
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* HORIZONTAL INTERACTIVE FILTER SECTION */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#2563eb] border border-blue-100">
                    <span className="material-symbols-outlined text-lg">tune</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-[#0f172a] leading-tight">Bộ lọc tùy biến gói dịch vụ</h2>
                    <p className="text-xs text-[#475569]">Lựa chọn tiêu chí để tìm gói chăm sóc sức khỏe tối ưu nhất</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 md:max-w-md">
                  <div className="relative w-full flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg pointer-events-none">
                      search
                    </span>
                    <input
                      id="search-input"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm theo tên gói chăm sóc (Gói gia đình, cơ bản, người cao tuổi...)"
                      className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-50 text-[#0f172a] placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:bg-white border border-slate-200 transition-all"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        id="clear-search-btn"
                        onClick={() => setSearchTerm('')}
                        title="Xóa từ khóa tìm kiếm"
                        className="absolute right-2.5 text-slate-400 hover:text-[#0f172a] transition-colors p-1 flex items-center justify-center rounded-full hover:bg-slate-100"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    id="reset-all-filters"
                    aria-label="Xóa bộ lọc"
                    onClick={resetAllFilters}
                    className="shrink-0 text-xs text-[#2563eb] font-semibold hover:underline flex items-center gap-1 px-2 py-2"
                  >
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    Xóa bộ lọc
                  </button>
                </div>
              </div>

              {/* Filter Rows Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
                {/* 1. Quy mô gia đình */}
                <div className="lg:col-span-5 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#2563eb]">groups</span>
                    Quy mô gia đình
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'ALL', label: 'Tất cả' },
                      { id: '1', label: 'Cá nhân (1 ng)' },
                      { id: '2', label: 'Cặp đôi (2 ng)' },
                      { id: '3-4', label: 'Gia đình nhỏ (3 - 4 ng)' },
                      { id: '5-6', label: 'Đa thế hệ (5 - 6 ng)' },
                      { id: 'vip', label: 'VIP Concierge' },
                    ].map((item) => {
                      const isActive = familyScale === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFamilyScale(item.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ${
                            isActive
                              ? 'bg-[#2563eb] text-white font-bold shadow-xs ring-2 ring-[#2563eb]/20'
                              : 'bg-slate-100 text-[#0f172a] font-medium hover:bg-slate-200'
                          }`}
                        >
                          <span>{item.label}</span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Trọng tâm / Nhu cầu chăm sóc */}
                <div className="lg:col-span-4 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#2563eb]">health_and_safety</span>
                    Nhu cầu chăm sóc chính
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'ALL', label: 'Tất cả' },
                      { id: 'basic', label: 'Cơ bản' },
                      { id: 'family', label: 'Toàn diện gia đình' },
                      { id: 'elderly', label: 'Người cao tuổi & mạn tính' },
                      { id: 'vip', label: 'VIP Concierge' },
                    ].map((item) => {
                      const isActive = careNeed === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCareNeed(item.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                            isActive
                              ? 'bg-[#1d4ed8] text-white font-bold shadow-xs ring-2 ring-blue-300'
                              : 'bg-slate-100 text-[#0f172a] font-medium hover:bg-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Kỳ hạn cam kết */}
                <div className="lg:col-span-3 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#2563eb]">calendar_month</span>
                    Kỳ hạn cam kết
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCommitment('ALL')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                        commitment === 'ALL'
                          ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                          : 'bg-slate-100 text-[#0f172a] font-medium hover:bg-slate-200'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommitment('1')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                        commitment === '1'
                          ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                          : 'bg-slate-100 text-[#0f172a] font-medium hover:bg-slate-200'
                      }`}
                    >
                      1 Tháng
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommitment('3')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition-all relative ${
                        commitment === '3'
                          ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                          : 'bg-slate-100 text-[#0f172a] font-medium hover:bg-slate-200'
                      }`}
                    >
                      3 Tháng <span className="text-[10px] opacity-90">(Tiết kiệm)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommitment('12')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition-all relative ${
                        commitment === '12'
                          ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                          : 'bg-slate-100 text-[#0f172a] font-medium hover:bg-slate-200'
                      }`}
                    >
                      12 Tháng
                      <span className="px-1.5 py-0.2 rounded bg-[#f59e0b] text-[#0f172a] text-[9px] font-extrabold ml-1">
                        Tặng quà
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filter Chips Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[#475569] text-[11px] font-medium mr-1">Bộ lọc đang áp dụng:</span>
                  {familyScale !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-[#1d4ed8] font-medium text-[11px] border border-blue-200">
                      Quy mô: {familyScale === '3-4' ? 'Gia đình nhỏ (3 - 4 người)' : familyScale}
                      <button
                        className="hover:text-[#2563eb] leading-none"
                        onClick={() => setFamilyScale('ALL')}
                        type="button"
                        aria-label="Xóa bộ lọc quy mô"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  )}

                  {careNeed !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[#1d4ed8] font-medium text-[11px] border border-blue-200">
                      Nhu cầu: {careNeed}
                      <button
                        className="hover:text-[#2563eb] leading-none"
                        onClick={() => setCareNeed('ALL')}
                        type="button"
                        aria-label="Xóa bộ lọc nhu cầu"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  )}

                  {commitment !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[#0f172a] font-medium text-[11px] border border-slate-200">
                      Kỳ {commitment} Tháng
                      <button
                        className="hover:text-[#2563eb] leading-none"
                        onClick={() => setCommitment('ALL')}
                        type="button"
                        aria-label="Xóa bộ lọc kỳ hạn"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  )}

                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[#0f172a] font-medium text-[11px] border border-slate-200">
                      Từ khóa: {searchTerm}
                      <button
                        className="hover:text-[#2563eb] leading-none"
                        onClick={() => setSearchTerm('')}
                        type="button"
                        aria-label="Xóa từ khóa"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  )}

                  {(familyScale !== 'ALL' || careNeed !== 'ALL' || commitment !== 'ALL' || searchTerm) && (
                    <button
                      className="text-[#2563eb] text-[11px] font-semibold hover:underline ml-1"
                      onClick={resetAllFilters}
                      type="button"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-[#475569] font-medium">
                    <span>Sắp xếp:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-slate-100 text-[#0f172a] text-xs font-semibold py-1 px-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] cursor-pointer border border-slate-200"
                    >
                      <option value="popular">Phổ biến nhất</option>
                      <option value="price-asc">Giá: Thấp đến cao</option>
                      <option value="price-desc">Giá: Cao đến thấp</option>
                      <option value="name">Tên gói: A - Z</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* MAIN LISTING SECTION */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-4">
            {/* Toolbar & View Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white px-4 sm:px-6 py-3 rounded-xl shadow-xs border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] animate-pulse" />
                <span className="font-bold text-[#0f172a]">
                  Hiển thị {filteredPackages.length} gói chăm sóc sức khỏe gia đình
                </span>
                <span className="text-[#475569] hidden md:inline">| Bác sĩ riêng trực tiếp phụ trách theo hồ sơ</span>
              </div>

              {/* Testing state toggles */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <span className="text-[11px] text-[#475569] font-medium px-1.5 hidden lg:inline">Chế độ kiểm thử:</span>
                <button
                  id="tab-state-active"
                  type="button"
                  onClick={() => setTestViewMode('active')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    testViewMode === 'active'
                      ? 'bg-[#2563eb] text-white font-bold'
                      : 'text-[#475569] hover:bg-white font-medium'
                  }`}
                >
                  1. Danh sách hoạt động
                </button>
                <button
                  id="tab-state-empty"
                  type="button"
                  onClick={() => setTestViewMode('empty')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    testViewMode === 'empty'
                      ? 'bg-[#2563eb] text-white font-bold'
                      : 'text-[#475569] hover:bg-white font-medium'
                  }`}
                >
                  2. Trống (Empty)
                </button>
                <button
                  id="tab-state-loading"
                  type="button"
                  onClick={() => setTestViewMode('loading')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    testViewMode === 'loading'
                      ? 'bg-[#2563eb] text-white font-bold'
                      : 'text-[#475569] hover:bg-white font-medium'
                  }`}
                >
                  3. Đang tải
                </button>
              </div>
            </div>

            {/* STATE 1: 4-COLUMN PARALLEL GRID */}
            {testViewMode === 'active' && filteredPackages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
                {filteredPackages.map((pkg) => (
                  <article
                    key={pkg.id}
                    className={`bg-white rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all border flex flex-col justify-between relative overflow-hidden group ${
                      pkg.isPopular
                        ? 'border-2 border-[#2563eb] shadow-lg shadow-blue-100 hover:shadow-xl lg:-translate-y-1 bg-gradient-to-b from-blue-50/50 via-white to-white'
                        : pkg.isVip
                        ? 'border border-[#f59e0b]/40 shadow-sm'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Top Stripe/Banner */}
                    {pkg.topBadge ? (
                      <div className="absolute top-0 right-0 left-0 bg-[#2563eb] py-1 px-3 text-center text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs">
                        <span className="material-symbols-outlined text-xs text-amber-300 material-symbols-filled">
                          star
                        </span>
                        {pkg.topBadge}
                      </div>
                    ) : (
                      pkg.topBorderClass && <div className={`h-1.5 absolute left-0 right-0 top-0 ${pkg.topBorderClass}`} />
                    )}

                    <div className={`space-y-3 flex-1 flex flex-col ${pkg.topBadge ? 'pt-5' : 'pt-1'}`}>
                      {/* Tag / Scale */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                            pkg.isPopular
                              ? 'bg-blue-100 text-[#1d4ed8] border-blue-200'
                              : pkg.isVip
                              ? 'bg-amber-50 text-[#d97706] border-amber-200 flex items-center gap-1'
                              : pkg.id === 'pkg-nguoi-cao-tuoi'
                              ? 'bg-orange-50 text-[#ea580c] border-orange-100'
                              : 'bg-blue-50 text-[#1d4ed8] border-blue-100'
                          }`}
                        >
                          {pkg.isVip && (
                            <span className="material-symbols-outlined text-xs text-[#f59e0b]">
                              workspace_premium
                            </span>
                          )}
                          {pkg.tag}
                        </span>

                        <span
                          className={`text-[11px] flex items-center gap-1 font-medium ${
                            pkg.isPopular ? 'text-[#2563eb] font-bold' : 'text-[#475569]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {pkg.isVip ? 'all_inclusive' : pkg.id === 'pkg-nguoi-cao-tuoi' ? 'elderly' : 'groups'}
                          </span>
                          {pkg.scaleText}
                        </span>
                      </div>

                      {/* Package Title & Desc */}
                      <div>
                        <h3 className="text-base font-bold text-[#0f172a] leading-snug flex items-center gap-1.5">
                          {pkg.name}
                          {pkg.hotBadge && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ea580c] text-white font-bold shadow-xs">
                              Hot
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-[#475569] mt-1 line-clamp-2">{pkg.description}</p>
                      </div>

                      {/* Price block */}
                      <div
                        className={`pt-2 pb-3 border-b border-slate-100 ${
                          pkg.isPopular ? 'bg-blue-50/60 p-2.5 rounded-xl border border-blue-100' : ''
                        }`}
                      >
                        <div
                          className={`text-2xl font-extrabold tracking-tight ${
                            pkg.isPopular ? 'text-[#2563eb]' : 'text-[#0f172a]'
                          }`}
                        >
                          {pkg.priceDisplay}{' '}
                          <span className="text-xs font-normal text-[#475569]">{pkg.periodDisplay}</span>
                        </div>
                        <div
                          className={`text-[11px] font-medium mt-0.5 ${
                            pkg.isPopular
                              ? 'text-[#ea580c] font-semibold'
                              : pkg.id === 'pkg-nguoi-cao-tuoi'
                              ? 'text-[#ea580c] font-semibold'
                              : pkg.isVip
                              ? 'text-[#d97706]'
                              : 'text-[#475569]'
                          }`}
                        >
                          {pkg.billingSub}
                        </div>
                      </div>

                      {/* Clinical Benefits Checklist */}
                      <div className="space-y-2 text-xs flex-1 pt-1">
                        <div
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            pkg.isPopular ? 'text-[#2563eb] flex items-center gap-1' : 'text-[#475569]'
                          }`}
                        >
                          {pkg.isPopular && (
                            <span className="material-symbols-outlined text-xs text-[#2563eb]">verified</span>
                          )}
                          {pkg.isVip
                            ? 'Đặc quyền độc bản:'
                            : pkg.isPopular
                            ? 'Đặc quyền chăm sóc toàn diện:'
                            : pkg.id === 'pkg-nguoi-cao-tuoi'
                            ? 'Quyền lợi chuyên khoa:'
                            : 'Quyền lợi y tế:'}
                        </div>
                        <ul className="space-y-2 text-[#0f172a]">
                          {pkg.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span
                                className={`material-symbols-outlined text-base shrink-0 mt-0.5 ${
                                  feat.iconColorClass || 'text-[#2563eb]'
                                } ${feat.iconFill ? 'material-symbols-filled' : ''}`}
                              >
                                {feat.icon}
                              </span>
                              <span>
                                {feat.strongText && <strong>{feat.strongText} </strong>}
                                {feat.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 mt-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => router.push(pkg.ctaPath)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                          pkg.isVip
                            ? 'bg-[#0f172a] hover:bg-slate-800 text-amber-300 border border-amber-400/40 shadow-xs'
                            : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-sm'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {pkg.isVip ? 'diamond' : pkg.isPopular ? 'assignment_turned_in' : 'check_circle'}
                        </span>
                        {pkg.ctaText}
                      </button>

                      <Link
                        href={`/packages/${pkg.id}`}
                        className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                          pkg.isPopular
                            ? 'bg-blue-50 hover:bg-blue-100 text-[#1d4ed8] border border-blue-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-[#0f172a]'
                        }`}
                      >
                        <span>Xem chi tiết quyền lợi</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* STATE 2: EMPTY STATE */}
            {(testViewMode === 'empty' || (testViewMode === 'active' && filteredPackages.length === 0)) && (
              <div
                role="status"
                id="state-empty-container"
                className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm text-center space-y-4 border border-slate-200"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl">search_off</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-[#0f172a]">Không tìm thấy gói khám phù hợp</h3>
                  <p className="text-sm text-[#475569] max-w-md mx-auto">
                    Không tìm thấy gói chăm sóc hoặc gói khám phù hợp với tiêu chí của bạn. Hãy thử thay đổi bộ lọc hoặc yêu cầu bác sĩ thiết kế
                    gói riêng.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetAllFilters();
                      setTestViewMode('active');
                    }}
                    className="px-5 py-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    Đặt lại bộ lọc &amp; Xem tất cả
                  </button>
                  <a
                    className="px-5 py-2.5 rounded-lg bg-slate-100 text-[#2563eb] hover:bg-slate-200 text-xs font-bold transition-colors flex items-center gap-1 border border-slate-200"
                    href="tel:19006868"
                  >
                    <span className="material-symbols-outlined text-sm">call</span>
                    Tư vấn thiết kế gói riêng (1900 6868)
                  </a>
                </div>
              </div>
            )}

            {/* STATE 3: SKELETON LOADER */}
            {testViewMode === 'loading' && (
              <div
                id="state-loading-container"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
              >
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-5 shadow-sm space-y-3 animate-pulse border border-slate-200"
                  >
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-slate-200 w-24 rounded" />
                      <div className="h-4 bg-slate-200 w-16 rounded" />
                    </div>
                    <div className="h-5 bg-slate-200 w-3/4 rounded" />
                    <div className="h-3 bg-slate-200 w-full rounded" />
                    <div className="h-8 bg-slate-200 rounded-lg my-2" />
                    <div className="space-y-2 pt-2">
                      <div className="h-3 bg-slate-200 rounded" />
                      <div className="h-3 bg-slate-200 rounded" />
                      <div className="h-3 bg-slate-200 rounded" />
                    </div>
                    <div className="h-9 bg-slate-200 rounded-xl mt-4" />
                  </div>
                ))}
              </div>
            )}

            {/* PAGINATION & SUMMARY */}
            <div className="bg-white px-4 sm:px-6 py-3 rounded-xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[#475569] font-medium">
                Hiển thị <strong className="text-[#0f172a]">1 - {filteredPackages.length}</strong> trên tổng số{' '}
                <strong className="text-[#0f172a]">{PACKAGES_DATA.length}</strong> gói chăm sóc y tế gia đình
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                  Trước
                </button>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-[#2563eb] text-white font-bold flex items-center justify-center shadow-xs"
                >
                  1
                </button>
                <button
                  type="button"
                  disabled
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed flex items-center gap-1"
                >
                  Sau
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Compliance & Regulatory Banner */}
            <div className="p-4 sm:p-5 rounded-xl bg-white text-xs text-[#475569] flex items-start gap-3 border border-slate-200 shadow-xs">
              <span className="material-symbols-outlined text-[#059669] text-lg shrink-0 mt-0.5">verified_user</span>
              <div>
                <span className="font-bold text-[#0f172a]">Quy chuẩn y khoa FamiDoc:</span> Mọi gói chăm sóc đều được quản
                lý bởi bác sĩ có chứng chỉ hành nghề Y học Gia đình / Chuyên khoa cấp I trực thuộc Bộ Y Tế. Các chỉ số sức
                khỏe của quý bệnh nhân được mã hóa lưu trữ theo chuẩn bảo mật HL7/FHIR và cam kết bảo mật trọn vẹn.
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 3. SHARED UNIFIED PUBLIC FOOTER */}
      <PublicFooter />
    </div>
  );
}

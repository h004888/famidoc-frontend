'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LandingHeader, LandingFooter } from '@/features/landing';
import { ContractSigningWizard } from '@/features/subscription-contract';

interface MatchedDoctor {
  id: string;
  name: string;
  title: string;
  matchScore: number;
  specialty: string;
  specialtyKey: string;
  distance: string;
  eta: string;
  slaCommitment: string;
  capacity: string;
  avatarUrl: string;
  hospital: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  tags: string[];
}

const INITIAL_DOCTORS: MatchedDoctor[] = [
  {
    id: 'doc-01',
    name: 'Nguyễn Văn Hoài',
    title: 'PGS. TS. Bác sĩ',
    matchScore: 98,
    specialty: 'Bác sĩ Gia đình, Tim Mạch & ĐTĐ Lão Khoa',
    specialtyKey: 'geriatric',
    distance: '1.8 km',
    eta: '8 phút',
    slaCommitment: 'Có mặt trong 30 phút khi khẩn cấp tại nhà',
    capacity: 'Còn 6/20 gia đình (Panel Cap)',
    avatarUrl: '/images/medsev/home-one/doctor/1.jpg',
    hospital: 'Bệnh viện Đại học Y Dược TP.HCM',
    experienceYears: 24,
    rating: 4.96,
    reviewCount: 384,
    tags: ['Ưu tiên khẩn cấp', 'Quản lý huyết áp', 'ECG tại nhà'],
  },
  {
    id: 'doc-03',
    name: 'Lê Hoàng Nam',
    title: 'BS. CKII',
    matchScore: 95,
    specialty: 'Tim Mạch, Lão Khoa & Đa Bệnh Lý Mạn Tính',
    specialtyKey: 'cardio',
    distance: '3.2 km',
    eta: '14 phút',
    slaCommitment: 'Có mặt trong 40 phút khi khẩn cấp tại nhà',
    capacity: 'Còn 12/30 gia đình (Panel Cap)',
    avatarUrl: '/images/medsev/home-one/doctor/3.jpg',
    hospital: 'Bệnh viện Bạch Mai',
    experienceYears: 19,
    rating: 4.92,
    reviewCount: 290,
    tags: ['Đái tháo đường T2', 'Theo dõi Holter 24h', 'Dinh dưỡng lão khoa'],
  },
  {
    id: 'doc-04',
    name: 'Phạm Minh Đức',
    title: 'TS. Bác sĩ',
    matchScore: 89,
    specialty: 'Nội Tiết, Chuyển Hóa & Bác sĩ Gia đình',
    specialtyKey: 'internal',
    distance: '4.5 km',
    eta: '18 phút',
    slaCommitment: 'Có mặt trong 45 phút khi khẩn cấp tại nhà',
    capacity: 'Còn 8/25 gia đình (Panel Cap)',
    avatarUrl: '/images/medsev/home-one/doctor/4.jpg',
    hospital: 'Bệnh viện Chợ Rẫy',
    experienceYears: 15,
    rating: 4.89,
    reviewCount: 215,
    tags: ['Chuyên sâu nội tiết', 'Kiểm soát HbA1c', 'Tư vấn Telehealth'],
  },
];

export function DoctorMatchingWizard() {
  const [address, setAddress] = useState('Số 45 Chùa Bộc, P. Trung Liệt, Q. Đống Đa, Hà Nội');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [targetElderly, setTargetElderly] = useState(true);
  const [targetChild, setTargetChild] = useState(true);
  const [targetPregnant, setTargetPregnant] = useState(false);
  const [radius, setRadius] = useState('5.0 km');
  const [budget, setBudget] = useState('1.5 - 2.5 triệu / quý');
  const [selectedChronic, setSelectedChronic] = useState<string[]>([
    'Tăng huyết áp',
    'Đái tháo đường Type 2',
  ]);
  const [selectedDoctorForContract, setSelectedDoctorForContract] = useState<{
    name: string;
    specialty: string;
  } | null>(null);
  const [isAddingChronic, setIsAddingChronic] = useState(false);
  const [newChronicInput, setNewChronicInput] = useState('');
  const [contractSuccessToast, setContractSuccessToast] = useState<string | null>(null);

  const removeChronic = (item: string) => {
    setSelectedChronic((prev) => prev.filter((c) => c !== item));
  };

  const handleAddNewChronic = () => {
    if (newChronicInput.trim() && !selectedChronic.includes(newChronicInput.trim())) {
      setSelectedChronic((prev) => [...prev, newChronicInput.trim()]);
      setNewChronicInput('');
      setIsAddingChronic(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {/* 1. Standard Landing Header */}
      <LandingHeader />

      <main className="flex-1 pb-20">
        {/* 2. Hero Page Title Area (Medsev standard) */}
        <section
          className="relative bg-cover bg-center py-20 sm:py-28 text-center text-white"
          style={{ backgroundImage: "url('/images/medsev/doctor/1.jpg')" }}
        >
          {/* Brand Cobalt Overlay */}
          <div className="absolute inset-0 bg-[#0046c0]/75 backdrop-brightness-90" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              <span>Thuật Toán Ghép Nối Đa Tiêu Chí</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-xs">
              Ghép Nối Bác Sĩ Gia Đình Thông Minh
            </h1>

            <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Tự động phân tích tọa độ GPS, thời gian di chuyển (ETA), hồ sơ bệnh nền gia đình và hạn mức chăm sóc (Panel Cap $\le 30$ hộ) để chọn bác sĩ tối ưu nhất.
            </p>

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm text-blue-100 font-medium pt-2">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">home</span>
                Trang chủ
              </Link>
              <span className="text-blue-200">/</span>
              <Link href="/doctors" className="hover:text-white transition-colors">
                Đội ngũ Bác sĩ
              </Link>
              <span className="text-blue-200">/</span>
              <span className="text-white font-semibold">Ghép nối thông minh</span>
            </nav>
          </div>
        </section>

        {/* 3. Main Content Container */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 relative z-20 space-y-8">

          {/* Card: Household Profile & Address Settings */}
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-6 sm:p-7">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#2E37A4]/10 text-[#2E37A4] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px]">home_health</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base sm:text-lg text-slate-900">Hộ: Nguyễn Văn Bình</span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-[#0046c0] border border-blue-200">
                      FAM-HN-902
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">4 thành viên • 1 người cao tuổi • 1 trẻ nhỏ (Dưới 12 tuổi)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/family"
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                  <span>Dashboard Gia Đình</span>
                </Link>
                <Link
                  href="/packages"
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#0046c0] bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                  <span>Bảng Giá Gói Khám</span>
                </Link>
              </div>
            </div>

            {/* Address Row */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2 text-xs sm:text-sm flex-1">
                <span className="material-symbols-outlined text-[#0046c0] text-[20px] shrink-0 mt-0.5 sm:mt-0">
                  location_on
                </span>
                <span className="text-slate-500 font-medium shrink-0">Địa chỉ gia đình (Tọa độ GPS):</span>
                {isEditingAddress ? (
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-[#0046c0] rounded-xl text-xs sm:text-sm font-semibold bg-blue-50/30 text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="font-bold text-slate-900">{address}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsEditingAddress(!isEditingAddress)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#0046c0] transition-colors self-start sm:self-auto cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isEditingAddress ? 'check' : 'edit'}
                </span>
                <span>{isEditingAddress ? 'Xác nhận Lưu' : 'Đổi Địa Chỉ'}</span>
              </button>
            </div>
          </div>

          {/* Card: Matching Parameters & Filters */}
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0046c0] text-[22px]">tune</span>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                  Tiêu Chí Sàng Lọc &amp; Ghép Nối Bác Sĩ
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Thuật toán tự động cập nhật thời gian thực</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Col 1: Priority Members */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  1. Đối tượng trọng tâm
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setTargetElderly(!targetElderly)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      targetElderly
                        ? 'bg-[#0046c0]/10 border-[#0046c0] text-[#0046c0]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">👨‍🦳</span>
                      <span>Người cao tuổi (Bệnh mạn tính)</span>
                    </span>
                    <span className="material-symbols-outlined text-[18px]">
                      {targetElderly ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetChild(!targetChild)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      targetChild
                        ? 'bg-[#0046c0]/10 border-[#0046c0] text-[#0046c0]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">👶</span>
                      <span>Trẻ nhỏ (Nhi khoa &amp; Tiêm chủng)</span>
                    </span>
                    <span className="material-symbols-outlined text-[18px]">
                      {targetChild ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetPregnant(!targetPregnant)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      targetPregnant
                        ? 'bg-[#0046c0]/10 border-[#0046c0] text-[#0046c0]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">🤰</span>
                      <span>Phụ nữ mang thai &amp; Sản khoa</span>
                    </span>
                    <span className="material-symbols-outlined text-[18px]">
                      {targetPregnant ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Col 2: Chronic Diseases */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    2. Bệnh nền theo dõi
                  </label>
                  {!isAddingChronic && (
                    <button
                      type="button"
                      onClick={() => setIsAddingChronic(true)}
                      className="text-[11px] font-bold text-[#0046c0] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      <span>Thêm bệnh</span>
                    </button>
                  )}
                </div>

                {isAddingChronic && (
                  <div className="flex items-center gap-1.5 p-2 bg-blue-50/60 rounded-xl border border-blue-200">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Gõ tên bệnh (VD: Hen suyễn, Gout...)"
                      value={newChronicInput}
                      onChange={(e) => setNewChronicInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewChronic();
                        }
                      }}
                      className="p-1.5 px-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0046c0]/20 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewChronic}
                      className="px-2.5 py-1.5 bg-[#0046c0] hover:bg-[#003899] text-white rounded-lg text-xs font-bold"
                    >
                      Thêm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingChronic(false);
                        setNewChronicInput('');
                      }}
                      className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Hủy
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedChronic.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#0046c0] rounded-xl text-xs font-bold border border-blue-200/80 shadow-2xs"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => removeChronic(c)}
                        className="w-4 h-4 rounded-full hover:bg-blue-200 flex items-center justify-center text-blue-700 cursor-pointer"
                        title="Xóa bệnh này"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedChronic.length === 0 && (
                    <div className="text-xs text-slate-400 italic py-2">
                      Chưa chọn bệnh nền nào (Khám tổng quát định kỳ)
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Bác sĩ có chuyên khoa tương ứng sẽ được cộng điểm tương thích (Match Score).
                </p>
              </div>

              {/* Col 3: Distance & Budget */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  3. Bán kính &amp; Dự toán
                </label>

                <div>
                  <span className="text-xs font-medium text-slate-600 block mb-1">
                    Bán kính tối đa (GPS Di chuyển):
                  </span>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0046c0]"
                  >
                    <option value="3.0 km">Trong vòng 3.0 km (Ưu tiên tiếp cận nhanh &lt; 15p)</option>
                    <option value="5.0 km">Trong vòng 5.0 km (Tiêu chuẩn mạng lưới đô thị)</option>
                    <option value="10.0 km">Trong vòng 10.0 km (Mở rộng liên quận)</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs font-medium text-slate-600 block mb-1">
                    Mức ngân sách gia đình:
                  </span>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0046c0]"
                  >
                    <option value="1.0 - 1.5 triệu / quý">1.0 - 1.5 triệu / quý (Gói Cơ Bản)</option>
                    <option value="1.5 - 2.5 triệu / quý">1.5 - 2.5 triệu / quý (Gói Toàn Diện)</option>
                    <option value="4.0 - 8.0 triệu / quý">4.0 - 8.0 triệu / quý (Gói VIP Cao Cấp)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Matched Results */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>Kết Quả Đề Xuất Phù Hợp Nhất</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0046c0] text-white">
                    {INITIAL_DOCTORS.length} Bác Sĩ Đạt Chuẩn
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đã xếp hạng theo khoảng cách địa lý, chuyên môn bệnh mạn tính và hạn mức chỉ tiêu (Panel Cap $\le 30$ hộ)
                </p>
              </div>

              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl self-start sm:self-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tất cả bác sĩ đều có CCHN Bộ Y Tế &amp; Ký quỹ SLA</span>
              </div>
            </div>

            {/* Doctor Cards */}
            <div className="space-y-4">
              {INITIAL_DOCTORS.map((doc, idx) => {
                const isTop1 = idx === 0;
                return (
                  <div
                    key={doc.id}
                    className={`rounded-2xl transition-all p-6 sm:p-7 relative border ${
                      isTop1
                        ? 'bg-gradient-to-r from-blue-50/50 via-white to-white border-[#0046c0] shadow-[0_8px_30px_rgb(0,70,192,0.12)] ring-1 ring-[#0046c0]/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-[0_4px_20px_rgb(0,0,0,0.04)]'
                    }`}
                  >
                    {/* Top 1 Badge */}
                    {isTop1 && (
                      <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-[#2E37A4] to-[#00D3C7] text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">military_tech</span>
                        <span>Đề xuất tối ưu nhất (Top 1)</span>
                      </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left: Avatar & Profile */}
                      <div className="flex items-start gap-4 sm:gap-5 flex-1">
                        <div className="relative shrink-0">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-md border-2 border-white ring-1 ring-slate-200 bg-slate-100 relative">
                            <Image
                              src={doc.avatarUrl}
                              alt={doc.name}
                              fill
                              sizes="(max-width: 640px) 80px, 96px"
                              className="object-cover"
                            />
                          </div>
                          <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 ring-2 ring-white" title="Sẵn sàng nhận hộ mới">
                            <span className="material-symbols-outlined text-[13px] block">check</span>
                          </span>
                        </div>

                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-[#0046c0] to-[#2E37A4] text-white shadow-2xs">
                              ★ {doc.matchScore}% PHÙ HỢP
                            </span>
                            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                              {doc.title} {doc.name}
                            </h3>
                            <span className="text-xs text-slate-500">
                              ({doc.experienceYears} năm kinh nghiệm • ★ {doc.rating} / {doc.reviewCount} đánh giá)
                            </span>
                          </div>

                          <div className="text-xs text-[#0046c0] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">stethoscope</span>
                            <span>{doc.specialty}</span>
                          </div>

                          <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">domain</span>
                            <span>{doc.hospital}</span>
                          </p>

                          {/* Distance & SLA */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                            <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                              <span className="material-symbols-outlined text-[16px] text-[#0046c0]">distance</span>
                              <span>
                                Khoảng cách: <strong className="text-slate-900">{doc.distance}</strong> (ETA: {doc.eta})
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                              <span className="material-symbols-outlined text-[16px] text-rose-600">timer</span>
                              <span>{doc.slaCommitment}</span>
                            </div>
                          </div>

                          {/* Quota & Tags */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">groups</span>
                              <span>{doc.capacity}</span>
                            </span>

                            {doc.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[11px]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedDoctorForContract({
                              name: `${doc.title} ${doc.name}`,
                              specialty: doc.specialty,
                            })
                          }
                          className="px-6 py-3.5 bg-gradient-to-r from-[#2E37A4] to-[#0046c0] hover:from-[#1e2575] hover:to-[#003796] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group"
                        >
                          <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">
                            assignment_turned_in
                          </span>
                          <span>Chọn Bác Sĩ &amp; Ký Hợp Đồng (SCR-15)</span>
                        </button>

                        <Link
                          href={`/doctors/${doc.id}`}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors text-center flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          <span>Xem Hồ Sơ Năng Lực &amp; CCHN</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info callout on Rule BR-04 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 space-y-1">
            <div className="font-bold text-[#0046c0] flex items-center gap-1.5 text-sm">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Quy tắc bảo đảm chất lượng y tế FamiDoc (Quy tắc BR-04 &amp; Chuẩn Bộ Y Tế):</span>
            </div>
            <p className="leading-relaxed">
              Mỗi Bác sĩ Gia đình được cố định hạn mức theo dõi tối đa từ <strong>20 đến 30 hộ gia đình</strong>. Khi bác sĩ đạt đủ chỉ tiêu (Full Panel), hệ thống sẽ tự động khóa tiếp nhận để đảm bảo bác sĩ có đủ quỹ thời gian thăm khám tại nhà định kỳ và phản hồi khẩn cấp 24/7 cho các gia đình đã ký kết.
            </p>
          </div>
        </div>
      </main>

      {/* 4. Standard Landing Footer */}
      <LandingFooter />

      {/* Success Notification Banner */}
      {contractSuccessToast && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl max-w-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">verified</span>
            <span className="text-xs font-bold leading-snug">
              {contractSuccessToast}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setContractSuccessToast(null)}
            className="text-white/80 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal: 4-Party Digital Contract Signing Wizard (SCR-15) */}
      {selectedDoctorForContract && (
        <ContractSigningWizard
          packageName="Gói Gia Đình Toàn Diện (Kỳ hạn 3 Tháng)"
          packagePrice="4.245.000 đ"
          doctorName={selectedDoctorForContract.name}
          onClose={() => setSelectedDoctorForContract(null)}
          onSuccess={() => {
            setContractSuccessToast(
              'Chúc mừng bạn đã ký kết hợp đồng Bác sĩ Gia đình thành công! Hệ thống đã kích hoạt hồ sơ quản lý sức khỏe gia đình.'
            );
            setSelectedDoctorForContract(null);
            setTimeout(() => setContractSuccessToast(null), 6000);
          }}
        />
      )}
    </div>
  );
}

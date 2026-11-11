'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { updateContractStep } from '@/lib/contract-workflow-storage';

export interface DoctorOption {
  id: string;
  name: string;
  title: string;
  specialty: string;
  facility: string;
  cchn: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  activePanelCount: number;
  maxPanelCapacity: number; // Max 30 per BR-04
  avatarBg: string;
  initials: string;
  slaMinutes: number;
}

export interface PackageOption {
  id: string;
  code: string;
  name: string;
  durationMonths: number;
  durationLabel: string;
  price: number;
  priceFormatted: string;
  popular?: boolean;
  tagline: string;
  homeVisits: number;
  telehealthLimit: string;
  labTests: number;
  maxMembers: number;
  highlightFeatures: string[];
}

export interface MemberItem {
  id: string;
  name: string;
  age: number;
  relation: string;
  chronic?: string;
  selected: boolean;
}

interface ContractSigningWizardProps {
  initialDoctorId?: string;
  initialPackageId?: string;
  doctorName?: string;
  packageName?: string;
  packagePrice?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const DOCTOR_OPTIONS: DoctorOption[] = [
  {
    id: 'DOC-7901',
    name: 'BS.CKII Trần Thanh Mai',
    title: 'Bác sĩ Gia đình & Nội Tim Mạch',
    specialty: 'Y học Gia đình, Kiểm soát Tăng huyết áp & ĐTĐ Lão khoa',
    facility: 'Bệnh viện Đại học Y Dược TP.HCM',
    cchn: '004128/HCM',
    experienceYears: 18,
    rating: 4.95,
    reviewCount: 142,
    activePanelCount: 18,
    maxPanelCapacity: 30,
    avatarBg: 'bg-blue-100 text-[#2563eb]',
    initials: 'TM',
    slaMinutes: 30,
  },
  {
    id: 'DOC-8114',
    name: 'BS.CKI Lê Hoàng Nam',
    title: 'Bác sĩ Gia đình & Nhi Khoa',
    specialty: 'Chăm sóc trẻ em, Dinh dưỡng & Miễn dịch học gia đình',
    facility: 'Bệnh viện Đại học Y Dược TP.HCM',
    cchn: '005619/HCM',
    experienceYears: 12,
    rating: 4.92,
    reviewCount: 98,
    activePanelCount: 24,
    maxPanelCapacity: 30,
    avatarBg: 'bg-emerald-100 text-emerald-700',
    initials: 'LN',
    slaMinutes: 35,
  },
  {
    id: 'DOC-8022',
    name: 'ThS.BS Nguyễn Hữu Nghĩa',
    title: 'Thạc sĩ Bác sĩ Nội Tổng Quát',
    specialty: 'Lão khoa, Bệnh mạn tính người cao tuổi & Phục hồi chức năng',
    facility: 'Vinmec Central Park',
    cchn: '003882/HCM',
    experienceYears: 15,
    rating: 4.88,
    reviewCount: 86,
    activePanelCount: 20,
    maxPanelCapacity: 30,
    avatarBg: 'bg-indigo-100 text-indigo-700',
    initials: 'HN',
    slaMinutes: 30,
  },
  {
    id: 'DOC-7720',
    name: 'BS.CKII Phạm Thu Hằng',
    title: 'Bác sĩ Gia đình & Nội Tiết',
    specialty: 'Y học Dự phòng, Tầm soát chuyển hóa & Dị ứng lâm sàng',
    facility: 'PKĐK Trustcare Hub Medical',
    cchn: '006241/HCM',
    experienceYears: 16,
    rating: 4.98,
    reviewCount: 156,
    activePanelCount: 27,
    maxPanelCapacity: 30,
    avatarBg: 'bg-teal-100 text-teal-700',
    initials: 'TH',
    slaMinutes: 25,
  },
];

export const PACKAGE_OPTIONS: PackageOption[] = [
  {
    id: 'pkg-basic',
    code: 'PKG-BASIC-01',
    name: 'Gói Trải Nghiệm Gia Đình',
    durationMonths: 1,
    durationLabel: '1 Tháng',
    price: 1000000,
    priceFormatted: '1.000.000 đ',
    tagline: 'Trải nghiệm dịch vụ Bác sĩ riêng tận nhà & Hồ sơ EHR gia đình',
    homeVisits: 1,
    telehealthLimit: 'Không giới hạn 24/7',
    labTests: 0,
    maxMembers: 3,
    highlightFeatures: [
      '01 lượt Bác sĩ thăm khám tận nhà',
      'Tư vấn Video Telehealth 24/7 không giới hạn',
      'Khởi tạo Hồ sơ sức khỏe điện tử EHR gia đình',
    ],
  },
  {
    id: 'pkg-dong-hanh',
    code: 'PKG-FAMILY-03',
    name: 'Gói Đồng Hành Gia Đình',
    durationMonths: 3,
    durationLabel: '3 Tháng',
    price: 2850000,
    priceFormatted: '2.850.000 đ',
    tagline: 'Chăm sóc sức khỏe liên tục trong quý giao mùa và dịch bệnh',
    homeVisits: 3,
    telehealthLimit: 'Không giới hạn 24/7',
    labTests: 1,
    maxMembers: 4,
    highlightFeatures: [
      '03 lượt Bác sĩ khám và cấp phát thuốc tại nhà',
      '01 đợt lấy mẫu xét nghiệm sinh hóa tại nhà',
      'Theo dõi chỉ số sinh hiệu và bệnh nền từ xa',
    ],
  },
  {
    id: 'pkg-elderly',
    code: 'PKG-ELDERLY-06',
    name: 'Gói An Tâm Người Cao Tuổi',
    durationMonths: 6,
    durationLabel: '6 Tháng',
    price: 6475000,
    priceFormatted: '6.475.000 đ',
    tagline: 'Chuyên biệt cho hộ có người cao tuổi cần quản lý bệnh tim mạch & ĐTĐ',
    homeVisits: 6,
    telehealthLimit: 'Không giới hạn 24/7',
    labTests: 2,
    maxMembers: 4,
    highlightFeatures: [
      '06 lượt thăm khám tận giường + máy đo ECG cầm tay',
      '02 đợt xét nghiệm chức năng gan thận & HbA1c',
      'Ưu tiên kết nối chuyển viện tuyến trên khẩn cấp',
    ],
  },
  {
    id: 'pkg-toan-dien',
    code: 'PKG-FAMILY-12',
    name: 'Gói Toàn Diện Gia Đình VIP',
    durationMonths: 12,
    durationLabel: '12 Tháng (Khuyên dùng)',
    price: 9600000,
    priceFormatted: '9.600.000 đ',
    popular: true,
    tagline: 'Bảo trợ y tế toàn diện cả năm cho hộ gia đình đa thế hệ',
    homeVisits: 12,
    telehealthLimit: 'Không giới hạn 24/7',
    labTests: 3,
    maxMembers: 6,
    highlightFeatures: [
      '12 lượt Bác sĩ thăm khám định kỳ tận nhà',
      '03 đợt tổng kiểm tra xét nghiệm máu & nước tiểu',
      'Đường dây nóng khẩn cấp với Bác sĩ riêng',
      'Bảo vệ tối đa 6 thành viên trong sổ hộ tịch',
    ],
  },
];

const DEFAULT_MEMBERS: MemberItem[] = [
  { id: 'm-1', name: 'Nguyễn Văn Phúc', age: 78, relation: 'Ông nội', chronic: 'Tăng HA G2, ĐTĐ T2', selected: true },
  { id: 'm-2', name: 'Nguyễn Văn An', age: 42, relation: 'Chủ hộ (Đại diện)', chronic: 'Khỏe mạnh / Gout nhẹ', selected: true },
  { id: 'm-3', name: 'Trần Thu Hà', age: 38, relation: 'Vợ', chronic: 'Dị ứng Penicillin', selected: true },
  { id: 'm-4', name: 'Bé Nguyễn Minh An', age: 6, relation: 'Con trai', chronic: 'Tiêm chủng đủ', selected: true },
];

export function ContractSigningWizard({
  initialDoctorId,
  initialPackageId,
  doctorName: propDoctorName,
  packageName: propPackageName,
  packagePrice: _propPackagePrice,
  onClose,
  onSuccess,
}: ContractSigningWizardProps) {
  // 1. Quản lý bước (Step 1: Chọn BS ➔ Step 2: Chọn Gói ➔ Step 3: Chọn Thành Viên ➔ Step 4: Ký & Thanh toán)
  const [step, setStep] = useState<number>(1);

  // 2. Bác sĩ được chọn
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption>(() => {
    if (initialDoctorId) {
      const found = DOCTOR_OPTIONS.find((d) => d.id === initialDoctorId);
      if (found) return found;
    }
    if (propDoctorName) {
      const found = DOCTOR_OPTIONS.find((d) => d.name.includes(propDoctorName) || propDoctorName.includes(d.name));
      if (found) return found;
    }
    return DOCTOR_OPTIONS[0];
  });

  // 3. Gói dịch vụ được chọn
  const [selectedPackage, setSelectedPackage] = useState<PackageOption>(() => {
    if (initialPackageId) {
      const found = PACKAGE_OPTIONS.find((p) => p.id === initialPackageId || p.code === initialPackageId);
      if (found) return found;
    }
    if (propPackageName) {
      const found = PACKAGE_OPTIONS.find((p) => p.name.includes(propPackageName) || propPackageName.includes(p.name));
      if (found) return found;
    }
    return PACKAGE_OPTIONS[3]; // Mặc định gói Toàn diện 12 tháng
  });

  // 4. Danh sách thành viên gia đình
  const [members, setMembers] = useState<MemberItem[]>(DEFAULT_MEMBERS);
  const selectedMembersCount = members.filter((m) => m.selected).length;

  // 5. Ký số & OTP
  const [otpCode, setOtpCode] = useState('0988');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSignedComplete, setIsSignedComplete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleMember = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const handleVerifyOtp = () => {
    if (otpCode.length >= 4) {
      setIsOtpVerified(true);
      setFormError(null);
    } else {
      setFormError('Vui lòng nhập mã OTP (ít nhất 4 ký tự) gửi tới số điện thoại đại diện hộ.');
    }
  };

  const handleExecuteSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpVerified) {
      setFormError('Vui lòng bấm nút Xác thực mã OTP trước khi ký số.');
      return;
    }
    if (!agreedTerms) {
      setFormError('Vui lòng tích chọn đồng ý với các điều khoản hợp đồng và chính sách y tế.');
      return;
    }

    setFormError(null);
    setIsSigning(true);
    setTimeout(() => {
      updateContractStep('PENDING_ADMIN_SIGN', {
        packageName: `${selectedPackage.name} (${selectedPackage.durationLabel})`,
        packagePrice: selectedPackage.price,
        packagePriceFormatted: selectedPackage.priceFormatted,
        durationMonths: selectedPackage.durationMonths,
        assignedDoctorId: selectedDoctor.id,
        assignedDoctorName: selectedDoctor.name,
        assignedDoctorTitle: selectedDoctor.title,
        facilityName: selectedDoctor.facility,
        familySigned: true,
        familySignedAt: new Date().toLocaleString('vi-VN'),
        familySignerName: 'Nguyễn Văn An (Đại diện Hộ)',
      });
      setIsSigning(false);
      setIsSignedComplete(true);
      if (onSuccess) onSuccess();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col text-slate-900 font-sans">
        {/* Wizard Header */}
        <div className="bg-gradient-to-r from-[#2E37A4] to-[#3d47c2] text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-blue-200 font-semibold tracking-wide uppercase">
              <span className="material-symbols-outlined text-[16px] text-[#00D3C7]">verified</span>
              <span>Hợp Đồng Y Tế Điện Tử 4 Bên • Chuẩn Bộ Y Tế</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mt-1 tracking-tight text-white">
              Quy Trình Chọn Bác Sĩ &amp; Đăng Ký Gói Chăm Sóc Sức Khỏe
            </h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Bác sĩ: <span className="font-semibold text-white">{selectedDoctor.name}</span> • Gói: <span className="font-semibold text-white">{selectedPackage.name}</span> • Mã hộ: <span className="font-bold tabular-nums text-white">#FAM-88219</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20">
              Ký số bảo mật
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
                title="Đóng cửa sổ"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 4-Step Progress Indicator (Doctor First -> Package -> Members -> Sign) */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-8 py-3.5">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { num: 1, label: 'Chọn Bác sĩ' },
              { num: 2, label: 'Chọn Gói DV' },
              { num: 3, label: 'Thành viên & Quyền lợi' },
              { num: 4, label: 'Ký số & Thanh toán' },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all cursor-pointer ${step === s.num
                    ? 'font-bold text-[#2563eb] bg-blue-50/80 border border-blue-200'
                    : step > s.num
                      ? 'font-semibold text-emerald-700'
                      : 'text-slate-400'
                  }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s.num
                      ? 'bg-[#2563eb] text-white'
                      : step > s.num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                >
                  {step > s.num ? '✓' : s.num}
                </span>
                <span className="truncate">Bước {s.num}: {s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Wizard Body Content */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: CHỌN BÁC SĨ GIA ĐÌNH (DOCTOR SELECTION) */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Bước 1: Chọn Bác Sĩ Gia Đình Quản Nhiệm Hộ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bác sĩ trực tiếp thăm khám tận nhà, tư vấn 24/7 và bảo trợ hồ sơ sức khỏe điện tử (EHR).
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563eb] border border-blue-200 self-start sm:self-auto shrink-0">
                  Đã chọn: {selectedDoctor.name}
                </span>
              </div>

              {/* Doctors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {DOCTOR_OPTIONS.map((doc) => {
                  const isSelected = selectedDoctor.id === doc.id;
                  const remainingQuota = doc.maxPanelCapacity - doc.activePanelCount;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${isSelected
                          ? 'border-[#2563eb] bg-blue-50/40 shadow-xs ring-2 ring-[#2563eb]/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl font-bold text-base flex items-center justify-center shrink-0 shadow-xs ${doc.avatarBg}`}
                        >
                          {doc.initials}
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-sm text-slate-900 truncate">
                              {doc.name}
                            </h4>
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                                ✓
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium">{doc.title}</p>
                          <p className="text-[11px] text-[#2563eb] font-semibold truncate">{doc.facility}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{doc.specialty}</p>
                        </div>
                      </div>

                      {/* Doctor Meta & Capacity */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <span className="text-amber-500 font-bold">★ {doc.rating}</span>
                          <span className="text-[11px] text-slate-400">({doc.reviewCount})</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-500 font-medium tabular-nums">{doc.experienceYears} năm KN</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Còn {remainingQuota}/30 hộ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Tiếp tục: Chọn Gói Dịch Vụ</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHỌN GÓI DỊCH VỤ CỦA BÁC SĨ (PACKAGE SELECTION) */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Bước 2: Chọn Gói Dịch Vụ Phù Hợp Với Gia Đình
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Các gói chăm sóc do <strong className="text-slate-700">{selectedDoctor.name}</strong> và <strong className="text-slate-700">{selectedDoctor.facility}</strong> trực tiếp phụ trách.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563eb] border border-blue-200 self-start sm:self-auto shrink-0">
                  <span>Bác sĩ: {selectedDoctor.name}</span>
                </div>
              </div>

              {/* Packages Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {PACKAGE_OPTIONS.map((pkg) => {
                  const isSelected = selectedPackage.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${isSelected
                          ? 'border-[#2563eb] bg-blue-50/40 shadow-xs ring-2 ring-[#2563eb]/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      {pkg.popular && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          Khuyên dùng
                        </span>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-slate-900">{pkg.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {pkg.durationLabel}
                          </span>
                        </div>
                        <div className="text-lg sm:text-xl font-bold tabular-nums text-[#2563eb]">
                          {pkg.priceFormatted}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{pkg.tagline}</p>
                      </div>

                      {/* Quotas & Features */}
                      <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="font-medium">Khám tại nhà:</span>
                          <span className="font-bold text-[#2563eb]">{pkg.homeVisits} lượt</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="font-medium">Telehealth:</span>
                          <span className="font-bold text-teal-700">{pkg.telehealthLimit}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="font-medium">Xét nghiệm tại nhà:</span>
                          <span className="font-bold text-slate-900">{pkg.labTests > 0 ? `${pkg.labTests} đợt` : 'Tùy chọn'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="font-medium">Thành viên áp dụng:</span>
                          <span className="font-bold text-slate-900">Tối đa {pkg.maxMembers} người</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${isSelected
                              ? 'bg-[#2563eb] text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        >
                          {isSelected ? 'Đã chọn gói này ✓' : 'Chọn gói này'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Quay lại đổi Bác sĩ
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Tiếp tục: Chọn Thành viên</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CHỌN THÀNH VIÊN THỤ HƯỞNG & QUYỀN LỢI */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Bước 3: Chọn Thành Viên Thụ Hưởng Gói (Tối đa {selectedPackage.maxMembers} người)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hồ sơ sức khỏe của từng thành viên sẽ được kết nối trực tiếp với <strong className="text-slate-700">{selectedDoctor.name}</strong>.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563eb] border border-blue-200 self-start sm:self-auto shrink-0">
                  Đã chọn: {selectedMembersCount} / {selectedPackage.maxMembers} người
                </span>
              </div>

              {/* Members Selection List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${m.selected
                        ? 'border-[#2563eb] bg-blue-50/40 shadow-xs ring-1 ring-[#2563eb]/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{m.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {m.age} tuổi
                        </span>
                      </div>
                      <div className="text-slate-500 font-medium">Quan hệ: {m.relation}</div>
                      {m.chronic && (
                        <div className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded inline-block">
                          {m.chronic}
                        </div>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={m.selected}
                      onChange={() => { }}
                      className="mt-1 w-4 h-4 text-[#2563eb] rounded cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* Benefits Recap Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-1">
                  <span className="font-bold text-blue-800 uppercase block">{selectedPackage.homeVisits} Lượt Khám Tại Nhà</span>
                  <p className="text-slate-600">Bác sĩ {selectedDoctor.name} mang trang thiết bị y tế đến tận giường bệnh.</p>
                </div>
                <div className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-2xl space-y-1">
                  <span className="font-bold text-teal-800 uppercase block">Tư Vấn Telehealth 24/7</span>
                  <p className="text-slate-600">Kết nối Video Call bảo mật P2P với Bác sĩ riêng bất kỳ lúc nào.</p>
                </div>
                <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-1">
                  <span className="font-bold text-amber-800 uppercase block">Hồ Sơ Y Tế EHR Trọn Đời</span>
                  <p className="text-slate-600">Lưu trữ bảo mật theo chuẩn Bộ Y Tế và Nghị định 13/2023/NĐ-CP.</p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Quay lại chọn Gói
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={selectedMembersCount === 0}
                  className="px-6 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>Chuyển sang Ký số &amp; Thanh toán</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: KÝ HỢP ĐỒNG ĐIỆN TỬ 4 BÊN & THANH TOÁN VIETQR */}
          {step === 4 && !isSignedComplete && (
            <form onSubmit={handleExecuteSign} className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">
                  Bước 4: Ký Số Điện Tử (E-Signature) &amp; Xác Thực OTP Hợp Đồng 4 Bên
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xác nhận ràng buộc pháp lý giữa Đại diện gia đình, Bác sĩ quản nhiệm, Cơ sở y tế và Nền tảng FamiDoc.
                </p>
              </div>

              {/* Legal Contract Preview Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 max-h-48 overflow-y-auto">
                <div className="font-bold text-slate-900 text-center uppercase">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — ĐỘC LẬP TỰ DO HẠNH PHÚC
                </div>
                <div className="font-bold text-center text-[#2563eb]">
                  HỢP ĐỒNG ĐIỆN TỬ DỊCH VỤ BÁC SĨ GIA ĐÌNH BẢO CHỨNG 4 BÊN #FMD-2026-REGR821
                </div>
                <p>
                  <strong>Bên A (Gia đình):</strong> Nguyễn Văn An (Chủ hộ) • Bảo trợ {selectedMembersCount} thành viên đã chọn.
                </p>
                <p>
                  <strong>Bên B (Bác sĩ chuyên môn):</strong> {selectedDoctor.name} ({selectedDoctor.title} - CCHN: {selectedDoctor.cchn}).
                </p>
                <p>
                  <strong>Bên C (Cơ sở y tế bảo trợ):</strong> {selectedDoctor.facility}.
                </p>
                <p>
                  <strong>Bên D (Vận hành nền tảng):</strong> FamiDoc Healthcare Corporation (Hạ tầng công nghệ &amp; Escrow).
                </p>
                <p>
                  <strong>Gói dịch vụ đăng ký:</strong> {selectedPackage.name} ({selectedPackage.durationLabel}) — Phí trọn gói: <span className="font-bold text-[#2563eb]">{selectedPackage.priceFormatted}</span>.
                </p>
                <p className="text-slate-500 italic">
                  Các bên cam kết tuân thủ Luật Khám bệnh, chữa bệnh 2023, Luật Giao dịch điện tử 2023 và quy chuẩn bảo mật hồ sơ sức khỏe y tế ISO 27799.
                </p>
              </div>

              {/* OTP & Signature Area */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
                <span className="font-bold text-xs text-slate-800 uppercase block">
                  Khu vực Ký điện tử (E-Signature &amp; Smart OTP)
                </span>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-slate-900">Người ký: NGUYỄN VĂN AN (Đại diện chủ hộ)</div>
                    <div className="text-[11px] text-slate-400">Khóa ký số điện tử SHA-256 / Viettel-CA OTP Token</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Mã OTP"
                      className="w-24 px-2 py-1 text-center font-bold tabular-nums border rounded-lg bg-slate-50 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${isOtpVerified
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]'
                        }`}
                    >
                      {isOtpVerified ? 'Đã xác thực OTP ✓' : 'Xác thực'}
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => {
                      setAgreedTerms(e.target.checked);
                      if (formError) setFormError(null);
                    }}
                    className="mt-0.5 rounded text-[#2563eb] cursor-pointer"
                  />
                  <span>
                    Tôi xác nhận là đại diện hợp pháp của các thành viên trên, đồng ý chọn Bác sĩ <strong>{selectedDoctor.name}</strong> phụ trách và đăng ký <strong>{selectedPackage.name}</strong> bằng phương thức ký điện tử có giá trị pháp lý tương đương văn bản.
                  </span>
                </label>
              </div>

              {formError && (
                <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] shrink-0 text-red-500">error</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Pricing & Submit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Tổng thanh toán ({selectedPackage.name}):
                  </span>
                  <div className="text-xl sm:text-2xl font-bold tabular-nums text-[#2563eb]">
                    {selectedPackage.priceFormatted}
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isSigning || !isOtpVerified || !agreedTerms}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSigning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang đóng dấu ký số TSA...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">edit_document</span>
                        <span>Ký Hợp Đồng &amp; Mở Cổng VietQR</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* SIGNED COMPLETE & VIETQR PAYMENT STATE */}
          {isSignedComplete && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-bold">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  Ký Hợp Đồng Điện Tử 4 Bên Thành Công!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Bác sĩ <strong>{selectedDoctor.name}</strong> ({selectedDoctor.facility}) đã được gán phụ trách hộ gia đình. Vui lòng hoàn tất chuyển khoản VietQR trong vòng 15 phút (CFG-05) để kích hoạt toàn bộ quyền lợi.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto space-y-2.5">
                <div className="text-xs text-slate-500">Mã hóa đơn: <strong>INV-FMD-REGR821</strong></div>
                <div className="text-lg font-bold tabular-nums text-[#2563eb]">{packagePrice}</div>
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    href="/family/subscription/tracking"
                    className="block w-full py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    Theo dõi tiến độ ký kết 4 bên
                  </Link>
                  <Link
                    href="/family/billing"
                    className="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Mở Mã VietQR Thanh Toán Ngay
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

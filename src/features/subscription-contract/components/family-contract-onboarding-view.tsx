'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateContractStep } from '@/lib/contract-workflow-storage';

export interface DoctorCandidate {
  id: string;
  name: string;
  title: string;
  specialty: string;
  specialtyKey: 'general' | 'pediatric' | 'geriatric' | 'cardio' | 'internal';
  hospital: string;
  cchnNumber: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  consultationCount: number;
  activePanelCount: number;
  maxPanelCapacity: number; // Max 30 per BR-04
  avatarUrl: string;
  slaMinutes: number;
  bio: string;
}

export interface CarePackage {
  id: string;
  code: string;
  name: string;
  durationLabel: string;
  durationMonths: number;
  price: number;
  priceFormatted: string;
  popular?: boolean;
  tagline: string;
  homeVisits: number;
  telehealthLimit: string;
  labTests: number;
  maxMembers: number;
  features: string[];
}

export interface FamilyMemberRecord {
  id: string;
  name: string;
  relation: string;
  age: number;
  chronic?: string;
  allergies?: string;
  selected: boolean;
}

export const DOCTORS_CATALOG: DoctorCandidate[] = [
  {
    id: 'doc-01',
    name: 'Nguyễn Văn Hoài',
    title: 'PGS. TS. Bác sĩ',
    specialty: 'Bác sĩ Gia đình & Nội Tổng Quát',
    specialtyKey: 'general',
    hospital: 'Bệnh viện Đại học Y Dược TP.HCM',
    cchnNumber: 'CCHN-001892/BYT-CCHN',
    experienceYears: 24,
    rating: 4.96,
    reviewCount: 384,
    consultationCount: 2400,
    activePanelCount: 18,
    maxPanelCapacity: 30,
    avatarUrl: '/images/medsev/home-one/doctor/1.jpg',
    slaMinutes: 30,
    bio: 'Nguyên Phó Trưởng khoa Khám bệnh - Bệnh viện Đại học Y Dược TP.HCM. Hơn 24 năm kinh nghiệm thực hành Y học gia đình tại Pháp và Việt Nam.',
  },
  {
    id: 'doc-02',
    name: 'Trần Thị Thu Trang',
    title: 'ThS. BS. CKII',
    specialty: 'Nhi Khoa & Dinh Dưỡng Trẻ Em',
    specialtyKey: 'pediatric',
    hospital: 'Bệnh viện Nhi Đồng 1',
    cchnNumber: 'CCHN-004521/BYT-CCHN',
    experienceYears: 16,
    rating: 4.98,
    reviewCount: 512,
    consultationCount: 3150,
    activePanelCount: 22,
    maxPanelCapacity: 30,
    avatarUrl: '/images/medsev/home-one/doctor/2.jpg',
    slaMinutes: 35,
    bio: 'Chuyên gia Nhi khoa tận tâm, đồng hành cùng hơn 3.100 trẻ sơ sinh và trẻ nhỏ. Chuyên sâu về bệnh hô hấp, dinh dưỡng và tiêm chủng gia đình.',
  },
  {
    id: 'doc-03',
    name: 'Lê Hoàng Nam',
    title: 'BS. CKII',
    specialty: 'Tim Mạch, Lão Khoa & Đa Bệnh Lý',
    specialtyKey: 'geriatric',
    hospital: 'Bệnh viện Bạch Mai & BV ĐHYD',
    cchnNumber: 'CCHN-002341/BYT-CCHN',
    experienceYears: 19,
    rating: 4.92,
    reviewCount: 290,
    consultationCount: 1820,
    activePanelCount: 24,
    maxPanelCapacity: 30,
    avatarUrl: '/images/medsev/home-one/doctor/3.jpg',
    slaMinutes: 25,
    bio: 'Chuyên gia Tim mạch & Lão khoa. Hơn 19 năm đồng hành cùng người cao tuổi kiểm soát bệnh mạch vành, tăng huyết áp kháng trị và đái tháo đường.',
  },
  {
    id: 'doc-04',
    name: 'Phạm Minh Đức',
    title: 'TS. Bác sĩ',
    specialty: 'Nội Tiết & Bệnh Chuyển Hóa',
    specialtyKey: 'internal',
    hospital: 'Bệnh viện Chợ Rẫy TP.HCM',
    cchnNumber: 'CCHN-006129/BYT-CCHN',
    experienceYears: 15,
    rating: 4.89,
    reviewCount: 215,
    consultationCount: 1420,
    activePanelCount: 19,
    maxPanelCapacity: 30,
    avatarUrl: '/images/medsev/home-one/doctor/4.jpg',
    slaMinutes: 30,
    bio: 'Tiến sĩ Y khoa Đại học Kobe (Nhật Bản). Chuyên sâu kiểm soát biến chứng tiểu đường, rối loạn mỡ máu và hội chứng chuyển hóa gia đình.',
  },
  {
    id: 'doc-05',
    name: 'Võ Thị Phương Thảo',
    title: 'ThS. Bác sĩ',
    specialty: 'Sản Phụ Khoa & Chăm Sóc Mẹ & Bé',
    specialtyKey: 'general',
    hospital: 'Bệnh viện Từ Dũ',
    cchnNumber: 'CCHN-005118/BYT-CCHN',
    experienceYears: 12,
    rating: 4.95,
    reviewCount: 420,
    consultationCount: 2200,
    activePanelCount: 26,
    maxPanelCapacity: 30,
    avatarUrl: '/images/medsev/home-one/doctor/5.jpg',
    slaMinutes: 30,
    bio: 'Thạc sĩ Bác sĩ Sản phụ khoa uy tín tại BV Từ Dũ. Đã hỗ trợ hơn 2.200 mẹ bầu trải qua thai kỳ an toàn và phục hồi hậu sản tại tư gia.',
  },
  {
    id: 'doc-06',
    name: 'Đặng Quốc Huy',
    title: 'BS. CKI',
    specialty: 'Y Học Gia Đình & Phục Hồi Chức Năng',
    specialtyKey: 'general',
    hospital: 'Bệnh viện Đa Khoa Quốc Tế Vinmec',
    cchnNumber: 'CCHN-008273/BYT-CCHN',
    experienceYears: 14,
    rating: 4.91,
    reviewCount: 180,
    consultationCount: 1350,
    activePanelCount: 21,
    maxPanelCapacity: 30,
    avatarUrl: '/images/medsev/home-one/doctor/6.jpg',
    slaMinutes: 35,
    bio: 'Bác sĩ chuyên khoa Y học gia đình và Vật lý trị liệu. Chuyên thăm khám tận nơi cho người già suy giảm vận động và sau tai biến.',
  },
];

export const CARE_PACKAGES: CarePackage[] = [
  {
    id: 'pkg-basic',
    code: 'PKG-BASIC-01',
    name: 'Gói Trải Nghiệm Gia Đình',
    durationLabel: '1 Tháng',
    durationMonths: 1,
    price: 1000000,
    priceFormatted: '1.000.000 đ',
    tagline: 'Trải nghiệm Bác sĩ riêng tận nhà & Hồ sơ sức khỏe điện tử EHR gia đình',
    homeVisits: 1,
    telehealthLimit: 'Không giới hạn 24/7',
    labTests: 0,
    maxMembers: 3,
    features: [
      '01 lượt Bác sĩ thăm khám lâm sàng tận nhà',
      'Tư vấn Video Telehealth 24/7 không giới hạn lượt',
      'Khởi tạo Hồ sơ sức khỏe điện tử EHR cho 3 người',
      'Đường dây nóng cấp cứu y tế gia đình',
    ],
  },
  {
    id: 'pkg-dong-hanh',
    code: 'PKG-FAMILY-03',
    name: 'Gói Đồng Hành Gia Đình',
    durationLabel: '3 Tháng',
    durationMonths: 3,
    price: 2850000,
    priceFormatted: '2.850.000 đ',
    tagline: 'Chăm sóc sức khỏe liên tục trong quý giao mùa và phòng dịch bệnh',
    homeVisits: 3,
    telehealthLimit: 'Không giới hạn 24/7',
    labTests: 1,
    maxMembers: 4,
    features: [
      '03 lượt Bác sĩ khám và cấp phát thuốc tại nhà',
      '01 đợt lấy mẫu xét nghiệm sinh hóa máu tận giường',
      'Bác sĩ gia đình theo dõi huyết áp & đường huyết định kỳ',
      'Bảo trợ sức khỏe tối đa 4 thành viên',
    ],
  },
  {
    id: 'pkg-elderly',
    code: 'PKG-ELDERLY-06',
    name: 'Gói An Tâm Người Cao Tuổi',
    durationLabel: '6 Tháng',
    durationMonths: 6,
    price: 6475000,
    priceFormatted: '6.475.000 đ',
    tagline: 'Chuyên sâu cho hộ có người già cần quản lý bệnh tim mạch & ĐTĐ',
    homeVisits: 6,
    telehealthLimit: 'Không giới hạn 24/7',
    labTests: 2,
    maxMembers: 4,
    features: [
      '06 lượt thăm khám tận giường + máy đo ECG cầm tay',
      '02 đợt xét nghiệm chức năng gan thận & chỉ số HbA1c',
      'Ưu tiên đón tiếp và hỗ trợ chuyển viện tuyến trên',
      'Theo dõi chỉ số sinh hiệu IoT từ xa liên tục',
    ],
  },
  {
    id: 'pkg-toan-dien',
    code: 'PKG-FAMILY-12',
    name: 'Gói Toàn Diện Gia Đình VIP',
    durationLabel: '12 Tháng (Khuyên dùng)',
    durationMonths: 12,
    price: 9600000,
    priceFormatted: '9.600.000 đ',
    popular: true,
    tagline: 'Bảo trợ y tế toàn diện cả năm cho hộ gia đình đa thế hệ',
    homeVisits: 12,
    telehealthLimit: 'Không giới hạn 24/7',
    labTests: 3,
    maxMembers: 6,
    features: [
      '12 lượt Bác sĩ thăm khám định kỳ tận nhà',
      '03 đợt tổng kiểm tra xét nghiệm máu & nước tiểu',
      'Đường dây nóng khẩn cấp kết nối Bác sĩ riêng 24/7',
      'Bảo vệ trọn gói tối đa 6 thành viên trong sổ hộ tịch',
      'Bảo lãnh viện phí và đặc quyền phòng VIP tại BV đối tác',
    ],
  },
];

const INITIAL_MEMBERS: FamilyMemberRecord[] = [
  { id: 'MEM-01', name: 'Nguyễn Văn Phúc', relation: 'Ông nội', age: 78, chronic: 'Tăng huyết áp Độ 2, ĐTĐ Type 2', selected: true },
  { id: 'MEM-02', name: 'Nguyễn Văn An', relation: 'Chủ hộ (Đại diện)', age: 42, chronic: 'Gout nhẹ ngắt quãng', selected: true },
  { id: 'MEM-03', name: 'Trần Thu Hà', relation: 'Vợ', age: 38, allergies: 'Dị ứng Penicillin & Amoxicillin', selected: true },
  { id: 'MEM-04', name: 'Bé Nguyễn Minh An', relation: 'Con trai', age: 6, chronic: 'Khỏe mạnh, tiêm chủng đầy đủ', selected: true },
];

export function FamilyContractOnboardingView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Nhận doctorId & packageId từ URL nếu đi từ trang Public sang
  const paramDoctorId = searchParams?.get('doctorId');
  const paramPackageId = searchParams?.get('packageId');

  // Bước hiện tại: 1. Chọn Bác sĩ ➔ 2. Chọn Gói ➔ 3. Thành viên ➔ 4. Ký số & Theo dõi ➔ 5. Thanh toán
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (paramDoctorId && paramPackageId) return 3; // Đã chọn cả BS và Gói từ ngoài thì vào thẳng bước Thành viên
    if (paramDoctorId) return 2; // Đã chọn BS thì vào bước chọn Gói
    return 1; // Chưa chọn gì thì bắt đầu từ chọn Bác sĩ
  });

  // 1. Bác sĩ được chọn
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorCandidate>(() => {
    if (paramDoctorId) {
      const found = DOCTORS_CATALOG.find((d) => d.id === paramDoctorId);
      if (found) return found;
    }
    return DOCTORS_CATALOG[0];
  });

  // 2. Gói dịch vụ được chọn
  const [selectedPackage, setSelectedPackage] = useState<CarePackage>(() => {
    if (paramPackageId) {
      const found = CARE_PACKAGES.find((p) => p.id === paramPackageId || p.code === paramPackageId);
      if (found) return found;
    }
    return CARE_PACKAGES[3]; // Mặc định gói VIP 12 tháng
  });

  // 3. Danh sách thành viên gia đình
  const [members, setMembers] = useState<FamilyMemberRecord[]>(INITIAL_MEMBERS);
  const selectedMembersCount = members.filter((m) => m.selected).length;

  // Lọc Bác sĩ
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [searchDoctorText, setSearchDoctorText] = useState<string>('');

  // 4. Ký số OTP & Tiến trình 4 bên
  const [otpCode, setOtpCode] = useState('0988');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [agreedLegalTerms, setAgreedLegalTerms] = useState(false);
  const [isSigningFamily, setIsSigningFamily] = useState(false);

  // Tiến trình 4 bên (Live Approval Tracker)
  const [familySigned, setFamilySigned] = useState(false);
  const [adminSigned, setAdminSigned] = useState(false);
  const [facilitySigned, setFacilitySigned] = useState(false);
  const [doctorSigned, setDoctorSigned] = useState(false);
  const [isAutoApproving, setIsAutoApproving] = useState(false);

  // 5. Thanh toán
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);

  const filteredDoctors = useMemo(() => {
    return DOCTORS_CATALOG.filter((doc) => {
      const matchesSpecialty = specialtyFilter === 'all' || doc.specialtyKey === specialtyFilter;
      const matchesSearch =
        doc.name.toLowerCase().includes(searchDoctorText.toLowerCase()) ||
        doc.hospital.toLowerCase().includes(searchDoctorText.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchDoctorText.toLowerCase());
      return matchesSpecialty && matchesSearch;
    });
  }, [specialtyFilter, searchDoctorText]);

  const toggleMember = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const handleVerifyOtp = () => {
    if (otpCode.length >= 4) {
      setIsOtpVerified(true);
    }
  };

  const handleFamilyExecuteSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpVerified || !agreedLegalTerms) return;

    setIsSigningFamily(true);
    setTimeout(() => {
      setFamilySigned(true);
      setIsSigningFamily(false);

      // Cập nhật trạng thái hợp đồng vào kho lưu trữ dùng chung
      updateContractStep('PENDING_ADMIN_SIGN', {
        packageName: `${selectedPackage.name} (${selectedPackage.durationLabel})`,
        packagePrice: selectedPackage.price,
        packagePriceFormatted: selectedPackage.priceFormatted,
        durationMonths: selectedPackage.durationMonths,
        assignedDoctorId: selectedDoctor.id,
        assignedDoctorName: selectedDoctor.name,
        assignedDoctorTitle: selectedDoctor.title,
        facilityName: selectedDoctor.hospital,
        familySigned: true,
        familySignedAt: new Date().toLocaleString('vi-VN'),
        familySignerName: 'Nguyễn Văn An (Đại diện Hộ)',
      });

      // Tự động mô phỏng phê duyệt liên thông 4 bên sau vài giây (cho trải nghiệm mượt mà)
      triggerAutoApprovalSequence();
    }, 1200);
  };

  const triggerAutoApprovalSequence = () => {
    setIsAutoApproving(true);

    // Sau 2s: Admin ký số
    setTimeout(() => {
      setAdminSigned(true);
      updateContractStep('PENDING_FACILITY_SIGN', {
        adminSigned: true,
        adminSignedAt: new Date().toLocaleString('vi-VN'),
        adminSignerName: 'FamiDoc Platform SmartCA',
      });
    }, 2000);

    // Sau 4s: Cơ sở y tế ký số & gán BS
    setTimeout(() => {
      setFacilitySigned(true);
      updateContractStep('PENDING_DOCTOR_SIGN', {
        facilitySigned: true,
        facilitySignedAt: new Date().toLocaleString('vi-VN'),
        facilitySignerName: `Ban Giám Đốc ${selectedDoctor.hospital}`,
      });
    }, 4000);

    // Sau 6s: Bác sĩ chuyên môn ký cam kết SLA
    setTimeout(() => {
      setDoctorSigned(true);
      setIsAutoApproving(false);
      updateContractStep('PENDING_PAYMENT', {
        doctorSigned: true,
        doctorSignedAt: new Date().toLocaleString('vi-VN'),
        doctorSignerName: selectedDoctor.name,
        doctorCchn: selectedDoctor.cchnNumber,
      });
    }, 6000);
  };

  const handleCompletePayment = () => {
    updateContractStep('ACTIVE', {
      paymentPaid: true,
      paymentPaidAt: new Date().toLocaleString('vi-VN'),
    });
    setIsPaymentComplete(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased pb-20">
      {/* Top Navigation Bar with Step Breadcrumb */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/family"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
              title="Quay về Dashboard"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Đăng Ký Bác Sĩ Gia Đình &amp; Hợp Đồng Y Tế 4 Bên</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2E37A4] border border-blue-200 hidden sm:inline-block">
                  Chuẩn Bộ Y Tế 2026
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Hộ gia đình: <strong>#FAM-88219 (Nguyễn Văn An)</strong> · 124 Nguyễn Tri Phương, Q.5, TP.HCM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden md:inline">Cần hỗ trợ?</span>
            <a
              href="tel:19006868"
              className="inline-flex items-center gap-1 font-bold text-[#2E37A4] hover:underline"
            >
              <span className="material-symbols-outlined text-sm text-rose-500">call</span>
              <span>1900 6868</span>
            </a>
          </div>
        </div>

        {/* 5-Step Visual Stepper Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-8 py-3">
          <div className="max-w-5xl mx-auto grid grid-cols-5 gap-1.5 sm:gap-3 text-center text-xs">
            {[
              { num: 1, label: '1. Chọn Bác sĩ' },
              { num: 2, label: '2. Chọn Gói DV' },
              { num: 3, label: '3. Thành viên' },
              { num: 4, label: '4. Ký số 4 Bên' },
              { num: 5, label: '5. Kích hoạt' },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num <= currentStep || (familySigned && s.num === 5)) {
                    setCurrentStep(s.num);
                  }
                }}
                disabled={s.num > currentStep && !familySigned}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-1 px-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed ${
                  currentStep === s.num
                    ? 'font-bold text-[#2E37A4] bg-blue-100/70 border border-blue-200 shadow-2xs'
                    : currentStep > s.num
                    ? 'font-semibold text-emerald-700 bg-emerald-50/60'
                    : 'text-slate-400 opacity-60'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    currentStep === s.num
                      ? 'bg-[#2E37A4] text-white'
                      : currentStep > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {currentStep > s.num ? '✓' : s.num}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area (Spacious & Clean Layout) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* ========================================================================= */}
        {/* BƯỚC 1: CHỌN BÁC SĨ GIA ĐÌNH (DOCTOR DIRECTORY WITH REAL PHOTOS)           */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* Header section with search and filter */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#2E37A4] bg-blue-50 border border-blue-200/80 mb-2">
                    <span className="material-symbols-outlined text-[15px]">medical_services</span>
                    <span>Mạng lưới Bác sĩ Gia đình Tuyến Đầu</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Bước 1: Chọn Bác Sĩ Gia Đình Quản Nhiệm Hộ
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Bác sĩ sẽ trực tiếp đến khám tận nhà theo định kỳ, tư vấn Video Telehealth 24/7 và ký cam kết bảo trợ hồ sơ sức khỏe y tế trọn đời cho các thành viên.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                    <input
                      type="text"
                      placeholder="Tìm theo tên, bệnh viện..."
                      value={searchDoctorText}
                      onChange={(e) => setSearchDoctorText(e.target.value)}
                      className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#2E37A4] w-full sm:w-60"
                    />
                  </div>

                  <select
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-[#2E37A4]"
                  >
                    <option value="all">Tất cả chuyên khoa</option>
                    <option value="general">Nội Tổng Quát &amp; Gia Đình</option>
                    <option value="pediatric">Nhi Khoa &amp; Trẻ Em</option>
                    <option value="geriatric">Lão Khoa &amp; Tim Mạch</option>
                    <option value="internal">Nội Tiết &amp; Tiểu Đường</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Doctors Grid (Real High-Quality Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doc) => {
                const isSelected = selectedDoctor.id === doc.id;
                const remainingQuota = doc.maxPanelCapacity - doc.activePanelCount;

                return (
                  <article
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer relative ${
                      isSelected
                        ? 'border-[#2E37A4] ring-2 ring-[#2E37A4]/25 shadow-lg shadow-blue-900/10 -translate-y-1'
                        : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-[#2E37A4] text-white text-xs font-bold shadow-md flex items-center gap-1">
                        <span>Đã chọn</span>
                        <span className="material-symbols-outlined text-[15px]">check</span>
                      </div>
                    )}

                    <div>
                      {/* Doctor Photo & Hospital Banner */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                        <img
                          src={doc.avatarUrl}
                          alt={doc.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/95 text-slate-900 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
                            <span className="material-symbols-outlined text-[15px] text-[#2E37A4]">local_hospital</span>
                            <span className="truncate">{doc.hospital}</span>
                          </span>
                        </div>
                      </div>

                      {/* Doctor Details */}
                      <div className="p-5 space-y-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#2E37A4]">
                            {doc.title}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#2E37A4] transition-colors">
                            {doc.name}
                          </h3>
                          <p className="text-xs font-medium text-slate-600 line-clamp-1">
                            {doc.specialty}
                          </p>
                        </div>

                        {/* CCHN and Bio */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Chứng chỉ hành nghề:</span>
                            <strong className="text-slate-800 tabular-nums">{doc.cchnNumber}</strong>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {doc.bio}
                          </p>
                        </div>

                        {/* Rating & Capacity Bar */}
                        <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 font-bold text-slate-800">
                              <span className="material-symbols-outlined text-sm text-amber-500 material-symbols-filled">star</span>
                              <span>{doc.rating}</span>
                              <span className="font-normal text-slate-400">({doc.reviewCount})</span>
                              <span className="text-slate-300">•</span>
                              <span className="font-medium text-slate-600 tabular-nums">{doc.experienceYears} năm KN</span>
                            </span>
                            <span className="text-slate-500 font-medium">SLA: &lt; {doc.slaMinutes}p</span>
                          </div>

                          {/* Capacity status (BR-04) */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">Hạn mức hộ quản nhiệm:</span>
                              <span className="font-bold tabular-nums text-emerald-700">
                                Còn {remainingQuota} / {doc.maxPanelCapacity} slot
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-600"
                                style={{ width: `${Math.round((doc.activePanelCount / doc.maxPanelCapacity) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Select Action */}
                    <div className="p-4 pt-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoctor(doc);
                          setCurrentStep(2);
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#2E37A4] text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{isSelected ? 'Đã Chọn Bác Sĩ Này ✓' : 'Chọn Bác Sĩ & Xem Gói'}</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Bottom Floating Nav */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="text-xs text-slate-600 text-center sm:text-left">
                Bác sĩ đang chọn: <strong className="text-slate-900 font-semibold">{selectedDoctor.name}</strong> ({selectedDoctor.title}) · {selectedDoctor.hospital}
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Tiếp tục: Chọn Gói Dịch Vụ</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BƯỚC 2: CHỌN GÓI DỊCH VỤ CỦA BÁC SĨ (CARE PACKAGES COMPARISON)            */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            {/* Header section with chosen doctor banner */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 mb-2">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    <span>Bác sĩ phụ trách: {selectedDoctor.name} ({selectedDoctor.hospital})</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Bước 2: Chọn Gói Chăm Sóc Sức Khỏe Gia Đình
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Tất cả các gói dưới đây đều được Bác sĩ <strong>{selectedDoctor.name}</strong> và Cơ sở y tế <strong>{selectedDoctor.hospital}</strong> trực tiếp phụ trách thăm khám và theo dõi hồ sơ y bạ liên tục.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold self-start md:self-center transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span>Đổi Bác sĩ khác</span>
                </button>
              </div>
            </div>

            {/* 4 Packages Comparison Cards (Full-Width High-End Design) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {CARE_PACKAGES.map((pkg) => {
                const isSelected = selectedPackage.id === pkg.id;

                return (
                  <article
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`bg-white rounded-3xl border transition-all duration-300 p-6 flex flex-col justify-between gap-5 relative cursor-pointer ${
                      isSelected
                        ? 'border-[#2E37A4] ring-2 ring-[#2E37A4]/25 shadow-xl shadow-blue-900/10 -translate-y-1.5'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs uppercase tracking-wide">
                        Khuyên dùng nhiều nhất
                      </span>
                    )}

                    <div className="space-y-4">
                      {/* Package Name & Price */}
                      <div className="space-y-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {pkg.durationLabel}
                        </span>
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                          {pkg.name}
                        </h3>
                        <div className="pt-1">
                          <span className="text-2xl font-bold tabular-nums text-[#2E37A4]">
                            {pkg.priceFormatted}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                          {pkg.tagline}
                        </p>
                      </div>

                      {/* Quota Highlights Table */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-500">Khám tận nhà:</span>
                          <strong className="text-[#2E37A4]">{pkg.homeVisits} lượt</strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-500">Telehealth:</span>
                          <strong className="text-teal-700">{pkg.telehealthLimit}</strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-500">Xét nghiệm tại nhà:</span>
                          <strong className="text-slate-800">{pkg.labTests > 0 ? `${pkg.labTests} đợt` : 'Tùy chọn'}</strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-500">Thành viên:</span>
                          <strong className="text-slate-800">Tối đa {pkg.maxMembers} người</strong>
                        </div>
                      </div>

                      {/* Features Bullet List */}
                      <ul className="space-y-2 text-xs text-slate-600">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-[#2E37A4] text-sm shrink-0 mt-0.5">check_circle</span>
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Select Button */}
                    <button
                      type="button"
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2E37A4] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? 'Đã Chọn Gói Này ✓' : 'Chọn Gói Này'}
                    </button>
                  </article>
                );
              })}
            </div>

            {/* Bottom Stepper Nav */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Quay lại: Chọn Bác sĩ
              </button>

              <div className="text-xs text-slate-600 text-center">
                Đang chọn: <strong className="text-slate-900 font-semibold">{selectedPackage.name}</strong> ({selectedPackage.priceFormatted})
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Tiếp tục: Chọn Thành Viên Thụ Hưởng</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BƯỚC 3: CHỌN THÀNH VIÊN THỤ HƯỞNG & HỒ SƠ Y TẾ BAN ĐẦU                    */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#2E37A4] bg-blue-50 border border-blue-200 mb-2">
                    <span className="material-symbols-outlined text-[15px]">family_restroom</span>
                    <span>Hạn mức gói: Tối đa {selectedPackage.maxMembers} thành viên</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Bước 3: Chọn Thành Viên Gia Đình Thụ Hưởng Gói
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Hồ sơ bệnh án điện tử (EHR) của từng người sẽ được kết nối trực tiếp với Bác sĩ <strong>{selectedDoctor.name}</strong> để theo dõi sinh hiệu, dị ứng và tiền sử bệnh mạn tính.
                  </p>
                </div>

                <div className="px-4 py-2 bg-blue-50/80 border border-blue-200 rounded-xl text-xs font-bold text-[#2E37A4] self-start md:self-center">
                  Đã chọn: {selectedMembersCount} / {selectedPackage.maxMembers} người
                </div>
              </div>
            </div>

            {/* Members Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((m) => (
                <div
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                    m.selected
                      ? 'border-[#2E37A4] bg-blue-50/40 shadow-xs ring-1 ring-[#2E37A4]/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1.5 text-xs flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{m.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {m.age} tuổi
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#2E37A4]">
                        {m.relation}
                      </span>
                    </div>

                    {m.chronic && (
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/60">
                        <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5 text-amber-600">medical_information</span>
                        <span>Bệnh nền: {m.chronic}</span>
                      </div>
                    )}

                    {m.allergies && (
                      <div className="flex items-start gap-1.5 text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200/60">
                        <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5 text-rose-600">warning</span>
                        <span>Cảnh báo dị ứng: {m.allergies}</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="checkbox"
                    checked={m.selected}
                    onChange={() => {}}
                    className="mt-1 w-5 h-5 text-[#2E37A4] rounded cursor-pointer shrink-0"
                  />
                </div>
              ))}
            </div>

            {/* Stepper Navigation */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Quay lại: Chọn Gói
              </button>

              <button
                type="button"
                disabled={selectedMembersCount === 0}
                onClick={() => setCurrentStep(4)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Tiếp tục: Ký Hợp Đồng Điện Tử 4 Bên</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BƯỚC 4: KÝ HỢP ĐỒNG ĐIỆN TỬ 4 BÊN & THEO DÕI TIẾN TRÌNH THỰC TẾ             */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#2E37A4] bg-blue-50 border border-blue-200 mb-2">
                    <span className="material-symbols-outlined text-[15px]">verified_user</span>
                    <span>Giá trị pháp lý theo Luật Khám bệnh, chữa bệnh 2023 &amp; Luật Giao dịch điện tử</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Bước 4: Ký Số Hợp Đồng Y Tế 4 Bên &amp; Theo Dõi Phê Duyệt
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Hợp đồng điện tử 4 bên ràng buộc trách nhiệm y đức và pháp lý giữa Đại diện gia đình, Nền tảng FamiDoc, Bệnh viện đối tác và Bác sĩ chuyên môn phụ trách.
                  </p>
                </div>

                <div className="text-right self-start md:self-center">
                  <span className="text-xs text-slate-500 block">Kinh phí trọn gói:</span>
                  <span className="text-xl sm:text-2xl font-bold tabular-nums text-[#2E37A4]">
                    {selectedPackage.priceFormatted}
                  </span>
                </div>
              </div>
            </div>

            {/* LIVE 4-PARTY APPROVAL TRACKER (SỰ KHÁC BIỆT LỚN NHẤT: CHỈ RÕ TIẾN ĐỘ 4 BÊN) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2E37A4]">history_edu</span>
                  <span>Tiến Trình Ký Số Của 4 Bên (4-Party Live Tracker)</span>
                </h3>
                {isAutoApproving && (
                  <span className="text-xs text-[#2E37A4] font-semibold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#2E37A4]" />
                    <span>Đang liên thông phê duyệt số...</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Bên A: Gia đình */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    familySigned ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-700">BÊN A · GIA ĐÌNH</span>
                    <span className={`material-symbols-outlined text-[18px] ${familySigned ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {familySigned ? 'verified' : 'pending'}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900">Nguyễn Văn An (Chủ hộ)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {familySigned ? '✓ Đã xác thực Smart OTP' : 'Chờ bạn nhập mã OTP'}
                  </div>
                </div>

                {/* Bên B: FamiDoc Admin */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    adminSigned ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-700">BÊN B · NỀN TẢNG</span>
                    <span className={`material-symbols-outlined text-[18px] ${adminSigned ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {adminSigned ? 'verified' : 'pending'}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900">FamiDoc SmartCA</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {adminSigned ? '✓ Đã thẩm định pháp lý' : 'Chờ kiểm duyệt Escrow'}
                  </div>
                </div>

                {/* Bên C: Cơ sở y tế */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    facilitySigned ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-700">BÊN C · BỆNH VIỆN</span>
                    <span className={`material-symbols-outlined text-[18px] ${facilitySigned ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {facilitySigned ? 'verified' : 'pending'}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 truncate">{selectedDoctor.hospital}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {facilitySigned ? '✓ Đã ký số bảo trợ' : 'Chờ phân công Bác sĩ'}
                  </div>
                </div>

                {/* Bên D: Bác sĩ */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    doctorSigned ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-700">BÊN D · BÁC SĨ RIÊNG</span>
                    <span className={`material-symbols-outlined text-[18px] ${doctorSigned ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {doctorSigned ? 'verified' : 'pending'}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 truncate">{selectedDoctor.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {doctorSigned ? '✓ Đã cam kết SLA y đức' : 'Chờ ký cam kết hồ sơ'}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Legal Contract Viewer */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Văn Bản Hợp Đồng Điện Tử Số #FMD-2026-CTR88219</span>
                <span className="text-slate-500">Mã hóa SHA-256 TSA Timestamp</span>
              </div>
              <div className="p-6 text-xs text-slate-700 space-y-3 max-h-56 overflow-y-auto leading-relaxed">
                <div className="text-center space-y-1">
                  <div className="font-bold text-slate-900 uppercase">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — ĐỘC LẬP TỰ DO HẠNH PHÚC
                  </div>
                  <div className="font-bold text-sm text-[#2E37A4]">
                    HỢP ĐỒNG DỊCH VỤ BÁC SĨ GIA ĐÌNH BẢO CHỨNG 4 BÊN CHÍNH THỨC
                  </div>
                </div>
                <p>
                  <strong>Bên A (Chủ hộ gia đình):</strong> Ông Nguyễn Văn An · Đăng ký cho <strong>{selectedMembersCount} thành viên</strong> thụ hưởng y tế.
                </p>
                <p>
                  <strong>Bên B (Nền tảng):</strong> FamiDoc Healthcare Corporation · Đảm bảo hạ tầng số, đối soát tài chính Escrow và tổng đài cấp cứu 24/7.
                </p>
                <p>
                  <strong>Bên C (Cơ sở y tế bảo trợ):</strong> {selectedDoctor.hospital} · Cung ứng trang thiết bị, phòng cấp cứu vệ tinh và tiếp nhận chuyển tuyến ưu tiên.
                </p>
                <p>
                  <strong>Bên D (Bác sĩ chuyên môn):</strong> {selectedDoctor.title} {selectedDoctor.name} (CCHN: {selectedDoctor.cchnNumber}) · Trực tiếp thăm khám tận nhà, tư vấn Telehealth và lập bệnh án SOAP.
                </p>
                <p>
                  <strong>Gói dịch vụ đăng ký:</strong> {selectedPackage.name} ({selectedPackage.durationLabel}) — Giá trị hợp đồng: <strong>{selectedPackage.priceFormatted}</strong>.
                </p>
              </div>
            </div>

            {/* E-Signature Input Area (NẾU GIA ĐÌNH CHƯA KÝ) */}
            {!familySigned ? (
              <form onSubmit={handleFamilyExecuteSign} className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-200 bg-blue-50/30 space-y-4 shadow-xs">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                  Xác Thực Ký Điện Tử Đại Diện Chủ Hộ (E-Signature &amp; Smart OTP)
                </h3>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                  <div className="text-xs space-y-0.5">
                    <div className="font-bold text-slate-900">Người ký: NGUYỄN VĂN AN (Đại diện chủ hộ #FAM-88219)</div>
                    <div className="text-[11px] text-slate-500">Mã chứng thực OTP gửi về SĐT 0912 345 678</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Mã OTP"
                      className="w-28 px-3 py-2 text-center font-bold tabular-nums border rounded-xl bg-slate-50 text-xs focus:outline-none focus:border-[#2E37A4]"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isOtpVerified ? 'bg-emerald-600 text-white' : 'bg-[#2E37A4] text-white hover:bg-[#222982]'
                      }`}
                    >
                      {isOtpVerified ? 'Đã xác thực OTP ✓' : 'Xác thực'}
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={agreedLegalTerms}
                    onChange={(e) => setAgreedLegalTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#2E37A4] rounded cursor-pointer"
                  />
                  <span>
                    Tôi xác nhận là đại diện hợp pháp của các thành viên gia đình, đã đọc kỹ toàn bộ điều khoản hợp đồng và đồng ý ký kết điện tử với Bác sĩ <strong>{selectedDoctor.name}</strong> và <strong>{selectedDoctor.hospital}</strong>.
                  </span>
                </label>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSigningFamily || !isOtpVerified || !agreedLegalTerms}
                    className="w-full sm:w-auto px-8 py-3 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSigningFamily ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang đóng dấu ký số TSA...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">draw</span>
                        <span>Ký Số Điện Tử Xác Nhận (Bên A)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* KHI ĐÃ KÝ XONG: HIỂN THỊ NÚT CHUYỂN SANG THANH TOÁN KHI ĐỦ 4 CHỮ KÝ */
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900">
                      {doctorSigned
                        ? 'Cả 4 Bên Đã Ký Số Thành Công! Hợp Đồng Đã Sẵn Sàng Kích Hoạt'
                        : 'Bạn Đã Ký Số Thành Công! Đang Chờ Bệnh Viện & Bác Sĩ Ký Duyệt...'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {doctorSigned
                        ? 'Mời bạn mở cổng VietQR để hoàn tất đóng phí dịch vụ trong 15 phút.'
                        : 'Hệ thống đang tiến hành đối soát chứng thư số và phân công bác sĩ liên thông.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!doctorSigned}
                  onClick={() => setCurrentStep(5)}
                  className="w-full sm:w-auto px-6 py-3 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Chuyển Sang Cổng Thanh Toán VietQR</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* BƯỚC 5: CỔNG THANH TOÁN VIETQR & KÍCH HOẠT QUYỀN LỢI (ACTIVE)             */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            {!isPaymentComplete ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 text-center">
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-block">
                    ⏱️ Hạn thanh toán: 15 phút (CFG-05)
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 pt-2">
                    Cổng Thanh Toán Quét Mã VietQR Tự Động
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sử dụng ứng dụng ngân hàng bất kỳ để quét mã QR thanh toán nhanh 24/7.
                  </p>
                </div>

                {/* Simulated High-Res VietQR Card */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block font-semibold">NGÂN HÀNG THỤ HƯỞNG:</span>
                      <strong className="text-xs text-slate-800">MB BANK (Quân Đội)</strong>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#2E37A4]">
                      VietQR Pro
                    </span>
                  </div>

                  {/* QR Image Box */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs inline-block">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=FAMIDOC-PAY-${selectedPackage.price}-CTR88219`}
                      alt="Mã VietQR Thanh Toán"
                      className="w-44 h-44 object-contain mx-auto"
                    />
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-1 text-xs text-left pt-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Mã hợp đồng:</span>
                      <strong className="tabular-nums text-slate-900">CTR-4P-2026-88219</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Bác sĩ phụ trách:</span>
                      <strong className="text-slate-900">{selectedDoctor.name}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Gói đăng ký:</span>
                      <strong className="text-slate-900">{selectedPackage.name}</strong>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200 text-sm">
                      <span>Tổng số tiền:</span>
                      <span className="text-[#2E37A4] tabular-nums text-base">{selectedPackage.priceFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCompletePayment}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Xác Nhận Đã Quét Mã &amp; Kích Hoạt Gói Ngay</span>
                  </button>

                  <p className="text-[11px] text-slate-400">
                    Hệ thống sẽ đối soát tự động qua Webhook Napas/VietQR trong 5-10 giây.
                  </p>
                </div>
              </div>
            ) : (
              /* PAYMENT SUCCESS & ACTIVATION COMPLETE */
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6 animate-scale-up">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-4xl font-bold shadow-xs">
                  ✓
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block">
                    Trạng thái: ACTIVE (Hợp đồng có hiệu lực)
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Chào Mừng Gia Đình Đến Với FamiDoc!
                  </h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Hợp đồng <strong>#{selectedPackage.code}</strong> đã kích hoạt thành công. Bác sĩ <strong>{selectedDoctor.name}</strong> ({selectedDoctor.hospital}) chính thức là Bác Sĩ Gia Đình phụ trách hộ của bạn.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto text-xs text-left space-y-2">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-2">
                    Quyền lợi của gia đình đã được cộng vào tài khoản:
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Lượt khám tại nhà:</span>
                    <strong className="text-[#2E37A4]">{selectedPackage.homeVisits} lượt (Sẵn sàng đặt khám)</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tư vấn Telehealth 24/7:</span>
                    <strong className="text-teal-700">Không giới hạn</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Thành viên bảo trợ:</span>
                    <strong className="text-slate-900">{selectedMembersCount} người</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => router.push('/family')}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#2E37A4] hover:bg-[#222982] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Vào Bảng Sức Khỏe Gia Đình Ngay</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default FamilyContractOnboardingView;

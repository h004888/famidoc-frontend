'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/components/layout';

// Types
interface Doctor {
  id: string;
  name: string;
  title: string; // PGS.TS, ThS.BS, BS.CKII, BS.CKI
  specialty: string;
  specialtyKey: 'general' | 'pediatric' | 'geriatric' | 'cardio' | 'internal' | 'obgyn';
  cchnNumber: string; // Số Chứng chỉ hành nghề Bộ Y Tế
  experienceYears: number;
  rating: number;
  reviewCount: number;
  consultationCount: number;
  hospital: string;
  location: 'Hà Nội' | 'TP. Hồ Chí Minh' | 'Đà Nẵng';
  avatarUrl: string;
  services: ('home' | 'telehealth' | 'clinic')[];
  fee: string;
  bio: string;
  education: string[];
  schedule: string;
}

interface Facility {
  id: string;
  name: string;
  type: 'Bệnh viện Tuyến Trung Ương' | 'Bệnh viện Đa Khoa Quốc Tế' | 'Phòng khám Đa Khoa Kỹ Thuật Cao';
  address: string;
  city: 'Hà Nội' | 'TP. Hồ Chí Minh' | 'Đà Nẵng';
  phone: string;
  workingHours: string;
  imageUrl: string;
  specialties: string[];
  privileges: string[];
  bedCount: string;
}

// Mock Data
const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'doc-01',
    name: 'Nguyễn Văn Hoài',
    title: 'PGS. TS. Bác sĩ',
    specialty: 'Bác sĩ Gia đình & Nội Tổng Quát',
    specialtyKey: 'general',
    cchnNumber: 'CCHN-001892/BYT-CCHN',
    experienceYears: 24,
    rating: 4.96,
    reviewCount: 384,
    consultationCount: 2400,
    hospital: 'Bệnh viện Đại học Y Hà Nội',
    location: 'Hà Nội',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop',
    services: ['home', 'telehealth', 'clinic'],
    fee: '450.000đ / lượt',
    bio: 'Nguyên Phó Trưởng khoa Khám bệnh - Bệnh viện Đại học Y Hà Nội. Hơn 20 năm nghiên cứu mô hình Y học gia đình tại Pháp và ứng dụng quản lý sức khỏe cộng đồng liên thế hệ.',
    education: [
      'Tiến sĩ Y khoa - Đại học Y Dược Paris Descartes, Cộng hòa Pháp (2008)',
      'Thạc sĩ Nội khoa - Đại học Y Hà Nội (2002)',
      'Bác sĩ Đa khoa - Đại học Y Hà Nội (1998)',
    ],
    schedule: 'Thứ 2 - Thứ 7: 08:00 - 18:00 (Nhận khám tại nhà các buổi chiều)',
  },
  {
    id: 'doc-02',
    name: 'Trần Thị Thu Trang',
    title: 'ThS. BS. CKII',
    specialty: 'Nhi Khoa & Dinh Dưỡng Trẻ Em',
    specialtyKey: 'pediatric',
    cchnNumber: 'CCHN-004521/BYT-CCHN',
    experienceYears: 16,
    rating: 4.98,
    reviewCount: 512,
    consultationCount: 3150,
    hospital: 'Bệnh viện Nhi Đồng 1',
    location: 'TP. Hồ Chí Minh',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813586-b4d291986422?q=80&w=400&auto=format&fit=crop',
    services: ['home', 'telehealth'],
    fee: '400.000đ / lượt',
    bio: 'Chuyên gia Nhi khoa tận tâm, đồng hành cùng hơn 3.000 trẻ em phát triển toàn diện. Có kinh nghiệm sâu rộng về các bệnh hô hấp sơ sinh, miễn dịch trẻ nhỏ và chế độ ăn dinh dưỡng chuyên biệt.',
    education: [
      'Bác sĩ Chuyên khoa II Nhi - Đại học Y Dược TP.HCM (2018)',
      'Thạc sĩ Nhi khoa Lâm sàng - Đại học Y Dược TP.HCM (2012)',
      'Chứng chỉ Chăm sóc Sơ sinh Nâng cao (APLS) - Hoa Kỳ',
    ],
    schedule: 'Thứ 2 - Chủ Nhật: 07:30 - 20:00 (Sẵn sàng cấp cứu Telehealth 24/7)',
  },
  {
    id: 'doc-03',
    name: 'Lê Hoàng Nam',
    title: 'BS. CKII',
    specialty: 'Tim Mạch & Lão Khoa',
    specialtyKey: 'geriatric',
    cchnNumber: 'CCHN-002341/BYT-CCHN',
    experienceYears: 19,
    rating: 4.92,
    reviewCount: 290,
    consultationCount: 1820,
    hospital: 'Bệnh viện Bạch Mai',
    location: 'Hà Nội',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=400&auto=format&fit=crop',
    services: ['home', 'telehealth', 'clinic'],
    fee: '500.000đ / lượt',
    bio: 'Chuyên gia đầu ngành về quản lý bệnh mạn tính ở người cao tuổi: Tăng huyết áp, Đái tháo đường, Suy tim và Bệnh phổi tắc nghẽn mạn tính (COPD). Thành viên Hội Tim mạch Quốc gia Việt Nam.',
    education: [
      'Bác sĩ Chuyên khoa II Tim mạch - Học viện Quân Y (2015)',
      'Chứng chỉ Can thiệp Tim mạch - Viện Tim Quốc gia Việt Nam (2010)',
      'Bác sĩ Đa khoa - Đại học Y Hà Nội (2005)',
    ],
    schedule: 'Thứ 3, 5, 7: 08:30 - 17:30 (Thăm khám định kỳ tại gia đình)',
  },
  {
    id: 'doc-04',
    name: 'Phạm Minh Đức',
    title: 'TS. Bác sĩ',
    specialty: 'Nội Tiết & Bệnh Chuyển Hóa',
    specialtyKey: 'internal',
    cchnNumber: 'CCHN-006129/BYT-CCHN',
    experienceYears: 15,
    rating: 4.89,
    reviewCount: 215,
    consultationCount: 1420,
    hospital: 'Bệnh viện Chợ Rẫy',
    location: 'TP. Hồ Chí Minh',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop',
    services: ['telehealth', 'clinic'],
    fee: '450.000đ / lượt',
    bio: 'Tiến sĩ Nội tiết từng tu nghiệp tại Nhật Bản. Chuyên sâu về kiểm soát đường huyết gia đình, phòng ngừa biến chứng tim - thận ở bệnh nhân tiểu đường và quản lý hội chứng rối loạn chuyển hóa.',
    education: [
      'Tiến sĩ Y khoa (Nội tiết) - Đại học Y khoa Kobe, Nhật Bản (2016)',
      'Bác sĩ Nội trú Bệnh viện - Đại học Y Dược TP.HCM (2011)',
    ],
    schedule: 'Thứ 2 - Thứ 6: 08:00 - 17:00 (Khám tư vấn trực tuyến và tại viện)',
  },
  {
    id: 'doc-05',
    name: 'Võ Thị Phương Thảo',
    title: 'ThS. Bác sĩ',
    specialty: 'Sản Phụ Khoa & Chăm Sóc Thai Kỳ',
    specialtyKey: 'obgyn',
    cchnNumber: 'CCHN-005118/BYT-CCHN',
    experienceYears: 12,
    rating: 4.95,
    reviewCount: 420,
    consultationCount: 2200,
    hospital: 'Bệnh viện Từ Dũ',
    location: 'TP. Hồ Chí Minh',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop',
    services: ['home', 'telehealth'],
    fee: '420.000đ / lượt',
    bio: 'Đồng hành cùng hàng ngàn mẹ bầu trong suốt thai kỳ an toàn và giai đoạn hậu sản tại nhà. Tư vấn chuyên sâu về nuôi con bằng sữa mẹ, phục hồi sàn chậu và sức khỏe tiền mãn kinh.',
    education: [
      'Thạc sĩ Sản Phụ khoa - Đại học Y Dược TP.HCM (2016)',
      'Bác sĩ Đa khoa - Đại học Y Dược Cần Thơ (2012)',
    ],
    schedule: 'Thứ 2 - Thứ 7: 09:00 - 19:30 (Thăm khám mẹ và bé tại nhà)',
  },
  {
    id: 'doc-06',
    name: 'Đặng Quốc Huy',
    title: 'BS. CKI',
    specialty: 'Y Học Gia Đình & Sức Khỏe Toàn Diện',
    specialtyKey: 'general',
    cchnNumber: 'CCHN-008273/BYT-CCHN',
    experienceYears: 10,
    rating: 4.88,
    reviewCount: 180,
    consultationCount: 1150,
    hospital: 'Bệnh viện Đa khoa Đà Nẵng',
    location: 'Đà Nẵng',
    avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=400&auto=format&fit=crop',
    services: ['home', 'telehealth', 'clinic'],
    fee: '380.000đ / lượt',
    bio: 'Bác sĩ trẻ năng động, tận tụy, đam mê y học dự phòng. Thường xuyên tổ chức các buổi tầm soát chỉ số sinh hiệu cho các hộ gia đình nhiều thế hệ tại miền Trung.',
    education: [
      'Bác sĩ Chuyên khoa I Y học Gia đình - Đại học Y Dược Huế (2018)',
      'Bác sĩ Đa khoa - Đại học Kỹ thuật Y Dược Đà Nẵng (2014)',
    ],
    schedule: 'Thứ 2 - Chủ Nhật: 08:00 - 18:30 (Khám gia đình tại nhà & Telehealth)',
  },
];

const MOCK_FACILITIES: Facility[] = [
  {
    id: 'fac-01',
    name: 'Bệnh viện Đại học Y Hà Nội',
    type: 'Bệnh viện Tuyến Trung Ương',
    address: 'Số 1 Tôn Thất Tùng, Phường Kim Liên, Đống Đa, Hà Nội',
    city: 'Hà Nội',
    phone: '1900 6422',
    workingHours: '06:30 - 17:00 (Thứ 2 - Thứ 7)',
    imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=600&auto=format&fit=crop',
    specialties: ['Nội tổng quát', 'Tim mạch can thiệp', 'Tiêu hóa', 'Nhi khoa', 'Cơ xương khớp'],
    privileges: ['Lối đi ưu tiên FamiDoc Fast-Track', 'Bảo lãnh viện phí trực tiếp', 'Liên kết dữ liệu EMR hồ sơ bệnh án'],
    bedCount: '500+ giường',
  },
  {
    id: 'fac-02',
    name: 'Bệnh viện Đại học Y Dược TP.HCM',
    type: 'Bệnh viện Tuyến Trung Ương',
    address: '215 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    phone: '(028) 3855 4269',
    workingHours: '06:00 - 16:30 (Thứ 2 - Thứ 7)',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600&auto=format&fit=crop',
    specialties: ['Y học Gia đình', 'Tim mạch học', 'Nội tiết', 'Lão khoa', 'Thần kinh'],
    privileges: ['Ưu tiên lịch khám cùng Trưởng khoa', 'Miễn chờ xét nghiệm máu & Chẩn đoán hình ảnh', 'Bác sĩ FamiDoc hỗ trợ nhập viện'],
    bedCount: '1.000+ giường',
  },
  {
    id: 'fac-03',
    name: 'Bệnh viện Đa khoa Quốc tế Vinmec Times City',
    type: 'Bệnh viện Đa Khoa Quốc Tế',
    address: '458 Minh Khai, Phường Vĩnh Tuy, Hai Bà Trưng, Hà Nội',
    city: 'Hà Nội',
    phone: '(024) 3974 3556',
    workingHours: '08:00 - 17:00 (Cấp cứu 24/7)',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=600&auto=format&fit=crop',
    specialties: ['Nhi khoa quốc tế', 'Sản phụ khoa cao cấp', 'Y học hạt nhân', 'Tầm soát ung thư sớm'],
    privileges: ['Tiêu chuẩn JCI Hoa Kỳ', 'Phòng nội trú VIP đơn lập', 'Giảm 10% dịch vụ cho hội viên FamiDoc Pro'],
    bedCount: '600+ giường',
  },
  {
    id: 'fac-04',
    name: 'Phòng khám Đa khoa FamiDoc Center Sài Gòn',
    type: 'Phòng khám Đa Khoa Kỹ Thuật Cao',
    address: '68 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    phone: '1900 6868',
    workingHours: '07:30 - 20:30 (Cả ngày Lễ & Tết)',
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=600&auto=format&fit=crop',
    specialties: ['Bác sĩ Gia đình Trực tiếp', 'Xét nghiệm tại chỗ 15 phút', 'Siêu âm Doppler màu', 'Tiêm chủng chuẩn GSP'],
    privileges: ['Cơ sở điều phối bác sĩ khám tại nhà', 'Không phải bốc số chờ đợi', 'Hồ sơ điện tử đồng bộ tức thì'],
    bedCount: '20 giường lưu viện ngắn hạn',
  },
];

export function DoctorDirectoryView() {
  const [activeTab, setActiveTab] = useState<'doctors' | 'facilities'>('doctors');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedDoctorModal, setSelectedDoctorModal] = useState<Doctor | null>(null);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    return MOCK_DOCTORS.filter((doc) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.cchnNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSpecialty =
        selectedSpecialty === 'all' || doc.specialtyKey === selectedSpecialty;

      const matchCity = selectedCity === 'all' || doc.location === selectedCity;

      const matchService =
        selectedService === 'all' ||
        (selectedService === 'home' && doc.services.includes('home')) ||
        (selectedService === 'telehealth' && doc.services.includes('telehealth')) ||
        (selectedService === 'clinic' && doc.services.includes('clinic'));

      return matchSearch && matchSpecialty && matchCity && matchService;
    });
  }, [searchQuery, selectedSpecialty, selectedCity, selectedService]);

  // Filtered Facilities
  const filteredFacilities = useMemo(() => {
    return MOCK_FACILITIES.filter((fac) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fac.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fac.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCity = selectedCity === 'all' || fac.city === selectedCity;

      return matchSearch && matchCity;
    });
  }, [searchQuery, selectedCity]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased flex flex-col justify-between">
      {/* 1. Header chuẩn hệ thống */}
      <PublicHeader />

      <main className="flex-1 pt-24 pb-16">
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-[#475569]">
            <Link href="/" className="hover:text-[#2563eb] transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">home</span>
              Trang chủ
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-[#0f172a] font-semibold">Bác sĩ & Cơ sở Y tế</span>
          </nav>
        </div>

        {/* Hero Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#0f172a] via-[#1e293b] to-[#1e3a8a] text-white p-6 sm:p-10 shadow-lg">
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-xs">
                <span className="material-symbols-outlined text-[14px] text-blue-300">verified</span>
                100% Bác sĩ có Chứng chỉ hành nghề (CCHN) Bộ Y Tế
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display">
                Mạng Lưới Y Tế Chuyên Gia & Bệnh Viện Đối Tác Tuyến Đầu
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                FamiDoc Pro quy tụ hơn 1.200 bác sĩ gia đình, giáo sư, chuyên khoa I - II công tác tại các bệnh viện trung ương (Bạch Mai, ĐH Y Dược, Chợ Rẫy, Nhi Đồng), sẵn sàng thăm khám tận nhà và tư vấn 24/7.
              </p>
            </div>

            {/* Background Decorative Rings */}
            <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-1/4 top-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Main Tabs Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center p-1 bg-slate-200/60 rounded-xl max-w-md w-full">
              <button
                type="button"
                onClick={() => setActiveTab('doctors')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                  activeTab === 'doctors'
                    ? 'bg-white text-[#2563eb] shadow-xs'
                    : 'text-[#475569] hover:text-[#0f172a]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                <span>Đội ngũ Bác sĩ ({filteredDoctors.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('facilities')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                  activeTab === 'facilities'
                    ? 'bg-white text-[#2563eb] shadow-xs'
                    : 'text-[#475569] hover:text-[#0f172a]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">local_hospital</span>
                <span>Cơ sở & Bệnh viện ({filteredFacilities.length})</span>
              </button>
            </div>

            {/* Quick Helper badge */}
            <div className="flex items-center gap-2 text-xs text-[#475569]">
              <span className="material-symbols-outlined text-[16px] text-[#2563eb]">schedule</span>
              <span>Thời gian phản hồi kết nối bác sĩ: <strong>&lt; 15 phút</strong></span>
            </div>
          </div>

          {/* Interactive Filter Bar */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'doctors'
                    ? 'Tìm kiếm theo tên bác sĩ, chuyên khoa, bệnh viện công tác hoặc mã CCHN...'
                    : 'Tìm kiếm tên bệnh viện, địa chỉ, chuyên khoa tiếp nhận...'
                }
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#2563eb] text-sm text-[#0f172a] placeholder:text-slate-400 bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Multi-criteria Filter Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {/* Specialty filter (only for doctors) */}
              {activeTab === 'doctors' && (
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Chuyên khoa điều trị
                  </label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]"
                  >
                    <option value="all">Tất cả chuyên khoa</option>
                    <option value="general">Bác sĩ Gia đình & Nội Tổng Quát</option>
                    <option value="pediatric">Nhi Khoa & Dinh Dưỡng</option>
                    <option value="geriatric">Tim Mạch & Lão Khoa</option>
                    <option value="internal">Nội Tiết & Chuyển Hóa</option>
                    <option value="obgyn">Sản Phụ Khoa & Mẹ Bé</option>
                  </select>
                </div>
              )}

              {/* City filter */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Khu vực tỉnh / thành
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]"
                >
                  <option value="all">Toàn quốc (Hà Nội, TP.HCM, Đà Nẵng)</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>

              {/* Service Type filter (only for doctors) */}
              {activeTab === 'doctors' && (
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Hình thức phục vụ
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]"
                  >
                    <option value="all">Tất cả hình thức</option>
                    <option value="home">Thăm khám tại nhà riêng</option>
                    <option value="telehealth">Tư vấn trực tuyến Telehealth</option>
                    <option value="clinic">Tại bệnh viện / phòng khám</option>
                  </select>
                </div>
              )}
            </div>

            {/* Active Filters Clear Button */}
            {(searchQuery || selectedSpecialty !== 'all' || selectedCity !== 'all' || selectedService !== 'all') && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[#475569]">
                  Đang lọc kết quả theo tiêu chí được chọn
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSpecialty('all');
                    setSelectedCity('all');
                    setSelectedService('all');
                  }}
                  className="text-[#2563eb] hover:text-[#1d4ed8] font-semibold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: DOCTORS DIRECTORY */}
          {activeTab === 'doctors' && (
            <div>
              {filteredDoctors.length === 0 ? (
                <div role="status" className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-[#2563eb] rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-2xl">person_search</span>
                  </div>
                  <h3 className="text-base font-bold text-[#0f172a]">
                    Không tìm thấy bác sĩ phù hợp với tiêu chí
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] max-w-md mx-auto">
                    Vui lòng điều chỉnh từ khóa tìm kiếm hoặc chọn lại khu vực / chuyên khoa khác để tìm bác sĩ.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSpecialty('all');
                      setSelectedCity('all');
                      setSelectedService('all');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] text-white rounded-lg text-xs font-semibold hover:bg-[#1d4ed8] transition-colors"
                  >
                    Xem lại toàn bộ danh sách bác sĩ
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      <div className="p-5 space-y-4">
                        {/* Header card: Avatar + Basic Info */}
                        <div className="flex items-start gap-4">
                          <div className="relative shrink-0">
                            <img
                              src={doc.avatarUrl}
                              alt={doc.name}
                              className="w-16 h-16 rounded-xl object-cover border border-slate-200 group-hover:scale-105 transition-transform"
                            />
                            <span
                              title="Bác sĩ đã xác thực CCHN Bộ Y Tế"
                              className="absolute -bottom-1 -right-1 bg-[#10b981] text-white p-0.5 rounded-full border-2 border-white flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-[12px]">check</span>
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-semibold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-1">
                              {doc.title}
                            </span>
                            <h3 className="text-base font-bold text-[#0f172a] truncate group-hover:text-[#2563eb] transition-colors">
                              {doc.name}
                            </h3>
                            <p className="text-xs text-[#475569] truncate font-medium">
                              {doc.specialty}
                            </p>
                          </div>
                        </div>

                        {/* Medical Credential & Hospital */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-xs text-[#475569]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">CCHN:</span>
                            <span className="font-mono font-medium text-slate-700">{doc.cchnNumber}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Nơi công tác:</span>
                            <span className="font-medium text-[#0f172a] truncate max-w-[180px] text-right">
                              {doc.hospital}
                            </span>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                          <div>
                            <div className="text-xs font-bold text-[#0f172a]">{doc.experienceYears}+ năm</div>
                            <div className="text-[10px] text-[#475569]">Kinh nghiệm</div>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#0f172a] flex items-center justify-center gap-0.5">
                              <span className="material-symbols-outlined text-[13px] text-amber-500 fill-1">star</span>
                              {doc.rating}
                            </div>
                            <div className="text-[10px] text-[#475569]">({doc.reviewCount} đánh giá)</div>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#0f172a]">{doc.consultationCount}+</div>
                            <div className="text-[10px] text-[#475569]">Lượt khám</div>
                          </div>
                        </div>

                        {/* Services tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {doc.services.includes('home') && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">home_health</span>
                              Khám tại nhà
                            </span>
                          )}
                          {doc.services.includes('telehealth') && (
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">videocam</span>
                              Telehealth 24/7
                            </span>
                          )}
                          {doc.services.includes('clinic') && (
                            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">local_hospital</span>
                              Tại viện
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDoctorModal(doc)}
                          className="flex-1 py-2 px-3 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-xs font-semibold text-[#0f172a] transition-colors"
                        >
                          Hồ sơ chi tiết
                        </button>
                        <Link
                          href="/family/appointments"
                          className="flex-1 py-2 px-3 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold text-center transition-colors shadow-xs"
                        >
                          Đặt lịch hẹn
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FACILITIES DIRECTORY */}
          {activeTab === 'facilities' && (
            <div>
              {filteredFacilities.length === 0 ? (
                <div role="status" className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-[#2563eb] rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-2xl">apartment</span>
                  </div>
                  <h3 className="text-base font-bold text-[#0f172a]">
                    Không tìm thấy cơ sở y tế phù hợp
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] max-w-md mx-auto">
                    Vui lòng thử lại với tên bệnh viện hoặc khu vực thành phố khác.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredFacilities.map((fac) => (
                    <div
                      key={fac.id}
                      className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Image banner */}
                        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                          <img
                            src={fac.imageUrl}
                            alt={fac.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-[#0f172a] text-[11px] font-bold px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
                            {fac.type}
                          </div>
                          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-medium px-2 py-0.5 rounded-sm backdrop-blur-xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">bed</span>
                            {fac.bedCount}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                          <div>
                            <h3 className="text-lg font-bold text-[#0f172a] hover:text-[#2563eb] transition-colors">
                              {fac.name}
                            </h3>
                            <p className="text-xs text-[#475569] flex items-center gap-1.5 mt-1">
                              <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">location_on</span>
                              <span>{fac.address}</span>
                            </p>
                          </div>

                          <div className="space-y-2 text-xs text-[#475569]">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-blue-500">schedule</span>
                              <span><strong>Giờ làm việc:</strong> {fac.workingHours}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-emerald-500">call</span>
                              <span><strong>Hotline đối tác:</strong> {fac.phone}</span>
                            </div>
                          </div>

                          {/* Privileges */}
                          <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100">
                            <h4 className="text-xs font-bold text-[#1e40af] mb-1.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">stars</span>
                              Đặc quyền hội viên FamiDoc Pro:
                            </h4>
                            <ul className="text-xs text-[#1e3a8a] space-y-1">
                              {fac.privileges.map((priv, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="material-symbols-outlined text-[13px] text-[#2563eb] shrink-0 mt-0.5">check_circle</span>
                                  <span>{priv}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Specialty tags */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {fac.specialties.map((spec, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Facility Footer */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-[#475569] font-medium">
                          Tiếp đón bệnh nhân FamiDoc 24/7
                        </span>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(fac.name + ' ' + fac.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8]"
                        >
                          <span>Xem chỉ đường</span>
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Doctor Profile Modal Detail */}
      {selectedDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <img
                  src={selectedDoctorModal.avatarUrl}
                  alt={selectedDoctorModal.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-xs"
                />
                <div>
                  <span className="text-xs font-semibold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-1">
                    {selectedDoctorModal.title}
                  </span>
                  <h3 className="text-lg font-bold text-[#0f172a]">
                    {selectedDoctorModal.name}
                  </h3>
                  <p className="text-xs text-[#475569]">{selectedDoctorModal.specialty}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoctorModal(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-sm">
              {/* Credentials badge */}
              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Số CCHN Bộ Y Tế:</span>
                  <span className="font-mono font-bold text-[#0f172a]">{selectedDoctorModal.cchnNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Bệnh viện công tác:</span>
                  <span className="font-bold text-[#0f172a]">{selectedDoctorModal.hospital}</span>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Tiểu sử chuyên môn
                </h4>
                <p className="text-[#334155] leading-relaxed text-xs sm:text-sm">
                  {selectedDoctorModal.bio}
                </p>
              </div>

              {/* Education */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quá trình đào tạo & Bằng cấp
                </h4>
                <ul className="space-y-1.5 text-xs text-[#334155]">
                  {selectedDoctorModal.education.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[14px] text-[#2563eb] mt-0.5 shrink-0">school</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Schedule */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Thời gian tiếp nhận khám
                </h4>
                <p className="text-xs text-[#334155] flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">calendar_month</span>
                  {selectedDoctorModal.schedule}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setSelectedDoctorModal(null)}
                className="px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-200 rounded-lg transition-colors"
              >
                Đóng
              </button>
              <Link
                href="/family/appointments"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                Đặt lịch khám với bác sĩ này
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Footer chuẩn hệ thống */}
      <PublicFooter />
    </div>
  );
}


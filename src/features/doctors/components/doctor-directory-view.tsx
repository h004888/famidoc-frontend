'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { LandingHeader, LandingFooter } from '@/features/landing';
import { DoctorDetailView } from './doctor-detail-view';

// Types
export interface Doctor {
  id: string;
  name: string;
  title: string; // PGS.TS, ThS.BS, BS.CKII, BS.CKI
  specialty: string;
  specialtyKey: 'general' | 'pediatric' | 'geriatric' | 'cardio' | 'internal' | 'obgyn' | 'ortho' | 'ent' | 'traditional';
  cchnNumber: string;
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

export interface Facility {
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

// Medsev Authentic 9 Qualified Doctors
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
    hospital: 'Bệnh viện Đại học Y Dược TP.HCM',
    location: 'TP. Hồ Chí Minh',
    avatarUrl: '/images/medsev/home-one/doctor/1.jpg',
    services: ['home', 'telehealth', 'clinic'],
    fee: '450.000đ / lượt',
    bio: 'Nguyên Phó Trưởng khoa Khám bệnh - Bệnh viện Đại học Y Dược. Hơn 20 năm nghiên cứu mô hình Y học gia đình tại Pháp và ứng dụng quản lý sức khỏe cộng đồng liên thế hệ.',
    education: [
      'Tiến sĩ Y khoa - Đại học Y Dược Paris Descartes, Cộng hòa Pháp (2008)',
      'Thạc sĩ Nội khoa - Đại học Y Dược TP.HCM (2002)',
      'Bác sĩ Đa khoa - Đại học Y Dược TP.HCM (1998)',
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
    avatarUrl: '/images/medsev/home-one/doctor/2.jpg',
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
    avatarUrl: '/images/medsev/home-one/doctor/3.jpg',
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
    avatarUrl: '/images/medsev/home-one/doctor/4.jpg',
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
    avatarUrl: '/images/medsev/home-one/doctor/5.jpg',
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
    avatarUrl: '/images/medsev/home-one/doctor/6.jpg',
    services: ['home', 'telehealth', 'clinic'],
    fee: '380.000đ / lượt',
    bio: 'Bác sĩ trẻ năng động, tận tụy, đam mê y học dự phòng. Thường xuyên tổ chức các buổi tầm soát chỉ số sinh hiệu cho các hộ gia đình nhiều thế hệ tại miền Trung.',
    education: [
      'Bác sĩ Chuyên khoa I Y học Gia đình - Đại học Y Dược Huế (2018)',
      'Bác sĩ Đa khoa - Đại học Kỹ thuật Y Dược Đà Nẵng (2014)',
    ],
    schedule: 'Thứ 2 - Chủ Nhật: 08:00 - 18:30 (Khám gia đình tại nhà & Telehealth)',
  },
  {
    id: 'doc-07',
    name: 'Hoàng Minh Tuấn',
    title: 'BS. CKII',
    specialty: 'Cơ Xương Khớp & Phục Hồi Chức Năng',
    specialtyKey: 'ortho',
    cchnNumber: 'CCHN-009142/BYT-CCHN',
    experienceYears: 21,
    rating: 4.94,
    reviewCount: 310,
    consultationCount: 2050,
    hospital: 'Bệnh viện Chợ Rẫy',
    location: 'TP. Hồ Chí Minh',
    avatarUrl: '/images/medsev/home-one/doctor/7.jpg',
    services: ['home', 'clinic'],
    fee: '480.000đ / lượt',
    bio: 'Chuyên gia vật lý trị liệu và thoái hóa khớp tư gia. Hướng dẫn tập phục hồi vận động sau đột quỵ, tai biến và chấn thương thể thao cho các thành viên gia đình.',
    education: [
      'Bác sĩ Chuyên khoa II Cơ Xương Khớp - Đại học Y Dược TP.HCM (2013)',
      'Tu nghiệp Phục hồi Chức năng tại Singapore General Hospital (2017)',
    ],
    schedule: 'Thứ 2, 4, 6: 08:00 - 17:00 (Hẹn khám tại tư gia và bệnh viện)',
  },
  {
    id: 'doc-08',
    name: 'Lê Thị Kim Oanh',
    title: 'BS. CKI',
    specialty: 'Tai Mũi Họng & Hô Hấp Trẻ Em',
    specialtyKey: 'ent',
    cchnNumber: 'CCHN-007812/BYT-CCHN',
    experienceYears: 14,
    rating: 4.91,
    reviewCount: 265,
    consultationCount: 1680,
    hospital: 'Bệnh viện Tai Mũi Họng Trung Ương',
    location: 'Hà Nội',
    avatarUrl: '/images/medsev/home-one/doctor/8.jpg',
    services: ['home', 'telehealth'],
    fee: '400.000đ / lượt',
    bio: 'Thăm khám và xử lý nhẹ nhàng các chứng viêm tai giữa, viêm xoang, viêm họng hạt và dị vật đường thở cho trẻ nhỏ và người cao tuổi tại nhà.',
    education: [
      'Bác sĩ Chuyên khoa I Tai Mũi Họng - Đại học Y Hà Nội (2015)',
      'Bác sĩ Đa khoa - Đại học Y Dược Hải Phòng (2010)',
    ],
    schedule: 'Thứ 2 - Thứ 7: 08:30 - 19:00 (Nhận khám ngoài giờ theo yêu cầu)',
  },
  {
    id: 'doc-09',
    name: 'Đỗ Anh Dũng',
    title: 'ThS. Bác sĩ',
    specialty: 'Y Học Cổ Truyền & Dưỡng Sinh Gia Đình',
    specialtyKey: 'traditional',
    cchnNumber: 'CCHN-003671/BYT-CCHN',
    experienceYears: 18,
    rating: 4.97,
    reviewCount: 450,
    consultationCount: 2890,
    hospital: 'Bệnh viện Y Học Cổ Truyền Trung Ương',
    location: 'Hà Nội',
    avatarUrl: '/images/medsev/home-one/doctor/9.jpg',
    services: ['home', 'telehealth', 'clinic'],
    fee: '420.000đ / lượt',
    bio: 'Kết hợp tinh hoa Đông y và Y học hiện đại. Chuyên châm cứu, bấm huyệt trị liệu đau thần kinh tọa, mất ngủ kinh niên và thiết lập chế độ dưỡng sinh tự nhiên.',
    education: [
      'Thạc sĩ Y học Cổ truyền - Học viện Y Dược học Cổ truyền Việt Nam (2012)',
      'Bác sĩ Đa khoa Y học Cổ truyền - Đại học Y Hà Nội (2006)',
    ],
    schedule: 'Thứ 2 - Chủ Nhật: 08:00 - 18:00 (Trị liệu bấm huyệt tại nhà)',
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
    imageUrl: '/images/medsev/home-one/1.jpg',
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
    imageUrl: '/images/medsev/home-one/4.jpg',
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
    imageUrl: '/images/medsev/home-one/6.jpg',
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
    phone: '1900 8821',
    workingHours: '07:30 - 20:30 (Cả ngày Lễ & Tết)',
    imageUrl: '/images/medsev/home-one/7.jpg',
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
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [selectedDetailType, setSelectedDetailType] = useState<'doctor' | 'facility'>('doctor');

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

      return matchSearch && matchSpecialty && matchCity;
    });
  }, [searchQuery, selectedSpecialty, selectedCity]);

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

  if (selectedDetailId) {
    return (
      <DoctorDetailView
        id={selectedDetailId}
        type={selectedDetailType}
        onBack={() => setSelectedDetailId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col justify-between">
      {/* 1. UNIFIED MEDSEV HEADER */}
      <LandingHeader />

      <main className="flex-1 pb-16">
        {/* 2. MEDSEV PAGE TITLE AREA (Matching .page-title-area.page-title-one in doctor.html) */}
        <section
          className="relative bg-cover bg-center py-24 sm:py-32 text-center text-white"
          style={{ backgroundImage: "url('/images/medsev/doctor/1.jpg')" }}
        >
          {/* Cobalt Blue Overlay (rgba(0, 70, 192, 0.65)) */}
          <div className="absolute inset-0 bg-[#0046c0]/70 backdrop-brightness-90" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-xs">
              Gặp Gỡ Đội Ngũ Bác Sĩ Của Chúng Tôi
            </h1>

            {/* Medsev Breadcrumbs List */}
            <nav aria-label="Breadcrumb" className="inline-flex items-center justify-center gap-2 text-sm text-blue-100 font-medium">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-base">home</span>
                Trang chủ
              </Link>
              <span className="text-blue-200">/</span>
              <span className="text-white font-semibold">Đội ngũ Bác sĩ</span>
            </nav>
          </div>
        </section>

        {/* 3. MEDSEV DOCTOR SEARCH AREA (Matching .doctor-search-area in doctor.html) */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 sm:-mt-16 relative z-20">
          <div className="bg-white rounded-2xl shadow-[0_10px_35px_0_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8 space-y-6">
            {/* Tab selector for Doctor vs Partner Facilities */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl text-xs sm:text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('doctors')}
                  className={`px-5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'doctors'
                      ? 'bg-[#0046c0] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">stethoscope</span>
                  <span>Đội ngũ Bác sĩ ({filteredDoctors.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('facilities')}
                  className={`px-5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'facilities'
                      ? 'bg-[#0046c0] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">local_hospital</span>
                  <span>Cơ sở &amp; Bệnh viện ({filteredFacilities.length})</span>
                </button>
              </div>

              {/* City Quick Filter */}
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Khu vực:</span>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:border-[#0046c0]"
                >
                  <option value="all">Tất cả tỉnh thành</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>
            </div>

            {/* Medsev 2-Column Search Wrap */}
            <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
              {/* Field 1: Doctor Name / Keyword */}
              <div className="relative pl-14 sm:pl-16">
                <span className="material-symbols-outlined text-3xl sm:text-4xl text-[#0046c0] absolute left-0 top-1">
                  stethoscope
                </span>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {activeTab === 'doctors' ? 'Tìm Bác Sĩ' : 'Tìm Bệnh Viện'}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      activeTab === 'doctors'
                        ? 'Nhập tên bác sĩ hoặc bệnh viện...'
                        : 'Nhập tên cơ sở, địa chỉ...'
                    }
                    className="w-full pb-2 pt-0.5 text-sm sm:text-base font-semibold text-slate-800 placeholder:text-slate-400 border-b border-[#ccd9f2] focus:border-[#0046c0] focus:outline-none transition-colors pr-8 bg-transparent"
                  />
                  <button
                    type="submit"
                    aria-label="Tìm kiếm"
                    className="absolute right-0 bottom-2 text-slate-400 hover:text-[#0046c0] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">search</span>
                  </button>
                </div>
              </div>

              {/* Field 2: Category Specialty */}
              <div className="relative pl-14 sm:pl-16">
                <span className="material-symbols-outlined text-3xl sm:text-4xl text-[#0046c0] absolute left-0 top-1">
                  local_hospital
                </span>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Chuyên Khoa Y Tế
                </label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full pb-2 pt-0.5 text-sm sm:text-base font-semibold text-slate-800 border-b border-[#ccd9f2] focus:border-[#0046c0] focus:outline-none transition-colors bg-transparent cursor-pointer"
                >
                  <option value="all">Tất cả chuyên khoa</option>
                  <option value="general">Bác sĩ Gia đình &amp; Nội Tổng Quát</option>
                  <option value="pediatric">Nhi Khoa &amp; Dinh Dưỡng</option>
                  <option value="geriatric">Tim Mạch &amp; Lão Khoa</option>
                  <option value="internal">Nội Tiết &amp; Chuyển Hóa</option>
                  <option value="obgyn">Sản Phụ Khoa &amp; Mẹ Bé</option>
                  <option value="ortho">Cơ Xương Khớp &amp; Phục Hồi Chức Năng</option>
                  <option value="ent">Tai Mũi Họng &amp; Hô Hấp</option>
                  <option value="traditional">Y Học Cổ Truyền &amp; Dưỡng Sinh</option>
                </select>
              </div>
            </form>

            {/* Clear filters badge */}
            {(searchQuery || selectedSpecialty !== 'all' || selectedCity !== 'all') && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Đang lọc {filteredDoctors.length} bác sĩ theo tiêu chí
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSpecialty('all');
                    setSelectedCity('all');
                  }}
                  className="text-[#0046c0] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  <span>Xóa bộ lọc</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4. DOCTORS GRID SECTION (Matching .doctors-area.doctors-area-two in doctor.html) */}
        <section className="relative pt-16 pb-20 overflow-hidden">
          {/* Medsev floating decorative shape */}
          <div className="absolute top-1/3 left-0 w-32 md:w-48 opacity-40 pointer-events-none hidden sm:block animate-pulse">
            <img src="/images/medsev/doctor/2.png" alt="Decorative Shape" className="w-full h-auto" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* TAB 1: DOCTORS DIRECTORY (3-Column Grid) */}
            {activeTab === 'doctors' && (
              <div>
                {filteredDoctors.length === 0 ? (
                  <div role="status" className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
                    <div className="w-14 h-14 bg-blue-50 text-[#0046c0] rounded-full flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-3xl">person_search</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Không tìm thấy bác sĩ phù hợp
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ danh sách 9 chuyên gia y tế.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedSpecialty('all');
                        setSelectedCity('all');
                      }}
                      className="px-5 py-2.5 bg-[#0046c0] hover:bg-[#003899] text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                    >
                      Xem toàn bộ danh sách bác sĩ
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredDoctors.map((doc) => (
                      <article
                        key={doc.id}
                        className="bg-white rounded-2xl shadow-[0_4px_25px_0_rgba(0,0,0,0.06)] hover:shadow-[0_15px_35px_0_rgba(0,70,192,0.18)] hover:-translate-y-2 transition-all duration-300 text-center flex flex-col justify-between overflow-hidden group border border-slate-100"
                      >
                        {/* Doctor Top: Photo + Sliding Hover Appointment Button */}
                        <div className="relative overflow-hidden aspect-[4/4] bg-slate-100">
                          <img
                            src={doc.avatarUrl}
                            alt={doc.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />

                          {/* Hover Slide-up Button Overlay */}
                          <div className="absolute inset-0 bg-[#0046c0]/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDetailId(doc.id);
                                setSelectedDetailType('doctor');
                              }}
                              className="bg-white hover:bg-slate-900 text-[#0046c0] hover:text-white font-semibold text-xs sm:text-sm py-2.5 px-6 rounded-lg shadow-lg transition-all duration-300 transform translate-y-3 group-hover:translate-y-0 cursor-pointer flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-base">calendar_month</span>
                              <span>Đặt lịch hẹn</span>
                            </button>
                          </div>
                        </div>

                        {/* Doctor Bottom: Information */}
                        <div className="p-6 text-center space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-[#0046c0] uppercase tracking-wider">
                              {doc.title}
                            </div>
                            <h3
                              onClick={() => {
                                setSelectedDetailId(doc.id);
                                setSelectedDetailType('doctor');
                              }}
                              className="font-bold text-xl text-slate-900 group-hover:text-[#0046c0] transition-colors cursor-pointer"
                            >
                              {doc.name}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium">
                              {doc.specialty}
                            </p>
                            <p className="text-xs text-slate-400 font-normal truncate">
                              {doc.hospital}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <span className="material-symbols-outlined text-sm text-amber-500 material-symbols-filled">star</span>
                              {doc.rating} <span className="font-normal text-slate-400">({doc.reviewCount})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDetailId(doc.id);
                                setSelectedDetailType('doctor');
                              }}
                              className="font-bold text-[#0046c0] hover:underline cursor-pointer"
                            >
                              Xem chi tiết →
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: FACILITIES DIRECTORY */}
            {activeTab === 'facilities' && (
              <div>
                {filteredFacilities.length === 0 ? (
                  <div role="status" className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
                    <div className="w-14 h-14 bg-blue-50 text-[#0046c0] rounded-full flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-3xl">apartment</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Không tìm thấy cơ sở y tế phù hợp
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Vui lòng thử lại với tên bệnh viện hoặc khu vực thành phố khác.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredFacilities.map((fac) => (
                      <article
                        key={fac.id}
                        className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_0_rgba(0,0,0,0.06)] hover:shadow-[0_15px_35px_0_rgba(0,70,192,0.15)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                      >
                        <div>
                          {/* Image banner */}
                          <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                            <img
                              src={fac.imageUrl}
                              alt={fac.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3 bg-white/95 text-slate-900 text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                              {fac.type}
                            </div>
                            <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">bed</span>
                              {fac.bedCount}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-6 space-y-4">
                            <div>
                              <h3
                                onClick={() => {
                                  setSelectedDetailId(fac.id);
                                  setSelectedDetailType('facility');
                                }}
                                className="text-lg font-bold text-slate-900 group-hover:text-[#0046c0] transition-colors cursor-pointer"
                              >
                                {fac.name}
                              </h3>
                              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5">
                                <span className="material-symbols-outlined text-base text-slate-400 shrink-0">location_on</span>
                                <span>{fac.address}</span>
                              </p>
                            </div>

                            <div className="space-y-2 text-xs text-slate-600">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-[#0046c0]">schedule</span>
                                <span><strong>Giờ làm việc:</strong> {fac.workingHours}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-emerald-600">call</span>
                                <span><strong>Hotline viện:</strong> {fac.phone}</span>
                              </div>
                            </div>

                            {/* Privileges */}
                            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-1.5">
                              <h4 className="text-xs font-bold text-[#0046c0] flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">stars</span>
                                Đặc quyền hội viên FamiDoc:
                              </h4>
                              <ul className="text-xs text-slate-700 space-y-1">
                                {fac.privileges.map((priv, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="material-symbols-outlined text-sm text-[#0046c0] shrink-0 mt-0.5">check_circle</span>
                                    <span>{priv}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDetailId(fac.id);
                              setSelectedDetailType('facility');
                            }}
                            className="flex-1 py-2.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 bg-white text-xs font-semibold text-slate-700 text-center transition-colors cursor-pointer"
                          >
                            Chi tiết cơ sở
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDetailId(fac.id);
                              setSelectedDetailType('facility');
                            }}
                            className="flex-1 py-2.5 px-3 rounded-lg bg-[#0046c0] hover:bg-[#003899] text-white text-xs font-semibold text-center transition-colors shadow-xs cursor-pointer"
                          >
                            Yêu cầu nhập viện
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 5. MEDSEV NEWSLETTER AREA (Matching .newsletter-area in doctor.html) */}
        <section className="bg-slate-50 border-t border-slate-200 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-[0_4px_25px_0_rgba(0,0,0,0.06)] border border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-2">
                <span className="text-xs font-bold text-[#0046c0] uppercase tracking-wider">
                  Bản Tin Y Khoa Định Kỳ
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Đăng Ký Nhận Bản Tin Y Học Gia Đình
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Cập nhật phác đồ phòng bệnh mùa dịch, kiến thức dinh dưỡng đa thế hệ và hướng dẫn chăm sóc sức khỏe thường thức từ các bác sĩ đầu ngành.
                </p>
              </div>

              <div className="lg:col-span-5">
                <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Nhập email của bạn..."
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0046c0] text-sm text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#0046c0] hover:bg-[#003899] text-white font-semibold text-sm rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    Đăng ký ngay
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. UNIFIED MEDSEV FOOTER */}
      <LandingFooter />
    </div>
  );
}

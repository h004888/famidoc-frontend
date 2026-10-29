'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LandingHeader, LandingFooter } from '@/features/landing';
import { Doctor, Facility } from './doctor-directory-view';

export interface DoctorDetailViewProps {
  id?: string;
  type?: 'doctor' | 'facility';
  onBack?: () => void;
}

// Complete mock data repository matching Medsev standards
const DOCTORS_DATA: Record<string, Doctor> = {
  'doc-01': {
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
    bio: 'Nguyên Phó Trưởng khoa Khám bệnh - Bệnh viện Đại học Y Dược TP.HCM. Hơn 24 năm kinh nghiệm thực hành lâm sàng, từng tu nghiệp tại Cộng hòa Pháp chuyên ngành Y học gia đình và quản trị bệnh mạn tính cộng đồng. Bác sĩ Hoài nổi tiếng với phong cách tư vấn ân cần, giải thích cặn kẽ từng chỉ số sinh hóa và phác đồ điều trị cá thể hóa cho từng thành viên trong gia đình.',
    education: [
      'Tiến sĩ Y khoa (Y học Gia đình & Nội khoa) - Đại học Paris Descartes, Cộng hòa Pháp (2008)',
      'Thạc sĩ Y khoa chuyên ngành Nội khoa - Đại học Y Dược TP.HCM (2002)',
      'Bác sĩ Đa khoa xuất sắc - Đại học Y Dược TP.HCM (1998)',
      'Chứng chỉ Quản lý Bệnh mạn tính Đa mô thức - Hiệp hội Y học Gia đình Châu Âu (WONCA)',
    ],
    schedule: 'Thứ 2 - Thứ 7: 08:00 - 18:00 (Nhận khám tại nhà các buổi chiều và tư vấn trực tuyến 24/7)',
  },
  'doc-02': {
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
    bio: 'Bác sĩ CKII chuyên ngành Nhi khoa với hơn 16 năm gắn bó cùng Bệnh viện Nhi Đồng 1. Từng hỗ trợ chăm sóc và đồng hành cùng hơn 3.100 trẻ sơ sinh và trẻ nhỏ. Bác sĩ Trang đặc biệt có thế mạnh về điều trị hô hấp sơ sinh không lạm dụng kháng sinh, tư vấn dinh dưỡng chuẩn khoa học và theo dõi mốc vận động trẻ thơ.',
    education: [
      'Bác sĩ Chuyên khoa II Nhi khoa Lâm sàng - Đại học Y Dược TP.HCM (2018)',
      'Thạc sĩ Y khoa chuyên ngành Nhi khoa - Đại học Y Dược TP.HCM (2012)',
      'Chứng nhận Cấp cứu Nhi khoa Nâng cao (APLS) - Hoa Kỳ (2015)',
      'Bác sĩ Đa khoa - Đại học Y Dược TP.HCM (2006)',
    ],
    schedule: 'Thứ 2 - Chủ Nhật: 07:30 - 20:00 (Sẵn sàng tiếp nhận cuộc gọi khẩn cấp Telehealth cho trẻ nhỏ)',
  },
  'doc-03': {
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
    bio: 'Chuyên gia đầu ngành tại Viện Tim mạch Quốc gia - Bệnh viện Bạch Mai. Hơn 19 năm đồng hành cùng người cao tuổi kiểm soát các bệnh lý mạch vành, tăng huyết áp kháng trị, rối loạn nhịp tim và biến chứng đái tháo đường. Bác sĩ Nam luôn theo dõi sát sao biểu đồ điện tim ECG tại nhà và tư vấn lối sống phù hợp cho người già.',
    education: [
      'Bác sĩ Chuyên khoa II Tim mạch - Học viện Quân Y (2015)',
      'Chứng chỉ Can thiệp Tim mạch Nâng cao - Viện Tim Quốc gia (2010)',
      'Thành viên thường trực Hội Tim Mạch Quốc Gia Việt Nam',
      'Bác sĩ Đa khoa - Đại học Y Hà Nội (2005)',
    ],
    schedule: 'Thứ 3, 5, 7: 08:30 - 17:30 (Thăm khám tận nơi tại các hộ gia đình nội thành Hà Nội)',
  },
  'doc-04': {
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
    bio: 'Tiến sĩ Y khoa tốt nghiệp tại Đại học Kobe (Nhật Bản). Chuyên gia giàu kinh nghiệm về điều trị bệnh lý tuyến giáp, đái tháo đường tuýp 2 và hội chứng chuyển hóa. Bác sĩ Đức ứng dụng công nghệ IoT đo đường huyết liên tục (CGM) giúp gia đình kiểm soát biến chứng tiểu đường hiệu quả.',
    education: [
      'Tiến sĩ Y khoa (Nội tiết) - Đại học Y khoa Kobe, Nhật Bản (2016)',
      'Bác sĩ Nội trú Bệnh viện Chợ Rẫy - Đại học Y Dược TP.HCM (2011)',
      'Bác sĩ Đa khoa - Đại học Y Dược TP.HCM (2008)',
    ],
    schedule: 'Thứ 2 - Thứ 6: 08:00 - 17:00 (Tư vấn trực tuyến và thăm khám nội trú)',
  },
  'doc-05': {
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
    bio: 'Thạc sĩ Bác sĩ Sản phụ khoa uy tín tại Bệnh viện Từ Dũ. Đã hỗ trợ hơn 2.200 mẹ bầu trải qua thai kỳ khỏe mạnh và phục hồi hậu sản tại nhà. Bác sĩ Thảo luôn tận tâm hướng dẫn nuôi con bằng sữa mẹ, chăm sóc vết mổ/vết khâu tầng sinh môn và tư vấn tiền sản gia đình.',
    education: [
      'Thạc sĩ Sản Phụ khoa - Đại học Y Dược TP.HCM (2016)',
      'Bác sĩ Đa khoa - Đại học Y Dược Cần Thơ (2012)',
      'Chứng nhận Siêu âm Sản Phụ khoa Nâng cao - Viện Pasteur TP.HCM',
    ],
    schedule: 'Thứ 2 - Thứ 7: 09:00 - 19:30 (Nhận thăm khám mẹ và bé tận tư gia)',
  },
  'doc-06': {
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
    bio: 'Bác sĩ Chuyên khoa I Y học Gia đình phụ trách mạng lưới chăm sóc sức khỏe cộng đồng khu vực miền Trung. Bác sĩ Huy có phong cách làm việc năng động, kỹ lưỡng trong kiểm tra sinh hiệu định kỳ và hướng dẫn các bài tập phục hồi chức năng thể chất tại nhà.',
    education: [
      'Bác sĩ Chuyên khoa I Y học Gia đình - Đại học Y Dược Huế (2018)',
      'Bác sĩ Đa khoa - Đại học Kỹ thuật Y Dược Đà Nẵng (2014)',
    ],
    schedule: 'Thứ 2 - Chủ Nhật: 08:00 - 18:30 (Khám gia đình tại nhà & Telehealth)',
  },
  'doc-07': {
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
    bio: 'Hơn 21 năm điều trị bệnh lý thoái hóa khớp, thoát vị đĩa đệm và di chứng sau tai biến. Bác sĩ Tuấn thiết kế bài tập vật lý trị liệu tại nhà giúp người bệnh phục hồi tầm vận động nhanh chóng và giảm đau an toàn không lạm dụng thuốc giảm đau.',
    education: [
      'Bác sĩ Chuyên khoa II Cơ Xương Khớp - Đại học Y Dược TP.HCM (2013)',
      'Tu nghiệp Phục hồi Chức năng tại Singapore General Hospital (2017)',
      'Bác sĩ Đa khoa - Đại học Y Dược TP.HCM (2003)',
    ],
    schedule: 'Thứ 2, 4, 6: 08:00 - 17:00 (Hẹn khám tại tư gia và bệnh viện)',
  },
  'doc-08': {
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
    bio: 'Bác sĩ chuyên khoa Tai Mũi Họng giàu kinh nghiệm nội soi và xử lý nhẹ nhàng các bệnh lý viêm tai giữa mủ, viêm VA, viêm xoang mạn tính và khò khè đường thở ở trẻ em và người già.',
    education: [
      'Bác sĩ Chuyên khoa I Tai Mũi Họng - Đại học Y Hà Nội (2015)',
      'Bác sĩ Đa khoa - Đại học Y Dược Hải Phòng (2010)',
    ],
    schedule: 'Thứ 2 - Thứ 7: 08:30 - 19:00 (Nhận khám ngoài giờ theo yêu cầu gia đình)',
  },
  'doc-09': {
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
    bio: 'Chuyên gia kết hợp Đông Tây y trong điều trị đau cơ xương khớp mạn tính, rối loạn giấc ngủ và suy nhược thần kinh. Bác sĩ Dũng trực tiếp châm cứu, xoa bóp bấm huyệt và kê đơn thuốc thảo dược chuẩn GPP tại gia đình.',
    education: [
      'Thạc sĩ Y học Cổ truyền - Học viện Y Dược học Cổ truyền Việt Nam (2012)',
      'Bác sĩ Đa khoa Y học Cổ truyền - Đại học Y Hà Nội (2006)',
    ],
    schedule: 'Thứ 2 - Chủ Nhật: 08:00 - 18:00 (Trị liệu bấm huyệt tại nhà)',
  },
};

const FACILITIES_DATA: Record<string, Facility> = {
  'fac-01': {
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
  'fac-02': {
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
  'fac-03': {
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
  'fac-04': {
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
};

export function DoctorDetailView({ id = 'doc-01', type = 'doctor', onBack }: DoctorDetailViewProps) {
  const isFacility = type === 'facility' || id.startsWith('fac');
  const doctor = DOCTORS_DATA[id] || DOCTORS_DATA['doc-01']!;
  const facility = FACILITIES_DATA[id] || FACILITIES_DATA['fac-01']!;

  // Booking Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: isFacility ? 'Khám chuyên khoa tại viện' : 'Khám tận nhà (Home Visit)',
    age: '',
    preferredDate: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* 1. UNIFIED MEDSEV HEADER */}
      <LandingHeader />

      <main className="flex-1 pb-20">
        {/* 2. MEDSEV PAGE TITLE AREA (Matching .page-title-three in doctor-details.html) */}
        <section
          className="relative bg-cover bg-center py-20 sm:py-28 text-white"
          style={{ backgroundImage: "url('/images/medsev/doctor/1.jpg')" }}
        >
          {/* Cobalt Blue Overlay */}
          <div className="absolute inset-0 bg-[#0046c0]/75 backdrop-brightness-90" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-3">
              {/* Back to directory button */}
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 text-blue-100 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer mb-2"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  <span>Quay lại danh mục</span>
                </button>
              ) : (
                <Link
                  href="/doctors"
                  className="inline-flex items-center gap-1.5 text-blue-100 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer mb-2"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  <span>Quay lại danh mục Bác sĩ</span>
                </Link>
              )}

              {/* Title & Subtitle */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-xs">
                {isFacility ? facility.name : doctor.name}
              </h1>
              <h2 className="text-lg sm:text-xl font-semibold text-blue-100">
                {isFacility ? facility.type : `${doctor.title} - ${doctor.specialty}`}
              </h2>
              <p className="text-sm text-blue-200 font-normal leading-relaxed">
                {isFacility
                  ? `Cơ sở y tế đối tác liên kết trực tiếp • Giờ làm việc: ${facility.workingHours}`
                  : `${doctor.hospital} • CCHN: ${doctor.cchnNumber} • ${doctor.experienceYears} năm kinh nghiệm`}
              </p>
            </div>
          </div>
        </section>

        {/* 3. MEDSEV DOCTOR DETAILS BODY (Matching .doctor-details-area in doctor-details.html) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT COLUMN: (.doctor-details-left) */}
            <div className="lg:col-span-5 -mt-16 sm:-mt-24 lg:-mt-28 relative z-20">
              <div className="bg-white rounded-2xl shadow-[0_10px_35px_0_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
                {/* Doctor Photo / Facility Image */}
                <div className="relative aspect-[4/4] bg-slate-100 overflow-hidden">
                  <img
                    src={isFacility ? facility.imageUrl : doctor.avatarUrl}
                    alt={isFacility ? facility.name : doctor.name}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute top-4 right-4 bg-white/95 text-[#0046c0] px-3 py-1 rounded-full text-xs font-bold shadow-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span>Đã chứng thực</span>
                  </div>
                </div>

                {/* Contact Info (.doctor-details-contact) */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
                      Thông Tin Liên Hệ
                    </h3>
                    <ul className="space-y-4 text-xs sm:text-sm text-slate-600">
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-xl text-[#0046c0] shrink-0 mt-0.5">call</span>
                        <div>
                          <span className="text-slate-400 block text-xs">Hotline trực tiếp:</span>
                          <a href={isFacility ? `tel:${facility.phone}` : 'tel:19008821'} className="font-semibold text-slate-800 hover:text-[#0046c0]">
                            {isFacility ? facility.phone : '1900 8821 (Hotline 24/7)'}
                          </a>
                        </div>
                      </li>

                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-xl text-[#0046c0] shrink-0 mt-0.5">mail</span>
                        <div>
                          <span className="text-slate-400 block text-xs">Hộp thư hỗ trợ:</span>
                          <span className="font-medium text-slate-800">
                            {isFacility ? 'b2b@famidoc.vn' : `dr.${doctor.id}@famidoc.vn`}
                          </span>
                        </div>
                      </li>

                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-xl text-[#0046c0] shrink-0 mt-0.5">location_on</span>
                        <div>
                          <span className="text-slate-400 block text-xs">Địa chỉ tiếp nhận:</span>
                          <span className="font-medium text-slate-800 leading-snug">
                            {isFacility ? facility.address : `${doctor.hospital}, ${doctor.location}`}
                          </span>
                        </div>
                      </li>

                      {!isFacility && (
                        <li className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-xl text-[#0046c0] shrink-0 mt-0.5">payments</span>
                          <div>
                            <span className="text-slate-400 block text-xs">Phí khám tiêu chuẩn:</span>
                            <span className="font-bold text-[#0046c0] text-base font-mono">
                              {doctor.fee}
                            </span>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Working Hours (.doctor-details-work) */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                      Lịch Tiếp Nhận Thăm Khám
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="font-semibold text-slate-700">Thứ Hai - Thứ Sáu</span>
                        <span className="text-[#0046c0] font-medium">08:00 - 18:00</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="font-semibold text-slate-700">Thứ Bảy</span>
                        <span className="text-[#0046c0] font-medium">08:00 - 17:00</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="font-semibold text-slate-700">Chủ Nhật &amp; Lễ</span>
                        <span className="text-emerald-600 font-medium">Cấp cứu Telehealth 24/7</span>
                      </div>
                    </div>

                    <a
                      href="#dat-lich"
                      className="mt-6 block w-full py-3 bg-[#0046c0] hover:bg-[#003899] text-white text-center font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Đặt Lịch Khám Ngay
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: (.doctor-details-right) */}
            <div className="lg:col-span-7 pt-6 lg:pt-8 space-y-8">
              {/* 1. Biography */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-[#0046c0] tracking-tight">
                  {isFacility ? 'Giới Thiệu Cơ Sở Y Tế' : 'Tiểu Sử Chuyên Môn'}
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {isFacility
                    ? `${facility.name} là một trong những đối tác chiến lược trọng điểm của mạng lưới y tế gia đình FamiDoc Pro. Với hệ thống trang thiết bị hiện đại chuẩn quốc tế, quy mô ${facility.bedCount} và đội ngũ y bác sĩ đầu ngành, cơ sở đảm bảo tiếp nhận, chẩn đoán và điều trị nội trú an toàn, chu đáo cho mọi thành viên gia đình.`
                    : doctor.bio}
                </p>
              </div>

              {/* 2. Education / Specialties */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-[#0046c0] tracking-tight">
                  {isFacility ? 'Chuyên Khoa Mũi Nhọn' : 'Quá Trình Đào Tạo & Bằng Cấp'}
                </h3>
                {isFacility ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {facility.specialties.map((spec, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5 text-xs sm:text-sm text-slate-800 font-medium">
                        <span className="material-symbols-outlined text-[#0046c0] text-lg">check_circle</span>
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                    {doctor.education.map((edu, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="material-symbols-outlined text-[#0046c0] text-xl shrink-0 mt-0.5">school</span>
                        <span className="leading-relaxed font-medium">{edu}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 3. Privileges / Scope of Care */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-[#0046c0] tracking-tight">
                  {isFacility ? 'Đặc Quyền Hội Viên FamiDoc Pro' : 'Phạm Vi Chăm Sóc & Dịch Vụ'}
                </h3>
                {isFacility ? (
                  <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-100 space-y-2.5">
                    {facility.privileges.map((priv, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800">
                        <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0 mt-0.5">verified</span>
                        <span className="font-medium">{priv}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-white text-center space-y-2 shadow-xs">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-2xl">home_health</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Khám Tại Nhà</h4>
                      <p className="text-[11px] text-slate-500">Khám tổng quát, đo sinh hiệu và kê đơn tại tư gia.</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white text-center space-y-2 shadow-xs">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0046c0] flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-2xl">videocam</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Telehealth 24/7</h4>
                      <p className="text-[11px] text-slate-500">Gọi video trực tiếp giải đáp triệu chứng tức thì.</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white text-center space-y-2 shadow-xs">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-2xl">local_hospital</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Hỗ Trợ Tại Viện</h4>
                      <p className="text-[11px] text-slate-500">Đón tiếp ưu tiên và hội chẩn tuyến trung ương.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Patient Trust Rating */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold font-mono text-[#0046c0]">
                    {isFacility ? '4.95' : doctor.rating}
                  </div>
                  <div>
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} className="material-symbols-outlined text-lg material-symbols-filled">star</span>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">
                      Dựa trên {isFacility ? '1.500+' : `${doctor.reviewCount}`} đánh giá của bệnh nhân
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Lượt thăm khám thành công</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {isFacility ? '12.000+ ca' : `${doctor.consultationCount}+ ca`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. MEDSEV APPOINTMENT AREA (Matching .appointment-area-three in doctor-details.html) */}
        <section id="dat-lich" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="rounded-3xl bg-slate-50 border border-slate-200 overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12">
            {/* Form Column (col-lg-7) */}
            <div className="lg:col-span-7 p-8 sm:p-12 relative">
              <div className="space-y-2 mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {isFacility ? 'Y Cầu Đón Tiếp Tại Bệnh Viện' : 'Đặt Lịch Hẹn Cùng Bác Sĩ'}
                </h3>
                <p className="text-sm text-slate-500">
                  FamiDoc Pro sẽ xác nhận lịch hẹn của bạn trong vòng 30 phút qua điện thoại hoặc tin nhắn SMS.
                </p>
              </div>

              {isSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-2xl">check</span>
                  </div>
                  <h4 className="font-bold text-emerald-900 text-base">Đặt lịch khám thành công!</h4>
                  <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                    Bác sĩ điều phối sẽ liên hệ số điện thoại {formData.phone} để hoàn tất xác nhận lịch hẹn cho gia đình.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="text-xs font-semibold text-emerald-800 hover:underline pt-2 cursor-pointer"
                  >
                    Đặt thêm lịch hẹn khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Họ và tên bệnh nhân *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nhập họ và tên..."
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0046c0] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Số điện thoại liên hệ *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="09xx xxx xxx"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0046c0] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Địa chỉ Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0046c0] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Dịch vụ đăng ký
                      </label>
                      <select
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0046c0] bg-white"
                      >
                        <option value="Khám tận nhà (Home Visit)">Khám tận nhà (Home Visit)</option>
                        <option value="Tư vấn Telehealth 24/7">Tư vấn Telehealth 24/7</option>
                        <option value="Đón tiếp tại bệnh viện">Đón tiếp tại bệnh viện</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ngày khám mong muốn
                      </label>
                      <input
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0046c0] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Độ tuổi bệnh nhân
                      </label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="Ví dụ: 45"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0046c0] bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-[#0046c0] hover:bg-[#003899] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md mt-4 cursor-pointer"
                  >
                    Xác Nhận Đặt Lịch Khám
                  </button>
                </form>
              )}
            </div>

            {/* Emergency Column (col-lg-5) */}
            <div className="lg:col-span-5 relative bg-slate-900 overflow-hidden flex flex-col justify-end p-8 sm:p-10 text-white min-h-[360px]">
              <img
                src="/images/medsev/doctor/4.jpg"
                alt="Emergency Consultation"
                className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

              <div className="relative z-10 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#0046c0] flex items-center justify-center text-white shadow-lg">
                  <span className="material-symbols-outlined text-2xl">call</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Đường Dây Nóng Khẩn Cấp 24/7
                </span>
                <h4 className="text-xl sm:text-2xl font-bold">Cần Tư Vấn Y Khoa Ngay Lập Tức?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Đội ngũ bác sĩ trực cấp cứu FamiDoc Pro luôn túc trực hỗ trợ sơ cứu từ xa và điều phối xe cấp cứu chuyên dụng.
                </p>
                <a
                  href="tel:19008821"
                  className="inline-block text-2xl font-black font-mono text-white tracking-wider hover:text-amber-300 transition-colors pt-2"
                >
                  Hotline: 1900 8821
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 5. MEDSEV NEWSLETTER AREA */}
        <section className="bg-slate-50 border-t border-slate-200 py-16 mt-20">
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


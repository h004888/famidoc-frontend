'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    facility_name: 'Bệnh viện Đại học Y Hà Nội',
    license_number: 'GPHĐ: 001928/BYT-GPHĐ',
    tax_code: '0102345892',
    address: 'Số 1 Tôn Thất Tùng, Phường Kim Liên, Đống Đa, Hà Nội',
    city: 'Hà Nội',
    phone: '1900 6422',
    hotline: '1900 6422',
    verification_status: 'VERIFIED',
    created_at: '15/01/2024',
    updated_at: '24/10/2026',
    type: 'Bệnh viện Tuyến Trung Ương',
    workingHours: '06:30 - 17:00 (Thứ 2 - Thứ 7)',
    imageUrl: '/images/medsev/home-one/1.jpg',
    specialties: ['Nội tổng quát', 'Tim mạch can thiệp', 'Tiêu hóa', 'Nhi khoa', 'Cơ xương khớp'],
    privileges: ['Lối đi ưu tiên FamiDoc Fast-Track', 'Bảo lãnh viện phí trực tiếp', 'Liên kết dữ liệu EMR hồ sơ bệnh án'],
    bedCount: '500+ giường',
  },
  'fac-02': {
    id: 'fac-02',
    name: 'Bệnh viện Đại học Y Dược TP.HCM',
    facility_name: 'Bệnh viện Đại học Y Dược TP.HCM',
    license_number: 'GPHĐ: 002145/BYT-GPHĐ',
    tax_code: '0303892145',
    address: '215 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    phone: '(028) 3855 4269',
    hotline: '(028) 3855 4269',
    verification_status: 'VERIFIED',
    created_at: '20/02/2024',
    updated_at: '18/10/2026',
    type: 'Bệnh viện Tuyến Trung Ương',
    workingHours: '06:00 - 16:30 (Thứ 2 - Thứ 7)',
    imageUrl: '/images/medsev/home-one/4.jpg',
    specialties: ['Y học Gia đình', 'Tim mạch học', 'Nội tiết', 'Lão khoa', 'Thần kinh'],
    privileges: ['Ưu tiên lịch khám cùng Trưởng khoa', 'Miễn chờ xét nghiệm máu & Chẩn đoán hình ảnh', 'Bác sĩ FamiDoc hỗ trợ nhập viện'],
    bedCount: '1.000+ giường',
  },
  'fac-03': {
    id: 'fac-03',
    name: 'Bệnh viện Đa khoa Quốc tế Vinmec Times City',
    facility_name: 'Bệnh viện Đa khoa Quốc tế Vinmec Times City',
    license_number: 'GPHĐ: 003621/BYT-GPHĐ',
    tax_code: '0105891234',
    address: '458 Minh Khai, Phường Vĩnh Tuy, Hai Bà Trưng, Hà Nội',
    city: 'Hà Nội',
    phone: '(024) 3974 3556',
    hotline: '(024) 3974 3556',
    verification_status: 'VERIFIED',
    created_at: '10/05/2024',
    updated_at: '05/11/2026',
    type: 'Bệnh viện Đa Khoa Quốc Tế',
    workingHours: '08:00 - 17:00 (Cấp cứu 24/7)',
    imageUrl: '/images/medsev/home-one/6.jpg',
    specialties: ['Nhi khoa quốc tế', 'Sản phụ khoa cao cấp', 'Y học hạt nhân', 'Tầm soát ung thư sớm'],
    privileges: ['Tiêu chuẩn JCI Hoa Kỳ', 'Phòng nội trú VIP đơn lập', 'Giảm 10% dịch vụ cho hội viên FamiDoc Pro'],
    bedCount: '600+ giường',
  },
  'fac-04': {
    id: 'fac-04',
    name: 'Phòng khám Đa khoa FamiDoc Center Sài Gòn',
    facility_name: 'Phòng khám Đa khoa FamiDoc Center Sài Gòn',
    license_number: 'GPHĐ: 004128/SYT-GPHĐ',
    tax_code: '0316789421',
    address: '68 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    phone: '1900 8821',
    hotline: '1900 8821',
    verification_status: 'VERIFIED',
    created_at: '01/08/2024',
    updated_at: '10/11/2026',
    type: 'Phòng khám Đa Khoa Kỹ Thuật Cao',
    workingHours: '07:30 - 20:30 (Cả ngày Lễ & Tết)',
    imageUrl: '/images/medsev/home-one/7.jpg',
    specialties: ['Bác sĩ Gia đình Trực tiếp', 'Xét nghiệm tại chỗ 15 phút', 'Siêu âm Doppler màu', 'Tiêm chủng chuẩn GSP'],
    privileges: ['Cơ sở điều phối bác sĩ khám tại nhà', 'Không phải bốc số chờ đợi', 'Hồ sơ điện tử đồng bộ tức thì'],
    bedCount: '20 giường lưu viện ngắn hạn',
  },
};

interface FacilityDoctorItem {
  id: string;
  name: string;
  title: string;
  specialty: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  avatarUrl: string;
  schedule: string;
  badge?: string;
}

const FACILITY_DOCTORS: Record<string, FacilityDoctorItem[]> = {
  'fac-01': [
    {
      id: 'doc-01',
      name: 'Nguyễn Văn Hoài',
      title: 'PGS. TS. Bác sĩ',
      specialty: 'Trưởng Ban Y Học Gia Đình & Nội Tổng Quát',
      experienceYears: 24,
      rating: 4.96,
      reviewCount: 384,
      avatarUrl: '/images/medsev/home-one/doctor/1.jpg',
      schedule: 'Thứ 2, 4, 6: 08:00 - 16:30',
      badge: 'Trưởng khoa',
    },
    {
      id: 'doc-03',
      name: 'Lê Hoàng Nam',
      title: 'BS. CKII',
      specialty: 'Tim Mạch Can Thiệp & Lão Khoa',
      experienceYears: 19,
      rating: 4.92,
      reviewCount: 290,
      avatarUrl: '/images/medsev/home-one/doctor/3.jpg',
      schedule: 'Thứ 3, 5, 7: 08:30 - 17:00',
      badge: 'Chuyên gia đầu ngành',
    },
    {
      id: 'doc-08',
      name: 'Vũ Hải Long',
      title: 'ThS. Bác sĩ',
      specialty: 'Tai Mũi Họng & Phẫu Thuật Đầu Cổ',
      experienceYears: 14,
      rating: 4.91,
      reviewCount: 168,
      avatarUrl: '/images/medsev/home-one/doctor/8.jpg',
      schedule: 'Thứ 2 - Thứ 6: 08:00 - 17:00',
      badge: 'Bác sĩ chính',
    },
    {
      id: 'doc-09',
      name: 'Hoàng Thị Lan Anh',
      title: 'BS. CKI',
      specialty: 'Y Học Cổ Truyền & Phục Hồi Chức Năng',
      experienceYears: 11,
      rating: 4.94,
      reviewCount: 195,
      avatarUrl: '/images/medsev/home-one/doctor/9.jpg',
      schedule: 'Thứ 2 - Thứ 7: 08:30 - 16:30',
      badge: 'Cố vấn chuyên môn',
    },
  ],
  'fac-02': [
    {
      id: 'doc-01',
      name: 'Nguyễn Văn Hoài',
      title: 'PGS. TS. Bác sĩ',
      specialty: 'Trưởng khoa Nội Tổng Quát & Y Học Gia Đình',
      experienceYears: 24,
      rating: 4.96,
      reviewCount: 384,
      avatarUrl: '/images/medsev/home-one/doctor/1.jpg',
      schedule: 'Thứ 2 - Thứ 6: 08:00 - 17:00',
      badge: 'Phó Trưởng khoa',
    },
    {
      id: 'doc-04',
      name: 'Phạm Minh Đức',
      title: 'TS. Bác sĩ',
      specialty: 'Nội Tiết & Chuyển Hóa',
      experienceYears: 15,
      rating: 4.89,
      reviewCount: 215,
      avatarUrl: '/images/medsev/home-one/doctor/4.jpg',
      schedule: 'Thứ 3, 5: 08:00 - 16:30',
      badge: 'Tiến sĩ Y khoa',
    },
  ],
  'fac-03': [
    {
      id: 'doc-02',
      name: 'Trần Thị Thu Trang',
      title: 'ThS. BS. CKII',
      specialty: 'Nhi Khoa & Dinh Dưỡng Quốc Tế',
      experienceYears: 16,
      rating: 4.98,
      reviewCount: 512,
      avatarUrl: '/images/medsev/home-one/doctor/2.jpg',
      schedule: 'Cả ngày (Luân phiên)',
      badge: 'Chuyên gia cao cấp',
    },
    {
      id: 'doc-05',
      name: 'Võ Thị Phương Thảo',
      title: 'ThS. Bác sĩ',
      specialty: 'Sản Phụ Khoa & Chăm Sóc Thai Kỳ VIP',
      experienceYears: 12,
      rating: 4.95,
      reviewCount: 420,
      avatarUrl: '/images/medsev/home-one/doctor/5.jpg',
      schedule: 'Thứ 2 - Thứ 7: 08:30 - 18:00',
      badge: 'Bác sĩ phụ trách',
    },
  ],
  'fac-04': [
    {
      id: 'doc-06',
      name: 'Đặng Quốc Huy',
      title: 'BS. CKI',
      specialty: 'Y Học Gia Đình & Điều Phối Khám Tại Nhà',
      experienceYears: 10,
      rating: 4.88,
      reviewCount: 180,
      avatarUrl: '/images/medsev/home-one/doctor/6.jpg',
      schedule: '07:30 - 20:30 hàng ngày',
      badge: 'Trưởng phòng khám',
    },
    {
      id: 'doc-07',
      name: 'Bùi Văn Hùng',
      title: 'ThS. Bác sĩ',
      specialty: 'Cơ Xương Khớp & Y Học Thể Thao',
      experienceYears: 13,
      rating: 4.90,
      reviewCount: 145,
      avatarUrl: '/images/medsev/home-one/doctor/7.jpg',
      schedule: 'Thứ 2 - Thứ 6: 08:00 - 17:30',
      badge: 'Bác sĩ chuyên khoa',
    },
  ],
};

// Family Doctor Care Packages tailored for individual doctor assignment
const DOCTOR_CARE_PACKAGES = [
  {
    id: 'FAMILY',
    name: 'Gói Đồng Hành',
    badge: '3 Tháng',
    price: '2.850.000đ',
    monthlyPrice: '950.000đ/tháng',
    popular: true,
    highlight: 'Phù hợp gia đình có trẻ nhỏ & người lớn tuổi (3-6 người)',
    features: [
      '3 lượt bác sĩ trực tiếp thăm khám tại nhà',
      '4 lượt tư vấn video Telehealth 24/7',
      'Bác sĩ phụ trách chính & lập phác đồ điều trị gia đình',
      'Hồ sơ bệnh án điện tử (EHR) lưu trữ trọn đời',
    ],
  },
  {
    id: 'ELDERLY',
    name: 'Gói An Tâm Mạn Tính',
    badge: '6 Tháng',
    price: '6.475.000đ',
    monthlyPrice: '925.000đ/lần khám',
    popular: false,
    highlight: 'Quản lý bệnh mạn tính: Tim mạch, huyết áp, tiểu đường',
    features: [
      '7 lượt bác sĩ khám & đo điện tim ECG tại nhà',
      '8 lượt tư vấn video chuyên sâu',
      'Theo dõi chỉ số sinh hiệu & phác đồ thuốc định kỳ',
      'Ưu tiên đón tiếp & hội chẩn tuyến BV Đại học Y Dược',
    ],
  },
  {
    id: 'BASIC',
    name: 'Gói Trải Nghiệm',
    badge: '1 Tháng',
    price: '1.000.000đ',
    monthlyPrice: '1.000.000đ/tháng',
    popular: false,
    highlight: 'Khảo sát sức khỏe & lập hồ sơ sức khỏe ban đầu',
    features: [
      '1 lượt bác sĩ thăm khám tận nhà',
      '1 lượt tư vấn video Telehealth',
      'Đánh giá nguy cơ sức khỏe các thành viên',
    ],
  },
];

const FACILITY_CARE_PACKAGES = [
  {
    id: 'FAC_STANDARD',
    name: 'Gói Ngoại Trú Ưu Tiên Fast-Track',
    badge: '3 Tháng',
    price: '1.800.000đ',
    monthlyPrice: '600.000đ/tháng',
    popular: true,
    highlight: 'Lối đi ưu tiên tại cơ sở đối tác không chờ đợi',
    features: [
      'Ưu tiên lịch khám cùng Trưởng/Phó khoa',
      'Miễn chờ xét nghiệm máu & Chẩn đoán hình ảnh',
      'Bảo lãnh viện phí trực tiếp',
    ],
  },
  {
    id: 'FAC_PREMIUM',
    name: 'Gói Nội Trú & Hội Chẩn Tuyến TW',
    badge: '12 Tháng',
    price: '5.500.000đ',
    monthlyPrice: 'Trọn gói năm',
    popular: false,
    highlight: 'Chăm sóc nội trú VIP & điều phối nhập viện nhanh',
    features: [
      'Hội đồng chuyên môn tuyến Trung ương hội chẩn',
      'Phòng nội trú đơn lập tiêu chuẩn quốc tế',
      'Bác sĩ điều phối hỗ trợ 24/7 tại viện',
    ],
  },
];

export function DoctorDetailView({ id = 'doc-01', type = 'doctor', onBack: _onBack }: DoctorDetailViewProps) {
  const normalizedId = (id || 'doc-01').toLowerCase();
  const isFacility = type === 'facility' || normalizedId.startsWith('fac');
  const doctor = DOCTORS_DATA[normalizedId] || DOCTORS_DATA[id] || DOCTORS_DATA['doc-01']!;
  const facility = FACILITIES_DATA[normalizedId] || FACILITIES_DATA[id] || FACILITIES_DATA['fac-01']!;
  const facilityDoctors = FACILITY_DOCTORS[normalizedId] || FACILITY_DOCTORS['fac-01']!;

  // Care Package Selection & Registration State
  const packagesList = isFacility ? FACILITY_CARE_PACKAGES : DOCTOR_CARE_PACKAGES;
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    isFacility ? 'FAC_STANDARD' : 'FAMILY'
  );
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    memberCount: '3 thành viên',
    note: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const activePackage =
    packagesList.find((p) => p.id === selectedPackageId) || packagesList[0]!;

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Chuyển hướng trực tiếp sang quy trình Hợp đồng y tế 4 Bên toàn màn hình
    const targetUrl = `/family/subscription/new?doctorId=${doctor.id}&packageId=${selectedPackageId}`;
    router.push(targetUrl);
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setFormData({ name: '', phone: '', memberCount: '3 thành viên', note: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 pb-20 md:pb-0">
      {/* 1. UNIFIED MEDSEV HEADER */}
      <LandingHeader />

      <main className="flex-1 pb-16">
        {/* 2. COMPACT BREADCRUMB (Cleaned: removed back button per Item 1) */}
        <section className="bg-white border-b border-slate-200 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="hover:text-[#0046c0] transition-colors">
                Trang chủ
              </Link>
              <span className="text-slate-300">/</span>
              <Link href="/doctors" className="hover:text-[#0046c0] transition-colors">
                {isFacility ? 'Cơ sở y tế đối tác' : 'Bác sĩ gia đình'}
              </Link>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-800 line-clamp-1">
                {isFacility ? facility.name : `${doctor.title} ${doctor.name}`}
              </span>
            </nav>
          </div>
        </section>

        {/* 3. MAIN CONTENT: 1-COLUMN FULL-WIDTH FOR FACILITY, 2-COLUMN FOR DOCTOR */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className={isFacility ? "w-full space-y-4 sm:space-y-5" : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"}>
            
            {/* MAIN COLUMN (Full width for Facility, 7 Columns for Doctor) */}
            <div className={isFacility ? "space-y-4 sm:space-y-5" : "lg:col-span-7 space-y-4"}>
              
              {/* Card 1: Facility Identity / Doctor Identity */}
              {isFacility ? (
                <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 space-y-5" data-purpose="facility-header">
                  {/* Top Section: Photo + Verification Badge + Facility Name + Address + Hotline & Call CTA */}
                  <div className="flex flex-col md:flex-row items-start gap-5">
                    {/* Facility Photo */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
                      <img
                        src={facility.imageUrl}
                        alt={facility.facility_name || facility.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    {/* Facility Main Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* verification_status: Trạng thái xác minh (Badge trạng thái) */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                          <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                          <span>Đã xác minh Bộ Y Tế</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0046c0] text-xs font-semibold border border-blue-200">
                          <span className="material-symbols-outlined text-sm">local_hospital</span>
                          <span>{facility.type}</span>
                        </span>
                      </div>

                      {/* facility_name: Tên cơ sở y tế (Tiêu đề chính) */}
                      <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                          {facility.facility_name || facility.name}
                        </h1>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                          Tuyến y tế liên kết trực thuộc mạng lưới y học gia đình FamiDoc Pro
                        </p>
                      </div>

                      {/* address: Địa chỉ (Địa chỉ cơ sở) */}
                      <div className="flex items-start gap-1.5 text-xs sm:text-sm text-slate-700">
                        <span className="material-symbols-outlined text-slate-400 text-base shrink-0 mt-0.5">location_on</span>
                        <span className="leading-relaxed">
                          <strong>Địa chỉ cơ sở:</strong> {facility.address} ({facility.city})
                        </span>
                      </div>

                      {/* hotline: Số điện thoại + Nút gọi điện */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-700">
                          <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">call</span>
                          <span><strong>Hotline:</strong> <span className="font-bold text-slate-900 tabular-nums">{facility.hotline || facility.phone}</span></span>
                        </div>
                        <a
                          href={`tel:${(facility.hotline || facility.phone).replace(/[^0-9]/g, '')}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0046c0] hover:bg-[#003899] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">call</span>
                          <span>Gọi điện ngay</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Legal Panel: license_number, tax_code, created_at, updated_at */}
                  <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* license_number: Số giấy phép hoạt động (Thông tin pháp lý) */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#0046c0]">badge</span>
                        <span>Số giấy phép hoạt động</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-1 tabular-nums">
                        {facility.license_number || 'GPHĐ: 001928/BYT-GPHĐ'}
                      </div>
                      <span className="text-[10px] text-slate-400">Thông tin pháp lý</span>
                    </div>

                    {/* tax_code: Mã số thuế (Thông tin pháp lý) */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#0046c0]">receipt_long</span>
                        <span>Mã số thuế</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-1 tabular-nums">
                        {facility.tax_code || '0102345892'}
                      </div>
                      <span className="text-[10px] text-slate-400">Thông tin pháp lý</span>
                    </div>

                    {/* created_at: Ngày tham gia hệ thống (Thông tin bổ sung) */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#0046c0]">calendar_today</span>
                        <span>Ngày tham gia hệ thống</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-1 tabular-nums">
                        {facility.created_at || '15/01/2024'}
                      </div>
                      <span className="text-[10px] text-slate-400">Thông tin bổ sung</span>
                    </div>

                    {/* updated_at: Cập nhật lần cuối (Thông tin bổ sung) */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#0046c0]">update</span>
                        <span>Cập nhật lần cuối</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-1 tabular-nums">
                        {facility.updated_at || '24/10/2026'}
                      </div>
                      <span className="text-[10px] text-slate-400">Thông tin bổ sung</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 p-5">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Doctor Photo */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img
                        src={doctor.avatarUrl}
                        alt={doctor.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    {/* Doctor Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#0046c0] text-[11px] font-semibold border border-blue-200/70">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          <span>Đã chứng thực CCHN</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Nhận phụ trách gia đình mới</span>
                        </span>
                      </div>

                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                          {doctor.title} {doctor.name}
                        </h1>
                        <p className="text-xs sm:text-sm font-semibold text-[#0046c0] mt-0.5">
                          {doctor.specialty}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-slate-400 text-sm">domain</span>
                          <span className="font-medium text-slate-800">{doctor.hospital}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-slate-400 text-sm">location_on</span>
                          <span>{doctor.location} • Nhận khám tại nhà</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Row for Doctor */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="py-1.5 px-2 rounded-md bg-slate-50 border border-slate-100">
                      <span className="block text-xs font-bold text-slate-900 tabular-nums">
                        {doctor.experienceYears} năm
                      </span>
                      <span className="text-[10px] text-slate-500">Kinh nghiệm</span>
                    </div>
                    <div className="py-1.5 px-2 rounded-md bg-slate-50 border border-slate-100">
                      <span className="block text-xs font-bold text-amber-600 tabular-nums flex items-center justify-center gap-0.5">
                        <span className="material-symbols-outlined text-xs material-symbols-filled">star</span>
                        <span>{doctor.rating}</span>
                      </span>
                      <span className="text-[10px] text-slate-500">{doctor.reviewCount} đánh giá</span>
                    </div>
                    <div className="py-1.5 px-2 rounded-md bg-slate-50 border border-slate-100">
                      <span className="block text-xs font-bold text-[#0046c0] tabular-nums">
                        {doctor.consultationCount}+
                      </span>
                      <span className="text-[10px] text-slate-500">Ca thăm khám</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Row: Specialties & Privileges (2 columns on lg for Facility, stacked for Doctor) */}
              <div className={isFacility ? "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5" : "space-y-4"}>
                {/* Card 2: Scope of Clinical Services */}
                <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0046c0] text-lg">home_health</span>
                      <span>{isFacility ? 'Các Chuyên Khoa Tiếp Nhận' : 'Quyền Lợi Chăm Sóc Cùng Bác Sĩ'}</span>
                    </h2>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-100">
                      {isFacility ? 'Tuyến Đầu Liên Kết' : 'Chuẩn Y học Gia đình'}
                    </span>
                  </div>

                  {isFacility ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {facility.specialties.map((spec, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-md border border-slate-100 flex items-center gap-2 text-xs text-slate-800 font-medium">
                          <span className="material-symbols-outlined text-[#0046c0] text-base">check_circle</span>
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-md border border-slate-200 bg-slate-50/60 space-y-1">
                        <div className="w-7 h-7 rounded bg-[#0046c0] text-white flex items-center justify-center">
                          <span className="material-symbols-outlined text-base">home</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs">Khám Tận Nhà</h3>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          Khám lâm sàng tại nhà, đo điện tim ECG và theo dõi định kỳ.
                        </p>
                      </div>

                      <div className="p-3 rounded-md border border-slate-200 bg-slate-50/60 space-y-1">
                        <div className="w-7 h-7 rounded bg-emerald-600 text-white flex items-center justify-center">
                          <span className="material-symbols-outlined text-base">videocam</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs">Telehealth 24/7</h3>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          Tư vấn video trực tiếp cùng bác sĩ Hoài khi có triệu chứng bất thường.
                        </p>
                      </div>

                      <div className="p-3 rounded-md border border-slate-200 bg-slate-50/60 space-y-1">
                        <div className="w-7 h-7 rounded bg-purple-600 text-white flex items-center justify-center">
                          <span className="material-symbols-outlined text-base">local_hospital</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs">Hỗ Trợ Tuyến Viện</h3>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          Đón tiếp ưu tiên và hội chẩn chuyên sâu tại BV Đại học Y Dược.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card 3: Verified Medical Degrees & Credentials */}
                <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0046c0] text-lg">school</span>
                    <span>{isFacility ? 'Đặc Quyền Cơ Sở' : 'Quá Trình Đào Tạo & Bằng Cấp Kiểm Định'}</span>
                  </h2>

                  {isFacility ? (
                    <div className="space-y-2">
                      {facility.privileges.map((priv, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2.5 rounded-md bg-slate-50 border border-slate-100 text-xs text-slate-700">
                          <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">verified</span>
                          <span className="font-medium">{priv}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2 text-xs text-slate-700">
                      {doctor.education.map((edu, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-md bg-slate-50 border border-slate-100">
                          <span className="material-symbols-outlined text-[#0046c0] text-base shrink-0 mt-0.5">verified</span>
                          <span className="leading-snug font-medium">{edu}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Card 4: Clinical Biography (Reduced corner radius per Item 4) */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0046c0] text-lg">clinical_notes</span>
                  <span>{isFacility ? 'Giới Thiệu Cơ Sở Y Tế' : 'Tiểu Sử Chuyên Môn Lâm Sàng'}</span>
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {isFacility
                    ? `${facility.name} là đối tác y tế chiến lược của FamiDoc Pro. Với trang thiết bị hiện đại, quy mô ${facility.bedCount} và đội ngũ y bác sĩ đầu ngành, cơ sở đảm bảo tiếp nhận, chẩn đoán và điều trị an toàn cho các thành viên trong gia đình.`
                    : doctor.bio}
                </p>
              </div>

              {/* Card 4.5: Affiliated Doctors List (Only for Facility) */}
              {isFacility && (
                <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4" data-purpose="facility-doctors-list">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#0046c0] text-lg">medical_services</span>
                        <span>Đội Ngũ Bác Sĩ &amp; Chuyên Gia Tại Cơ Sở</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Các bác sĩ có chứng chỉ hành nghề chính quy, phụ trách thăm khám và hội chẩn trực tiếp tại {facility.name}.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#0046c0] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full self-start sm:self-auto shrink-0">
                      {facilityDoctors.length} Bác sĩ tiêu biểu
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {facilityDoctors.map((docItem) => (
                      <div
                        key={docItem.id}
                        className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white flex flex-col justify-between group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img
                              src={docItem.avatarUrl}
                              alt={docItem.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-medium text-slate-500">{docItem.title}</span>
                              {docItem.badge && (
                                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                                  {docItem.badge}
                                </span>
                              )}
                            </div>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0046c0] transition-colors truncate">
                              {docItem.name}
                            </h3>
                            <p className="text-[11px] text-[#0046c0] font-medium truncate mt-0.5">
                              {docItem.specialty}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                              <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                                <span className="material-symbols-outlined text-xs material-symbols-filled">star</span>
                                <span>{docItem.rating}</span>
                              </span>
                              <span>•</span>
                              <span>{docItem.experienceYears} năm KN</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 truncate max-w-[140px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-slate-400">schedule</span>
                            <span>{docItem.schedule}</span>
                          </span>
                          <Link
                            href={`/doctors/${docItem.id}`}
                            className="text-xs font-semibold text-[#0046c0] hover:text-[#003899] hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            <span>Xem hồ sơ</span>
                            <span className="material-symbols-outlined text-xs transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}



              {/* Card 5: Real Verified Patient Reviews (Only for individual Doctors) */}
              {!isFacility && (
                <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-lg material-symbols-filled">reviews</span>
                      <span>Đánh Giá Từ Hộ Gia Đình Có Bác Sĩ Phụ Trách ({doctor.reviewCount})</span>
                    </h2>
                    <span className="text-xs text-amber-600 font-bold">{doctor.rating} / 5.0</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3.5 rounded-md bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800">Chị Mai Lan</span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            ✓ Hội viên Gói Đồng Hành (Quận 7)
                          </span>
                        </div>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className="material-symbols-outlined text-xs material-symbols-filled">star</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 italic leading-snug">
                        &quot;Gia đình tôi đăng ký gói chăm sóc có bác sĩ Hoài phụ trách đã được 6 tháng. Bác sĩ đến tận nhà kiểm tra tim mạch và huyết áp định kỳ cho mẹ tôi rất ân cần, bố mẹ tôi cực kỳ yên tâm.&quot;
                      </p>
                    </div>

                    <div className="p-3.5 rounded-md bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800">Anh Quốc Bảo</span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            ✓ Hội viên Gói An Tâm (Bình Thạnh)
                          </span>
                        </div>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className="material-symbols-outlined text-xs material-symbols-filled">star</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 italic leading-snug">
                        &quot;Có bác sĩ gia đình riêng như bác sĩ Hoài thực sự tiện lợi. Bác sĩ nắm rõ toàn bộ tiền sử bệnh của cả nhà, gọi video tư vấn lúc nào cũng cặn kẽ.&quot;
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN (5 COLUMNS): CARE PACKAGE SUBSCRIPTION WIDGET (Only for Doctors) */}
            {!isFacility && (
              <div id="booking-widget" className="lg:col-span-5 lg:sticky lg:top-20 space-y-3">
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs relative">
                  <div className="h-1 bg-[#0046c0] -mt-5 -mx-5 rounded-t-lg mb-4" />

                  {isSubmitted ? (
                    <div className="py-6 text-center space-y-3">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Đăng Ký Gói Thành Công!</h3>
                        <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                          Mã đăng ký: <strong className="tabular-nums text-[#0046c0]">#PKG-8921</strong>.
                          Chuyên viên FamiDoc và bác sĩ sẽ liên hệ số điện thoại <strong className="text-slate-900 tabular-nums">{formData.phone}</strong> trong vòng 15 phút để hoàn tất hồ sơ sức khỏe và hẹn buổi khám đầu tiên.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-left text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bác sĩ phụ trách:</span>
                          <span className="font-semibold text-slate-800">{doctor.title} {doctor.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Gói chăm sóc:</span>
                          <span className="font-semibold text-[#0046c0]">{activePackage.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Chi phí gói:</span>
                          <span className="font-semibold text-slate-900">{activePackage.price} ({activePackage.badge})</span>
                        </div>
                      </div>

                      <Link
                        href={`/family/subscription/new?doctorId=${doctor.id}&packageId=${selectedPackageId}`}
                        className="w-full py-2.5 bg-[#0046c0] hover:bg-[#003899] text-white text-center font-bold text-xs sm:text-sm rounded-md transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span>Vào Ký Hợp Đồng Điện Tử 4 Bên Ngay</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>

                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer pt-1"
                      >
                        <span className="material-symbols-outlined text-sm">restart_alt</span>
                        <span>Đăng ký thêm gói khác</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Bác Sĩ Gia Đình Riêng
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Đang nhận bệnh nhân
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                          Đăng Ký Gói Chăm Sóc Cùng Bác Sĩ
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                          Được {doctor.title} {doctor.name} trực tiếp đồng hành, theo dõi sức khỏe và thăm khám định kỳ tại nhà.
                        </p>
                      </div>

                      {/* Step 1: Care Package Selection Cards */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          1. Chọn gói chăm sóc phù hợp:
                        </label>
                        <div className="space-y-2">
                          {packagesList.map((pkg) => {
                            const isSelected = selectedPackageId === pkg.id;
                            return (
                              <div
                                key={pkg.id}
                                onClick={() => setSelectedPackageId(pkg.id)}
                                className={`p-3 rounded-md border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-[#0046c0] bg-blue-50/50 ring-1 ring-[#0046c0]'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="package"
                                      checked={isSelected}
                                      onChange={() => setSelectedPackageId(pkg.id)}
                                      className="text-[#0046c0] focus:ring-[#0046c0]"
                                    />
                                    <div>
                                      <span className="font-bold text-xs text-slate-900">
                                        {pkg.name}
                                      </span>
                                      <span className="ml-1.5 text-[10px] font-semibold text-[#0046c0] bg-blue-100/70 px-1.5 py-0.2 rounded">
                                        {pkg.badge}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-xs tabular-nums text-slate-900">
                                      {pkg.price}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1 pl-5 leading-snug">
                                  {pkg.highlight}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Active Package Features Summary */}
                      <div className="p-3 rounded-md bg-slate-50 border border-slate-200/80 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 block">
                          Quyền lợi trong {activePackage.name}:
                        </span>
                        <ul className="space-y-1 text-[11px] text-slate-600">
                          {activePackage.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="material-symbols-outlined text-[#0046c0] text-sm shrink-0">check</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Step 2: Simplified Registration Form */}
                      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                        <label className="block text-xs font-bold text-slate-700">
                          2. Thông tin đăng ký gói:
                        </label>

                        <div>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Họ và tên người đại diện gia đình *"
                            className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:border-[#0046c0] focus:ring-1 focus:ring-[#0046c0] bg-white"
                          />
                        </div>

                        <div>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Số điện thoại liên hệ nhận tư vấn *"
                            className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:border-[#0046c0] focus:ring-1 focus:ring-[#0046c0] bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={formData.memberCount}
                            onChange={(e) => setFormData({ ...formData, memberCount: e.target.value })}
                            className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:border-[#0046c0] bg-white"
                          >
                            <option value="1-2 thành viên">Quy mô: 1-2 người</option>
                            <option value="3 thành viên">Quy mô: 3-4 người</option>
                            <option value="5+ thành viên">Quy mô: 5+ người</option>
                          </select>

                          <input
                            type="text"
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            placeholder="Ghi chú (bệnh nền...)"
                            className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:border-[#0046c0] bg-white"
                          />
                        </div>

                        {/* Primary CTA Button */}
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-[#0046c0] hover:bg-[#003899] text-white text-center font-bold text-xs sm:text-sm rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-base">card_membership</span>
                          <span>Đăng Ký Gói Chăm Sóc Ngay</span>
                        </button>

                        <p className="text-[10px] text-center text-slate-500 leading-snug">
                          🔒 Hợp đồng y tế gia đình chính thức. Không phát sinh chi phí ẩn. Hỗ trợ thanh toán linh hoạt từng kỳ.
                        </p>
                      </form>
                    </div>
                  )}
                </div>

                {/* Clinical Care Guarantee Note for Doctor */}
                <div className="p-3 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[11px] space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[#0046c0] text-sm">verified_user</span>
                    <span>Cam kết Y tế FamiDoc Pro</span>
                  </div>
                  <p className="text-slate-500 leading-snug">
                    100% bác sĩ có Chứng Chỉ Hành Nghề chính quy. Bác sĩ phụ trách cam kết thăm khám đúng hẹn và bảo lãnh viện phí khi cần chuyển tuyến.
                  </p>
                </div>
              </div>
            )}

          </div>
        </section>
      </main>

      {/* 4. UNIFIED MEDSEV FOOTER */}
      <LandingFooter />

      {/* 5. STICKY MOBILE BOOKING BAR */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 md:hidden flex items-center justify-between gap-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        {isFacility ? (
          <>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Hotline tiếp nhận:</span>
              <span className="font-bold text-xs text-[#0046c0] tabular-nums">
                {facility.phone}
              </span>
            </div>
            <a
              href={`tel:${facility.phone.replace(/[^0-9]/g, '')}`}
              className="px-4 py-2 bg-[#0046c0] hover:bg-[#003899] text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">call</span>
              <span>Gọi hotline cơ sở</span>
            </a>
          </>
        ) : (
          <>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Gói chăm sóc từ:</span>
              <span className="font-bold text-xs text-[#0046c0] tabular-nums">
                {activePackage.monthlyPrice || activePackage.price}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const widget = document.getElementById('booking-widget');
                if (widget) {
                  widget.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setIsMobileSheetOpen(true);
                }
              }}
              className="px-4 py-2 bg-[#0046c0] hover:bg-[#003899] text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">card_membership</span>
              <span>Đăng ký gói chăm sóc</span>
            </button>
          </>
        )}
      </div>

      {/* Mobile Drawer/Modal Fallback */}
      {isMobileSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center md:hidden">
          <div className="bg-white rounded-t-xl w-full p-5 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-xs text-slate-900">
                Đăng Ký Gói Cùng Bác Sĩ {doctor.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Gói đã chọn: <strong className="text-[#0046c0]">{activePackage.name}</strong> ({activePackage.price})
            </div>

            <form onSubmit={(e) => { handleSubmit(e); setIsMobileSheetOpen(false); }} className="space-y-2.5">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Họ và tên người đại diện *"
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs bg-white"
              />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Số điện thoại nhận tư vấn *"
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs bg-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#0046c0] text-white font-bold text-xs rounded-md shadow-xs"
              >
                Xác nhận đăng ký gói
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LandingHeader, LandingFooter } from '@/features/landing';

export interface PackageDetailViewProps {
  packageId?: string;
}

interface PackageDetailConfig {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  popularBadge?: string;
  code: string;
  heroImg: string;
  price: string;
  originalPrice: string;
  monthlyEquiv: string;
  periodText: string;
  savingBadge: string;
  metrics: { label: string; value: string; desc: string; color: string; border?: string; bg?: string }[];
  doctor: { name: string; title: string; exp: string; avatar: string };
  homeVisits: { count: string; desc: string; advanceNotice: string; urgentTime: string; extraPrice: string };
  telehealth: { count: string; desc: string; responseTime: string; prescriptionDelivery: string; security: string };
  familyQuota: { maxPeople: string; desc: string; standards: string; addExtraPrice: string; accessType: string };
  hospitalAccess: { tag: string; desc: string; waitTime: string; techDiscount: string; insurance: string };
  tableItems: { title: string; quota: string; scope: string; extraCost: string; highlight?: boolean }[];
  faqs: { question: string; answer: string }[];
}

const PACKAGE_DETAILS: Record<string, PackageDetailConfig> = {
  'pkg-toan-dien': {
    id: 'pkg-toan-dien',
    name: 'Gói Gia Đình Toàn Diện',
    subtitle:
      'Giải pháp chăm sóc y tế chủ động trọn vẹn dành cho gia đình từ 3 - 4 thành viên, đồng hành cùng 1 Bác sĩ Chuyên khoa Gia đình CKI riêng biệt, thăm khám tận nơi và can thiệp kịp thời 24/7.',
    tag: 'Gói Đồng Hành Tiêu Chuẩn Gia Đình',
    popularBadge: '★ Được 68% gia đình lựa chọn',
    code: 'SCR-07-FAMILY',
    heroImg: '/images/medsev/service-details-bg.jpg',
    price: '4.245.000 đ',
    originalPrice: '4.715.000 đ',
    monthlyEquiv: '~ 1.415.000 đ / tháng cho cả gia đình 4 người',
    periodText: 'Kỳ hạn 3 Tháng',
    savingBadge: 'Tiết kiệm 10%',
    metrics: [
      { label: 'Lượt khám tại nhà', value: '05 lượt', desc: 'Bác sĩ CKI tận nơi', color: 'text-[#0046c0]' },
      { label: 'Tư vấn Telehealth', value: '20 lượt', desc: 'WebRTC 24/7 trực tuyến', color: 'text-[#0046c0]' },
      { label: 'Quy mô bảo vệ', value: '4 người', desc: 'Hồ sơ gia đình liên thông', color: 'text-[#232323]' },
      { label: 'Ưu đãi xét nghiệm', value: '-15%', desc: 'Giao thuốc tận nhà 2h', color: 'text-[#0046c0]' },
    ],
    doctor: {
      name: 'BS.CKI Nguyễn Minh Tuấn',
      title: 'Bác sĩ phụ trách chính',
      exp: '15 năm kinh nghiệm Y học Gia đình',
      avatar: '/images/medsev/home-one/doctor/1.jpg',
    },
    homeVisits: {
      count: '5 Lượt Toàn Diện',
      desc: 'Bác sĩ Chuyên khoa Gia đình CKI thăm khám định kỳ hoặc đột xuất tại nhà: đo 6 chỉ số sinh hiệu, tim phổi, sàng lọc bệnh lý mạn tính (tiểu đường, tăng huyết áp), đánh giá môi trường sống.',
      advanceNotice: 'Trước tối thiểu 4h',
      urgentTime: 'Có mặt < 45 phút',
      extraPrice: '350.000 đ/lượt',
    },
    telehealth: {
      count: '20 Lượt Telehealth',
      desc: 'Video call mã hóa chuẩn WebRTC trực tiếp với Bác sĩ riêng. Đánh giá nhanh triệu chứng ban đầu, đọc kết quả xét nghiệm, tư vấn phác đồ dùng thuốc và phòng dịch theo mùa.',
      responseTime: 'Tức thì < 3 phút',
      prescriptionDelivery: 'Giao tận nhà trong 2h',
      security: 'Chuẩn HIPAA 256-bit',
    },
    familyQuota: {
      maxPeople: 'Tối Đa 4 Người',
      desc: 'Đồng bộ dữ liệu sức khỏe của bố, mẹ, con cái hoặc ông bà. Biểu đồ cảnh báo thông minh AI khi chỉ số đường huyết, huyết áp hoặc BMI dao động bất thường.',
      standards: 'Chuẩn HL7 / FHIR',
      addExtraPrice: '+75.000 đ/người/tháng',
      accessType: 'Phân quyền đa thiết bị',
    },
    hospitalAccess: {
      tag: 'Luồng Fast-Track Tuyến Đầu',
      desc: 'Đặc quyền đón tiếp Fast-Track không xếp hàng tại Bệnh viện Bạch Mai, ĐH Y Hà Nội, Bệnh viện Chợ Rẫy, Vinmec. Điều phối viên FamiDoc hỗ trợ thủ tục tận quầy.',
      waitTime: 'Ưu tiên số khám VIP',
      techDiscount: 'Giảm trực tiếp 10%',
      insurance: 'Hỗ trợ BHYT & Bảo hiểm tư nhân',
    },
    tableItems: [
      { title: '1. Khám tại nhà (Home Visit)', quota: '5 lượt', scope: 'Khám nội khoa, sinh hiệu, dinh dưỡng, tầm soát mạn tính', extraCost: '350.000 đ / lượt' },
      { title: '2. Tư vấn Telehealth WebRTC', quota: '20 buổi', scope: 'Video call HD 24/7 trực tiếp cùng Bác sĩ Chuyên khoa Gia đình CKI', extraCost: '120.000 đ / buổi' },
      { title: '3. Đón tiếp tại Cơ sở y tế (CSYT)', quota: 'Không giới hạn', scope: 'Luồng Fast-Track đón tiếp ưu tiên tại BV Bạch Mai, ĐH Y, Chợ Rẫy', extraCost: 'Miễn phí điều phối viên' },
      { title: '4. Số thành viên thụ hưởng', quota: 'Tối đa 4 người', scope: 'Áp dụng cho gia đình hạt nhân: Vợ chồng, con cái hoặc ông bà', extraCost: '+75.000 đ / người / tháng' },
      { title: '5. Hồ sơ bệnh án điện tử (EHR)', quota: 'Trọn gói 24/7', scope: 'Lưu trữ trọn đời chuẩn HL7/FHIR, tích hợp trợ lý AI cảnh báo chỉ số', extraCost: 'Đã bao gồm trong gói' },
      { title: '6. Thời hạn hiệu lực', quota: '3 Tháng', scope: 'Có hiệu lực ngay khi kích hoạt hợp đồng điện tử 4 bên và thanh toán', extraCost: 'Gia hạn tự động giảm 5%' },
      { title: '7. Dịch vụ cận lâm sàng & Thuốc', quota: 'Giảm 15%', scope: 'Lấy mẫu xét nghiệm tại nhà, giao thuốc đạt chuẩn GPP hỏa tốc 2 giờ', extraCost: 'Theo hóa đơn GPP niêm yết', highlight: true },
    ],
    faqs: [
      {
        question: 'Gói có áp dụng cho tất cả 4 thành viên cùng lúc trong một buổi khám không?',
        answer: 'Có. Bác sĩ CKI có thể thực hiện kiểm tra định kỳ lần lượt cho cả 4 thành viên trong cùng 1 buổi khám tại gia đình nếu các thành viên có mặt và có nhu cầu theo dõi sức khỏe.',
      },
      {
        question: 'Khi dùng hết 5 lượt khám tại nhà thì gia đình xử lý như thế nào?',
        answer: 'Gia đình có thể mua thêm từng lượt khám tại nhà với giá ưu đãi riêng cho hội viên (350.000 đ/lượt thay vì giá gốc 550.000 đ) hoặc nâng cấp lên gói chu kỳ 6 tháng/12 tháng để tiết kiệm hơn.',
      },
      {
        question: 'Quy định đổi lịch khám và tiếp nhận tình huống khẩn cấp ra sao?',
        answer: 'Đối với lịch hẹn thường, quý gia đình chỉ cần thông báo trước 4 tiếng qua ứng dụng FamiDoc hoặc hotline 1900 8821. Đối với tình huống khẩn cấp, đội ngũ bác sĩ gia đình sẽ có mặt trong vòng 45 phút tại nội thành.',
      },
      {
        question: 'Đổi bác sĩ gia đình nếu không phù hợp phong cách chăm sóc có mất phí không?',
        answer: 'Hoàn toàn miễn phí 100%. Quý gia đình có quyền yêu cầu đổi Bác sĩ Chuyên khoa Gia đình CKI phụ trách bất kỳ lúc nào nếu cảm thấy phong cách giao tiếp hoặc chuyên môn chưa phù hợp.',
      },
    ],
  },
  'pkg-basic': {
    id: 'pkg-basic',
    name: 'Gói Chăm Sóc Cơ Bản',
    subtitle:
      'Bước khởi đầu trải nghiệm dịch vụ Bác sĩ Gia đình riêng biệt, hỗ trợ theo dõi sức khỏe ban đầu, giải đáp triệu chứng và kê đơn điện tử 24/7.',
    tag: '1 Tháng Khởi Đầu Thử Nghiệm',
    code: 'SCR-06-BASIC',
    heroImg: '/images/medsev/service-details-bg.jpg',
    price: '1.490.000 đ',
    originalPrice: '1.690.000 đ',
    monthlyEquiv: '1.490.000 đ / tháng cho cá nhân hoặc cặp đôi',
    periodText: 'Kỳ hạn 1 Tháng',
    savingBadge: 'Linh hoạt hàng tháng',
    metrics: [
      { label: 'Lượt khám tại nhà', value: '03 lượt', desc: 'Bác sĩ Tổng quát', color: 'text-[#0046c0]' },
      { label: 'Tư vấn Telehealth', value: '05 lượt', desc: 'Video call HD', color: 'text-[#0046c0]' },
      { label: 'Quy mô bảo vệ', value: '2 người', desc: 'Cá nhân & Cặp đôi', color: 'text-[#232323]' },
      { label: 'Ưu đãi xét nghiệm', value: '-10%', desc: 'Giao thuốc GPP 2h', color: 'text-[#0046c0]' },
    ],
    doctor: {
      name: 'ThS.BS Trần Thu Hà',
      title: 'Bác sĩ Chuyên khoa Gia đình',
      exp: '10 năm kinh nghiệm Nhi khoa & Đa khoa',
      avatar: '/images/medsev/home-one/doctor/2.jpg',
    },
    homeVisits: {
      count: '3 Lượt Khám',
      desc: 'Kiểm tra huyết áp, nhịp tim, đường huyết mao mạch, khám tai mũi họng và tư vấn sức khỏe tổng thể.',
      advanceNotice: 'Trước tối thiểu 6h',
      urgentTime: 'Có mặt < 60 phút',
      extraPrice: '380.000 đ/lượt',
    },
    telehealth: {
      count: '5 Lượt Telehealth',
      desc: 'Tư vấn trực tuyến qua video giải đáp triệu chứng và hướng dẫn dùng thuốc an toàn.',
      responseTime: 'Tức thì < 5 phút',
      prescriptionDelivery: 'Giao thuốc tận nhà',
      security: 'Bảo mật chuẩn y tế',
    },
    familyQuota: {
      maxPeople: '2 Người',
      desc: 'Phù hợp cặp vợ chồng trẻ, người độc thân hoặc 1 người già cần theo dõi cơ bản.',
      standards: 'Hồ sơ điện tử cơ bản',
      addExtraPrice: '+90.000 đ/người/tháng',
      accessType: 'Ứng dụng di động FamiDoc',
    },
    hospitalAccess: {
      tag: 'Tư Vấn Chuyển Tuyến',
      desc: 'Bác sĩ hỗ trợ viết giấy chuyển tuyến, tóm tắt bệnh án giúp việc khám tại bệnh viện nhanh gọn.',
      waitTime: 'Hướng dẫn quy trình khám',
      techDiscount: 'Giảm 5% xét nghiệm ngoài',
      insurance: 'Tư vấn quyền lợi BHYT',
    },
    tableItems: [
      { title: '1. Khám tại nhà (Home Visit)', quota: '3 lượt', scope: 'Khám tổng quát, đo sinh hiệu, tư vấn dinh dưỡng ban đầu', extraCost: '380.000 đ / lượt' },
      { title: '2. Tư vấn Telehealth', quota: '5 buổi', scope: 'Video call cùng Bác sĩ Gia đình qua ứng dụng', extraCost: '150.000 đ / buổi' },
      { title: '3. Hồ sơ sức khỏe cá nhân', quota: '1 Năm', scope: 'Lưu trữ thông tin bệnh án, tiền sử dị ứng thuốc điện tử', extraCost: 'Đã bao gồm' },
      { title: '4. Thời hạn gói', quota: '1 Tháng', scope: 'Gia hạn linh hoạt từng tháng không ràng buộc dài hạn', extraCost: 'Không phát sinh' },
    ],
    faqs: [
      { question: 'Gói này có được đổi sang gói 3 tháng hoặc 12 tháng không?', answer: 'Có, quý khách có thể nâng cấp bất kỳ lúc nào và được trừ toàn bộ số tiền chưa dùng của gói cũ.' },
    ],
  },
  'pkg-nguoi-cao-tuoi': {
    id: 'pkg-nguoi-cao-tuoi',
    name: 'Gói Chăm Sóc Người Cao Tuổi & Mạn Tính',
    subtitle:
      'Chuyên biệt hóa dành cho ông bà, cha mẹ có bệnh lý nền mạn tính (tăng huyết áp, đái tháo đường, tim mạch, COPD), kiểm soát chỉ số liên tục và dự phòng biến chứng.',
    tag: 'Chuyên Khoa Lão Khoa & Tim Mạch',
    code: 'SCR-06-ELDERLY',
    heroImg: '/images/medsev/home-one/4.jpg',
    price: '14.900.000 đ',
    originalPrice: '17.500.000 đ',
    monthlyEquiv: '~ 1.241.000 đ / tháng chăm sóc trọn vẹn 365 ngày',
    periodText: 'Kỳ hạn 12 Tháng',
    savingBadge: 'Ưu đãi tối đa',
    metrics: [
      { label: 'Khám tại nhà', value: '12 lượt', desc: '1 lượt định kỳ mỗi tháng', color: 'text-[#0046c0]' },
      { label: 'Tư vấn Telehealth', value: 'Không giới hạn', desc: 'Bác sĩ Tim mạch riêng', color: 'text-[#0046c0]' },
      { label: 'Xét nghiệm tại nhà', value: '02 đợt', desc: 'Trọn bộ 18 chỉ số máu', color: 'text-[#0046c0]' },
      { label: 'Thiết bị IoT Omron', value: 'Tặng kèm', desc: 'Đo huyết áp tự đồng bộ app', color: 'text-[#0046c0]' },
    ],
    doctor: {
      name: 'BS.CKII Lê Hoàng Nam',
      title: 'Trưởng ban Lão khoa & Tim Mạch',
      exp: '22 năm kinh nghiệm BV Bạch Mai',
      avatar: '/images/medsev/home-one/doctor/3.jpg',
    },
    homeVisits: {
      count: '12 Lượt / Năm',
      desc: 'Mỗi tháng bác sĩ chuyên khoa đến tận nhà thăm khám, đánh giá tác dụng phụ của thuốc, đo điện tim ECG và rà soát phác đồ điều trị.',
      advanceNotice: 'Trước 4h',
      urgentTime: 'Có mặt < 35 phút',
      extraPrice: '300.000 đ/lượt',
    },
    telehealth: {
      count: 'Không Giới Hạn Lượt',
      desc: 'Con cái và người nhà có thể gọi trực tiếp cho bác sĩ phụ trách bất kỳ khi nào chỉ số đường huyết hay huyết áp có biểu hiện bất thường.',
      responseTime: 'Tức thì < 2 phút',
      prescriptionDelivery: 'Giao thuốc mạn tính tận cửa hàng tháng',
      security: 'Mã hóa y tế chuẩn HIPAA',
    },
    familyQuota: {
      maxPeople: 'Người Cao Tuổi & Người Chăm Sóc',
      desc: 'Quản lý toàn diện sức khỏe của ông bà và kết nối tài khoản thông báo tự động cho con cái ở xa.',
      standards: 'Kết nối IoT máy Omron',
      addExtraPrice: '+60.000 đ/người/tháng',
      accessType: 'Cảnh báo tự động cho con cái',
    },
    hospitalAccess: {
      tag: 'Luồng Cấp Cứu & Nội Viện',
      desc: 'Ưu tiên tiếp nhận phòng cấp cứu và hội chẩn giáo sư chuyên khoa tim mạch / nội tiết khi cần can thiệp tại viện.',
      waitTime: 'Tiếp nhận phòng cấp cứu tức thì',
      techDiscount: 'Giảm 15% chụp MRI, CT Scanner',
      insurance: 'Bảo lãnh trực tiếp viện phí',
    },
    tableItems: [
      { title: '1. Khám tại nhà (Home Visit)', quota: '12 lượt', scope: 'Thăm khám chuyên khoa Lão khoa, đo điện tim tại nhà định kỳ hàng tháng', extraCost: '300.000 đ / lượt' },
      { title: '2. Tư vấn Telehealth WebRTC', quota: 'Không giới hạn', scope: 'Kiểm tra sinh hiệu và giải đáp đơn thuốc cùng Bác sĩ riêng', extraCost: 'Miễn phí trong gói' },
      { title: '3. Xét nghiệm định kỳ tại nhà', quota: '2 đợt trọn gói', scope: 'Xét nghiệm máu, đường huyết, mỡ máu, chức năng gan thận', extraCost: 'Miễn phí trong gói' },
      { title: '4. Tặng kèm thiết bị y tế IoT', quota: '1 Máy Omron', scope: 'Máy đo huyết áp Bluetooth tự đồng bộ vào app FamiDoc', extraCost: 'Tặng miễn phí' },
      { title: '5. Thời hạn hiệu lực', quota: '12 Tháng', scope: 'Bảo vệ liên tục 365 ngày trọn vẹn cả ngày Lễ & Tết', extraCost: 'Gia hạn giảm 10%' },
    ],
    faqs: [
      { question: 'Máy đo huyết áp Omron tặng kèm bảo hành bao lâu?', answer: 'Bảo hành chính hãng 5 năm và được bác sĩ hiệu chuẩn định kỳ mỗi đợt khám tại gia đình.' },
      { question: 'Người nhà ở xa có theo dõi được chỉ số huyết áp không?', answer: 'Có, mỗi lần ông bà đo huyết áp, app con cái sẽ nhận thông báo đẩy tức thì cùng đánh giá của AI.' },
    ],
  },
  'pkg-hoang-gia': {
    id: 'pkg-hoang-gia',
    name: 'Gói Gia Đình Hoàng Gia (VIP Concierge)',
    subtitle:
      'Đặc quyền chăm sóc y tế tư gia thượng lưu không giới hạn lượt cho đại gia đình, xe cấp cứu VIP chuyên dụng và hội đồng chuyên gia y tế 24/7.',
    tag: 'VIP Concierge Thượng Lưu',
    code: 'SCR-06-VIP',
    heroImg: '/images/medsev/home-one/6.jpg',
    price: '29.900.000 đ',
    originalPrice: '35.000.000 đ',
    monthlyEquiv: 'Đặc quyền quản gia y tế tư gia riêng 24/7',
    periodText: 'Kỳ hạn 12 Tháng VIP',
    savingBadge: 'Đặc quyền độc bản',
    metrics: [
      { label: 'Khám tại nhà', value: 'Không giới hạn', desc: 'Bác sĩ Trưởng khoa đến tận nơi', color: 'text-[#0046c0]' },
      { label: 'Tư vấn Telehealth', value: '24/7 Hotline', desc: 'Đường truyền riêng 24/7', color: 'text-[#0046c0]' },
      { label: 'Quy mô bảo vệ', value: 'Đại gia đình', desc: 'Lên đến 8 thành viên', color: 'text-[#232323]' },
      { label: 'Cấp cứu VIP', value: 'Phản ứng nhanh', desc: 'Xe cứu thương chuyên dụng', color: 'text-[#0046c0]' },
    ],
    doctor: {
      name: 'GS.TS Phạm Hoàng Long',
      title: 'Giám đốc Y khoa FamiDoc VIP',
      exp: '32 năm kinh nghiệm quản trị y tế quốc tế',
      avatar: '/images/medsev/home-one/doctor/1.jpg',
    },
    homeVisits: {
      count: 'Không Giới Hạn',
      desc: 'Bác sĩ Trưởng khoa và điều dưỡng chăm sóc bất kỳ lúc nào gia đình có nhu cầu.',
      advanceNotice: 'Gọi là có mặt ngay',
      urgentTime: 'Có mặt < 25 phút',
      extraPrice: '0 đ (Trọn gói)',
    },
    telehealth: {
      count: 'Không Giới Hạn 24/7',
      desc: 'Kênh liên lạc trực tiếp qua số hotline riêng và đường truyền mã hóa cấp cao.',
      responseTime: 'Tức thì < 30 giây',
      prescriptionDelivery: 'Cấp thuốc quốc tế & GPP hỏa tốc 1h',
      security: 'Bảo mật tuyệt đối HIPAA',
    },
    familyQuota: {
      maxPeople: 'Đại Gia Đình (Tối đa 8 người)',
      desc: 'Áp dụng cho mọi thành viên trong đại gia đình không giới hạn số lượng.',
      standards: 'Hồ sơ y tế quốc tế song ngữ',
      addExtraPrice: '0 đ',
      accessType: 'Phân quyền riêng tư từng người',
    },
    hospitalAccess: {
      tag: 'Fast-Track Quốc Tế',
      desc: 'Bảo lãnh viện phí toàn cầu, phòng VIP tổng thống và điều phối trực thăng cấp cứu liên kết.',
      waitTime: 'Không chờ đợi',
      techDiscount: 'Giảm 25% mọi dịch vụ',
      insurance: 'Bảo lãnh viện phí toàn cầu',
    },
    tableItems: [
      { title: '1. Khám tại nhà (Home Visit)', quota: 'Không giới hạn lượt', scope: 'Bác sĩ Trưởng khoa và điều dưỡng phục vụ tại tư gia', extraCost: 'Miễn phí 100%' },
      { title: '2. Tư vấn Telehealth', quota: 'Không giới hạn', scope: 'Đường truyền riêng 24/7 trực tiếp cùng GS.TS Y khoa', extraCost: 'Miễn phí 100%' },
      { title: '3. Ekip cấp cứu ICU', quota: '24/7 tức thì', scope: 'Xe cấp cứu chuyên dụng trang bị máy thở và sốc tim hiện đại', extraCost: 'Miễn phí 100%' },
      { title: '4. Bảo lãnh viện phí quốc tế', quota: 'Toàn cầu', scope: 'Vinmec, Pháp Việt, Raffles Hospital Singapore', extraCost: 'Miễn phí thủ tục' },
    ],
    faqs: [
      { question: 'Gói Hoàng Gia có hỗ trợ cấp cứu chuyển viện quốc tế không?', answer: 'Có, FamiDoc hợp tác cùng hệ thống SOS International hỗ trợ thủ tục bay cấp cứu sang Singapore hoặc Thái Lan.' },
    ],
  },
};

const BLOG_POSTS = [
  {
    id: 'blog-01',
    img: '/images/medsev/home-one/11.jpg',
    title: 'Hướng dẫn kiểm soát huyết áp & đường huyết tại nhà cho người cao tuổi',
    desc: 'Những nguyên tắc đo huyết áp chuẩn y khoa, biểu hiện cảnh báo nguy cơ đột quỵ sớm và chế độ ăn giảm natri tốt cho tim mạch.',
    date: '28/10/2026',
  },
  {
    id: 'blog-02',
    img: '/images/medsev/home-one/12.jpg',
    title: 'Lịch tiêm chủng và dinh dưỡng tăng cường miễn dịch cho bé dưới 3 tuổi',
    desc: 'Cập nhật phác đồ tiêm vắc-xin 6 trong 1, phế cầu và các vi chất dinh dưỡng thiết yếu giúp trẻ phát triển chiều cao và trí não tối ưu.',
    date: '24/10/2026',
  },
  {
    id: 'blog-03',
    img: '/images/medsev/home-one/13.jpg',
    title: 'Mô hình bác sĩ gia đình: Giải pháp giảm tải bệnh viện và phòng bệnh liên tục',
    desc: 'Tại sao việc có một bác sĩ gia đình am hiểu tiền sử sức khỏe cả nhà lại giúp tiết kiệm tới 40% chi phí y tế không cần thiết.',
    date: '15/10/2026',
  },
];

export function PackageDetailView({ packageId = 'pkg-toan-dien' }: PackageDetailViewProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const pkg = PACKAGE_DETAILS[packageId] || PACKAGE_DETAILS['pkg-toan-dien'];

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return;
    setLeadSuccess(true);
    setTimeout(() => {
      setLeadSuccess(false);
      setLeadName('');
      setLeadPhone('');
    }, 4000);
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
              {pkg.name}
            </h1>

            {/* Medsev Breadcrumbs */}
            <nav
              aria-label="Breadcrumb"
              className="inline-flex items-center justify-center gap-2 text-sm text-blue-100 font-medium"
            >
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-base">home</span>
                Trang chủ
              </Link>
              <span className="text-blue-200">/</span>
              <Link href="/packages" className="hover:text-white transition-colors">
                Gói dịch vụ
              </Link>
              <span className="text-blue-200">/</span>
              <span className="text-white font-semibold">{pkg.name}</span>
            </nav>
          </div>
        </section>

        {/* 3. MEDSEV SERVICE DETAILS AREA (.service-details-area.ptb-100) */}
        <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Section: Hero Image, Title & Pricing (.services-details-img) */}
          <div className="space-y-6 mb-16">
            {/* Hero Image */}
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-100 relative max-h-[500px]">
              <img
                src={pkg.heroImg}
                alt={pkg.name}
                className="w-full h-80 sm:h-[460px] object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 text-white text-xs font-semibold">
                  <span className="bg-[#0046c0] px-3.5 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span>{pkg.tag}</span>
                  </span>
                  {pkg.popularBadge && (
                    <span className="bg-amber-500 text-slate-900 px-3.5 py-1.5 rounded-full shadow-sm">
                      {pkg.popularBadge}
                    </span>
                  )}
                  <span className="bg-black/50 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/20">
                    Mã hồ sơ: {pkg.code}
                  </span>
                </div>
              </div>
            </div>

            {/* Title & Pricing Action Callout Bar */}
            <div className="bg-white rounded-2xl shadow-[0_0_25px_0_rgba(221,221,221,0.7)] p-6 sm:p-8 border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#0046c0] uppercase tracking-wider">{pkg.periodText}</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#232323]">{pkg.name}</h2>
                <p className="text-xs sm:text-sm text-[#4a6f8a]">{pkg.monthlyEquiv}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div className="text-left md:text-right">
                  <div className="text-xs text-slate-400 line-through">{pkg.originalPrice}</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-[#0046c0]">{pkg.price}</div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {pkg.savingBadge}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href="#dang-ky-tu-van"
                    className="flex-1 sm:flex-none py-3.5 px-6 rounded-lg bg-[#0046c0] hover:bg-[#111111] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-base">assignment</span>
                    <span>Đăng Ký Gói</span>
                  </a>

                  <a
                    href="tel:19008821"
                    className="py-3.5 px-4 rounded-lg bg-blue-50 text-[#0046c0] hover:bg-blue-100 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    title="Gọi Hotline 1900 8821"
                  >
                    <span className="material-symbols-outlined text-base">call</span>
                    <span>1900 8821</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Subtitle Description */}
            <p className="text-base sm:text-lg text-[#4a6f8a] leading-relaxed pt-2">
              {pkg.subtitle}
            </p>

            {/* Medsev Blockquote */}
            <blockquote className="bg-[#0046c0]/[0.08] p-6 sm:p-8 rounded-xl border-l-4 border-[#0046c0] text-[#4a6f8a] italic my-6 relative">
              <span className="material-symbols-outlined text-5xl text-[#0046c0] absolute top-4 left-4 opacity-20 pointer-events-none">
                format_quote
              </span>
              <p className="relative z-10 pl-8 sm:pl-10 text-sm sm:text-base leading-relaxed font-medium not-italic text-slate-800">
                &ldquo;Mô hình Bác sĩ Gia đình FamiDoc Pro không chỉ can thiệp khi có triệu chứng, mà chủ động đồng hành,
                theo dõi liên tục các chỉ số sinh hiệu và thiết lập phác đồ dự phòng riêng biệt cho từng thành viên trong gia đình bạn.&rdquo;
              </p>
              <footer className="mt-3 pl-8 sm:pl-10 text-xs font-bold text-[#0046c0]">
                — Bác sĩ Phụ trách Chuyên môn: {pkg.doctor.name} ({pkg.doctor.title})
              </footer>
            </blockquote>

            {/* 4 Core Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {pkg.metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-center space-y-1 shadow-xs"
                >
                  <div className="text-xs font-semibold text-slate-500">{m.label}</div>
                  <div className="text-xl sm:text-2xl font-bold text-[#0046c0] font-mono">{m.value}</div>
                  <div className="text-xs text-slate-600">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Second Section: Two-Column Clinical Showcase (.service-details-inner & .service-details-inner-left) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-16 pt-8 border-t border-slate-100">
            {/* Left Column: Doctor Profile Card */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white relative bg-cover bg-center h-[420px]" style={{ backgroundImage: "url('/images/medsev/home-two/4.jpg')" }}>
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-900/40 to-transparent flex items-end p-6 sm:p-8">
                  <div className="space-y-3 w-full">
                    <div className="flex items-center gap-3">
                      <img
                        src={pkg.doctor.avatar}
                        alt={pkg.doctor.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                      />
                      <div className="text-white">
                        <h4 className="font-bold text-base">{pkg.doctor.name}</h4>
                        <div className="text-xs text-blue-200">{pkg.doctor.title}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-200 border-t border-white/10 pt-2.5">
                      {pkg.doctor.exp} • Đảm nhiệm điều phối phác đồ thăm khám tận nhà và tư vấn Telehealth trực tiếp.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Detailed Clinical Scope */}
            <div className="lg:col-span-7 space-y-5">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#232323] leading-snug">
                Tiêu Chuẩn Thăm Khám &amp; Quyền Lợi Y Khoa Toàn Diện
              </h2>

              <p className="text-sm sm:text-base text-[#4a6f8a] leading-relaxed">
                Được thiết kế theo khuyến cáo của Hội Y học Gia đình Việt Nam, gói dịch vụ đảm bảo sự chăm sóc liên tục, bảo mật và tiếp cận mạng lưới chuyên gia y tế tuyến đầu một cách thuận tiện nhất.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0046c0] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-lg">home_health</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm text-slate-900">Bác sĩ chuyên khoa khám tận nhà ({pkg.homeVisits.count})</h5>
                    <p className="text-xs text-[#4a6f8a] leading-relaxed mt-0.5">{pkg.homeVisits.desc}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0046c0] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-lg">videocam</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm text-slate-900">Tư vấn trực tuyến WebRTC 24/7 ({pkg.telehealth.count})</h5>
                    <p className="text-xs text-[#4a6f8a] leading-relaxed mt-0.5">{pkg.telehealth.desc}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0046c0] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-lg">local_hospital</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm text-slate-900">{pkg.hospitalAccess.tag}</h5>
                    <p className="text-xs text-[#4a6f8a] leading-relaxed mt-0.5">{pkg.hospitalAccess.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Detailed Benefits Table */}
          <div className="space-y-6 mb-16 pt-8 border-t border-slate-100">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h3 className="text-2xl font-bold text-[#232323]">Bảng Chi Tiết Quyền Lợi &amp; Định Mức</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Minh bạch toàn bộ danh mục dịch vụ, hạn mức thụ hưởng và chi phí hỗ trợ hội viên.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#0046c0] text-white">
                    <tr>
                      <th className="py-4 px-5 font-semibold">Danh Mục Quyền Lợi</th>
                      <th className="py-4 px-5 font-semibold">Định Mức Gói</th>
                      <th className="py-4 px-5 font-semibold hidden md:table-cell">Phạm Vi Chăm Sóc</th>
                      <th className="py-4 px-5 font-semibold text-right">Chi Phí Vượt Mức</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pkg.tableItems.map((item, idx) => (
                      <tr key={idx} className={item.highlight ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50/60 transition-colors'}>
                        <td className="py-3.5 px-5 font-semibold text-slate-900">{item.title}</td>
                        <td className="py-3.5 px-5 font-bold text-[#0046c0] font-mono">{item.quota}</td>
                        <td className="py-3.5 px-5 text-slate-600 hidden md:table-cell">{item.scope}</td>
                        <td className="py-3.5 px-5 text-right font-medium text-slate-700">{item.extraCost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 4: Quick Consultation Lead Form & FAQ Accordion */}
          <div id="dang-ky-tu-van" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16 pt-8 border-t border-slate-100">
            {/* Lead Form (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 shadow-[0_0_25px_0_rgba(221,221,221,0.7)] border border-slate-100 space-y-5">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#0046c0] uppercase tracking-wider">Đăng Ký Tư Vấn</span>
                <h4 className="text-xl font-bold text-[#232323]">Nhận Tư Vấn Gói {pkg.name}</h4>
                <p className="text-xs text-slate-500">
                  Bác sĩ điều phối sẽ gọi lại trong vòng 15 phút để giải đáp tình trạng sức khỏe của từng thành viên.
                </p>
              </div>

              {leadSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-2">
                  <span className="material-symbols-outlined text-3xl text-emerald-600">check_circle</span>
                  <h5 className="font-bold text-sm text-emerald-900">Đã gửi yêu cầu thành công!</h5>
                  <p className="text-xs text-emerald-700">
                    Bác sĩ phụ trách gói sẽ liên hệ số điện thoại của bạn trong thời gian sớm nhất.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên của bạn *</label>
                    <input
                      type="text"
                      required
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full h-11 px-4 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0046c0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
                    <input
                      type="tel"
                      required
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full h-11 px-4 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0046c0]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-lg bg-[#0046c0] hover:bg-[#111111] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Gửi Yêu Cầu Tư Vấn</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>

                  <div className="text-[11px] text-slate-400 text-center">
                    Cam kết bảo mật dữ liệu theo quy định hồ sơ sức khỏe y tế.
                  </div>
                </form>
              )}
            </div>

            {/* FAQs Accordion (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#0046c0] uppercase tracking-wider">Hỏi Đáp Thường Gặp</span>
                <h4 className="text-xl font-bold text-[#232323]">Câu Hỏi Về Gói {pkg.name}</h4>
              </div>

              <div className="space-y-3 pt-2">
                {pkg.faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(idx)}
                        className={`w-full py-3.5 px-5 text-left text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isOpen ? 'bg-[#0046c0] text-white' : 'text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <span>{faq.question}</span>
                        <span className="material-symbols-outlined text-lg shrink-0">
                          {isOpen ? 'remove' : 'add'}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="p-5 text-xs sm:text-sm text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 4. MEDSEV BLOG SECTION (.blog-area.pt-100.pb-70) */}
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#232323] tracking-tight relative pb-4 inline-block after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-20 after:h-1 after:bg-[#0046c0] after:rounded">
                Cẩm Nang Y Học Gia Đình Liên Quan
              </h2>
              <p className="text-sm sm:text-base text-[#676767] leading-relaxed pt-2">
                Kiến thức chăm sóc sức khỏe dự phòng từ các chuyên gia y tế FamiDoc Pro.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {BLOG_POSTS.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_0_20px_0_rgba(221,221,221,0.6)] hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 overflow-hidden">
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

                    <div className="p-6 space-y-2.5">
                      <h3 className="font-bold text-base text-[#232323] group-hover:text-[#0046c0] transition-colors line-clamp-2 leading-snug">
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
          </div>
        </section>

        {/* 5. MEDSEV NEWSLETTER AREA (.newsletter-area) */}
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

      {/* 6. SHARED UNIFIED FOOTER */}
      <LandingFooter />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
      'Giải pháp chăm sóc y tế chủ động trọn vẹn dành cho gia đình hạt nhân từ 3 - 4 thành viên (bố mẹ và các con), đồng hành cùng 1 Bác sĩ Chuyên khoa Gia đình CKI riêng biệt, thăm khám tận nơi và can thiệp kịp thời 24/7.',
    tag: 'Gói Đồng Hành Tiêu Chuẩn Gia Đình',
    popularBadge: '★ Được 68% gia đình lựa chọn',
    code: 'SCR-07',
    heroImg:
      '/images/medsev/home-one/4.jpg',
    price: '4.245.000 đ',
    originalPrice: '4.715.000 đ',
    monthlyEquiv: '~ 1.415.000 đ / tháng cho cả gia đình 4 người',
    periodText: 'Đồng Hành 3 Tháng',
    savingBadge: 'Tiết kiệm 10%',
    metrics: [
      { label: 'Lượt khám tại nhà', value: '05 lượt', desc: 'Bác sĩ CKI tận nơi', color: 'text-[#003899]' },
      { label: 'Tư vấn Telehealth', value: '20 lượt', desc: 'WebRTC 24/7 trực tuyến', color: 'text-[#0046c0]' },
      { label: 'Quy mô bảo vệ', value: '4 người', desc: 'Hồ sơ gia đình liên thông', color: 'text-[#0f172a]' },
      { label: 'Ưu đãi xét nghiệm', value: '-15%', desc: 'Giao thuốc tận nhà 2h', color: 'text-[#ea580c]', border: 'border-amber-100', bg: 'bg-[#fffbeb]' },
    ],
    doctor: {
      name: 'BS.CKI Nguyễn Minh Tuấn',
      title: 'Bác sĩ phụ trách chính',
      exp: '15 năm kinh nghiệm Y học Gia đình',
      avatar:
        '/images/medsev/home-one/doctor/1.jpg',
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
        answer: 'Đối với lịch hẹn thường, quý gia đình chỉ cần thông báo trước 4 tiếng qua ứng dụng FamiDoc hoặc hotline 1900 6868. Đối với tình huống khẩn cấp, đội ngũ bác sĩ gia đình sẽ có mặt trong vòng 45 phút tại nội thành.',
      },
      {
        question: 'Đổi bác sĩ gia đình nếu không phù hợp phong cách chăm sóc có mất phí không?',
        answer: 'Hoàn toàn miễn phí 100%. Quý gia đình có quyền yêu cầu đổi Bác sĩ Chuyên khoa Gia đình CKI phụ trách bất kỳ lúc nào nếu cảm thấy phong cách giao tiếp hoặc chuyên môn chưa phù hợp.',
      },
      {
        question: 'Quy trình ký hợp đồng 4 bên và thanh toán VietQR diễn ra thế nào?',
        answer: 'Sau khi bấm Đăng ký, hệ thống sẽ sinh hợp đồng mẫu điện tử. Bạn kiểm tra thông tin thành viên, xác nhận mã OTP và quét mã VietQR tự động. Tài khoản Escrow bảo chứng sẽ giữ tiền và chỉ giải ngân theo từng tháng khi khách hàng hài lòng.',
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
    heroImg:
      '/images/medsev/home-one/1.jpg',
    price: '1.490.000 đ',
    originalPrice: '1.690.000 đ',
    monthlyEquiv: '1.490.000 đ / tháng cho cá nhân hoặc cặp đôi',
    periodText: 'Kỳ hạn 1 Tháng',
    savingBadge: 'Linh hoạt hàng tháng',
    metrics: [
      { label: 'Lượt khám tại nhà', value: '03 lượt', desc: 'Bác sĩ Tổng quát', color: 'text-[#003899]' },
      { label: 'Tư vấn Telehealth', value: '05 lượt', desc: 'Video call HD', color: 'text-[#0046c0]' },
      { label: 'Quy mô bảo vệ', value: '2 người', desc: 'Cá nhân & Cặp đôi', color: 'text-[#0f172a]' },
      { label: 'Ưu đãi xét nghiệm', value: '-10%', desc: 'Giao thuốc GPP 2h', color: 'text-[#ea580c]', border: 'border-amber-100', bg: 'bg-[#fffbeb]' },
    ],
    doctor: {
      name: 'ThS.BS Trần Thu Hà',
      title: 'Bác sĩ Chuyên khoa Gia đình',
      exp: '10 năm kinh nghiệm Nhi khoa & Đa khoa',
      avatar: '/images/medsev/home-one/doctor/2.jpg',
    },
    homeVisits: {
      count: '3 Lượt Khởi Đầu',
      desc: 'Bác sĩ kiểm tra sinh hiệu, khám nội khoa tổng quát và tư vấn phòng ngừa bệnh theo mùa tại nhà.',
      advanceNotice: 'Trước tối thiểu 6h',
      urgentTime: 'Có mặt < 60 phút',
      extraPrice: '400.000 đ/lượt',
    },
    telehealth: {
      count: '5 Lượt Telehealth',
      desc: 'Video call trực tiếp với Bác sĩ để theo dõi triệu chứng cấp và hướng dẫn điều trị tại nhà.',
      responseTime: 'Tức thì < 5 phút',
      prescriptionDelivery: 'Giao tận nhà trong 2h',
      security: 'Chuẩn HIPAA 256-bit',
    },
    familyQuota: {
      maxPeople: 'Tối Đa 2 Người',
      desc: 'Hồ sơ sức khỏe điện tử lưu trữ trực tuyến liên tục.',
      standards: 'Chuẩn HL7 / FHIR',
      addExtraPrice: '+90.000 đ/người/tháng',
      accessType: 'Phân quyền di động',
    },
    hospitalAccess: {
      tag: 'Tư Vấn Tuyến Trên',
      desc: 'Hỗ trợ đặt lịch khám ưu tiên tại các bệnh viện trung ương đối tác của FamiDoc.',
      waitTime: 'Đặt lịch trước 24h',
      techDiscount: 'Giảm 5%',
      insurance: 'Hỗ trợ thanh toán BHYT',
    },
    tableItems: [
      { title: '1. Khám tại nhà (Home Visit)', quota: '3 lượt', scope: 'Khám nội khoa, sinh hiệu, dinh dưỡng cơ bản', extraCost: '400.000 đ / lượt' },
      { title: '2. Tư vấn Telehealth WebRTC', quota: '5 buổi', scope: 'Video call HD cùng Bác sĩ Tổng quát', extraCost: '150.000 đ / buổi' },
      { title: '3. Đón tiếp tại Cơ sở y tế', quota: 'Hỗ trợ đặt lịch', scope: 'Ưu tiên kết nối tại các bệnh viện lớn', extraCost: 'Miễn phí' },
      { title: '4. Số thành viên thụ hưởng', quota: 'Tối đa 2 người', scope: 'Dành cho cá nhân hoặc vợ chồng', extraCost: '+90.000 đ / tháng' },
      { title: '5. Hồ sơ bệnh án điện tử (EHR)', quota: 'Trọn gói 24/7', scope: 'Lưu trữ trực tuyến liên tục', extraCost: 'Đã bao gồm' },
      { title: '6. Thời hạn hiệu lực', quota: '1 Tháng', scope: 'Gia hạn linh hoạt từng tháng', extraCost: 'Theo tháng' },
      { title: '7. Dịch vụ xét nghiệm & Thuốc', quota: 'Giảm 10%', scope: 'Giao thuốc GPP tận nơi 2h', extraCost: 'Theo hóa đơn', highlight: true },
    ],
    faqs: [
      { question: 'Gói Cơ bản có thể nâng cấp lên Gói Toàn Diện không?', answer: 'Có thể nâng cấp bất cứ lúc nào, phần phí chưa sử dụng sẽ được khấu trừ vào gói mới.' },
      { question: 'Có được chọn bác sĩ phụ trách không?', answer: 'Hệ thống tự động điều phối bác sĩ gần nhất hoặc bạn có thể chọn trong danh sách sẵn có.' },
    ],
  },
  'pkg-nguoi-cao-tuoi': {
    id: 'pkg-nguoi-cao-tuoi',
    name: 'Gói Người Cao Tuổi & Mạn Tính',
    subtitle:
      'Chương trình quản lý và điều trị liên tục bệnh mạn tính (tăng huyết áp, đái tháo đường, tim mạch) chuyên biệt cho cha mẹ già, đồng hành cùng Hội đồng Lão khoa.',
    tag: '12 Tháng Đồng Hành Chuyên Sâu',
    code: 'SCR-06-ELDERLY',
    heroImg:
      '/images/medsev/home-one/6.jpg',
    price: '16.490.000 đ',
    originalPrice: '20.600.000 đ',
    monthlyEquiv: '~ 1.374.000 đ / tháng (Tặng máy Omron Bluetooth)',
    periodText: 'Kỳ hạn 12 Tháng',
    savingBadge: 'Tiết kiệm 20%',
    metrics: [
      { label: 'Lượt khám tại nhà', value: '20 lượt', desc: 'Bác sĩ Lão khoa tận nơi', color: 'text-[#003899]' },
      { label: 'Tư vấn Telehealth', value: '96 lượt', desc: 'Theo dõi sinh tồn tuần', color: 'text-[#0046c0]' },
      { label: 'Quy mô bảo vệ', value: '6 người', desc: 'Hồ sơ đa thế hệ', color: 'text-[#0f172a]' },
      { label: 'Xét nghiệm tại nhà', value: '2 đợt', desc: 'Máu & sinh hóa định kỳ', color: 'text-[#ea580c]', border: 'border-orange-100', bg: 'bg-orange-50' },
    ],
    doctor: {
      name: 'PGS.TS Nguyễn Trọng Nghĩa',
      title: 'Bác sĩ Trưởng Hội đồng Lão khoa',
      exp: '28 năm kinh nghiệm Tim mạch & Lão khoa',
      avatar: '/images/medsev/home-one/doctor/3.jpg',
    },
    homeVisits: {
      count: '20 Lượt Chuyên Sâu',
      desc: 'Bác sĩ Lão khoa trực tiếp theo dõi biến chứng huyết áp, đái tháo đường, điều chỉnh liều thuốc định kỳ tại nhà.',
      advanceNotice: 'Trước 4h hoặc hẹn lịch định kỳ',
      urgentTime: 'Có mặt < 40 phút',
      extraPrice: '320.000 đ/lượt',
    },
    telehealth: {
      count: '96 Lượt Telehealth',
      desc: 'Gọi video hàng tuần kiểm tra nhật ký đường huyết, huyết áp và sinh hoạt hàng ngày.',
      responseTime: 'Tức thì < 2 phút',
      prescriptionDelivery: 'Cấp thuốc bảo hiểm & GPP tận giường',
      security: 'Mã hóa y tế chuẩn HIPAA',
    },
    familyQuota: {
      maxPeople: 'Tối Đa 6 Người',
      desc: 'Quản lý toàn bộ ông bà, cha mẹ và người chăm sóc phụ.',
      standards: 'Kết nối IoT máy Omron',
      addExtraPrice: '+60.000 đ/người/tháng',
      accessType: 'Cảnh báo tự động cho con cái',
    },
    hospitalAccess: {
      tag: 'Luồng Cấp Cứu & Nội Viện',
      desc: 'Ưu tiên giường bệnh và hội chẩn giáo sư chuyên khoa tim mạch / nội tiết khi chuyển viện.',
      waitTime: 'Tiếp nhận phòng cấp cứu tức thì',
      techDiscount: 'Giảm 15% chụp MRI, CT Scanner',
      insurance: 'Bảo lãnh trực tiếp viện phí',
    },
    tableItems: [
      { title: '1. Khám tại nhà (Home Visit)', quota: '20 lượt', scope: 'Thăm khám chuyên khoa Lão khoa, đo điện tim tại nhà', extraCost: '320.000 đ / lượt' },
      { title: '2. Tư vấn Telehealth WebRTC', quota: '96 buổi', scope: 'Kiểm tra sinh hiệu hàng tuần cùng Bác sĩ riêng', extraCost: '100.000 đ / buổi' },
      { title: '3. Xét nghiệm định kỳ tại nhà', quota: '2 đợt trọn gói', scope: 'Xét nghiệm máu, đường huyết, mỡ máu, chức năng gan thận', extraCost: 'Miễn phí trong gói' },
      { title: '4. Tặng kèm thiết bị y tế IoT', quota: '1 Máy Omron', scope: 'Máy đo huyết áp Bluetooth tự đồng bộ vào app', extraCost: 'Tặng miễn phí' },
      { title: '5. Thời hạn hiệu lực', quota: '12 Tháng', scope: 'Bảo vệ liên tục 365 ngày trọn vẹn', extraCost: 'Gia hạn giảm 10%' },
    ],
    faqs: [
      { question: 'Máy đo huyết áp Omron tặng kèm bảo hành bao lâu?', answer: 'Bảo hành chính hãng 5 năm và được bác sĩ hiệu chuẩn định kỳ mỗi đợt khám.' },
      { question: 'Người nhà ở xa có theo dõi được chỉ số huyết áp không?', answer: 'Có, mỗi lần ông bà đo huyết áp, app con cái sẽ nhận thông báo đẩy tức thì.' },
    ],
  },
  'pkg-hoang-gia': {
    id: 'pkg-hoang-gia',
    name: 'Gói Gia Đình Hoàng Gia (VIP Concierge)',
    subtitle:
      'Đặc quyền chăm sóc y tế tư gia thượng lưu không giới hạn lượt cho đại gia đình, xe cấp cứu VIP chuyên dụng và hội đồng chuyên gia y tế 24/7.',
    tag: 'VIP Concierge Thượng Lưu',
    code: 'SCR-06-VIP',
    heroImg:
      '/images/medsev/home-one/slider/1.png',
    price: '28.900.000 đ',
    originalPrice: '35.000.000 đ',
    monthlyEquiv: 'Đặc quyền quản gia y tế tư gia 24/7',
    periodText: 'Kỳ hạn 12 Tháng VIP',
    savingBadge: 'Đặc quyền độc bản',
    metrics: [
      { label: 'Khám tại nhà', value: 'Không giới hạn', desc: 'Bác sĩ Trưởng khoa đến tận nơi', color: 'text-[#003899]' },
      { label: 'Tư vấn Telehealth', value: '24/7 Hotline', desc: 'Đường truyền vệ tinh riêng', color: 'text-[#0046c0]' },
      { label: 'Quy mô bảo vệ', value: 'Đại gia đình', desc: 'Không giới hạn nhân khẩu', color: 'text-[#0f172a]' },
      { label: 'Cấp cứu VIP', value: 'Phản ứng nhanh', desc: 'Xe cứu thương ICU chuyên dụng', color: 'text-[#ea580c]', border: 'border-amber-200', bg: 'bg-amber-50' },
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
      maxPeople: 'Đại Gia Đình',
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

export function PackageDetailView({ packageId = 'pkg-toan-dien' }: PackageDetailViewProps) {
  const router = useRouter();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadScale, setLeadScale] = useState('3 - 4 người (Gia đình hạt nhân)');
  const [leadSuccess, setLeadSuccess] = useState(false);

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

  return (
    <div className="bg-slate-50 text-[#0f172a] font-sans antialiased min-h-screen selection:bg-blue-100 selection:text-[#003899]">
      {/* 1. SHARED UNIFIED HEADER */}
      <LandingHeader />

      {/* 2. MAIN BODY */}
      <main className="w-full bg-slate-50 min-h-[calc(100vh-320px)]">
        <div className="flex flex-col w-full">
          {/* Breadcrumbs & Quick Nav */}
          <section className="w-full bg-slate-100 py-2.5 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
            <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2">
              <nav className="flex items-center gap-1.5 text-xs text-[#475569] font-medium">
                <Link className="hover:text-[#0046c0] transition-colors flex items-center gap-1" href="/">
                  <span className="material-symbols-outlined text-sm">home</span> Trang chủ
                </Link>
                <span>/</span>
                <Link className="hover:text-[#0046c0] transition-colors" href="/packages">
                  Gói chăm sóc
                </Link>
                <span>/</span>
                <span className="text-[#0f172a] font-semibold truncate max-w-[260px] sm:max-w-none">
                  Chi tiết: {pkg.name} ({pkg.periodText})
                </span>
              </nav>

              <Link
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0046c0] hover:text-[#003899] transition-colors bg-white px-3.5 py-1.5 rounded-full shadow-xs border border-slate-200"
                href="/packages"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Quay lại danh mục gói</span>
              </Link>
            </div>
          </section>

          {/* Main Content Stage */}
          <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* LEFT COLUMN: Main Detail Content (8 Columns) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* 2.2 Thông tin tổng quan về gói */}
                <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm flex flex-col gap-4 border border-slate-200/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-[#003899] border border-blue-200">
                      <span className="w-2 h-2 rounded-full bg-[#0046c0] animate-pulse" />
                      {pkg.tag}
                    </span>
                    {pkg.popularBadge && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-[#b45309] border border-amber-200">
                        <span className="material-symbols-outlined text-[14px] text-[#f59e0b] material-symbols-filled">
                          star
                        </span>
                        {pkg.popularBadge}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                      <span className="material-symbols-outlined text-[14px] text-[#0046c0]">verified</span>
                      Mã hồ sơ: {pkg.code}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h1 className="text-2xl sm:text-3xl lg:text-[36px] tracking-tight font-extrabold text-[#0f172a] leading-tight">
                      {pkg.name}
                    </h1>
                    <p className="text-sm sm:text-base text-[#475569] leading-relaxed">{pkg.subtitle}</p>
                  </div>

                  {/* Featured Hero Image */}
                  <div className="relative rounded-xl overflow-hidden shadow-sm mt-2">
                    <img
                      className="w-full h-64 sm:h-80 object-cover object-center"
                      src={pkg.heroImg}
                      alt={pkg.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent flex items-end p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-2 w-full text-white text-xs">
                        <span className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700/60">
                          <span className="material-symbols-outlined text-sm text-blue-400">health_and_safety</span>
                          Bác sĩ CKI Thăm Khám Tận Nhà
                        </span>
                        <span className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700/60">
                          <span className="material-symbols-outlined text-sm text-blue-400">wifi_tethering</span>
                          Hồ Sơ Y Tế HL7/FHIR IoT
                        </span>
                        <span className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg ml-auto border border-amber-500/40 text-amber-100">
                          <span className="material-symbols-outlined text-sm text-[#f59e0b]">timer</span>
                          Cấp cứu &lt; 45 Phút
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Quick Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {pkg.metrics.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl flex flex-col gap-1 border ${
                          m.border || 'border-slate-100'
                        } ${m.bg || 'bg-slate-50'}`}
                      >
                        <span className="text-xs font-medium text-slate-500">{m.label}</span>
                        <span className={`text-xl font-bold ${m.color}`}>{m.value}</span>
                        <span className="text-[11px] text-slate-500">{m.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2.4 Quyền lợi chăm sóc sức khỏe cốt lõi */}
                <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm flex flex-col gap-4 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-6 rounded-full bg-[#0046c0]" />
                      <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">Quyền lợi y tế cốt lõi của gói</h2>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#003899]">
                      Bảo chứng lâm sàng FamiDoc
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bento 1: Home Visit */}
                    <div className="rounded-xl p-5 flex flex-col justify-between gap-4 border border-slate-100 bg-slate-50">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="p-2 rounded-lg bg-blue-100 text-[#003899]">
                            <span className="material-symbols-outlined text-2xl">home_health</span>
                          </span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full shadow-xs bg-white text-[#0046c0] border border-blue-200">
                            {pkg.homeVisits.count}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-[#0f172a] mt-1">Khám tại nhà (Home Visit)</h3>
                        <p className="text-xs text-[#475569] leading-relaxed">{pkg.homeVisits.desc}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white text-xs border border-slate-200/60 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Điều kiện đặt lịch:</span>
                          <span className="font-semibold text-[#003899]">{pkg.homeVisits.advanceNotice}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Can thiệp khẩn cấp:</span>
                          <span className="font-semibold text-[#ea580c]">{pkg.homeVisits.urgentTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Vượt định mức:</span>
                          <span className="font-semibold text-[#0f172a]">{pkg.homeVisits.extraPrice}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bento 2: Telehealth */}
                    <div className="rounded-xl p-5 flex flex-col justify-between gap-4 border border-slate-100 bg-slate-50">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="p-2 rounded-lg bg-blue-50 text-[#0046c0]">
                            <span className="material-symbols-outlined text-2xl">video_camera_front</span>
                          </span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full shadow-xs bg-white text-[#003899] border border-blue-200">
                            {pkg.telehealth.count}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-[#0f172a] mt-1">Tư vấn Telemedicine 24/7</h3>
                        <p className="text-xs text-[#475569] leading-relaxed">{pkg.telehealth.desc}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white text-xs border border-slate-200/60 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Thời gian phản hồi:</span>
                          <span className="font-semibold text-[#10b981]">{pkg.telehealth.responseTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Kê đơn điện tử:</span>
                          <span className="font-semibold text-[#0f172a]">{pkg.telehealth.prescriptionDelivery}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Đường truyền bảo mật:</span>
                          <span className="font-semibold text-[#0046c0]">{pkg.telehealth.security}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bento 3: Family Quota & EHR */}
                    <div className="rounded-xl p-5 flex flex-col justify-between gap-4 border border-slate-100 bg-slate-50">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="p-2 rounded-lg bg-amber-100 text-[#d97706]">
                            <span className="material-symbols-outlined text-2xl">family_restroom</span>
                          </span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full shadow-xs bg-white text-[#b45309] border border-amber-200">
                            {pkg.familyQuota.maxPeople}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-[#0f172a] mt-1">Hạn mức thành viên &amp; EHR</h3>
                        <p className="text-xs text-[#475569] leading-relaxed">{pkg.familyQuota.desc}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white text-xs border border-slate-200/60 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Hồ sơ liên thông:</span>
                          <span className="font-semibold text-[#0046c0]">{pkg.familyQuota.standards}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Thêm thành viên:</span>
                          <span className="font-semibold text-[#0f172a]">{pkg.familyQuota.addExtraPrice}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Quyền truy cập:</span>
                          <span className="font-semibold text-[#0f172a]">{pkg.familyQuota.accessType}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bento 4: Hospital Access */}
                    <div className="rounded-xl p-5 flex flex-col justify-between gap-4 border border-slate-100 bg-slate-50">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="p-2 rounded-lg bg-blue-50 text-[#003899]">
                            <span className="material-symbols-outlined text-2xl">local_hospital</span>
                          </span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full shadow-xs bg-white text-[#003899] border border-blue-200">
                            {pkg.hospitalAccess.tag}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-[#0f172a] mt-1">Khám tại cơ sở y tế đối tác</h3>
                        <p className="text-xs text-[#475569] leading-relaxed">{pkg.hospitalAccess.desc}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white text-xs border border-slate-200/60 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Thời gian chờ:</span>
                          <span className="font-semibold text-[#003899]">{pkg.hospitalAccess.waitTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Chụp chiếu kỹ thuật cao:</span>
                          <span className="font-semibold text-[#ea580c]">{pkg.hospitalAccess.techDiscount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Bảo lãnh viện phí:</span>
                          <span className="font-semibold text-[#0f172a]">{pkg.hospitalAccess.insurance}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2.5 Bảng đối chiếu quyền lợi chi tiết */}
                <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm flex flex-col gap-4 border border-slate-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-6 rounded-full bg-[#0046c0]" />
                      <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">Bảng đối chiếu quyền lợi tiêu chuẩn</h2>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                      Hạn ngạch tính trên {pkg.periodText}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="font-semibold bg-slate-50 text-[#0f172a]">
                          <th className="py-3 px-3.5 rounded-l-lg">Hạng mục quyền lợi</th>
                          <th className="py-3 px-3.5">Định mức gói</th>
                          <th className="py-3 px-3.5">Phạm vi phục vụ</th>
                          <th className="py-3 px-3.5 rounded-r-lg">Chi phí phát sinh ngoài gói</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[#475569]">
                        {pkg.tableItems.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-3.5 font-semibold text-[#0f172a] flex items-center gap-2">
                              <span className="material-symbols-outlined text-base text-[#10b981]">check_circle</span>
                              {row.title}
                            </td>
                            <td className={`py-3.5 px-3.5 font-bold ${row.highlight ? 'text-[#ea580c]' : 'text-[#0f172a]'}`}>
                              {row.quota}
                            </td>
                            <td className="py-3.5 px-3.5 leading-relaxed">{row.scope}</td>
                            <td className="py-3.5 px-3.5 font-medium text-[#0f172a]">{row.extraCost}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2.6 Điều kiện và quy định sử dụng gói */}
                <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm flex flex-col gap-4 border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-6 rounded-full bg-[#0046c0]" />
                    <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">Quy định và điều kiện sử dụng gói</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl flex flex-col gap-1.5 border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2 font-semibold text-sm text-[#0f172a]">
                        <span className="material-symbols-outlined text-lg text-[#0046c0]">fact_check</span>
                        Kích hoạt &amp; Chữ ký số
                      </div>
                      <p className="text-xs text-[#475569] leading-relaxed">
                        Hợp đồng y tế có hiệu lực pháp lý ngay sau khi hoàn tất ký điện tử 4 bên (Khách hàng, Bác sĩ phụ
                        trách, Giám đốc chuyên môn FamiDoc và Cơ sở y tế liên kết) qua mã OTP/CCCD.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl flex flex-col gap-1.5 border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2 font-semibold text-sm text-[#0f172a]">
                        <span className="material-symbols-outlined text-lg text-[#0046c0]">event_available</span>
                        Quy trình khấu trừ lượt khám
                      </div>
                      <p className="text-xs text-[#475569] leading-relaxed">
                        Hệ thống chỉ thực hiện trừ số lượt khi Bác sĩ hoàn thành biên bản thăm khám lâm sàng trên ứng dụng và
                        có xác nhận hoàn thành từ trưởng gia đình qua chữ ký số.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl flex flex-col gap-1.5 border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2 font-semibold text-sm text-[#0f172a]">
                        <span className="material-symbols-outlined text-lg text-[#0046c0]">edit_calendar</span>
                        Đổi hoặc Hủy lịch hẹn
                      </div>
                      <p className="text-xs text-[#475569] leading-relaxed">
                        Khách hàng được quyền đổi lịch khám tại nhà hoàn toàn miễn phí khi thông báo trước tối thiểu 04 giờ.
                        Nếu báo hủy sau 4 giờ, lượt khám sẽ được tính là đã sử dụng.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl flex flex-col gap-1.5 border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2 font-semibold text-sm text-[#0f172a]">
                        <span className="material-symbols-outlined text-lg text-[#ea580c]">shield_with_heart</span>
                        Phạm vi loại trừ y khoa
                      </div>
                      <p className="text-xs text-[#475569] leading-relaxed">
                        Gói không bao gồm chi phí phẫu thuật lớn, hồi sức tích cực tuyến cuối (ICU) hoặc các can thiệp tim
                        mạch phức tạp. FamiDoc hỗ trợ điều phối chuyển viện khẩn cấp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2.7 Câu hỏi thường gặp */}
                <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm flex flex-col gap-4 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-6 rounded-full bg-[#0046c0]" />
                      <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">Câu hỏi thường gặp về gói (FAQ)</h2>
                    </div>
                    <span className="text-xs text-[#475569]">Giải đáp y khoa 24/7</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {pkg.faqs.map((faq, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div
                          key={idx}
                          className="rounded-xl bg-slate-50 p-4 cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100"
                          onClick={() => toggleFaq(idx)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-xs sm:text-sm text-[#0f172a]">{faq.question}</span>
                            <span
                              className={`material-symbols-outlined text-[#475569] transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : 'rotate-0'
                              }`}
                            >
                              expand_more
                            </span>
                          </div>
                          {isOpen && (
                            <div className="mt-2 text-xs text-[#475569] leading-relaxed pt-2 border-t border-slate-200/50">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Sticky Summary & Checkout Card (4 Columns) */}
              <div className="lg:col-span-4 sticky top-24 flex flex-col gap-4">
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col gap-4 border-2 border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-[#003899]">
                      {pkg.periodText}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-[#b45309] border border-amber-200">
                      {pkg.savingBadge}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500">Chi phí trọn gói</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f172a]">{pkg.price}</span>
                      <span className="text-xs line-through text-slate-400">{pkg.originalPrice}</span>
                    </div>
                    <span className="text-xs font-medium mt-1 text-[#0046c0]">{pkg.monthlyEquiv}</span>
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 text-xs text-[#1e293b]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#10b981]">check_circle</span>
                      <span>
                        <strong>{pkg.homeVisits.count}</strong> bác sĩ CKI thăm khám tại nhà
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#10b981]">check_circle</span>
                      <span>
                        <strong>{pkg.telehealth.count}</strong> Telemedicine trực tuyến 24/7
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#10b981]">check_circle</span>
                      <span>
                        <strong>{pkg.familyQuota.maxPeople}</strong> trong cùng 1 hộ gia đình
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#10b981]">check_circle</span>
                      <span>
                        Luồng khám <strong>Fast-Track</strong> tại bệnh viện lớn
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#10b981]">check_circle</span>
                      <span>
                        Cam kết <strong className="text-[#059669]">hoàn tiền 100% trong 30 ngày</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/register?packageId=${pkg.id}`)}
                      className="w-full font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm text-white bg-[#0046c0] hover:bg-[#003899] shadow-[0_4px_14px_rgba(37,99,235,0.35)]"
                    >
                      <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
                      <span>Đăng ký gói chăm sóc này</span>
                    </button>
                    <a
                      href="tel:19006868"
                      className="w-full font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs border border-blue-200 bg-blue-50 text-[#003899] hover:bg-blue-100"
                    >
                      <span className="material-symbols-outlined text-base">support_agent</span>
                      <span>Nhận tư vấn từ Bác sĩ Trưởng khoa (Miễn phí)</span>
                    </a>
                  </div>

                  <Link
                    className="flex items-center justify-center gap-1.5 text-xs transition-colors text-center font-medium pt-1 text-slate-500 hover:text-blue-600"
                    href="/doctors"
                  >
                    <span className="material-symbols-outlined text-sm text-[#0046c0]">medical_services</span>
                    <span>Xem bác sĩ phụ trách và cơ sở y tế liên kết</span>
                  </Link>

                  <div className="p-3 rounded-xl flex flex-col gap-1 text-[11px] border border-emerald-100 bg-[#f0fdf4] text-[#166534]">
                    <div className="flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-sm text-[#10b981]">verified_user</span>
                      <span>Bảo chứng thanh toán an toàn Escrow</span>
                    </div>
                    <p className="text-[#15803d] leading-relaxed">
                      Hỗ trợ thanh toán VietQR tự động, thẻ tín dụng Visa/MasterCard. Hoàn trả tiền tức thì nếu không hài lòng sau buổi khám đầu tiên.
                    </p>
                  </div>
                </div>

                {/* Doctor In-Charge Mini Card */}
                <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3.5 border border-slate-200/80">
                  <img
                    className="w-12 h-12 rounded-full object-cover shadow-xs shrink-0 border-2 border-blue-100"
                    src={pkg.doctor.avatar}
                    alt={pkg.doctor.name}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-slate-500">{pkg.doctor.title}</span>
                    <span className="text-sm font-bold text-[#0f172a] truncate">{pkg.doctor.name}</span>
                    <span className="text-[11px] truncate font-medium text-[#0046c0]">{pkg.doctor.exp}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2.8 Khu vực Call-to-Action Banner cuối trang */}
          <section className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8 mt-8 border-t border-slate-800 bg-[#0f172a] text-white">
            <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full w-fit bg-amber-500/15 text-[#f59e0b] border border-amber-500/30">
                  <span className="material-symbols-outlined text-sm">alarm</span>
                  <span>Tư vấn trực tiếp cùng Bác sĩ Chuyên khoa</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Cần thêm thông tin để chọn gói phù hợp nhất cho tổ ấm của bạn?
                </h2>
                <p className="text-xs sm:text-sm max-w-xl leading-relaxed text-slate-300">
                  Đội ngũ Bác sĩ Gia đình FamiDoc luôn sẵn sàng giải đáp mọi thắc mắc về tiền sử bệnh lý, quy trình thăm
                  khám tại nhà và hỗ trợ thiết kế phác đồ chăm sóc cá nhân hóa cho từng thành viên.
                </p>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-2">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-2xl text-[#f59e0b]">call</span>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-400">Tổng đài Y tế Toàn quốc</span>
                      <span className="text-lg font-bold text-[#f59e0b]">1900 6868</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-700 hidden sm:block" />
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-2xl text-[#10b981]">security</span>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-400">Bảo hiểm &amp; Hợp đồng</span>
                      <span className="text-xs font-semibold text-white">
                        Bảo chứng Escrow <strong className="text-[#10b981]">100%</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Đăng ký tư vấn */}
              <div className="lg:col-span-5 rounded-2xl p-6 shadow-2xl flex flex-col gap-3 border border-slate-700/80 bg-[#1e293b]">
                <h3 className="font-bold text-sm text-white">Đăng ký gọi lại trong 15 phút</h3>
                <p className="text-[11px] text-slate-400">
                  Bác sĩ chuyên môn sẽ liên hệ tư vấn trực tiếp theo số điện thoại của bạn.
                </p>

                {leadSuccess ? (
                  <div className="p-3.5 rounded-xl bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                    <span>Cảm ơn quý khách! Bác sĩ FamiDoc sẽ gọi lại trong 15 phút.</span>
                  </div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="flex flex-col gap-2.5">
                    <input
                      className="w-full bg-white text-xs px-3.5 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 border border-slate-300 text-[#0f172a]"
                      placeholder="Họ và tên của bạn"
                      required
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                    />
                    <input
                      className="w-full bg-white text-xs px-3.5 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 border border-slate-300 text-[#0f172a]"
                      placeholder="Số điện thoại liên hệ (VD: 0912 345 678)"
                      required
                      type="tel"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                    />
                    <select
                      className="w-full bg-white text-xs px-3.5 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 border border-slate-300 text-[#0f172a]"
                      value={leadScale}
                      onChange={(e) => setLeadScale(e.target.value)}
                    >
                      <option>Số lượng thành viên cần chăm sóc (Mặc định: 3 - 4 người)</option>
                      <option>2 người (Cặp đôi / Vợ chồng trẻ)</option>
                      <option>3 - 4 người (Gia đình hạt nhân)</option>
                      <option>Từ 5 người trở lên (Tam đại đồng đường)</option>
                    </select>
                    <button
                      className="w-full font-bold py-2.5 px-4 rounded-lg shadow-md transition-all text-xs flex items-center justify-center gap-1.5 mt-1 text-white bg-[#ea580c] hover:brightness-105 shadow-[0_4px_12px_rgba(234,88,12,0.35)]"
                      type="submit"
                    >
                      <span className="material-symbols-outlined text-base">phone_in_talk</span>
                      <span>Gửi yêu cầu Bác sĩ gọi lại</span>
                    </button>
                  </form>
                )}
                <span className="text-[10px] text-center text-slate-400">
                  Thông tin của bạn được bảo mật tuyệt đối theo tiêu chuẩn HIPAA.
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 3. SHARED UNIFIED FOOTER */}
      <LandingFooter />
    </div>
  );
}



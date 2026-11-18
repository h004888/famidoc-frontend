export interface B2bStandardArticle {
  title: string;
  body: string;
}

export const B2B_LEGAL_BASIS_ITEMS: string[] = [
  'Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;',
  'Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;',
  'Luật Khám bệnh, chữa bệnh số 15/2023/QH15 và Nghị định số 96/2023/NĐ-CP;',
  'Thông tư số 21/2019/TT-BYT và Thông tư số 32/2023/TT-BYT của Bộ Y tế;',
  'Luật Giao dịch điện tử số 20/2023/QH15 ngày 22/06/2023;',
  'Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và Nghị định số 13/2023/NĐ-CP.',
];

export function buildB2bStandardArticles(params: {
  facilitySharePercent: number;
  platformSharePercent: number;
  endDateText: string;
}): B2bStandardArticle[] {
  return [
    {
      title: 'Điều 1. Giải thích thuật ngữ',
      body: 'Quy định khái niệm Nền tảng FamiDoc, Hợp đồng Dịch vụ 4 bên (MedicalContract), quy trình Thẩm định 2 cấp (CSYT Cấp 1 — FamiDoc Cấp 2) và giới hạn Định biên hộ gia đình tối đa 30 hộ gia đình/bác sĩ.',
    },
    {
      title: 'Điều 2. Phạm vi và Mô hình hợp tác',
      body: 'Bên B cung ứng đội ngũ Bác sĩ thuộc quản lý hợp pháp để khám chữa bệnh tại nhà, Telehealth và khám tại cơ sở trên Nền tảng FamiDoc; Bên A vận hành hạ tầng công nghệ, điều phối ký kết 4 bên, thu hộ VietQR và đối soát giải ngân.',
    },
    {
      title: 'Điều 3. Tiêu chuẩn Nhân sự Y tế & Thẩm định 2 cấp',
      body: 'Bác sĩ trực thuộc phải nộp đủ 03 tài liệu scan bắt buộc (CCHN/GPHN còn hiệu lực, Bằng tốt nghiệp chuyên môn y khoa, Chứng chỉ Y học gia đình) và hoàn tất thẩm định 2 cấp trước khi đạt trạng thái ACTIVE.',
    },
    {
      title: 'Điều 4. Tỷ lệ phân chia doanh thu, Đối soát & Nghĩa vụ thuế',
      body: `Áp dụng tỷ lệ ${params.facilitySharePercent}% cho Bên B (CSYT) và ${params.platformSharePercent}% phí vận hành nền tảng cho Bên A trên doanh thu thuần thực thu (tổng hóa đơn PAID trừ hoàn trả hợp lệ). Quyết toán định kỳ hằng tháng (dự kiến ngày 01–05 tháng kế tiếp) qua FacilitySettlement; mỗi Bên tự thực hiện nghĩa vụ thuế theo quy định.`,
    },
    {
      title: 'Điều 5. Quyền và Nghĩa vụ của Các Bên',
      body: 'Bên A vận hành ổn định, bảo mật và thanh toán đúng hạn, không can thiệp chuyên môn y khoa. Bên B chịu trách nhiệm pháp lý cơ sở chủ quản, duy trì Bảo hiểm trách nhiệm nghề nghiệp khám bệnh, chữa bệnh còn hiệu lực và liên đới bồi thường lỗi chuyên môn; bảo đảm tiếp nhận hồ sơ trong 24 giờ và tuân thủ định biên 30 hộ/bác sĩ.',
    },
    {
      title: 'Điều 6. Bảo vệ dữ liệu cá nhân, Bảo mật & Không lôi kéo',
      body: 'Tuân thủ Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 và Nghị định 13/2023/NĐ-CP đối với dữ liệu sức khỏe nhạy cảm; nghiêm cấm mua bán/chuyển giao trái phép dữ liệu bệnh nhân và không giao dịch ngoài nền tảng để né phí vận hành.',
    },
    {
      title: 'Điều 7. Hiệu lực, Sửa đổi & Đàm phán lại Hợp đồng',
      body: `Hợp đồng có hiệu lực sau khi hoàn tất 02 chữ ký điện tử tuần tự trên Documenso đến hết ngày ${params.endDateText}. Trước khi ký, Bên B có quyền gửi yêu cầu chỉnh sửa để Bên A cập nhật và phát hành lại dự thảo.`,
    },
    {
      title: 'Điều 8. Tạm ngừng, Chấm dứt hợp đồng & Nghĩa vụ bàn giao',
      body: 'Việc chấm dứt hợp đồng đang hiệu lực được kiểm soát phụ thuộc (Hợp đồng 4 bên đang chạy, lịch khám mở, khiếu nại và quyết toán tồn đọng). Khi TERMINATED, Bên B ngừng tạo bác sĩ/hợp đồng mới nhưng vẫn phối hợp hoàn tất hoặc bàn giao an toàn hợp đồng đang thực hiện; công nợ quyết toán hợp lệ được bảo toàn.',
    },
    {
      title: 'Điều 9. Công nhận chữ ký điện tử & Trình tự ký kết trên Documenso',
      body: 'Theo Luật Giao dịch điện tử 20/2023/QH15, chữ ký điện tử trên Documenso kèm nhật ký kiểm toán (IP, UTC+7, SHA-256) có giá trị pháp lý tương đương chữ ký tay và con dấu. Trình tự tuần tự: (1) Bên B ký trước; (2) Bên A ký chốt hiệu lực ACTIVE.',
    },
    {
      title: 'Điều 10. Bất khả kháng, Giải quyết tranh chấp & Hiệu lực chung',
      body: 'Thông báo bất khả kháng trong 48 giờ; ưu tiên hòa giải trong 15 ngày hoặc giải quyết tại Tòa án nhân dân có thẩm quyền tại Việt Nam. Văn bản điện tử lưu trữ toàn vẹn trên FamiDoc và Documenso có giá trị pháp lý như nhau.',
    },
  ];
}

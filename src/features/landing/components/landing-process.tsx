import React from 'react';

const PILLARS = [
  {
    num: 'Trụ cột 01',
    icon: 'home_health',
    title: 'Bác Sĩ Gia Đình Riêng',
    highlight: 'Hiện Diện Y Tế Tận Gia Kín Đáo',
    description:
      'Khám định kỳ tận nhà hàng tháng cho cả gia đình. Bác sĩ nắm rõ tiền sử bệnh lý, cơ địa và theo dõi sát sao tình trạng sức khỏe.',
    badge: 'Thăm khám tại gia',
  },
  {
    num: 'Trụ cột 02',
    icon: 'video_camera_front',
    title: 'Tư Vấn Telehealth 24/7',
    highlight: 'Hội Đồng Chuyên Gia Đầu Ngành',
    description:
      'Kết nối video HD trực tiếp với bác sĩ phụ trách mọi lúc, giải đáp triệu chứng và hướng dẫn điều trị kịp thời mà không cần chờ đợi.',
    badge: 'Hỗ trợ 24/7',
  },
  {
    num: 'Trụ cột 03',
    icon: 'nutrition',
    title: 'Phác Đồ Dinh Dưỡng Cá Nhân',
    highlight: 'Cá Nhân Hóa Toàn Diện',
    description:
      'Xây dựng thực đơn dinh dưỡng và lối sống lành mạnh cho từng thành viên, tối ưu phòng ngừa các bệnh tim mạch và chuyển hóa.',
    badge: 'Cá nhân hóa',
  },
  {
    num: 'Trụ cột 04',
    icon: 'prescriptions',
    title: 'EHR & Dược Phẩm Tận Nơi',
    highlight: 'Biên Niên Sử Y Bạ Gia Tộc',
    description:
      'Hồ sơ bệnh án điện tử tập trung liên thông tuyến trung ương. Bác sĩ kê đơn số và nhà thuốc GPP giao thuốc tận nhà nhanh chóng.',
    badge: 'Chuẩn HL7 FHIR',
  },
];

export function LandingProcess() {
  return (
    <section
      id="tru-cot"
      className="py-20 bg-[#faf8ff] relative scroll-mt-20 border-b border-[#c4c5d7]/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaedff] text-[#0037c1] text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-base">architecture</span>
            <span>Hệ Sinh Thái Y Tế FamiDoc 360°</span>
            <span className="sr-only">Chương II · The Three Pillars</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#131b2f] tracking-tight">
            4 Trụ Cột Đổi Mới Toàn Diện Trải Nghiệm Khám Chữa Bệnh
          </h2>
          <span className="sr-only">Ba Trụ Cột Chăm Sóc Độc Bản</span>

          <p className="text-base text-[#444654]">
            Chuyển dịch từ y tế thụ động sang mô hình y học dự phòng chủ động, chăm sóc cá nhân hóa
            với sự tận tâm của đội ngũ Bác sĩ Gia đình và nền tảng Telehealth hiện đại.
          </p>
        </div>

        {/* 4 Pillars Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.num}
              className="bg-white rounded-3xl p-6 border border-[#c4c5d7]/70 shadow-sm hover:shadow-xl hover:border-[#0037c1] transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#eaedff] text-[#0037c1] flex items-center justify-center group-hover:bg-[#0037c1] group-hover:text-white transition-colors duration-200 shadow-sm">
                  <span className="material-symbols-outlined text-3xl">{pillar.icon}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#0037c1]">{pillar.num}</span>
                  <h3 className="text-lg font-bold text-[#131b2f]">{pillar.title}</h3>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[#0037c1]">{pillar.highlight}</div>
                  <p className="text-sm text-[#444654] leading-relaxed">{pillar.description}</p>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-[#f2f3ff] flex items-center justify-between text-xs font-semibold text-[#0037c1]">
                <span>{pillar.badge}</span>
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

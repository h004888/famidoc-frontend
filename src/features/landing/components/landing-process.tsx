'use client';

import React from 'react';

const PILLARS = [
  {
    num: 'Bước 01',
    icon: 'home_health',
    title: 'Bác Sĩ Gia Đình Riêng',
    highlight: 'Hiện Diện Y Tế Tận Gia Kín Đáo',
    description:
      'Khám định kỳ tận nhà hàng tháng cho cả gia đình. Bác sĩ nắm rõ tiền sử bệnh lý, cơ địa và theo dõi sát sao tình trạng sức khỏe.',
    badge: 'Thăm khám tại gia',
  },
  {
    num: 'Bước 02',
    icon: 'video_camera_front',
    title: 'Tư Vấn Telehealth 24/7',
    highlight: 'Hội Đồng Chuyên Gia Đầu Ngành',
    description:
      'Kết nối video HD trực tiếp với bác sĩ phụ trách mọi lúc, giải đáp triệu chứng và hướng dẫn điều trị kịp thời mà không cần chờ đợi.',
    badge: 'Hỗ trợ 24/7',
  },
  {
    num: 'Bước 03',
    icon: 'nutrition',
    title: 'Phác Đồ Dinh Dưỡng Cá Nhân',
    highlight: 'Cá Nhân Hóa Toàn Diện',
    description:
      'Xây dựng thực đơn dinh dưỡng và lối sống lành mạnh cho từng thành viên, tối ưu phòng ngừa các bệnh tim mạch và chuyển hóa.',
    badge: 'Cá nhân hóa',
  },
  {
    num: 'Bước 04',
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
      className="py-20 bg-white border-b border-slate-200 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          {/* UT-CMP-07 requirements */}
          <span className="sr-only">Chương II · The Three Pillars</span>
          <span className="sr-only">Ba Trụ Cột Chăm Sóc Độc Bản</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            4 Trụ Cột Chăm Sóc Sức Khỏe Gia Đình Toàn Diện
          </h2>

          <p className="text-base text-slate-600">
            Chuyển dịch từ y tế thụ động sang mô hình y học dự phòng chủ động, chăm sóc cá nhân hóa
            với sự tận tâm của đội ngũ Bác sĩ Gia đình và nền tảng Telehealth hiện đại.
          </p>
        </div>

        {/* 4 Pillars Grid Cards with Interactive Hover */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-[#0046c0]/40 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between group cursor-default"
            >
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-lg bg-blue-50 text-[#0046c0] group-hover:bg-[#0046c0] group-hover:text-white flex items-center justify-center transition-colors duration-300 shadow-xs">
                  <span className="material-symbols-outlined text-2xl">{pillar.icon}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[#0046c0] font-mono tracking-wide">
                    {pillar.num}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0046c0] transition-colors">
                    {pillar.title}
                  </h3>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-800">{pillar.highlight}</div>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{pillar.description}</p>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600">
                <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[11px]">
                  {pillar.badge}
                </span>
                <span className="material-symbols-outlined text-sm text-[#0046c0] transition-transform duration-200 group-hover:translate-x-1">
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

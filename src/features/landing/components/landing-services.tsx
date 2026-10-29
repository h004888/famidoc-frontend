'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ServiceItem {
  icon: string;
  title: string;
  enTitle: string;
  desc: string;
  href: string;
  category: 'home' | 'lab' | 'emergency';
}

const SERVICES: ServiceItem[] = [
  {
    icon: 'clinical_notes',
    title: 'Bác Sĩ Gia Đình',
    enTitle: 'Family Medicine',
    desc: 'Bác sĩ chuyên khoa khám tận nhà định kỳ, nắm rõ hồ sơ bệnh sử và lối sống từng thành viên.',
    href: '/doctors',
    category: 'home',
  },
  {
    icon: 'stethoscope',
    title: 'Chẩn Đoán Lâm Sàng',
    enTitle: 'Clinical Diagnosis',
    desc: 'Thăm khám tổng quát, đo chỉ số sinh tồn và phát hiện sớm các nguy cơ tim mạch, chuyển hóa.',
    href: '/packages',
    category: 'lab',
  },
  {
    icon: 'biotech',
    title: 'Xét Nghiệm Tại Nhà',
    enTitle: 'Pathology & Lab',
    desc: 'Lấy mẫu máu, nước tiểu tại nhà riêng. Kết quả trả nhanh trực tuyến trên ứng dụng FamiDoc.',
    href: '/packages',
    category: 'lab',
  },
  {
    icon: 'dentistry',
    title: 'Nha Khoa Gia Đình',
    enTitle: 'Dental Care',
    desc: 'Chăm sóc răng miệng định kỳ, phòng ngừa sâu răng cho trẻ nhỏ và phục hình răng người lớn tuổi.',
    href: '/packages',
    category: 'home',
  },
  {
    icon: 'ecg_heart',
    title: 'Tim Mạch & Huyết Áp',
    enTitle: 'Cardiology',
    desc: 'Theo dõi chỉ số huyết áp liên tục, phác đồ điều trị và cảnh báo nguy cơ đột quỵ sớm cho người cao tuổi.',
    href: '/packages',
    category: 'lab',
  },
  {
    icon: 'medication',
    title: 'Nhà Thuốc & Đơn Điện Tử',
    enTitle: 'Pharmacy & Medicine',
    desc: 'Bác sĩ kê đơn số trên ứng dụng, liên kết mạng lưới nhà thuốc GPP giao thuốc tận nhà an toàn.',
    href: '/contact',
    category: 'home',
  },
  {
    icon: 'psychology',
    title: 'Thần Kinh & Lão Khoa',
    enTitle: 'Neurology & Geriatrics',
    desc: 'Tư vấn suy giảm trí nhớ, mất ngủ mạn tính và phục hồi chức năng thể chất cho người cao tuổi.',
    href: '/doctors',
    category: 'home',
  },
  {
    icon: 'ambulance',
    title: 'Cấp Cứu & Điều Phối 24/7',
    enTitle: 'Emergency Ambulance',
    desc: 'Đường dây nóng phản ứng nhanh < 25 phút. Hỗ trợ chuyển viện cấp cứu đến các bệnh viện tuyến đầu.',
    href: 'tel:19008821',
    category: 'emergency',
  },
];

export function LandingServices() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'home' | 'lab' | 'emergency'>('all');

  const filteredServices = SERVICES.filter((s) => {
    if (selectedFilter === 'all') return true;
    return s.category === selectedFilter;
  });

  return (
    <section id="dich-vu" className="py-20 bg-slate-50 border-b border-slate-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Chuyên Khoa &amp; Dịch Vụ Khám Chữa Bệnh
          </h2>

          <p className="text-base text-slate-600">
            Hệ thống giải pháp y học phòng ngừa, thăm khám tận nơi và điều trị tích hợp theo chuẩn quốc tế cho mọi thế hệ gia đình.
          </p>

          {/* Interactive Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-[#0046c0] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              Tất cả chuyên khoa ({SERVICES.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('home')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                selectedFilter === 'home'
                  ? 'bg-[#0046c0] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              Khám tại gia &amp; Thuốc
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('lab')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                selectedFilter === 'lab'
                  ? 'bg-[#0046c0] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              Chẩn đoán &amp; Xét nghiệm
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('emergency')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                selectedFilter === 'emergency'
                  ? 'bg-[#0046c0] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              Cấp cứu 24/7
            </button>
          </div>
        </div>

        {/* Clinical Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredServices.map((s, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg p-5 border border-slate-200 hover:border-[#0046c0]/40 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between group cursor-default"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded bg-blue-50 text-[#0046c0] group-hover:bg-[#0046c0] group-hover:text-white flex items-center justify-center transition-colors duration-300">
                    <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-500 uppercase tracking-wider transition-colors">
                    {s.enTitle}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0046c0] transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1.5 font-normal">
                    {s.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <Link
                  href={s.href}
                  className="text-xs font-semibold text-[#0046c0] hover:text-[#003899] flex items-center gap-1 group/btn"
                >
                  <span>Tìm hiểu thêm</span>
                  <span className="material-symbols-outlined text-sm transition-transform duration-200 group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

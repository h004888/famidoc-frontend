'use client';

import React from 'react';
import Link from 'next/link';
import { FacilityNav } from '@/components/layout';

export function FacilityDashboardView() {
  const stats = [
    {
      title: 'Bác sĩ trực thuộc',
      value: '48',
      subtitle: '42 đang trực chiến • 6 nghỉ phép',
      change: '+4 BS',
      period: 'tháng này',
      icon: 'badge',
      iconBg: 'bg-[#2E37A4]/10 text-[#2E37A4]',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      title: 'Lượt khám tháng này',
      value: '1.420',
      subtitle: '100% bệnh án điện tử đồng bộ',
      change: '+14.2%',
      period: 'so với tháng trước',
      icon: 'medical_services',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Chỉ số SLA đáp ứng',
      value: '98.4%',
      subtitle: 'Thời gian phản hồi TB 12 phút',
      change: 'Đạt chuẩn',
      period: 'Mục tiêu >= 95%',
      icon: 'verified',
      iconBg: 'bg-sky-50 text-sky-600',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      title: 'Doanh thu B2B tạm tính',
      value: '342.800.000 đ',
      subtitle: 'Tỷ lệ 70% cơ sở y tế (Tháng 10)',
      change: '+18.5%',
      period: 'Escrow sẵn sàng',
      icon: 'payments',
      iconBg: 'bg-amber-50 text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  const incomingReferrals = [
    {
      id: 'REF-8841',
      patientName: 'Lê Văn Nam (65 tuổi)',
      fromDoctor: 'BS.CKII Trần Thanh Mai',
      reason: 'Nghi ngờ cơn đau thắt ngực không ổn định, đề nghị Fast-Track chụp mạch vành can thiệp',
      department: 'Khoa Can thiệp Tim mạch',
      time: '10:15 Sáng nay',
      urgency: 'Khẩn cấp',
      status: 'Chờ phân giường',
      avatarText: 'VN',
    },
    {
      id: 'REF-8839',
      patientName: 'Phạm Thị Thùy (48 tuổi)',
      fromDoctor: 'ThS.BS Nguyễn Hữu Đạt',
      reason: 'Hội chẩn liên viện tổn thương phổi kẽ tiến triển sau nhiễm siêu vi',
      department: 'Khoa Hô hấp & Dị ứng',
      time: '09:30 Sáng nay',
      urgency: 'Ưu tiên',
      status: 'Xếp lịch 14:00',
      avatarText: 'TT',
    },
    {
      id: 'REF-8835',
      patientName: 'Bùi Gia Khiêm (8 tuổi)',
      fromDoctor: 'BS. Hoàng Gia Bảo',
      reason: 'Sốt cao co giật tái phát, chỉ định nhập viện theo dõi điện não đồ',
      department: 'Khoa Nhi Thần kinh',
      time: '08:45 Sáng nay',
      urgency: 'Tiêu chuẩn',
      status: 'Đã nhận Khoa Nhi',
      avatarText: 'GK',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      {/* Sub-navigation */}
      <FacilityNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Facility Header Banner phong cách Preclinic */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] flex items-center justify-center text-white shadow-md ring-4 ring-[#2E37A4]/10 shrink-0">
              <span className="material-symbols-outlined text-[30px]">local_hospital</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Bệnh viện Đại học Y Dược TP.HCM
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Đối tác Y tế Cấp 1
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Mã định danh BYT: <span className="font-mono font-bold text-slate-700">BV-79012</span> • Phụ trách mạng lưới Bác sĩ Gia đình FamiDoc khu vực TP.HCM &amp; Miền Nam
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Link
              href="/facility/staff"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Tiếp nhận Bác sĩ</span>
            </Link>
            <Link
              href="/facility/coordination"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200 transition-all shadow-2xs"
            >
              <span className="material-symbols-outlined text-[18px] text-[#2E37A4]">rule_settings</span>
              <span>Điều phối viện</span>
            </Link>
          </div>
        </div>

        {/* 4 Stats Grid phong cách Preclinic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`w-11 h-11 rounded-full flex items-center justify-center ${s.iconBg}`}>
                  <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${s.badgeBg}`}>
                  {s.change}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{s.title}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{s.value}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{s.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Priority Referrals & Coordination Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Incoming Fast-track Referrals (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-500 text-[20px]">emergency</span>
                  <span>Luồng Tiếp Nhận Fast-Track Chuyển Viện</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ca bệnh vượt tuyến hoặc can thiệp kỹ thuật cao được bác sĩ gia đình giới thiệu
                </p>
              </div>
              <Link
                href="/facility/coordination"
                className="text-xs font-bold text-[#2E37A4] hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {incomingReferrals.map((ref) => (
                <div key={ref.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#2E37A4]/10 text-[#2E37A4] font-bold text-xs flex items-center justify-center shrink-0">
                        {ref.avatarText}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900">{ref.patientName}</span>
                        <span className="font-mono text-xs text-slate-400 ml-2">#{ref.id}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          ref.urgency === 'Khẩn cấp'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : ref.urgency === 'Ưu tiên'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {ref.urgency}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{ref.time}</span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium mb-3 pl-10.5">
                    <span className="text-slate-400">Chỉ định:</span> {ref.reason}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100 pt-3 pl-10.5">
                    <div className="flex items-center gap-4 text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-[#2E37A4]">stethoscope</span>
                        <span>{ref.fromDoctor}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">domain</span>
                        <span>{ref.department}</span>
                      </span>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {ref.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SLA Capacity & Quick Links (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* SLA Progress Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Cam Kết Chất Lượng (SLA)</span>
                <span className="text-xs font-bold text-emerald-600">Đạt Chuẩn A+</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-slate-600">Đáp ứng lịch khám Bác sĩ Gia đình</span>
                    <span className="text-[#2E37A4] font-bold">98.4% / 95% SLA</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-[#2E37A4] h-2 rounded-full" style={{ width: '98.4%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-slate-600">Công suất Panel Cap (Bác sĩ/Hộ)</span>
                    <span className="text-emerald-600 font-bold">82% (Ngưỡng an toàn)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-slate-600">Thời gian phản hồi cấp cứu Fast-Track</span>
                    <span className="text-indigo-600 font-bold">&lt; 15 phút (100%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Channel Distribution Card (như receptionist-channel trên Preclinic) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
              <h3 className="font-bold text-base text-slate-900 tracking-tight">
                Phân Bổ Kênh Dịch Vụ Y Tế
              </h3>
              <p className="text-xs text-slate-400">Tỷ lệ các kênh tiếp nhận bệnh nhân tháng này</p>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2E37A4]"></span>
                    Thăm khám tại nhà
                  </span>
                  <span className="font-bold text-slate-900">58% (824 ca)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00D3C7]"></span>
                    Tư vấn Telehealth HD
                  </span>
                  <span className="font-bold text-slate-900">26% (370 ca)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    Đến khám trực tiếp tại BV
                  </span>
                  <span className="font-bold text-slate-900">16% (226 ca)</span>
                </div>
              </div>
            </div>

            {/* Platform Partnership Info */}
            <div className="bg-gradient-to-br from-[#111827] to-[#1e1b4b] text-white p-5 rounded-2xl shadow-sm border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[20px] text-[#00D3C7]">verified</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Đối Soát Doanh Thu B2B Ký Số
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hợp đồng chia sẻ doanh thu 70/30 đã được đối soát tự động kỳ 10/2026. Quỹ Escrow đã sẵn sàng giải ngân cho cơ sở y tế.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">B2B-YDUOC-2026</span>
                <Link
                  href="/facility/revenue"
                  className="font-bold text-[#00D3C7] hover:underline"
                >
                  Kiểm tra sao kê
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

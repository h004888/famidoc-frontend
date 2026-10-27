'use client';

import React from 'react';
import Link from 'next/link';
import { FacilityNav } from '@/components/layout';

export function FacilityDashboardView() {
  const stats = [
    {
      title: 'Bác sĩ trực thuộc',
      value: '48',
      subtitle: '42 đang trực chiến, 6 nghỉ phép',
      icon: 'badge',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Ca khám tháng này',
      value: '1.420',
      subtitle: '+14.2% so với tháng trước',
      icon: 'medical_services',
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Chỉ số SLA đáp ứng',
      value: '98.4%',
      subtitle: 'Thời gian phản hồi TB 12 phút',
      icon: 'verified',
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      title: 'Doanh thu B2B tạm tính',
      value: '342.800.000 đ',
      subtitle: 'Tỷ lệ 70% cơ sở (Tháng 10/2026)',
      icon: 'payments',
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  const incomingReferrals = [
    {
      id: 'REF-8841',
      patientName: 'Lê Văn Nam (65 tuổi)',
      fromDoctor: 'BS.CKII Trần Thanh Mai',
      reason: 'Nghi ngờ cơn đau thắt ngực không ổn định, đề nghị Fast-Track chụp mạch vành can thiệp',
      department: 'Khoa Can thiệp Tim mạch',
      time: '10:15 Hôm nay',
      urgency: 'Khẩn cấp',
      status: 'Chờ phân giường tiếp nhận',
    },
    {
      id: 'REF-8839',
      patientName: 'Phạm Thị Thùy (48 tuổi)',
      fromDoctor: 'ThS.BS Nguyễn Hữu Đạt',
      reason: 'Hội chẩn liên viện tổn thương phổi kẽ tiến triển sau nhiễm siêu vi',
      department: 'Khoa Hô hấp & Dị ứng',
      time: '09:30 Hôm nay',
      urgency: 'Ưu tiên',
      status: 'Đã xếp lịch hội chẩn 14:00',
    },
    {
      id: 'REF-8835',
      patientName: 'Bùi Gia Khiêm (8 tuổi)',
      fromDoctor: 'BS. Hoàng Gia Bảo',
      reason: 'Sốt cao co giật tái phát, chỉ định nhập viện theo dõi điện não đồ',
      department: 'Khoa Nhi Thần kinh',
      time: '08:45 Hôm nay',
      urgency: 'Tiêu chuẩn',
      status: 'Đã chuyển Khoa Nhi',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* Sub-navigation */}
      <FacilityNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Facility Header Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[32px]">local_hospital</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Bệnh viện Đại học Y Dược TP.HCM
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Đối tác Cấp 1
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Mã định danh BHYT / BYT: <span className="font-mono font-medium text-slate-700">BV-79012</span> • Phụ trách mạng lưới FamiDoc khu vực TP.HCM & Miền Nam
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Link
              href="/facility/staff"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Tiếp nhận Bác sĩ</span>
            </Link>
            <Link
              href="/facility/coordination"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">rule_settings</span>
              <span>Điều phối viện</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {s.title}
                </span>
                <span className={`p-2 rounded-xl material-symbols-outlined text-[20px] ${s.color}`}>
                  {s.icon}
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{s.subtitle}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Priority Referrals & Coordination Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incoming Fast-track Referrals */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Luồng Tiếp nhận Fast-Track Chuyển viện</h2>
                <p className="text-xs text-slate-500 mt-0.5">Ca bệnh vượt tuyến hoặc cần can thiệp kỹ thuật chuyên sâu từ Bác sĩ Gia đình</p>
              </div>
              <Link
                href="/facility/coordination"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {incomingReferrals.map((ref) => (
                <div key={ref.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">{ref.id}</span>
                      <span className="font-bold text-sm text-slate-900">{ref.patientName}</span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          ref.urgency === 'Khẩn cấp'
                            ? 'bg-rose-100 text-rose-700'
                            : ref.urgency === 'Ưu tiên'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {ref.urgency}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{ref.time}</span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium mb-3">
                    <span className="text-slate-400">Lý do:</span> {ref.reason}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100/80 pt-3">
                    <div className="flex items-center gap-4 text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-blue-500">stethoscope</span>
                        {ref.fromDoctor}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">domain</span>
                        {ref.department}
                      </span>
                    </div>
                    <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {ref.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SLA Capacity & Quick Links */}
          <div className="space-y-6">
            {/* SLA Progress */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4">Cam kết Chất lượng (SLA)</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Đáp ứng lịch khám Bác sĩ Gia đình</span>
                    <span className="text-blue-600">98.4% / 95% Target</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '98.4%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Công suất Panel Cap (Bác sĩ/Hộ)</span>
                    <span className="text-emerald-600">82% (An toàn)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Giải quyết phản hồi khiếu nại &lt; 2h</span>
                    <span className="text-indigo-600">100%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Partnership Info */}
            <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[20px] text-amber-400">verified</span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Đối soát B2B Ký số</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hợp đồng chia sẻ doanh thu 70/30 đã được đối soát tự động kỳ 10/2026. Quỹ Escrow đã sẵn sàng giải ngân.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-700/80 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Mã HĐ: B2B-YDUOC-2026</span>
                <Link
                  href="/facility/revenue"
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 underline"
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


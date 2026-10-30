'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminNav } from '@/components/layout';

export function AdminDashboardView() {
  const [statPeriod, setStatPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');

  const kpis = [
    {
      title: 'Doanh thu GMV YTD',
      value: '4.820.500.000 đ',
      change: '+18.4%',
      period: 'so với tháng trước',
      isPositive: true,
      icon: 'payments',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Hợp đồng Hiệu lực',
      value: '3.250 Hộ',
      change: '+142 hộ',
      period: 'trong 7 ngày qua',
      isPositive: true,
      icon: 'family_restroom',
      iconBg: 'bg-[#2E37A4]/10 text-[#2E37A4]',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      title: 'Mạng lưới Bác sĩ & CSYT',
      value: '184 BS / 12 BV',
      change: '100%',
      period: 'CCHN BYT thẩm định',
      isPositive: true,
      icon: 'medical_services',
      iconBg: 'bg-sky-50 text-sky-600',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      title: 'Tranh chấp Escrow',
      value: '3 Ca khẩn',
      change: 'SLA < 24h',
      period: 'cần xử lý ngay',
      isPositive: false,
      icon: 'gavel',
      iconBg: 'bg-rose-50 text-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  const pendingArbitrations = [
    {
      id: 'DISP-2026-004',
      family: 'Hộ FAM-88219 (Trần Thị Lan)',
      doctorOrFacility: 'BS. Hoàng Gia Bảo / BV ĐH Y Dược',
      issue: 'Gia đình yêu cầu hoàn tiền 50% gói khám tại nhà do bác sĩ trễ hẹn >45p',
      escrowAmount: '1.200.000 đ',
      time: '1 giờ trước',
      severity: 'high',
      avatarText: 'TL',
    },
    {
      id: 'DISP-2026-003',
      family: 'Hộ FAM-11029 (Lê Minh Quân)',
      doctorOrFacility: 'Khoa Dược Bệnh viện Hoàn Mỹ',
      issue: 'Khiếu nại sai lệch danh mục thuốc bảo hiểm trong đơn điện tử 1NF',
      escrowAmount: '850.000 đ',
      time: '3 giờ trước',
      severity: 'medium',
      avatarText: 'MQ',
    },
    {
      id: 'DISP-2026-002',
      family: 'Hộ FAM-44012 (Nguyễn Thu Hà)',
      doctorOrFacility: 'Phòng khám Đa khoa Trustcare',
      issue: 'Tranh chấp phụ phí xét nghiệm sinh hóa máu phát sinh tại nhà',
      escrowAmount: '600.000 đ',
      time: '5 giờ trước',
      severity: 'low',
      avatarText: 'TH',
    },
  ];

  const popularDoctors = [
    {
      name: 'PGS.TS Nguyễn Trọng Nghĩa',
      specialty: 'Tim mạch & Lão khoa',
      hospital: 'BV Đại học Y Dược',
      rating: '4.95',
      bookings: '384',
      avatarText: 'TN',
    },
    {
      name: 'ThS.BS Lê Hoàng Yến',
      specialty: 'Sản phụ khoa & Tiền sản',
      hospital: 'Vinmec Central Park',
      rating: '4.92',
      bookings: '296',
      avatarText: 'HY',
    },
    {
      name: 'BS.CKII Trần Thanh Mai',
      specialty: 'Nhi khoa & Tiêm chủng',
      hospital: 'BV Nhi Đồng 1',
      rating: '4.88',
      bookings: '242',
      avatarText: 'TM',
    },
  ];

  const systemHealth = [
    { name: 'Dịch vụ Ký số Chữ ký số SmartCA (Bộ TT&TT)', status: 'Operational', latency: '42ms' },
    { name: 'Cổng Ký quỹ Đảm bảo Escrow (BIDV Open Banking)', status: 'Operational', latency: '110ms' },
    { name: 'Cơ sở dữ liệu Bệnh án Điện tử Mã hóa (HIPAA EMR)', status: 'Operational', latency: '18ms' },
    { name: 'Cổng kết nối CCHN Khám chữa bệnh (Bộ Y Tế API)', status: 'Operational', latency: '85ms' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      {/* Sub-navigation tabs phong cách Preclinic */}
      <AdminNav />

      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Page Header phong cách Preclinic */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Trang chủ</span>
              <span className="text-slate-300">/</span>
              <span>Quản trị viên</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#2E37A4] font-semibold">Tổng quan Nền tảng</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Admin Dashboard
            </h1>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <Link
              href="/admin/packages"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2E37A4] hover:bg-[#222982] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Cấu hình Gói Mới</span>
            </Link>
            <Link
              href="/admin/disputes"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200/90 shadow-2xs transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-rose-500">gavel</span>
              <span>Phân xử Trọng tài ({pendingArbitrations.length})</span>
            </Link>
          </div>
        </div>

        {/* 4 KPI Cards phong cách Preclinic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`w-11 h-11 rounded-full flex items-center justify-center ${kpi.iconBg}`}>
                  <span className="material-symbols-outlined text-[24px]">{kpi.icon}</span>
                </span>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${kpi.badgeBg}`}>
                    {kpi.change}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{kpi.period}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">{kpi.title}</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  {kpi.value}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid: Appointment Stats & Disputes vs Popular Doctors & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Appointment Statistics & Arbitration Table */}
          <div className="lg:col-span-8 space-y-6">
            {/* Appointment Statistics Card (giống index.html Preclinic) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Thống kê Lịch hẹn &amp; Dịch vụ Y tế
                  </h3>
                  <p className="text-xs text-slate-400">Tần suất thăm khám tại nhà và Telehealth toàn hệ thống</p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setStatPeriod('monthly')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      statPeriod === 'monthly' ? 'bg-white text-[#2E37A4] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tháng
                  </button>
                  <button
                    onClick={() => setStatPeriod('weekly')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      statPeriod === 'weekly' ? 'bg-white text-[#2E37A4] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tuần
                  </button>
                  <button
                    onClick={() => setStatPeriod('yearly')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      statPeriod === 'yearly' ? 'bg-white text-[#2E37A4] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Năm
                  </button>
                </div>
              </div>

              {/* 4 Mini Stat Boxes Preclinic Style */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-slate-50 border border-slate-100 p-3 text-center rounded-xl">
                  <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#2E37A4]"></span>
                    Tổng cuộc hẹn
                  </p>
                  <h4 className="text-lg font-bold text-slate-900 mt-1">6.314</h4>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 text-center rounded-xl">
                  <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Đã hoàn thành
                  </p>
                  <h4 className="text-lg font-bold text-slate-900 mt-1">4.578</h4>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 text-center rounded-xl">
                  <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Đang xếp lịch
                  </p>
                  <h4 className="text-lg font-bold text-slate-900 mt-1">1.280</h4>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 text-center rounded-xl">
                  <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Đã hủy / Đổi hẹn
                  </p>
                  <h4 className="text-lg font-bold text-slate-900 mt-1">456</h4>
                </div>
              </div>

              {/* Progress chart distribution bar */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Tỷ lệ hoàn thành mục tiêu lâm sàng (SLA Đạt 94.8%)</span>
                  <span className="text-emerald-600">4.578 / 6.314 ca</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-[#2E37A4] h-full" style={{ width: '72%' }} title="Hoàn thành (72%)"></div>
                  <div className="bg-amber-400 h-full" style={{ width: '20%' }} title="Đang chờ (20%)"></div>
                  <div className="bg-rose-400 h-full" style={{ width: '8%' }} title="Hủy (8%)"></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Tháng 10/2026: Đạt đỉnh 280 ca/ngày</span>
                  <span>Khám tại nhà: 68% • Telehealth: 32%</span>
                </div>
              </div>
            </div>

            {/* Arbitration Queue Table Preclinic Style */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500 text-[20px]">gavel</span>
                    <span>Hàng Đợi Trọng Tài &amp; Tranh Chấp Escrow</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Các ca tranh chấp cần trọng tài độc lập giải phóng dòng tiền ký quỹ
                  </p>
                </div>
                <Link
                  href="/admin/disputes"
                  className="text-xs font-bold text-[#2E37A4] hover:underline flex items-center gap-1"
                >
                  <span>Xem tất cả</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Mã / Mức độ</th>
                      <th className="py-3 px-4">Đại diện Hộ Gia đình</th>
                      <th className="py-3 px-4">Bác sĩ / Cơ sở</th>
                      <th className="py-3 px-4">Số tiền Escrow</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {pendingArbitrations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-700">{item.id}</div>
                          <span
                            className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.severity === 'high'
                                ? 'bg-rose-100 text-rose-700'
                                : item.severity === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.severity === 'high' ? 'Khẩn (SLA 24h)' : item.severity === 'medium' ? 'Vừa' : 'Thường'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-[#2E37A4] font-bold text-xs flex items-center justify-center shrink-0">
                              {item.avatarText}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{item.family}</div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{item.issue}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-800 font-medium">{item.doctorOrFacility}</div>
                          <div className="text-[11px] text-slate-400">{item.time}</div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-rose-600 font-mono">{item.escrowAmount}</div>
                          <span className="text-[10px] text-slate-400">Đang đóng băng</span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            href="/admin/disputes"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2E37A4] hover:bg-[#222982] text-white font-bold rounded-lg text-xs transition-colors shadow-2xs"
                          >
                            <span>Xử lý</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Popular Doctors & System Health */}
          <div className="lg:col-span-4 space-y-6">
            {/* Popular Doctors Preclinic Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Bác Sĩ Nổi Bật
                </h3>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Top Đánh Giá
                </span>
              </div>

              <div className="space-y-3.5">
                {popularDoctors.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          {doc.avatarText}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{doc.name}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{doc.specialty}</p>
                        <p className="text-[10px] text-slate-400">{doc.hospital}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1 text-amber-500 font-bold text-xs">
                        <span className="material-symbols-outlined text-[14px]">star</span>
                        <span>{doc.rating}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{doc.bookings} lượt</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-[19px]">cloud_done</span>
                  <span>Hạ Tầng Kỹ Thuật Y Tế</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-600">99.98% SLA</span>
              </div>

              <div className="space-y-3">
                {systemHealth.map((srv, idx) => (
                  <div key={idx} className="flex items-start justify-between text-xs pb-3 border-b border-slate-100 last:border-b-0 last:pb-0">
                    <div className="pr-2">
                      <div className="font-semibold text-slate-800">{srv.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Độ trễ: {srv.latency}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[10px] shrink-0 border border-emerald-200">
                      {srv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* HIPAA Audit Banner */}
            <div className="bg-gradient-to-br from-[#111827] to-[#1e1b4b] text-white p-5 rounded-2xl shadow-sm border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#00D3C7] text-[20px]">shield_person</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Audit Logs Chuẩn HIPAA
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mọi truy xuất hồ sơ bệnh án EMR và lệnh giải ngân đều được lưu vết bảo vệ tính bất biến theo chuẩn Bộ Y Tế.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">12.490 sự kiện</span>
                <Link
                  href="/admin/users"
                  className="font-bold text-[#00D3C7] hover:underline"
                >
                  Xem nhật ký
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

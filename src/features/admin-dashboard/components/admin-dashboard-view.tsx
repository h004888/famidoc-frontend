'use client';

import React from 'react';
import Link from 'next/link';
import { AdminNav } from '@/components/layout';

export function AdminDashboardView() {
  const kpis = [
    {
      title: 'Tổng GMV Giao dịch (YTD)',
      value: '4.820.500.000 đ',
      change: '+18.4% MoM',
      isPositive: true,
      icon: 'account_balance',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Hợp đồng Hiệu lực',
      value: '3.250 Hộ',
      change: '+142 hộ mới tuần này',
      isPositive: true,
      icon: 'contract',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Mạng lưới Bác sĩ & CSYT',
      value: '184 BS / 12 BV',
      change: '100% CCHN thẩm định',
      isPositive: true,
      icon: 'domain',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Tranh chấp Escrow chờ xử lý',
      value: '3 Ca',
      change: 'Cần trọng tài < 24h',
      isPositive: false,
      icon: 'gavel',
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
  ];

  const pendingArbitrations = [
    {
      id: 'DISP-2026-004',
      family: 'Hộ FAM-88219 (Trần Thị Lan)',
      doctorOrFacility: 'BS. Hoàng Gia Bảo / BV ĐH Y Dược',
      issue: 'Gia đình yêu cầu hoàn tiền 50% gói khám tại nhà do trễ hẹn >45p',
      escrowAmount: '1.200.000 đ',
      time: '1 giờ trước',
      severity: 'high',
    },
    {
      id: 'DISP-2026-003',
      family: 'Hộ FAM-11029 (Lê Minh Quân)',
      doctorOrFacility: 'Khoa Dược Bệnh viện Hoàn Mỹ',
      issue: 'Khiếu nại sai lệch danh mục thuốc bảo hiểm trong đơn điện tử 1NF',
      escrowAmount: '850.000 đ',
      time: '3 giờ trước',
      severity: 'medium',
    },
    {
      id: 'DISP-2026-002',
      family: 'Hộ FAM-44012 (Nguyễn Thu Hà)',
      doctorOrFacility: 'Phòng khám Đa khoa Quốc tế',
      issue: 'Tranh chấp phụ phí xét nghiệm sinh hóa máu phát sinh tại nhà',
      escrowAmount: '600.000 đ',
      time: '5 giờ trước',
      severity: 'low',
    },
  ];

  const systemHealth = [
    { name: 'Dịch vụ Ký số Chữ ký số SmartCA (Bộ TT&TT)', status: 'Operational', latency: '42ms' },
    { name: 'Cổng Ký quỹ Đảm bảo Escrow (BIDV Open Banking)', status: 'Operational', latency: '110ms' },
    { name: 'Cơ sở dữ liệu Bệnh án Điện tử Mã hóa (HIPAA EMR)', status: 'Operational', latency: '18ms' },
    { name: 'Cổng kết nối CCHN Khám chữa bệnh (Bộ Y Tế API)', status: 'Operational', latency: '85ms' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* Sub-navigation */}
      <AdminNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Enterprise Executive Header */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Backoffice Control Center v2.6
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Hệ thống ổn định 99.98%
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-2">
              Trung tâm Điều hành Nền tảng FamiDoc
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Giám sát dòng tiền ký quỹ Escrow, quản lý định giá gói chăm sóc y tế và vận hành trọng tài tranh chấp dịch vụ toàn quốc.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/packages"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              <span>Cấu hình Gói mới</span>
            </Link>
            <Link
              href="/admin/disputes"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">gavel</span>
              <span>Phân xử Tranh chấp ({pendingArbitrations.length})</span>
            </Link>
          </div>
        </div>

        {/* Modern Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <span className={`p-2 rounded-xl material-symbols-outlined text-[20px] ${kpi.color}`}>
                  {kpi.icon}
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</div>
                <div
                  className={`text-xs mt-1 font-semibold flex items-center gap-1 ${
                    kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  <span>{kpi.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Central Operations: Arbitration Queue & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Arbitration Queue */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-500 text-[20px]">warning</span>
                  <span>Hàng đợi Trọng tài Tranh chấp Khẩn cấp</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Yêu cầu can thiệp phán quyết hoàn tiền từ Quỹ ký quỹ Escrow</p>
              </div>
              <Link
                href="/admin/disputes"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingArbitrations.map((item) => (
                <div key={item.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">{item.id}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          item.severity === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : item.severity === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.severity === 'high' ? 'Khẩn (SLA 24h)' : item.severity === 'medium' ? 'Vừa' : 'Thường'}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-900">{item.family}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{item.time}</span>
                  </div>

                  <p className="text-xs text-slate-600 mb-2 font-medium">
                    <span className="text-slate-400">Nội dung:</span> {item.issue}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-3 border-t border-slate-100/80">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">local_hospital</span>
                      <span>{item.doctorOrFacility}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800">
                        Số tiền Escrow: <span className="text-rose-600 font-bold">{item.escrowAmount}</span>
                      </span>
                      <Link
                        href="/admin/disputes"
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors"
                      >
                        Mở phiên xử
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health & Security Logs */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">cloud_done</span>
                <span>Trạng thái Hạ tầng Y tế</span>
              </h2>

              <div className="space-y-3.5">
                {systemHealth.map((srv, idx) => (
                  <div key={idx} className="flex items-start justify-between text-xs pb-3 border-b border-slate-100 last:border-b-0 last:pb-0">
                    <div>
                      <div className="font-semibold text-slate-800">{srv.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Độ trễ: {srv.latency}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px]">
                      {srv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Audit Snapshot */}
            <div className="bg-linear-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-indigo-400 text-[20px]">lock_clock</span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Audit Logs Bảo mật Y tế
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mọi truy xuất hồ sơ bệnh án EMR và lệnh giải ngân đều được lưu vết bảo vệ tính bất biến theo chuẩn HIPAA.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Ghi nhận: 12.490 sự kiện</span>
                <Link
                  href="/admin/users"
                  className="text-xs font-bold text-indigo-300 hover:text-white underline"
                >
                  Xem nhật ký
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


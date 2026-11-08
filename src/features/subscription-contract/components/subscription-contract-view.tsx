'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ContractSigningWizard } from './contract-signing-wizard';

interface QuotaItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  barColor: string;
  used: number;
  total: number;
  remainingLabel: string;
  unit: string;
  actionLabel: string;
  actionHref: string;
}

const PACKAGE_QUOTAS: QuotaItem[] = [
  {
    id: 'home-visit',
    title: 'Bác Sĩ Thăm Khám Tại Nhà',
    subtitle: 'Mang theo máy đo ECG, siêu âm xách tay & lấy mẫu',
    icon: 'home_health',
    iconBg: 'bg-blue-50 text-[#2E37A4] border-blue-200/80',
    barColor: 'bg-[#2E37A4]',
    used: 2,
    total: 5,
    remainingLabel: 'Còn 3 / 5 lượt',
    unit: 'lượt năm nay',
    actionLabel: 'Đặt lịch khám tại nhà',
    actionHref: '/family/appointments',
  },
  {
    id: 'telehealth',
    title: 'Tư Vấn Video Telehealth 24/7',
    subtitle: 'Kết nối trực tiếp Bác sĩ gia đình & chuyên khoa',
    icon: 'videocam',
    iconBg: 'bg-teal-50 text-teal-700 border-teal-200/80',
    barColor: 'bg-teal-600',
    used: 2,
    total: 20,
    remainingLabel: 'Còn 18 / 20 lượt',
    unit: 'lượt năm nay',
    actionLabel: 'Đặt lịch tư vấn Video',
    actionHref: '/family/appointments',
  },
  {
    id: 'lab-test',
    title: 'Xét Nghiệm Tổng Quát Tại Nhà',
    subtitle: 'Sinh hóa máu, mỡ máu, đường huyết HbA1c định kỳ',
    icon: 'biotech',
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    barColor: 'bg-emerald-600',
    used: 1,
    total: 2,
    remainingLabel: 'Còn 1 / 2 đợt',
    unit: 'đợt 6 tháng/lần',
    actionLabel: 'Xem kết quả xét nghiệm',
    actionHref: '/family/members',
  },
];

const FOUR_PARTIES = [
  {
    code: 'BÊN A • ĐẠI DIỆN HỘ GIA ĐÌNH',
    badgeClass: 'bg-blue-50 text-[#2E37A4] border-blue-200/80',
    name: 'Ông Nguyễn Văn Phúc',
    identifier: 'CCCD: 079048001293',
    roleDesc: 'Chủ hộ gia đình • Mã hộ #FAM-88219',
    signMethod: 'Đã ký điện tử eKYC & OTP',
    signDetail: 'SĐT xác thực: 0903 882 190',
    signedAt: '09:15 • 01/01/2026',
  },
  {
    code: 'BÊN B • BÁC SĨ QUẢN NHIỆM',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    name: 'PGS.TS Nguyễn Trọng Nghĩa',
    identifier: 'CCHN: 004128/BYT',
    roleDesc: 'Trưởng khoa Nội Tổng quát phụ trách hộ',
    signMethod: 'Chữ ký số VIETTEL-CA',
    signDetail: 'Chứng thư: 5402-8812-BYT',
    signedAt: '09:40 • 01/01/2026',
  },
  {
    code: 'BÊN C • CƠ SỞ Y TẾ ĐỐI TÁC',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
    name: 'BV Đại học Y Dược TP.HCM',
    identifier: 'Mã CSYT: 79024 • Tuyến TW',
    roleDesc: 'Bảo trợ chuyên môn, xét nghiệm & chuyển viện',
    signMethod: 'Chữ ký số tổ chức VNPT-CA',
    signDetail: 'Định danh: UMC-HCMC-CA',
    signedAt: '10:05 • 01/01/2026',
  },
  {
    code: 'BÊN D • NỀN TẢNG FAMIDOC',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    name: 'FamiDoc Healthcare Corp',
    identifier: 'MST: 0317892182',
    roleDesc: 'Đơn vị vận hành hồ sơ EHR & điều phối 24/7',
    signMethod: 'Dấu thời gian TSA & SHA-256',
    signDetail: 'Chuẩn bảo mật HIPAA / ISO 27799',
    signedAt: '10:10 • 01/01/2026',
  },
];

export function SubscriptionContractView() {
  const [activeTab, setActiveTab] = useState<'contract' | 'benefits'>('contract');
  const [isSigningWizardOpen, setIsSigningWizardOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-6xl mx-auto py-5 sm:py-7 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. HEADER HỢP ĐỒNG & GÓI CHĂM SÓC HIỆN TẠI (GỌN GÀNG, CÂN ĐỐI 2 TẦNG) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          {/* Tầng 1: Định danh hợp đồng & Cụm nút thao tác gọn đẹp */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#2E37A4] text-white flex items-center justify-center shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#2E37A4] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/80">
                    #FMD-HD-88219
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Đang hiệu lực • Còn 65 ngày</span>
                  </span>
                </div>

                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                  Gói Gia Đình Toàn Diện VIP (12 Tháng)
                </h1>

                <p className="text-xs text-slate-500">
                  Hiệu lực: <strong className="text-slate-700">01/01/2026 – 31/12/2026</strong> • Phí
                  gói: <strong className="text-[#2E37A4]">9.600.000 đ/năm</strong>
                </p>
              </div>
            </div>

            {/* Cụm nút hành động ngắn gọn, không bị rớt dòng chữ */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsSigningWizardOpen(true)}
                className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px]">edit_document</span>
                <span>Gia hạn gói</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  showToast('Đang tải file Hợp đồng PDF có đầy đủ chữ ký số 4 bên...')
                }
                className="col-span-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px] text-rose-500">
                  picture_as_pdf
                </span>
                <span>Tải PDF</span>
              </button>

              <Link
                href="/family/billing"
                className="col-span-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-50/80 hover:bg-blue-100 text-[#2E37A4] border border-blue-200/80 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px]">receipt_long</span>
                <span>Biên lai</span>
              </Link>
            </div>
          </div>

          {/* Tầng 2: Bác sĩ phụ trách & 3 Thành viên thụ hưởng trong gói */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#2E37A4] font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                TN
              </div>
              <div>
                <span className="text-slate-500">Bác sĩ quản nhiệm: </span>
                <strong className="text-slate-900">PGS.TS Nguyễn Trọng Nghĩa</strong>
                <span className="text-slate-400 hidden sm:inline">
                  {' '}
                  • BV Đại học Y Dược TP.HCM
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-medium mr-1">Thụ hưởng (3/4):</span>
              <Link
                href="/family/members/mem-01"
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 font-semibold text-slate-700 hover:border-[#2E37A4] hover:text-[#2E37A4] transition-colors"
              >
                Ông Phúc (78t)
              </Link>
              <Link
                href="/family/members/mem-02"
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 font-semibold text-slate-700 hover:border-[#2E37A4] hover:text-[#2E37A4] transition-colors"
              >
                Mẹ Mai (42t)
              </Link>
              <Link
                href="/family/members/mem-03"
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 font-semibold text-slate-700 hover:border-[#2E37A4] hover:text-[#2E37A4] transition-colors"
              >
                Con Quân (12t)
              </Link>
            </div>
          </div>
        </div>

        {/* 3. HẠN MỨC QUYỀN LỢI KỲ NÀY (3 THẺ TIẾN ĐỘ RÕ RÀNG + NÚT SỬ DỤNG NGAY) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[19px] text-[#2E37A4]">
                donut_large
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Hạn Mức Quyền Lợi Gia Đình Đang Có
              </h2>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Lượt khám được dùng chung linh hoạt cho cả 3 thành viên
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PACKAGE_QUOTAS.map((q) => {
              const remaining = q.total - q.used;
              const remainingPercent = Math.round((remaining / q.total) * 100);

              return (
                <div
                  key={q.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${q.iconBg}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{q.icon}</span>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800 font-mono">
                        {q.remainingLabel}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900">{q.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{q.subtitle}</p>
                    </div>

                    {/* Thanh tiến độ hạn mức */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          Đã dùng: <strong className="text-slate-700">{q.used}</strong> / {q.total}{' '}
                          {q.unit}
                        </span>
                        <span className="font-bold text-slate-700">Còn {remainingPercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${q.barColor}`}
                          style={{ width: `${remainingPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      href={q.actionHref}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-50/80 text-[#2E37A4] font-bold text-xs flex items-center justify-between transition-colors"
                    >
                      <span>{q.actionLabel}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. THANH TAB CHUYỂN ĐỔI: HỢP ĐỒNG 4 BÊN vs QUYỀN LỢI & QUY ĐỊNH */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('contract')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'contract'
                  ? 'bg-[#2E37A4] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="hidden sm:inline-flex items-center">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </span>
              <span>Hợp đồng &amp; Chữ ký 4 bên</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('benefits')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'benefits'
                  ? 'bg-[#2E37A4] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="hidden sm:inline-flex items-center">
                <span className="material-symbols-outlined text-[18px]">policy</span>
              </span>
              <span>Quy chế &amp; Quyền lợi gói</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 text-xs text-slate-500">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">lock</span>
            <span>Lưu trữ bảo mật trên FamiDoc Vault • Chuẩn HIPAA</span>
          </div>
        </div>

        {/* NỘI DUNG TAB 1: CHỮ KÝ SỐ 4 BÊN & VĂN BẢN HỢP ĐỒNG */}
        {activeTab === 'contract' && (
          <div className="space-y-6">
            {/* 4 Thẻ Chữ Ký Pháp Lý 4 Bên */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FOUR_PARTIES.map((party) => (
                <div
                  key={party.code}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${party.badgeClass}`}
                      >
                        {party.code}
                      </span>
                      <span
                        className="material-symbols-outlined text-emerald-600 text-[18px]"
                        title="Đã xác thực chữ ký số"
                      >
                        verified
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{party.name}</h3>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {party.identifier}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{party.roleDesc}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs space-y-1">
                    <div className="font-bold text-emerald-800 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-emerald-600">
                        done_all
                      </span>
                      <span>{party.signMethod}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">{party.signDetail}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Ký lúc: {party.signedAt}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Khung Văn Bản Hợp Đồng Điện Tử */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
              {/* Thanh tiêu đề văn bản */}
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">
                    description
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Bản Sao Văn Bản Hợp Đồng Điện Tử
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Xác thực toàn vẹn dữ liệu SHA-256 • Có giá trị pháp lý tương đương bản cứng
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => showToast('Đang chuẩn bị bản in hợp đồng điện tử...')}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    <span>In hợp đồng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      showToast('Đang tải file hợp đồng PDF có chứng thư ký số HSM TSA...')
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Tải bản PDF</span>
                  </button>
                </div>
              </div>

              {/* Nội dung điều khoản chính */}
              <div className="p-5 sm:p-8 space-y-6">
                <div className="text-center border-b border-slate-100 pb-5 space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </span>
                  <p className="text-xs font-semibold text-slate-500">
                    Độc lập - Tự do - Hạnh phúc
                  </p>
                  <h4 className="text-base sm:text-xl font-extrabold text-slate-900 pt-2">
                    HỢP ĐỒNG CUNG CẤP DỊCH VỤ BÁC SĨ GIA ĐÌNH &amp; CHĂM SÓC SỨC KHỎE
                  </h4>
                  <p className="text-xs font-mono font-bold text-[#2E37A4]">
                    Số hợp đồng: FMD-HD-88219/2026 • Ngày ký: 01/01/2026
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
                    <div className="flex items-center gap-2 text-[#2E37A4] font-extrabold text-xs uppercase">
                      <span className="material-symbols-outlined text-[18px]">
                        medical_services
                      </span>
                      <span>Điều 1: Phạm vi chăm sóc</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Bác sĩ quản nhiệm (Bên B) và FamiDoc (Bên D) cung cấp gói chăm sóc sức khỏe
                      trọn năm cho hộ gia đình Bên A gồm: <strong>05 lượt khám tại nhà</strong>,{' '}
                      <strong>20 lượt tư vấn Telehealth</strong>, quản lý hồ sơ bệnh án điện tử EHR
                      và <strong>02 đợt lấy mẫu xét nghiệm</strong> định kỳ tại nhà.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
                    <div className="flex items-center gap-2 text-[#2E37A4] font-extrabold text-xs uppercase">
                      <span className="material-symbols-outlined text-[18px]">local_hospital</span>
                      <span>Điều 2: Chuyển tuyến ưu tiên</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Bệnh viện Đại học Y Dược TP.HCM (Bên C) tiếp nhận thành viên hộ Bên A theo
                      luồng ưu tiên <strong>Fast-Track</strong> khi có chỉ định chuyển viện điện tử
                      từ Bác sĩ quản nhiệm; đồng bộ sẵn kết quả xét nghiệm và hỗ trợ hưởng BHYT đúng
                      tuyến.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
                    <div className="flex items-center gap-2 text-[#2E37A4] font-extrabold text-xs uppercase">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                      <span>Điều 3: Bảo mật bệnh án</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Toàn bộ dữ liệu bệnh án, chỉ số sinh hiệu IoT và đơn thuốc của gia đình được
                      mã hóa đầu-cuối theo chuẩn <strong>HIPAA &amp; Bộ Y Tế</strong>. Tuyệt đối
                      không chia sẻ cho bên thứ ba khi chưa có sự đồng ý của Chủ hộ.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NỘI DUNG TAB 2: QUY CHẾ SỬ DỤNG & QUYỀN LỢI CHI TIẾT */}
        {activeTab === 'benefits' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">home_health</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Quy Định Sử Dụng Lượt Khám Tại Nhà &amp; Telehealth
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hướng dẫn đặt lịch và chuẩn bị đón Bác sĩ gia đình
                  </p>
                </div>
              </div>

              <ul className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#2E37A4] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Chia sẻ hạn mức linh hoạt:</strong> Tổng số lượt khám tại nhà (5 lượt) và
                    tư vấn video (20 lượt) được dùng chung cho tất cả thành viên có tên trong hộ.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#2E37A4] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Thời gian đặt hẹn trước:</strong> Đặt lịch khám tại nhà trước tối thiểu
                    03 tiếng hoặc gọi tổng đài khẩn cấp <strong>1900 6868</strong> để được điều phối
                    bác sĩ trực 24/7.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#2E37A4] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Trang thiết bị mang theo:</strong> Bác sĩ mang theo vali y tế gồm máy đo
                    điện tim ECG, máy siêu âm cầm tay, máy đo SpO2/huyết áp và bộ lấy mẫu xét nghiệm.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">support_agent</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Chính Sách Đổi Bác Sĩ Phụ Trách &amp; Gia Hạn Gói
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quyền lợi đảm bảo chất lượng phục vụ hộ gia đình
                  </p>
                </div>
              </div>

              <ul className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
                    verified
                  </span>
                  <span>
                    <strong>Quyền đổi Bác sĩ quản nhiệm:</strong> Gia đình có thể yêu cầu đổi Bác sĩ
                    phụ trách miễn phí nếu muốn thay đổi chuyên khoa phù hợp hơn với nhu cầu thực tế.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
                    verified
                  </span>
                  <span>
                    <strong>Gia hạn &amp; chuyển tiếp hợp đồng:</strong> Mỗi hộ gia đình duy trì 01
                    hợp đồng đang hoạt động. Khi gia hạn sớm, kỳ hạn mới sẽ tự động nối tiếp sau ngày
                    31/12/2026.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
                    verified
                  </span>
                  <span>
                    <strong>Bảo lưu hồ sơ trọn đời:</strong> Ngay cả khi tạm ngưng gói dịch vụ, toàn
                    bộ lịch sử khám và kết quả xét nghiệm của gia đình vẫn được lưu trữ và tra cứu
                    miễn phí.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Modal Ký Kết / Gia Hạn Hợp Đồng 4 Bên */}
      {isSigningWizardOpen && (
        <ContractSigningWizard
          packageName="Gói Gia Đình Toàn Diện VIP (12 Tháng)"
          packagePrice="9.600.000 đ"
          doctorName="PGS.TS Nguyễn Trọng Nghĩa"
          onClose={() => setIsSigningWizardOpen(false)}
        />
      )}

      {/* Toast phản hồi */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-400">
            check_circle
          </span>
          <span className="font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
            aria-label="Đóng thông báo"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}

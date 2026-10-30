'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DoctorNav } from '@/components/layout';

export function DoctorDashboardView() {
  const router = useRouter();
  const [_activeQueue] = useState<'pending' | 'in_progress' | 'signed'>('pending');

  const patients = [
    {
      id: 'PT-01',
      name: 'Nguyễn Văn Phúc (78 tuổi)',
      chiefComplaint: 'Tăng huyết áp định kỳ & xét nghiệm HbA1c tại nhà',
      triage: 'Cấp độ 2 (Ưu tiên cao)',
      triageBg: 'bg-amber-50 text-amber-700 border-amber-200',
      time: '09:00 Sáng nay',
      family: 'Hộ FAM-88219',
      avatarText: 'VP',
      status: 'pending',
    },
    {
      id: 'PT-02',
      name: 'Lê Thu Trang (34 tuổi)',
      chiefComplaint: 'Khám thai định kỳ tuần 28 & tư vấn dinh dưỡng Telehealth',
      triage: 'Cấp độ 3 (Tiêu chuẩn)',
      triageBg: 'bg-blue-50 text-blue-700 border-blue-200',
      time: '10:30 Sáng nay',
      family: 'Hộ FAM-44012',
      avatarText: 'TT',
      status: 'pending',
    },
    {
      id: 'PT-03',
      name: 'Hoàng Anh Dũng (52 tuổi)',
      chiefComplaint: 'Đau khớp gối cấp tính sau chấn thương vận động nhẹ',
      triage: 'Cấp độ 3 (Tiêu chuẩn)',
      triageBg: 'bg-blue-50 text-blue-700 border-blue-200',
      time: '14:00 Chiều nay',
      family: 'Hộ FAM-11983',
      avatarText: 'AD',
      status: 'pending',
    },
  ];

  const clinicalKpis = [
    {
      title: 'Ca khám trong ngày',
      value: '12 ca',
      sub: '6 tại nhà • 6 Telehealth',
      icon: 'calendar_month',
      iconBg: 'bg-[#2E37A4]/10 text-[#2E37A4]',
      badge: '+15%',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Hàng chờ lâm sàng',
      value: '3 ca',
      sub: 'Thời gian chờ TB 14 phút',
      icon: 'hourglass_top',
      iconBg: 'bg-amber-50 text-amber-600',
      badge: 'Đang trực',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: 'Chờ ký số Viettel-CA',
      value: '5 đơn',
      sub: 'Đơn điện tử cần ký trước 18h',
      icon: 'draw',
      iconBg: 'bg-rose-50 text-rose-600',
      badge: 'Khẩn cấp',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      title: 'Đánh giá chất lượng SLA',
      value: '4.95 / 5.0',
      sub: '420+ lượt phản hồi tích cực',
      icon: 'star',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badge: 'Xuất sắc',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      {/* Sub-navigation */}
      <DoctorNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Doctor Preclinic Profile Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] text-white flex items-center justify-center font-bold text-xl shadow-md ring-4 ring-[#2E37A4]/10">
                TN
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" title="Trạng thái: Đang trực tuyến"></span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  PGS.TS Nguyễn Trọng Nghĩa
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  CCHN: 004128/BYT
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Bác sĩ gia đình cao cấp • Trưởng khoa Nội Tổng quát • <span className="font-semibold text-slate-700">BV Đại học Y Dược TP.HCM</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="text-left md:text-right">
              <span className="text-[11px] text-slate-400 block font-medium">Thu nhập Escrow khả dụng:</span>
              <span className="text-base font-extrabold text-[#2E37A4] font-mono">18.450.000 đ</span>
            </div>
            <Link
              href="/doctor/telemedicine"
              className="px-4 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">videocam</span>
              <span>Phòng khám WebRTC</span>
            </Link>
          </div>
        </div>

        {/* 4 KPI Clinical Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {clinicalKpis.map((kpi, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`w-11 h-11 rounded-full flex items-center justify-center ${kpi.iconBg}`}>
                  <span className="material-symbols-outlined text-[22px]">{kpi.icon}</span>
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${kpi.badgeBg}`}>
                  {kpi.badge}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{kpi.title}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{kpi.value}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Portal Navigation Shortcuts phong cách Preclinic */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/doctor/timetable"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#2E37A4]/50 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2E37A4]/10 text-[#2E37A4] flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">calendar_clock</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2E37A4] transition-colors">
                Lịch Trực &amp; Panel Cap
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">112/150 Hộ gia đình (74%)</p>
            </div>
          </Link>

          <Link
            href="/doctor/encounters"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#2E37A4]/50 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">clinical_notes</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2E37A4] transition-colors">
                Khám SOAP &amp; Kê Đơn
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Ký số HSM Viettel-CA</p>
            </div>
          </Link>

          <Link
            href="/doctor/telemedicine"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#2E37A4]/50 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">videocam</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2E37A4] transition-colors">
                Tư Vấn WebRTC 24/7
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Mã hóa E2EE chuẩn y tế</p>
            </div>
          </Link>

          <Link
            href="/doctor/verification"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#2E37A4]/50 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2E37A4] transition-colors">
                Xác Thực CCHN BYT
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">CCHN-004128 Hợp lệ</p>
            </div>
          </Link>
        </div>

        {/* Main Workspace: Patient Queue & SOAP Note Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Queue List */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2E37A4]">queue</span>
                  Hàng Đợi Khám Hôm Nay
                </h3>
                <p className="text-xs text-slate-400">Danh sách bệnh nhân đăng ký theo giờ</p>
              </div>
              <span className="text-xs bg-[#2E37A4]/10 px-2.5 py-1 rounded-full font-bold text-[#2E37A4]">
                {patients.length} ca chờ
              </span>
            </div>

            <div className="space-y-3">
              {patients.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:border-[#2E37A4]/40 hover:bg-white transition-all space-y-2.5 cursor-pointer shadow-2xs"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#2E37A4]/10 text-[#2E37A4] font-bold text-xs flex items-center justify-center shrink-0">
                        {p.avatarText}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">{p.name}</h4>
                        <span className="text-[11px] text-[#2E37A4] font-semibold">{p.family}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.triageBg} shrink-0`}>
                      {p.triage}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    <span className="font-semibold text-slate-700">Lý do:</span> {p.chiefComplaint}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-200/60">
                    <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {p.time}
                    </span>
                    {/* BUTTON PHẢI GIỮ EXACT TEXT "Mở Phiếu khám" VÀ CLASS "py-2" ĐỂ PASS UT-CMP-15 */}
                    <button
                      type="button"
                      onClick={() => router.push('/doctor/encounters')}
                      className="px-3.5 py-2 bg-[#2E37A4] text-white rounded-xl text-xs font-bold hover:bg-[#222982] transition-colors min-h-[40px] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit_document</span>
                      <span>Mở Phiếu khám</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Quick SOAP Note Pad */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2E37A4]">clinical_notes</span>
                  Phiếu Khám Điện Tử Nhanh (SOAP)
                </h3>
                <p className="text-xs text-slate-500">Bệnh nhân: Nguyễn Văn Phúc (78 tuổi) • Hồ sơ #EMR-88219</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-xs font-mono font-bold text-[#2E37A4] border border-blue-200">
                  ICD-10: [I10]
                </span>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label htmlFor="soap-subjective" className="block text-xs font-bold text-slate-800 mb-1">
                  S - Subjective (Triệu chứng cơ năng &amp; Tiền sử)
                </label>
                <textarea
                  id="soap-subjective"
                  rows={2}
                  defaultValue="Bệnh nhân thấy hoa mắt nhẹ vào buổi sáng, không đau ngực khó thở, ăn ngủ tạm ổn."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4] transition-all"
                />
              </div>

              <div>
                <label htmlFor="soap-objective" className="block text-xs font-bold text-slate-800 mb-1">
                  O - Objective (Khám thực thể &amp; Dấu hiệu sinh tồn)
                </label>
                <textarea
                  id="soap-objective"
                  rows={2}
                  defaultValue="HA: 135/85 mmHg, Nhịp tim: 76 bpm, SpO2: 98%, Phổi trong, không ran, phù chân (-)."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4] transition-all"
                />
              </div>

              <div>
                <label htmlFor="soap-assessment" className="block text-xs font-bold text-slate-800 mb-1">
                  A - Assessment (Chẩn đoán lâm sàng)
                </label>
                <input
                  id="soap-assessment"
                  type="text"
                  defaultValue="Tăng huyết áp nguyên phát độ 1 (ICD-10: I10), Đái tháo đường type 2 (E11.9)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4] font-semibold text-[#2E37A4] transition-all"
                />
              </div>

              <div>
                <label htmlFor="soap-plan" className="block text-xs font-bold text-slate-800 mb-1">
                  P - Plan (Phác đồ &amp; Kê đơn điện tử)
                </label>
                <textarea
                  id="soap-plan"
                  rows={2}
                  defaultValue="Tiếp tục Amlodipine 5mg sáng 1 viên. Theo dõi huyết áp tại nhà 2 lần/ngày. Hẹn khám lại sau 1 tháng."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4] transition-all"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-slate-100">
                <Link
                  href="/doctor/encounters"
                  className="text-xs font-bold text-[#2E37A4] hover:underline flex items-center gap-1"
                >
                  <span>Mở giao diện Kê đơn chuyên sâu</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none px-3.5 py-2 border border-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                    Lưu nháp
                  </button>
                  <button
                    onClick={() => alert('Đã ký số HSM Viettel-CA và phát hành đơn thuốc điện tử!')}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#2E37A4] hover:bg-[#222982] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Ký số HSM &amp; Hoàn tất</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

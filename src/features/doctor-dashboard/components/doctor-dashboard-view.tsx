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
      chiefComplaint: 'Tăng huyết áp định kỳ & xét nghiệm HbA1c',
      triage: 'Cấp độ 2 (Ưu tiên cao)',
      time: '09:00 Hôm nay',
      family: 'Hộ FAM-88219',
      status: 'pending',
    },
    {
      id: 'PT-02',
      name: 'Lê Thu Trang (34 tuổi)',
      chiefComplaint: 'Khám thai định kỳ tuần 28 & tư vấn dinh dưỡng',
      triage: 'Cấp độ 3 (Tiêu chuẩn)',
      time: '10:30 Hôm nay',
      family: 'Hộ FAM-44012',
      status: 'pending',
    },
    {
      id: 'PT-03',
      name: 'Hoàng Anh Dũng (52 tuổi)',
      chiefComplaint: 'Đau khớp gối tái phát sau lao động nặng',
      triage: 'Cấp độ 3 (Tiêu chuẩn)',
      time: '14:00 Hôm nay',
      family: 'Hộ FAM-11983',
      status: 'pending',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* Sub-navigation */}
      <DoctorNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Doctor Header Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center font-bold text-2xl shadow-xs">
              BS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">Bảng Điều Khiển Lâm Sàng Bác Sĩ</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f6ffed] border border-[#b7eb8f] text-[#03864b]">
                  CCHN: 004128/BYT
                </span>
              </div>
              <p className="text-xs text-[#475569] mt-0.5">
                Bác sĩ trưởng khoa: <span className="font-semibold text-[#2563eb]">PGS.TS Nguyễn Trọng Nghĩa</span> • Cơ sở: BV Đại học Y Dược TP.HCM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Thu nhập Escrow khả dụng:</span>
              <span className="text-sm font-bold text-[#2563eb] font-mono">18.450.000đ</span>
            </div>
            <Link
              href="/doctor/telemedicine"
              className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">videocam</span>
              <span>Phòng khám WebRTC</span>
            </Link>
          </div>
        </div>

        {/* Quick Portal Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/doctor/timetable"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">calendar_clock</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-[#0f172a] group-hover:text-[#2563eb]">Lịch Trực &amp; Panel Cap</h3>
              <p className="text-[11px] text-slate-400">112/150 Hộ gia đình (74%)</p>
            </div>
          </Link>

          <Link
            href="/doctor/encounters"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-[#0f172a] group-hover:text-[#2563eb]">Khám SOAP &amp; Kê Đơn</h3>
              <p className="text-[11px] text-slate-400">Ký số HSM Viettel-CA</p>
            </div>
          </Link>

          <Link
            href="/doctor/telemedicine"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">videocam</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-[#0f172a] group-hover:text-[#2563eb]">Tư Vấn WebRTC 24/7</h3>
              <p className="text-[11px] text-slate-400">Mã hóa E2EE chuẩn y tế</p>
            </div>
          </Link>

          <Link
            href="/doctor/verification"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-[#0f172a] group-hover:text-[#2563eb]">Xác Thực CCHN BYT</h3>
              <p className="text-[11px] text-emerald-600 font-semibold">Đã phê duyệt CCHN-004128</p>
            </div>
          </Link>
        </div>

        {/* KPI Clinical Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-[#475569] font-medium">Ca khám trong ngày</span>
            <div className="text-2xl font-bold text-[#2563eb] mt-1">12 ca</div>
            <span className="text-[11px] text-[#03864b] font-medium">6 lượt thăm khám tại nhà</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-[#475569] font-medium">Đang trong phòng khám</span>
            <div className="text-2xl font-bold text-[#ae5c04] mt-1">3 ca</div>
            <span className="text-[11px] text-slate-400">Thời gian trung bình 20 phút</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-[#475569] font-medium">Chờ ký số HSM</span>
            <div className="text-2xl font-bold text-[#d52c1f] mt-1">5 đơn</div>
            <span className="text-[11px] text-[#d52c1f] font-medium">Cần ký trước 18:00</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-[#475569] font-medium">Đánh giá chất lượng SLA</span>
            <div className="text-2xl font-bold text-[#03864b] mt-1">4.9 / 5.0</div>
            <span className="text-[11px] text-slate-400">420+ gia đình phản hồi</span>
          </div>
        </div>

        {/* Main Workspace: Patient Queue & SOAP Note Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Queue List */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb]">queue</span>
                Hàng đợi Bệnh nhân Khám Hôm Nay
              </h3>
              <span className="text-xs bg-blue-50 px-2 py-0.5 rounded-full font-bold text-[#2563eb]">
                {patients.length} ca chờ
              </span>
            </div>

            <div className="space-y-3">
              {patients.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 transition-all space-y-2 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-[#0f172a]">{p.name}</h4>
                      <span className="text-[11px] text-[#2563eb] font-semibold">{p.family}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fff7e6] text-[#ae5c04] border border-[#ffd591]">
                      {p.triage}
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] line-clamp-1">
                    Lý do khám: {p.chiefComplaint}
                  </p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                    <span className="text-slate-400 font-mono text-[11px]">{p.time}</span>
                    <button
                      type="button"
                      onClick={() => router.push('/doctor/encounters')}
                      className="px-3 py-2 bg-[#2563eb] text-white rounded-lg text-xs font-semibold hover:bg-[#1d4ed8] transition-colors min-h-[40px] flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit_document</span>
                      <span>Mở Phiếu khám</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Quick SOAP Note Pad */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2563eb]">clinical_notes</span>
                  Lập Phiếu Khám Điện Tử Nhanh (SOAP)
                </h3>
                <p className="text-xs text-[#475569]">Bệnh nhân: Nguyễn Văn Phúc (78 tuổi)</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-xs font-mono font-bold text-[#2563eb] border border-blue-100">
                  ICD-10: [I10]
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="soap-subjective" className="block text-xs font-bold text-[#0f172a] mb-1">
                  S - Subjective (Triệu chứng cơ năng &amp; Tiền sử)
                </label>
                <textarea
                  id="soap-subjective"
                  rows={2}
                  defaultValue="Bệnh nhân thấy hoa mắt nhẹ vào buổi sáng, không đau ngực khó thở, ăn ngủ tạm ổn."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div>
                <label htmlFor="soap-objective" className="block text-xs font-bold text-[#0f172a] mb-1">
                  O - Objective (Khám thực thể &amp; Dấu hiệu sinh tồn)
                </label>
                <textarea
                  id="soap-objective"
                  rows={2}
                  defaultValue="HA: 135/85 mmHg, Nhịp tim: 76 bpm, SpO2: 98%, Phổi trong, không ran, phù chân (-)."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div>
                <label htmlFor="soap-assessment" className="block text-xs font-bold text-[#0f172a] mb-1">
                  A - Assessment (Chẩn đoán lâm sàng)
                </label>
                <input
                  id="soap-assessment"
                  type="text"
                  defaultValue="Tăng huyết áp nguyên phát độ 1 (ICD-10: I10), Đái tháo đường type 2 (E11.9)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-[#2563eb] font-semibold text-[#2563eb]"
                />
              </div>

              <div>
                <label htmlFor="soap-plan" className="block text-xs font-bold text-[#0f172a] mb-1">
                  P - Plan (Phác đồ &amp; Kê đơn điện tử)
                </label>
                <textarea
                  id="soap-plan"
                  rows={2}
                  defaultValue="Tiếp tục Amlodipine 5mg sáng 1 viên. Theo dõi huyết áp tại nhà 2 lần/ngày. Hẹn khám lại sau 1 tháng."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <Link
                  href="/doctor/encounters"
                  className="text-xs font-bold text-[#2563eb] hover:underline"
                >
                  Mở giao diện Kê đơn chuyên sâu &rarr;
                </Link>
                <div className="flex gap-2">
                  <button className="px-3.5 py-2 border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                    Lưu nháp
                  </button>
                  <button
                    onClick={() => alert('Đã ký số HSM Viettel-CA và phát hành đơn thuốc điện tử!')}
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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

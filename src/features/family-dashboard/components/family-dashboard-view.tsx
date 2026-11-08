'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  INITIAL_FAMILY_MEMBERS_DATA,
  MemberHealthData,
  getMemberInitials,
} from './family-member-care-view';

interface FamilyMedicationItem {
  id: string;
  memberId: string;
  memberName: string;
  relation: string;
  medName: string;
  dosage: string;
  time: string;
  timeGroup: 'morning' | 'noon' | 'evening';
  status: 'taken' | 'pending';
}

export function FamilyDashboardView() {
  const [membersData, setMembersData] = useState<Record<string, MemberHealthData>>(
    INITIAL_FAMILY_MEMBERS_DATA
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const membersList = Object.values(membersData);
  const totalMembers = membersList.length;
  const warningMembersCount = membersList.filter((m) => m.status === 'warning').length;
  const upcomingVisitsCount = membersList.filter((m) => Boolean(m.upcomingVisit)).length;

  // Tổng hợp danh sách thuốc hôm nay của cả gia đình
  const familyMedicines: FamilyMedicationItem[] = membersList.flatMap((m) =>
    m.medicines.map((med) => {
      const isEvening = med.time.toLowerCase().includes('tối') || med.time.includes('19:00') || med.time.includes('20:00');
      const isNoon = med.time.toLowerCase().includes('trưa') || med.time.includes('12:00');
      return {
        id: `${m.id}-${med.id}`,
        memberId: m.id,
        memberName: m.name,
        relation: m.relation,
        medName: med.name,
        dosage: med.dosage,
        time: med.time,
        timeGroup: isEvening ? 'evening' : isNoon ? 'noon' : 'morning',
        status: med.status,
      };
    })
  );

  const totalMedicines = familyMedicines.length;
  const takenMedicines = familyMedicines.filter((item) => item.status === 'taken').length;

  const handleToggleMedStatus = (memberId: string, medOriginalId: string) => {
    setMembersData((prev) => {
      const updated = { ...prev };
      const member = { ...updated[memberId] };
      member.medicines = member.medicines.map((m) =>
        m.id === medOriginalId
          ? { ...m, status: m.status === 'taken' ? 'pending' : 'taken' }
          : m
      );
      updated[memberId] = member;
      return updated;
    });

    setToastMessage('Đã cập nhật trạng thái uống thuốc hôm nay của gia đình!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-6xl mx-auto py-5 sm:py-7 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. HEADER HỘ GIA ĐÌNH, BÁC SĨ QUẢN NHIỆM & HÀNH ĐỘNG NHANH */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] text-white flex items-center justify-center shadow-md ring-4 ring-[#2E37A4]/10 shrink-0">
                <span className="material-symbols-outlined text-[24px] sm:text-[28px]">
                  family_restroom
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#2E37A4] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/80">
                    Hộ #FAM-88219
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    <span>Gói Bác Sĩ Gia Đình Toàn Diện VIP</span>
                  </span>
                </div>

                <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Bảng Sức Khỏe Gia Đình: Hộ Ông Nguyễn Văn Phúc
                </h1>

                <p className="text-xs text-slate-500">
                  Trung tâm điều hành sức khỏe hằng ngày • Theo dõi chỉ số sinh hiệu, nhắc lịch uống thuốc và lịch khám bác sĩ tại nhà
                </p>
              </div>
            </div>

            {/* Cụm nút hành động */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
              <Link
                href="/family/appointments"
                className="col-span-1 inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                <span>Đặt lịch khám</span>
              </Link>

              <Link
                href="/family/appointments"
                className="col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 bg-blue-50/80 hover:bg-blue-100 text-[#2E37A4] border border-blue-200/80 rounded-xl text-xs sm:text-sm font-bold transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">videocam</span>
                <span>Gọi video bác sĩ</span>
              </Link>

              <a
                href="tel:19006868"
                className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs sm:text-sm font-bold transition-all"
                title="Tổng đài y tế cấp cứu khẩn cấp 24/7"
              >
                <span className="material-symbols-outlined text-[18px]">emergency</span>
                <span>SOS 1900 6868</span>
              </a>
            </div>
          </div>

          {/* Hàng dưới: Bác sĩ quản nhiệm & Hạn mức khám */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#2E37A4] font-bold text-xs flex items-center justify-center border border-slate-200">
                  TN
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                  title="Bác sĩ đang trực tuyến"
                />
              </div>
              <div className="text-xs">
                <div className="text-slate-500">
                  Bác sĩ gia đình phụ trách chính:{' '}
                  <strong className="text-slate-900 font-bold">PGS.TS Nguyễn Trọng Nghĩa</strong>
                </div>
                <div className="text-[11px] text-slate-400">
                  Trưởng khoa Nội Tổng quát • BV Đại học Y Dược TP.HCM
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600 font-medium">
                Khám tại nhà: <strong className="text-slate-900">Còn 3/5 lượt</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600 font-medium">
                Tư vấn Video: <strong className="text-slate-900">Còn 18/20 lượt</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 2. CẢNH BÁO SỨC KHỎE HÔM NAY (NẾU CÓ THÀNH VIÊN CẦN CHÚ Ý) */}
        {warningMembersCount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px] animate-pulse">
                  warning
                </span>
              </div>
              <div className="text-xs">
                <div className="font-bold text-sm text-amber-950">
                  Lưu ý sức khỏe hôm nay: Bác Nguyễn Văn Phúc (Huyết áp 135/85 mmHg)
                </div>
                <div className="text-amber-800 mt-0.5">
                  Chỉ số tâm thu hơi cao sau bữa sáng. Cần kiểm tra lại lúc 17:00 chiều và nhắc bác uống đúng cữ Metformin 500mg sau ăn tối.
                </div>
              </div>
            </div>

            <Link
              href="/family/members/mem-01"
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors self-start sm:self-auto shrink-0 flex items-center gap-1"
            >
              <span>Xem chi tiết Bác Phúc</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* 3. TỔNG QUAN 3 KPI HÔM NAY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Trạng thái cả gia đình</span>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                {totalMembers} thành viên
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {warningMembersCount} người cần chú ý huyết áp
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">family_restroom</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Lịch hẹn khám sắp tới</span>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                {upcomingVisitsCount} lịch hẹn
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E37A4]">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                Gần nhất: 09:30 • 27/10 (Tại nhà)
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-[#2E37A4] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">event_upcoming</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Tuân thủ thuốc hôm nay</span>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                Đã dùng {takenMedicines}/{totalMedicines} cữ
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <span className="material-symbols-outlined text-[13px]">medication</span>
                Còn {totalMedicines - takenMedicines} cữ tối cần nhắc
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">pill</span>
            </div>
          </div>
        </div>

        {/* 4. TÍNH NĂNG ĐẶC THÙ CỦA DASHBOARD: LỊCH DÙNG THUỐC CẢ GIA ĐÌNH HÔM NAY (FAMILY MEDICATION TRACKER) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">pill</span>
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  Lịch Uống Thuốc Hôm Nay Của Cả Gia Đình
                </h2>
                <p className="text-xs text-slate-500">
                  Nhắc nhở và kiểm tra nhanh việc dùng thuốc của từng thành viên trong ngày
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                Tiến độ: {Math.round((takenMedicines / totalMedicines) * 100)}% ({takenMedicines}/{totalMedicines})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {familyMedicines.map((item) => {
              const isTaken = item.status === 'taken';
              const originalMedId = item.id.replace(`${item.memberId}-`, '');

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isTaken
                      ? 'bg-emerald-50/40 border-emerald-200/80'
                      : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isTaken
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-white border border-slate-200 text-[#2E37A4]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isTaken ? 'check_circle' : 'schedule'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#2E37A4]">
                          {item.memberName} ({item.relation})
                        </span>
                        <span className="text-[10px] text-slate-400">• {item.time}</span>
                      </div>
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                        {item.medName}
                      </div>
                      <div className="text-[11px] text-slate-500">{item.dosage}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleMedStatus(item.memberId, originalMedId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      isTaken
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                        : 'bg-white hover:bg-[#2E37A4] text-[#2E37A4] hover:text-white border border-[#2E37A4]/30 hover:border-[#2E37A4]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {isTaken ? 'done_all' : 'radio_button_unchecked'}
                    </span>
                    <span>{isTaken ? 'Đã uống' : 'Bấm đã uống'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. MA TRẬN SINH HIỆU & SỨC KHỎE CỦA CÁC THÀNH VIÊN (CLICK VÀO XEM CHI TIẾT 360°) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[19px] text-[#2E37A4]">
                vital_signs
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Chỉ Số Sinh Hiệu Hôm Nay Của Các Thành Viên ({totalMembers})
              </h2>
            </div>

            <Link
              href="/family/members"
              className="text-xs font-bold text-[#2E37A4] hover:underline flex items-center gap-0.5"
            >
              <span>Mở sổ Quản lý thành viên &amp; BHYT</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {membersList.map((m) => {
              const initials = getMemberInitials(m.name);
              const medTaken = m.medicines.filter((med) => med.status === 'taken').length;
              const medTotal = m.medicines.length;

              return (
                <Link
                  key={m.id}
                  href={`/family/members/${m.id}`}
                  className="group bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-[#2E37A4] shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_18px_rgba(46,55,164,0.10)] transition-all flex flex-col justify-between gap-3.5"
                >
                  {/* Hàng 1: Avatar + Tên & Quan hệ + Badge trạng thái */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2E37A4] border border-blue-200/70 group-hover:bg-[#2E37A4] group-hover:text-white group-hover:border-[#2E37A4] font-extrabold text-xs flex items-center justify-center shrink-0 transition-colors">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 group-hover:text-[#2E37A4] transition-colors truncate">
                          {m.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {m.relation} • {m.age} tuổi
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                        m.status === 'warning'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/90'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/90'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          m.status === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                      />
                      {m.status === 'warning' ? 'Cần chú ý' : 'Ổn định'}
                    </span>
                  </div>

                  {/* Hàng 2: 3 Chỉ số gọn trên 1 hàng (Huyết áp • Đường huyết • Thuốc) */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                    <div className="bg-slate-50/90 px-2 py-1.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium block">Huyết áp</span>
                      <span
                        className={`font-extrabold font-mono text-xs ${
                          m.status === 'warning' ? 'text-amber-700' : 'text-slate-800'
                        }`}
                      >
                        {m.bp}
                      </span>
                    </div>

                    <div className="bg-slate-50/90 px-2 py-1.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium block">Đường huyết</span>
                      <span className="font-extrabold font-mono text-xs text-slate-800">
                        {m.glucose.split(' ')[0]}
                      </span>
                    </div>

                    <div className="bg-slate-50/90 px-2 py-1.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium block">Thuốc</span>
                      <span className="font-extrabold font-mono text-xs text-[#2E37A4]">
                        {medTaken}/{medTotal}
                      </span>
                    </div>
                  </div>

                  {/* Hàng 3: Footer thẻ thành viên */}
                  <div className="pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate text-[11px] text-slate-400">
                      Cập nhật: {m.lastUpdated}
                    </span>
                    <span className="font-bold text-[#2E37A4] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 text-[11px]">
                      <span>Chi tiết 360°</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* Accessible Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

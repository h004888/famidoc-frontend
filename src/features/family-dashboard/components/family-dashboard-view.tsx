'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  INITIAL_FAMILY_MEMBERS_DATA,
  MemberHealthData,
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
      const isEvening =
        med.time.toLowerCase().includes('tối') ||
        med.time.includes('19:00') ||
        med.time.includes('20:00');
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
  const medPercent = totalMedicines > 0 ? Math.round((takenMedicines / totalMedicines) * 100) : 0;

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
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. HEADER THOÁNG ĐÃNG TRỰC TIẾP TRÊN NỀN CANVAS (GIẢI PHÓNG KHUNG HỘP) */}
        <header className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tabular-nums text-[#2E37A4] bg-blue-50/80 border border-blue-200/60">
                  Hộ #FAM-88219
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Gói Bác Sĩ Gia Đình Toàn Diện VIP</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Bảng Sức Khỏe Gia Đình: Hộ Ông Nguyễn Văn Phúc
              </h1>

              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                Trung tâm điều hành sức khỏe hằng ngày · Theo dõi chỉ số sinh hiệu, nhắc lịch uống thuốc và lịch khám bác sĩ tại nhà
              </p>
            </div>

            {/* Cụm nút hành động tinh gọn & phân cấp chuẩn */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/family/appointments"
                className="min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all whitespace-nowrap outline-hidden"
              >
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                <span>Đặt lịch khám</span>
              </Link>

              <Link
                href="/family/appointments"
                className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-sm font-medium shadow-xs hover:border-slate-300 transition-all whitespace-nowrap outline-hidden"
              >
                <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">videocam</span>
                <span>Gọi video bác sĩ</span>
              </Link>

              <a
                href="tel:19006868"
                className="min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/80 rounded-xl text-sm font-bold tabular-nums transition-colors whitespace-nowrap outline-hidden"
                title="Tổng đài y tế cấp cứu khẩn cấp 24/7"
              >
                <span className="material-symbols-outlined text-[19px] text-rose-600">emergency</span>
                <span>SOS 1900 6868</span>
              </a>
            </div>
          </div>
        </header>

        {/* 2. CẢNH BÁO SỨC KHỎE NHẸ NHÀNG (KHI CÓ CHỈ SỐ CẦN CHÚ Ý) */}
        {warningMembersCount > 0 && (
          <aside
            aria-label="Cảnh báo sức khỏe trong ngày"
            className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
          >
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-amber-900">
                  Lưu ý sức khỏe hôm nay: Bác Nguyễn Văn Phúc (Huyết áp 135/85 mmHg)
                </div>
                <p className="text-xs sm:text-sm text-slate-700 mt-0.5 leading-relaxed">
                  Chỉ số tâm thu hơi cao sau bữa sáng. Cần kiểm tra lại lúc 17:00 chiều và nhắc bác uống đúng cữ Metformin 500mg sau ăn tối.
                </p>
              </div>
            </div>

            <Link
              href="/family/members/mem-01"
              className="min-h-9 px-4 py-2 bg-white hover:bg-amber-100/50 text-slate-900 border border-amber-300 font-medium text-xs sm:text-sm rounded-xl transition-colors self-start sm:self-auto shrink-0 inline-flex items-center justify-center whitespace-nowrap outline-hidden shadow-xs"
            >
              Xem chi tiết Bác Phúc
            </Link>
          </aside>
        )}

        {/* 3. DẢI 3 CHỈ SỐ NHỊP NGÀY (KPI) THOÁNG ĐẠT VỚI KHOẢNG THỞ LỚN */}
        <section
          aria-label="Tổng quan chỉ số hộ gia đình"
          className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6"
        >
          {/* KPI 1 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Trạng thái cả gia đình
              </span>
              <span className="material-symbols-outlined text-slate-400 text-[20px]">group</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
              {totalMembers} thành viên
            </div>
            <div className="text-xs font-medium text-amber-800 flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>{warningMembersCount} người cần chú ý huyết áp</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tuân thủ thuốc hôm nay
              </span>
              <span className="material-symbols-outlined text-slate-400 text-[20px]">medication</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
              Đã dùng {takenMedicines}/{totalMedicines} cữ
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${medPercent}%` }}
                />
              </div>
              <div className="text-xs font-medium text-emerald-800 flex items-center justify-between">
                <span>Đạt {medPercent}%</span>
                <span className="text-slate-500 font-normal">Còn {totalMedicines - takenMedicines} cữ tối</span>
              </div>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Lịch khám sắp tới
              </span>
              <span className="material-symbols-outlined text-slate-400 text-[20px]">event_available</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
              {upcomingVisitsCount} lịch hẹn
            </div>
            <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5 pt-1">
              <span className="material-symbols-outlined text-[16px] text-[#2E37A4]">home</span>
              <span>Gần nhất: 09:30 · 27/10 (Khám tại nhà)</span>
            </div>
          </div>
        </section>

        {/* 4. MA TRẬN SINH HIỆU THÀNH VIÊN — THIẾT KẾ CARD THOÁNG MẮT, RÕ RÀNG */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Chỉ Số Sinh Hiệu Hôm Nay Của Các Thành Viên ({totalMembers})
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Cập nhật tự động từ thiết bị đo IoT gia đình và sổ theo dõi hàng ngày
              </p>
            </div>

            <Link
              href="/family/members"
              className="text-xs sm:text-sm font-semibold text-[#2E37A4] hover:text-[#222982] inline-flex items-center gap-1 hover:underline outline-hidden"
            >
              <span>Mở sổ Quản lý thành viên &amp; BHYT</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {membersList.map((m) => {
              const medTaken = m.medicines.filter((med) => med.status === 'taken').length;
              const medTotal = m.medicines.length;
              const isWarning = m.status === 'warning';

              return (
                <Link
                  key={m.id}
                  href={`/family/members/${m.id}`}
                  className="group bg-white p-6 rounded-2xl border border-slate-200/70 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 outline-hidden"
                >
                  {/* Hàng 1: Avatar, Họ tên, Tuổi, Vai trò & Badge Trạng thái */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                        {m.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-base text-slate-900 group-hover:text-[#2E37A4] transition-colors truncate">
                          {m.name}
                        </div>
                        <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          {m.relation} · <span className="tabular-nums">{m.age}</span> tuổi
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                        isWarning
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                      <span>{isWarning ? 'Cần chú ý' : 'Ổn định'}</span>
                    </span>
                  </div>

                  {/* Hàng 2: 4 Chỉ số sinh hiệu hiển thị dạng ô mềm, thoáng và chuẩn tabular-nums */}
                  <div className="grid grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100/90">
                    <div className="text-center">
                      <span className="text-[11px] font-medium text-slate-500 block truncate">
                        Huyết áp
                      </span>
                      <span
                        className={`font-bold tabular-nums text-sm sm:text-base mt-1 block truncate ${
                          isWarning ? 'text-amber-800' : 'text-slate-900'
                        }`}
                      >
                        {m.bp}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[11px] font-medium text-slate-500 block truncate">
                        SpO2
                      </span>
                      <span className="font-bold tabular-nums text-sm sm:text-base text-slate-900 mt-1 block truncate">
                        {m.spo2}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[11px] font-medium text-slate-500 block truncate">
                        Nhịp tim
                      </span>
                      <span className="font-bold tabular-nums text-sm sm:text-base text-slate-900 mt-1 block truncate">
                        {m.heartRate.split(' ')[0]}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[11px] font-medium text-slate-500 block truncate">
                        Glucose
                      </span>
                      <span className="font-bold tabular-nums text-sm sm:text-base text-slate-900 mt-1 block truncate">
                        {m.glucose.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Hàng 3: Tiến độ thuốc & Nút mở hồ sơ 360° */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="truncate">
                      Thuốc {medTaken}/{medTotal} cữ · {m.lastUpdated}
                    </span>
                    <span className="font-semibold text-[#2E37A4] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
                      <span>Chi tiết 360°</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 5. LƯỚI BẤT ĐỐI XỨNG: LỊCH UỐNG THUỐC (2/3) + BÁC SĨ GIA ĐÌNH & QUYỀN LỢI (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {/* Cột trái (2/3): Lịch uống thuốc hôm nay */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/70 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-base sm:text-lg text-slate-900">
                  Lịch Uống Thuốc Hôm Nay Của Cả Gia Đình
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Nhắc nhở và kiểm tra nhanh việc dùng thuốc của từng thành viên trong ngày
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-semibold tabular-nums bg-slate-100 text-slate-800 self-start sm:self-auto shrink-0">
                Tiến độ: {medPercent}% ({takenMedicines}/{totalMedicines})
              </span>
            </div>

            <div className="space-y-3">
              {familyMedicines.map((item) => {
                const isTaken = item.status === 'taken';
                const originalMedId = item.id.replace(`${item.memberId}-`, '');

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isTaken ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-[#2E37A4]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isTaken ? 'check' : 'medication'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 truncate">
                          {item.medName}
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          <span className="font-medium text-slate-700">{item.memberName}</span> ({item.relation}) · {item.time} · {item.dosage}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleMedStatus(item.memberId, originalMedId)}
                      className={`min-h-9 px-4 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer outline-hidden whitespace-nowrap ${
                        isTaken
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                          : 'bg-white hover:bg-slate-100 text-[#2E37A4] border border-slate-300'
                      }`}
                    >
                      {isTaken ? 'Đã uống' : 'Bấm đã uống'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Cột phải (1/3): Bác sĩ gia đình phụ trách & Hạn mức khám */}
          <aside className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-base text-slate-900">
                Bác Sĩ Quản Nhiệm
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Trực tuyến</span>
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#2E37A4] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                TN
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">
                  PGS.TS Nguyễn Trọng Nghĩa
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">
                  Trưởng khoa Nội Tổng quát · BV ĐH Y Dược
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Khám bác sĩ tại nhà</span>
                  <span className="font-semibold tabular-nums text-slate-900">Còn 3/5 lượt</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2E37A4] rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Tư vấn Video 24/7</span>
                  <span className="font-semibold tabular-nums text-slate-900">Còn 18/20 lượt</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-slate-600">Lịch khám kế tiếp</span>
                <span className="font-semibold tabular-nums text-[#2E37A4]">09:30 · 27/10</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">Hợp đồng #HD-88219</span>
              <Link
                href="/family/subscription"
                className="font-semibold text-[#2E37A4] hover:text-[#222982] hover:underline outline-hidden"
              >
                Xem quyền lợi gói VIP
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* Accessible Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm animate-fade-in"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-400">
            check_circle
          </span>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

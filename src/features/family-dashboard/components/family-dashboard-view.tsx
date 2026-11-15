'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  INITIAL_FAMILY_MEMBERS_DATA,
  MemberHealthData,
} from './family-member-care-view';
import { KpiStatCard } from '@/components/dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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

  const membersList = Object.values(membersData);
  const totalMembers = membersList.length;
  const warningMembersCount = membersList.filter((m) => m.status === 'warning').length;
  const upcomingVisitsCount = membersList.filter((m) => Boolean(m.upcomingVisit)).length;

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

    toast.success('Đã cập nhật trạng thái uống thuốc hôm nay của gia đình!');
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-sans text-slate-900 antialiased">
      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* 1. HEADER THOÁNG ĐÃNG TRỰC TIẾP TRÊN NỀN CANVAS */}
        <header className="space-y-4">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge
                  variant="outline"
                  className="rounded-full border-blue-200/70 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-primary tabular-nums"
                >
                  Hộ #FAM-88219
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-1.5 rounded-full border-emerald-200/60 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>Gói Bác Sĩ Gia Đình Toàn Diện VIP</span>
                </Badge>
              </div>

              <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Bảng Sức Khỏe Gia Đình: Hộ Ông Nguyễn Văn Phúc
              </h1>

              <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
                Trung tâm điều hành sức khỏe hằng ngày · Theo dõi chỉ số sức khỏe, nhắc lịch uống thuốc và lịch khám bác sĩ tại nhà
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Button asChild className="min-h-11 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-xs">
                <Link href="/family/appointments">
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  <span>Đặt lịch khám</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="min-h-11 rounded-xl border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Link href="/family/telemedicine">
                  <span className="material-symbols-outlined text-[20px] text-primary">videocam</span>
                  <span>Gọi video bác sĩ</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="min-h-11 rounded-xl border-rose-200/80 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 tabular-nums hover:bg-rose-100/80 hover:text-rose-800"
              >
                <a href="tel:19006868" title="Tổng đài y tế cấp cứu khẩn cấp 24/7">
                  <span className="material-symbols-outlined text-[19px] text-rose-600">emergency</span>
                  <span>SOS 1900 6868</span>
                </a>
              </Button>
            </div>
          </div>
        </header>

        {/* 2. CẢNH BÁO SỨC KHỎE BẰNG SHADCN ALERT */}
        {warningMembersCount > 0 && (
          <Alert className="flex flex-col justify-between gap-4 rounded-2xl border-amber-200/80 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div className="min-w-0">
                <AlertTitle className="text-sm font-semibold text-amber-900">
                  Lưu ý sức khỏe hôm nay: Bác Nguyễn Văn Phúc (Huyết áp 135/85 mmHg)
                </AlertTitle>
                <AlertDescription className="mt-0.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
                  Chỉ số tâm thu hơi cao sau bữa sáng. Cần kiểm tra lại lúc 17:00 chiều và nhắc bác uống đúng cữ Metformin 500mg sau ăn tối.
                </AlertDescription>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="min-h-9 shrink-0 self-start rounded-xl border-amber-300 bg-white px-4 text-xs font-medium text-slate-900 hover:bg-amber-100/50 sm:self-auto sm:text-sm"
            >
              <Link href="/family/members/mem-01">Xem chi tiết Bác Phúc</Link>
            </Button>
          </Alert>
        )}

        {/* 3. DẢI 3 CHỈ SỐ NHỊP NGÀY (KPI) */}
        <section aria-label="Tổng quan chỉ số hộ gia đình" className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
          <KpiStatCard
            title="Trạng thái cả gia đình"
            value={`${totalMembers} thành viên`}
            icon="group"
            iconClassName="bg-primary/10 text-primary"
            footer={
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
                <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>{warningMembersCount} người cần chú ý huyết áp</span>
              </div>
            }
          />

          <KpiStatCard
            title="Tuân thủ thuốc hôm nay"
            value={`Đã dùng ${takenMedicines}/${totalMedicines} cữ`}
            icon="medication"
            iconClassName="bg-emerald-50 text-emerald-700"
            footer={
              <div className="space-y-1.5">
                <Progress
                  value={medPercent}
                  aria-label="Tiến độ uống thuốc hôm nay"
                  className="h-2 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-emerald-500"
                />
                <div className="flex items-center justify-between text-xs font-medium text-emerald-800">
                  <span>Đạt {medPercent}%</span>
                  <span className="font-normal text-slate-500">
                    Còn {totalMedicines - takenMedicines} cữ tối
                  </span>
                </div>
              </div>
            }
          />

          <KpiStatCard
            title="Lịch khám sắp tới"
            value={`${upcomingVisitsCount} lịch hẹn`}
            icon="event_available"
            iconClassName="bg-primary/10 text-primary"
            footer={
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span className="material-symbols-outlined text-[16px] text-primary">home</span>
                <span>Gần nhất: 09:30 · 27/10 (Khám tại nhà)</span>
              </div>
            }
          />
        </section>

        {/* 4. CHỈ SỐ SỨC KHỎE HÔM NAY CỦA CÁC THÀNH VIÊN */}
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Chỉ Số sức khỏe Hôm Nay Của Các Thành Viên ({totalMembers})
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Cập nhật tự động từ thiết bị đo IoT gia đình và sổ theo dõi hàng ngày
              </p>
            </div>

            <Link
              href="/family/members"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline sm:text-sm"
            >
              <span>Mở sổ Quản lý thành viên &amp; BHYT</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {membersList.map((m) => {
              const medTaken = m.medicines.filter((med) => med.status === 'taken').length;
              const medTotal = m.medicines.length;
              const isWarning = m.status === 'warning';

              return (
                <Link key={m.id} href={`/family/members/${m.id}`} className="group block outline-hidden">
                  <Card className="h-full gap-5 rounded-2xl border-slate-200/70 bg-white p-6 shadow-xs transition-all hover:border-slate-300 hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl transition-transform group-hover:scale-105">
                          {m.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-primary">
                            {m.name}
                          </div>
                          <div className="mt-0.5 truncate text-xs font-medium text-slate-500">
                            {m.relation} · <span className="tabular-nums">{m.age}</span> tuổi
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`shrink-0 gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          isWarning
                            ? 'border-amber-200/80 bg-amber-50 text-amber-800'
                            : 'border-emerald-200/80 bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span>{isWarning ? 'Cần chú ý' : 'Ổn định'}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-2.5 rounded-xl border border-slate-100/90 bg-slate-50/70 p-3">
                      <div className="text-center">
                        <span className="block truncate text-[11px] font-medium text-slate-500">
                          Huyết áp
                        </span>
                        <span
                          className={`mt-1 block truncate text-sm font-bold tabular-nums sm:text-base ${
                            isWarning ? 'text-amber-800' : 'text-slate-900'
                          }`}
                        >
                          {m.bp}
                        </span>
                      </div>

                      <div className="text-center">
                        <span className="block truncate text-[11px] font-medium text-slate-500">
                          SpO2
                        </span>
                        <span className="mt-1 block truncate text-sm font-bold text-slate-900 tabular-nums sm:text-base">
                          {m.spo2}
                        </span>
                      </div>

                      <div className="text-center">
                        <span className="block truncate text-[11px] font-medium text-slate-500">
                          Nhịp tim
                        </span>
                        <span className="mt-1 block truncate text-sm font-bold text-slate-900 tabular-nums sm:text-base">
                          {m.heartRate.split(' ')[0]}
                        </span>
                      </div>

                      <div className="text-center">
                        <span className="block truncate text-[11px] font-medium text-slate-500">
                          Glucose
                        </span>
                        <span className="mt-1 block truncate text-sm font-bold text-slate-900 tabular-nums sm:text-base">
                          {m.glucose.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span className="truncate">
                        Thuốc {medTaken}/{medTotal} liều thuốc · {m.lastUpdated}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                        <span>Chi tiết</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 5. LƯỚI BẤT ĐỐI XỨNG: LỊCH UỐNG THUỐC (2/3) + BÁC SĨ QUẢN NHIỆM (1/3) */}
        <div className="grid grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-3">
          <Card className="gap-5 rounded-2xl border-slate-200/70 bg-white p-5 shadow-xs sm:p-6 lg:col-span-2">
            <CardHeader className="flex flex-col justify-between gap-3 border-b border-slate-100 p-0 pb-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 sm:text-lg">
                  Lịch Uống Thuốc Hôm Nay Của Cả Gia Đình
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  Nhắc nhở và kiểm tra nhanh việc dùng thuốc của từng thành viên trong ngày
                </CardDescription>
              </div>

              <Badge
                variant="secondary"
                className="shrink-0 self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 tabular-nums sm:self-auto"
              >
                Tiến độ: {medPercent}% ({takenMedicines}/{totalMedicines})
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3 p-0">
              {familyMedicines.map((item) => {
                const isTaken = item.status === 'taken';
                const originalMedId = item.id.replace(`${item.memberId}-`, '');

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-4 transition-colors hover:border-slate-200 hover:bg-slate-50/60"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isTaken ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isTaken ? 'check' : 'medication'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {item.medName}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{item.memberName}</span> ({item.relation}) ·{' '}
                          {item.time} · {item.dosage}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleMedStatus(item.memberId, originalMedId)}
                      className={`min-h-9 shrink-0 cursor-pointer whitespace-nowrap rounded-xl px-4 text-xs font-semibold ${
                        isTaken
                          ? 'border-emerald-200/80 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border-slate-300 bg-white text-primary hover:bg-slate-100'
                      }`}
                    >
                      {isTaken ? 'Đã uống' : 'Bấm đã uống'}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="gap-5 rounded-2xl border-slate-200/70 bg-white p-5 shadow-xs sm:p-6">
            <CardHeader className="flex flex-row items-center justify-between gap-2 p-0">
              <CardTitle className="text-base font-bold text-slate-900">Bác Sĩ Quản Nhiệm</CardTitle>
              <Badge
                variant="outline"
                className="gap-1.5 rounded-full border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Trực tuyến</span>
              </Badge>
            </CardHeader>

            <CardContent className="space-y-5 p-0">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-xs">
                  TN
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-900">
                    PGS.TS Nguyễn Trọng Nghĩa
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    Trưởng khoa Nội Tổng quát · BV ĐH Y Dược
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">Khám bác sĩ tại nhà</span>
                    <span className="font-semibold text-slate-900 tabular-nums">Còn 3/5 lượt</span>
                  </div>
                  <Progress
                    value={60}
                    aria-label="Hạn mức khám bác sĩ tại nhà"
                    className="h-1.5 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-primary"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">Tư vấn Video 24/7</span>
                    <span className="font-semibold text-slate-900 tabular-nums">Còn 18/20 lượt</span>
                  </div>
                  <Progress
                    value={90}
                    aria-label="Hạn mức tư vấn Video 24/7"
                    className="h-1.5 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-slate-600">Lịch khám kế tiếp</span>
                  <span className="font-semibold text-primary tabular-nums">09:30 · 27/10</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs">
                <span className="text-slate-500 tabular-nums">Hợp đồng #HD-88219</span>
                <Link
                  href="/family/subscription"
                  className="font-semibold text-primary hover:underline"
                >
                  Xem quyền lợi gói VIP
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

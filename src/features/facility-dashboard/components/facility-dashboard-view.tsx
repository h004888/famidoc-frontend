'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { facilitiesApi } from '@/lib/api/facilities.api';
import { contractsApi, type StaffingContractItem } from '@/lib/api/contracts.api';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { KpiStatCard, DashboardChartCard } from '@/components/dashboard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';

const channelChartData = [
  { channel: 'Tại nhà', visits: 824, share: '58%', fill: 'var(--chart-1)' },
  { channel: 'Telehealth', visits: 370, share: '26%', fill: 'var(--chart-2)' },
  { channel: 'Tại BV', visits: 226, share: '16%', fill: 'var(--chart-3)' },
];

const channelChartConfig = {
  visits: {
    label: 'Lượt khám',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function FacilityDashboardView() {
  const [facilityName, setFacilityName] = useState<string>('Cơ sở Y tế Đối tác');
  const [facilityCode, setFacilityCode] = useState<string>('CSYT-VN');
  const [isFacilityActive, setIsFacilityActive] = useState<boolean | null>(null);
  const [legalRejectionReason, setLegalRejectionReason] = useState<string | null>(null);
  const [pendingContract, setPendingContract] = useState<StaffingContractItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    facilitiesApi
      .getMyFacilityProfile()
      .then((data) => {
        if (!isMounted) return;
        if (data?.facilityName) setFacilityName(data.facilityName);
        if (data?.id) setFacilityCode(data.id);
        const active = Boolean(
          data && (data.verificationStatus === 'ACTIVE' || data.status === 'ACTIVE')
        );
        if (data) {
          setIsFacilityActive(active);
          setLegalRejectionReason(data.legalRejectionReason ?? null);
        }
        if (active) {
          contractsApi
            .getStaffingContracts()
            .then((res) => {
              if (!isMounted) return;
              if (res && Array.isArray(res.data)) {
                const draft = res.data.find(
                  (c) =>
                    c.rawStatus === 'PENDING_FACILITY_SIGNATURE' ||
                    (c.status === 'DRAFT' &&
                      c.rawStatus !== 'REVISION_REQUESTED' &&
                      !c.facilitySigned)
                );
                setPendingContract(draft || null);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = [
    {
      title: 'Bác sĩ trực thuộc',
      value: '48',
      subtitle: '42 đang trực chiến • 6 nghỉ phép',
      change: '+4 BS',
      icon: 'badge',
      iconBg: 'bg-primary/10 text-primary',
      badgeBg: 'bg-blue-50 text-primary border-blue-200',
    },
    {
      title: 'Lượt khám tháng này',
      value: '1.420',
      subtitle: '100% bệnh án điện tử đồng bộ',
      change: '+14.2%',
      icon: 'medical_services',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Chỉ số SLA đáp ứng',
      value: '98.4%',
      subtitle: 'Thời gian phản hồi TB 12 phút',
      change: 'Đạt chuẩn',
      icon: 'verified',
      iconBg: 'bg-sky-50 text-sky-600',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      title: 'Doanh thu B2B tạm tính',
      value: '416.256.900 đ',
      subtitle: 'Tỷ lệ 85% CSYT (15% Phí nền tảng CFG-03)',
      change: '+18.5%',
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
    <div className="min-h-screen bg-[#f5f6f8] font-sans text-slate-900 antialiased">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Facility Header Banner */}
        <Card className="rounded-2xl border-slate-200/80 bg-white py-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <CardContent className="flex flex-col items-start justify-between gap-5 px-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0037c1] to-[#00D3C7] text-white shadow-md ring-4 ring-primary/10">
                <span className="material-symbols-outlined text-[30px]">local_hospital</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {facilityName}
                  </h1>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Mã định danh BYT: <span className="font-bold text-slate-700 tabular-nums">{facilityCode}</span> •
                  Phụ trách mạng lưới Bác sĩ Gia đình FamiDoc
                </p>
              </div>
            </div>

            <div className="flex w-full items-center gap-2.5 md:w-auto">
              {isFacilityActive === true ? (
                <>
                  <Button asChild className="flex-1 rounded-xl px-4 py-2.5 text-xs font-bold sm:text-sm md:flex-none">
                    <Link href="/facility/staff">
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      <span>Tiếp nhận Bác sĩ</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 rounded-xl border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:text-sm md:flex-none"
                  >
                    <Link href="/facility/coordination">
                      <span className="material-symbols-outlined text-[18px] text-primary">rule_settings</span>
                      <span>Điều phối viện</span>
                    </Link>
                  </Button>
                </>
              ) : (
                <Button asChild className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-700 sm:text-sm md:flex-none">
                  <Link href="/facility/legal-profile">
                    <span className="material-symbols-outlined text-[18px]">policy</span>
                    <span>Hoàn thiện Hồ sơ Pháp lý</span>
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Banner: Hoàn thiện hồ sơ pháp lý khi chưa ACTIVE */}
        {isFacilityActive === false && (
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-300 bg-amber-50 text-amber-950 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                <span className="material-symbols-outlined text-base">policy</span>
                <span>Tài khoản cơ sở y tế đang chờ duyệt pháp lý</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                {legalRejectionReason
                  ? `Hồ sơ pháp lý cần bổ sung: "${legalRejectionReason}". Vui lòng cập nhật và nộp lại để Admin kích hoạt.`
                  : 'Vui lòng hoàn thiện và nộp hồ sơ pháp lý (GPHĐ, Mã số thuế, Tài khoản ngân hàng và bản scan PDF/Ảnh). Các chức năng B2B & quản lý bác sĩ sẽ tự động mở khóa sau khi Admin duyệt.'}
              </p>
            </div>
            <Link
              href="/facility/legal-profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0 self-start md:self-auto"
            >
              <span>Nộp / Cập nhật Hồ sơ Pháp lý</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* Action Banner: Hợp đồng B2B chờ ký kết (Flow 2.1) - CHỈ HIỂN THỊ KHI CÓ DỰ THẢO THỰC SỰ */}
        {pendingContract && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Hợp đồng Hợp tác B2B cần hoàn tất ký số
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {pendingContract.contractNumber} ({pendingContract.facilitySharePercent}% Doanh thu CSYT)
              </h3>
              <p className="text-xs text-slate-300">
                Quản trị viên FamiDoc đã phát hành dự thảo hợp đồng B2B. Cơ sở y tế vui lòng xem xét và ký số Bước 1 để hoàn tất kích hoạt với FamiDoc.
              </p>
            </div>

            <Link
              href={`/facility/contracts/${pendingContract.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all shrink-0 self-start md:self-auto"
            >
              <span className="material-symbols-outlined text-base">draw</span>
              <span>Xem &amp; Ký số ngay</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {stats.map((s, idx) => (
            <KpiStatCard
              key={idx}
              title={s.title}
              value={s.value}
              badgeText={s.change}
              badgeClassName={s.badgeBg}
              subtitle={s.subtitle}
              icon={s.icon}
              iconClassName={s.iconBg}
            />
          ))}
        </div>

        {/* Priority Referrals & Coordination Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Incoming Fast-track Referrals (8 cols) */}
          <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200/80 bg-white py-0 shadow-[0_2px_8px_rgba(0,0,0,0.03)] lg:col-span-8">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-5">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <span className="material-symbols-outlined text-[20px] text-rose-500">emergency</span>
                  <span>Luồng Tiếp Nhận Fast-Track Chuyển Viện</span>
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs text-slate-500">
                  Ca bệnh vượt tuyến hoặc can thiệp kỹ thuật cao được bác sĩ gia đình giới thiệu
                </CardDescription>
              </div>
              {isFacilityActive === true && (
                <Link
                  href="/facility/coordination"
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <span>Xem tất cả</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </Link>
              )}
            </CardHeader>

            <CardContent className="divide-y divide-slate-100 p-0">
              {incomingReferrals.map((ref) => (
                <div key={ref.id} className="p-5 transition-colors hover:bg-slate-50/70">
                  <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {ref.avatarText}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-bold text-slate-900">{ref.patientName}</span>
                        <span className="ml-2 text-xs text-slate-500 tabular-nums">#{ref.id}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ref.urgency === 'Khẩn cấp'
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : ref.urgency === 'Ưu tiên'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-blue-200 bg-blue-50 text-blue-700'
                        }`}
                      >
                        {ref.urgency}
                      </Badge>
                    </div>
                    <span className="text-xs font-medium text-slate-500">{ref.time}</span>
                  </div>

                  <p className="mb-3 pl-10.5 text-xs font-medium text-slate-600">
                    <span className="text-slate-500">Chỉ định:</span> {ref.reason}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 pl-10.5 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-primary">stethoscope</span>
                        <span>{ref.fromDoctor}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-slate-500">domain</span>
                        <span>{ref.department}</span>
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700"
                    >
                      {ref.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* SLA Capacity, Channel Chart & B2B Banner (4 cols) */}
          <div className="space-y-6 lg:col-span-4">
            <Card className="gap-4 rounded-2xl border-slate-200/80 bg-white py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <CardHeader className="flex flex-row items-center justify-between px-5 pb-0">
                <CardTitle className="text-base font-bold text-slate-900">
                  Cam Kết Chất Lượng (SLA)
                </CardTitle>
                <span className="text-xs font-bold text-emerald-600">Đạt Chuẩn A+</span>
              </CardHeader>

              <CardContent className="space-y-4 px-5 text-xs">
                <div>
                  <div className="mb-1.5 flex justify-between font-semibold">
                    <span className="text-slate-600">Đáp ứng lịch khám Bác sĩ Gia đình</span>
                    <span className="font-bold text-primary tabular-nums">98.4% / 95% SLA</span>
                  </div>
                  <Progress
                    value={98.4}
                    aria-label="Tỷ lệ đáp ứng lịch khám"
                    className="h-2 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-primary"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex justify-between font-semibold">
                    <span className="text-slate-600">Công suất Panel Cap (Bác sĩ/Hộ)</span>
                    <span className="font-bold text-emerald-600 tabular-nums">82% (Ngưỡng an toàn)</span>
                  </div>
                  <Progress
                    value={82}
                    aria-label="Công suất Panel Cap"
                    className="h-2 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-emerald-500"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex justify-between font-semibold">
                    <span className="text-slate-600">Thời gian phản hồi cấp cứu Fast-Track</span>
                    <span className="font-bold text-indigo-600 tabular-nums">&lt; 15 phút (100%)</span>
                  </div>
                  <Progress
                    value={100}
                    aria-label="Thời gian phản hồi cấp cứu Fast-Track"
                    className="h-2 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-indigo-600"
                  />
                </div>
              </CardContent>
            </Card>

            <DashboardChartCard
              title="Phân Bổ Kênh Dịch Vụ Y Tế"
              description="Tỷ lệ các kênh tiếp nhận bệnh nhân tháng này"
              config={channelChartConfig}
              chartClassName="h-[170px]"
              footer={
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      Thăm khám tại nhà
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">58% (824 ca)</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#00D3C7]" />
                      Tư vấn Telehealth HD
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">26% (370 ca)</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#fe8f1a]" />
                      Đến khám trực tiếp tại BV
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">16% (226 ca)</span>
                  </div>
                </div>
              }
            >
              <BarChart data={channelChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="channel" tickLine={false} axisLine={false} tickMargin={6} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="visits" radius={[8, 8, 0, 0]}>
                  {channelChartData.map((entry) => (
                    <Cell key={entry.channel} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </DashboardChartCard>

            {/* Platform Partnership Info */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#111827] to-[#1e1b4b] p-5 text-white shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#00D3C7]">verified</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Đối Soát Doanh Thu B2B Ký Số
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Hợp đồng chia sẻ doanh thu 70/30 đã được đối soát tự động kỳ 10/2026. Quỹ Escrow đã sẵn sàng giải ngân cho cơ sở y tế.
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
                <span className="text-slate-400 tabular-nums">B2B-YDUOC-2026</span>
                {isFacilityActive === true ? (
                  <Link href="/facility/revenue" className="font-bold text-[#00D3C7] hover:underline">
                    Kiểm tra sao kê
                  </Link>
                ) : (
                  <Link href="/facility/legal-profile" className="font-bold text-amber-300 hover:underline">
                    Chờ duyệt pháp lý
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
'use client';

import Link from 'next/link';
import { Calendar, CheckCircle2, FileText, ShieldCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FamilyGateStatusDto, FourPartyContract } from '@/lib/api';

interface ActivePackageSummaryCardProps {
  gateActive: NonNullable<FamilyGateStatusDto['activeContract']>;
  contractDetail?: FourPartyContract | null;
  totalPaidVnd: number;
  paidCount: number;
}

const shortDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatShortDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? shortDateFormatter.format(parsed)
    : value;
}

export function ActivePackageSummaryCard({
  gateActive,
  contractDetail,
  totalPaidVnd,
  paidCount,
}: ActivePackageSummaryCardProps) {
  const packageName =
    contractDetail?.packageName ||
    gateActive.packageName ||
    'Gói Chăm Sóc Sức Khỏe Gia Đình';
  const rawDetail = contractDetail as
    | (FourPartyContract & {
        startDate?: string;
        endDate?: string;
        effectiveDate?: string;
        expiryDate?: string;
      })
    | null
    | undefined;
  const startDate = rawDetail?.startDate || rawDetail?.effectiveDate;
  const endDate =
    rawDetail?.endDate || rawDetail?.expiryDate || gateActive.endDate;
  const doctorName = gateActive.doctor?.fullName || contractDetail?.doctorName;
  const hospitalName =
    gateActive.doctor?.hospitalName || contractDetail?.facilityName;

  return (
    <section
      aria-label="Gói dịch vụ đang sử dụng"
      className="space-y-4 rounded-2xl border border-emerald-200/80 bg-white p-5 sm:p-6 shadow-xs"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Gói dịch vụ đang sử dụng
            </span>
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-semibold gap-1"
            >
              <CheckCircle2 className="size-3" aria-hidden="true" />
              Đang hiệu lực
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {packageName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Hợp đồng{' '}
            <strong className="text-slate-900 tabular-nums">
              #{gateActive.contractNumber}
            </strong>
            {doctorName ? ` · ${doctorName}` : ''}
            {hospitalName ? ` · ${hospitalName}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button asChild size="sm" className="rounded-xl text-xs font-semibold">
            <Link href="/family/subscription">Xem chi tiết gói &amp; HĐ 4 bên</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
            <Link href={`/family/subscription/contract?contractId=${gateActive.id}`}>
              <FileText className="mr-1.5 size-3.5" aria-hidden="true" />
              Xem hợp đồng điện tử
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 sm:grid-cols-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Calendar className="mt-0.5 size-4 text-primary shrink-0" aria-hidden="true" />
          <div>
            <p className="text-slate-500">Thời hạn hiệu lực</p>
            <p className="font-semibold text-slate-900 tabular-nums">
              {startDate ? `${formatShortDate(startDate)} – ` : 'Đến '}
              {formatShortDate(endDate)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Users className="mt-0.5 size-4 text-primary shrink-0" aria-hidden="true" />
          <div>
            <p className="text-slate-500">Thành viên áp dụng</p>
            <p className="font-semibold text-slate-900 tabular-nums">
              {gateActive.memberCount} thành viên
            </p>
          </div>
        </div>

        <div>
          <p className="text-slate-500">Tổng đã thanh toán ghi nhận</p>
          <p className="font-bold text-primary tabular-nums">
            {totalPaidVnd.toLocaleString('vi-VN')} đ{' '}
            <span className="font-normal text-slate-500">({paidCount} biên lai)</span>
          </p>
        </div>
      </div>
    </section>
  );
}

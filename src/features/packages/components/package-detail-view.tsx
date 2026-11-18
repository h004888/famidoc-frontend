'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LandingHeader, LandingFooter } from '@/features/landing';
import { publicApi, type PublicPackageDetailDto } from '@/lib/api';

export interface PackageDetailViewProps {
  packageId?: string;
  initialPackage?: PublicPackageDetailDto | null;
}

function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
}

export function PackageDetailView({
  packageId,
  initialPackage,
}: PackageDetailViewProps) {
  const [pkg, setPkg] = useState<PublicPackageDetailDto | null>(
    initialPackage ?? null
  );
  const [isLoading, setIsLoading] = useState(!initialPackage && Boolean(packageId));
  const [notFoundError, setNotFoundError] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState<number>(
    initialPackage?.includedMembers ?? 1
  );

  useEffect(() => {
    if (initialPackage || !packageId) return;
    let active = true;

    async function loadPackage() {
      setIsLoading(true);
      setNotFoundError(null);
      try {
        const data = await publicApi.getPackageDetail(packageId!);
        if (!active) return;
        setPkg(data);
        setMemberCount(
          Math.min(
            Math.max(1, data.includedMembers),
            Math.max(1, data.maxMembers)
          )
        );
      } catch {
        if (!active) return;
        setPkg(null);
        setNotFoundError('Gói chăm sóc không tồn tại hoặc đã ngừng phát hành.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadPackage();
    return () => {
      active = false;
    };
  }, [packageId, initialPackage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex flex-col justify-between font-sans">
        <LandingHeader />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3" data-testid="package-detail-loading">
            <div className="w-8 h-8 border-2 border-[#0037c1]/20 border-t-[#0037c1] rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">
              Đang tải thông tin gói chăm sóc...
            </p>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  if (!pkg || notFoundError) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex flex-col justify-between font-sans">
        <LandingHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              Không tìm thấy gói chăm sóc
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              {notFoundError ||
                'Gói dịch vụ không tồn tại hoặc đã ngừng phát hành trên nền tảng.'}
            </p>
            <Link
              href="/packages"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#0037c1] text-white text-xs font-semibold hover:bg-[#002c9a] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Quay lại danh mục gói</span>
            </Link>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  const minMembers = Math.min(
    Math.max(1, pkg.includedMembers),
    Math.max(1, pkg.maxMembers)
  );
  const maxMembers = Math.max(1, pkg.maxMembers);
  const clampedMembers = Math.min(Math.max(minMembers, memberCount), maxMembers);
  const extraMembers = Math.max(0, clampedMembers - pkg.includedMembers);
  const extraMemberCost =
    extraMembers * pkg.additionalMemberMonthlyPrice * pkg.durationMonths;
  const totalEstimatedPrice = pkg.basePrice + extraMemberCost;
  const monthlyAverage = Math.round(
    totalEstimatedPrice / Math.max(1, pkg.durationMonths)
  );

  const trackAHref = `/doctors?packageId=${encodeURIComponent(
    pkg.id
  )}&members=${clampedMembers}`;
  const trackBHref = `/doctors/matching?packageId=${encodeURIComponent(
    pkg.id
  )}&members=${clampedMembers}`;

  return (
    <div className="min-h-screen bg-white text-[#20283d] font-sans antialiased flex flex-col justify-between">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative bg-cover bg-center py-16 sm:py-20 text-white"
          style={{ backgroundImage: "url('/images/medsev/service-details-bg.jpg')" }}
        >
          <div className="absolute inset-0 bg-[#0037c1]/85" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs text-blue-100 font-medium"
            >
              <Link href="/" className="hover:text-white transition-colors">
                Trang chủ
              </Link>
              <span>/</span>
              <Link href="/packages" className="hover:text-white transition-colors">
                Gói dịch vụ
              </Link>
              <span>/</span>
              <span className="text-white font-semibold">{pkg.packageName}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tabular-nums">
                Mã gói: {pkg.packageCode}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tabular-nums">
                Kỳ hạn {pkg.durationMonths} tháng
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {pkg.packageName}
            </h1>
            {pkg.description && (
              <p className="text-sm sm:text-base text-blue-100 max-w-3xl leading-relaxed">
                {pkg.description}
              </p>
            )}
          </div>
        </section>

        {/* Main Detail & Dual-Track Selector */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Quantitative Limits & Benefits */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[11px] text-slate-500">Thành viên mặc định</div>
                  <div className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                    {pkg.includedMembers} người
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[11px] text-slate-500">Thành viên tối đa</div>
                  <div className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                    {pkg.maxMembers} người
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[11px] text-slate-500">Khám tại nhà</div>
                  <div className="text-xl font-bold text-[#0037c1] tabular-nums mt-1">
                    {pkg.periodicVisitsQuota} lượt
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[11px] text-slate-500">Telehealth</div>
                  <div className="text-xl font-bold text-[#0037c1] tabular-nums mt-1">
                    {pkg.telehealthQuota} lượt
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Quyền Lợi Lâm Sàng Bao Gồm Trong Gói
                </h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  {(
                    pkg.benefits?.clinicalServices ?? [
                      'Khám lâm sàng tổng quát định kỳ tại nhà bởi bác sĩ gia đình',
                      'Tư vấn video Telehealth theo hạn mức gói',
                      'Hồ sơ sức khỏe điện tử (EHR) đồng bộ cho cả hộ gia đình',
                    ]
                  ).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {pkg.benefits?.emergencySupport && (
                  <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <strong>Lưu ý phạm vi:</strong> {pkg.benefits.emergencySupport}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <Table className="text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow className="bg-slate-100 border-b border-slate-200">
                      <TableHead className="py-3.5 px-4 font-bold text-slate-800">
                        Hạng mục định mức
                      </TableHead>
                      <TableHead className="py-3.5 px-4 font-bold text-slate-800 text-right">
                        Thông số áp dụng
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    <TableRow>
                      <TableCell className="py-3 px-4 font-medium text-slate-700">
                        Thời hạn hiệu lực
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {pkg.durationMonths} tháng
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="py-3 px-4 font-medium text-slate-700">
                        Số thành viên mặc định / tối đa
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {pkg.includedMembers} / {pkg.maxMembers} người
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="py-3 px-4 font-medium text-slate-700">
                        Khám tại nhà / Telehealth
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right font-bold text-[#0037c1] tabular-nums">
                        {pkg.periodicVisitsQuota} lượt tại nhà · {pkg.telehealthQuota} lượt Telehealth
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="py-3 px-4 font-medium text-slate-700">
                        Phụ phí thành viên vượt mức
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {formatVnd(pkg.additionalMemberMonthlyPrice)} / người / tháng
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Right: Member Selector + Dual-Track Entry Points */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 sticky top-6">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#0037c1] uppercase">
                  Cấu Hình Đăng Ký Gói
                </span>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-2xl font-bold text-[#0037c1] tabular-nums">
                    {formatVnd(totalEstimatedPrice)}
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums">
                    ~ {formatVnd(monthlyAverage)}/tháng
                  </span>
                </div>
                <p className="text-xs text-slate-500 tabular-nums">
                  Giá gốc {formatVnd(pkg.basePrice)} cho {pkg.includedMembers} thành viên trong{' '}
                  {pkg.durationMonths} tháng.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Số lượng thành viên gia đình
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      Từ {minMembers} đến {maxMembers} người
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                    <button
                      type="button"
                      aria-label="Giảm số thành viên"
                      disabled={clampedMembers <= minMembers}
                      onClick={() =>
                        setMemberCount(Math.max(minMembers, clampedMembers - 1))
                      }
                      className="w-7 h-7 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
                    >
                      -
                    </button>
                    <span
                      data-testid="package-detail-member-count"
                      className="min-w-[3.5rem] text-center text-xs font-bold text-slate-900 tabular-nums"
                    >
                      {clampedMembers} người
                    </span>
                    <button
                      type="button"
                      aria-label="Tăng số thành viên"
                      disabled={clampedMembers >= maxMembers}
                      onClick={() =>
                        setMemberCount(Math.min(maxMembers, clampedMembers + 1))
                      }
                      className="w-7 h-7 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {extraMembers > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-200 tabular-nums">
                    <span>
                      Phụ phí +{extraMembers} thành viên ({pkg.durationMonths} tháng)
                    </span>
                    <span className="font-semibold text-slate-900">
                      +{formatVnd(extraMemberCost)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href={trackAHref}
                  className="w-full py-3 px-4 rounded-xl bg-[#0037c1] hover:bg-[#002c9a] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-lg">person_search</span>
                  <span>Tự chọn bác sĩ còn slot (Track A)</span>
                </Link>
                <Link
                  href={trackBHref}
                  className="w-full py-3 px-4 rounded-xl border border-[#0037c1] bg-blue-50 hover:bg-blue-100 text-[#0037c1] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                  <span>Hệ thống gợi ý bác sĩ phù hợp (Track B)</span>
                </Link>
                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  Bạn sẽ xem trước thông tin 1 bác sĩ và cơ sở y tế phụ trách để xác nhận trước khi khởi tạo hợp đồng 4 bên.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

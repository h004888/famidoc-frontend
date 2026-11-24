'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { publicApi, type PublicPackageItemDto } from '@/lib/api';

export interface PackagesCatalogViewProps {
  initialPackages?: PublicPackageItemDto[];
}

function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
}

export function PackagesCatalogView({ initialPackages }: PackagesCatalogViewProps = {}) {
  const [packages, setPackages] = useState<PublicPackageItemDto[]>(initialPackages ?? []);
  const [isLoading, setIsLoading] = useState(!initialPackages);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMonthlyView, setIsMonthlyView] = useState(false);

  const [selectedEstimatorPkgId, setSelectedEstimatorPkgId] = useState<string>(
    initialPackages?.[0]?.id ?? ''
  );
  const [memberCount, setMemberCount] = useState<number>(
    initialPackages?.[0]?.includedMembers ?? 1
  );

  const fetchPackages = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await publicApi.getPackages({ limit: 50 });
      const items = res.items ?? [];
      setPackages(items);
      if (items.length > 0) {
        setSelectedEstimatorPkgId((prev) =>
          prev && items.some((p) => p.id === prev) ? prev : items[0]!.id
        );
        setMemberCount((prev) => (prev > 0 ? prev : items[0]!.includedMembers));
      }
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách gói chăm sóc từ máy chủ.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialPackages) return;
    void fetchPackages();
  }, [initialPackages]);

  const estimatorPkg = useMemo(() => {
    return (
      packages.find((p) => p.id === selectedEstimatorPkgId) ?? packages[0] ?? null
    );
  }, [packages, selectedEstimatorPkgId]);

  const handleSelectEstimatorPkg = (pkg: PublicPackageItemDto) => {
    setSelectedEstimatorPkgId(pkg.id);
    setMemberCount(Math.max(1, pkg.includedMembers));
  };

  const minMembers = estimatorPkg
    ? Math.min(Math.max(1, estimatorPkg.includedMembers), Math.max(1, estimatorPkg.maxMembers))
    : 1;
  const maxMembers = estimatorPkg ? Math.max(1, estimatorPkg.maxMembers) : 1;
  const clampedMemberCount = Math.min(Math.max(minMembers, memberCount), maxMembers);
  const extraMembers = estimatorPkg
    ? Math.max(0, clampedMemberCount - estimatorPkg.includedMembers)
    : 0;
  const extraMemberFeeTotal = estimatorPkg
    ? extraMembers * estimatorPkg.additionalMemberMonthlyPrice * estimatorPkg.durationMonths
    : 0;
  const totalEstimatedPrice = (estimatorPkg?.basePrice ?? 0) + extraMemberFeeTotal;
  const monthlyAverageEstimated = estimatorPkg
    ? Math.round(totalEstimatedPrice / Math.max(1, estimatorPkg.durationMonths))
    : 0;

  return (
    <div className="bg-white min-h-screen text-[#20283d] font-sans antialiased flex flex-col justify-between">
      <LandingHeader />

      <main className="w-full flex-1">
        {/* Hero Title */}
        <section
          className="relative bg-cover bg-center py-20 sm:py-24 text-center text-white"
          style={{ backgroundImage: "url('/images/medsev/service-details-bg.jpg')" }}
        >
          <div className="absolute inset-0 bg-[#0037c1]/85" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Gói Bác Sĩ Gia Đình &amp; Bảng Giá Dịch Vụ
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Rõ ràng số lượt khám tại nhà, tư vấn từ xa và số người trong gia đình. Bạn chỉ cần chọn gói phù hợp rồi chọn bác sĩ mình muốn hoặc để hệ thống gợi ý giúp.
            </p>
            <nav
              aria-label="Breadcrumb"
              className="inline-flex items-center justify-center gap-2 text-sm text-blue-100 font-medium"
            >
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-base">home</span>
                <span>Trang chủ</span>
              </Link>
              <span className="text-blue-200">/</span>
              <span className="text-white font-semibold">Gói dịch vụ</span>
            </nav>
          </div>
        </section>

        {/* Billing View Switcher */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20 flex justify-center">
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-md text-xs sm:text-sm font-semibold">
            <button
              type="button"
              onClick={() => setIsMonthlyView(false)}
              className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                !isMonthlyView
                  ? 'bg-[#0037c1] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Giá Trọn Gói Cả Kỳ
            </button>
            <button
              type="button"
              onClick={() => setIsMonthlyView(true)}
              className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                isMonthlyView
                  ? 'bg-[#0037c1] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Bình Quân Theo Tháng
            </button>
          </div>
        </div>

        {/* Packages Grid */}
        <section className="pt-12 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#20283d]">
              Danh Mục Gói Chăm Sóc Sức Khỏe
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Toàn bộ thông số giá và hạn mức dưới đây được đồng bộ trực tiếp từ hệ thống gói dịch vụ đang phát hành.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="packages-loading">
              {[1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
                >
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-6 w-40 bg-slate-200 rounded" />
                  <div className="h-8 w-32 bg-slate-200 rounded" />
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-3 bg-slate-200 rounded w-5/6" />
                    <div className="h-3 bg-slate-200 rounded w-4/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto space-y-4">
              <p className="text-sm font-semibold text-rose-700">{loadError}</p>
              <button
                type="button"
                onClick={() => void fetchPackages()}
                className="px-4 py-2 rounded-lg bg-[#0037c1] text-white text-xs font-semibold cursor-pointer"
              >
                Thử tải lại
              </button>
            </div>
          ) : packages.length === 0 ? (
            <div
              role="status"
              className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto space-y-4 shadow-sm"
            >
              <div className="w-14 h-14 bg-blue-50 text-[#0037c1] rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">inventory_2</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Chưa có gói chăm sóc nào</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Hiện chưa có gói chăm sóc sức khỏe nào đang phát hành.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {packages.map((pkg) => {
                const monthlyAvg = Math.round(
                  pkg.basePrice / Math.max(1, pkg.durationMonths)
                );
                const displayPrice = isMonthlyView ? formatVnd(monthlyAvg) : formatVnd(pkg.basePrice);
                const displayPeriod = isMonthlyView ? '/tháng' : `/${pkg.durationMonths} tháng`;

                return (
                  <div
                    key={pkg.id}
                    data-testid={`package-card-${pkg.packageCode}`}
                    className="rounded-2xl p-6 flex flex-col justify-between bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-[#0037c1]/50 transition-all"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0037c1] tabular-nums">
                          {pkg.durationMonths} tháng
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2">
                          {pkg.packageName}
                        </h3>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-[#0037c1] tabular-nums">
                            {displayPrice}
                          </span>
                          <span className="text-xs sm:text-sm text-slate-500 font-medium tabular-nums">
                            {displayPeriod}
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-2.5 pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-700">
                        <li className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Thành viên mặc định</span>
                          <span className="font-bold text-slate-900 tabular-nums">
                            {pkg.includedMembers} người
                          </span>
                        </li>
                        <li className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Thành viên tối đa</span>
                          <span className="font-bold text-slate-900 tabular-nums">
                            {pkg.maxMembers} người
                          </span>
                        </li>
                        <li className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Khám tại nhà</span>
                          <span className="font-bold text-slate-900 tabular-nums">
                            {pkg.periodicVisitsQuota} lượt
                          </span>
                        </li>
                        <li className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Telehealth</span>
                          <span className="font-bold text-slate-900 tabular-nums">
                            {pkg.telehealthQuota} lượt
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-5 mt-5 border-t border-slate-100">
                      <Link
                        href={`/packages/${encodeURIComponent(pkg.id)}`}
                        className="w-full py-2.5 px-3 rounded-lg bg-[#0037c1] hover:bg-[#002c9a] text-white text-xs sm:text-sm font-semibold flex items-center justify-center transition-colors"
                      >
                        <span>Xem chi tiết</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Interactive Estimator */}
        {estimatorPkg && (
          <section className="py-14 bg-slate-50 border-t border-b border-slate-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-semibold text-[#0037c1] uppercase">
                  Công Cụ Tính Dự Toán Trực Tuyến
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Dự Toán Chi Phí Thực Tế Theo Gia Đình Bạn
                </h2>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 uppercase block">
                      Bước 1: Chọn gói dịch vụ
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {packages.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectEstimatorPkg(p)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            estimatorPkg.id === p.id
                              ? 'border-[#0037c1] bg-blue-50/60 ring-2 ring-[#0037c1]/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="font-bold text-xs sm:text-sm text-slate-900">
                            {p.packageName}
                          </div>
                          <div className="text-[11px] text-[#0037c1] font-medium tabular-nums">
                            {p.durationMonths} tháng · {formatVnd(p.basePrice)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800 uppercase">
                        Bước 2: Số thành viên gia đình
                      </label>
                      <span className="text-xs text-slate-500 tabular-nums">
                        Gói gồm <strong>{estimatorPkg.includedMembers}</strong> · Tối đa{' '}
                        <strong>{estimatorPkg.maxMembers}</strong> người
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={clampedMemberCount <= minMembers}
                        onClick={() =>
                          setMemberCount(Math.max(minMembers, clampedMemberCount - 1))
                        }
                        aria-label="Giảm số thành viên gia đình"
                        className="w-10 h-10 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        -
                      </button>
                      <div className="w-24 text-center tabular-nums font-bold text-xl text-slate-900">
                        {clampedMemberCount}{' '}
                        <span className="text-xs font-normal text-slate-500">người</span>
                      </div>
                      <button
                        type="button"
                        disabled={clampedMemberCount >= maxMembers}
                        onClick={() =>
                          setMemberCount(Math.min(maxMembers, clampedMemberCount + 1))
                        }
                        aria-label="Tăng số thành viên gia đình"
                        className="w-10 h-10 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-200">
                    Bảng Bóc Tách Dự Toán
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600 tabular-nums">
                        Gói cơ bản ({estimatorPkg.durationMonths} tháng · {estimatorPkg.includedMembers} người):
                      </span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {formatVnd(estimatorPkg.basePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600 tabular-nums">
                        Phụ phí thêm người ({extraMembers} người):
                      </span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {extraMembers > 0 ? `+${formatVnd(extraMemberFeeTotal)}` : '0đ'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Lượt khám tại nhà / Telehealth:</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {estimatorPkg.periodicVisitsQuota} / {estimatorPkg.telehealthQuota} lượt
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">
                      TỔNG DỰ TOÁN THANH TOÁN:
                    </div>
                    <div className="text-2xl font-bold text-[#0037c1] tabular-nums mt-0.5">
                      {formatVnd(totalEstimatedPrice)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                      Bình quân: <strong>{formatVnd(monthlyAverageEstimated)}/tháng</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Comparison Matrix */}
        {packages.length > 0 && (
          <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Đối Chiếu Quyền Lợi Chi Tiết Các Gói Dịch Vụ
              </h2>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                    <TableHead className="p-4 min-w-[180px] font-bold text-slate-800">
                      Tiêu chí / Quyền lợi
                    </TableHead>
                    {packages.map((p) => (
                      <TableHead key={p.id} className="p-4 min-w-[140px] font-bold text-slate-800">
                        {p.packageName}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-slate-700">
                  <TableRow>
                    <TableCell className="p-4 font-semibold text-slate-900 bg-slate-50/50">
                      Thời hạn gói
                    </TableCell>
                    {packages.map((p) => (
                      <TableCell key={p.id} className="p-4 tabular-nums">
                        {p.durationMonths} tháng
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="p-4 font-semibold text-slate-900 bg-slate-50/50">
                      Thành viên mặc định / Tối đa
                    </TableCell>
                    {packages.map((p) => (
                      <TableCell key={p.id} className="p-4 tabular-nums">
                        {p.includedMembers} / {p.maxMembers} người
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="p-4 font-semibold text-slate-900 bg-slate-50/50">
                      Khám tại nhà
                    </TableCell>
                    {packages.map((p) => (
                      <TableCell key={p.id} className="p-4 tabular-nums">
                        {p.periodicVisitsQuota} lượt
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="p-4 font-semibold text-slate-900 bg-slate-50/50">
                      Tư vấn Telehealth
                    </TableCell>
                    {packages.map((p) => (
                      <TableCell key={p.id} className="p-4 tabular-nums">
                        {p.telehealthQuota} lượt
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="p-4 font-semibold text-slate-900 bg-slate-50/50">
                      Giá trọn gói cơ bản
                    </TableCell>
                    {packages.map((p) => (
                      <TableCell key={p.id} className="p-4 font-bold text-[#0037c1] tabular-nums">
                        {formatVnd(p.basePrice)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </section>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}

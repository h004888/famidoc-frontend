'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PublicDoctorCarePackageDto, PublicDoctorDto } from '@/lib/api';

export interface DoctorPackageSelectorProps {
  doctorId: string;
  doctorName: string;
  isAvailable: boolean;
  isQuotaFull?: boolean;
  remainingSlots?: number;
  facilityId: string | null;
  carePackages: PublicDoctorCarePackageDto[];
  juniorAlternatives?: PublicDoctorDto[];
  lowerPricePackages?: PublicDoctorCarePackageDto[];
  /** Mã gói người dùng đã chọn trước đó (ví dụ từ `/doctors?packageId=BASIC`). */
  initialPackageCode?: string | null;
  initialMembers?: number | null;
}

/**
 * Tìm gói khớp `packageCode` hoặc `id` (không phân biệt hoa/thường) để pre-select.
 */
export function resolveInitialPackageId(
  carePackages: PublicDoctorCarePackageDto[],
  initialPackageCode?: string | null
): string {
  const wanted = (initialPackageCode ?? '').trim().toLowerCase();
  if (wanted) {
    const matched = carePackages.find(
      (pkg) =>
        pkg.packageCode.toLowerCase() === wanted || pkg.id.toLowerCase() === wanted
    );
    if (matched) return matched.id;
  }
  return carePackages[0]?.id ?? '';
}

export function clampSelectorMemberCount(
  count: number,
  includedMembers: number,
  maxMembers: number
): number {
  const safeMax = Math.max(1, maxMembers);
  const safeMin = Math.min(Math.max(1, includedMembers), safeMax);
  return Math.min(Math.max(safeMin, count), safeMax);
}

export function clampMemberCount(count: number, maxMembers: number): number {
  return clampSelectorMemberCount(count, 1, maxMembers);
}

export function calculatePackagePrice(
  pkg: Pick<
    PublicDoctorCarePackageDto,
    'basePrice' | 'includedMembers' | 'additionalMemberMonthlyPrice' | 'durationMonths'
  >,
  memberCount: number
): {
  extraMembers: number;
  additionalCost: number;
  totalPrice: number;
} {
  const extraMembers = Math.max(0, memberCount - pkg.includedMembers);
  const additionalCost =
    extraMembers * pkg.additionalMemberMonthlyPrice * pkg.durationMonths;
  return {
    extraMembers,
    additionalCost,
    totalPrice: pkg.basePrice + additionalCost,
  };
}

function formatPackageBasePrice(packageItem: PublicDoctorCarePackageDto): string {
  return (
    packageItem.formattedPrice ||
    `${packageItem.basePrice.toLocaleString('vi-VN')}đ`
  );
}

export function DoctorPackageSelector({
  doctorId,
  doctorName,
  isAvailable,
  isQuotaFull = false,
  remainingSlots,
  facilityId,
  carePackages,
  juniorAlternatives = [],
  lowerPricePackages = [],
  initialPackageCode,
  initialMembers,
}: DoctorPackageSelectorProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    resolveInitialPackageId(carePackages, initialPackageCode)
  );
  const initialPackage =
    carePackages.find((pkg) => pkg.id === selectedPackageId) ?? carePackages[0];
  const [memberCount, setMemberCount] = useState<number>(
    initialPackage
      ? clampSelectorMemberCount(
          typeof initialMembers === 'number' && Number.isFinite(initialMembers)
            ? initialMembers
            : initialPackage.includedMembers,
          initialPackage.includedMembers,
          initialPackage.maxMembers
        )
      : 1
  );

  if (carePackages.length === 0 || !initialPackage) {
    return (
      <Card className="bg-white rounded-lg border-slate-200 p-5 shadow-xs gap-0">
        <h2 className="text-sm font-bold text-slate-900">
          Gói Chăm Sóc{' '}
          <span className="text-[11px] font-medium text-slate-500">
            (danh mục nền tảng)
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-3">
          Chưa có gói chăm sóc đang hoạt động.
        </p>
      </Card>
    );
  }

  const selectedPackage = initialPackage;
  const minMembers = Math.min(
    Math.max(1, selectedPackage.includedMembers),
    Math.max(1, selectedPackage.maxMembers)
  );
  const clampedMembers = clampSelectorMemberCount(
    memberCount,
    selectedPackage.includedMembers,
    selectedPackage.maxMembers
  );
  const { extraMembers, additionalCost, totalPrice } = calculatePackagePrice(
    selectedPackage,
    clampedMembers
  );

  const handleSelectPackage = (pkg: PublicDoctorCarePackageDto) => {
    setSelectedPackageId(pkg.id);
    setMemberCount(
      clampSelectorMemberCount(
        pkg.includedMembers,
        pkg.includedMembers,
        pkg.maxMembers
      )
    );
  };

  const quotaLocked = isQuotaFull || !isAvailable;
  const canBook = !quotaLocked && Boolean(facilityId);
  const bookingHref = facilityId
    ? `/booking?packageId=${encodeURIComponent(
        selectedPackage.id
      )}&doctorId=${encodeURIComponent(doctorId)}&facilityId=${encodeURIComponent(
        facilityId
      )}&members=${clampedMembers}`
    : '';
  const trackBHref = `/doctors/matching?packageId=${encodeURIComponent(
    selectedPackage.id
  )}&members=${clampedMembers}`;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900">
          Chọn Gói Chăm Sóc{' '}
          <span className="text-[11px] font-medium text-slate-500">
            (danh mục nền tảng)
          </span>
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Đăng ký theo dõi trực tiếp cùng {doctorName}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Chọn gói chăm sóc">
        {carePackages.map((pkg) => {
          const isSelected = pkg.id === selectedPackage.id;
          return (
            <button
              key={pkg.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleSelectPackage(pkg)}
              className={`p-2.5 rounded-md border text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'border-[#0046c0] bg-blue-50/60 ring-1 ring-[#0046c0]'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <p className="font-bold text-xs text-slate-900 truncate">
                {pkg.packageName}
              </p>
              <p className="text-[10px] font-semibold text-[#0046c0] mt-0.5">
                {pkg.durationMonths} tháng
              </p>
              <p className="text-[11px] font-bold text-slate-800 tabular-nums mt-1">
                {formatPackageBasePrice(pkg)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Mặc định {pkg.includedMembers} · Tối đa {pkg.maxMembers} người
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-md bg-slate-50 border border-slate-200 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-slate-900">
              Số lượng thành viên
            </p>
            <p className="text-[10px] text-slate-500">
              Bao gồm {selectedPackage.includedMembers} người · Tối đa{' '}
              {selectedPackage.maxMembers} người
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-md p-1">
            <button
              type="button"
              aria-label="Giảm số thành viên"
              disabled={clampedMembers <= minMembers}
              onClick={() =>
                setMemberCount(
                  clampSelectorMemberCount(
                    clampedMembers - 1,
                    selectedPackage.includedMembers,
                    selectedPackage.maxMembers
                  )
                )
              }
              className="w-6 h-6 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm font-bold"
            >
              -
            </button>
            <span
              data-testid="selected-members-count"
              className="min-w-[3.25rem] text-center text-xs font-bold text-slate-900 tabular-nums"
            >
              {clampedMembers} người
            </span>
            <button
              type="button"
              aria-label="Tăng số thành viên"
              disabled={clampedMembers >= selectedPackage.maxMembers}
              onClick={() =>
                setMemberCount(
                  clampSelectorMemberCount(
                    clampedMembers + 1,
                    selectedPackage.includedMembers,
                    selectedPackage.maxMembers
                  )
                )
              }
              className="w-6 h-6 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm font-bold"
            >
              +
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 pt-1">
          <span className="rounded bg-white border border-slate-100 px-2 py-1">
            {selectedPackage.periodicVisitsQuota} lượt khám tại nhà
          </span>
          <span className="rounded bg-white border border-slate-100 px-2 py-1">
            {selectedPackage.telehealthQuota} lượt telehealth
          </span>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <span>Giá gói ({selectedPackage.packageName})</span>
          <span className="tabular-nums font-medium text-slate-800">
            {formatPackageBasePrice(selectedPackage)}
          </span>
        </div>
        {extraMembers > 0 && (
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>
              Phụ phí +{extraMembers} người ({selectedPackage.durationMonths} tháng)
            </span>
            <span className="tabular-nums font-medium text-slate-800">
              +{additionalCost.toLocaleString('vi-VN')}đ
            </span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-bold text-slate-900">
            Tổng dự kiến
          </span>
          <span
            data-testid="estimated-package-total"
            className="text-base font-bold text-[#0046c0] tabular-nums"
          >
            {totalPrice.toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>

      {canBook ? (
        <Button asChild className="w-full py-2.5 h-auto rounded-lg bg-[#0046c0] hover:bg-[#003899] text-white text-xs sm:text-sm font-semibold gap-1.5 shadow-xs">
          <Link href={bookingHref}>
            <span>Đăng ký dịch vụ với bác sĩ</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </Button>
      ) : (
        <div className="space-y-3">
          <Button
            type="button"
            disabled
            data-testid="doctor-booking-locked-btn"
            className="w-full py-2.5 h-auto rounded-lg bg-slate-200 text-slate-500 text-xs sm:text-sm font-semibold"
          >
            Đăng ký dịch vụ với bác sĩ
          </Button>
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2 leading-relaxed">
            {quotaLocked
              ? 'Bác sĩ hiện đã kín lịch nhận hộ gia đình mới. Vui lòng chọn bác sĩ trẻ còn slot bên dưới hoặc chuyển sang hệ thống gợi ý tự động.'
              : 'Bác sĩ chưa gắn cơ sở y tế phụ trách để đăng ký gói.'}
          </p>

          {quotaLocked && (
            <div
              data-testid="junior-alternatives-section"
              className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-900">
                  Gợi ý bác sĩ trẻ còn slot
                </p>
                {typeof remainingSlots === 'number' && (
                  <span className="text-[10px] font-semibold text-amber-700 tabular-nums">
                    Còn {remainingSlots} slot
                  </span>
                )}
              </div>

              {juniorAlternatives.length > 0 ? (
                <div className="space-y-2">
                  {juniorAlternatives.map((alt) => (
                    <Link
                      key={alt.id}
                      href={`/doctors/${encodeURIComponent(alt.id)}?packageId=${encodeURIComponent(
                        lowerPricePackages[0]?.id ?? selectedPackage.id
                      )}&members=${clampedMembers}`}
                      className="block rounded-md border border-slate-200 bg-white p-2.5 hover:border-[#0046c0] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {alt.academicTitle ? `${alt.academicTitle} ` : ''}
                          {alt.doctorName}
                        </span>
                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold tabular-nums">
                          Còn {alt.remainingSlots ?? Math.max(0, (alt.maxPanelCapacity ?? 30) - (alt.activePanelCount ?? 0))} slot
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {alt.specialty} · {alt.facility?.facilityName ?? 'CSYT đối tác'}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-600">
                  Hiện chưa có bác sĩ trẻ trống lịch trực tiếp ở khu vực này.
                </p>
              )}

              {lowerPricePackages.length > 0 && (
                <div className="pt-2 border-t border-blue-200/70 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-700">
                    Gói chăm sóc mức phí tiết kiệm:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {lowerPricePackages.map((lp) => (
                      <Link
                        key={lp.id}
                        href={`/packages/${encodeURIComponent(lp.id)}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 hover:border-[#0046c0] text-[10px] font-semibold text-slate-800 tabular-nums"
                      >
                        <span>{lp.packageName}</span>
                        <span className="text-[#0046c0]">
                          {lp.formattedPrice ?? `${lp.basePrice.toLocaleString('vi-VN')}đ`}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href={trackBHref}
                className="w-full py-2 px-3 rounded-md bg-white border border-[#0046c0] text-[#0046c0] hover:bg-[#0046c0] hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <span>Tự động ghép bác sĩ phù hợp (Track B)</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import {
  ChevronRight,
  Filter,
  Search,
  Stethoscope,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  FacilityBusinessDto,
  FacilityFamilyPackageItemDto,
  PackageSalesTotals,
} from '@/lib/api/finance.api';

const contractStatusLabels: Record<string, string> = {
  ACTIVE: 'Đang hiệu lực',
  EXPIRED: 'Đã hết hạn',
  TERMINATED: 'Đã chấm dứt',
  PENDING_PAYMENT: 'Chờ thanh toán',
  PENDING_APPROVAL: 'Chờ duyệt',
};

const contractStatusStyles: Record<string, string> = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-700',
  TERMINATED: 'border-red-200 bg-red-50 text-red-700',
  PENDING_PAYMENT: 'border-amber-200 bg-amber-50 text-amber-800',
  PENDING_APPROVAL: 'border-blue-200 bg-blue-50 text-blue-800',
};

function formatDateVi(iso?: string | null) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('vi-VN');
}

export function FacilityFamilyPackagesPanel({
  business,
  periodLabel,
  formatAmount,
  selectedPackageCode,
  onClearPackageFilter,
}: {
  business: FacilityBusinessDto;
  periodLabel?: string;
  formatAmount: (value: number) => string;
  selectedPackageCode?: string | null;
  onClearPackageFilter?: () => void;
}) {
  const familyPackages = useMemo(
    () => business.familyPackages ?? [],
    [business.familyPackages],
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] =
    useState<FacilityFamilyPackageItemDto | null>(null);

  const selectedPackageName = useMemo(() => {
    if (!selectedPackageCode) return null;
    const fromSummary = business.purchases.byPackage.find(
      (pkg) => pkg.packageCode === selectedPackageCode,
    );
    if (fromSummary) return fromSummary.packageName;
    const fromItems = familyPackages.find(
      (item) => item.packageCode === selectedPackageCode,
    );
    return fromItems?.packageName ?? selectedPackageCode;
  }, [business.purchases.byPackage, familyPackages, selectedPackageCode]);

  const filteredPackages = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return familyPackages.filter((item) => {
      if (selectedPackageCode && item.packageCode !== selectedPackageCode) {
        return false;
      }
      if (!keyword) return true;
      const doctorMatch = item.participatingDoctors.some(
        (doc) =>
          doc.doctorName.toLowerCase().includes(keyword) ||
          doc.specialty.toLowerCase().includes(keyword),
      );
      return (
        item.familyName.toLowerCase().includes(keyword) ||
        item.packageName.toLowerCase().includes(keyword) ||
        item.contractNumber.toLowerCase().includes(keyword) ||
        item.invoiceCode.toLowerCase().includes(keyword) ||
        doctorMatch
      );
    });
  }, [familyPackages, searchQuery, selectedPackageCode]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-5">
        <div className="min-w-0 space-y-0.5">
          <h2
            id="facility-family-packages-title"
            className="text-sm font-bold text-slate-900 sm:text-base"
          >
            Quản lý gói gia đình đã mua &amp; Bác sĩ tham gia khám
          </h2>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {selectedPackageCode && (
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/30 bg-primary/5 py-1 pr-1.5 pl-2.5 text-xs font-medium text-primary"
            >
              <Filter aria-hidden="true" className="size-3" />
              <span>Gói: {selectedPackageName}</span>
              {onClearPackageFilter && (
                <button
                  type="button"
                  aria-label="Bỏ lọc gói dịch vụ"
                  onClick={onClearPackageFilter}
                  className="rounded-full p-0.5 hover:bg-primary/15"
                >
                  <X aria-hidden="true" className="size-3" />
                </button>
              )}
            </Badge>
          )}

          {familyPackages.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              />
              <Input
                type="search"
                aria-label="Tìm theo gia đình, bác sĩ hoặc gói dịch vụ"
                placeholder="Tìm gia đình, bác sĩ, tên gói..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-8.5 bg-white pl-9 text-xs sm:text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Bảng chia cột gọn, dễ quét */}
      <div className="hidden md:block">
        <Table
          aria-labelledby="facility-family-packages-title"
          className="border-collapse"
        >
          <TableHeader>
            <TableRow className="bg-slate-50/90 hover:bg-slate-50/90">
              <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                Hộ gia đình
              </TableHead>
              <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                Gói dịch vụ đã mua
              </TableHead>
              <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                Bác sĩ tham gia khám
              </TableHead>
              <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                Trạng thái &amp; Thời hạn
              </TableHead>
              <TableHead className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                Chi tiết đối soát
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPackages.map((item) => {
              const statusLabel =
                contractStatusLabels[item.contractStatus] ?? item.contractStatus;
              const statusClass =
                contractStatusStyles[item.contractStatus] ??
                'border-slate-200 bg-slate-50 text-slate-700';

              return (
                <TableRow
                  key={item.invoiceId}
                  className="cursor-pointer transition-colors hover:bg-primary/5"
                  onClick={() => setSelectedPackage(item)}
                >
                  <TableCell className="border-r border-slate-200 px-4 py-3 align-top whitespace-normal">
                    <p className="font-semibold text-slate-900">{item.familyName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.memberCount.toLocaleString('vi-VN')} thành viên
                      {item.contractNumber ? (
                        <>
                          {' · '}
                          <span className="tabular-nums">{item.contractNumber}</span>
                        </>
                      ) : null}
                    </p>
                  </TableCell>

                  <TableCell className="border-r border-slate-200 px-4 py-3 align-top whitespace-normal">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-slate-900">
                        {item.packageName}
                      </span>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-700"
                      >
                        {item.durationMonths} tháng
                      </Badge>
                    </div>
                    {(item.startDate || item.paidAt) && (
                      <p className="mt-1 text-xs text-slate-500">
                        Đăng ký: {formatDateVi(item.startDate ?? item.paidAt)}
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="border-r border-slate-200 px-4 py-3 align-top whitespace-normal">
                    {item.participatingDoctors.length > 0 ? (
                      <ul className="space-y-1.5">
                        {item.participatingDoctors.map((doc) => (
                          <li key={doc.id} className="text-xs leading-snug">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-slate-900">
                                {doc.doctorName}
                              </span>
                              {doc.encounterCount > 0 && (
                                <span className="text-[11px] text-slate-500 tabular-nums">
                                  ({doc.encounterCount} lượt khám)
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500">{doc.specialty}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-slate-500">
                        Chưa phân công bác sĩ
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="border-r border-slate-200 px-4 py-3 align-top whitespace-normal">
                    <Badge variant="outline" className={statusClass}>
                      {statusLabel}
                    </Badge>
                    {item.endDate && (
                      <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
                        Hết hạn: {formatDateVi(item.endDate)}
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-left align-middle">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedPackage(item);
                      }}
                    >
                      Xem chi tiết
                      <ChevronRight aria-hidden="true" className="ml-1 size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredPackages.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="px-4 py-10 text-left text-sm text-slate-600"
                >
                  {familyPackages.length === 0
                    ? 'Chưa có gói gia đình nào phát sinh hoặc đang phục vụ trong kỳ này.'
                    : 'Không tìm thấy gói gia đình phù hợp với bộ lọc hiện tại.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Thẻ danh sách bấm vào xem chi tiết */}
      <div className="divide-y divide-slate-200 md:hidden">
        {filteredPackages.map((item) => {
          const statusLabel =
            contractStatusLabels[item.contractStatus] ?? item.contractStatus;
          const statusClass =
            contractStatusStyles[item.contractStatus] ??
            'border-slate-200 bg-slate-50 text-slate-700';

          return (
            <div key={item.invoiceId} className="space-y-3 p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{item.familyName}</p>
                  <p className="text-xs text-slate-500">
                    {item.packageName} · {item.durationMonths} tháng
                  </p>
                </div>
                <Badge variant="outline" className={statusClass}>
                  {statusLabel}
                </Badge>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-xs">
                <p className="font-semibold text-slate-700">Bác sĩ tham gia khám</p>
                {item.participatingDoctors.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {item.participatingDoctors.map((doc) => (
                      <li key={doc.id} className="text-slate-700">
                        <span className="font-medium text-slate-900">
                          {doc.doctorName}
                        </span>{' '}
                        · {doc.specialty}
                        {doc.isPrimary ? ' (Phụ trách)' : ''}
                        {doc.encounterCount > 0
                          ? ` · ${doc.encounterCount} lượt khám`
                          : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-slate-500">Chưa phân công bác sĩ</p>
                )}
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full justify-between border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                onClick={() => setSelectedPackage(item)}
              >
                <span>Xem giá gói &amp; chi tiết đối soát</span>
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          );
        })}

        {filteredPackages.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-600">
            {familyPackages.length === 0
              ? 'Chưa có gói gia đình nào phát sinh hoặc đang phục vụ trong kỳ này.'
              : 'Không tìm thấy gói gia đình phù hợp với bộ lọc hiện tại.'}
          </p>
        )}
      </div>

      {/* Tầng sâu nhất: Hộp thoại chi tiết giá gói, % nền tảng thu & tiền CSYT nhận */}
      <Dialog
        open={selectedPackage !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPackage(null);
        }}
      >
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
          {selectedPackage && (
            <>
              <DialogHeader className="border-b border-slate-200 px-6 py-4 text-left">
                <div className="flex flex-wrap items-center gap-2 pr-6">
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Chi tiết giá gói &amp; doanh thu CSYT
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className={
                      contractStatusStyles[selectedPackage.contractStatus] ??
                      'border-slate-200 bg-slate-50 text-slate-700'
                    }
                  >
                    {contractStatusLabels[selectedPackage.contractStatus] ??
                      selectedPackage.contractStatus}
                  </Badge>
                </div>
                <DialogDescription className="text-sm text-slate-600">
                  {selectedPackage.packageName} ({selectedPackage.durationMonths} tháng) · Hộ{' '}
                  {selectedPackage.familyName}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-7">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <Users aria-hidden="true" className="size-3.5 text-primary" />
                      <span>Hộ gia đình &amp; Hợp đồng</span>
                    </div>
                    <dl className="mt-3 divide-y divide-slate-100 text-sm">
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">Đại diện hộ</dt>
                        <dd className="truncate text-right font-semibold text-slate-900">
                          {selectedPackage.familyName}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">Thành viên</dt>
                        <dd className="whitespace-nowrap text-right font-medium text-slate-800 tabular-nums">
                          {selectedPackage.memberCount.toLocaleString('vi-VN')} người
                        </dd>
                      </div>
                      {selectedPackage.contractNumber && (
                        <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                          <dt className="shrink-0 whitespace-nowrap text-slate-500">Mã hợp đồng</dt>
                          <dd className="truncate text-right font-medium text-slate-800 tabular-nums">
                            {selectedPackage.contractNumber}
                          </dd>
                        </div>
                      )}
                      {selectedPackage.invoiceCode && (
                        <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                          <dt className="shrink-0 whitespace-nowrap text-slate-500">Mã hóa đơn</dt>
                          <dd className="truncate text-right font-medium text-slate-800 tabular-nums">
                            {selectedPackage.invoiceCode}
                          </dd>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">Ngày đăng ký</dt>
                        <dd className="whitespace-nowrap text-right font-medium text-slate-800 tabular-nums">
                          {formatDateVi(selectedPackage.startDate ?? selectedPackage.paidAt)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">Ngày hết hạn</dt>
                        <dd className="whitespace-nowrap text-right font-medium text-slate-800 tabular-nums">
                          {formatDateVi(selectedPackage.endDate)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <Stethoscope aria-hidden="true" className="size-3.5 text-primary" />
                      <span>Bác sĩ tham gia khám</span>
                    </div>
                    {selectedPackage.participatingDoctors.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {selectedPackage.participatingDoctors.map((doc) => (
                          <li
                            key={doc.id}
                            className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="font-semibold text-slate-900">
                                {doc.doctorName}
                              </span>
                              <div className="flex items-center gap-1">
                                {doc.isPrimary && (
                                  <Badge
                                    variant="outline"
                                    className="border-primary/30 bg-primary/5 px-1.5 py-0 text-[10px] font-medium text-primary"
                                  >
                                    Phụ trách chính
                                  </Badge>
                                )}
                                {doc.encounterCount > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="border-slate-200 bg-white px-1.5 py-0 text-[10px] text-slate-700 tabular-nums"
                                  >
                                    {doc.encounterCount} lượt khám
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="mt-0.5 text-slate-500">{doc.specialty}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">
                        Chưa có bác sĩ được phân công hoặc ghi nhận lượt khám cho hợp đồng này.
                      </p>
                    )}
                  </div>
                </div>

                {/* Chi tiết giá gói, % nền tảng thu và tiền CSYT nhận */}
                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Wallet aria-hidden="true" className="size-4 text-primary" />
                    <span>Chi tiết giá gói &amp; phân chia doanh thu</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-primary">
                        Tiền nhận cho CSYT ({selectedPackage.facilitySharePercent}%)
                      </span>
                      <span className="text-amber-700">
                        Phí nền tảng ({selectedPackage.platformFeePercent}%)
                      </span>
                    </div>
                    <div
                      className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
                      role="img"
                      aria-label={`Tỷ lệ phân chia: CSYT nhận ${selectedPackage.facilitySharePercent}%, nền tảng thu ${selectedPackage.platformFeePercent}%`}
                    >
                      <div
                        className="bg-primary"
                        style={{ width: `${selectedPackage.facilitySharePercent}%` }}
                      />
                      <div
                        className="bg-amber-500"
                        style={{ width: `${selectedPackage.platformFeePercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/90 text-left text-xs font-semibold text-slate-700">
                          <th className="border-r border-slate-200 px-4 py-2.5 text-left">
                            Khoản mục đối soát
                          </th>
                          <th className="border-r border-slate-200 px-4 py-2.5 text-left">
                            Tỷ lệ
                          </th>
                          <th className="px-4 py-2.5 text-left">Số tiền (VND)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="border-r border-slate-200 px-4 py-3 text-left font-medium text-slate-900">
                            Giá gói gia đình thanh toán
                          </td>
                          <td className="border-r border-slate-200 px-4 py-3 text-left font-medium text-slate-700 tabular-nums">
                            100%
                          </td>
                          <td className="px-4 py-3 text-left font-semibold text-slate-900 tabular-nums">
                            {formatAmount(selectedPackage.packagePriceVnd)}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-slate-200 px-4 py-3 text-left text-slate-700">
                            <p className="font-medium text-slate-900">
                              Phí nền tảng FamiDoc
                            </p>
                          </td>
                          <td className="border-r border-slate-200 px-4 py-3 text-left font-semibold text-amber-700 tabular-nums">
                            {selectedPackage.platformFeePercent}%
                          </td>
                          <td className="px-4 py-3 text-left font-semibold text-amber-700 tabular-nums">
                            −{formatAmount(selectedPackage.platformFeeVnd)}
                          </td>
                        </tr>
                        <tr className="bg-primary/5">
                          <td className="border-r border-slate-200 px-4 py-3 text-left">
                            <p className="font-bold text-slate-900">
                              Tiền nhận được cho CSYT
                            </p>
                            <p className="mt-0.5 text-xs text-slate-600">
                              Chưa khấu trừ thuế; CSYT và bác sĩ tự kê khai và nộp thuế phát sinh
                            </p>
                          </td>
                          <td className="border-r border-slate-200 px-4 py-3 text-left font-bold text-primary tabular-nums">
                            {selectedPackage.facilitySharePercent}%
                          </td>
                          <td className="px-4 py-3 text-left text-base font-bold text-primary tabular-nums">
                            {formatAmount(selectedPackage.facilityShareVnd)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {selectedPackage.periodRecognition &&
                    selectedPackage.periodRecognition.grossVnd !==
                      selectedPackage.packagePriceVnd && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-950">
                        <p className="font-semibold">
                          Phân bổ ghi nhận trong kỳ {periodLabel ?? 'đang xem'} (
                          {formatDateVi(selectedPackage.periodRecognition.serviceFrom)} –{' '}
                          {formatDateVi(selectedPackage.periodRecognition.serviceUntil)})
                        </p>
                        <dl className="mt-2 grid gap-2 sm:grid-cols-3">
                          <div>
                            <dt className="text-blue-800/80">Doanh thu kỳ này</dt>
                            <dd className="font-semibold tabular-nums">
                              {formatAmount(selectedPackage.periodRecognition.grossVnd)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-blue-800/80">
                              Phí nền tảng ({selectedPackage.platformFeePercent}%)
                            </dt>
                            <dd className="font-semibold tabular-nums">
                              {formatAmount(
                                selectedPackage.periodRecognition.platformFeeVnd,
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-blue-800/80">
                              CSYT nhận kỳ này ({selectedPackage.facilitySharePercent}%)
                            </dt>
                            <dd className="font-bold text-primary tabular-nums">
                              {formatAmount(
                                selectedPackage.periodRecognition.facilityShareVnd,
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    )}
                </div>
              </div>

              <DialogFooter className="border-t border-slate-200 bg-white px-5 py-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedPackage(null)}
                >
                  Đóng
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function FacilityPackageSummaryPanel({
  business,
  formatAmount,
  onSelectPackage,
}: {
  business: FacilityBusinessDto;
  formatAmount: (value: number) => string;
  onSelectPackage?: (packageCode: string) => void;
}) {
  const { purchases } = business;

  return (
    <>
      <div className="space-y-0.5 border-b border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-5">
        <h2
          id="facility-sales-title"
          className="text-sm font-bold text-slate-900 sm:text-base"
        >
          Gói đã thanh toán trong tháng
        </h2>
      </div>
      <Table aria-labelledby="facility-sales-title" className="border-collapse">
        <TableHeader>
          <TableRow className="bg-slate-50/90 hover:bg-slate-50/90">
            <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
              Gói dịch vụ
            </TableHead>
            <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
              Số gói
            </TableHead>
            <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
              Đã thu
            </TableHead>
            <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold whitespace-normal text-slate-700">
              Phí nền tảng (15%)
            </TableHead>
            <TableHead className="px-4 py-2.5 text-left text-xs font-semibold whitespace-normal text-slate-700">
              Phần CSYT sau phí
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.byPackage.map((item) => (
            <TableRow
              key={item.packageCode}
              className={
                onSelectPackage
                  ? 'cursor-pointer transition-colors hover:bg-primary/5'
                  : undefined
              }
              onClick={() => onSelectPackage?.(item.packageCode)}
            >
              <TableCell className="border-r border-slate-200 px-4 py-3 text-left whitespace-normal font-medium text-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <span>{item.packageName}</span>
                  {onSelectPackage && (
                    <ChevronRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-slate-400"
                    />
                  )}
                </div>
              </TableCell>
              <SalesValues sales={item} formatAmount={formatAmount} />
            </TableRow>
          ))}
          {purchases.byPackage.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-left px-4 text-sm text-slate-600">
                Chưa có gói đã thanh toán trong kỳ.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter className="bg-slate-50 font-semibold">
          <TableRow>
            <TableCell className="border-r border-slate-200 px-4 py-3 text-left">
              Tổng cộng
            </TableCell>
            <SalesValues sales={purchases} formatAmount={formatAmount} />
          </TableRow>
        </TableFooter>
      </Table>
    </>
  );
}

function SalesValues({
  sales,
  formatAmount,
}: {
  sales: PackageSalesTotals;
  formatAmount: (value: number) => string;
}) {
  return (
    <>
      <TableCell className="border-r border-slate-200 px-4 py-3 text-left tabular-nums">
        {sales.packagesSold.toLocaleString('vi-VN')}
      </TableCell>
      <TableCell className="border-r border-slate-200 px-4 py-3 text-left tabular-nums">
        {formatAmount(sales.grossVnd)}
      </TableCell>
      <TableCell className="border-r border-slate-200 px-4 py-3 text-left tabular-nums">
        {formatAmount(sales.platformFeeVnd)}
      </TableCell>
      <TableCell className="px-4 py-3 text-left font-medium text-primary tabular-nums">
        {formatAmount(sales.facilityShareVnd)}
      </TableCell>
    </>
  );
}

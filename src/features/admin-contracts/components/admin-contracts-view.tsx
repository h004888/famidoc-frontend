'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  RotateCcw,
  Search,
} from 'lucide-react';
import type { FourPartyContract } from '@/features/four-party-contract';
import {
  contractsApi,
  extractErrorMessage,
  type StaffingContractItem,
} from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CreateB2BContractDialog } from './create-b2b-contract-dialog';

type ContractKind = 'FOUR_PARTY' | 'B2B';
type TypeFilter = 'ALL' | ContractKind;
type StatusFilter =
  | 'ALL'
  | 'READY_FOR_ADMIN'
  | 'WAITING_OTHERS'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'CANCELLED';
type SortOption = 'newest' | 'oldest' | 'price_desc';

interface UnifiedAdminContractRow {
  id: string;
  kind: ContractKind;
  contractNumber: string;
  partnerName: string;
  partnerSub: string;
  contentTitle: string;
  contentSub: string;
  sortPrice: number;
  createdAt: string;
  statusKey: Exclude<StatusFilter, 'ALL'>;
  statusLabel: string;
  statusClassName: string;
  isReadyForAdmin: boolean;
  medicalContract?: FourPartyContract;
  staffingContract?: StaffingContractItem;
}

const PAGE_SIZE = 8;

function formatCurrencyVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

function formatShortDate(value?: string): string {
  if (!value) return '—';
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(ts));
}

function mapMedicalRow(contract: FourPartyContract): UnifiedAdminContractRow {
  const familySigned = Boolean(contract.signatures?.family);
  const adminSigned = Boolean(contract.signatures?.platform);
  const isCancelled = contract.status === 'CANCELLED';
  const isActive = contract.status === 'ACTIVE';
  const isPendingPayment = contract.status === 'PENDING_PAYMENT';
  const isReadyForAdmin =
    !isCancelled &&
    !isActive &&
    !isPendingPayment &&
    familySigned &&
    !adminSigned &&
    contract.documensoEnvelopeId !== null;

  let statusKey: UnifiedAdminContractRow['statusKey'] = 'WAITING_OTHERS';
  let statusLabel = 'Chờ gia đình ký';
  let statusClassName = 'border-slate-200 bg-slate-100 text-slate-700';

  if (isCancelled) {
    statusKey = 'CANCELLED';
    statusLabel = 'Đã hủy / Hết hạn';
    statusClassName = 'border-rose-200 bg-rose-50 text-rose-700';
  } else if (isActive) {
    statusKey = 'ACTIVE';
    statusLabel = 'Đang hiệu lực';
    statusClassName = 'border-emerald-200 bg-emerald-50 text-emerald-700';
  } else if (isPendingPayment) {
    statusKey = 'PENDING_PAYMENT';
    statusLabel = 'Chờ thanh toán';
    statusClassName = 'border-primary/20 bg-primary/10 text-primary';
  } else if (isReadyForAdmin) {
    statusKey = 'READY_FOR_ADMIN';
    statusLabel = 'Chờ Admin ký';
    statusClassName = 'border-amber-200 bg-amber-50 text-amber-800';
  } else if (adminSigned) {
    statusKey = 'WAITING_OTHERS';
    statusLabel = 'Chờ CSYT / BS';
    statusClassName = 'border-sky-200 bg-sky-50 text-sky-800';
  }

  const facilityPart = contract.facilityName ? ` · ${contract.facilityName}` : '';

  return {
    id: contract.id,
    kind: 'FOUR_PARTY',
    contractNumber: contract.contractNumber,
    partnerName: contract.familyRepresentativeName || 'Đại diện Hộ gia đình',
    partnerSub: `${contract.membersCount ?? 1} thành viên${facilityPart}`,
    contentTitle: contract.packageName,
    contentSub: formatCurrencyVnd(contract.packagePrice),
    sortPrice: contract.packagePrice,
    createdAt: contract.createdAt,
    statusKey,
    statusLabel,
    statusClassName,
    isReadyForAdmin,
    medicalContract: contract,
  };
}

function mapStaffingRow(item: StaffingContractItem): UnifiedAdminContractRow {
  const isTerminated =
    item.status === 'TERMINATED' || item.rawStatus === 'REVISION_REQUESTED';
  const isActive = item.status === 'ACTIVE';
  const isReadyForAdmin =
    !isTerminated &&
    !isActive &&
    !item.adminSigned &&
    Boolean(item.facilitySigned);

  let statusKey: UnifiedAdminContractRow['statusKey'] = 'WAITING_OTHERS';
  let statusLabel = 'Chờ CSYT ký';
  let statusClassName = 'border-slate-200 bg-slate-100 text-slate-700';

  if (isActive) {
    statusKey = 'ACTIVE';
    statusLabel = 'Đang hiệu lực';
    statusClassName = 'border-emerald-200 bg-emerald-50 text-emerald-700';
  } else if (item.rawStatus === 'REVISION_REQUESTED') {
    statusKey = 'CANCELLED';
    statusLabel = 'CSYT yêu cầu sửa';
    statusClassName = 'border-rose-200 bg-rose-50 text-rose-700';
  } else if (item.status === 'TERMINATED') {
    statusKey = 'CANCELLED';
    statusLabel = 'Đã chấm dứt';
    statusClassName = 'border-slate-200 bg-slate-100 text-slate-600';
  } else if (isReadyForAdmin) {
    statusKey = 'READY_FOR_ADMIN';
    statusLabel = 'Chờ Admin ký';
    statusClassName = 'border-amber-200 bg-amber-50 text-amber-800';
  }

  return {
    id: item.id,
    kind: 'B2B',
    contractNumber: item.contractNumber,
    partnerName: item.facilityName || 'Cơ sở Y tế đối tác',
    partnerSub: `${formatShortDate(item.validFrom)} – ${formatShortDate(item.validTo)}`,
    contentTitle: 'Cung ứng nhân lực B2B',
    contentSub: `CSYT ${item.facilitySharePercent}% · FD ${item.platformSharePercent}%`,
    sortPrice: 0,
    createdAt: item.validFrom || '',
    statusKey,
    statusLabel,
    statusClassName,
    isReadyForAdmin,
    staffingContract: item,
  };
}

export function AdminContractsView() {
  const [contracts, setContracts] = useState<FourPartyContract[]>([]);
  const [staffingList, setStaffingList] = useState<StaffingContractItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateB2BModal, setShowCreateB2BModal] = useState(false);

  const triggerReload = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadTick((t) => t + 1);
  };

  useEffect(() => {
    let active = true;
    async function loadContracts() {
      try {
        const [items, staffingRes] = await Promise.allSettled([
          contractsApi.getMedicalContracts({ all: true }),
          contractsApi.getStaffingContracts(undefined, { throwOnError: true }),
        ]);

        if (!active) return;

        if (items.status === 'fulfilled') {
          setContracts(items.value);
          setLoadError(null);
        } else {
          setLoadError(
            items.reason instanceof Error
              ? items.reason.message
              : 'Không thể tải danh sách hợp đồng y tế từ máy chủ.'
          );
        }

        if (staffingRes.status === 'fulfilled' && staffingRes.value?.data) {
          setStaffingList(staffingRes.value.data);
        } else if (staffingRes.status === 'rejected') {
          const error = extractErrorMessage(
            staffingRes.reason,
            'Không thể tải hợp đồng B2B.'
          );
          setLoadError((previous) => (previous ? `${previous} ${error}` : error));
        }
      } catch (err) {
        if (!active) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh sách hợp đồng từ máy chủ.'
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    void loadContracts();
    return () => {
      active = false;
    };
  }, [reloadTick]);

  const allRows = useMemo(
    () => [
      ...contracts.map(mapMedicalRow),
      ...staffingList.map(mapStaffingRow),
    ],
    [contracts, staffingList]
  );

  const stats = useMemo(
    () => ({
      total: allRows.length,
      readyForAdmin: allRows.filter((r) => r.statusKey === 'READY_FOR_ADMIN')
        .length,
      active: allRows.filter((r) => r.statusKey === 'ACTIVE').length,
    }),
    [allRows]
  );

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = allRows.filter((row) => {
      if (typeFilter !== 'ALL' && row.kind !== typeFilter) return false;
      if (statusFilter !== 'ALL' && row.statusKey !== statusFilter) return false;
      if (!q) return true;
      return (
        row.contractNumber.toLowerCase().includes(q) ||
        row.partnerName.toLowerCase().includes(q) ||
        row.partnerSub.toLowerCase().includes(q) ||
        row.contentTitle.toLowerCase().includes(q)
      );
    });

    return [...matched].sort((a, b) => {
      if (sortBy === 'price_desc') {
        return b.sortPrice - a.sortPrice;
      }
      const tsA = Date.parse(a.createdAt) || 0;
      const tsB = Date.parse(b.createdAt) || 0;
      return sortBy === 'oldest' ? tsA - tsB : tsB - tsA;
    });
  }, [allRows, searchQuery, sortBy, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, safePage]);

  const startIndex = filteredRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(safePage * PAGE_SIZE, filteredRows.length);

  const hasActiveFilters =
    typeFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    sortBy !== 'newest' ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setSortBy('newest');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const renderRowAction = (row: UnifiedAdminContractRow, fullWidth = false) => {
    const href =
      row.kind === 'FOUR_PARTY'
        ? `/admin/contracts/${row.id}/review`
        : `/admin/contracts/staffing/${row.id}`;

    return (
      <Button
        asChild
        variant={row.isReadyForAdmin ? 'default' : 'outline'}
        size="sm"
        className={cn(
          'h-8 rounded-lg px-3 text-xs font-semibold',
          fullWidth && 'w-full'
        )}
      >
        <Link href={href}>
          {row.isReadyForAdmin ? 'Ký xác nhận' : 'Xem chi tiết'}
        </Link>
      </Button>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6 lg:px-8">
      {/* Compact Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Quản lý Hợp đồng
        </h1>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowCreateB2BModal(true)}
          className="h-9 cursor-pointer gap-1.5 rounded-xl text-xs font-semibold"
        >
          <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Tạo HĐ B2B</span>
        </Button>
      </header>

      {/* Compact KPI Filter Strip */}
      <section
        aria-label="Thống kê hợp đồng hệ thống"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <button
          type="button"
          onClick={() => {
            setStatusFilter('ALL');
            setCurrentPage(1);
          }}
          className={cn(
            'flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-left transition-all hover:border-primary/40',
            statusFilter === 'ALL'
              ? 'border-primary/40 ring-1 ring-primary/15'
              : 'border-slate-200'
          )}
        >
          <span className="text-xs font-medium text-slate-600">
            Tổng hợp đồng
          </span>
          <span className="text-lg font-bold tabular-nums text-slate-900">
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('READY_FOR_ADMIN');
            setCurrentPage(1);
          }}
          className={cn(
            'flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-left transition-all hover:border-amber-300',
            statusFilter === 'READY_FOR_ADMIN'
              ? 'border-amber-400 ring-1 ring-amber-200'
              : 'border-slate-200'
          )}
        >
          <span className="text-xs font-medium text-slate-600">
            Chờ Admin ký
          </span>
          <span className="text-lg font-bold tabular-nums text-amber-700">
            {stats.readyForAdmin}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('ACTIVE');
            setCurrentPage(1);
          }}
          className={cn(
            'flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-left transition-all hover:border-emerald-300',
            statusFilter === 'ACTIVE'
              ? 'border-emerald-400 ring-1 ring-emerald-200'
              : 'border-slate-200'
          )}
        >
          <span className="text-xs font-medium text-slate-600">
            Đang hiệu lực
          </span>
          <span className="text-lg font-bold tabular-nums text-emerald-700">
            {stats.active}
          </span>
        </button>
      </section>

      {loadError && (
        <Alert
          variant="destructive"
          className="rounded-xl border-rose-200 bg-rose-50 text-rose-800"
        >
          <AlertDescription className="flex items-center justify-between gap-3 text-xs text-rose-800 sm:text-sm">
            <span>{loadError}</span>
            <Button
              type="button"
              size="xs"
              variant="destructive"
              onClick={triggerReload}
              className="cursor-pointer rounded-lg text-xs font-semibold"
            >
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Unified Table Card */}
      <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white py-0 shadow-sm">
        {/* Filter Header (responsive on mobile & desktop) */}
        <div className="flex flex-col gap-2.5 border-b border-slate-200 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm mã HĐ, chủ hộ, CSYT, gói..."
              aria-label="Tìm kiếm hợp đồng"
              className="h-9 w-full rounded-xl border-slate-200 bg-slate-50/70 pl-9 text-xs focus-visible:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as TypeFilter);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo loại hợp đồng"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-primary sm:w-auto"
            >
              <option value="ALL">Loại: Tất cả</option>
              <option value="FOUR_PARTY">Hợp đồng 4 bên</option>
              <option value="B2B">Hợp đồng B2B</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo trạng thái hợp đồng"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-primary sm:w-auto"
            >
              <option value="ALL">Trạng thái: Tất cả</option>
              <option value="READY_FOR_ADMIN">Chờ Admin ký</option>
              <option value="WAITING_OTHERS">Chờ bên khác ký</option>
              <option value="PENDING_PAYMENT">Chờ thanh toán</option>
              <option value="ACTIVE">Đang hiệu lực</option>
              <option value="CANCELLED">Đã hủy / Chấm dứt</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setCurrentPage(1);
              }}
              aria-label="Sắp xếp hợp đồng"
              className="col-span-2 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-primary sm:w-auto"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="price_desc">Giá trị cao đến thấp</option>
            </select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="col-span-2 h-9 rounded-xl px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:w-auto"
              >
                <RotateCcw className="mr-1.5 size-3.5" />
                Đặt lại
              </Button>
            )}
          </div>
        </div>

        {/* Loading / Empty */}
        {isLoading ? (
          <div className="p-12 text-center text-xs font-medium text-slate-500">
            Đang tải danh sách hợp đồng...
          </div>
        ) : paginatedRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-800">
              Không có hợp đồng phù hợp
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Thử thay đổi loại hợp đồng, trạng thái hoặc từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table (>= md) */}
            <div className="hidden w-full overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-3 py-3">Mã hợp đồng</th>
                    <th className="px-3 py-3">Đối tác / Chủ hộ</th>
                    <th className="px-3 py-3">Nội dung / Gói</th>
                    <th className="hidden px-3 py-3 lg:table-cell">Ngày tạo</th>
                    <th className="px-3 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRows.map((row) => (
                    <tr
                      key={`${row.kind}-${row.id}`}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                            row.kind === 'FOUR_PARTY'
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-violet-200 bg-violet-50 text-violet-700'
                          )}
                        >
                          {row.kind === 'FOUR_PARTY' ? '4 bên' : 'B2B'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          title={row.contractNumber}
                          className="block max-w-[130px] truncate font-mono text-xs font-medium tabular-nums text-slate-600"
                        >
                          {row.contractNumber}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                          {row.partnerName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {row.partnerSub}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs font-medium text-slate-800">
                          {row.contentTitle}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold tabular-nums text-slate-700">
                          {row.contentSub}
                        </p>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-xs tabular-nums text-slate-600 lg:table-cell">
                        {formatShortDate(row.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                            row.statusClassName
                          )}
                        >
                          {row.statusLabel}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {renderRowAction(row)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (< md) */}
            <div className="divide-y divide-slate-100 md:hidden">
              {paginatedRows.map((row) => (
                <div
                  key={`mobile-${row.kind}-${row.id}`}
                  className="space-y-3 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                          row.kind === 'FOUR_PARTY'
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-violet-200 bg-violet-50 text-violet-700'
                        )}
                      >
                        {row.kind === 'FOUR_PARTY' ? '4 bên' : 'B2B'}
                      </Badge>
                      <span className="font-mono text-xs font-medium tabular-nums text-slate-600">
                        {row.contractNumber}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                        row.statusClassName
                      )}
                    >
                      {row.statusLabel}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {row.partnerName}
                    </p>
                    <p className="text-xs text-slate-500">{row.partnerSub}</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                    <div>
                      <p className="font-medium text-slate-800">
                        {row.contentTitle}
                      </p>
                      <p className="font-semibold tabular-nums text-slate-900">
                        {row.contentSub}
                      </p>
                    </div>
                    <span className="shrink-0 tabular-nums text-slate-500">
                      {formatShortDate(row.createdAt)}
                    </span>
                  </div>

                  <div>{renderRowAction(row, true)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {!isLoading && filteredRows.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs tabular-nums text-slate-500">
              Hiển thị{' '}
              <span className="font-semibold text-slate-800">
                {startIndex}–{endIndex}
              </span>{' '}
              trên tổng số{' '}
              <span className="font-semibold text-slate-800">
                {filteredRows.length}
              </span>{' '}
              hợp đồng
            </p>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 rounded-lg bg-white px-2.5 text-xs font-semibold"
              >
                <ChevronLeft className="mr-1 size-3.5" />
                Trước
              </Button>
              <span className="px-2 text-xs font-semibold tabular-nums text-slate-600">
                Trang {safePage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="h-8 rounded-lg bg-white px-2.5 text-xs font-semibold"
              >
                Sau
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CreateB2BContractDialog
        open={showCreateB2BModal}
        onOpenChange={setShowCreateB2BModal}
        onCreated={triggerReload}
      />
    </div>
  );
}

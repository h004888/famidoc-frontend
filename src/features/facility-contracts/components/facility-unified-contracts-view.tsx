'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { FourPartyContract } from '@/features/four-party-contract';
import {
  contractsApi,
  type StaffingContractItem,
} from '@/lib/api';
import { cn } from '@/lib/utils';

type ContractKind = 'FOUR_PARTY' | 'B2B';
type TypeFilter = 'ALL' | ContractKind;
type StatusFilter =
  | 'ALL'
  | 'ACTION_REQUIRED'
  | 'WAITING_OTHERS'
  | 'ACTIVE'
  | 'CANCELLED';
type SortOption = 'newest' | 'oldest' | 'price_desc';

interface UnifiedFacilityContractRow {
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
  isActionRequired: boolean;
  href: string;
}

export interface FacilityUnifiedContractsViewProps {
  initialTypeFilter?: TypeFilter;
  initialFourPartyContracts?: FourPartyContract[];
  initialB2bContracts?: StaffingContractItem[];
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

function mapFourPartyRow(contract: FourPartyContract): UnifiedFacilityContractRow {
  const isAllComplete = contract.status === 'ACTIVE';
  const familySigned =
    Boolean(contract.signatures?.family) || isAllComplete;
  const facilitySigned =
    Boolean(contract.signatures?.facility) || isAllComplete;
  const isCancelled = contract.status === 'CANCELLED';
  const isActionRequired = !isCancelled && familySigned && !facilitySigned;

  let statusKey: UnifiedFacilityContractRow['statusKey'] = 'WAITING_OTHERS';
  let statusLabel = 'Chờ gia đình ký';
  let statusClassName = 'border-slate-200 bg-slate-100 text-slate-700';

  if (isCancelled) {
    statusKey = 'CANCELLED';
    statusLabel = 'Đã hủy';
    statusClassName = 'border-rose-200 bg-rose-50 text-rose-700';
  } else if (contract.status === 'ACTIVE') {
    statusKey = 'ACTIVE';
    statusLabel = 'Đang hiệu lực';
    statusClassName = 'border-emerald-200 bg-emerald-50 text-emerald-700';
  } else if (contract.status === 'PENDING_PAYMENT') {
    statusKey = 'WAITING_OTHERS';
    statusLabel = 'Chờ thanh toán';
    statusClassName = 'border-primary/20 bg-primary/10 text-primary';
  } else if (isActionRequired) {
    statusKey = 'ACTION_REQUIRED';
    statusLabel = 'Cần CSYT ký';
    statusClassName = 'border-amber-200 bg-amber-50 text-amber-800';
  } else if (facilitySigned) {
    statusKey = 'WAITING_OTHERS';
    statusLabel = 'Chờ BS / FamiDoc';
    statusClassName = 'border-sky-200 bg-sky-50 text-sky-800';
  }

  return {
    id: contract.id,
    kind: 'FOUR_PARTY',
    contractNumber: contract.contractNumber,
    partnerName: contract.familyRepresentativeName || 'Đại diện Hộ gia đình',
    partnerSub: `${contract.membersCount ?? 1} thành viên`,
    contentTitle: contract.packageName,
    contentSub: formatCurrencyVnd(contract.packagePrice),
    sortPrice: contract.packagePrice,
    createdAt: contract.createdAt,
    statusKey,
    statusLabel,
    statusClassName,
    isActionRequired,
    href: `/facility/coordination/${contract.id}`,
  };
}

function mapB2bRow(item: StaffingContractItem): UnifiedFacilityContractRow {
  const isTerminated =
    item.status === 'TERMINATED' || item.rawStatus === 'REVISION_REQUESTED';
  const isActive = item.status === 'ACTIVE';
  const isActionRequired = !isTerminated && !isActive && !item.facilitySigned;

  let statusKey: UnifiedFacilityContractRow['statusKey'] = 'WAITING_OTHERS';
  let statusLabel = 'Chờ Admin ký';
  let statusClassName = 'border-sky-200 bg-sky-50 text-sky-800';

  if (isActive) {
    statusKey = 'ACTIVE';
    statusLabel = 'Đang hiệu lực';
    statusClassName = 'border-emerald-200 bg-emerald-50 text-emerald-700';
  } else if (item.rawStatus === 'REVISION_REQUESTED') {
    statusKey = 'CANCELLED';
    statusLabel = 'Yêu cầu chỉnh sửa';
    statusClassName = 'border-rose-200 bg-rose-50 text-rose-700';
  } else if (item.status === 'TERMINATED') {
    statusKey = 'CANCELLED';
    statusLabel = 'Đã chấm dứt';
    statusClassName = 'border-slate-200 bg-slate-100 text-slate-600';
  } else if (isActionRequired) {
    statusKey = 'ACTION_REQUIRED';
    statusLabel = 'Cần CSYT ký';
    statusClassName = 'border-amber-200 bg-amber-50 text-amber-800';
  }

  return {
    id: item.id,
    kind: 'B2B',
    contractNumber: item.contractNumber,
    partnerName: 'Nền tảng FamiDoc',
    partnerSub: `${formatShortDate(item.validFrom)} – ${formatShortDate(item.validTo)}`,
    contentTitle: 'Hợp tác cung ứng dịch vụ',
    contentSub: `CSYT ${item.facilitySharePercent}% · FamiDoc ${item.platformSharePercent}%`,
    sortPrice: 0,
    createdAt: item.validFrom || '',
    statusKey,
    statusLabel,
    statusClassName,
    isActionRequired,
    href: `/facility/contracts/${item.id}`,
  };
}

export function FacilityUnifiedContractsView({
  initialTypeFilter = 'ALL',
  initialFourPartyContracts,
  initialB2bContracts,
}: FacilityUnifiedContractsViewProps) {
  const isControlled =
    initialFourPartyContracts !== undefined || initialB2bContracts !== undefined;
  const [fourPartyContracts, setFourPartyContracts] = useState<FourPartyContract[]>(
    initialFourPartyContracts ?? []
  );
  const [b2bContracts, setB2bContracts] = useState<StaffingContractItem[]>(
    initialB2bContracts ?? []
  );
  const [isLoading, setIsLoading] = useState<boolean>(!isControlled);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(initialTypeFilter);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (isControlled) return;
    let active = true;
    setIsLoading(true);

    Promise.allSettled([
      contractsApi.getMedicalContracts({
        limit: 100,
        role: 'HEALTHCARE_FACILITY',
      }),
      contractsApi.getStaffingContracts(),
    ]).then(([fourPartyRes, b2bRes]) => {
      if (!active) return;

      const fourItems =
        fourPartyRes.status === 'fulfilled' ? fourPartyRes.value : [];
      const b2bItems =
        b2bRes.status === 'fulfilled' ? b2bRes.value.data ?? [] : [];

      setFourPartyContracts(fourItems);
      setB2bContracts(b2bItems);

      if (fourPartyRes.status === 'rejected' && b2bRes.status === 'rejected') {
        setLoadError('Không thể tải danh sách hợp đồng của cơ sở y tế.');
      } else {
        setLoadError(null);
      }
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [isControlled, reloadTick]);

  const allRows = useMemo(() => {
    return [
      ...fourPartyContracts.map(mapFourPartyRow),
      ...b2bContracts.map(mapB2bRow),
    ];
  }, [b2bContracts, fourPartyContracts]);

  const stats = useMemo(() => {
    return {
      total: allRows.length,
      actionRequired: allRows.filter((r) => r.statusKey === 'ACTION_REQUIRED')
        .length,
      active: allRows.filter((r) => r.statusKey === 'ACTIVE').length,
    };
  }, [allRows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = allRows.filter((row) => {
      if (typeFilter !== 'ALL' && row.kind !== typeFilter) return false;
      if (statusFilter !== 'ALL' && row.statusKey !== statusFilter) return false;
      if (!q) return true;
      return (
        row.contractNumber.toLowerCase().includes(q) ||
        row.partnerName.toLowerCase().includes(q) ||
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

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 antialiased">
      <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Quản lý Hợp đồng
          </h1>
        </header>

        {/* Compact KPI Filter Strip */}
        <section
          aria-label="Thống kê hợp đồng cơ sở y tế"
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
              setStatusFilter('ACTION_REQUIRED');
              setCurrentPage(1);
            }}
            className={cn(
              'flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-left transition-all hover:border-amber-300',
              statusFilter === 'ACTION_REQUIRED'
                ? 'border-amber-400 ring-1 ring-amber-200'
                : 'border-slate-200'
            )}
          >
            <span className="text-xs font-medium text-slate-600">
              Cần Cơ sở ký / xử lý
            </span>
            <span className="text-lg font-bold tabular-nums text-amber-700">
              {stats.actionRequired}
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
            role="alert"
            variant="destructive"
            className="flex items-center justify-between gap-2 rounded-xl border-rose-200 bg-rose-50 text-xs text-rose-800"
          >
            <AlertDescription>{loadError}</AlertDescription>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setReloadTick((t) => t + 1)}
              className="rounded-md font-semibold"
            >
              Thử lại
            </Button>
          </Alert>
        )}

        {/* Unified Table Card */}
        <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white py-0 shadow-sm">
          {/* Header Filter Toolbar */}
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
                placeholder="Tìm mã HĐ, chủ hộ, đối tác, gói..."
                aria-label="Tìm kiếm hợp đồng"
                className="h-9 w-full rounded-xl border-slate-200 bg-slate-50/70 pl-9 text-xs focus-visible:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as TypeFilter);
                  setCurrentPage(1);
                }}
                aria-label="Lọc theo loại hợp đồng"
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-primary"
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
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-primary"
              >
                <option value="ALL">Trạng thái: Tất cả</option>
                <option value="ACTION_REQUIRED">Cần CSYT ký</option>
                <option value="WAITING_OTHERS">Chờ bên khác ký</option>
                <option value="ACTIVE">Đang hiệu lực</option>
                <option value="CANCELLED">Đã hủy / Kết thúc</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  setCurrentPage(1);
                }}
                aria-label="Sắp xếp hợp đồng"
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-primary"
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
                  className="h-9 rounded-xl px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Đặt lại
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
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
            <div className="w-full overflow-x-auto">
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
                          className="block max-w-[130px] truncate text-xs font-medium tabular-nums text-slate-600"
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
                        {row.isActionRequired ? (
                          <Button
                            asChild
                            size="sm"
                            className="h-8 rounded-lg px-3 text-xs font-semibold"
                          >
                            <Link href={row.href}>Ký xác nhận</Link>
                          </Button>
                        ) : (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg px-3 text-xs font-semibold"
                          >
                            <Link href={row.href}>Xem chi tiết</Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
      </main>
    </div>
  );
}

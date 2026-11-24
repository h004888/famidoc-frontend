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
import { contractsApi, publicApi, type PublicPackageItemDto } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface DoctorContractsInboundViewProps {
  initialContracts?: FourPartyContract[];
}

type StatusFilter = 'all' | 'pending' | 'payment' | 'active' | 'other';
type SortOption = 'newest' | 'oldest' | 'price_desc';

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

function isContractPendingForDoctor(c: FourPartyContract): boolean {
  return (
    !c.signatures?.doctor &&
    c.status !== 'ACTIVE' &&
    c.status !== 'DOCTOR_ACCEPTED' &&
    c.status !== 'PENDING_PAYMENT' &&
    c.status !== 'CANCELLED'
  );
}

function isContractActive(c: FourPartyContract): boolean {
  return c.status === 'ACTIVE' || c.status === 'DOCTOR_ACCEPTED';
}

function resolveContractBadge(contract: FourPartyContract): {
  label: string;
  className: string;
  isPendingReview: boolean;
} {
  const familySigned =
    Boolean(contract.signatures?.family) || contract.status !== 'DRAFT';
  const isPendingReview = isContractPendingForDoctor(contract);

  if (!familySigned) {
    return {
      label: 'Chờ gia đình ký',
      className: 'bg-slate-100 text-slate-700 border-slate-200',
      isPendingReview: false,
    };
  }
  if (isPendingReview) {
    return {
      label: 'Chờ bác sĩ ký',
      className: 'bg-amber-50 text-amber-800 border-amber-200',
      isPendingReview: true,
    };
  }
  if (contract.status === 'PENDING_PAYMENT') {
    return {
      label: 'Chờ thanh toán',
      className: 'bg-primary/10 text-primary border-primary/20',
      isPendingReview: false,
    };
  }
  if (contract.status === 'CANCELLED') {
    return {
      label: 'Đã hủy',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      isPendingReview: false,
    };
  }
  return {
    label: 'Đang phụ trách',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    isPendingReview: false,
  };
}

export function DoctorContractsInboundView({
  initialContracts,
}: DoctorContractsInboundViewProps) {
  const isControlledByProps = initialContracts !== undefined;
  const [contracts, setContracts] = useState<FourPartyContract[]>(
    initialContracts ?? []
  );
  const [availablePackages, setAvailablePackages] = useState<PublicPackageItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!isControlledByProps);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [reloadTick, setReloadTick] = useState(0);

  const triggerReload = () => {
    if (isControlledByProps) return;
    setIsLoading(true);
    setLoadError(null);
    setReloadTick((t) => t + 1);
  };

  useEffect(() => {
    let active = true;
    publicApi
      .getPackages({ limit: 50 })
      .then((res) => {
        if (!active) return;
        setAvailablePackages(res.items ?? []);
      })
      .catch(() => {
        if (!active) return;
        setAvailablePackages([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isControlledByProps) return;
    let active = true;
    async function loadContracts() {
      try {
        const items = await contractsApi.getMedicalContracts({
          limit: 50,
          role: 'DOCTOR',
        });
        if (!active) return;
        setContracts(items);
        setLoadError(null);
      } catch (err) {
        if (!active) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh sách hợp đồng phân công.'
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
  }, [isControlledByProps, reloadTick]);

  const stats = useMemo(() => {
    const total = contracts.length;
    const pendingList = contracts.filter(isContractPendingForDoctor);
    const paymentCount = contracts.filter(
      (c) => c.status === 'PENDING_PAYMENT'
    ).length;
    const activeOrAcceptedCount = contracts.filter(isContractActive).length;
    const otherCount = contracts.filter(
      (c) =>
        !isContractPendingForDoctor(c) &&
        c.status !== 'PENDING_PAYMENT' &&
        !isContractActive(c)
    ).length;

    const packageNames = new Set<string>();
    for (const pkg of availablePackages) {
      const name = pkg.packageName?.trim();
      if (name) packageNames.add(name);
    }
    for (const c of contracts) {
      const name = c.packageName?.trim();
      if (name) packageNames.add(name);
    }

    return {
      total,
      pendingCount: pendingList.length,
      paymentCount,
      activeOrAcceptedCount,
      otherCount,
      packageOptions: Array.from(packageNames),
    };
  }, [availablePackages, contracts]);

  const filteredContracts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = contracts.filter((c) => {
      if (statusFilter === 'pending' && !isContractPendingForDoctor(c)) {
        return false;
      }
      if (statusFilter === 'payment' && c.status !== 'PENDING_PAYMENT') {
        return false;
      }
      if (statusFilter === 'active' && !isContractActive(c)) {
        return false;
      }
      if (
        statusFilter === 'other' &&
        (isContractPendingForDoctor(c) ||
          c.status === 'PENDING_PAYMENT' ||
          isContractActive(c))
      ) {
        return false;
      }
      if (packageFilter !== 'all' && c.packageName !== packageFilter) {
        return false;
      }
      if (!q) return true;
      return (
        c.contractNumber.toLowerCase().includes(q) ||
        c.familyRepresentativeName.toLowerCase().includes(q) ||
        (c.packageName || '').toLowerCase().includes(q) ||
        (c.familyAddress || '').toLowerCase().includes(q)
      );
    });

    return [...matched].sort((a, b) => {
      if (sortBy === 'price_desc') {
        return b.packagePrice - a.packagePrice;
      }
      const timeA = Date.parse(a.createdAt || '') || 0;
      const timeB = Date.parse(b.createdAt || '') || 0;
      return sortBy === 'oldest' ? timeA - timeB : timeB - timeA;
    });
  }, [contracts, packageFilter, searchQuery, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedContracts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredContracts.slice(start, start + PAGE_SIZE);
  }, [filteredContracts, safePage]);

  const startIndex =
    filteredContracts.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(safePage * PAGE_SIZE, filteredContracts.length);

  const handleStatusChange = (next: StatusFilter) => {
    setStatusFilter(next);
    setCurrentPage(1);
  };

  const handlePackageChange = (next: string) => {
    setPackageFilter(next);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSortChange = (next: SortOption) => {
    setSortBy(next);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    packageFilter !== 'all' ||
    sortBy !== 'newest' ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setStatusFilter('all');
    setPackageFilter('all');
    setSortBy('newest');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 antialiased">
      <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Quản lý Hợp đồng Phụ trách
          </h1>
        </header>

        {/* Compact KPI Filter Strip (3 cards) */}
        <section
          aria-label="Thống kê hợp đồng phụ trách"
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <button
            type="button"
            onClick={() => handleStatusChange('all')}
            className={cn(
              'flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-left transition-all hover:border-primary/40',
              statusFilter === 'all'
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
            onClick={() => handleStatusChange('pending')}
            className={cn(
              'flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-left transition-all hover:border-amber-300',
              statusFilter === 'pending'
                ? 'border-amber-400 ring-1 ring-amber-200'
                : 'border-slate-200'
            )}
          >
            <span className="text-xs font-medium text-slate-600">
              Chờ bác sĩ ký
            </span>
            <span className="text-lg font-bold tabular-nums text-amber-700">
              {stats.pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('payment')}
            className={cn(
              'flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-left transition-all hover:border-primary/40',
              statusFilter === 'payment'
                ? 'border-primary/40 ring-1 ring-primary/15'
                : 'border-slate-200'
            )}
          >
            <span className="text-xs font-medium text-slate-600">
              Chờ gia đình thanh toán
            </span>
            <span className="text-lg font-bold tabular-nums text-primary">
              {stats.paymentCount}
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
              onClick={triggerReload}
              className="rounded-md font-semibold"
            >
              Thử lại
            </Button>
          </Alert>
        )}

        {/* Full-Width Table Directory Card */}
        <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white py-0 shadow-sm">
          {/* Card Header Toolbar (Single clean row) */}
          <div className="flex flex-col gap-2.5 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm mã HĐ, tên chủ hộ, gói..."
                aria-label="Tìm kiếm hợp đồng"
                className="h-9 w-full rounded-xl border-slate-200 bg-slate-50/70 pl-9 text-xs focus-visible:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={packageFilter}
                onChange={(e) => handlePackageChange(e.target.value)}
                aria-label="Lọc theo gói chăm sóc"
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-primary"
              >
                <option value="all">Gói: Tất cả</option>
                {stats.packageOptions.map((pkgName) => (
                  <option key={pkgName} value={pkgName}>
                    {pkgName}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
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

          {/* Table Content */}
          {isLoading ? (
            <div className="p-12 text-center text-xs font-medium text-slate-500">
              Đang tải danh sách hợp đồng phân công...
            </div>
          ) : paginatedContracts.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm font-semibold text-slate-800">
                Không có hợp đồng phù hợp
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Thử thay đổi bộ lọc trạng thái, gói chăm sóc hoặc từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                    <th className="px-4 py-3">Hộ gia đình</th>
                    <th className="px-3 py-3">Mã hợp đồng</th>
                    <th className="px-3 py-3">Gói chăm sóc</th>
                    <th className="px-3 py-3">Giá trị hợp đồng</th>
                    <th className="hidden px-3 py-3 lg:table-cell">Ngày tạo</th>
                    <th className="px-3 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedContracts.map((contract) => {
                    const badge = resolveContractBadge(contract);
                    return (
                      <tr
                        key={contract.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                              {contract.familyRepresentativeName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {contract.membersCount ?? 1} thành viên
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            title={contract.contractNumber}
                            className="block max-w-[130px] truncate text-xs font-medium tabular-nums text-slate-600"
                          >
                            {contract.contractNumber}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs font-medium text-slate-800">
                          {contract.packageName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold tabular-nums text-slate-900">
                          {formatCurrencyVnd(contract.packagePrice)}
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-3 text-xs tabular-nums text-slate-600 lg:table-cell">
                          {formatShortDate(contract.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                              badge.className
                            )}
                          >
                            {badge.label}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {badge.isPendingReview ? (
                            <Button
                              asChild
                              size="sm"
                              className="h-8 rounded-lg px-3 text-xs font-semibold"
                            >
                              <Link href={`/doctor/contracts/${contract.id}`}>
                                Ký xác nhận
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg px-3 text-xs font-semibold"
                            >
                              <Link href={`/doctor/contracts/${contract.id}`}>
                                Xem hồ sơ
                              </Link>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {!isLoading && filteredContracts.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs tabular-nums text-slate-500">
                Hiển thị{' '}
                <span className="font-semibold text-slate-800">
                  {startIndex}–{endIndex}
                </span>{' '}
                trên tổng số{' '}
                <span className="font-semibold text-slate-800">
                  {filteredContracts.length}
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

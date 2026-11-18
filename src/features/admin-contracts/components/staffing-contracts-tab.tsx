'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Clock, Pencil, PenLine, Search, ShieldAlert, X } from 'lucide-react';
import type { StaffingContractItem } from '@/lib/api';
import { EmptyState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  formatShortDate,
  getStaffingPartySignatureMatrix,
  isStaffingReadyForAdminSign,
  matchesStaffingStatusFilter,
  resolveStaffingContractBadge,
  type StaffingSortOption,
  type StaffingStatusFilter,
} from './contract-status-helpers';
import { ContractsTableSkeleton } from './contracts-table-skeleton';

const PAGE_SIZE = 10;

export interface StaffingContractsTabProps {
  staffingList: StaffingContractItem[];
  isLoading: boolean;
  filterStatus: StaffingStatusFilter;
  onFilterStatusChange: (filter: StaffingStatusFilter) => void;
  signingStaffingId: string | null;
  onRequestSign: (item: StaffingContractItem) => void;
  onOpenDetail: (item: StaffingContractItem) => void;
  onRequestTerminate?: (item: StaffingContractItem) => void;
  counts: {
    all: number;
    draft: number;
    readyForAdmin: number;
    active: number;
    terminated: number;
  };
}

export function StaffingContractsTab({
  staffingList,
  isLoading,
  filterStatus,
  onFilterStatusChange,
  signingStaffingId,
  onRequestSign,
  onOpenDetail,
  onRequestTerminate,
  counts,
}: StaffingContractsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<StaffingSortOption>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = staffingList.filter((item) => {
      const matchesSearch =
        !q ||
        item.contractNumber.toLowerCase().includes(q) ||
        item.facilityName.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      return matchesStaffingStatusFilter(item, filterStatus);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'HIGHEST_FACILITY_SHARE') {
        return b.facilitySharePercent - a.facilitySharePercent;
      }
      if (sortBy === 'EXPIRING_SOON') {
        const endA = new Date(a.validTo).getTime() || Number.MAX_SAFE_INTEGER;
        const endB = new Date(b.validTo).getTime() || Number.MAX_SAFE_INTEGER;
        return endA - endB;
      }
      const startA = new Date(a.validFrom).getTime() || 0;
      const startB = new Date(b.validFrom).getTime() || 0;
      return startB - startA;
    });
  }, [staffingList, searchQuery, filterStatus, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedList = filteredAndSorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filterOptions: Array<{ key: StaffingStatusFilter; label: string; count: number }> = [
    { key: 'ALL', label: 'Tất cả', count: counts.all },
    { key: 'READY_FOR_ADMIN', label: 'Chờ Admin ký', count: counts.readyForAdmin },
    { key: 'DRAFT', label: 'Dự thảo', count: counts.draft },
    { key: 'ACTIVE', label: 'Đang hiệu lực', count: counts.active },
    { key: 'TERMINATED', label: 'Đã hủy', count: counts.terminated },
  ];

  return (
    <div className="space-y-4">
      {/* Filter, Search & Sort Bar */}
      <Card className="rounded-2xl border-slate-200 py-4 shadow-xs">
        <CardContent className="space-y-3 px-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <Input
                type="text"
                aria-label="Tìm kiếm hợp đồng cung ứng nhân lực B2B"
                placeholder="Tìm theo mã hợp đồng hoặc tên cơ sở y tế đối tác..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-xl bg-slate-50 pl-10 pr-9 text-xs sm:text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Xóa từ khóa tìm kiếm B2B"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Sắp xếp:</span>
              <Select
                value={sortBy}
                onValueChange={(val) => {
                  setSortBy(val as StaffingSortOption);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] rounded-xl bg-white text-xs font-medium" aria-label="Sắp xếp hợp đồng B2B">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEWEST">Mới hiệu lực nhất</SelectItem>
                  <SelectItem value="EXPIRING_SOON">Sắp hết hạn nhất</SelectItem>
                  <SelectItem value="HIGHEST_FACILITY_SHARE">Tỉ lệ CSYT cao nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo trạng thái hợp đồng B2B">
            {filterOptions.map((opt) => {
              const isSelected = filterStatus === opt.key;
              return (
                <Button
                  key={opt.key}
                  type="button"
                  size="sm"
                  aria-pressed={isSelected}
                  variant={isSelected ? 'default' : 'secondary'}
                  onClick={() => {
                    onFilterStatusChange(opt.key);
                    setCurrentPage(1);
                  }}
                  className="rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer gap-1.5"
                >
                  <span>{opt.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 text-[10px] tabular-nums',
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                    )}
                  >
                    {opt.count}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <ContractsTableSkeleton columns={5} rows={4} />
      ) : paginatedList.length === 0 ? (
        <EmptyState
          icon="handshake"
          title="Không có hợp đồng cung ứng nhân lực B2B phù hợp"
          description="Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác."
          action={
            (filterStatus !== 'ALL' || searchQuery) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onFilterStatusChange('ALL');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đặt lại bộ lọc
              </Button>
            )
          }
        />
      ) : (
        <TooltipProvider>
          {/* Desktop Table */}
          <Card className="hidden md:block rounded-2xl border-slate-200 shadow-xs overflow-hidden py-0 gap-0">
            <Table className="text-xs sm:text-sm">
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider hover:bg-slate-50">
                  <TableHead className="py-3.5 px-4 text-slate-600">Mã Hợp đồng &amp; Hiệu lực</TableHead>
                  <TableHead className="py-3.5 px-4 text-slate-600">Cơ sở Y tế Đối tác</TableHead>
                  <TableHead className="py-3.5 px-4 text-slate-600">Phân chia doanh thu</TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-slate-600">Tiến độ 2 bên</TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-slate-600">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {paginatedList.map((item) => {
                  const badge = resolveStaffingContractBadge(item);
                  const matrix = getStaffingPartySignatureMatrix(item);
                  const sigCount = matrix.filter((m) => m.signed).length;
                  const isReadyForAdminSign = isStaffingReadyForAdminSign(item);

                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/70">
                      <TableCell className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 tabular-nums">
                          {item.contractNumber}
                        </div>
                        <div className="tabular-nums text-[11px] text-slate-500 mt-0.5">
                          Hiệu lực: {formatShortDate(item.validFrom)} – {formatShortDate(item.validTo)}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{item.facilityName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[260px]">
                          {item.facilitySummary?.address ||
                            item.facilitySummary?.hotline ||
                            'Hợp đồng khung cung ứng nhân lực B2B'}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 min-w-[160px] max-w-[200px]">
                        <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                          <span className="font-semibold text-primary">
                            {item.facilitySharePercent}% CSYT
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {item.platformSharePercent}% FamiDoc
                          </span>
                        </div>
                        <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="bg-primary transition-all"
                            style={{ width: `${item.facilitySharePercent}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center space-y-1.5">
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant="outline"
                            className={cn('rounded-full text-[11px] font-semibold', badge.className)}
                          >
                            {badge.label}
                          </Badge>
                          {item.status === 'ACTIVE' && item.terminationRequestStatus === 'PENDING' && (
                            <Badge
                              variant="outline"
                              className="rounded-full bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-semibold"
                            >
                              CSYT yêu cầu chấm dứt
                            </Badge>
                          )}
                        </div>
                        <div
                          className="flex items-center justify-center gap-1"
                          aria-label={`Tiến độ ${sigCount} trên 2 chữ ký`}
                        >
                          {matrix.map((party) => (
                            <Tooltip key={party.key}>
                              <TooltipTrigger asChild>
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                                    party.signed
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                      : party.isAdminTurn
                                        ? 'border-primary/50 border-dashed bg-blue-50 text-primary'
                                        : 'border-slate-200 bg-slate-50 text-slate-500'
                                  )}
                                >
                                  {party.key}
                                  {party.signed ? (
                                    <Check className="h-2.5 w-2.5" aria-hidden="true" />
                                  ) : party.isAdminTurn ? (
                                    <PenLine className="h-2.5 w-2.5" aria-hidden="true" />
                                  ) : (
                                    <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <p className="font-semibold">{party.roleLabel}</p>
                                <p className="text-[11px] opacity-90">
                                  {party.signed
                                    ? `Đã ký${party.signedAt ? ` (${formatShortDate(party.signedAt)})` : ''}`
                                    : party.isAdminTurn
                                      ? 'Tới lượt Admin ký'
                                      : 'Đang chờ ký'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {item.status === 'DRAFT' && !item.facilitySigned && (
                            <Button
                              asChild
                              size="xs"
                              variant="outline"
                              className="rounded-lg font-semibold gap-1"
                            >
                              <Link href={`/admin/contracts/${item.id}/edit?type=staffing`}>
                                <Pencil className="h-3 w-3" aria-hidden="true" />
                                <span>Sửa</span>
                              </Link>
                            </Button>
                          )}
                          {item.status !== 'TERMINATED' && onRequestTerminate && (
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              onClick={() => onRequestTerminate(item)}
                              className="rounded-lg border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold cursor-pointer gap-1"
                            >
                              <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                              <span>{item.status === 'DRAFT' ? 'Hủy' : 'Chấm dứt'}</span>
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="xs"
                            variant="secondary"
                            onClick={() => onOpenDetail(item)}
                            className="rounded-lg bg-accent text-primary hover:bg-accent/80 font-semibold cursor-pointer"
                          >
                            Chi tiết
                          </Button>
                          {isReadyForAdminSign && (
                            <Button
                              type="button"
                              size="xs"
                              variant="default"
                              disabled={signingStaffingId === item.id}
                              onClick={() => onRequestSign(item)}
                              className="rounded-lg font-semibold cursor-pointer gap-1"
                            >
                              <PenLine className="h-3 w-3" aria-hidden="true" />
                              <span>
                                {signingStaffingId === item.id ? 'Đang ký...' : 'Ký Duyệt (Documenso)'}
                              </span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile Card Fallback */}
          <div className="space-y-3 md:hidden">
            {paginatedList.map((item) => {
              const badge = resolveStaffingContractBadge(item);
              const matrix = getStaffingPartySignatureMatrix(item);
              const isReadyForAdminSign = isStaffingReadyForAdminSign(item);

              return (
                <Card key={item.id} className="rounded-2xl border-slate-200 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate tabular-nums">
                        {item.contractNumber}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{item.facilityName}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('rounded-full text-[11px] font-semibold shrink-0', badge.className)}
                    >
                      {badge.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Phân chia doanh thu</span>
                      <span className="font-semibold text-primary tabular-nums">
                        {item.facilitySharePercent}% CSYT / {item.platformSharePercent}% FamiDoc
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Thời hạn hiệu lực</span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {formatShortDate(item.validFrom)} – {formatShortDate(item.validTo)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {matrix.map((party) => (
                      <span
                        key={party.key}
                        className={cn(
                          'inline-flex items-center gap-0.5 rounded-md border px-2 py-0.5 text-[11px] font-bold',
                          party.signed
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : party.isAdminTurn
                              ? 'border-primary/50 border-dashed bg-blue-50 text-primary'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                        )}
                      >
                        {party.key}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {item.status === 'DRAFT' && !item.facilitySigned && (
                      <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold gap-1">
                        <Link href={`/admin/contracts/${item.id}/edit?type=staffing`}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Sửa</span>
                        </Link>
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => onOpenDetail(item)}
                      className="flex-1 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Chi tiết
                    </Button>
                    {isReadyForAdminSign && (
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        disabled={signingStaffingId === item.id}
                        onClick={() => onRequestSign(item)}
                        className="flex-1 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        {signingStaffingId === item.id ? 'Đang ký...' : 'Ký Duyệt (Documenso)'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      {/* Pagination */}
      {!isLoading && filteredAndSorted.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 pt-1 sm:flex-row">
          <p className="text-xs text-slate-500 tabular-nums">
            Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filteredAndSorted.length)} / {filteredAndSorted.length} hợp đồng B2B
          </p>
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}

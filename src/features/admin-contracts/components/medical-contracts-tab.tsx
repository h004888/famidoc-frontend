'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Clock, PenLine, Search, X } from 'lucide-react';
import type { FourPartyContract } from '@/features/four-party-contract';
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
  formatContractCurrency,
  formatShortDate,
  getPartySignatureMatrix,
  isContractReadyForAdminSign,
  matchesMedicalStatusFilter,
  resolveMedicalContractBadge,
  type AdminStatusFilter,
  type MedicalSortOption,
} from './contract-status-helpers';
import { ContractsTableSkeleton } from './contracts-table-skeleton';

const PAGE_SIZE = 10;

export interface MedicalContractsTabProps {
  contracts: FourPartyContract[];
  isLoading: boolean;
  filterStatus: AdminStatusFilter;
  onFilterStatusChange: (filter: AdminStatusFilter) => void;
  onSelectContract: (contract: FourPartyContract) => void;
  counts: {
    all: number;
    readyForAdmin: number;
    waitingFamily: number;
    pendingPayment: number;
    active: number;
    cancelled: number;
  };
}

export function MedicalContractsTab({
  contracts,
  isLoading,
  filterStatus,
  onFilterStatusChange,
  onSelectContract,
  counts,
}: MedicalContractsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<MedicalSortOption>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = contracts.filter((c) => {
      const matchesSearch =
        !q ||
        c.contractNumber.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.familyRepresentativeName.toLowerCase().includes(q) ||
        (c.facilityName || '').toLowerCase().includes(q) ||
        (c.doctorName || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;
      return matchesMedicalStatusFilter(c, filterStatus);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'HIGHEST_VALUE') {
        return b.packagePrice - a.packagePrice;
      }
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      if (sortBy === 'OLDEST_WAITING') {
        return timeA - timeB;
      }
      return timeB - timeA;
    });
  }, [contracts, searchQuery, filterStatus, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedContracts = filteredAndSorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const filterOptions: Array<{ key: AdminStatusFilter; label: string; count: number }> = [
    { key: 'ALL', label: 'Tất cả', count: counts.all },
    { key: 'READY_FOR_ADMIN', label: 'Chờ Admin ký (Bên D)', count: counts.readyForAdmin },
    { key: 'WAITING_FAMILY', label: 'Chờ Bên A ký', count: counts.waitingFamily },
    { key: 'PENDING_PAYMENT', label: 'Chờ thanh toán', count: counts.pendingPayment },
    { key: 'ACTIVE', label: 'Đang hiệu lực', count: counts.active },
    { key: 'CANCELLED', label: 'Đã hủy', count: counts.cancelled },
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
                aria-label="Tìm kiếm hợp đồng y tế 4 bên"
                placeholder="Tìm theo mã hợp đồng, đại diện hộ gia đình, cơ sở y tế, bác sĩ..."
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
                  aria-label="Xóa từ khóa tìm kiếm"
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
                  setSortBy(val as MedicalSortOption);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] rounded-xl bg-white text-xs font-medium" aria-label="Sắp xếp hợp đồng">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEWEST">Mới tạo nhất</SelectItem>
                  <SelectItem value="OLDEST_WAITING">Chờ xử lý lâu nhất</SelectItem>
                  <SelectItem value="HIGHEST_VALUE">Giá trị cao nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo trạng thái hợp đồng y tế">
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
        <ContractsTableSkeleton columns={6} rows={5} />
      ) : paginatedContracts.length === 0 ? (
        <EmptyState
          icon="description"
          title="Không có hợp đồng y tế phù hợp"
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
                  <TableHead className="py-3.5 px-4 text-slate-600">Mã Hợp đồng &amp; Gói</TableHead>
                  <TableHead className="py-3.5 px-4 text-slate-600">Hộ gia đình (Bên A)</TableHead>
                  <TableHead className="py-3.5 px-4 text-slate-600">CSYT (Bên B) &amp; Bác sĩ (Bên C)</TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-slate-600">Giá trị</TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-slate-600">Tiến độ 4 bên</TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-slate-600">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {paginatedContracts.map((c) => {
                  const badge = resolveMedicalContractBadge(c);
                  const matrix = getPartySignatureMatrix(c);
                  const sigCount = matrix.filter((m) => m.signed).length;
                  const isReadyForAdminSign = isContractReadyForAdminSign(c);

                  return (
                    <TableRow key={c.id} className="hover:bg-slate-50/70">
                      <TableCell className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{c.packageName}</div>
                        <div className="tabular-nums text-[11px] text-slate-500 mt-0.5">
                          {c.contractNumber} · {c.membersCount ?? 1} thành viên · {formatShortDate(c.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {c.familyRepresentativeName}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          {c.familyRepresentativePhone}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs text-slate-700">
                        <div className="font-medium">{c.facilityName || '—'}</div>
                        <div className="text-[11px] text-slate-500">
                          {c.doctorName || 'Chưa phân công BS'}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right font-semibold text-primary tabular-nums whitespace-nowrap">
                        {formatContractCurrency(c.packagePrice)}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center space-y-1.5">
                        <Badge
                          variant="outline"
                          className={cn('rounded-full text-[11px] font-semibold', badge.className)}
                        >
                          {badge.label}
                        </Badge>
                        <div
                          className="flex items-center justify-center gap-1"
                          aria-label={`Tiến độ ${sigCount} trên 4 chữ ký`}
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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            asChild
                            size="xs"
                            variant="secondary"
                            className="rounded-lg bg-accent text-primary hover:bg-accent/80 font-semibold"
                          >
                            <Link href={`/admin/contracts/${c.id}/review`}>Thẩm định 4 Bên</Link>
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant={isReadyForAdminSign ? 'default' : 'outline'}
                            onClick={() => onSelectContract(c)}
                            className="rounded-lg font-semibold cursor-pointer"
                          >
                            {isReadyForAdminSign ? 'Ký trên Documenso' : 'Chi tiết & Documenso'}
                          </Button>
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
            {paginatedContracts.map((c) => {
              const badge = resolveMedicalContractBadge(c);
              const matrix = getPartySignatureMatrix(c);
              const isReadyForAdminSign = isContractReadyForAdminSign(c);

              return (
                <Card key={c.id} className="rounded-2xl border-slate-200 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{c.packageName}</p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {c.contractNumber} · {formatShortDate(c.createdAt)}
                      </p>
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
                      <span className="text-[11px] text-slate-400 block">Bên A (Gia đình)</span>
                      <span className="font-semibold text-slate-800">{c.familyRepresentativeName}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Giá trị</span>
                      <span className="font-semibold text-primary tabular-nums">
                        {formatContractCurrency(c.packagePrice)}
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

                  <div className="flex items-center gap-2 pt-1">
                    <Button asChild size="sm" variant="secondary" className="flex-1 rounded-xl text-xs font-semibold">
                      <Link href={`/admin/contracts/${c.id}/review`}>Thẩm định 4 Bên</Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={isReadyForAdminSign ? 'default' : 'outline'}
                      onClick={() => onSelectContract(c)}
                      className="flex-1 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      {isReadyForAdminSign ? 'Ký trên Documenso' : 'Chi tiết & Documenso'}
                    </Button>
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
            {Math.min(safePage * PAGE_SIZE, filteredAndSorted.length)} / {filteredAndSorted.length} hợp đồng
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

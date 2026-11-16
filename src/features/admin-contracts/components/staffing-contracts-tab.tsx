'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, PenLine, Search, X } from 'lucide-react';
import type { StaffingContractItem } from '@/lib/api';
import { EmptyState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  formatShortDate,
  matchesStaffingStatusFilter,
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
  counts,
}: StaffingContractsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return staffingList.filter((item) => {
      const matchesSearch =
        !q ||
        item.contractNumber.toLowerCase().includes(q) ||
        item.facilityName.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      return matchesStaffingStatusFilter(item, filterStatus);
    });
  }, [staffingList, searchQuery, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedList = filteredList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filterOptions: Array<{ key: StaffingStatusFilter; label: string; count: number }> = [
    { key: 'ALL', label: 'Tất cả', count: counts.all },
    { key: 'READY_FOR_ADMIN', label: 'Chờ Admin ký', count: counts.readyForAdmin },
    { key: 'DRAFT', label: 'Dự thảo', count: counts.draft },
    { key: 'ACTIVE', label: 'Đang hiệu lực', count: counts.active },
    { key: 'TERMINATED', label: 'Đã hủy', count: counts.terminated },
  ];

  const renderStatusBadge = (status: StaffingContractItem['status']) => {
    if (status === 'ACTIVE') {
      return (
        <Badge variant="outline" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
          Đang hiệu lực
        </Badge>
      );
    }
    if (status === 'DRAFT') {
      return (
        <Badge variant="outline" className="rounded-full bg-amber-50 text-amber-800 border-amber-200 font-semibold">
          Dự thảo
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="rounded-full bg-rose-50 text-rose-700 border-rose-200 font-semibold">
        Đã hủy / Từ chối
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <Card className="rounded-2xl border-slate-200 py-4 shadow-xs">
        <CardContent className="space-y-3 px-4">
          <div className="relative">
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
        <ContractsTableSkeleton columns={7} rows={4} />
      ) : paginatedList.length === 0 ? (
        <EmptyState
          icon="handshake"
          title="Không có hợp đồng cung ứng nhân lực B2B phù hợp"
          description="Thử thay đổi bộ lọc hoặc khởi tạo dự thảo hợp đồng B2B mới với cơ sở y tế đối tác."
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
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block rounded-2xl border-slate-200 shadow-xs overflow-hidden py-0 gap-0">
            <Table className="text-xs sm:text-sm">
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider hover:bg-slate-50">
                  <TableHead className="py-3.5 px-4 text-slate-600">Mã Hợp Đồng</TableHead>
                  <TableHead className="py-3.5 px-4 text-slate-600">Cơ Sở Y Tế Đối Tác</TableHead>
                  <TableHead className="py-3.5 px-4 text-slate-600">Phân Chia Doanh Thu</TableHead>
                  <TableHead className="py-3.5 px-4 text-slate-600">Thời Hạn Hiệu Lực</TableHead>
                  <TableHead className="py-3.5 px-4 text-slate-600">Tiến Trình Ký Số</TableHead>
                  <TableHead className="py-3.5 px-4 text-slate-600">Trạng Thái</TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-slate-600">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {paginatedList.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/70">
                    <TableCell className="py-3.5 px-4 font-bold text-primary whitespace-nowrap tabular-nums">
                      {item.contractNumber}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.facilityName}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 min-w-[170px]">
                      <div className="flex items-center justify-between text-xs tabular-nums">
                        <span className="font-bold text-slate-800">{item.facilitySharePercent}% CSYT</span>
                        <span className="text-slate-500">{item.platformSharePercent}% FamiDoc</span>
                      </div>
                      <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="bg-primary transition-all"
                          style={{ width: `${item.facilitySharePercent}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs whitespace-nowrap text-slate-600 tabular-nums">
                      {formatShortDate(item.validFrom)} – {formatShortDate(item.validTo)}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 text-[11px] font-medium',
                            item.adminSigned ? 'text-emerald-700' : 'text-amber-700'
                          )}
                        >
                          {item.adminSigned ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          )}
                          Admin: {item.adminSigned ? 'Đã ký số' : 'Chờ Admin ký'}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 text-[11px] font-medium',
                            item.facilitySigned ? 'text-emerald-700' : 'text-slate-500'
                          )}
                        >
                          {item.facilitySigned ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          )}
                          CSYT: {item.facilitySigned ? 'Đã ký số' : 'Chờ CSYT ký'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 whitespace-nowrap">
                      {renderStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'DRAFT' && !item.adminSigned && (
                          <Button
                            type="button"
                            size="xs"
                            disabled={signingStaffingId === item.id}
                            onClick={() => onRequestSign(item)}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer gap-1"
                          >
                            <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>
                              {signingStaffingId === item.id ? 'Đang ký...' : 'Ký Duyệt (SmartCA)'}
                            </span>
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="xs"
                          variant="secondary"
                          onClick={() => onOpenDetail(item)}
                          className="rounded-lg font-semibold cursor-pointer"
                        >
                          Chi Tiết
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile Card Fallback */}
          <div className="space-y-3 md:hidden">
            {paginatedList.map((item) => (
              <Card key={item.id} className="rounded-2xl border-slate-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-primary tabular-nums">{item.contractNumber}</p>
                    <p className="font-semibold text-sm text-slate-900 truncate">{item.facilityName}</p>
                  </div>
                  {renderStatusBadge(item.status)}
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between tabular-nums">
                    <span>Phân chia:</span>
                    <span className="font-semibold text-slate-900">
                      {item.facilitySharePercent}% CSYT / {item.platformSharePercent}% FamiDoc
                    </span>
                  </div>
                  <div className="flex justify-between tabular-nums">
                    <span>Hiệu lực:</span>
                    <span>
                      {formatShortDate(item.validFrom)} – {formatShortDate(item.validTo)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {item.status === 'DRAFT' && !item.adminSigned && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={signingStaffingId === item.id}
                      onClick={() => onRequestSign(item)}
                      className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      {signingStaffingId === item.id ? 'Đang ký...' : 'Ký Duyệt (SmartCA)'}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onOpenDetail(item)}
                    className="flex-1 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Chi Tiết
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {!isLoading && filteredList.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 pt-1 sm:flex-row">
          <p className="text-xs text-slate-500 tabular-nums">
            Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filteredList.length)} / {filteredList.length} hợp đồng B2B
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

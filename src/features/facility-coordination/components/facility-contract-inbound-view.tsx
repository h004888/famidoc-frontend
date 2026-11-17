'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { type FourPartyContract } from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';
import { facilitiesApi } from '@/lib/api/facilities.api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface FacilityContractInboundViewProps {
  initialContracts?: FourPartyContract[];
}

type FacilityQueueStatusFilter =
  | 'ALL'
  | 'READY_FOR_FACILITY'
  | 'WAITING_FAMILY'
  | 'FACILITY_SIGNED'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'CANCELLED';

interface PartyPillState {
  key: 'A' | 'B' | 'C' | 'D';
  state: 'done' | 'current' | 'wait';
}

function getFourPartyProgress(contract: FourPartyContract): {
  pills: PartyPillState[];
  signedCount: number;
  caption: string;
  tone: 'amber' | 'green' | 'neutral' | 'error';
  isFacilityTurn: boolean;
  isFacilitySigned: boolean;
} {
  const allCompleteByStatus =
    contract.status === 'PENDING_PAYMENT' || contract.status === 'ACTIVE';
  const familySigned =
    Boolean(contract.signatures?.family) || allCompleteByStatus;
  const facilitySigned =
    Boolean(contract.signatures?.facility) || allCompleteByStatus;
  const doctorSigned =
    Boolean(contract.signatures?.doctor) || allCompleteByStatus;
  const platformSigned =
    Boolean(contract.signatures?.platform) || allCompleteByStatus;
  const isCancelled = contract.status === 'CANCELLED';

  const signedCount = [
    familySigned,
    facilitySigned,
    doctorSigned,
    platformSigned,
  ].filter(Boolean).length;

  const pills: PartyPillState[] = [
    {
      key: 'A',
      state: familySigned ? 'done' : isCancelled ? 'wait' : 'current',
    },
    {
      key: 'B',
      state: facilitySigned
        ? 'done'
        : familySigned && !isCancelled
          ? 'current'
          : 'wait',
    },
    {
      key: 'C',
      state: doctorSigned
        ? 'done'
        : familySigned && facilitySigned && !isCancelled
          ? 'current'
          : 'wait',
    },
    {
      key: 'D',
      state: platformSigned
        ? 'done'
        : familySigned && facilitySigned && !isCancelled
          ? 'current'
          : 'wait',
    },
  ];

  if (isCancelled) {
    return {
      pills,
      signedCount,
      caption: 'Đã hủy / Hết hạn',
      tone: 'error',
      isFacilityTurn: false,
      isFacilitySigned: facilitySigned,
    };
  }

  if (signedCount >= 4) {
    return {
      pills,
      signedCount,
      caption:
        contract.status === 'ACTIVE'
          ? '4/4 · Đang hiệu lực'
          : '4/4 · Đã ký đầy đủ',
      tone: 'green',
      isFacilityTurn: false,
      isFacilitySigned: true,
    };
  }

  if (!familySigned) {
    return {
      pills,
      signedCount,
      caption: '0/4 · Chờ Gia đình ký trước',
      tone: 'neutral',
      isFacilityTurn: false,
      isFacilitySigned: false,
    };
  }

  if (!facilitySigned) {
    return {
      pills,
      signedCount,
      caption: `${signedCount}/4 · Đến lượt CSYT ký`,
      tone: 'amber',
      isFacilityTurn: true,
      isFacilitySigned: false,
    };
  }

  return {
    pills,
    signedCount,
    caption: `${signedCount}/4 · Chờ Bác sĩ / FamiDoc`,
    tone: 'neutral',
    isFacilityTurn: false,
    isFacilitySigned: true,
  };
}

function matchesStatusFilter(
  contract: FourPartyContract,
  filter: FacilityQueueStatusFilter
): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'CANCELLED') return contract.status === 'CANCELLED';
  if (filter === 'ACTIVE') return contract.status === 'ACTIVE';
  if (filter === 'PENDING_PAYMENT') return contract.status === 'PENDING_PAYMENT';

  const progress = getFourPartyProgress(contract);
  if (filter === 'WAITING_FAMILY') {
    return (
      !contract.signatures?.family &&
      contract.status !== 'ACTIVE' &&
      contract.status !== 'PENDING_PAYMENT' &&
      contract.status !== 'CANCELLED'
    );
  }
  if (filter === 'READY_FOR_FACILITY') {
    return progress.isFacilityTurn;
  }
  if (filter === 'FACILITY_SIGNED') {
    return (
      progress.isFacilitySigned &&
      contract.status !== 'PENDING_PAYMENT' &&
      contract.status !== 'ACTIVE' &&
      contract.status !== 'CANCELLED'
    );
  }
  return true;
}

export function FacilityContractInboundView({
  initialContracts,
}: FacilityContractInboundViewProps) {
  const isControlledByProps = initialContracts !== undefined;
  const [contracts, setContracts] = useState<FourPartyContract[]>(
    initialContracts ?? []
  );
  const [facilityName, setFacilityName] = useState('Cơ sở Y tế Đối tác');
  const [isLoading, setIsLoading] = useState<boolean>(!isControlledByProps);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [packageFilter, setPackageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] =
    useState<FacilityQueueStatusFilter>('ALL');
  const [reloadTick, setReloadTick] = useState(0);

  const triggerReload = () => {
    if (isControlledByProps) return;
    setIsLoading(true);
    setLoadError(null);
    setReloadTick((t) => t + 1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setPackageFilter('ALL');
    setStatusFilter('ALL');
  };

  useEffect(() => {
    let active = true;
    facilitiesApi
      .getMyFacilityProfile()
      .then((profile) => {
        if (!active) return;
        if (profile?.facilityName) {
          setFacilityName(profile.facilityName);
        }
      })
      .catch(() => {
        // Giữ nhãn mặc định khi không tải được hồ sơ CSYT
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
        const items = await contractsApi.getMedicalContracts({ limit: 100 });
        if (!active) return;
        setContracts(items);
        setLoadError(null);
      } catch (err) {
        if (!active) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh sách hợp đồng y tế 4 bên từ máy chủ.'
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

  const totalContracts = contracts.length;
  const pendingFacilityCount = contracts.filter(
    (c) => getFourPartyProgress(c).isFacilityTurn
  ).length;
  const signedFacilityCount = contracts.filter(
    (c) => getFourPartyProgress(c).isFacilitySigned
  ).length;

  const packageOptions = useMemo(() => {
    const map = new Map<string, string>();
    contracts.forEach((c) => {
      map.set(c.packageId, c.packageName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.contractNumber.toLowerCase().includes(q) ||
        c.familyRepresentativeName.toLowerCase().includes(q) ||
        (c.familyRepresentativePhone &&
          c.familyRepresentativePhone.includes(q)) ||
        (c.doctorName && c.doctorName.toLowerCase().includes(q)) ||
        (c.familyAddress && c.familyAddress.toLowerCase().includes(q));

      const matchesPackage =
        packageFilter === 'ALL' || c.packageId === packageFilter;
      const matchesStatus = matchesStatusFilter(c, statusFilter);

      return matchesSearch && matchesPackage && matchesStatus;
    });
  }, [contracts, searchQuery, packageFilter, statusFilter]);

  const formatPrice = (price: number) => {
    if (!Number.isFinite(price)) return '—';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] p-4 font-sans text-[#131b2f] antialiased sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Đường dẫn trang"
          className="flex items-center gap-2 text-xs text-[#4a4f63]"
        >
          <Link href="/facility" className="transition-colors hover:text-[#0037c1]">
            Cổng Cơ sở Y tế
          </Link>
          <span className="text-[#c4c5d7]">/</span>
          <span className="font-semibold text-[#0037c1]">
            Hợp đồng Y tế 4 bên
          </span>
        </nav>

        {/* Header */}
        <header className="flex flex-col justify-between gap-4 border-b border-[#e4e8ed] pb-5 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#20283d]">
              Hợp đồng Y tế 4 bên
            </h1>
            <p className="mt-1 text-sm text-[#4a4f63]">
              Danh sách hợp đồng chăm sóc hộ gia đình đã chọn bác sĩ tại{' '}
              {facilityName}. Cơ sở Y tế rà soát hồ sơ và ký số theo tiến trình
              4 bên.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e4e8ed] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#20283d] shadow-xs">
              <span className="h-2 w-2 rounded-full bg-[#52c41a]" />
              <span>{facilityName}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerReload}
              disabled={isLoading}
              className="min-h-[40px] cursor-pointer rounded-lg border-[#d9dfe5] bg-white px-3.5 text-xs font-semibold text-[#20283d]"
            >
              <span
                className={cn(
                  'material-symbols-outlined text-[16px]',
                  isLoading && 'animate-spin'
                )}
              >
                refresh
              </span>
              <span>Làm mới</span>
            </Button>
          </div>
        </header>

        {/* 3 KPI Cards */}
        <section
          aria-label="Tổng quan hợp đồng y tế 4 bên"
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <Card className="rounded-xl border-[#e4e8ed] bg-white py-4 shadow-xs">
            <CardContent className="px-5">
              <div className="text-xs font-semibold text-[#4a4f63]">
                Tổng hợp đồng
              </div>
              <div className="mt-1.5 text-2xl font-bold text-[#20283d] tabular-nums">
                {totalContracts}
              </div>
              <div className="mt-1 text-xs text-[#4a4f63]">
                Hồ sơ hợp đồng y tế 4 bên
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-[#ffd591] bg-[#fff7e6]/50 py-4 shadow-xs">
            <CardContent className="px-5">
              <div className="text-xs font-semibold text-[#904d00]">
                Chờ CSYT ký
              </div>
              <div className="mt-1.5 text-2xl font-bold text-[#633300] tabular-nums">
                {pendingFacilityCount}
              </div>
              <div className="mt-1 text-xs text-[#904d00]">
                Gia đình (Bên A) đã hoàn tất chữ ký
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-[#b7eb8f] bg-[#f6ffed]/60 py-4 shadow-xs">
            <CardContent className="px-5">
              <div className="text-xs font-semibold text-[#039855]">
                Đã ký số CSYT
              </div>
              <div className="mt-1.5 text-2xl font-bold text-[#113b00] tabular-nums">
                {signedFacilityCount}
              </div>
              <div className="mt-1 text-xs text-[#039855]">
                Đã hoàn tất chữ ký Bên B
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Error Alert */}
        {loadError && (
          <Alert
            variant="destructive"
            className="rounded-xl border-[#ffa39e] bg-[#fff1f0] text-[#93000a]"
          >
            <AlertDescription className="flex flex-col justify-between gap-3 text-sm text-[#93000a] sm:flex-row sm:items-center">
              <span>{loadError}</span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={triggerReload}
                className="min-h-[36px] shrink-0 cursor-pointer rounded-lg text-xs font-semibold"
              >
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="rounded-xl border-[#e4e8ed] bg-white py-4 shadow-xs">
          <CardContent className="grid grid-cols-1 gap-4 px-5 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="search-input"
                className="text-xs font-semibold text-[#20283d]"
              >
                Tìm kiếm hồ sơ
              </Label>
              <Input
                id="search-input"
                type="text"
                placeholder="Tìm theo mã hợp đồng, tên đại diện gia đình hoặc bác sĩ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-lg border-[#d9dfe5] bg-white text-sm text-[#131b2f]"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="package-select"
                className="text-xs font-semibold text-[#20283d]"
              >
                Lọc theo gói chăm sóc
              </Label>
              <select
                id="package-select"
                aria-label="Lọc theo gói"
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="h-11 w-full rounded-lg border border-[#d9dfe5] bg-white px-3 text-sm text-[#131b2f] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1250dc]"
              >
                <option value="ALL">Tất cả các gói</option>
                {packageOptions.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="status-select"
                className="text-xs font-semibold text-[#20283d]"
              >
                Lọc theo trạng thái ký
              </Label>
              <select
                id="status-select"
                aria-label="Lọc theo trạng thái"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as FacilityQueueStatusFilter)
                }
                className="h-11 w-full rounded-lg border border-[#d9dfe5] bg-white px-3 text-sm text-[#131b2f] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1250dc]"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="READY_FOR_FACILITY">Chờ CSYT (Bên B) ký</option>
                <option value="WAITING_FAMILY">
                  Chờ Gia đình (Bên A) ký trước
                </option>
                <option value="FACILITY_SIGNED">
                  CSYT đã ký — Chờ bên khác
                </option>
                <option value="PENDING_PAYMENT">
                  Đủ 4/4 chữ ký — Chờ thanh toán
                </option>
                <option value="ACTIVE">Đang hiệu lực</option>
                <option value="CANCELLED">Đã hủy / Hết hạn</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 4-Party Table (Desktop) + Cards (Mobile) */}
        <Card
          data-testid="facility-four-party-table"
          className="gap-0 overflow-hidden rounded-xl border-[#e4e8ed] bg-white py-0 shadow-xs"
        >
          {/* Desktop Table */}
          <div data-testid="desktop-view" className="hidden overflow-x-auto md:block">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="border-b border-[#e4e8ed] bg-[#f6f7f9] hover:bg-[#f6f7f9]">
                  <TableHead className="px-4 py-3.5 text-left text-xs font-semibold text-[#4a4f63]">
                    Mã HĐ
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-left text-xs font-semibold text-[#4a4f63]">
                    Đại diện Gia đình
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-left text-xs font-semibold text-[#4a4f63]">
                    Gói dịch vụ
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-left text-xs font-semibold text-[#4a4f63]">
                    Bác sĩ gia đình đã chọn
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-left text-xs font-semibold text-[#4a4f63]">
                    Tiến độ 4 chữ ký
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-right text-xs font-semibold text-[#4a4f63]">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#e4e8ed]">
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      role="status"
                      aria-live="polite"
                      className="py-10 text-center text-sm text-[#4a4f63]"
                    >
                      Đang tải danh sách hợp đồng y tế 4 bên...
                    </TableCell>
                  </TableRow>
                ) : contracts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-sm text-[#4a4f63]"
                    >
                      Chưa tiếp nhận hợp đồng y tế 4 bên nào.
                    </TableCell>
                  </TableRow>
                ) : filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="space-y-3">
                        <p className="text-sm text-[#4a4f63]">
                          Không tìm thấy hợp đồng nào phù hợp với bộ lọc hiện
                          tại.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                          className="min-h-[36px] cursor-pointer rounded-lg border-[#acc0f3] bg-[#f0fbff] text-xs font-semibold text-[#0037c1]"
                        >
                          Xóa bộ lọc
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => {
                    const progress = getFourPartyProgress(contract);

                    return (
                      <TableRow
                        key={contract.id}
                        className="hover:bg-[#f6f7f9]/60"
                      >
                        <TableCell className="px-4 py-3.5 text-left">
                          <div className="font-bold text-[#00258b] tabular-nums">
                            {contract.contractNumber}
                          </div>
                          <div className="mt-0.5 text-xs text-[#4a4f63] tabular-nums">
                            {formatDate(contract.createdAt)}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-left">
                          <div className="font-semibold text-[#20283d]">
                            {contract.familyRepresentativeName}
                          </div>
                          <div className="text-xs text-[#4a4f63] tabular-nums">
                            {contract.familyRepresentativePhone} •{' '}
                            {contract.membersCount || 1} thành viên
                          </div>
                          {contract.familyAddress && (
                            <div
                              className="max-w-[220px] truncate text-xs text-[#747686]"
                              title={contract.familyAddress}
                            >
                              {contract.familyAddress}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-left">
                          <div className="font-semibold text-[#20283d]">
                            {contract.packageName}
                          </div>
                          <div className="text-xs text-[#4a4f63] tabular-nums">
                            {contract.durationMonths || 12} tháng •{' '}
                            {formatPrice(contract.packagePrice)}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-left">
                          {contract.doctorName ? (
                            <div className="space-y-1">
                              <div className="font-semibold text-[#20283d]">
                                {contract.doctorName}
                              </div>
                              <div className="text-xs text-[#4a4f63]">
                                {contract.doctorTitle || 'Bác sĩ Gia đình đã chọn'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-[#4a4f63]">
                              Chưa có thông tin bác sĩ
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-left">
                          <div
                            className="flex items-center gap-1.5"
                            aria-label={`Tiến độ 4 chữ ký: ${progress.caption}`}
                          >
                            {progress.pills.map((pill) => (
                              <span
                                key={pill.key}
                                className={cn(
                                  'inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold',
                                  pill.state === 'done' &&
                                    'border-[#b7eb8f] bg-[#f6ffed] text-[#039855]',
                                  pill.state === 'current' &&
                                    'border-[#ffd591] bg-[#fff7e6] text-[#904d00]',
                                  pill.state === 'wait' &&
                                    'border-[#d9dfe5] bg-[#f6f7f9] text-[#4a4f63]'
                                )}
                              >
                                {pill.key}
                              </span>
                            ))}
                          </div>
                          <div
                            className={cn(
                              'mt-1 text-xs font-semibold tabular-nums',
                              progress.tone === 'amber' && 'text-[#904d00]',
                              progress.tone === 'green' && 'text-[#039855]',
                              progress.tone === 'error' && 'text-[#d92d20]',
                              progress.tone === 'neutral' && 'text-[#4a4f63]'
                            )}
                          >
                            {progress.caption}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-right">
                          <Button
                            asChild
                            size="sm"
                            variant={
                              progress.isFacilityTurn ? 'default' : 'outline'
                            }
                            className={
                              progress.isFacilityTurn
                                ? 'min-h-[38px] rounded-lg bg-[#0046c0] px-4 text-xs font-semibold text-white hover:bg-[#003899]'
                                : 'min-h-[38px] rounded-lg border-[#acc0f3] bg-[#f0fbff] px-4 text-xs font-semibold text-[#0037c1] hover:bg-[#eaeffa]'
                            }
                          >
                            <Link href={`/facility/coordination/${contract.id}`}>
                              Xem &amp; Ký
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div
            data-testid="mobile-view"
            className="divide-y divide-[#e4e8ed] md:hidden"
          >
            {isLoading ? (
              <div
                role="status"
                aria-live="polite"
                className="p-8 text-center text-sm text-[#4a4f63]"
              >
                Đang tải danh sách hợp đồng y tế 4 bên...
              </div>
            ) : contracts.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#4a4f63]">
                Chưa tiếp nhận hợp đồng y tế 4 bên nào.
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="space-y-3 p-8 text-center">
                <p className="text-sm text-[#4a4f63]">
                  Không tìm thấy hợp đồng nào phù hợp với bộ lọc hiện tại.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="min-h-[40px] cursor-pointer rounded-lg border-[#acc0f3] bg-[#f0fbff] text-xs font-semibold text-[#0037c1]"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            ) : (
              filteredContracts.map((contract) => {
                const progress = getFourPartyProgress(contract);
                return (
                  <div key={contract.id} className="space-y-3 p-4 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-[#00258b] tabular-nums">
                          {contract.contractNumber}
                        </div>
                        <div className="text-xs text-[#4a4f63]">
                          {contract.packageName}
                        </div>
                      </div>
                      <span className="font-bold text-[#0037c1] tabular-nums">
                        {formatPrice(contract.packagePrice)}
                      </span>
                    </div>

                    <div className="space-y-1 rounded-lg bg-[#f6f7f9] p-3 text-xs text-[#2f364a]">
                      <div>
                        Gia đình:{' '}
                        <strong className="text-[#20283d]">
                          {contract.familyRepresentativeName}
                        </strong>
                      </div>
                      <div>
                        Bác sĩ đã chọn:{' '}
                        <strong className="text-[#20283d]">
                          {contract.doctorName || 'Chưa có thông tin bác sĩ'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {progress.pills.map((pill) => (
                            <span
                              key={pill.key}
                              className={cn(
                                'inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold',
                                pill.state === 'done' &&
                                  'border-[#b7eb8f] bg-[#f6ffed] text-[#039855]',
                                pill.state === 'current' &&
                                  'border-[#ffd591] bg-[#fff7e6] text-[#904d00]',
                                pill.state === 'wait' &&
                                  'border-[#d9dfe5] bg-[#f6f7f9] text-[#4a4f63]'
                              )}
                            >
                              {pill.key}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs font-semibold text-[#4a4f63] tabular-nums">
                          {progress.caption}
                        </div>
                      </div>

                      <Button
                        asChild
                        size="sm"
                        variant={
                          progress.isFacilityTurn ? 'default' : 'outline'
                        }
                        className={
                          progress.isFacilityTurn
                            ? 'min-h-[40px] rounded-lg bg-[#0046c0] px-4 text-xs font-semibold text-white'
                            : 'min-h-[40px] rounded-lg border-[#acc0f3] bg-[#f0fbff] px-4 text-xs font-semibold text-[#0037c1]'
                        }
                      >
                        <Link href={`/facility/coordination/${contract.id}`}>
                          Xem &amp; Ký
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Legend */}
          {!isLoading && filteredContracts.length > 0 && (
            <div className="flex flex-col justify-between gap-2 border-t border-[#e4e8ed] bg-[#f6f7f9] px-4 py-3 text-xs text-[#4a4f63] sm:flex-row sm:items-center">
              <span className="tabular-nums">
                Hiển thị {filteredContracts.length} / {contracts.length} hợp đồng
                y tế 4 bên
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  <strong className="text-[#20283d]">A</strong>: Gia đình
                </span>
                <span>
                  <strong className="text-[#20283d]">B</strong>: Cơ sở Y tế
                </span>
                <span>
                  <strong className="text-[#20283d]">C</strong>: Bác sĩ Gia đình
                </span>
                <span>
                  <strong className="text-[#20283d]">D</strong>: FamiDoc
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

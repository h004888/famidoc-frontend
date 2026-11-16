'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DocumensoSigningEmbed,
  type FourPartyContract,
} from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

export interface FacilityContractInboundViewProps {
  initialContracts?: FourPartyContract[];
}

export function FacilityContractInboundView({
  initialContracts,
}: FacilityContractInboundViewProps) {
  const isControlledByProps = initialContracts !== undefined;
  const [contracts, setContracts] = useState<FourPartyContract[]>(
    initialContracts ?? []
  );
  const [isLoading, setIsLoading] = useState<boolean>(!isControlledByProps);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [packageFilter, setPackageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [signingContract, setSigningContract] = useState<FourPartyContract | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const triggerReload = () => {
    if (isControlledByProps) return;
    setIsLoading(true);
    setLoadError(null);
    setReloadTick((t) => t + 1);
  };

  useEffect(() => {
    if (isControlledByProps) return;
    let active = true;
    async function loadContracts() {
      try {
        const items = await contractsApi.getMedicalContracts({ limit: 50 });
        if (!active) return;
        setContracts(items);
        setLoadError(null);
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
  }, [isControlledByProps, reloadTick]);

  const totalContracts = contracts.length;
  const pendingSignature = contracts.filter(
    (c) =>
      !c.signatures?.facility &&
      c.status !== 'ACTIVE' &&
      c.status !== 'CANCELLED'
  ).length;
  const signedCount = contracts.filter(
    (c) =>
      Boolean(c.signatures?.facility) ||
      c.status === 'FACILITY_ASSIGNED' ||
      c.status === 'DOCTOR_ACCEPTED' ||
      c.status === 'PENDING_PAYMENT' ||
      c.status === 'ACTIVE'
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
        (c.familyRepresentativePhone && c.familyRepresentativePhone.includes(q)) ||
        (c.familyAddress && c.familyAddress.toLowerCase().includes(q));

      const matchesPackage = packageFilter === 'ALL' || c.packageId === packageFilter;
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesPackage && matchesStatus;
    });
  }, [contracts, searchQuery, packageFilter, statusFilter]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb matching project style */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <Link href="/" className="hover:text-primary transition-colors">
            Trang chủ
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/facility" className="hover:text-primary transition-colors">
            Cơ sở Y tế
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-primary font-semibold">Điều phối HĐ 4 bên</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Hợp đồng 4 bên tiếp nhận (Bên B — Cơ sở Y tế)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Danh sách hợp đồng dịch vụ bác sĩ gia đình cần phân công và ký số trên Documenso khi Bên A đã ký xác nhận.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerReload}
              disabled={isLoading}
              className="rounded-lg bg-white text-xs font-semibold cursor-pointer"
            >
              Làm mới
            </Button>
            <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-medium bg-accent text-primary border-primary/20">
              Hệ thống Điều phối CSYT
            </Badge>
          </div>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl bg-white border-slate-200 py-4 shadow-xs">
          <CardContent className="px-4">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tổng hợp đồng tiếp nhận
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {totalContracts}
            </div>
            <div className="text-xs text-slate-500 mt-1">Hồ sơ hợp đồng 4 bên</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-amber-200 bg-amber-50/20 py-4 shadow-xs">
          <CardContent className="px-4">
            <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">
              Chờ CSYT ký / phân công
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-1 tabular-nums">
              {pendingSignature}
            </div>
            <div className="text-xs text-amber-600 mt-1">Cần ký xác nhận trên Documenso</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-emerald-200 bg-emerald-50/20 py-4 shadow-xs">
          <CardContent className="px-4">
            <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
              Đã ký số CSYT
            </div>
            <div className="text-2xl font-bold text-emerald-900 mt-1 tabular-nums">
              {signedCount}
            </div>
            <div className="text-xs text-emerald-600 mt-1">Đã hoàn tất chữ ký Bên B</div>
          </CardContent>
        </Card>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-lg bg-rose-50 border-rose-200 text-rose-800">
          <AlertDescription className="flex items-center justify-between gap-2 text-xs text-rose-800">
            <span>{loadError}</span>
            <Button
              type="button"
              size="xs"
              variant="destructive"
              onClick={triggerReload}
              className="rounded-md font-semibold cursor-pointer"
            >
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Controls */}
      <Card className="rounded-xl bg-white border-slate-200 py-4 shadow-xs">
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
          <div className="space-y-1">
            <Label htmlFor="search-input" className="text-xs font-medium text-slate-700">
              Tìm kiếm hồ sơ
            </Label>
            <Input
              id="search-input"
              type="text"
              placeholder="Tìm theo số HĐ, tên người đại diện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md text-sm bg-white"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="package-select" className="text-xs font-medium text-slate-700">
              Lọc theo gói chăm sóc
            </Label>
            <select
              id="package-select"
              aria-label="Lọc theo gói"
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="h-9 w-full px-3 text-sm rounded-md border border-input focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring bg-white"
            >
              <option value="ALL">Tất cả các gói</option>
              {packageOptions.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="status-select" className="text-xs font-medium text-slate-700">
              Lọc theo trạng thái hợp đồng
            </Label>
            <select
              id="status-select"
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full px-3 text-sm rounded-md border border-input focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DRAFT">Chờ Bên A ký Documenso</option>
              <option value="FAMILY_SIGNED">Bên A đã ký — Chờ ký song song</option>
              <option value="PLATFORM_SIGNED">Chờ CSYT phân công (Nền tảng đã duyệt)</option>
              <option value="FACILITY_ASSIGNED">Đã phân công bác sĩ</option>
              <option value="PENDING_PAYMENT">Đủ 4/4 chữ ký — Chờ thanh toán</option>
              <option value="ACTIVE">Đang hiệu lực</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card className="bg-white rounded-xl border-slate-200 shadow-xs overflow-hidden py-0 gap-0">
        <div className="hidden md:block">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs tracking-wider hover:bg-slate-50">
              <TableHead className="py-3 px-4 text-left text-slate-600">Mã Hợp Đồng</TableHead>
              <TableHead className="py-3 px-4 text-left text-slate-600">Đại diện Gia đình</TableHead>
              <TableHead className="py-3 px-4 text-left text-slate-600">Gói Dịch Vụ</TableHead>
              <TableHead className="py-3 px-4 text-right text-slate-600">Phí dịch vụ</TableHead>
              <TableHead className="py-3 px-4 text-left text-slate-600">Bác sĩ phụ trách</TableHead>
              <TableHead className="py-3 px-4 text-center text-slate-600">Trạng thái</TableHead>
              <TableHead className="py-3 px-4 text-right text-slate-600">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                  Đang tải danh sách hợp đồng...
                </TableCell>
              </TableRow>
            ) : filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  Không tìm thấy hợp đồng nào phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => {
                const familySigned = Boolean(contract.signatures?.family) || contract.status !== 'DRAFT';
                const facilitySigned =
                  Boolean(contract.signatures?.facility) ||
                  contract.status === 'FACILITY_ASSIGNED' ||
                  contract.status === 'PENDING_PAYMENT' ||
                  contract.status === 'ACTIVE';
                const isPending = !facilitySigned;

                return (
                  <TableRow key={contract.id} className="hover:bg-slate-50/70">
                    <TableCell className="py-3.5 px-4 text-left">
                      <div className="font-semibold text-slate-900 tabular-nums">
                        {contract.contractNumber}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        Tạo ngày {formatDate(contract.createdAt)}
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-left">
                      <div className="font-medium text-slate-900">
                        {contract.familyRepresentativeName}
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        {contract.familyRepresentativePhone} • {contract.membersCount || 1} suất thành viên
                      </div>
                      {contract.familyAddress && (
                        <div className="text-xs text-slate-400 truncate max-w-[200px]" title={contract.familyAddress}>
                          {contract.familyAddress}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-left">
                      <div className="font-medium text-slate-800">
                        {contract.packageName}
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        Thời hạn: {contract.durationMonths || 12} tháng
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-right font-medium text-slate-800 tabular-nums">
                      {formatPrice(contract.packagePrice)}
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-left">
                      {contract.doctorName ? (
                        <div>
                          <span className="font-medium text-slate-800">
                            {contract.doctorName}
                          </span>
                          {contract.doctorTitle && (
                            <div className="text-xs text-slate-500">
                              {contract.doctorTitle}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-700 bg-amber-50 rounded border-amber-200">
                          Chưa phân công
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-center">
                      {!familySigned ? (
                        <Badge variant="secondary" className="rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          Chờ Bên A ký trước
                        </Badge>
                      ) : isPending ? (
                        <Badge variant="outline" className="rounded-full text-xs font-medium bg-amber-50 text-amber-800 border-amber-200">
                          Chờ phân công &amp; ký
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border-emerald-200">
                          Đã ký số CSYT
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => setSigningContract(contract)}
                          className="text-xs font-medium rounded-md text-teal-800 bg-teal-50 hover:bg-teal-100 border-teal-200 cursor-pointer"
                        >
                          Ký Documenso
                        </Button>
                        <Button
                          asChild
                          size="xs"
                          variant={isPending ? 'default' : 'secondary'}
                          className="text-xs font-medium rounded-md"
                        >
                          <Link href={`/facility/contracts/${contract.id}/assign`}>
                            {isPending ? 'Phân công & Ký số' : 'Xem phân công'}
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>
        <div className="divide-y divide-slate-100 md:hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Đang tải danh sách hợp đồng...</div>
          ) : filteredContracts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">Không có hợp đồng nào phù hợp.</div>
          ) : (
            filteredContracts.map((contract) => (
              <div key={contract.id} className="space-y-2.5 p-4 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 tabular-nums">{contract.contractNumber}</div>
                    <div className="text-[11px] text-slate-500">{contract.packageName}</div>
                  </div>
                  <span className="font-bold text-primary tabular-nums">{formatPrice(contract.packagePrice)}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 space-y-1 text-slate-600">
                  <div>Gia đình: <strong className="text-slate-800">{contract.familyRepresentativeName}</strong></div>
                  <div>Bác sĩ: <strong className="text-slate-800">{contract.doctorName || 'Chưa phân công'}</strong></div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="rounded-full text-[11px] font-semibold">{contract.status}</Badge>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="rounded-lg text-xs font-semibold">
                      <Link href={`/facility/contracts/${contract.id}`}>Chi tiết</Link>
                    </Button>
                    {!contract.signatures?.facility?.signedAt && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setSigningContract(contract)}
                        className="rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Ký Documenso
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Dialog ký Documenso trực tiếp cho CSYT (Bên B) */}
      <Dialog open={Boolean(signingContract)} onOpenChange={(open) => !open && setSigningContract(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 sm:max-w-3xl">
          {signingContract && (
            <>
              <DialogHeader className="border-b border-slate-100 pb-3">
                <DialogTitle className="text-base font-bold text-slate-900">
                  Ký Hợp Đồng Documenso — Bên B (Cơ sở Y tế)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 tabular-nums">
                  {signingContract.contractNumber} • Gia đình: {signingContract.familyRepresentativeName}
                </DialogDescription>
              </DialogHeader>

              <DocumensoSigningEmbed
                contractId={signingContract.id}
                onSyncCompleted={triggerReload}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
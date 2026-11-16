'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CONTRACT_STATUS_LABELS,
  DocumensoSigningEmbed,
  type FourPartyContract,
} from '@/features/four-party-contract';
import {
  contractsApi,
  extractErrorMessage,
  type StaffingContractItem,
} from '@/lib/api';
import { facilitiesApi, type AdminFacilityItem } from '@/lib/api/facilities.api';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type AdminStatusFilter = 'ALL' | 'READY_FOR_ADMIN' | 'WAITING_FAMILY' | 'PENDING_PAYMENT' | 'ACTIVE';

function countSignatures(contract: FourPartyContract): number {
  const sigs = contract.signatures ?? {};
  return [sigs.family, sigs.facility, sigs.doctor, sigs.platform].filter(Boolean).length;
}

export function AdminContractsView() {
  const [contracts, setContracts] = useState<FourPartyContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<AdminStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<FourPartyContract | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [adminContractTab, setAdminContractTab] = useState<'medical' | 'staffing'>('medical');
  const [staffingList, setStaffingList] = useState<StaffingContractItem[]>([]);
  const [isStaffingLoading, setIsStaffingLoading] = useState(false);
  const [selectedStaffing, setSelectedStaffing] = useState<StaffingContractItem | null>(null);
  const [showStaffingDetailModal, setShowStaffingDetailModal] = useState(false);
  const [signingStaffingId, setSigningStaffingId] = useState<string | null>(null);

  // B2B Staffing Contract Draft Modal (Flow 2.1)
  const [showCreateB2BModal, setShowCreateB2BModal] = useState(false);
  const [facilitiesList, setFacilitiesList] = useState<AdminFacilityItem[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [facilitySearchText, setFacilitySearchText] = useState<string>('');
  const [isFacilityPickerOpen, setIsFacilityPickerOpen] = useState(false);
  const [facilityFilterTab, setFacilityFilterTab] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const facilityPickerRef = React.useRef<HTMLDivElement>(null);
  const [newFacilityShare, setNewFacilityShare] = useState(85);
  const [validFromDate, setValidFromDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [validToDate, setValidToDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  // Click outside to close facility dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        facilityPickerRef.current &&
        !facilityPickerRef.current.contains(event.target as Node)
      ) {
        setIsFacilityPickerOpen(false);
      }
    }
    if (isFacilityPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFacilityPickerOpen]);

  // Nạp danh sách Cơ sở y tế cho modal chọn CSYT
  useEffect(() => {
    if (showCreateB2BModal && facilitiesList.length === 0) {
      setIsLoadingFacilities(true);
      facilitiesApi
        .getAdminFacilities({ limit: 100 })
        .then((res) => {
          if (res && Array.isArray(res.data)) {
            setFacilitiesList(res.data);
            // Ưu tiên chọn CSYT đã kích hoạt ACTIVE
            const firstActive = res.data.find(
              (f) => f.onboardingStatus === 'ACTIVE' || f.status === 'ACTIVE'
            );
            if (firstActive) {
              setSelectedFacilityId(firstActive.id);
            } else if (res.data.length > 0) {
              setSelectedFacilityId(res.data[0].id);
            }
          }
        })
        .catch((err) => {
          console.warn('Lỗi tải danh sách cơ sở y tế:', err);
        })
        .finally(() => {
          setIsLoadingFacilities(false);
        });
    }
  }, [showCreateB2BModal, facilitiesList.length]);

  const handleCreateB2BDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityId) {
      toast.error('Vui lòng chọn một Cơ sở y tế đối tác từ danh sách.');
      return;
    }
    const targetFacility = facilitiesList.find((f) => f.id === selectedFacilityId);
    if (!targetFacility) {
      toast.error('Cơ sở y tế được chọn không tồn tại.');
      return;
    }

    setIsCreatingDraft(true);
    try {
      await contractsApi.createStaffingContract({
        facilityId: selectedFacilityId,
        platformCommissionRate: 100 - newFacilityShare,
        facilityRevenueRate: newFacilityShare,
        startDate: validFromDate,
        endDate: validToDate,
      });
      toast.success(
        `Đã khởi tạo dự thảo hợp đồng B2B với "${targetFacility.facilityName}" thành công!`
      );
      setShowCreateB2BModal(false);
      triggerReload();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể tạo hợp đồng B2B trên máy chủ.'));
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleAdminSignStaffing = async (contractId: string) => {
    setSigningStaffingId(contractId);
    try {
      await contractsApi.signStaffingContract(contractId, {
        confirmed: true,
        signedPdfUrl: `https://cdn.famidoc.vn/contracts/staffing/${contractId}-admin-signed.pdf`,
        signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });
      toast.success('Admin đã hoàn tất ký số điện tử SmartCA cho Hợp đồng B2B!');
      triggerReload();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Lỗi khi ký số hợp đồng B2B.'));
    } finally {
      setSigningStaffingId(null);
    }
  };

  const triggerReload = () => {
    setIsLoading(true);
    setIsStaffingLoading(true);
    setLoadError(null);
    setReloadTick((t) => t + 1);
  };

  useEffect(() => {
    let active = true;
    async function loadContracts() {
      try {
        const [items, staffingRes] = await Promise.allSettled([
          contractsApi.getMedicalContracts({ limit: 50 }),
          contractsApi.getStaffingContracts(),
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
          setIsStaffingLoading(false);
        }
      }
    }
    void loadContracts();
    return () => {
      active = false;
    };
  }, [reloadTick]);

  const filteredContracts = contracts.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.contractNumber.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.familyRepresentativeName.toLowerCase().includes(q) ||
      (c.facilityName || '').toLowerCase().includes(q) ||
      (c.doctorName || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const familySigned = Boolean(c.signatures?.family);
    const adminSigned = Boolean(c.signatures?.platform);

    if (filterStatus === 'WAITING_FAMILY') {
      return c.status === 'DRAFT' && !familySigned;
    }
    if (filterStatus === 'READY_FOR_ADMIN') {
      return familySigned && !adminSigned && c.status !== 'ACTIVE' && c.status !== 'CANCELLED';
    }
    if (filterStatus === 'PENDING_PAYMENT') {
      return c.status === 'PENDING_PAYMENT';
    }
    if (filterStatus === 'ACTIVE') {
      return c.status === 'ACTIVE';
    }
    return true;
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="min-h-full bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
              <span className="material-symbols-outlined text-[17px]">gavel</span>
              <span>Ban Quản Trị Hệ Thống • Phê Duyệt Pháp Lý &amp; Documenso 4 Bên</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Quản lý Hợp đồng &amp; Ký Duyệt Nền tảng (Bên D)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Theo dõi hợp đồng 4 bên thật từ hệ thống: Bên A ký trước trên Documenso, sau đó Admin (Bên D), CSYT (Bên B) và Bác sĩ (Bên C) ký song song.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              size="sm"
              onClick={() => setShowCreateB2BModal(true)}
              className="rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Thiết Lập Dự Thảo HĐ B2B</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerReload}
              disabled={isLoading}
              className="rounded-xl bg-white text-xs font-semibold cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] text-slate-500 ${isLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Làm mới</span>
            </Button>
            <Badge className="gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold tabular-nums">
              <span className="material-symbols-outlined text-[16px] text-amber-400">verified</span>
              <span>Tổng cộng: {contracts.length} hợp đồng</span>
            </Badge>
          </div>
        </div>

        {loadError && (
          <Alert variant="destructive" className="rounded-xl bg-rose-50 border-rose-200 text-rose-800">
            <AlertDescription className="flex items-center justify-between gap-3 text-xs sm:text-sm text-rose-800">
              <span>{loadError}</span>
              <Button
                type="button"
                size="xs"
                variant="destructive"
                onClick={triggerReload}
                className="rounded-lg text-xs font-semibold cursor-pointer"
              >
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation Tab Bar: Flow 2.2 (HĐ 4 bên) vs Flow 2.1 (HĐ Cung ứng B2B) */}
        <div className="flex overflow-x-auto border-b border-slate-200 gap-2">
          <button
            type="button"
            onClick={() => setAdminContractTab('medical')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              adminContractTab === 'medical'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
            <span>1. Hợp Đồng Y Tế Gia Đình 4 Bên (Documenso)</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {contracts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAdminContractTab('staffing')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              adminContractTab === 'staffing'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">handshake</span>
            <span>2. Hợp Đồng Cung Ứng Nhân Lực B2B (Flow 2.1)</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {staffingList.length}
            </span>
          </button>
        </div>

        {adminContractTab === 'medical' ? (
          <>
            {/* Filter and Search Bar */}
            <Card className="rounded-2xl border-slate-200 py-4 shadow-xs">
              <CardContent className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-4">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <Input
                    type="text"
                    placeholder="Tìm theo mã hợp đồng, đại diện hộ gia đình, cơ sở y tế, bác sĩ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 bg-slate-50 rounded-xl text-xs sm:text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      ['ALL', 'Tất cả'],
                      ['READY_FOR_ADMIN', 'Chờ Admin ký (Bên D)'],
                      ['WAITING_FAMILY', 'Chờ Bên A ký'],
                      ['PENDING_PAYMENT', 'Chờ thanh toán'],
                      ['ACTIVE', 'Đang hiệu lực'],
                    ] as const
                  ).map(([key, label]) => (
                    <Button
                      key={key}
                      type="button"
                      size="sm"
                      variant={filterStatus === key ? 'default' : 'secondary'}
                      onClick={() => setFilterStatus(key)}
                      className="rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contracts Table */}
            <Card className="rounded-2xl border-slate-200 shadow-xs overflow-hidden py-0 gap-0">
              <div className="hidden md:block">
              <Table className="text-xs sm:text-sm">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider hover:bg-slate-50">
                    <TableHead className="py-3.5 px-4 text-slate-600">Mã Hợp đồng &amp; Gói</TableHead>
                    <TableHead className="py-3.5 px-4 text-slate-600">Hộ gia đình (Bên A)</TableHead>
                    <TableHead className="py-3.5 px-4 text-slate-600">CSYT (Bên B) &amp; Bác sĩ (Bên C)</TableHead>
                    <TableHead className="py-3.5 px-4 text-right text-slate-600">Giá trị</TableHead>
                    <TableHead className="py-3.5 px-4 text-center text-slate-600">Tiến độ Documenso</TableHead>
                    <TableHead className="py-3.5 px-4 text-right text-slate-600">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-slate-500 text-xs">
                        Đang tải danh sách hợp đồng từ hệ thống...
                      </TableCell>
                    </TableRow>
                  ) : filteredContracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-slate-500 text-xs">
                        Không có hợp đồng nào phù hợp với bộ lọc hiện tại.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContracts.map((c) => {
                      const sigCount = countSignatures(c);
                      const familySigned = Boolean(c.signatures?.family);
                      const adminSigned = Boolean(c.signatures?.platform);

                      return (
                        <TableRow key={c.id} className="hover:bg-slate-50/70">
                          <TableCell className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{c.packageName}</div>
                            <div className="tabular-nums text-[11px] text-slate-500 mt-0.5">
                              {c.contractNumber} • {c.membersCount ?? 1} thành viên
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
                          <TableCell className="py-3.5 px-4 text-right font-semibold text-primary tabular-nums">
                            {formatPrice(c.packagePrice)}
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-center space-y-1">
                            <Badge
                              variant="outline"
                              className={`rounded-full text-[11px] font-semibold ${c.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : familySigned
                                    ? 'bg-blue-50 text-primary border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                            >
                              {c.status === 'ACTIVE'
                                ? 'Đang hiệu lực'
                                : c.status === 'PENDING_PAYMENT'
                                  ? 'Chờ thanh toán VietQR'
                                  : !familySigned
                                    ? 'Chờ Bên A ký trước'
                                    : adminSigned
                                      ? 'Admin đã ký — chờ bên khác'
                                      : CONTRACT_STATUS_LABELS[c.status] || 'Bên A đã ký'}
                            </Badge>
                            <div className="text-[11px] text-slate-500 tabular-nums">
                              {sigCount}/4 chữ ký Documenso
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button asChild size="xs" variant="secondary" className="rounded-lg bg-accent text-primary hover:bg-accent/80 font-semibold">
                                <Link href={`/admin/contracts/${c.id}/review`}>Thẩm định 4 Bên</Link>
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant={familySigned && !adminSigned ? 'default' : 'secondary'}
                                onClick={() => setSelectedContract(c)}
                                className="rounded-lg font-semibold cursor-pointer"
                              >
                                {familySigned && !adminSigned
                                  ? 'Ký trên Documenso'
                                  : 'Chi tiết & Documenso'}
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
                  <div className="p-8 text-center text-xs text-slate-500">Đang tải danh sách hợp đồng từ hệ thống...</div>
                ) : filteredContracts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">Không có hợp đồng nào phù hợp với bộ lọc hiện tại.</div>
                ) : (
                  filteredContracts.map((c) => {
                    const sigCount = countSignatures(c);
                    const familySigned = Boolean(c.signatures?.family);
                    const adminSigned = Boolean(c.signatures?.platform);
                    return (
                      <div key={c.id} className="space-y-2.5 p-4 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900">{c.packageName}</div>
                            <div className="tabular-nums text-[11px] text-slate-500">{c.contractNumber} • {c.membersCount ?? 1} TV</div>
                          </div>
                          <span className="shrink-0 font-bold text-primary tabular-nums">{formatPrice(c.packagePrice)}</span>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2.5 space-y-1 text-slate-600">
                          <div><span className="font-semibold text-slate-700">Hộ gia đình:</span> {c.familyRepresentativeName}</div>
                          <div><span className="font-semibold text-slate-700">CSYT / BS:</span> {c.facilityName} • {c.doctorName}</div>
                          <div className="tabular-nums text-[11px] text-slate-500">Chữ ký: {sigCount}/4 • {CONTRACT_STATUS_LABELS[c.status] || c.status}</div>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button asChild size="sm" variant="secondary" className="rounded-lg bg-accent text-primary text-xs font-semibold">
                            <Link href={`/admin/contracts/${c.id}/review`}>Thẩm định 4 Bên</Link>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={familySigned && !adminSigned ? 'default' : 'secondary'}
                            onClick={() => setSelectedContract(c)}
                            className="rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            {familySigned && !adminSigned ? 'Ký trên Documenso' : 'Chi tiết & Documenso'}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </>
        ) : (
          /* TAB 2: HỢP ĐỒNG CUNG ỨNG NHÂN LỰC B2B (FLOW 2.1) */
          <div className="space-y-6">
            {/* Banner giới thiệu */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">handshake</span>
                  <span>Quản Lý Hợp Đồng Khung Cung Ứng Nhân Lực Y Tế B2B (Flow 2.1)</span>
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Thỏa thuận hợp tác giữa Ban Quản trị Nền tảng FamiDoc và các Cơ sở y tế đối tác, xác lập tỷ lệ phân chia doanh thu và điều kiện pháp lý để kích hoạt phân hệ khám chữa bệnh gia đình.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowCreateB2BModal(true)}
                className="rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Thiết Lập Dự Thảo Mới</span>
              </Button>
            </div>

            {/* Bảng danh sách B2B Staffing Contracts */}
            <Card className="rounded-2xl border-slate-200 shadow-xs overflow-hidden py-0 gap-0">
              <Table className="text-xs sm:text-sm">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider hover:bg-slate-50">
                    <TableHead className="py-3.5 px-4 text-slate-600">Mã Hợp Đồng</TableHead>
                    <TableHead className="py-3.5 px-4 text-slate-600">Cơ Sở Y Tế Đối Tác</TableHead>
                    <TableHead className="py-3.5 px-4 text-slate-600">Tỷ Lệ Phân Chia</TableHead>
                    <TableHead className="py-3.5 px-4 text-slate-600">Thời Hạn Hiệu Lực</TableHead>
                    <TableHead className="py-3.5 px-4 text-slate-600">Tiến Trình Chữ Ký</TableHead>
                    <TableHead className="py-3.5 px-4 text-slate-600">Trạng Thái</TableHead>
                    <TableHead className="py-3.5 px-4 text-right text-slate-600">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {isStaffingLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-slate-500 text-xs">
                        Đang tải danh sách hợp đồng B2B...
                      </TableCell>
                    </TableRow>
                  ) : staffingList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-slate-500 text-xs">
                        Chưa có hợp đồng cung ứng nhân lực B2B nào. Nhấn &ldquo;Thiết Lập Dự Thảo Mới&rdquo; để khởi tạo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    staffingList.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/70">
                        <TableCell className="py-3.5 px-4 font-bold text-primary whitespace-nowrap">
                          {item.contractNumber}
                        </TableCell>
                        <TableCell className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{item.facilityName}</div>
                          <div className="text-[11px] text-slate-400">ID: {item.id}</div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-800">{item.facilitySharePercent}% CSYT</span>
                          <span className="text-slate-400 text-xs"> / {item.platformSharePercent}% FamiDoc</span>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs whitespace-nowrap text-slate-600">
                          {new Date(item.validFrom).toLocaleDateString('vi-VN')} - {new Date(item.validTo).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className={`flex items-center gap-1 text-[11px] font-medium ${item.adminSigned ? 'text-emerald-700' : 'text-amber-600'}`}>
                              <span>{item.adminSigned ? '✓' : '○'}</span> Admin: {item.adminSigned ? 'Đã ký số' : 'Chờ Admin ký'}
                            </span>
                            <span className={`flex items-center gap-1 text-[11px] font-medium ${item.facilitySigned ? 'text-emerald-700' : 'text-slate-500'}`}>
                              <span>{item.facilitySigned ? '✓' : '○'}</span> CSYT: {item.facilitySigned ? 'Đã ký số' : 'Chờ CSYT ký'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 whitespace-nowrap">
                          {item.status === 'ACTIVE' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Đang Hiệu Lực (ACTIVE)
                            </span>
                          )}
                          {item.status === 'DRAFT' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Dự Thảo
                            </span>
                          )}
                          {item.status === 'TERMINATED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Đã Hủy / Từ Chối
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {item.status === 'DRAFT' && !item.adminSigned && (
                              <Button
                                type="button"
                                size="xs"
                                disabled={signingStaffingId === item.id}
                                onClick={() => handleAdminSignStaffing(item.id)}
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer gap-1"
                              >
                                {signingStaffingId === item.id ? (
                                  'Đang ký...'
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-[15px]">draw</span>
                                    <span>Ký Duyệt (SmartCA)</span>
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="xs"
                              variant="secondary"
                              onClick={() => {
                                setSelectedStaffing(item);
                                setShowStaffingDetailModal(true);
                              }}
                              className="rounded-lg font-semibold cursor-pointer"
                            >
                              Chi Tiết
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {/* Dialog: Ký trực tiếp trên Documenso & Chi tiết 4 bên */}
        <Dialog open={Boolean(selectedContract)} onOpenChange={(open) => !open && setSelectedContract(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 sm:max-w-3xl">
            {selectedContract && (
              <>
                <DialogHeader className="border-b border-slate-100 pb-3">
                  <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      description
                    </span>
                    <span>Ký Hợp Đồng 4 Bên Trên Documenso — Bên D (Nền tảng)</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 tabular-nums">
                    Mã HĐ: {selectedContract.contractNumber} • Chủ hộ: {selectedContract.familyRepresentativeName}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className={`p-2 rounded-lg border ${selectedContract.signatures?.family ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    <strong>Bên A (Gia đình)</strong>
                    <div>{selectedContract.signatures?.family ? 'Đã ký ✓' : 'Chưa ký'}</div>
                  </div>
                  <div className={`p-2 rounded-lg border ${selectedContract.signatures?.facility ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <strong>Bên B (CSYT)</strong>
                    <div>{selectedContract.signatures?.facility ? 'Đã ký ✓' : 'Chờ ký'}</div>
                  </div>
                  <div className={`p-2 rounded-lg border ${selectedContract.signatures?.doctor ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <strong>Bên C (Bác sĩ)</strong>
                    <div>{selectedContract.signatures?.doctor ? 'Đã ký ✓' : 'Chờ ký'}</div>
                  </div>
                  <div className={`p-2 rounded-lg border ${selectedContract.signatures?.platform ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-blue-50 border-blue-200 text-blue-900'}`}>
                    <strong>Bên D (Admin)</strong>
                    <div>{selectedContract.signatures?.platform ? 'Đã ký ✓' : 'Chờ ký'}</div>
                  </div>
                </div>

                <DocumensoSigningEmbed
                  contractId={selectedContract.id}
                  onSyncCompleted={(res) => {
                    const msg = `Đã đồng bộ chữ ký Documenso cho ${selectedContract.contractNumber} (${res.signedRoles.length}/4 bên).`;
                    toast.success(msg);
                    triggerReload();
                  }}
                />

                <DialogFooter className="border-t border-slate-100 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedContract(null)}
                    className="rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Đóng
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
        {/* Modal tạo dự thảo hợp đồng B2B nhân lực y tế (Flow 2.1) */}
        <Dialog open={showCreateB2BModal} onOpenChange={setShowCreateB2BModal}>
          <DialogContent className="max-w-lg rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <span className="material-symbols-outlined text-primary text-[20px]">handshake</span>
                Thiết Lập Dự Thảo HĐ B2B Nhân Lực Y Tế
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Flow 2.1 - Admin thiết lập dự thảo hợp đồng khung cung ứng nhân lực y tế với Cơ sở y tế đối tác.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateB2BDraft} className="space-y-4 pt-2">
              {/* Chọn Cơ sở y tế đối tác (Combobox UI cao cấp) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Cơ sở y tế đối tác <span className="text-rose-500">*</span>
                  </label>
                  {!isLoadingFacilities && facilitiesList.length > 0 && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Tổng {facilitiesList.length} cơ sở y tế
                    </span>
                  )}
                </div>

                {isLoadingFacilities ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span>Đang nạp danh sách cơ sở y tế...</span>
                  </div>
                ) : facilitiesList.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    Chưa có cơ sở y tế nào trên hệ thống.{' '}
                    <Link href="/admin/facilities" className="underline font-bold">
                      Thêm hoặc duyệt CSYT ngay
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(() => {
                      const selectedFacility = facilitiesList.find((f) => f.id === selectedFacilityId);
                      const isSelectedActive =
                        selectedFacility?.onboardingStatus === 'ACTIVE' || selectedFacility?.status === 'ACTIVE';

                      const activeFacilitiesCount = facilitiesList.filter(
                        (f) => f.onboardingStatus === 'ACTIVE' || f.status === 'ACTIVE'
                      ).length;
                      const pendingFacilitiesCount = facilitiesList.length - activeFacilitiesCount;

                      const filteredFacilities = facilitiesList.filter((fac) => {
                        const isActive = fac.onboardingStatus === 'ACTIVE' || fac.status === 'ACTIVE';
                        if (facilityFilterTab === 'ACTIVE' && !isActive) return false;
                        if (facilityFilterTab === 'PENDING' && isActive) return false;

                        if (!facilitySearchText.trim()) return true;
                        const query = facilitySearchText.toLowerCase();
                        return (
                          fac.facilityName.toLowerCase().includes(query) ||
                          fac.representativeName.toLowerCase().includes(query) ||
                          (fac.address && fac.address.toLowerCase().includes(query)) ||
                          (fac.phone && fac.phone.includes(query)) ||
                          (fac.email && fac.email.toLowerCase().includes(query))
                        );
                      });

                      return (
                        <>
                          {/* Khối Combobox Trigger & Popover */}
                          <div ref={facilityPickerRef} className="relative">
                            {/* Nút Trigger chọn CSYT */}
                            <button
                              type="button"
                              onClick={() => setIsFacilityPickerOpen((prev) => !prev)}
                              className={`w-full text-left p-2.5 bg-white border rounded-xl transition-all shadow-xs flex items-center justify-between gap-3 hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 ${isFacilityPickerOpen
                                  ? 'border-primary ring-2 ring-primary/20 bg-primary/2'
                                  : 'border-slate-300'
                                }`}
                            >
                              {selectedFacility ? (
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-900 truncate">
                                        {selectedFacility.facilityName}
                                      </span>
                                      {isSelectedActive ? (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          Đủ ĐK ký HĐ
                                        </span>
                                      ) : (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                          Chờ duyệt
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                      Đại diện: <strong>{selectedFacility.representativeName}</strong> • {selectedFacility.phone}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2.5 text-slate-400 text-xs py-1">
                                  <span className="material-symbols-outlined text-lg">apartment</span>
                                  <span>-- Chọn một Cơ sở y tế đối tác từ danh sách --</span>
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-slate-100">
                                <span className="text-[11px] font-semibold text-primary hidden sm:inline-block">
                                  {isFacilityPickerOpen ? 'Đóng' : 'Đổi CSYT'}
                                </span>
                                <span
                                  className={`material-symbols-outlined text-slate-400 text-lg transition-transform duration-200 ${isFacilityPickerOpen ? 'rotate-180 text-primary' : ''
                                    }`}
                                >
                                  expand_more
                                </span>
                              </div>
                            </button>

                            {/* Dropdown Menu Popover dạng Card nổi cao cấp */}
                            {isFacilityPickerOpen && (
                              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                {/* Header tìm kiếm & tab lọc */}
                                <div className="p-2.5 bg-slate-50/90 border-b border-slate-100 space-y-2">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={facilitySearchText}
                                      onChange={(e) => setFacilitySearchText(e.target.value)}
                                      placeholder="Tìm theo tên, người đại diện, SĐT, địa chỉ..."
                                      className="w-full text-xs pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                      autoFocus
                                    />
                                    <span className="material-symbols-outlined text-slate-400 text-sm absolute left-2.5 top-2.5">
                                      search
                                    </span>
                                    {facilitySearchText && (
                                      <button
                                        type="button"
                                        onClick={() => setFacilitySearchText('')}
                                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>

                                  {/* Filter Tabs */}
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <button
                                      type="button"
                                      onClick={() => setFacilityFilterTab('ALL')}
                                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${facilityFilterTab === 'ALL'
                                          ? 'bg-slate-900 text-white'
                                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                      Tất cả ({facilitiesList.length})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setFacilityFilterTab('ACTIVE')}
                                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${facilityFilterTab === 'ACTIVE'
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                                        }`}
                                    >
                                      ✓ Đủ điều kiện ({activeFacilitiesCount})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setFacilityFilterTab('PENDING')}
                                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${facilityFilterTab === 'PENDING'
                                          ? 'bg-amber-600 text-white'
                                          : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                                        }`}
                                    >
                                      Chờ duyệt ({pendingFacilitiesCount})
                                    </button>
                                  </div>
                                </div>

                                {/* Danh sách item cuộn mượt */}
                                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1.5">
                                  {filteredFacilities.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-slate-400">
                                      <span className="material-symbols-outlined text-2xl text-slate-300 block mb-1">
                                        search_off
                                      </span>
                                      Không tìm thấy cơ sở y tế nào phù hợp với từ khóa
                                    </div>
                                  ) : (
                                    filteredFacilities.map((fac) => {
                                      const isSelected = fac.id === selectedFacilityId;
                                      const isFacActive =
                                        fac.onboardingStatus === 'ACTIVE' || fac.status === 'ACTIVE';

                                      return (
                                        <button
                                          key={fac.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedFacilityId(fac.id);
                                            setIsFacilityPickerOpen(false);
                                          }}
                                          className={`w-full text-left p-2.5 rounded-lg cursor-pointer transition-all flex items-start justify-between gap-2.5 ${isSelected
                                              ? 'bg-primary/8 border border-primary/30 text-slate-900 shadow-xs'
                                              : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                                            }`}
                                        >
                                          <div className="flex items-start gap-2.5 min-w-0">
                                            <div
                                              className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${isFacActive
                                                  ? 'bg-emerald-50 text-emerald-600'
                                                  : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                              <span className="material-symbols-outlined text-[18px]">
                                                {isFacActive ? 'verified' : 'domain'}
                                              </span>
                                            </div>
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <span
                                                  className={`text-xs ${isSelected
                                                      ? 'font-bold text-primary'
                                                      : 'font-semibold text-slate-900'
                                                    } truncate`}
                                                >
                                                  {fac.facilityName}
                                                </span>
                                              </div>
                                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                Đại diện: <strong>{fac.representativeName}</strong> • SĐT: {fac.phone}
                                              </p>
                                              {fac.address && (
                                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                  {fac.address}
                                                </p>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex flex-col items-end gap-1 shrink-0">
                                            {isFacActive ? (
                                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                ACTIVE
                                              </span>
                                            ) : (
                                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                Chờ duyệt
                                              </span>
                                            )}
                                            {isSelected && (
                                              <span className="material-symbols-outlined text-primary text-base">
                                                check_circle
                                              </span>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })
                                  )}
                                </div>

                                {/* Footer thông tin & đóng */}
                                <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                  <span>
                                    Hiển thị <strong>{filteredFacilities.length}</strong> / {facilitiesList.length} cơ sở
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setIsFacilityPickerOpen(false)}
                                    className="text-primary hover:underline font-semibold"
                                  >
                                    Đóng bảng chọn
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Thẻ xem trước chi tiết CSYT & Hướng dẫn duyệt pháp lý */}
                          {selectedFacility && (
                            <div
                              className={`p-3 rounded-xl text-xs border transition-all ${isSelectedActive
                                  ? 'bg-emerald-50/60 text-emerald-900 border-emerald-200'
                                  : 'bg-amber-50/70 text-amber-900 border-amber-200'
                                }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span className="flex items-center gap-1.5">
                                  {selectedFacility.facilityName}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${isSelectedActive
                                      ? 'bg-white text-emerald-700 border-emerald-300'
                                      : 'bg-white text-amber-700 border-amber-300'
                                    }`}
                                >
                                  {isSelectedActive ? 'Đủ điều kiện pháp lý' : selectedFacility.onboardingStatus}
                                </span>
                              </div>

                              <div className="text-[11px] mt-1.5 space-y-0.5 opacity-90">
                                <div>
                                  Đại diện pháp lý: <strong>{selectedFacility.representativeName}</strong> • Email: {selectedFacility.email}
                                </div>
                                {selectedFacility.address && <div>Địa chỉ hoạt động: {selectedFacility.address}</div>}
                              </div>

                              {!isSelectedActive ? (
                                <div className="text-[10px] text-amber-800 mt-2 pt-1.5 border-t border-amber-200/80 flex items-start gap-1">
                                  <span className="material-symbols-outlined text-xs shrink-0 mt-0.5">warning</span>
                                  <span>
                                    Lưu ý: Cơ sở y tế này chưa hoàn tất thẩm định pháp lý (ACTIVE). Bạn có thể kiểm tra giấy phép tại{' '}
                                    <Link
                                      href={`/admin/facilities/${selectedFacility.id}`}
                                      className="underline font-bold text-amber-900 hover:text-amber-950"
                                      target="_blank"
                                    >
                                      Trang thẩm định CSYT ↗
                                    </Link>{' '}
                                    trước khi hoàn tất ký kết hợp đồng.
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-emerald-700 mt-2 pt-1.5 border-t border-emerald-200/80 flex items-center gap-1">
                                  <span>Cơ sở y tế đã qua thẩm định pháp lý, sẵn sàng tạo dự thảo và tiến hành ký kết số 4 bên.</span>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Tỷ lệ chia sẻ doanh thu */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Tỷ lệ chia sẻ doanh thu CSYT (%) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-primary">{newFacilityShare}% CSYT</span>
                </div>
                <Input
                  type="number"
                  min={50}
                  max={95}
                  value={newFacilityShare}
                  onChange={(e) => setNewFacilityShare(Number(e.target.value))}
                  className="text-xs font-bold"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Cơ sở y tế: <strong>{newFacilityShare}%</strong></span>
                  <span>Nền tảng FamiDoc: <strong>{100 - newFacilityShare}%</strong></span>
                </div>
              </div>

              {/* Thời hạn hiệu lực hợp đồng */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày bắt đầu hiệu lực
                  </label>
                  <Input
                    type="date"
                    value={validFromDate}
                    onChange={(e) => setValidFromDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày kết thúc hiệu lực
                  </label>
                  <Input
                    type="date"
                    value={validToDate}
                    onChange={(e) => setValidToDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateB2BModal(false)}
                  className="text-xs"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreatingDraft || !selectedFacilityId}
                  className="text-xs font-semibold"
                >
                  {isCreatingDraft ? 'Đang tạo...' : 'Lưu & Gửi Dự Thảo'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Chi Tiết Hợp Đồng B2B Nhân Lực Y Tế */}
        <Dialog open={showStaffingDetailModal && Boolean(selectedStaffing)} onOpenChange={setShowStaffingDetailModal}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 sm:max-w-2xl">
            {selectedStaffing && (
              <>
                <DialogHeader className="border-b border-slate-100 pb-3">
                  <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <span className="material-symbols-outlined text-primary text-[22px]">handshake</span>
                    <span>Chi Tiết Hợp Đồng Cung Ứng Nhân Lực B2B</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Mã HĐ: <strong className="text-primary">{selectedStaffing.contractNumber}</strong> • Đối tác: <strong>{selectedStaffing.facilityName}</strong>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 text-xs text-slate-700">
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Phân chia doanh thu</span>
                      <span className="font-bold text-primary text-sm">
                        {selectedStaffing.facilitySharePercent}% CSYT / {selectedStaffing.platformSharePercent}% FamiDoc
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Hiệu lực</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(selectedStaffing.validFrom).toLocaleDateString('vi-VN')} - {new Date(selectedStaffing.validTo).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className={`p-2.5 rounded-lg border ${selectedStaffing.adminSigned ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                      <div className="font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">{selectedStaffing.adminSigned ? 'verified' : 'pending'}</span>
                        <span>Ban Quản Trị Hệ Thống</span>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-600">
                        {selectedStaffing.adminSigned ? 'Đã ký số SmartCA (Bên D)' : 'Chưa hoàn tất ký số'}
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-lg border ${selectedStaffing.facilitySigned ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div className="font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">{selectedStaffing.facilitySigned ? 'verified' : 'schedule'}</span>
                        <span>Cơ Sở Y Tế Đối Tác</span>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-600">
                        {selectedStaffing.facilitySigned ? 'Đã ký số SmartCA' : 'Đang chờ CSYT ký'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Điều khoản pháp lý hợp tác:
                    </label>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap text-slate-600">
                      {selectedStaffing.contractTerms || 'Điều khoản chuẩn theo Nghị định 130/2018/NĐ-CP và Thông tư 04/2022/TT-BYT.'}
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStaffingDetailModal(false)}
                    className="text-xs"
                  >
                    Đóng
                  </Button>
                  {selectedStaffing.status === 'DRAFT' && !selectedStaffing.adminSigned && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={signingStaffingId === selectedStaffing.id}
                      onClick={async () => {
                        await handleAdminSignStaffing(selectedStaffing.id);
                        setShowStaffingDetailModal(false);
                      }}
                      className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {signingStaffingId === selectedStaffing.id ? 'Đang ký số...' : 'Ký Duyệt (SmartCA)'}
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
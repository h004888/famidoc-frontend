'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CONTRACT_STATUS_LABELS,
  DocumensoSigningEmbed,
  type FourPartyContract,
} from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';
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

  // B2B Staffing Contract Draft Modal (Flow 2.1)
  const [showCreateB2BModal, setShowCreateB2BModal] = useState(false);
  const [newFacilityName, setNewFacilityName] = useState('');
  const [newFacilityShare, setNewFacilityShare] = useState(85);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  const handleCreateB2BDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingDraft(true);
    try {
      await contractsApi.createStaffingContract({
        platformCommissionRate: 100 - newFacilityShare,
        facilityRevenueRate: newFacilityShare,
      });
      toast.success('Đã khởi tạo dự thảo hợp đồng B2B thành công trên hệ thống!');
      setShowCreateB2BModal(false);
      triggerReload();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tạo hợp đồng B2B trên máy chủ.');
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const triggerReload = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadTick((t) => t + 1);
  };

  useEffect(() => {
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
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
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
                          className={`rounded-full text-[11px] font-semibold ${
                            c.status === 'ACTIVE'
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
        </Card>

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
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <span className="material-symbols-outlined text-primary text-[20px]">handshake</span>
                Thiết Lập Dự Thảo HĐ B2B Nhân Lực Y Tế
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Flow 2.1 - Admin thiết lập dự thảo hợp đồng cung ứng nhân lực y tế với Cơ sở y tế đối tác.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateB2BDraft} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cơ sở y tế đối tác
                </label>
                <Input
                  value={newFacilityName}
                  onChange={(e) => setNewFacilityName(e.target.value)}
                  placeholder="VD: Bệnh viện Đa khoa An Sinh"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tỷ lệ chia sẻ doanh thu CSYT (%)
                </label>
                <Input
                  type="number"
                  min={50}
                  max={95}
                  value={newFacilityShare}
                  onChange={(e) => setNewFacilityShare(Number(e.target.value))}
                  className="text-xs font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  CSYT: {newFacilityShare}% • Nền tảng FamiDoc: {100 - newFacilityShare}%
                </p>
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
                  disabled={isCreatingDraft}
                  className="text-xs font-semibold"
                >
                  {isCreatingDraft ? 'Đang tạo...' : 'Lưu & Gửi Dự Thảo'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
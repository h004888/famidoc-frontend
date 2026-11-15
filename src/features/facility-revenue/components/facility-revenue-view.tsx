'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared';
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
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RevenueCycle {
  id: string;
  monthYear: string;
  totalEncounters: number;
  grossAmount: number;
  facilityShareRate: number; // e.g. 70%
  facilityShareAmount: number;
  escrowStatus: 'paid' | 'pending_signature' | 'processing';
  reconcileDate: string;
}

const REVENUE_CYCLES: RevenueCycle[] = [
  {
    id: 'REV-2026-10-YDUOC',
    monthYear: 'Tháng 10/2026 (Trọn kỳ)',
    totalEncounters: 1420,
    grossAmount: 489714000,
    facilityShareRate: 85,
    facilityShareAmount: 416256900,
    escrowStatus: 'pending_signature',
    reconcileDate: '05/11/2026',
  },
  {
    id: 'REV-2026-09-YDUOC',
    monthYear: 'Tháng 09/2026 (Trọn kỳ)',
    totalEncounters: 1280,
    grossAmount: 441000000,
    facilityShareRate: 85,
    facilityShareAmount: 374850000,
    escrowStatus: 'paid',
    reconcileDate: '05/10/2026',
  },
  {
    id: 'REV-2026-08-YDUOC',
    monthYear: 'Tháng 08/2026 (Trọn kỳ)',
    totalEncounters: 1150,
    grossAmount: 395000000,
    facilityShareRate: 85,
    facilityShareAmount: 335750000,
    escrowStatus: 'paid',
    reconcileDate: '05/09/2026',
  },
];

export function FacilityRevenueView() {
  const [cycles, setCycles] = useState<RevenueCycle[]>(REVENUE_CYCLES);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signingCycle, setSigningCycle] = useState<RevenueCycle | null>(null);
  const [digitalCertificatePin, setDigitalCertificatePin] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleOpenSignModal = (cycle: RevenueCycle) => {
    setSigningCycle(cycle);
    setIsSignModalOpen(true);
    setIsSuccess(false);
    setDigitalCertificatePin('');
  };

  const handleExecuteSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingCycle || !digitalCertificatePin) return;

    setCycles((prev) =>
      prev.map((c) =>
        c.id === signingCycle.id ? { ...c, escrowStatus: 'paid' as const } : c
      )
    );
    setIsSuccess(true);
    toast.success(`Đã ký số B2B và giải ngân kỳ ${signingCycle.monthYear}.`);
    setTimeout(() => {
      setIsSignModalOpen(false);
      setIsSuccess(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          title="Đối soát Doanh thu B2B & Giải ngân Escrow"
          description="Phân bổ doanh thu theo tỷ lệ cam kết 85% Cơ sở y tế - 15% Nền tảng (CFG-03, BR-14) với đối soát tự động ngày 05 hàng tháng"
          actions={
            <Badge variant="outline" className="gap-2 px-3 py-1.5 rounded-full bg-accent border-primary/20 text-primary text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>Hợp đồng đối tác B2B-2026: 85% / 15% (CFG-03)</span>
            </Badge>
          }
        />

        {/* Revenue KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="bg-white py-5 rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="px-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Tổng doanh số dịch vụ</span>
              <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">489.714.000 đ</div>
              <div className="text-xs text-slate-500 mt-1 font-medium tabular-nums">1.420 ca khám ghi nhận</div>
            </CardContent>
          </Card>

          <Card className="py-5 rounded-2xl border-primary/20 shadow-xs bg-linear-to-br from-white to-blue-50/30">
            <CardContent className="px-5">
              <span className="text-xs font-bold text-primary uppercase">Doanh thu B2B thực nhận (85%)</span>
              <div className="text-2xl font-bold text-primary mt-2 tabular-nums">416.256.900 đ</div>
              <div className="text-xs text-primary/80 mt-1 font-semibold tabular-nums">Quyết toán ngày 05/11/2026</div>
            </CardContent>
          </Card>

          <Card className="bg-white py-5 rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="px-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Đã giải ngân từ Escrow</span>
              <div className="text-2xl font-bold text-emerald-600 mt-2 tabular-nums">280.000.000 đ</div>
              <div className="text-xs text-slate-500 mt-1 font-medium tabular-nums">Kỳ 1 ngày 15/10/2026</div>
            </CardContent>
          </Card>

          <Card className="bg-white py-5 rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="px-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Chờ đối soát ký số</span>
              <div className="text-2xl font-bold text-amber-600 mt-2 tabular-nums">62.800.000 đ</div>
              <div className="text-xs text-amber-700 mt-1 font-semibold tabular-nums">Cần ký biên bản trước 30/10</div>
            </CardContent>
          </Card>
        </div>

        {/* B2B Contract Details & Escrow Explanation */}
        <Card className="bg-white py-6 rounded-2xl border-slate-200 shadow-xs">
          <CardContent className="px-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Cơ chế Phân bổ &amp; Quỹ Ký quỹ Đảm bảo (Escrow)</h2>
                <p className="text-xs text-slate-500 mt-0.5">Bảo vệ quyền lợi tài chính minh bạch giữa Bệnh viện và Hộ gia đình</p>
              </div>
              <div className="text-xs tabular-nums font-medium bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700">
                Tài khoản nhận: BIDV - 119000288819 (BV ĐH Y DƯỢC TP.HCM)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-900 block mb-1">1. Thu tiền tạm giữ</span>
                Khi gia đình thanh toán gói qua VietQR, tiền được giữ trong Quỹ Escrow độc lập để đảm bảo SLA khám bệnh.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-900 block mb-1">2. Tự động đối soát</span>
                Mỗi ca khám hoàn tất và phiếu SOAP được ký mã hóa, hệ thống tự động ghi nhận tỷ lệ 85% vào doanh thu cơ sở.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-900 block mb-1">3. Giải ngân định kỳ</span>
                Giải ngân vào ngày 15 và 30 hàng tháng sau khi người đại diện tài chính bệnh viện ký số biên bản đối soát.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cycles Table */}
        <Card className="bg-white rounded-2xl border-slate-200 shadow-xs overflow-hidden py-0 gap-0">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Lịch sử Kỳ Đối soát Doanh thu B2B</h2>
            <Button
              type="button"
              variant="link"
              size="xs"
              onClick={() => toast.info('Đang kết xuất bảng tổng hợp đối soát Excel (.xlsx) B2B...')}
              className="text-xs font-semibold text-primary cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Xuất Excel (.xlsx)</span>
            </Button>
          </div>

          <Table className="text-xs sm:text-sm">
            <TableHeader>
              <TableRow className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider hover:bg-slate-50/80">
                <TableHead className="py-3.5 px-4 text-slate-600">Kỳ đối soát &amp; Mã</TableHead>
                <TableHead className="py-3.5 px-4 text-center text-slate-600">Ca khám</TableHead>
                <TableHead className="py-3.5 px-4 text-right text-slate-600">Tổng doanh số</TableHead>
                <TableHead className="py-3.5 px-4 text-right text-slate-600">Tỷ lệ cơ sở</TableHead>
                <TableHead className="py-3.5 px-4 text-right text-slate-600">Thực nhận (85%)</TableHead>
                <TableHead className="py-3.5 px-4 text-center text-slate-600">Trạng thái Escrow</TableHead>
                <TableHead className="py-3.5 px-4 text-right text-slate-600">Biên bản đối soát</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {cycles.map((c) => (
                <TableRow key={c.id} className="hover:bg-slate-50/70">
                  <TableCell className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{c.monthYear}</div>
                    <div className="tabular-nums text-[11px] text-slate-400">{c.id}</div>
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-center font-medium text-slate-700 tabular-nums">
                    {c.totalEncounters}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-right font-medium text-slate-600 tabular-nums">
                    {formatVND(c.grossAmount)}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-right font-semibold text-slate-700 tabular-nums">
                    {c.facilityShareRate}%
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-right font-bold text-primary tabular-nums">
                    {formatVND(c.facilityShareAmount)}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-center">
                    {c.escrowStatus === 'paid' && (
                      <Badge variant="outline" className="rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                        Đã giải ngân
                      </Badge>
                    )}
                    {c.escrowStatus === 'pending_signature' && (
                      <Badge variant="outline" className="rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border-amber-200">
                        Chờ ký số biên bản
                      </Badge>
                    )}
                    {c.escrowStatus === 'processing' && (
                      <Badge variant="outline" className="rounded-full text-[11px] font-semibold bg-blue-50 text-primary border-blue-200">
                        Đang xử lý ngân hàng
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-right">
                    {c.escrowStatus === 'pending_signature' ? (
                      <Button
                        type="button"
                        size="xs"
                        onClick={() => handleOpenSignModal(c)}
                        className="rounded-lg text-xs font-semibold ml-auto cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">draw</span>
                        <span>Ký số B2B</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="xs"
                        variant="secondary"
                        onClick={() => toast.info(`Đang tải biên bản đã ký số cho kỳ ${c.id}...`)}
                        className="rounded-lg text-xs font-semibold ml-auto cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span>
                        <span>Tải PDF</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Dialog: Ký số biên bản đối soát B2B */}
        <Dialog open={isSignModalOpen && Boolean(signingCycle)} onOpenChange={setIsSignModalOpen}>
          <DialogContent className="rounded-2xl border-slate-200 sm:max-w-md">
            {signingCycle && (
              <>
                <DialogHeader className="border-b border-slate-100 pb-3">
                  <DialogTitle className="flex items-center gap-2 font-bold text-slate-900 text-base">
                    <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
                    <span>Ký số Biên bản Đối soát B2B</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Xác thực PIN chữ ký số USB Token / SmartCA của cơ sở y tế
                  </DialogDescription>
                </DialogHeader>

                {isSuccess ? (
                  <div className="py-6 text-center space-y-2">
                    <span className="material-symbols-outlined text-[48px] text-emerald-500">check_circle</span>
                    <h4 className="font-bold text-slate-900 text-base">Ký số Thành công!</h4>
                    <p className="text-xs text-slate-500 tabular-nums">
                      Lệnh giải ngân số tiền {formatVND(signingCycle.facilityShareAmount)} đã được chuyển đến Quỹ Escrow BIDV.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleExecuteSign} className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600">
                      <div>
                        Kỳ đối soát: <span className="font-bold text-slate-800">{signingCycle.monthYear}</span>
                      </div>
                      <div>
                        Số tiền thực nhận (85%):{' '}
                        <span className="font-bold text-primary tabular-nums">
                          {formatVND(signingCycle.facilityShareAmount)}
                        </span>
                      </div>
                      <div>
                        Chứng thư số: <span className="tabular-nums text-slate-700">CA-BV-YDUOC-TOKEN-01</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="b2b-pin" className="text-xs font-semibold text-slate-700">
                        Nhập mã PIN Chữ ký số USB Token / SmartCA <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="b2b-pin"
                        type="password"
                        required
                        placeholder="Nhập mã PIN bảo mật..."
                        value={digitalCertificatePin}
                        onChange={(e) => setDigitalCertificatePin(e.target.value)}
                        className="rounded-xl text-xs sm:text-sm tabular-nums"
                      />
                      <p className="text-[11px] text-slate-400">
                        Chữ ký số hợp lệ theo Luật Giao dịch điện tử số 20/2023/QH15.
                      </p>
                    </div>

                    <DialogFooter className="border-t border-slate-100 pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsSignModalOpen(false)}
                        className="rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        Hủy bỏ
                      </Button>
                      <Button
                        type="submit"
                        className="rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        Xác nhận Ký số
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}


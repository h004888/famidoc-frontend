'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  financeApi,
  type FacilitySettlementDto,
  type FinanceAnalyticsDto,
} from '@/lib/api/finance.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const reviewLabels = {
  PENDING: 'Chờ cơ sở xác nhận',
  CONFIRMED: 'Cơ sở đã xác nhận',
  DISPUTED: 'Cơ sở báo sai lệch',
};
const disbursementLabels = {
  PENDING: 'Chưa chi trả',
  CONFIRMED: 'Đã duyệt chi',
  SETTLED: 'Đã chi trả',
  FAILED: 'Chi trả thất bại',
};
const disbursementStyles = {
  PENDING: 'border-slate-200 bg-slate-50 text-slate-700',
  CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-800',
  SETTLED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  FAILED: 'border-red-200 bg-red-50 text-red-800',
};
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const formatVND = (amount: number) => currency.format(amount);
const facilityName = (settlement: FacilitySettlementDto) =>
  settlement.facility?.facilityName || `Cơ sở #${settlement.facilityId.slice(0, 8)}`;

export function AdminSettlementsView() {
  const [analytics, setAnalytics] = useState<FinanceAnalyticsDto | null>(null);
  const [period, setPeriod] = useState('');
  const [environment, setEnvironment] = useState<'TEST' | 'LIVE'>('LIVE');
  const [refresh, setRefresh] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPreparing, setIsPreparing] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<FacilitySettlementDto | null>(null);
  const [transferOrderId, setTransferOrderId] = useState('');
  const [transferMemo, setTransferMemo] = useState('');
  const [amountPaidVnd, setAmountPaidVnd] = useState<number | ''>('');
  const [paidAt, setPaidAt] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceKey, setEvidenceKey] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const settlements = useMemo(() => analytics?.settlements ?? [], [analytics]);

  const loadData = () => {
    setIsLoading(true);
    setLoadError('');
    setRefresh((value) => value + 1);
  };

  useEffect(() => {
    let active = true;
    const [year, month] = period.split('-').map(Number);
    void financeApi.getAnalytics({ environment, ...(period ? { year, month } : {}) }).then((data) => {
      if (active) setAnalytics(data);
    }).catch((error: unknown) => {
      if (!active) return;
      setAnalytics(null);
      setLoadError(error instanceof Error ? error.message : 'Không tải được bảng quyết toán.');
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [environment, period, refresh]);

  const handlePrepareMonthlySettlement = async () => {
    if (!analytics) return;
    setIsPreparing(true);
    try {
      await financeApi.executeMonthlySettlement({
        action: 'PREPARE',
        year: analytics.year,
        month: analytics.month,
        environment: analytics.environment,
      });
      toast.success(`Đã lập bảng quyết toán tháng ${analytics.month}/${analytics.year}.`);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lập bảng quyết toán.');
    } finally {
      setIsPreparing(false);
    }
  };

  const handleOpenConfirmModal = (settlement: FacilitySettlementDto) => {
    setSelectedSettlement(settlement);
    setTransferOrderId('');
    setTransferMemo(`DOSOAT ${settlement.settlementCode.replace(/[^a-z0-9]+/gi, ' ').trim()}`);
    setAmountPaidVnd('');
    setPaidAt('');
    setEvidenceFile(null);
    setEvidenceKey('');
    setSubmitError('');
    setConfirmModalOpen(true);
  };

  const handleConfirmTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSettlement || isSubmitting || amountPaidVnd === '') return;
    if (amountPaidVnd !== selectedSettlement.facilityPayoutAmount) {
      setSubmitError('Số tiền đã chuyển cần khớp với phần chi trả trên bảng.');
      return;
    }
    if (!evidenceFile && !evidenceKey.trim()) {
      setSubmitError('Chọn tệp chứng từ hoặc dùng chứng từ đã tải lên.');
      return;
    }
    const transferTime = new Date(paidAt);
    if (!Number.isFinite(transferTime.getTime())) {
      setSubmitError('Nhập thời điểm chuyển tiền theo chứng từ.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      let proofKey = evidenceKey.trim();
      if (evidenceFile && !proofKey) {
        const result = await financeApi.uploadSettlementEvidence(
          selectedSettlement.id,
          selectedSettlement.environment,
          evidenceFile,
        );
        proofKey = result.evidenceKey;
        setEvidenceKey(proofKey);
      }
      await financeApi.executeMonthlySettlement({
        action: 'CONFIRM_TRANSFER',
        settlementId: selectedSettlement.id,
        reviewVersion: selectedSettlement.reviewVersion,
        bankTransferOrderId: transferOrderId.trim(),
        transferMemo: transferMemo.trim(),
        amountPaidVnd,
        paidAt: transferTime.toISOString(),
        evidenceKey: proofKey,
        environment: selectedSettlement.environment,
      });
      toast.success('Đã ghi nhận kết quả chuyển khoản.');
      setConfirmModalOpen(false);
      loadData();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không xác nhận được giao dịch chi trả.');
    } finally {
      setIsSubmitting(false);
    }
  };

  async function copyTransferValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã sao chép ${label}.`);
    } catch {
      toast.error('Không sao chép được. Hãy chọn và sao chép từ thông tin chi trả.');
    }
  }

  const bank = selectedSettlement?.bankDestination;
  const memo = transferMemo.trim();
  const payoutQr = selectedSettlement?.environment === 'LIVE' &&
      bank?.bankName && bank.accountNumber && /^[a-z0-9]{2,20}$/i.test(bank.bankName) &&
      /^[a-z0-9]{5,19}$/i.test(bank.accountNumber) && !/^0+$/.test(bank.accountNumber) &&
      /^[a-z0-9 ]{1,94}$/i.test(memo) && selectedSettlement.facilityPayoutAmount > 0
    ? `https://vietqr.app/img?${new URLSearchParams({
        acc: bank.accountNumber, bank: bank.bankName, amount: String(selectedSettlement.facilityPayoutAmount),
        des: memo, template: 'compact',
      })}`
    : null;

  const handleReopenReview = async (settlement: FacilitySettlementDto) => {
    if (reopeningId) return;
    setReopeningId(settlement.id);
    try {
      await financeApi.executeMonthlySettlement({
        action: 'REOPEN_REVIEW',
        settlementId: settlement.id,
        environment: settlement.environment,
        reviewVersion: settlement.reviewVersion,
      });
      toast.success('Đã gửi lại bảng cho CSYT kiểm tra.');
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không gửi lại được bảng đối soát.');
    } finally {
      setReopeningId(null);
    }
  };

  const handleOpenFailModal = (settlement: FacilitySettlementDto) => {
    setSelectedSettlement(settlement);
    setFailureReason('');
    setSubmitError('');
    setFailModalOpen(true);
  };

  const handleConfirmFailed = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSettlement) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await financeApi.executeMonthlySettlement({
        action: 'MARK_FAILED',
        settlementId: selectedSettlement.id,
        failureReason: failureReason.trim(),
        environment: selectedSettlement.environment,
      });
      toast.success('Đã ghi nhận chi trả thất bại.');
      setFailModalOpen(false);
      loadData();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không lưu được lý do thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = useMemo(() => settlements.reduce((sum, settlement) => ({
    gross: sum.gross + settlement.totalRealizedRevenue,
    fee: sum.fee + settlement.platformFeeAmount,
    payout: sum.payout + settlement.facilityPayoutAmount,
  }), { gross: 0, fee: 0, payout: 0 }), [settlements]);
  const details = settlements.find((settlement) => settlement.id === detailsId);
  const monthValue = period || (analytics ? `${analytics.year}-${String(analytics.month).padStart(2, '0')}` : '');

  return (
    <section aria-labelledby="facility-payouts" className="space-y-5">
      <header className="space-y-1">
        <h2 id="facility-payouts" className="text-xl font-semibold text-slate-900">Chi trả cơ sở y tế</h2>
        <p className="text-sm text-slate-600">Chọn kỳ, lập bảng và theo dõi các khoản chuyển cho cơ sở y tế.</p>
      </header>

      <Card className="gap-0 border-slate-200 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <Label className="grid gap-2">
              Tháng đối soát
              <Input type="month" value={monthValue} disabled={isPreparing} onChange={(event) => {
                setPeriod(event.target.value);
                loadData();
              }} />
            </Label>
            <Label className="grid gap-2">
              Loại dữ liệu
              <select className="h-9 rounded-md border border-input bg-background px-3 font-normal" value={environment} disabled={isPreparing} onChange={(event) => {
                setEnvironment(event.target.value as typeof environment);
                loadData();
              }}>
                <option value="LIVE">Giao dịch thật</option>
                <option value="TEST">Dữ liệu thử</option>
              </select>
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={loadData} disabled={isLoading || isPreparing}>Làm mới</Button>
            <Button type="button" onClick={handlePrepareMonthlySettlement} disabled={isPreparing || isLoading || !analytics}>
              {isPreparing ? 'Đang lập bảng…' : 'Lập bảng đối soát'}
            </Button>
          </div>
        </div>
      </Card>

      {loadError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</p>}
      {isLoading && <p role="status" className="text-sm text-slate-600">Đang tải bảng đối soát…</p>}

      {!isLoading && analytics && (
        <>
          <dl aria-label="Tổng số tiền trong bảng đối soát" className="grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {([
              ['Doanh thu trong bảng', totals.gross],
              ['Phí nền tảng', totals.fee],
              ['Phần chi trả cơ sở y tế', totals.payout],
            ] as const).map(([label, amount]) => (
              <div key={label} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-3 sm:block sm:space-y-1 sm:py-4">
                <dt className="text-sm text-slate-600">{label}</dt>
                <dd className="text-lg font-semibold text-slate-900 tabular-nums">{formatVND(amount)}</dd>
              </div>
            ))}
          </dl>

          {!!analytics.unreconciledInvoiceCount && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {analytics.unreconciledInvoiceCount} hóa đơn đang chờ đối chiếu với SePay.
            </p>
          )}

          <Card className="gap-0 overflow-hidden border-slate-200 py-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Các khoản chi tháng {analytics.month}/{analytics.year}</h3>
              <span className="text-sm text-slate-600">{settlements.length} khoản</span>
            </div>
            {settlements.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-600">Kỳ này chưa có bảng đối soát.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50">
                    <TableHead className="whitespace-normal">Cơ sở y tế</TableHead>
                    <TableHead className="text-right whitespace-normal">Phần chi trả</TableHead>
                    <TableHead className="hidden md:table-cell">Xác nhận của cơ sở</TableHead>
                    <TableHead className="hidden md:table-cell">Trạng thái chi trả</TableHead>
                    <TableHead className="text-right"><span className="sr-only">Thao tác</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.id} className="border-slate-200">
                      <TableCell className="min-w-28 whitespace-normal">
                        <p className="wrap-anywhere font-medium text-slate-900">{facilityName(settlement)}</p>
                        <p className="mt-1 wrap-anywhere text-xs text-slate-600">{settlement.settlementCode}</p>
                        <p className="mt-1 text-xs text-slate-600 md:hidden">
                          {settlement.disbursementStatus === 'PENDING' && settlement.reviewStatus && settlement.reviewStatus !== 'CONFIRMED'
                            ? reviewLabels[settlement.reviewStatus]
                            : disbursementLabels[settlement.disbursementStatus]}
                        </p>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold tabular-nums sm:text-sm">
                        {formatVND(settlement.facilityPayoutAmount)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {settlement.reviewStatus ? reviewLabels[settlement.reviewStatus] : '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={disbursementStyles[settlement.disbursementStatus]}>
                          {disbursementLabels[settlement.disbursementStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" size="sm" variant="outline" className="h-auto min-h-8 whitespace-normal" onClick={() => setDetailsId(settlement.id)}>
                          Xem chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}

      <Dialog open={Boolean(details)} onOpenChange={(open) => { if (!open) setDetailsId(null); }}>
        {details && (
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
            <DialogHeader className="pr-6 text-left">
              <DialogTitle>Chi tiết khoản chi</DialogTitle>
              <DialogDescription>{facilityName(details)} · Tháng {details.month}/{details.year} · {details.settlementCode}</DialogDescription>
            </DialogHeader>
            <dl className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div><dt className="text-slate-600">Doanh thu</dt><dd className="font-medium">{formatVND(details.totalRealizedRevenue)}</dd></div>
              <div><dt className="text-slate-600">Phí nền tảng</dt><dd className="font-medium">{formatVND(details.platformFeeAmount)}</dd></div>
              <div><dt className="text-slate-600">Phần chi trả</dt><dd className="font-semibold">{formatVND(details.facilityPayoutAmount)}</dd></div>
              <div><dt className="text-slate-600">Trạng thái chi trả</dt><dd className="font-medium">{disbursementLabels[details.disbursementStatus]}</dd></div>
            </dl>
            <div className="space-y-2 text-sm">
              {details.reviewStatus && <p>{reviewLabels[details.reviewStatus]}</p>}
              {details.reviewDisputeReason && <p className="wrap-anywhere rounded-lg bg-amber-50 p-3 text-amber-950">Cơ sở báo sai lệch: {details.reviewDisputeReason}</p>}
              {details.failureReason && <p className="wrap-anywhere rounded-lg bg-red-50 p-3 text-red-800">Lý do chi trả thất bại: {details.failureReason}</p>}
              {details.bankDestination?.accountNumber && (
                <p className="wrap-anywhere text-slate-600">Tài khoản nhận: {details.bankDestination.accountHolder} · {details.bankDestination.bankName} · {details.bankDestination.accountNumber}</p>
              )}
              {details.bankTransferOrderId && <p className="wrap-anywhere">Mã giao dịch: {details.bankTransferOrderId}</p>}
              {details.settledAt && <p>Ngày chuyển: {new Date(details.settledAt).toLocaleDateString('vi-VN')}</p>}
              {details.transferMemo && <p className="wrap-anywhere">Nội dung: {details.transferMemo}</p>}
            </div>
            {details.disbursementStatus !== 'SETTLED' && (
              <DialogFooter className="flex-wrap border-t border-slate-200 pt-4">
                {details.disbursementStatus !== 'FAILED' && (
                  <Button type="button" variant="outline" onClick={() => {
                    setDetailsId(null);
                    handleOpenFailModal(details);
                  }}>Báo lỗi chi trả</Button>
                )}
                {details.reviewStatus === 'DISPUTED' && (
                  <Button type="button" disabled={Boolean(reopeningId) || isLoading} onClick={() => void handleReopenReview(details)}>
                    {reopeningId === details.id ? 'Đang gửi…' : 'Gửi lại để xác nhận'}
                  </Button>
                )}
                {details.reviewStatus === 'CONFIRMED' && (
                  <Button type="button" onClick={() => {
                    setDetailsId(null);
                    handleOpenConfirmModal(details);
                  }}>Chuẩn bị chuyển khoản</Button>
                )}
              </DialogFooter>
            )}
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={confirmModalOpen && Boolean(selectedSettlement)} onOpenChange={(open) => {
        if (!isSubmitting) setConfirmModalOpen(open);
      }}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl p-0 sm:max-w-xl">
          {selectedSettlement && (
            <form onSubmit={handleConfirmTransfer}>
              <DialogHeader className="border-b border-slate-200 p-5 pr-12 text-left">
                <DialogTitle>Chuyển khoản cho cơ sở y tế</DialogTitle>
                <DialogDescription>
                  {selectedSettlement.environment === 'TEST'
                    ? 'Kỳ TEST dùng số liệu mẫu để diễn tập. Không chuyển tiền theo thông tin mẫu.'
                    : 'Chuyển tiền trên ứng dụng ngân hàng rồi quay lại lưu chứng từ.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 p-5 text-sm">
                <section aria-labelledby="settlement-transfer-details" className="space-y-3">
                  <h3 id="settlement-transfer-details" className="font-semibold text-slate-900">Thông tin để chuyển tiền</h3>
                  <div className="p-3.5 bg-[#f6f7f9] rounded-xl border border-[#e4e8ed] space-y-1.5">
                    <div className="flex flex-wrap justify-between gap-x-3">
                      <span className="text-slate-600">Cơ sở nhận tiền</span>
                      <strong className="wrap-anywhere text-slate-900">{facilityName(selectedSettlement)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4a4f63]">Tài khoản nhận</span>
                      <strong className="text-[#0037c1] tabular-nums">
                        {selectedSettlement.bankDestination?.bankName} - {selectedSettlement.bankDestination?.accountNumber}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4a4f63]">Chủ tài khoản</span>
                      <span className="text-[#20283d] font-semibold">{selectedSettlement.bankDestination?.accountHolder}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#e4e8ed] pt-1.5 mt-1.5">
                      <span className="text-[#4a4f63]">Số tiền cần chuyển</span>
                      <strong className="text-base text-[#0037c1] tabular-nums">
                        {formatVND(selectedSettlement.facilityPayoutAmount)}
                      </strong>
                    </div>
                    {selectedSettlement.environment === 'LIVE' && (
                      <details className="pt-2">
                        <summary className="cursor-pointer text-sm font-medium text-primary">Sao chép thông tin chuyển khoản</summary>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {selectedSettlement.bankDestination?.accountNumber && (
                            <Button type="button" size="sm" variant="outline" onClick={() => void copyTransferValue(selectedSettlement.bankDestination.accountNumber, 'số tài khoản')}>Sao chép số tài khoản</Button>
                          )}
                          <Button type="button" size="sm" variant="outline" onClick={() => void copyTransferValue(String(selectedSettlement.facilityPayoutAmount), 'số tiền')}>Sao chép số tiền</Button>
                          <Button type="button" size="sm" variant="outline" disabled={!memo}
                            onClick={() => void copyTransferValue(memo, 'nội dung chuyển khoản')}>Sao chép nội dung</Button>
                        </div>
                      </details>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="settlement-transfer-memo">Nội dung chuyển khoản</Label>
                    <Input id="settlement-transfer-memo" required maxLength={140}
                      value={transferMemo} onChange={(event) => setTransferMemo(event.target.value)} />
                  </div>
                  {payoutQr && <Button asChild>
                    <a href={payoutQr} target="_blank" rel="noreferrer">Mở mã QR chuyển khoản</a>
                  </Button>}
                </section>

                <section aria-labelledby="settlement-transfer-proof" className="space-y-4 border-t border-slate-200 pt-4">
                  <h3 id="settlement-transfer-proof" className="font-semibold text-slate-900">Lưu chứng từ sau khi chuyển</h3>

                  <div className="space-y-1">
                    <Label htmlFor="bankTransferOrderId" className="text-xs font-semibold text-[#20283d]">
                      Mã giao dịch trên chứng từ <span className="text-[#f04438]">*</span>
                    </Label>
                    <Input
                      id="bankTransferOrderId"
                      required
                      value={transferOrderId}
                      onChange={(e) => setTransferOrderId(e.target.value)}
                      placeholder="Ví dụ: FT261110001234"
                      className="rounded-lg text-xs sm:text-sm tabular-nums border-[#e4e8ed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="amountPaidVnd" className="text-xs font-semibold text-[#20283d]">
                      Số tiền đã chuyển (VNĐ) <span className="text-[#f04438]">*</span>
                    </Label>
                    <Input
                      id="amountPaidVnd"
                      type="number"
                      required
                      value={amountPaidVnd}
                      min={1}
                      max={999999999999}
                      onChange={(e) => setAmountPaidVnd(e.target.value ? Number(e.target.value) : '')}
                      className="rounded-lg text-xs sm:text-sm tabular-nums border-[#e4e8ed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="paidAt">Thời điểm chuyển khoản (giờ trên thiết bị)</Label>
                    <Input id="paidAt" type="datetime-local" step={1} required value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
                  </div>
                  {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
                  <div className="space-y-1">
                    <Label htmlFor="settlement-evidence-file" className="text-xs font-semibold text-[#20283d]">
                      Tệp chứng từ chuyển khoản
                    </Label>
                    <Input
                      id="settlement-evidence-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={isSubmitting}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setEvidenceKey('');
                        setSubmitError('');
                        if (file && (file.size === 0 || file.size > 5 * 1024 * 1024)) {
                          event.target.value = '';
                          setEvidenceFile(null);
                          setSubmitError('Chọn tệp chứng từ có dung lượng từ 1 byte đến 5 MB.');
                          return;
                        }
                        setEvidenceFile(file);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">PDF, PNG hoặc JPEG, tối đa 5 MB.</p>
                    {evidenceFile && evidenceKey && <p className="text-xs text-emerald-800">Chứng từ đã được tải lên.</p>}
                    {!evidenceFile && (
                      <details className="pt-1 text-xs">
                        <summary className="cursor-pointer">Dùng chứng từ đã tải lên</summary>
                        <Label htmlFor="evidenceKey" className="mt-2">Đường dẫn chứng từ</Label>
                        <Input
                          id="evidenceKey"
                          value={evidenceKey}
                          disabled={isSubmitting}
                          onChange={(event) => setEvidenceKey(event.target.value)}
                          placeholder="<user-id>/settlements/chung-tu.pdf"
                        />
                      </details>
                    )}
                  </div>
                </section>
              </div>

              <DialogFooter className="bg-[#f6f7f9] p-4 border-t border-[#e4e8ed] flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setConfirmModalOpen(false)}
                  className="rounded-lg text-xs font-semibold border-[#e4e8ed]"
                >
                  Đóng
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg text-xs font-semibold bg-[#0037c1] hover:bg-[#1250dc] text-white cursor-pointer"
                >
                  {isSubmitting ? 'Đang lưu…' : 'Lưu xác nhận đã chuyển'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={failModalOpen && Boolean(selectedSettlement)} onOpenChange={(open) => {
        if (!isSubmitting) setFailModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-md rounded-xl border-[#e4e8ed] p-0 overflow-hidden text-[#20283d]">
          {selectedSettlement && (
            <form onSubmit={handleConfirmFailed}>
              <DialogHeader className="border-b border-slate-200 p-5 pr-12 text-left">
                <DialogTitle>Báo lỗi chi trả</DialogTitle>
                <DialogDescription>{facilityName(selectedSettlement)} · {selectedSettlement.settlementCode}</DialogDescription>
              </DialogHeader>

              <div className="p-6 space-y-3 text-xs sm:text-sm">
                <div className="space-y-1">
                  <Label htmlFor="failureReason" className="text-xs font-semibold text-[#20283d]">
                    Lý do chi trả thất bại <span className="text-[#f04438]">*</span>
                  </Label>
                  <Textarea
                    id="failureReason"
                    required
                    rows={4}
                    minLength={10}
                    maxLength={1000}
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    placeholder="Nhập lý do để cơ sở y tế kiểm tra"
                    className="rounded-lg text-xs sm:text-sm border-[#e4e8ed]"
                  />
                </div>
                {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
              </div>

              <DialogFooter className="bg-[#f6f7f9] p-4 border-t border-[#e4e8ed] flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setFailModalOpen(false)}
                  className="rounded-lg text-xs font-semibold border-[#e4e8ed]"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="destructive"
                >
                  {isSubmitting ? 'Đang lưu…' : 'Lưu lý do thất bại'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

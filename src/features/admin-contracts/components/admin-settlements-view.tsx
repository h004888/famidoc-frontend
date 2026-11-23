'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  BanknoteArrowUp,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  Percent,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  financeApi,
  type FacilitySettlementDto,
  type FinanceAnalyticsDto,
} from '@/lib/api/finance.api';
import { extractErrorMessage } from '@/lib/api/error-handler';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VietQrPreviewCard } from '@/components/shared';
import {
  MonthlyPayoutPolicyBanner,
  SettlementPaymentSummary,
} from '@/components/shared/settlement-payment-summary';
import { useVietQrBanks } from '@/hooks/use-vietqr-banks';
import {
  buildVietQrQuickLinkUrl,
  resolveBankByInput,
  resolveVietQrBankId,
} from '@/lib/vietqr';
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
const reviewStyles = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  DISPUTED: 'border-red-200 bg-red-50 text-red-800',
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
const ALLOWED_EVIDENCE_MIME = new Set(['application/pdf', 'image/png', 'image/jpeg']);
const ALLOWED_EVIDENCE_EXT = /\.(pdf|png|jpe?g)$/i;

function isAllowedEvidenceFile(file: File): boolean {
  if (!ALLOWED_EVIDENCE_EXT.test(file.name)) return false;
  if (file.type && !ALLOWED_EVIDENCE_MIME.has(file.type.toLowerCase())) return false;
  return true;
}

function isClosedVietnamMonth(year: number, month: number): boolean {
  const vnNow = new Date(Date.now() + 7 * 3600000);
  return year * 12 + month < vnNow.getUTCFullYear() * 12 + vnNow.getUTCMonth() + 1;
}

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
  const [debouncedTransferMemo, setDebouncedTransferMemo] = useState('');
  const [amountPaidVnd, setAmountPaidVnd] = useState<number | ''>('');
  const [paidAt, setPaidAt] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceKey, setEvidenceKey] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const { banks } = useVietQrBanks();
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
      setLoadError(extractErrorMessage(error, 'Không tải được bảng quyết toán.'));
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [environment, period, refresh]);

  const handlePrepareMonthlySettlement = async () => {
    if (!analytics) return;
    if (!isClosedVietnamMonth(analytics.year, analytics.month)) {
      toast.error('Chỉ có thể lập bảng đối soát cho các tháng đã kết thúc.');
      return;
    }
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
      toast.error(extractErrorMessage(error, 'Không thể lập bảng quyết toán.'));
    } finally {
      setIsPreparing(false);
    }
  };

  const handleOpenConfirmModal = (settlement: FacilitySettlementDto) => {
    const defaultMemo = `DOSOAT ${settlement.settlementCode.replace(/[^a-z0-9]+/gi, ' ').trim()}`;
    setSelectedSettlement(settlement);
    setTransferOrderId('');
    setTransferMemo(defaultMemo);
    setDebouncedTransferMemo(defaultMemo);
    setAmountPaidVnd('');
    setPaidAt('');
    setEvidenceFile(null);
    setEvidenceKey('');
    setSubmitError('');
    setConfirmModalOpen(true);
  };

  const handleConfirmTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSettlement || isSubmitting) return;

    const trimmedMemo = transferMemo.trim();
    if (!trimmedMemo) {
      setSubmitError('Vui lòng nhập nội dung chuyển khoản.');
      return;
    }
    if (trimmedMemo.length > 140) {
      setSubmitError('Nội dung chuyển khoản không được vượt quá 140 ký tự.');
      return;
    }

    const trimmedOrderId = transferOrderId.trim();
    if (trimmedOrderId.length < 3 || trimmedOrderId.length > 100) {
      setSubmitError('Mã giao dịch trên chứng từ phải từ 3 đến 100 ký tự.');
      return;
    }

    if (amountPaidVnd === '') {
      setSubmitError('Vui lòng nhập số tiền đã chuyển (VNĐ).');
      return;
    }
    if (!Number.isInteger(amountPaidVnd) || amountPaidVnd < 1 || amountPaidVnd > 999999999999) {
      setSubmitError('Số tiền đã chuyển phải là số nguyên dương hợp lệ (VNĐ).');
      return;
    }
    if (amountPaidVnd !== selectedSettlement.facilityPayoutAmount) {
      setSubmitError('Số tiền đã chuyển cần khớp với phần chi trả trên bảng.');
      return;
    }

    const transferTime = new Date(paidAt);
    if (!paidAt.trim() || !Number.isFinite(transferTime.getTime())) {
      setSubmitError('Nhập thời điểm chuyển tiền theo chứng từ.');
      return;
    }
    if (transferTime.getTime() > Date.now()) {
      setSubmitError('Thời điểm chuyển khoản không được ở tương lai.');
      return;
    }
    const statementCreatedAt = Date.parse(selectedSettlement.createdAt);
    if (Number.isFinite(statementCreatedAt) && transferTime.getTime() < statementCreatedAt) {
      setSubmitError('Thời điểm chuyển khoản không được sớm hơn thời điểm lập bảng quyết toán.');
      return;
    }

    const trimmedEvidenceKey = evidenceKey.trim();
    if (!evidenceFile && !trimmedEvidenceKey) {
      setSubmitError('Chọn tệp chứng từ hoặc dùng chứng từ đã tải lên.');
      return;
    }
    if (evidenceFile) {
      if (!isAllowedEvidenceFile(evidenceFile)) {
        setSubmitError('Chỉ chấp nhận tệp chứng từ định dạng PDF, PNG hoặc JPEG.');
        return;
      }
      if (evidenceFile.size === 0 || evidenceFile.size > 5 * 1024 * 1024) {
        setSubmitError('Chọn tệp chứng từ có dung lượng từ 1 byte đến 5 MB.');
        return;
      }
    } else if (
      trimmedEvidenceKey.length < 5 ||
      trimmedEvidenceKey.length > 300 ||
      trimmedEvidenceKey.includes('..') ||
      trimmedEvidenceKey.includes('://')
    ) {
      setSubmitError('Đường dẫn chứng từ phải từ 5 đến 300 ký tự và không chứa ký tự không hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      let proofKey = trimmedEvidenceKey;
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
        bankTransferOrderId: trimmedOrderId,
        transferMemo: trimmedMemo,
        amountPaidVnd,
        paidAt: transferTime.toISOString(),
        evidenceKey: proofKey,
        environment: selectedSettlement.environment,
      });
      toast.success('Đã ghi nhận kết quả chuyển khoản.');
      setConfirmModalOpen(false);
      loadData();
    } catch (error) {
      setSubmitError(extractErrorMessage(error, 'Không xác nhận được giao dịch chi trả.'));
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

  useEffect(() => {
    if (!confirmModalOpen) return;
    const timer = setTimeout(() => {
      setDebouncedTransferMemo(memo);
    }, 400);
    return () => clearTimeout(timer);
  }, [confirmModalOpen, memo]);

  const resolvedBank = useMemo(
    () =>
      bank
        ? resolveBankByInput(banks, {
            bankBin: bank.bankBin,
            bankCode: bank.bankCode,
            bankName: bank.bankName,
          })
        : undefined,
    [banks, bank],
  );

  const payoutQr = useMemo(() => {
    if (
      selectedSettlement?.environment !== 'LIVE' ||
      !bank ||
      !debouncedTransferMemo ||
      selectedSettlement.facilityPayoutAmount <= 0
    ) {
      return null;
    }
    const bankId = resolveVietQrBankId(banks, {
      bankBin: bank.bankBin || resolvedBank?.bin,
      bankCode: bank.bankCode || resolvedBank?.code,
      bankName: bank.bankName,
    });
    return buildVietQrQuickLinkUrl({
      bankId,
      accountNumber: bank.accountNumber,
      amount: selectedSettlement.facilityPayoutAmount,
      addInfo: debouncedTransferMemo,
      accountName: bank.accountHolder,
      template: 'compact2',
    });
  }, [banks, bank, resolvedBank, selectedSettlement, debouncedTransferMemo]);

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
      toast.error(extractErrorMessage(error, 'Không gửi lại được bảng đối soát.'));
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
    if (!selectedSettlement || isSubmitting) return;
    const trimmedReason = failureReason.trim();
    if (trimmedReason.length < 10 || trimmedReason.length > 1000) {
      setSubmitError('Lý do chi trả thất bại phải từ 10 đến 1000 ký tự.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await financeApi.executeMonthlySettlement({
        action: 'MARK_FAILED',
        settlementId: selectedSettlement.id,
        failureReason: trimmedReason,
        environment: selectedSettlement.environment,
      });
      toast.success('Đã ghi nhận chi trả thất bại.');
      setFailModalOpen(false);
      loadData();
    } catch (error) {
      setSubmitError(extractErrorMessage(error, 'Không lưu được lý do thất bại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = useMemo(() => settlements.reduce((sum, settlement) => ({
    gross: sum.gross + settlement.totalRealizedRevenue,
    fee: sum.fee + settlement.platformFeeAmount,
    payout: sum.payout + settlement.facilityPayoutAmount,
    settledCount: sum.settledCount + (settlement.disbursementStatus === 'SETTLED' ? 1 : 0),
    readyToPayCount: sum.readyToPayCount + (settlement.disbursementStatus !== 'SETTLED' && settlement.reviewStatus === 'CONFIRMED' ? 1 : 0),
    waitingReviewCount: sum.waitingReviewCount + (settlement.disbursementStatus !== 'SETTLED' && settlement.reviewStatus === 'PENDING' ? 1 : 0),
    disputedCount: sum.disputedCount + (settlement.disbursementStatus !== 'SETTLED' && settlement.reviewStatus === 'DISPUTED' ? 1 : 0),
  }), {
    gross: 0,
    fee: 0,
    payout: 0,
    settledCount: 0,
    readyToPayCount: 0,
    waitingReviewCount: 0,
    disputedCount: 0,
  }), [settlements]);
  const details = settlements.find((settlement) => settlement.id === detailsId);
  const monthValue = period || (analytics ? `${analytics.year}-${String(analytics.month).padStart(2, '0')}` : '');

  return (
    <section aria-labelledby="facility-payouts" className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="facility-payouts" className="text-xl font-bold text-slate-900">Chi trả cơ sở y tế</h2>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
              <CalendarClock aria-hidden="true" className="mr-1 size-3.5" />
              Chu kỳ hàng tháng
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            Nền tảng tổng hợp doanh thu phân bổ và chi trả 85% hàng tháng cho từng cơ sở y tế theo ngày phục vụ, kể cả gói mua theo quý hoặc năm.
          </p>
        </div>
      </header>

      <Card className="gap-0 border-slate-200 p-4 shadow-2xs sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
            <Label className="grid min-w-0 flex-1 gap-2 text-xs font-semibold text-slate-700 sm:flex-none">
              Tháng đối soát
              <Input type="month" min="2000-01" max="2200-12" className="w-full sm:w-auto" value={monthValue} disabled={isPreparing} onChange={(event) => {
                setPeriod(event.target.value);
                loadData();
              }} />
            </Label>
            <Label className="grid min-w-0 flex-1 gap-2 text-xs font-semibold text-slate-700 sm:flex-none">
              Loại dữ liệu
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal sm:w-auto" value={environment} disabled={isPreparing} onChange={(event) => {
                setEnvironment(event.target.value as typeof environment);
                loadData();
              }}>
                <option value="LIVE">Giao dịch thật</option>
                <option value="TEST">Dữ liệu thử</option>
              </select>
            </Label>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button type="button" variant="outline" onClick={loadData} disabled={isLoading || isPreparing}>
              <RefreshCw aria-hidden="true" className="mr-1.5 size-4" />
              Làm mới
            </Button>
            <Button type="button" onClick={handlePrepareMonthlySettlement} disabled={isPreparing || isLoading || !analytics}>
              <FileSpreadsheet aria-hidden="true" className="mr-1.5 size-4" />
              {isPreparing ? 'Đang lập bảng…' : 'Lập bảng đối soát'}
            </Button>
          </div>
        </div>
      </Card>

      {loadError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</p>}
      {isLoading && <p role="status" className="text-sm text-slate-600">Đang tải bảng đối soát…</p>}

      {!isLoading && analytics && (
        <>
          {/* Thẻ KPI tổng quan dòng tiền kỳ tháng */}
          <dl aria-label="Tổng số tiền trong bảng đối soát" className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-sm font-medium text-slate-600">Doanh thu trong bảng</dt>
                <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <TrendingUp aria-hidden="true" className="size-4" />
                </span>
              </div>
              <dd className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{formatVND(totals.gross)}</dd>
              <p className="mt-1 text-xs text-slate-500">
                100% doanh thu phân bổ tháng {analytics.month}/{analytics.year}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-sm font-medium text-slate-600">Phí nền tảng</dt>
                <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Percent aria-hidden="true" className="size-4" />
                </span>
              </div>
              <dd className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{formatVND(totals.fee)}</dd>
              <p className="mt-1 text-xs text-slate-500">
                15% phí vận hành FamiDoc · Đã gồm thuế phần phí nếu có
              </p>
            </div>

            <div className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-blue-50/70 via-white to-white p-4 shadow-2xs sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-sm font-semibold text-blue-950">Phần chi trả cơ sở y tế</dt>
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BanknoteArrowUp aria-hidden="true" className="size-4" />
                </span>
              </div>
              <dd className="mt-2 text-2xl font-bold text-primary tabular-nums">{formatVND(totals.payout)}</dd>
              <p className="mt-1 text-xs font-medium text-blue-900/80">
                85% nền tảng trả trực tiếp cho CSYT · Chưa khấu trừ thuế
              </p>
            </div>
          </dl>

          {/* Thanh chính sách chi trả hàng tháng & miễn trừ trách nhiệm thuế */}
          <MonthlyPayoutPolicyBanner role="admin" />

          {!!analytics.unreconciledInvoiceCount && (
            <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <AlertCircle aria-hidden="true" className="size-4 shrink-0 text-amber-700" />
              <span>{analytics.unreconciledInvoiceCount} hóa đơn đang chờ đối chiếu với SePay.</span>
            </p>
          )}

          <Card className="gap-0 overflow-hidden border-slate-200 py-0 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3.5 sm:px-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Các khoản chi tháng {analytics.month}/{analytics.year}
                </h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  Danh sách các cơ sở y tế được nền tảng chi trả định kỳ trong kỳ quyết toán.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-700 ring-1 ring-slate-200">
                  Tổng: {settlements.length} khoản
                </span>
                {totals.readyToPayCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-800 ring-1 ring-blue-200">
                    <Clock3 aria-hidden="true" className="size-3" />
                    Sẵn sàng chuyển: {totals.readyToPayCount}
                  </span>
                )}
                {totals.waitingReviewCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800 ring-1 ring-amber-200">
                    Chờ CSYT duyệt: {totals.waitingReviewCount}
                  </span>
                )}
                {totals.disputedCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-800 ring-1 ring-red-200">
                    Báo sai lệch: {totals.disputedCount}
                  </span>
                )}
                {totals.settledCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 ring-1 ring-emerald-200">
                    <CheckCircle2 aria-hidden="true" className="size-3" />
                    Hoàn tất chuyển khoản: {totals.settledCount}
                  </span>
                )}
              </div>
            </div>
            {settlements.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-600">
                Kỳ này chưa có bảng đối soát. Bấm &ldquo;Lập bảng đối soát&rdquo; để tổng hợp doanh thu và phần chi trả hàng tháng cho các CSYT.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50/90">
                    <TableHead className="whitespace-normal">Cơ sở y tế</TableHead>
                    <TableHead className="hidden text-right whitespace-normal lg:table-cell">Doanh thu tháng (100%)</TableHead>
                    <TableHead className="hidden text-right whitespace-normal xl:table-cell">Phí nền tảng (15%)</TableHead>
                    <TableHead className="text-right whitespace-normal">Số tiền chi trả CSYT (85%)</TableHead>
                    <TableHead className="hidden md:table-cell">Xác nhận của cơ sở</TableHead>
                    <TableHead className="hidden md:table-cell">Trạng thái chi trả</TableHead>
                    <TableHead className="text-right"><span className="sr-only">Thao tác</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.id} className="border-slate-200 hover:bg-slate-50/70">
                      <TableCell className="min-w-28 whitespace-normal">
                        <p className="wrap-anywhere font-semibold text-slate-900">{facilityName(settlement)}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                          <span className="wrap-anywhere tabular-nums">{settlement.settlementCode}</span>
                          <span aria-hidden="true">·</span>
                          <span>Tháng {settlement.month}/{settlement.year}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 md:hidden">
                          {settlement.disbursementStatus === 'PENDING' && settlement.reviewStatus && settlement.reviewStatus !== 'CONFIRMED'
                            ? reviewLabels[settlement.reviewStatus]
                            : disbursementLabels[settlement.disbursementStatus]}
                        </p>
                      </TableCell>
                      <TableCell className="hidden text-right text-sm text-slate-700 tabular-nums lg:table-cell">
                        {formatVND(settlement.totalRealizedRevenue)}
                      </TableCell>
                      <TableCell className="hidden text-right text-sm text-slate-600 tabular-nums xl:table-cell">
                        {formatVND(settlement.platformFeeAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="text-xs font-bold text-primary tabular-nums sm:text-sm">
                          {formatVND(settlement.facilityPayoutAmount)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">Chưa khấu trừ thuế</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {settlement.reviewStatus ? (
                          <Badge variant="outline" className={reviewStyles[settlement.reviewStatus]}>
                            {reviewLabels[settlement.reviewStatus]}
                          </Badge>
                        ) : '—'}
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
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
            <DialogHeader className="pr-6 text-left">
              <DialogTitle>Chi tiết khoản chi</DialogTitle>
              <DialogDescription>{facilityName(details)} · Tháng {details.month}/{details.year} · {details.settlementCode}</DialogDescription>
            </DialogHeader>
            <SettlementPaymentSummary item={details} />
            <div className="space-y-3 text-sm">
              <div className="grid gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Trạng thái chi trả</p>
                  <p className="mt-1 font-medium text-slate-900">
                    Trạng thái chi trả · {disbursementLabels[details.disbursementStatus]}
                  </p>
                </div>
                {details.reviewStatus && (
                  <div>
                    <p className="text-xs text-slate-500">Đối soát phía CSYT</p>
                    <p className="mt-1 font-medium text-slate-900">{reviewLabels[details.reviewStatus]}</p>
                  </div>
                )}
              </div>

              {details.reviewDisputeReason && (
                <p className="wrap-anywhere rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
                  <strong>Cơ sở báo sai lệch:</strong> {details.reviewDisputeReason}
                </p>
              )}
              {details.failureReason && (
                <p className="wrap-anywhere rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
                  <strong>Lý do chi trả thất bại:</strong> {details.failureReason}
                </p>
              )}

              {details.bankDestination?.accountNumber && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <Building2 aria-hidden="true" className="size-3.5 text-primary" />
                    Tài khoản ngân hàng nhận tiền của CSYT
                  </p>
                  <p className="wrap-anywhere text-sm font-medium text-slate-900">
                    Tài khoản nhận: {details.bankDestination.accountHolder} · {details.bankDestination.bankName} · {details.bankDestination.accountNumber}
                  </p>
                </div>
              )}

              {(details.bankTransferOrderId || details.settledAt || details.transferMemo) && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-1 text-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Chứng từ chuyển khoản</p>
                  {details.bankTransferOrderId && <p className="wrap-anywhere">Mã giao dịch: <strong className="tabular-nums">{details.bankTransferOrderId}</strong></p>}
                  {details.settledAt && <p>Ngày chuyển: <strong>{new Date(details.settledAt).toLocaleDateString('vi-VN')}</strong></p>}
                  {details.transferMemo && <p className="wrap-anywhere">Nội dung: {details.transferMemo}</p>}
                </div>
              )}
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
            <form noValidate onSubmit={handleConfirmTransfer}>
              <DialogHeader className="border-b border-slate-200 p-5 pr-12 text-left">
                <DialogTitle>Chuyển khoản cho cơ sở y tế</DialogTitle>
                <DialogDescription>
                  {selectedSettlement.environment === 'TEST'
                    ? 'Kỳ TEST dùng số liệu mẫu để diễn tập. Không chuyển tiền theo thông tin mẫu.'
                    : 'Chuyển tiền trên ứng dụng ngân hàng rồi quay lại lưu chứng từ.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 p-5 text-sm">
                <SettlementPaymentSummary item={selectedSettlement} />
                <section aria-labelledby="settlement-transfer-details" className="space-y-3">
                  <h3 id="settlement-transfer-details" className="font-semibold text-slate-900">Thông tin để chuyển tiền</h3>
                  <div className="p-3.5 bg-[#f6f7f9] rounded-xl border border-[#e4e8ed] space-y-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="text-slate-600">Cơ sở nhận tiền</span>
                      <strong className="wrap-anywhere text-right text-slate-900">{facilityName(selectedSettlement)}</strong>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="text-[#4a4f63]">Tài khoản nhận</span>
                      <strong className="wrap-anywhere text-right text-[#0037c1] tabular-nums">
                        {selectedSettlement.bankDestination?.bankName} - {selectedSettlement.bankDestination?.accountNumber}
                      </strong>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="text-[#4a4f63]">Chủ tài khoản</span>
                      <span className="wrap-anywhere text-right text-[#20283d] font-semibold">{selectedSettlement.bankDestination?.accountHolder}</span>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-t border-[#e4e8ed] pt-1.5 mt-1.5">
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
                  {selectedSettlement.environment === 'LIVE' && (
                    <VietQrPreviewCard
                      qrUrl={payoutQr}
                      title="Mã VietQR chuyển khoản quyết toán"
                      subtitle="Quét mã bằng ứng dụng ngân hàng để tự động điền đúng số tài khoản, số tiền và nội dung đối soát."
                      emptyMessage="Cần mã BIN/ngân hàng hợp lệ, số tài khoản (<= 19 ký tự), số tiền dương và nội dung chuyển khoản để tạo mã VietQR."
                      bankLabel={
                        resolvedBank
                          ? `${resolvedBank.shortName} (${resolvedBank.name})`
                          : selectedSettlement.bankDestination?.bankName
                      }
                      bankBin={
                        selectedSettlement.bankDestination?.bankBin ||
                        resolvedBank?.bin ||
                        null
                      }
                      bankCode={
                        selectedSettlement.bankDestination?.bankCode ||
                        resolvedBank?.code ||
                        null
                      }
                      accountNumber={selectedSettlement.bankDestination?.accountNumber}
                      accountHolder={selectedSettlement.bankDestination?.accountHolder}
                      openLinkLabel="Mở mã QR chuyển khoản"
                    />
                  )}
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
                      minLength={3}
                      maxLength={100}
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
                      step={1}
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
                        if (file && !isAllowedEvidenceFile(file)) {
                          event.target.value = '';
                          setEvidenceFile(null);
                          setSubmitError('Chỉ chấp nhận tệp chứng từ định dạng PDF, PNG hoặc JPEG.');
                          return;
                        }
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
                          minLength={5}
                          maxLength={300}
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

              <DialogFooter className="bg-[#f6f7f9] p-4 border-t border-[#e4e8ed] flex flex-wrap items-center justify-end gap-2">
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
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md rounded-xl border-[#e4e8ed] p-0 text-[#20283d]">
          {selectedSettlement && (
            <form noValidate onSubmit={handleConfirmFailed}>
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
                  <p className="text-[11px] text-slate-500">
                    {failureReason.trim().length}/1000 ký tự (tối thiểu 10 ký tự)
                  </p>
                </div>
                {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
              </div>

              <DialogFooter className="bg-[#f6f7f9] p-4 border-t border-[#e4e8ed] flex flex-wrap items-center justify-end gap-2">
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

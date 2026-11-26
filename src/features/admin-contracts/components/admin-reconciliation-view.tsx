'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  ChevronRight,
  FileText,
  Landmark,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  financeApi,
  type SePayReconciliationRunDto,
  type SePayReconciliationResultDto,
  type SePayReconciliationStatusDto,
} from '@/lib/api/finance.api';
import {
  paymentsApi,
  type PaymentTransactionItem,
  type PaymentTransactionsPage,
} from '@/lib/api/payments.api';
import { extractErrorMessage } from '@/lib/api/error-handler';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paymentResultLabels } from './admin-webhook-events-view';
import { ReconciliationBatchResult } from './reconciliation-batch-result';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'Asia/Ho_Chi_Minh',
});

const outcomes: Record<PaymentTransactionItem['outcome'], string> = {
  MATCHED: 'Đã khớp',
  REVIEW_REQUIRED: 'Cần kiểm tra',
  IGNORED: 'Bỏ qua',
};

const outcomeStyles: Record<PaymentTransactionItem['outcome'], string> = {
  MATCHED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  REVIEW_REQUIRED: 'border-amber-200 bg-amber-50 text-amber-800',
  IGNORED: 'border-slate-200 bg-slate-100 text-slate-700',
};

const pageSize = 20;

const sourceLabels = {
  WEBHOOK: 'Thông báo SePay',
  SEPAY_API: 'Đồng bộ từ SePay',
};

const runLabels: Record<string, string> = {
  RUNNING: 'Đang đồng bộ',
  SUCCEEDED: 'Hoàn tất',
  SUCCESS: 'Hoàn tất',
  PARTIAL: 'Hoàn tất một phần',
  FAILED: 'Thất bại',
};

const runStyles: Record<string, string> = {
  RUNNING: 'border-blue-200 bg-blue-50 text-blue-800',
  SUCCEEDED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  SUCCESS: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  PARTIAL: 'border-amber-200 bg-amber-50 text-amber-800',
  FAILED: 'border-red-200 bg-red-50 text-red-700',
};

type BankTab = 'ledger' | 'sync';

function errorMessage(error: unknown, fallback: string) {
  return extractErrorMessage(error, fallback);
}

function getSourceLabel(transaction: PaymentTransactionItem) {
  const source =
    transaction.ingestionSource ??
    (transaction.sepayWebhookTransactionId ? 'WEBHOOK' : undefined);
  return source ? sourceLabels[source] : 'Chưa rõ nguồn';
}

export function AdminReconciliationView() {
  const [activeTab, setActiveTab] = useState<BankTab>('ledger');
  const [ledger, setLedger] = useState<PaymentTransactionsPage | null>(null);
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState<PaymentTransactionItem['outcome'] | ''>('');
  const [transferType, setTransferType] = useState<'in' | 'out' | ''>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [ledgerError, setLedgerError] = useState('');
  const [environment, setEnvironment] = useState<'LIVE' | 'TEST'>('LIVE');
  const [reconciliation, setReconciliation] = useState<{
    status: SePayReconciliationStatusDto;
    runs: SePayReconciliationRunDto[];
  } | null>(null);
  const [reconciliationError, setReconciliationError] = useState('');
  const [running, setRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<SePayReconciliationResultDto | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<PaymentTransactionItem | null>(null);

  function reload() {
    setLedger(null);
    setLedgerError('');
    setReconciliation(null);
    setReconciliationError('');
    setRefresh((value) => value + 1);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    void paymentsApi
      .listTransactions({
        page,
        limit: pageSize,
        outcome: outcome || undefined,
        transferType: transferType || undefined,
        search: debouncedSearch || undefined,
      })
      .then((data) => {
        if (active) setLedger(data);
      })
      .catch((error: unknown) => {
        if (active) setLedgerError(errorMessage(error, 'Không tải được giao dịch SePay.'));
      });
    return () => {
      active = false;
    };
  }, [page, outcome, transferType, debouncedSearch, refresh]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      financeApi.getSePayReconciliationStatus(environment),
      financeApi.listSePayReconciliations({ environment, limit: 10 }),
    ])
      .then(([status, runs]) => {
        if (active) setReconciliation({ status, runs });
      })
      .catch((error: unknown) => {
        if (active) {
          setReconciliationError(errorMessage(error, 'Không tải được lịch sử đối soát.'));
        }
      });
    return () => {
      active = false;
    };
  }, [environment, refresh]);

  const runReconciliation = async () => {
    setRunning(true);
    try {
      const run = await financeApi.runSePayReconciliation({ environment });
      setBatchResult(run);
      if (run.status === 'FAILED') {
        toast.error('Không đồng bộ được giao dịch từ SePay.');
      } else {
        toast.info(
          `${runLabels[run.status] ?? run.status}. Đã bổ sung ${run.backfilledCount} giao dịch.`,
        );
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Không chạy được đối soát SePay.'));
    } finally {
      reload();
      setRunning(false);
    }
  };

  const recheck = async (paymentRequestId: string) => {
    setChecking(paymentRequestId);
    try {
      const result = await paymentsApi.recheckPaymentActivation(paymentRequestId);
      if (result.activated) {
        toast.success('Đã xác nhận kích hoạt hợp đồng.');
      } else {
        toast.info(
          result.blockingReasons?.join(', ') || 'Thanh toán chưa đủ điều kiện kích hoạt.',
        );
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Không kiểm tra lại được kích hoạt.'));
    } finally {
      setChecking(null);
    }
  };

  const query = search.trim().toLowerCase();
  const transactions = (ledger?.items ?? []).filter((transaction) =>
    [
      transaction.providerTransactionId,
      transaction.sepayWebhookTransactionId,
      transaction.paymentCode,
      transaction.referenceCode,
      transaction.paymentRequestId,
      transaction.contractNumber,
      transaction.payerName,
      transaction.transferContent,
    ].some((value) => value?.toLowerCase().includes(query)),
  );
  const pageCount = ledger ? Math.max(1, Math.ceil(ledger.total / ledger.limit)) : 1;

  const totalInVnd =
    ledger?.summary?.totalInVnd ??
    transactions
      .filter((t) => (t.transferType ?? 'in') === 'in')
      .reduce((sum, t) => sum + t.amountVnd, 0);
  const totalOutVnd =
    ledger?.summary?.totalOutVnd ??
    transactions
      .filter((t) => t.transferType === 'out')
      .reduce((sum, t) => sum + t.amountVnd, 0);
  const reviewRequiredCount =
    ledger?.summary?.reviewRequiredCount ??
    transactions.filter((t) => t.outcome === 'REVIEW_REQUIRED').length;

  const unreconciledCount = reconciliation?.status.unreconciledTransactions ?? 0;

  const renderActivationButton = (transaction: PaymentTransactionItem) => {
    if (transaction.outcome !== 'MATCHED' || !transaction.paymentRequestId) return null;
    const requestId = transaction.paymentRequestId;
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={checking !== null}
        onClick={(event) => {
          event.stopPropagation();
          void recheck(requestId);
        }}
      >
        {checking === requestId ? 'Đang kiểm tra…' : 'Kiểm tra kích hoạt hợp đồng'}
      </Button>
    );
  };

  return (
    <section className="space-y-4">
      {batchResult && <ReconciliationBatchResult result={batchResult} onReload={reload} />}
      {/* Header gọn */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-2xs sm:px-5">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            Giao dịch ngân hàng
          </h2>
          <p className="text-xs text-slate-600 sm:text-sm">
            Theo dõi giao dịch tiền vào/ra qua SePay và đối chiếu tự động với hợp đồng.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={reload}>
          <RefreshCw aria-hidden="true" className="mr-1.5 size-3.5" />
          Làm mới
        </Button>
      </header>

      {/* Lớp 1 (Ngoài cùng): 3 thẻ KPI tổng quan tĩnh */}
      <section
        aria-label="Tổng quan giao dịch ngân hàng"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600">
            <span>Tổng tiền vào</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ArrowDownLeft aria-hidden="true" className="size-4" />
            </span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-emerald-700 tabular-nums">
            {vnd.format(totalInVnd)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Giao dịch thu từ hộ gia đình</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600">
            <span>Tổng tiền ra</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-slate-800 tabular-nums">
            {vnd.format(totalOutVnd)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Giao dịch chi từ tài khoản</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600">
            <span>Giao dịch cần kiểm tra</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle aria-hidden="true" className="size-4" />
            </span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-amber-700 tabular-nums">
            {reviewRequiredCount.toLocaleString('vi-VN')}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Chưa tự khớp hoặc cần đối chiếu lại</p>
        </div>
      </section>

      {/* Lớp 2 (Trung gian): 1 khung làm việc duy nhất chia 2 Tab ngang */}
      <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200 py-0 shadow-2xs">
        <div
          role="tablist"
          aria-label="Phân mục giao dịch ngân hàng"
          className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/80 px-2 pt-2 sm:px-4"
        >
          <button
            type="button"
            role="tab"
            id="tab-bank-ledger"
            aria-selected={activeTab === 'ledger'}
            aria-controls="panel-bank-ledger"
            onClick={() => setActiveTab('ledger')}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
              activeTab === 'ledger'
                ? 'rounded-t-lg border-primary bg-white text-primary'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Sổ giao dịch</span>
            {ledger && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
                {ledger.total}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            id="tab-bank-sync"
            aria-selected={activeTab === 'sync'}
            aria-controls="panel-bank-sync"
            onClick={() => setActiveTab('sync')}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
              activeTab === 'sync'
                ? 'rounded-t-lg border-primary bg-white text-primary'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Đồng bộ giao dịch từ SePay</span>
            {unreconciledCount > 0 && (
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 px-1.5 py-0 text-[10px] font-semibold text-amber-800 tabular-nums"
              >
                {unreconciledCount} chưa đối chiếu
              </Badge>
            )}
          </button>
        </div>

        {/* TAB 1: Sổ giao dịch gọn 5 cột chia cột, căn lề trái */}
        {activeTab === 'ledger' && (
          <div role="tabpanel" id="panel-bank-ledger" aria-labelledby="tab-bank-ledger">
            <div className="flex flex-wrap items-end gap-2.5 border-b border-slate-200 bg-slate-50/50 px-4 py-3 sm:px-5">
              <label className="min-w-0 flex-1 basis-56 space-y-1 text-xs font-semibold text-slate-700">
                <span className="block">Tìm kiếm toàn sổ</span>
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    placeholder="Mã giao dịch, mã thanh toán, hợp đồng hoặc nội dung CK"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-9 bg-white pl-9 text-sm font-normal"
                  />
                </div>
              </label>

              <label className="min-w-0 flex-1 space-y-1 text-xs font-semibold text-slate-700 sm:flex-none">
                <span className="block">Chiều tiền</span>
                <select
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm font-normal text-slate-900 sm:w-auto"
                  value={transferType}
                  onChange={(event) => {
                    setLedger(null);
                    setLedgerError('');
                    setPage(1);
                    setTransferType(event.target.value as typeof transferType);
                  }}
                >
                  <option value="">Tất cả</option>
                  <option value="in">Tiền vào</option>
                  <option value="out">Tiền ra</option>
                </select>
              </label>

              <label className="min-w-0 flex-1 space-y-1 text-xs font-semibold text-slate-700 sm:flex-none">
                <span className="block">Kết quả xử lý</span>
                <select
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm font-normal text-slate-900 sm:w-auto"
                  value={outcome}
                  onChange={(event) => {
                    setLedger(null);
                    setLedgerError('');
                    setPage(1);
                    setOutcome(event.target.value as typeof outcome);
                  }}
                >
                  <option value="">Tất cả</option>
                  <option value="MATCHED">Đã khớp</option>
                  <option value="REVIEW_REQUIRED">Cần kiểm tra</option>
                  <option value="IGNORED">Bỏ qua</option>
                </select>
              </label>
            </div>

            {ledgerError && (
              <p role="alert" className="px-5 py-4 text-sm text-destructive">
                {ledgerError}
              </p>
            )}
            {!ledger && !ledgerError && (
              <p role="status" className="px-5 py-6 text-sm text-slate-600">
                Đang tải giao dịch…
              </p>
            )}

            {ledger && (
              <>
                {transactions.length === 0 ? (
                  <p className="px-5 py-10 text-left text-sm text-slate-600">
                    Không có giao dịch phù hợp.
                  </p>
                ) : (
                  <>
                    {/* Desktop: 5 cột cốt lõi, chia cột, căn lề trái */}
                    <div data-testid="desktop-view" className="hidden md:block">
                      <Table className="border-collapse">
                        <TableHeader>
                          <TableRow className="border-b border-slate-200 bg-slate-50/90 hover:bg-slate-50/90">
                            <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                              Giao dịch
                            </TableHead>
                            <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                              Hợp đồng
                            </TableHead>
                            <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                              Số tiền
                            </TableHead>
                            <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                              Kết quả đối chiếu
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                              Chi tiết
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200">
                          {transactions.map((transaction) => {
                            const isOut = transaction.transferType === 'out';
                            const txCode =
                              transaction.sepayWebhookTransactionId ||
                              transaction.providerTransactionId;
                            return (
                              <TableRow
                                key={transaction.id}
                                className="cursor-pointer transition-colors hover:bg-primary/5"
                                onClick={() => setSelectedTx(transaction)}
                              >
                                <TableCell className="border-r border-slate-200 px-4 py-3 text-left align-top whitespace-normal">
                                  <p className="font-semibold text-slate-900 tabular-nums">
                                    {txCode}
                                  </p>
                                  {transaction.paymentCode && (
                                    <p className="mt-0.5 text-xs font-medium text-slate-700 tabular-nums">
                                      Mã TT: {transaction.paymentCode}
                                    </p>
                                  )}
                                  <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                                    {dateTime.format(new Date(transaction.receivedAt))}
                                  </p>
                                </TableCell>

                                <TableCell className="border-r border-slate-200 px-4 py-3 text-left align-top whitespace-normal">
                                  <p className="text-sm font-medium text-slate-900">
                                    {transaction.contractNumber ||
                                      transaction.payerName ||
                                      'Chưa gắn hợp đồng'}
                                  </p>
                                  {transaction.contractNumber && transaction.payerName && (
                                    <p className="mt-0.5 text-xs text-slate-600">
                                      {transaction.payerName}
                                      {transaction.payerPhoneLast4
                                        ? ` (****${transaction.payerPhoneLast4})`
                                        : ''}
                                    </p>
                                  )}
                                </TableCell>

                                <TableCell className="border-r border-slate-200 px-4 py-3 text-left align-top">
                                  <p
                                    className={`text-sm font-bold tabular-nums ${
                                      isOut ? 'text-slate-700' : 'text-emerald-700'
                                    }`}
                                  >
                                    {isOut ? '−' : '+'}
                                    {vnd.format(transaction.amountVnd)}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={`mt-1 text-[11px] ${
                                      isOut
                                        ? 'border-slate-300 bg-slate-100 text-slate-700'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    }`}
                                  >
                                    {isOut ? 'Tiền ra' : 'Tiền vào'}
                                  </Badge>
                                </TableCell>

                                <TableCell className="border-r border-slate-200 px-4 py-3 text-left align-top whitespace-normal">
                                  <Badge
                                    variant="outline"
                                    className={outcomeStyles[transaction.outcome]}
                                  >
                                    {outcomes[transaction.outcome]}
                                  </Badge>
                                  {transaction.reason && (
                                    <p className="mt-1 max-w-xs text-xs text-slate-600">
                                      {paymentResultLabels[transaction.reason] ??
                                        transaction.reason}
                                    </p>
                                  )}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-left align-middle">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedTx(transaction);
                                    }}
                                  >
                                    Xem chi tiết
                                    <ChevronRight aria-hidden="true" className="ml-1 size-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile: Thẻ giao dịch gọn */}
                    <div
                      data-testid="mobile-view"
                      className="divide-y divide-slate-200 md:hidden"
                    >
                      {transactions.map((transaction) => {
                        const isOut = transaction.transferType === 'out';
                        const txCode =
                          transaction.sepayWebhookTransactionId ||
                          transaction.providerTransactionId;
                        return (
                          <div key={transaction.id} className="space-y-2.5 p-4 text-sm">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-slate-900 tabular-nums">
                                  {txCode}
                                </p>
                                <p className="text-xs text-slate-500 tabular-nums">
                                  {dateTime.format(new Date(transaction.receivedAt))}
                                </p>
                              </div>
                              <p
                                className={`font-bold tabular-nums ${
                                  isOut ? 'text-slate-700' : 'text-emerald-700'
                                }`}
                              >
                                {isOut ? '−' : '+'}
                                {vnd.format(transaction.amountVnd)}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={
                                  isOut
                                    ? 'border-slate-300 bg-slate-100 text-slate-700'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                }
                              >
                                {isOut ? 'Tiền ra' : 'Tiền vào'}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={outcomeStyles[transaction.outcome]}
                              >
                                {outcomes[transaction.outcome]}
                              </Badge>
                            </div>

                            {(transaction.paymentCode || transaction.contractNumber) && (
                              <p className="text-xs text-slate-600 tabular-nums">
                                {[
                                  transaction.paymentCode
                                    ? `Mã TT: ${transaction.paymentCode}`
                                    : null,
                                  transaction.contractNumber
                                    ? `HĐ: ${transaction.contractNumber}`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                                onClick={() => setSelectedTx(transaction)}
                              >
                                Xem chi tiết
                                <ChevronRight aria-hidden="true" className="ml-1 size-4" />
                              </Button>
                              {renderActivationButton(transaction)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/40 px-4 py-3 text-xs text-slate-600 sm:px-5 sm:text-sm">
                  <span className="tabular-nums">
                    {ledger.total} giao dịch · Trang {ledger.page}/{pageCount}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => {
                        setLedger(null);
                        setPage(page - 1);
                      }}
                    >
                      Trang trước
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={page >= pageCount}
                      onClick={() => {
                        setLedger(null);
                        setPage(page + 1);
                      }}
                    >
                      Trang sau
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: Đồng bộ giao dịch từ SePay */}
        {activeTab === 'sync' && (
          <div role="tabpanel" id="panel-bank-sync" aria-labelledby="tab-bank-sync">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 bg-slate-50/50 px-4 py-3.5 sm:px-5">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Đồng bộ giao dịch từ SePay
                </h3>
                <p className="text-xs text-slate-600">
                  Lấy bổ sung các giao dịch SePay chưa gửi về hệ thống và kiểm tra trạng thái đối chiếu.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="space-y-1 text-xs font-semibold text-slate-700">
                  <span className="block">Loại dữ liệu đồng bộ</span>
                  <select
                    className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-normal text-slate-900"
                    disabled={running}
                    value={environment}
                    onChange={(event) => {
                      setReconciliation(null);
                      setReconciliationError('');
                      setEnvironment(event.target.value as typeof environment);
                    }}
                  >
                    <option value="LIVE">Giao dịch thật</option>
                    <option value="TEST">Dữ liệu thử</option>
                  </select>
                </label>
                <Button
                  type="button"
                  size="sm"
                  className="h-9"
                  disabled={running || !reconciliation?.status.enabled}
                  onClick={() => void runReconciliation()}
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={`mr-1.5 size-3.5 ${running ? 'animate-spin' : ''}`}
                  />
                  {running ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
                </Button>
              </div>
            </div>

            {reconciliationError && (
              <p role="alert" className="px-5 py-4 text-sm text-destructive">
                {reconciliationError}
              </p>
            )}
            {!reconciliation && !reconciliationError && (
              <p role="status" className="px-5 py-6 text-sm text-slate-600">
                Đang tải trạng thái đối soát…
              </p>
            )}

            {reconciliation && (
              <>
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3 text-xs sm:px-5 sm:text-sm">
                  <Badge
                    variant="outline"
                    className={
                      reconciliation.status.enabled
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-100 text-slate-700'
                    }
                  >
                    {reconciliation.status.enabled ? 'Có thể đồng bộ' : 'Chưa bật đồng bộ'}
                  </Badge>
                  <span className="text-slate-700 tabular-nums">
                    {reconciliation.status.unreconciledTransactions} giao dịch chưa đối chiếu
                  </span>
                </div>

                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="border-b border-slate-200 bg-slate-50/90 hover:bg-slate-50/90">
                      <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                        Thời điểm bắt đầu
                      </TableHead>
                      <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                        Trạng thái
                      </TableHead>
                      <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                        Đã tải
                      </TableHead>
                      <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                        Bổ sung
                      </TableHead>
                      <TableHead className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                        Đã khớp
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-200">
                    {reconciliation.runs.map((run) => (
                      <TableRow key={run.id} className="hover:bg-slate-50/70">
                        <TableCell className="border-r border-slate-200 px-4 py-3 text-left text-sm text-slate-800 tabular-nums">
                          {dateTime.format(new Date(run.startedAt))}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-4 py-3 text-left">
                          <Badge
                            variant="outline"
                            className={
                              runStyles[run.status] ??
                              'border-slate-200 bg-slate-50 text-slate-700'
                            }
                          >
                            {runLabels[run.status] ?? run.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-4 py-3 text-left text-sm tabular-nums">
                          {run.fetchedCount}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-4 py-3 text-left text-sm tabular-nums">
                          {run.backfilledCount}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-left text-sm font-semibold text-emerald-700 tabular-nums">
                          {run.matchedCount}
                        </TableCell>
                      </TableRow>
                    ))}
                    {reconciliation.runs.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="px-4 py-8 text-left text-sm text-slate-600"
                        >
                          Chưa có lượt đối soát nào.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Lớp 3 (Chi tiết sâu nhất): Hộp thoại Chi tiết giao dịch ngân hàng */}
      <Dialog
        open={selectedTx !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTx(null);
        }}
      >
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
          {selectedTx && (
            <>
              <DialogHeader className="border-b border-slate-200 px-6 py-4 text-left">
                <div className="flex flex-wrap items-center gap-2 pr-6">
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Chi tiết giao dịch ngân hàng
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className={
                      selectedTx.transferType === 'out'
                        ? 'border-slate-300 bg-slate-100 text-slate-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }
                  >
                    {selectedTx.transferType === 'out' ? 'Tiền ra' : 'Tiền vào'}
                  </Badge>
                  <Badge variant="outline" className={outcomeStyles[selectedTx.outcome]}>
                    {outcomes[selectedTx.outcome]}
                  </Badge>
                </div>
                <DialogDescription className="text-sm text-slate-600 tabular-nums">
                  Mã giao dịch:{' '}
                  {selectedTx.sepayWebhookTransactionId || selectedTx.providerTransactionId} · Nhận
                  lúc {dateTime.format(new Date(selectedTx.receivedAt))}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {/* Số tiền nổi bật */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Số tiền giao dịch</p>
                    <p
                      className={`mt-0.5 text-2xl font-bold tabular-nums ${
                        selectedTx.transferType === 'out'
                          ? 'text-slate-800'
                          : 'text-emerald-700'
                      }`}
                    >
                      {selectedTx.transferType === 'out' ? '−' : '+'}
                      {vnd.format(selectedTx.amountVnd)}
                    </p>
                  </div>
                  {renderActivationButton(selectedTx)}
                </div>

                {/* 2 cột chi tiết: Thông tin ngân hàng & Đối chiếu hợp đồng */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-7">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <Landmark aria-hidden="true" className="size-3.5 text-primary" />
                      <span>Thông tin chuyển khoản</span>
                    </div>
                    <dl className="mt-3 divide-y divide-slate-100 text-sm">
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">
                          Mã giao dịch
                        </dt>
                        <dd className="truncate text-right font-semibold text-slate-900 tabular-nums">
                          {selectedTx.sepayWebhookTransactionId ||
                            selectedTx.providerTransactionId}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">
                          Mã tham chiếu
                        </dt>
                        <dd className="truncate text-right font-medium text-slate-800 tabular-nums">
                          {selectedTx.referenceCode || '—'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">
                          Mã thanh toán
                        </dt>
                        <dd className="truncate text-right font-medium text-slate-800 tabular-nums">
                          {selectedTx.paymentCode || '—'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">
                          Ngân hàng
                        </dt>
                        <dd className="truncate text-right font-medium text-slate-800">
                          {selectedTx.gateway || '—'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">
                          Số tài khoản
                        </dt>
                        <dd className="whitespace-nowrap text-right font-medium text-slate-800 tabular-nums">
                          {selectedTx.accountNumber || '—'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">
                          Nguồn tiếp nhận
                        </dt>
                        <dd className="whitespace-nowrap text-right font-medium text-slate-800">
                          {getSourceLabel(selectedTx)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">
                          Môi trường
                        </dt>
                        <dd className="whitespace-nowrap text-right font-medium text-slate-800">
                          {selectedTx.environment === 'TEST'
                            ? 'Dữ liệu thử'
                            : 'Giao dịch thật'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <Building2 aria-hidden="true" className="size-3.5 text-primary" />
                      <span>Đối chiếu hợp đồng</span>
                    </div>
                    <dl className="mt-3 divide-y divide-slate-100 text-sm">
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">
                          Mã hợp đồng
                        </dt>
                        <dd className="truncate text-right font-semibold text-slate-900 tabular-nums">
                          {selectedTx.contractNumber || '—'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">
                          Chủ hộ
                        </dt>
                        <dd className="truncate text-right font-medium text-slate-800">
                          {selectedTx.payerName
                            ? `${selectedTx.payerName}${
                                selectedTx.payerPhoneLast4
                                  ? ` (****${selectedTx.payerPhoneLast4})`
                                  : ''
                              }`
                            : '—'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0">
                        <dt className="shrink-0 whitespace-nowrap text-slate-500">
                          Trạng thái
                        </dt>
                        <dd className="text-right">
                          <Badge
                            variant="outline"
                            className={outcomeStyles[selectedTx.outcome]}
                          >
                            {outcomes[selectedTx.outcome]}
                          </Badge>
                        </dd>
                      </div>
                    </dl>
                    {selectedTx.reason && (
                      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900">
                        {paymentResultLabels[selectedTx.reason] ?? selectedTx.reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Nội dung CK gốc */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <FileText aria-hidden="true" className="size-3.5 text-primary" />
                    <span>Nội dung chuyển khoản gốc</span>
                  </div>
                  <p className="mt-2 wrap-anywhere text-sm text-slate-800">
                    {selectedTx.transferContent || 'Không có nội dung chuyển khoản.'}
                  </p>
                </div>
              </div>

              <DialogFooter className="border-t border-slate-200 bg-white px-6 py-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedTx(null)}
                >
                  Đóng
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

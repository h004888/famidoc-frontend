'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { financeApi, type SePayReconciliationRunDto, type SePayReconciliationStatusDto } from '@/lib/api/finance.api';
import { paymentsApi, type PaymentTransactionItem, type PaymentTransactionsPage } from '@/lib/api/payments.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { paymentResultLabels } from './admin-webhook-events-view';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'Asia/Ho_Chi_Minh',
});
const outcomes = {
  MATCHED: 'Đã khớp',
  REVIEW_REQUIRED: 'Cần kiểm tra',
  IGNORED: 'Bỏ qua',
};
const pageSize = 20;
const sourceLabels = { WEBHOOK: 'Thông báo SePay', SEPAY_API: 'Đồng bộ từ SePay' };
const runLabels: Record<string, string> = {
  RUNNING: 'Đang đồng bộ', SUCCEEDED: 'Hoàn tất', SUCCESS: 'Hoàn tất',
  PARTIAL: 'Hoàn tất một phần', FAILED: 'Thất bại',
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function TransactionSource({ transaction }: { transaction: PaymentTransactionItem }) {
  const source = transaction.ingestionSource ??
    (transaction.sepayWebhookTransactionId ? 'WEBHOOK' : undefined);

  return (
    <>
      <p title={source === 'SEPAY_API' && transaction.sepayWebhookTransactionId ? 'Đã liên kết với thông báo SePay' : undefined}>
        {source ? sourceLabels[source] : 'Chưa rõ nguồn'}
      </p>
      <p className="text-xs text-slate-600">{transaction.environment === 'TEST' ? 'Dữ liệu thử' : 'Giao dịch thật'}</p>
    </>
  );
}

export function AdminReconciliationView() {
  const [ledger, setLedger] = useState<PaymentTransactionsPage | null>(null);
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState<PaymentTransactionItem['outcome'] | ''>('');
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [ledgerError, setLedgerError] = useState('');
  const [environment, setEnvironment] = useState<'LIVE' | 'TEST'>('LIVE');
  const [reconciliation, setReconciliation] = useState<{
    status: SePayReconciliationStatusDto;
    runs: SePayReconciliationRunDto[];
  } | null>(null);
  const [reconciliationError, setReconciliationError] = useState('');
  const [running, setRunning] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);

  function reload() {
    setLedger(null);
    setLedgerError('');
    setReconciliation(null);
    setReconciliationError('');
    setRefresh((value) => value + 1);
  }

  useEffect(() => {
    let active = true;
    void paymentsApi.listTransactions({ page, limit: pageSize, outcome: outcome || undefined })
      .then((data) => { if (active) setLedger(data); })
      .catch((error: unknown) => {
        if (active) setLedgerError(errorMessage(error, 'Không tải được giao dịch SePay.'));
      });
    return () => { active = false; };
  }, [page, outcome, refresh]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      financeApi.getSePayReconciliationStatus(environment),
      financeApi.listSePayReconciliations({ environment, limit: 10 }),
    ]).then(([status, runs]) => {
      if (active) setReconciliation({ status, runs });
    }).catch((error: unknown) => {
      if (active) setReconciliationError(errorMessage(error, 'Không tải được lịch sử đối soát.'));
    });
    return () => { active = false; };
  }, [environment, refresh]);

  const runReconciliation = async () => {
    setRunning(true);
    try {
      const run = await financeApi.runSePayReconciliation({ environment });
      if (run.status === 'FAILED') {
        toast.error('Không đồng bộ được giao dịch từ SePay.');
      } else {
        toast.info(`${runLabels[run.status] ?? run.status}. Đã bổ sung ${run.backfilledCount} giao dịch.`);
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
        toast.info(result.blockingReasons?.join(', ') || 'Thanh toán chưa đủ điều kiện kích hoạt.');
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Không kiểm tra lại được kích hoạt.'));
    } finally {
      setChecking(null);
    }
  };

  const query = search.trim().toLowerCase();
  const transactions = (ledger?.items ?? []).filter((transaction) => [
    transaction.providerTransactionId,
    transaction.sepayWebhookTransactionId,
    transaction.paymentCode,
    transaction.referenceCode,
    transaction.paymentRequestId,
  ].some((value) => value?.toLowerCase().includes(query)));
  const pageCount = ledger ? Math.max(1, Math.ceil(ledger.total / ledger.limit)) : 1;

  const renderActivationButton = ({ outcome, paymentRequestId }: PaymentTransactionItem) => {
    if (outcome !== 'MATCHED' || !paymentRequestId) return null;
    return (
      <Button size="sm" variant="outline" disabled={checking !== null} onClick={() => void recheck(paymentRequestId)}>
        {checking === paymentRequestId ? 'Đang kiểm tra…' : 'Kiểm tra kích hoạt hợp đồng'}
      </Button>
    );
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Giao dịch ngân hàng</h2>
          <p className="mt-1 text-sm text-slate-600">Xem giao dịch đã nhận và kết quả đối chiếu với khoản thu.</p>
        </div>
        <Button variant="outline" onClick={reload}>Làm mới</Button>
      </header>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-end gap-3 border-b p-4">
          <label className="min-w-0 flex-1 basis-52 space-y-1 text-sm">
            <span className="block">Tìm trên trang hiện tại</span>
            <Input placeholder="Mã giao dịch hoặc mã thanh toán" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="block">Kết quả xử lý</span>
            <select className="h-9 rounded-md border bg-white px-2" value={outcome} onChange={(event) => {
              setLedger(null);
              setLedgerError('');
              setPage(1);
              setOutcome(event.target.value as typeof outcome);
            }}>
              <option value="">Tất cả</option>
              <option value="MATCHED">Đã khớp</option>
              <option value="REVIEW_REQUIRED">Cần kiểm tra</option>
              <option value="IGNORED">Bỏ qua</option>
            </select>
          </label>
        </div>
        {ledgerError && <p role="alert" className="p-4 text-sm text-destructive">{ledgerError}</p>}
        {!ledger && !ledgerError && <p role="status" className="p-4 text-sm">Đang tải giao dịch…</p>}
        {ledger && (
          <>
            {transactions.length === 0 ? (
              <p className="p-8 text-center text-sm">Không có giao dịch phù hợp.</p>
            ) : (
              <>
                <div data-testid="desktop-view" className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Giao dịch</TableHead>
                        <TableHead>Mã thanh toán</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Nguồn nhận</TableHead>
                        <TableHead>Kết quả</TableHead>
                        <TableHead><span className="sr-only">Thao tác</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-semibold whitespace-normal">
                              {transaction.sepayWebhookTransactionId || transaction.providerTransactionId}
                              {transaction.referenceCode && <p className="text-xs font-normal text-muted-foreground">{transaction.referenceCode}</p>}
                              <p className="text-xs font-normal text-muted-foreground">{dateTime.format(new Date(transaction.receivedAt))}</p>
                            </TableCell>
                            <TableCell>
                              {transaction.paymentCode || '—'}
                              {transaction.gateway && <p className="text-xs text-muted-foreground">{transaction.gateway}</p>}
                            </TableCell>
                            <TableCell>{vnd.format(transaction.amountVnd)}</TableCell>
                            <TableCell><TransactionSource transaction={transaction} /></TableCell>
                            <TableCell className="whitespace-normal">
                              <Badge variant="outline">{outcomes[transaction.outcome]}</Badge>
                              {transaction.reason && <p className="mt-1 text-xs text-slate-600">{paymentResultLabels[transaction.reason] ?? transaction.reason}</p>}
                            </TableCell>
                            <TableCell>{renderActivationButton(transaction)}</TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div data-testid="mobile-view" className="divide-y divide-slate-100 md:hidden">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="space-y-2 p-4 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2 font-semibold">
                        <span>{transaction.sepayWebhookTransactionId || transaction.providerTransactionId}</span>
                        <span>{vnd.format(transaction.amountVnd)}</span>
                      </div>
                      <p className="break-all text-xs text-muted-foreground">
                        {[transaction.paymentCode, transaction.referenceCode, transaction.gateway].filter(Boolean).join(' · ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Nhận lúc {dateTime.format(new Date(transaction.receivedAt))}
                      </p>
                      <div><TransactionSource transaction={transaction} /></div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline">{outcomes[transaction.outcome]}</Badge>
                        {renderActivationButton(transaction)}
                      </div>
                      {transaction.reason && <p className="text-xs text-slate-600">{paymentResultLabels[transaction.reason] ?? transaction.reason}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t p-4 text-sm">
              <span>{ledger.total} giao dịch · Trang {ledger.page}/{pageCount}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => {
                  setLedger(null);
                  setPage(page - 1);
                }}>Trang trước</Button>
                <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => {
                  setLedger(null);
                  setPage(page + 1);
                }}>Trang sau</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card className="gap-0 py-0">
        <details>
          <summary className="cursor-pointer px-4 py-4 text-sm font-semibold text-slate-900 sm:px-5">Đồng bộ giao dịch từ SePay</summary>
          <CardContent className="space-y-4 border-t border-slate-200 p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-slate-600">Lấy lại các giao dịch SePay chưa gửi về hệ thống.</p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="space-y-1 text-sm">
                  <span className="block">Loại dữ liệu đồng bộ</span>
                  <select className="h-9 rounded-md border bg-white px-2" disabled={running} value={environment} onChange={(event) => {
                    setReconciliation(null);
                    setReconciliationError('');
                    setEnvironment(event.target.value as typeof environment);
                  }}>
                    <option value="LIVE">Giao dịch thật</option>
                    <option value="TEST">Dữ liệu thử</option>
                  </select>
                </label>
                <Button disabled={running || !reconciliation?.status.enabled} onClick={() => void runReconciliation()}>
                  {running ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
                </Button>
              </div>
            </div>
            {reconciliationError && <p role="alert" className="text-sm text-destructive">{reconciliationError}</p>}
            {!reconciliation && !reconciliationError && <p role="status" className="text-sm">Đang tải trạng thái đối soát…</p>}
            {reconciliation && (
              <>
                <p className="text-sm">
                  {reconciliation.status.enabled ? 'Có thể đồng bộ' : 'Chưa bật đồng bộ'} ·
                  {' '}{reconciliation.status.unreconciledTransactions} giao dịch chưa đối chiếu
                </p>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Bắt đầu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Đã tải</TableHead>
                    <TableHead>Bổ sung</TableHead>
                    <TableHead>Khớp</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {reconciliation.runs.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>{dateTime.format(new Date(run.startedAt))}</TableCell>
                        <TableCell>{runLabels[run.status] ?? run.status}</TableCell>
                        <TableCell>{run.fetchedCount}</TableCell>
                        <TableCell>{run.backfilledCount}</TableCell>
                        <TableCell>{run.matchedCount}</TableCell>
                      </TableRow>
                    ))}
                    {reconciliation.runs.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center">Chưa có lượt đối soát.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </details>
      </Card>
    </section>
  );
}

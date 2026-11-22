'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Landmark,
  ReceiptText,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageNavigation } from '@/components/shared/admin-page-navigation';
import { SupportCaseThread } from '@/components/shared/support-case-thread';
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
import {
  getSupportCaseStatusLabel,
  paymentsApi,
  SUPPORT_CASE_STATUS_STYLES,
  supportCasesApi,
  type SupportCaseDetail,
  type SupportCasePage,
  type SupportCaseStatus,
  type SupportCaseSummary,
} from '@/lib/api';
import { extractErrorMessage } from '@/lib/api/error-handler';
import { describeBlockingReasons } from '@/lib/payment-blocking-reasons';
import { cn } from '@/lib/utils';

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? dateFormat.format(parsed) : value;
}

const INVOICE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  EXPIRED: 'Hết hạn',
  CANCELLED: 'Đã hủy',
};

const OUTCOME_BADGE: Record<string, { label: string; className: string }> = {
  MATCHED: {
    label: 'Khớp hóa đơn',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  },
  REVIEW_REQUIRED: {
    label: 'Cần soát xét',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
  },
  IGNORED: {
    label: 'Bỏ qua',
    className: 'border-slate-300 bg-slate-100 text-slate-700',
  },
};

export function AdminPaymentIssuesView() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<SupportCaseStatus | ''>('');
  const [data, setData] = useState<SupportCasePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedSummary, setSelectedSummary] =
    useState<SupportCaseSummary | null>(null);
  const [caseDetail, setCaseDetail] = useState<SupportCaseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [rechecking, setRechecking] = useState(false);
  const [recheckReasons, setRecheckReasons] = useState<string[]>([]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await supportCasesApi.list({
        type: 'PAYMENT_ISSUE',
        status: status || undefined,
        page,
        limit: 20,
      });
      setData(res);
    } catch (cause) {
      setError(
        extractErrorMessage(
          cause,
          'Không tải được danh sách hồ sơ báo lỗi chuyển khoản.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadDetail = useCallback(async (caseId: string) => {
    setDetailLoading(true);
    setDetailError('');
    setRecheckReasons([]);
    try {
      const detail = await supportCasesApi.detail(caseId);
      setCaseDetail(detail);
    } catch (cause) {
      setDetailError(
        extractErrorMessage(cause, 'Không tải được chi tiết hồ sơ báo lỗi.'),
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleOpenCase = (item: SupportCaseSummary) => {
    setSelectedSummary(item);
    setCaseDetail(null);
    void loadDetail(item.id);
  };

  const handleRecheckActivation = async () => {
    if (!caseDetail?.invoice?.id || rechecking) return;
    setRechecking(true);
    setRecheckReasons([]);
    try {
      const res = await paymentsApi.recheckPaymentActivation(
        caseDetail.invoice.id,
      );
      if (res.activated) {
        toast.success('Đã kích hoạt bù hợp đồng thành công (ACTIVE).');
        await loadDetail(caseDetail.id);
        await loadList();
      } else {
        const reasons = describeBlockingReasons(res.blockingReasons ?? []);
        setRecheckReasons(reasons);
        toast.info('Hợp đồng vẫn chưa đủ điều kiện kích hoạt.');
      }
    } catch (cause) {
      toast.error(
        extractErrorMessage(cause, 'Không thể kiểm tra kích hoạt hợp đồng.'),
      );
    } finally {
      setRechecking(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-2xl border-slate-200/90 py-0 gap-0 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/60 p-4 sm:px-5">
          <div className="space-y-0.5 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Hồ sơ báo lỗi chuyển khoản từ gia đình
            </h2>
            <p className="text-xs text-slate-500">
              Đối chiếu trực tiếp hóa đơn VietQR, giao dịch SePay và phản hồi ngay
              trên từng hồ sơ.
              {data ? ` Tổng số: ${data.total} hồ sơ.` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Lọc trạng thái báo lỗi chuyển khoản"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as SupportCaseStatus | '');
                setPage(1);
              }}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="OPEN">Chờ Admin tiếp nhận</option>
              <option value="IN_REVIEW">Đang đối soát</option>
              <option value="NEED_MORE_INFO">Cần bổ sung thông tin</option>
              <option value="RESOLVED">Đã có kết quả</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => void loadList()}
              className="rounded-xl bg-white text-xs font-semibold cursor-pointer"
            >
              <RefreshCw
                className={cn(
                  'size-3.5 mr-1.5 text-slate-500',
                  loading && 'animate-spin',
                )}
                aria-hidden="true"
              />
              Làm mới
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <RefreshCw
              className="size-4 animate-spin text-primary"
              aria-hidden="true"
            />
            <span>Đang tải danh sách báo lỗi chuyển khoản…</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        {!loading && !error && data?.items.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center text-sm text-slate-600">
            <ClipboardList
              aria-hidden="true"
              className="size-10 text-slate-300"
            />
            <p className="font-medium text-slate-600">
              {status
                ? 'Không có hồ sơ báo lỗi chuyển khoản ở trạng thái đã chọn.'
                : 'Chưa có hồ sơ báo lỗi chuyển khoản nào.'}
            </p>
          </div>
        )}

        {!!data?.items.length && (
          <ul className="divide-y divide-slate-100">
            {data.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 p-4 transition-colors hover:bg-slate-50/80 sm:items-center sm:px-5"
              >
                <div className="min-w-0 flex-1 basis-64 space-y-1.5 text-xs sm:text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 tabular-nums">
                      {item.caseCode}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[11px] font-semibold',
                        SUPPORT_CASE_STATUS_STYLES[item.status],
                      )}
                    >
                      {getSupportCaseStatusLabel(item.status, item.caseType)}
                    </Badge>
                    {item.invoice && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
                        {item.invoice.invoiceCode} ·{' '}
                        {item.invoice.totalPayable.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                    {item.invoice && (
                      <span className="text-[11px] font-medium text-slate-500">
                        (
                        {INVOICE_STATUS_LABELS[item.invoice.paymentStatus] ||
                          item.invoice.paymentStatus}
                        )
                      </span>
                    )}
                  </div>

                  {item.lastMessage && (
                    <p className="line-clamp-2 text-xs text-slate-700 leading-relaxed">
                      {item.lastMessage.body}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      Gia đình: {item.familyUser.fullName} ({item.familyUser.phone})
                    </span>
                    <span className="tabular-nums">
                      HĐ: {item.contract.contractNumber}
                    </span>
                    <span className="tabular-nums">
                      Cập nhật: {formatDate(item.updatedAt)}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={item.status === 'OPEN' ? 'default' : 'outline'}
                  onClick={() => handleOpenCase(item)}
                  className={cn(
                    'rounded-xl text-xs font-semibold cursor-pointer',
                    item.status === 'OPEN' &&
                      'bg-primary text-white hover:bg-primary/90',
                  )}
                >
                  <ReceiptText className="size-3.5 mr-1.5" aria-hidden="true" />
                  <span>Đối soát &amp; Phản hồi</span>
                </Button>
              </li>
            ))}
          </ul>
        )}

        {data && (data.total > data.limit || page > 1) && (
          <div className="border-t border-slate-200 px-4 py-3">
            <AdminPageNavigation
              page={page}
              total={data.total}
              limit={data.limit}
              onPage={setPage}
            />
          </div>
        )}
      </Card>

      {/* Modal chi tiết đối soát hóa đơn + SePay + Khung trao đổi */}
      <Dialog
        open={Boolean(selectedSummary)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSummary(null);
            setCaseDetail(null);
            setDetailError('');
            setRecheckReasons([]);
          }
        }}
      >
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 sm:max-w-4xl sm:rounded-3xl [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:bg-white/15 [&>[data-slot=dialog-close]]:p-1.5 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:opacity-90 [&>[data-slot=dialog-close]]:hover:bg-white/25">
          <DialogHeader className="shrink-0 bg-gradient-to-r from-[#09253b] to-[#0037c1] p-4 text-left text-white sm:p-5">
            <div className="flex flex-wrap items-center gap-2 pr-8 text-xs text-blue-100">
              <span>Đối soát báo lỗi chuyển khoản</span>
              {selectedSummary && (
                <>
                  <span aria-hidden="true">•</span>
                  <span className="rounded bg-white/15 px-1.5 py-0.5 tabular-nums text-[11px] text-white">
                    {selectedSummary.caseCode}
                  </span>
                </>
              )}
            </div>
            <DialogTitle className="mt-0.5 text-base font-bold text-white sm:text-lg">
              {caseDetail?.invoice?.invoiceCode ||
                selectedSummary?.invoice?.invoiceCode ||
                'Hồ sơ đối soát giao dịch'}
            </DialogTitle>
            {selectedSummary && (
              <DialogDescription className="text-xs text-blue-100/90">
                Gia đình: {selectedSummary.familyUser.fullName} (
                {selectedSummary.familyUser.phone}) • Hợp đồng:{' '}
                {selectedSummary.contract.contractNumber}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 text-xs sm:p-6 sm:text-sm">
            {detailLoading && !caseDetail && (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
                <RefreshCw
                  className="size-4 animate-spin text-primary"
                  aria-hidden="true"
                />
                <span>Đang tải dữ liệu hóa đơn và giao dịch SePay…</span>
              </div>
            )}

            {detailError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800"
              >
                {detailError}
              </div>
            )}

            {caseDetail && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                {/* Cột trái: Ngữ cảnh hóa đơn + Giao dịch SePay */}
                <div className="space-y-4 lg:col-span-5">
                  <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <ReceiptText
                        className="size-4 text-primary shrink-0"
                        aria-hidden="true"
                      />
                      <span>Thông tin hóa đơn &amp; hợp đồng</span>
                    </div>
                    <dl className="space-y-1.5 text-xs">
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Hợp đồng:</dt>
                        <dd className="font-semibold text-slate-900 tabular-nums text-right">
                          {caseDetail.contract.contractNumber} (
                          {caseDetail.contract.contractStatus})
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Gói dịch vụ:</dt>
                        <dd className="font-medium text-slate-900 text-right">
                          {caseDetail.contract.packageName}
                        </dd>
                      </div>
                      {caseDetail.invoice && (
                        <>
                          <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Mã hóa đơn:</dt>
                            <dd className="font-bold text-slate-900 tabular-nums text-right">
                              {caseDetail.invoice.invoiceCode}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Số tiền cần thu:</dt>
                            <dd className="font-bold text-primary tabular-nums text-right">
                              {caseDetail.invoice.totalPayable.toLocaleString(
                                'vi-VN',
                              )}{' '}
                              đ
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Trạng thái hóa đơn:</dt>
                            <dd className="font-semibold text-slate-900 text-right">
                              {INVOICE_STATUS_LABELS[
                                caseDetail.invoice.paymentStatus
                              ] || caseDetail.invoice.paymentStatus}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Nội dung CK:</dt>
                            <dd className="font-medium text-slate-900 tabular-nums text-right break-words">
                              {caseDetail.invoice.transferContent}
                            </dd>
                          </div>
                        </>
                      )}
                    </dl>

                    {caseDetail.invoice?.paymentStatus === 'PAID' &&
                      caseDetail.contract.contractStatus !== 'ACTIVE' && (
                        <div className="space-y-2 border-t border-slate-200 pt-3">
                          <Button
                            type="button"
                            size="sm"
                            disabled={rechecking}
                            onClick={() => void handleRecheckActivation()}
                            className="w-full rounded-xl bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
                          >
                            <CheckCircle2
                              className="size-3.5 mr-1.5"
                              aria-hidden="true"
                            />
                            {rechecking
                              ? 'Đang kiểm tra kích hoạt…'
                              : 'Kiểm tra kích hoạt hợp đồng'}
                          </Button>
                          {recheckReasons.length > 0 && (
                            <ul className="list-disc space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-2.5 pl-6 text-[11px] text-amber-950">
                              {recheckReasons.map((reason) => (
                                <li key={reason}>{reason}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Landmark
                        className="size-4 text-primary shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        Giao dịch SePay khớp / liên quan (
                        {caseDetail.relatedTransactions.length})
                      </span>
                    </div>

                    {caseDetail.relatedTransactions.length === 0 ? (
                      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                        <ShieldAlert
                          className="mt-0.5 size-4 shrink-0 text-amber-700"
                          aria-hidden="true"
                        />
                        <span>
                          Chưa có giao dịch SePay nào khớp trực tiếp với mã hóa
                          đơn này. Admin hãy xem ảnh biên lai của gia đình (hoặc
                          yêu cầu bổ sung biên lai) và đối chiếu tại tab{' '}
                          <strong>Giao dịch ngân hàng</strong>.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {caseDetail.relatedTransactions.map((tx) => {
                          const badge = OUTCOME_BADGE[tx.outcome] ?? {
                            label: tx.outcome,
                            className:
                              'border-slate-200 bg-slate-50 text-slate-700',
                          };
                          return (
                            <div
                              key={tx.id}
                              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1 text-xs"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <strong className="tabular-nums text-slate-900">
                                  {tx.amountReceived.toLocaleString('vi-VN')} đ
                                </strong>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[10px] font-semibold',
                                    badge.className,
                                  )}
                                >
                                  {badge.label}
                                </Badge>
                              </div>
                              <div className="text-[11px] text-slate-600 tabular-nums">
                                {tx.gateway} · TK {tx.accountNumber} ·{' '}
                                {formatDate(tx.paymentTime)}
                              </div>
                              {tx.referenceCode && (
                                <div className="text-[11px] text-slate-600 tabular-nums break-all">
                                  Mã tham chiếu: <strong>{tx.referenceCode}</strong>
                                </div>
                              )}
                              {tx.transferContent && (
                                <div className="text-[11px] text-slate-700 break-words">
                                  Nội dung: {tx.transferContent}
                                </div>
                              )}
                              {tx.reason && (
                                <div className="text-[11px] font-semibold text-amber-800">
                                  Lý do hệ thống: {tx.reason}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>

                {/* Cột phải: Luồng trao đổi & Chốt kết quả */}
                <div className="lg:col-span-7">
                  <SupportCaseThread
                    caseDetail={caseDetail}
                    viewerRole="ADMIN"
                    onUpdated={(updated) => {
                      setCaseDetail(updated);
                      void loadList();
                    }}
                    onRefresh={() => loadDetail(caseDetail.id)}
                    refreshing={detailLoading}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 flex-row flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSummary(null);
                setCaseDetail(null);
              }}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { financeApi, type FinanceAnalyticsDto, type FacilitySettlementDto, type ReviewSettlementPayload } from '@/lib/api/finance.api';
import { contractsApi } from '@/lib/api/contracts.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const amount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const settlementStatus: Record<FacilitySettlementDto['disbursementStatus'], string> = {
  PENDING: 'Chờ chi trả',
  CONFIRMED: 'Đã xác nhận',
  FAILED: 'Chi trả thất bại',
  SETTLED: 'Đã chi trả',
};

export function FacilityRevenueView() {
  const [analytics, setAnalytics] = useState<FinanceAnalyticsDto | null>(null);
  const [b2bSplit, setB2bSplit] = useState<{ facility: number; platform: number } | null>(null);
  const [isTestEnvBlocked, setIsTestEnvBlocked] = useState(
    process.env.NEXT_PUBLIC_APP_ENV === 'production',
  );
  const [period, setPeriod] = useState('');
  const [environment, setEnvironment] = useState<'LIVE' | 'TEST'>('LIVE');
  const [refresh, setRefresh] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [review, setReview] = useState<{
    item: FacilitySettlementDto;
    action: ReviewSettlementPayload['action'];
  } | null>(null);
  const [reason, setReason] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    let active = true;
    const req = contractsApi?.getStaffingContracts?.();
    if (!req || typeof req.then !== 'function') return;
    void req
      .then((res) => {
        if (!active || !res || !Array.isArray(res.data)) return;
        const activeContract = res.data.find((c) => c.status === 'ACTIVE');
        if (activeContract) {
          setB2bSplit({
            facility: activeContract.facilitySharePercent,
            platform: activeContract.platformSharePercent,
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const [year, month] = period.split('-').map(Number);
    void financeApi.getAnalytics({ environment, ...(period ? { year, month } : {}) }).then((data) => {
      if (active) setAnalytics(data);
    }).catch((cause: unknown) => {
      if (!active) return;
      const msg = cause instanceof Error ? cause.message : 'Không tải được báo cáo doanh thu.';
      const status = typeof (cause as { status?: unknown })?.status === 'number'
        ? (cause as { status: number }).status
        : undefined;
      if (environment === 'TEST' && (status === 403 || /TEST bị khóa|production|Forbidden/i.test(msg))) {
        setIsTestEnvBlocked(true);
        setEnvironment('LIVE');
        toast.info('Dữ liệu tài chính TEST bị khóa trong môi trường hiện tại. Đã chuyển về LIVE.');
        return;
      }
      setAnalytics(null);
      setError(msg);
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [environment, period, refresh]);

  const resolvedSplit = (() => {
    if (b2bSplit) return b2bSplit;
    if (analytics && analytics.netVnd > 0) {
      const facility = Math.round((analytics.facilityShareVnd / analytics.netVnd) * 100);
      return { facility, platform: Math.max(0, 100 - facility) };
    }
    return null;
  })();

  const metrics = analytics && [
    ['Doanh thu ghi nhận', amount.format(analytics.grossVnd)],
    [
      resolvedSplit ? `Phần doanh thu CSYT (${resolvedSplit.facility}%)` : 'Phần doanh thu CSYT',
      amount.format(analytics.facilityShareVnd),
    ],
    [
      resolvedSplit ? `Phí nền tảng (${resolvedSplit.platform}%)` : 'Phí nền tảng',
      amount.format(analytics.platformFeeVnd),
    ],
    ['Số hóa đơn', analytics.invoiceCount.toLocaleString('vi-VN')],
  ];

  const openReview = (item: FacilitySettlementDto, action: ReviewSettlementPayload['action']) => {
    setReason('');
    setReviewError('');
    setReview({ item, action });
  };

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!review || isSubmittingReview) return;
    const { item, action } = review;
    const { reviewVersion } = item;
    if (reviewVersion === undefined) return;
    const note = reason.trim();
    if (action === 'REPORT_DISCREPANCY' && note.length < 10) {
      setReviewError('Vui lòng mô tả sai lệch ít nhất 10 ký tự.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');
    try {
      const payload = { environment: item.environment, reviewVersion };
      const updated = await financeApi.reviewSettlement(item.id, action === 'CONFIRM'
        ? { ...payload, action }
        : { ...payload, action, reason: note });
      setAnalytics((current) => current ? {
        ...current,
        settlements: current.settlements.map((entry) => entry.id === updated.id ? updated : entry),
      } : current);
      toast.success(action === 'CONFIRM' ? 'Đã xác nhận bảng đối soát.' : 'Đã gửi sai lệch cho Admin.');
      setReview(null);
    } catch (cause) {
      setReviewError(cause instanceof Error ? cause.message : 'Không lưu được kết quả đối soát.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderReview = (item: FacilitySettlementDto) => {
    const settled = item.disbursementStatus === 'SETTLED';
    const canReview = !settled && item.reviewStatus === 'PENDING' && item.reviewVersion !== undefined;
    const status = item.reviewStatus === 'CONFIRMED' ? 'CSYT đã xác nhận'
      : item.reviewStatus === 'DISPUTED' ? 'Đã báo sai lệch'
      : canReview ? 'Chờ CSYT xác nhận' : '—';

    return (
      <div className="space-y-2">
        <Badge variant="outline">{status}</Badge>
        {item.reviewDisputeReason && (
          <p className="max-w-xs whitespace-normal break-words text-xs text-amber-800">
            Sai lệch đã báo gần nhất: {item.reviewDisputeReason}
          </p>
        )}
        {canReview && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => openReview(item, 'CONFIRM')}>Xác nhận bảng</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => openReview(item, 'REPORT_DISCREPANCY')}>Báo sai lệch</Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Đối soát doanh thu B2B</h1>
          <p className="mt-1 text-sm text-slate-600">Doanh thu ghi nhận theo ngày phục vụ trong kỳ.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1 text-sm">
            <span className="block">Kỳ báo cáo</span>
            <input
              type="month"
              className="h-9 rounded-md border bg-white px-2"
              value={period}
              onChange={(event) => {
                setError('');
                setIsLoading(true);
                setPeriod(event.target.value);
              }}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="block">Môi trường</span>
            <select
              aria-label="Môi trường"
              className="h-9 rounded-md border bg-white px-2"
              value={isTestEnvBlocked ? 'LIVE' : environment}
              disabled={isTestEnvBlocked}
              onChange={(event) => {
                setError('');
                setIsLoading(true);
                setEnvironment(event.target.value as typeof environment);
              }}
            >
              <option value="LIVE">LIVE</option>
              {!isTestEnvBlocked && <option value="TEST">TEST</option>}
            </select>
          </label>
          <Button variant="outline" disabled={isLoading} onClick={() => {
            setError('');
            setIsLoading(true);
            setRefresh((value) => value + 1);
          }}>Làm mới</Button>
        </div>
      </header>
      {isLoading && <p role="status" className="text-sm">Đang tải báo cáo doanh thu…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {analytics && !isLoading && (
        <>
          <p className="text-sm font-semibold">Tháng {analytics.month}/{analytics.year} · {analytics.environment}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics?.map(([label, value]) => (
              <Card key={label}>
                <CardContent className="space-y-1">
                  <p className="text-sm text-slate-600">{label}</p>
                  <p className="text-xl font-bold tabular-nums">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="gap-0 overflow-hidden py-0">
            <h2 className="border-b p-4 font-semibold">Bảng quyết toán của kỳ</h2>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã quyết toán</TableHead>
                    <TableHead>Phần chi trả CSYT</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Mã chuyển khoản</TableHead>
                    <TableHead>Đối soát CSYT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.settlements.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.settlementCode}</TableCell>
                      <TableCell>{amount.format(item.facilityPayoutAmount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{settlementStatus[item.disbursementStatus]}</Badge>
                        {item.failureReason && <p className="mt-1 text-xs">{item.failureReason}</p>}
                      </TableCell>
                      <TableCell>{item.bankTransferOrderId || '—'}</TableCell>
                      <TableCell>{renderReview(item)}</TableCell>
                    </TableRow>
                  ))}
                  {analytics.settlements.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center">Chưa có bảng quyết toán cho kỳ này.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">
              {analytics.settlements.map((item) => (
                <div key={item.id} className="space-y-2 p-4 text-sm">
                  <div className="flex flex-wrap justify-between gap-2 font-semibold">
                    <span>{item.settlementCode}</span>
                    <span>{amount.format(item.facilityPayoutAmount)}</span>
                  </div>
                  <Badge variant="outline">{settlementStatus[item.disbursementStatus]}</Badge>
                  {item.failureReason && <p className="text-xs">{item.failureReason}</p>}
                  {item.bankTransferOrderId && (
                    <p className="text-xs text-muted-foreground">Mã chuyển khoản {item.bankTransferOrderId}</p>
                  )}
                  {renderReview(item)}
                </div>
              ))}
              {analytics.settlements.length === 0 && (
                <p className="p-8 text-center text-sm">Chưa có bảng quyết toán cho kỳ này.</p>
              )}
            </div>
          </Card>
        </>
      )}
      <Dialog open={review !== null} onOpenChange={(open) => {
        if (!open && !isSubmittingReview) setReview(null);
      }}>
        <DialogContent>
          {review && (
            <form onSubmit={submitReview} className="space-y-4">
              <DialogHeader>
                <DialogTitle>{review.action === 'CONFIRM' ? 'Xác nhận bảng đối soát' : 'Báo sai lệch bảng đối soát'}</DialogTitle>
                <DialogDescription>
                  {review.item.settlementCode} · Tháng {review.item.month}/{review.item.year} · Phần CSYT {amount.format(review.item.facilityPayoutAmount)}
                </DialogDescription>
              </DialogHeader>
              {review.action === 'REPORT_DISCREPANCY' && (
                <div className="space-y-2">
                  <Label htmlFor="settlement-review-reason">Nội dung sai lệch</Label>
                  <Textarea
                    id="settlement-review-reason"
                    required
                    minLength={10}
                    maxLength={1000}
                    value={reason}
                    disabled={isSubmittingReview}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Ghi kỳ, hóa đơn hoặc số tiền chưa khớp"
                  />
                </div>
              )}
              {reviewError && <p role="alert" className="text-sm text-destructive">{reviewError}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" disabled={isSubmittingReview} onClick={() => setReview(null)}>Hủy</Button>
                <Button type="submit" disabled={isSubmittingReview}>
                  {isSubmittingReview ? 'Đang gửi…' : review.action === 'CONFIRM' ? 'Xác nhận số liệu' : 'Gửi sai lệch'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useCallback, useState } from 'react';
import { AdminPageNavigation } from '@/components/shared/admin-page-navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminQuery } from '@/hooks/use-admin-query';
import { paymentsApi, type SePayWebhookEvent } from '@/lib/api/payments.api';

export const paymentResultLabels: Record<string, string> = {
  MATCHED: 'Đã khớp và ghi nhận tiền vào',
  PING: 'Đã nhận tín hiệu kiểm tra từ SePay',
  DUPLICATE_DELIVERY: 'SePay gửi lại sự kiện đã xử lý',
  OUTGOING_TRANSFER: 'Đã nhận thông báo tiền ra',
  WRONG_ACCOUNT: 'Sai tài khoản hoặc ngân hàng nhận',
  MISSING_CODE: 'Không tìm thấy mã thanh toán trong giao dịch',
  AMBIGUOUS_CODE: 'Giao dịch chứa nhiều mã thanh toán',
  UNKNOWN_CODE: 'Mã thanh toán không tồn tại trong môi trường này',
  AMOUNT_MISMATCH: 'Số tiền nhận khác số tiền trên hóa đơn',
  BEFORE_REQUEST: 'Giao dịch phát sinh trước lúc cấp mã',
  FUTURE_TRANSACTION: 'Thời điểm giao dịch nằm trong tương lai',
  LATE_PAYMENT: 'Giao dịch đến sau khi mã hết hạn',
  SUPERSEDED_REQUEST: 'Mã đã được thay thế',
  CANCELLED_REQUEST: 'Mã đã bị hủy',
  CONTRACT_UNAVAILABLE: 'Hợp đồng không còn đủ điều kiện nhận thanh toán',
  ALREADY_PAID: 'Hóa đơn đã được thanh toán',
  DUPLICATE_BANK_REFERENCE: 'Tham chiếu ngân hàng trùng với giao dịch đã nhận',
  INVALID_API_KEY: 'API key không hợp lệ',
  INVALID_SIGNATURE: 'Chữ ký HMAC hoặc thông tin đi kèm không hợp lệ',
  SIGNATURE_EXPIRED: 'Thời gian ký webhook nằm ngoài khoảng cho phép',
  TEST_ROUTE_DISABLED: 'Endpoint nhận thử đã tắt ở môi trường hiện tại',
  UNSUPPORTED_CONTENT_TYPE: 'Webhook phải gửi JSON',
  INVALID_TRANSACTION_DATE: 'Ngày giao dịch từ SePay không hợp lệ',
  INVALID_PAYLOAD: 'Thông báo thiếu thông tin hoặc sai định dạng',
  TRANSACTION_ID_CONFLICT: 'Mã giao dịch SePay trùng nhưng dữ liệu không khớp',
  SERVICE_UNAVAILABLE: 'Dịch vụ tiếp nhận webhook chưa sẵn sàng',
  PROCESSING_FAILED: 'Hệ thống gặp lỗi khi xử lý thông báo',
  REQUEST_REJECTED: 'Hệ thống từ chối tiếp nhận thông báo',
};

const receivedAt = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh',
});

export function AdminWebhookEventsView() {
  const [environment, setEnvironment] = useState<'LIVE' | 'TEST'>('LIVE');
  const [status, setStatus] = useState<SePayWebhookEvent['status'] | ''>('');
  const [page, setPage] = useState(1);
  const load = useCallback(
    () => paymentsApi.listWebhookEvents({ environment, page, status: status || undefined }),
    [environment, page, status],
  );
  const { data, error, loading, refresh } = useAdminQuery(load);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Thông báo SePay</h2>
        <p className="text-sm text-slate-600">Kiểm tra thông báo tiền vào, tiền ra và lý do xử lý thất bại.</p>
      </header>
      <Card className="flex-row flex-wrap items-end justify-between gap-3 border-slate-200 p-4">
        <div className="flex flex-wrap gap-3">
          <label className="grid gap-2 text-sm font-medium">
            Loại dữ liệu
            <select className="h-9 rounded-md border border-input bg-background px-3 font-normal" value={environment}
              onChange={(event) => { setEnvironment(event.target.value as typeof environment); setPage(1); }}>
              <option value="LIVE">Giao dịch thật</option>
              <option value="TEST">Dữ liệu thử</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Kết quả xử lý
            <select className="h-9 rounded-md border border-input bg-background px-3 font-normal" value={status}
              onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }}>
              <option value="">Tất cả kết quả</option>
              <option value="SUCCESS">Thành công</option>
              <option value="ERROR">Cần kiểm tra</option>
            </select>
          </label>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>Làm mới</Button>
      </Card>
      {loading && <p role="status" className="text-sm text-slate-600">Đang tải thông báo…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {data && (
        <Card className="py-0">
          <CardContent className="px-0">
            {data.items.length === 0 ? <p className="p-6 text-center text-sm text-slate-600">Chưa có thông báo phù hợp.</p> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Thông báo</TableHead>
                  <TableHead>Kết quả xử lý</TableHead>
                </TableRow></TableHeader>
                <TableBody>{data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="align-top whitespace-normal tabular-nums">
                      <p className="font-medium">{receivedAt.format(new Date(item.receivedAt))}</p>
                      {item.providerTransactionId && <p className="mt-1 wrap-anywhere text-xs text-slate-600">Mã giao dịch {item.providerTransactionId}</p>}
                    </TableCell>
                    <TableCell className="space-y-1 whitespace-normal">
                      <Badge variant="outline" className={item.status === 'ERROR' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}>
                        {item.status === 'ERROR' ? 'Cần kiểm tra' : 'Thành công'}
                      </Badge>
                      <p className="wrap-anywhere">{paymentResultLabels[item.resultCode] ?? 'Xem mã xử lý để kiểm tra thông báo.'}</p>
                      <details className="text-xs text-slate-600">
                        <summary className="cursor-pointer">Chi tiết kỹ thuật</summary>
                        <p className="mt-1 wrap-anywhere">HTTP {item.httpStatus} · {item.resultCode}</p>
                      </details>
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            )}
            {data.total > data.limit && <AdminPageNavigation page={page} total={data.total} limit={data.limit} onPage={setPage} />}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdminQuery } from '@/hooks/use-admin-query';
import { contractsApi } from '@/lib/api/contracts.api';
import { paymentsApi, type PaymentRequest } from '@/lib/api/payments.api';
import { formatCurrencyVND } from '@/lib/utils';

export function AdminPaymentRequestView() {
  const [contractId, setContractId] = useState('');
  const [manualContract, setManualContract] = useState(false);
  const [addendumId, setAddendumId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [issued, setIssued] = useState<PaymentRequest | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const contracts = useAdminQuery(useCallback(() => contractsApi.getMedicalContracts({ all: true }), []));
  const selectable = contracts.data?.filter((contract) =>
    ['PENDING_PAYMENT', 'ACTIVE'].includes(contract.status),
  ) ?? [];
  const selected = selectable.find((contract) => contract.id === contractId);
  const useManualContract = manualContract || selectable.length === 0 || (contractId !== '' && !selected);

  async function issue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setIssued(null);
    setBusy(true);
    try {
      setIssued(await paymentsApi.createAdminPaymentRequest({
        contractId: contractId.trim(),
        addendumId: addendumId.trim() || undefined,
        amountVnd: Number(amount),
        transferDescription: description.trim(),
        reason: reason.trim(),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể cấp mã thu tiền.');
    } finally {
      setBusy(false);
    }
  }

  async function copyMemo(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Đã sao chép nội dung chuyển khoản.');
    } catch {
      toast.error('Không sao chép được. Hãy chọn và sao chép nội dung hiển thị.');
    }
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Tạo mã thu tiền</h2>
        <p className="text-sm text-slate-600">Tạo mã QR để người dùng thanh toán hợp đồng hoặc phụ lục.</p>
      </header>
      <div className={issued ? 'grid items-start gap-4 xl:grid-cols-2' : 'max-w-2xl'}>
        <Card className="border-slate-200 py-0"><CardContent className="p-4 sm:p-5">
          <form className="space-y-5" onSubmit={issue}>
            <fieldset className="min-w-0 space-y-3">
              <legend className="mb-3 font-semibold text-slate-900">Khoản cần thu</legend>
              {useManualContract ? (
                <Label className="grid gap-2">ID hợp đồng
                  <Input required disabled={busy} value={contractId} onChange={(event) => { setContractId(event.target.value); setAddendumId(''); }} />
                </Label>
              ) : (
                <Label className="grid gap-2">Hợp đồng cần thu
                  <select className="h-9 w-full rounded-md border border-input bg-background px-3 font-normal" value={contractId}
                    onChange={(event) => { setContractId(event.target.value); setAddendumId(''); }} disabled={busy} required>
                    <option value="">Chọn hợp đồng</option>
                    {selectable.map((item) => <option key={item.id} value={item.id}>{item.contractNumber} · {item.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Chờ thanh toán'}</option>)}
                  </select>
                </Label>
              )}
              {selectable.length > 0 && (
                <Button type="button" variant="link" className="h-auto px-0" disabled={busy} onClick={() => {
                  if (useManualContract && !selected) { setContractId(''); setAddendumId(''); }
                  setManualContract(!useManualContract);
                }}>
                  {useManualContract ? 'Chọn từ danh sách' : 'Nhập ID hợp đồng'}
                </Button>
              )}
              {(useManualContract || selected?.status === 'ACTIVE') && (
                <Label className="grid gap-2">ID phụ lục (nếu có)
                  <Input disabled={busy} value={addendumId} onChange={(event) => setAddendumId(event.target.value)} />
                </Label>
              )}
            </fieldset>
            <fieldset className="min-w-0 space-y-3">
              <legend className="mb-3 font-semibold text-slate-900">Thông tin chuyển khoản</legend>
              <Label className="grid gap-2">Số tiền cần thu (VNĐ)
              <Input type="number" required min={1} max={9999999999} step={1} disabled={busy}
                value={amount} onChange={(event) => setAmount(event.target.value)} />
              </Label>
              <Label className="grid gap-2">Nội dung chuyển khoản
              <Input required maxLength={85} disabled={busy} value={description} onChange={(event) => setDescription(event.target.value)} />
              </Label>
              <p className="text-xs text-slate-600">Dùng chữ không dấu, số và dấu cách. Hệ thống tự thêm mã hóa đơn.</p>
              <Label className="grid gap-2">Lý do tạo hoặc đổi mã
                <Textarea required minLength={5} maxLength={500} disabled={busy} value={reason} onChange={(event) => setReason(event.target.value)} />
              </Label>
            </fieldset>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600">Nếu đổi số tiền hoặc nội dung, người dùng cần mở lại trang thanh toán để lấy mã mới.</p>
              <Button type="submit" disabled={busy}>{busy ? 'Đang tạo mã…' : 'Tạo mã thu tiền'}</Button>
            </div>
          </form>
        </CardContent></Card>

        {issued && (
          <Card aria-label="Mã thu tiền đã tạo" className="border-slate-200">
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{issued.paymentCode}</h3>
                <Badge variant="outline">{issued.environment === 'LIVE' ? 'Tiền thật' : 'Dữ liệu thử'}</Badge>
              </div>
              <p className="text-2xl font-semibold tabular-nums">{formatCurrencyVND(issued.amountVnd)}</p>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-muted-foreground">Tài khoản nhận</dt><dd>{issued.expectedGateway} · {issued.expectedAccountNumber}</dd></div>
                <div><dt className="text-muted-foreground">Nội dung chuyển khoản</dt><dd className="break-words">{issued.transferContent ?? issued.paymentCode}</dd></div>
                <div><dt className="text-muted-foreground">Có hiệu lực đến</dt><dd>{new Date(issued.expiresAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void copyMemo(issued.transferContent ?? issued.paymentCode)}>Sao chép nội dung</Button>
                {issued.qrUrl && <Button asChild><a href={issued.qrUrl} target="_blank" rel="noreferrer">Mở mã QR thu tiền</a></Button>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

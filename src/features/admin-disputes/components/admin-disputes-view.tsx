'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { ClipboardList, RefreshCw, Stethoscope, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared';
import { AdminPageNavigation } from '@/components/shared/admin-page-navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { adminApi, complaintStatusLabel, type AdminComplaint, type ComplaintOutcome, type ComplaintSenderRole, type ComplaintStatus } from '@/lib/api/admin.api';
import { useAdminQuery } from '@/hooks/use-admin-query';
import { cn } from '@/lib/utils';

const outcomes: Record<ComplaintOutcome, string> = {
  NO_VIOLATION: 'Không có vi phạm', WARNING: 'Nhắc nhở',
  SERVICE_CORRECTION: 'Điều chỉnh dịch vụ', REFERRED_TO_FACILITY: 'Chuyển CSYT xử lý chuyên môn',
};
const senderTabs = [
  { role: 'FAMILY_REP', label: 'Gia đình', icon: UsersRound },
  { role: 'DOCTOR', label: 'Bác sĩ', icon: Stethoscope },
] as const;
const statusStyles: Record<ComplaintStatus, string> = {
  SUBMITTED: 'border-amber-200 bg-amber-50 text-amber-900',
  INVESTIGATING: 'border-blue-200 bg-blue-50 text-blue-800',
  RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  CLOSED: 'border-slate-200 bg-slate-100 text-slate-700',
};
const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' });

export function AdminDisputesView({ facility = false }: { facility?: boolean } = {}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {facility ? (
        <>
          <PageHeader title="Khiếu nại của cơ sở" description="Gửi kết quả xác minh chuyên môn cho Admin." />
          <ComplaintList facility />
        </>
      ) : (
        <>
          <PageHeader
            title="Xử lý khiếu nại"
            description="Tiếp nhận phản ánh và theo dõi quá trình xử lý từng hồ sơ."
            className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
          />
          <Tabs defaultValue="FAMILY_REP" className="min-w-0 gap-5">
            <TabsList
              aria-label="Người gửi khiếu nại"
              className="grid w-full max-w-xl grid-cols-2 items-stretch gap-2 rounded-2xl border border-slate-200 bg-white p-2 group-data-[orientation=horizontal]/tabs:h-auto"
            >
              {senderTabs.map(({ role, label, icon: Icon }) => (
                <TabsTrigger
                  key={role}
                  value={role}
                  className="h-auto min-h-12 justify-center gap-2 rounded-xl border-slate-200 bg-slate-50 px-3 py-2.5 font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:font-semibold data-[state=active]:text-primary-foreground"
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {senderTabs.map(({ role, label }) => (
              <TabsContent key={role} value={role}>
                <ComplaintList sender={role} senderLabel={label} />
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
}

function ComplaintList({ facility = false, sender, senderLabel }: {
  facility?: boolean;
  sender?: ComplaintSenderRole;
  senderLabel?: string;
}) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ComplaintStatus | ''>('');
  const [selected, setSelected] = useState<AdminComplaint | null>(null);
  const { data, error, loading, refresh } = useAdminQuery(useCallback(() => {
    const filters = { page, status: status || undefined };
    return facility ? adminApi.facilityComplaints(filters) : adminApi.complaints({ ...filters, complainantRole: sender });
  }, [facility, page, sender, status]));

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Trạng thái khiếu nại" value={status} className="h-9 rounded-md border border-input bg-background px-3 text-sm" onChange={(event) => {
        setStatus(event.target.value as typeof status);
        setPage(1);
      }}>
        <option value="">Tất cả trạng thái</option>
        {Object.entries(complaintStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <Button type="button" variant="outline" onClick={refresh} disabled={loading}>
        {!facility && <RefreshCw aria-hidden="true" />}
        Làm mới
      </Button>
    </div>
  );
  const messages = (
    <>
      {loading && <p role="status" className={cn('text-sm text-slate-600', !facility && 'p-5')}>Đang tải hồ sơ…</p>}
      {error && <p role="alert" className={cn('text-sm text-destructive', !facility && 'p-5')}>{error}</p>}
      {data?.items.length === 0 && (
        <div className={cn('text-sm text-slate-600', !facility && 'flex flex-col items-center gap-3 px-4 py-10 text-center')}>
          {!facility && <ClipboardList aria-hidden="true" className="size-7 text-slate-400" />}
          <p>{status ? 'Không có khiếu nại ở trạng thái đã chọn.' : 'Chưa có khiếu nại.'}</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {facility ? (
        <div className="space-y-6">
          {controls}
          {messages}
          {data?.items.map((item) => (
            <Card key={item.id}><CardContent className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1 text-sm">
                <h2 className="break-words font-semibold">{item.complaintCode}</h2>
                <p className="text-muted-foreground">{item.complainantUser?.fullName} · {item.contract?.facility?.facilityName}</p>
                <p className="line-clamp-2 break-words">{item.description}</p>
              </div>
              <Badge variant="outline">{complaintStatusLabel[item.status]}</Badge>
              <Button variant="outline" onClick={() => setSelected(item)}>Mở hồ sơ</Button>
            </CardContent></Card>
          ))}
          {data && <AdminPageNavigation page={page} total={data.total} limit={data.limit} onPage={setPage} />}
        </div>
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200 py-0">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-4 sm:px-5">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900">Khiếu nại từ {senderLabel?.toLowerCase()}</h2>
              {data && <p className="text-sm text-slate-600">{data.total} hồ sơ</p>}
            </div>
            {controls}
          </div>
          {messages}
          {!!data?.items.length && (
            <ul className="divide-y divide-slate-200">
              {data.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-4 sm:items-center sm:px-5">
                  <div className="min-w-0 flex-1 basis-56 space-y-1.5 text-sm">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="min-w-0 wrap-anywhere font-semibold text-slate-900">{item.complaintCode}</h3>
                      <Badge variant="outline" className={statusStyles[item.status]}>{complaintStatusLabel[item.status]}</Badge>
                    </div>
                    <p className="line-clamp-2 wrap-anywhere text-slate-800">{item.description}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                      {item.complainantUser?.fullName && <span className="wrap-anywhere">{item.complainantUser.fullName}</span>}
                      {item.contract?.facility?.facilityName && <span className="wrap-anywhere">{item.contract.facility.facilityName}</span>}
                      <time dateTime={item.createdAt}>{dateFormat.format(new Date(item.createdAt))}</time>
                    </div>
                  </div>
                  <Button type="button" size="sm" variant="outline" aria-label={`Xem chi tiết ${item.complaintCode}`} onClick={() => setSelected(item)}>
                    Xem chi tiết
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {data && (data.total > data.limit || page > 1) && (
            <div className="border-t border-slate-200">
              <AdminPageNavigation page={page} total={data.total} limit={data.limit} onPage={setPage} />
            </div>
          )}
        </Card>
      )}
      {selected && <ComplaintDialog key={selected.id} item={selected} facility={facility} close={() => setSelected(null)} onChange={refresh} />}
    </>
  );
}

function ComplaintDialog({ item, facility, close, onChange }: { item: AdminComplaint; facility: boolean; close: () => void; onChange: () => void }) {
  const { data, error, loading, refresh } = useAdminQuery(useCallback(() => adminApi.complaint(item.id), [item.id]));
  const [outcome, setOutcome] = useState<ComplaintOutcome>('NO_VIOLATION');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const canRespond = facility && data?.status === 'INVESTIGATING' && !data.facilityReviewedAt;
  const canResolve = !facility && data?.status === 'INVESTIGATING' && Boolean(data.facilityReviewedAt);
  const canInvestigate = !facility && data?.status === 'SUBMITTED';
  const canClose = !facility && data?.status === 'RESOLVED';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data || busy) return;
    const action = canRespond ? 'FACILITY_RESPONSE' : canInvestigate ? 'INVESTIGATE' : canClose ? 'CLOSE'
      : canResolve ? 'RESOLVE' : null;
    if (!action || ((canRespond || canResolve) && notes.trim().length < 10)) return;
    setBusy(true);
    setSubmitError('');
    try {
      await adminApi.updateComplaint(item.id, action === 'RESOLVE'
        ? { action, outcome, notes: notes.trim() }
        : action === 'FACILITY_RESPONSE' ? { action, notes: notes.trim() } : { action });
      toast.success('Đã cập nhật hồ sơ khiếu nại.');
      setNotes('');
      onChange();
      refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không cập nhật được khiếu nại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) close(); }}>
      <DialogContent className={cn('max-h-[85vh] overflow-y-auto', !facility && 'rounded-2xl sm:max-w-xl')}>
        <DialogHeader className={cn(!facility && 'pr-6 text-left')}>
          <DialogTitle>Hồ sơ {item.complaintCode}</DialogTitle>
          <DialogDescription>Hợp đồng {item.contract?.contractNumber ?? item.contractId}</DialogDescription>
        </DialogHeader>
        {loading && <p role="status" className="text-sm">Đang tải chi tiết…</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {data && (
          <form className={cn('text-sm', facility ? 'space-y-3' : 'space-y-4')} onSubmit={submit}>
            <div className={cn('space-y-2', !facility && 'rounded-xl border border-slate-200 bg-slate-50 p-4')}>
              <Badge variant="outline" className={cn(!facility && statusStyles[data.status])}>{complaintStatusLabel[data.status]}</Badge>
              <p className="wrap-anywhere whitespace-pre-wrap">{data.description}</p>
            </div>
            {data.facilityResponse && <div className="rounded-lg border p-3"><p className="font-semibold">Phản hồi của CSYT</p><p className="whitespace-pre-wrap break-words">{data.facilityResponse}</p></div>}
            {data.resolutionNotes && <p className="whitespace-pre-wrap break-words"><strong>{data.resolutionOutcome ? outcomes[data.resolutionOutcome] : 'Kết luận'}</strong> · {data.resolutionNotes}</p>}
            {!facility && data.status === 'INVESTIGATING' && !data.facilityReviewedAt && <p className="text-muted-foreground">Đang chờ CSYT xác minh trước khi kết luận.</p>}
            {canResolve && <>
              <Label htmlFor="complaint-outcome">Kết quả xử lý</Label>
              <select id="complaint-outcome" className="block h-9 w-full rounded-md border bg-white px-2" value={outcome} onChange={(event) => setOutcome(event.target.value as ComplaintOutcome)}>
                {Object.entries(outcomes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </>}
            {(canResolve || canRespond) && <>
              <Label htmlFor="complaint-notes">{canRespond ? 'Kết quả xác minh chuyên môn' : 'Nội dung kết luận'}</Label>
              <Textarea id="complaint-notes" required minLength={10} maxLength={4000} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </>}
            {submitError && <p role="alert" className="text-destructive">{submitError}</p>}
            {(canInvestigate || canClose || canResolve || canRespond) && (
              <DialogFooter className={cn(!facility && 'border-t border-slate-200 pt-4')}><Button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : canRespond ? 'Gửi kết quả xác minh'
                : canInvestigate ? 'Thụ lý hồ sơ' : canClose ? 'Đóng hồ sơ' : 'Ghi kết luận'}</Button></DialogFooter>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

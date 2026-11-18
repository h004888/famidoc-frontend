'use client';

import { useCallback, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileCheck2,
  FileText,
  Gavel,
  Info,
  PlayCircle,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UsersRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared';
import { AdminPageNavigation } from '@/components/shared/admin-page-navigation';
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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  adminApi,
  complaintStatusLabel,
  type AdminComplaint,
  type ComplaintOutcome,
  type ComplaintSenderRole,
  type ComplaintStatus,
} from '@/lib/api/admin.api';
import { useAdminQuery } from '@/hooks/use-admin-query';
import { cn } from '@/lib/utils';

export const outcomeDescriptions: Record<ComplaintOutcome, { label: string; desc: string }> = {
  NO_VIOLATION: {
    label: 'Không có vi phạm',
    desc: 'Sự việc do yếu tố khách quan hoặc hiểu lầm thông tin, không phát hiện vi phạm y tế.',
  },
  WARNING: {
    label: 'Nhắc nhở / Khiển trách',
    desc: 'Nhắc nhở bác sĩ hoặc cá nhân liên quan tuân thủ nghiêm túc quy tắc ứng xử và tác phong.',
  },
  SERVICE_CORRECTION: {
    label: 'Điều chỉnh dịch vụ',
    desc: 'Đổi bác sĩ gia đình phụ trách mới, bù buổi khám hoặc điều chỉnh quyền lợi gói dịch vụ.',
  },
  REFERRED_TO_FACILITY: {
    label: 'Chuyển CSYT xử lý chuyên môn',
    desc: 'Chuyển hồ sơ sang Hội đồng chuyên môn của Cơ sở Y tế để xem xét trách nhiệm chuyên khoa.',
  },
};

const categoryLabels: Record<string, string> = {
  MISSED_VISIT: 'Bỏ ca / Trễ hẹn khám',
  CLINICAL_QUALITY: 'Chất lượng chuyên môn y tế',
  ATTITUDE: 'Thái độ & Quy tắc ứng xử',
  BILLING: 'Thanh toán & Gói dịch vụ',
  COMMUNICATION: 'Liên lạc & Phối hợp',
};

const senderTabs = [
  { role: 'FAMILY_REP', label: 'Gia đình', icon: UsersRound },
  { role: 'DOCTOR', label: 'Bác sĩ', icon: Stethoscope },
] as const;

const statusStyles: Record<ComplaintStatus, string> = {
  SUBMITTED: 'border-amber-300 bg-amber-50 text-amber-900',
  INVESTIGATING: 'border-blue-300 bg-blue-50 text-blue-900',
  RESOLVED: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  CLOSED: 'border-slate-300 bg-slate-100 text-slate-700',
};

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

export function AdminDisputesView({ facility = false }: { facility?: boolean } = {}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
      {facility ? (
        <>
          <PageHeader
            title="Khiếu nại của cơ sở"
            description="Gửi kết quả xác minh chuyên môn cho Admin để hoàn tất phán quyết."
          />
          <ComplaintList facility />
        </>
      ) : (
        <>
          {/* Header */}
          <PageHeader
            breadcrumbs={[
              { label: 'Quản trị hệ thống', href: '/admin' },
              { label: 'Xử lý khiếu nại' },
            ]}
            title="Xử lý khiếu nại"
            description="Trung tâm thụ lý tranh chấp, đối soát giải trình CSYT và ban hành phán quyết cuối cùng."
          />

          {/* Workflow Stepper Banner - Quy trình xử lý 4 bước */}
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white p-4.5 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary">
                Quy trình Thụ lý &amp; Phán quyết Khiếu nại Y tế (4 Bước)
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-2.5 rounded-xl bg-white/90 p-3 border border-slate-200/80 shadow-2xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                  1
                </span>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">Tiếp nhận phản ánh</div>
                  <p className="mt-0.5 text-slate-500">Gia đình hoặc Bác sĩ gửi đơn sự cố.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-white/90 p-3 border border-slate-200/80 shadow-2xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-primary">
                  2
                </span>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">Admin Thụ lý hồ sơ</div>
                  <p className="mt-0.5 text-slate-500">Kích hoạt lệnh yêu cầu CSYT giải trình.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-white/90 p-3 border border-slate-200/80 shadow-2xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                  3
                </span>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">CSYT Xác minh y khoa</div>
                  <p className="mt-0.5 text-slate-500">Kiểm tra bệnh án và nộp báo cáo.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-white/90 p-3 border border-slate-200/80 shadow-2xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                  4
                </span>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">Admin Ra Phán Quyết</div>
                  <p className="mt-0.5 text-slate-500">Ghi kết luận &amp; Đóng hồ sơ vụ việc.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Gia đình vs Bác sĩ */}
          <Tabs defaultValue="FAMILY_REP" className="min-w-0 gap-5">
            <TabsList
              aria-label="Người gửi khiếu nại"
              className="grid w-full max-w-xl grid-cols-2 items-stretch gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 group-data-[orientation=horizontal]/tabs:h-auto shadow-xs"
            >
              {senderTabs.map(({ role, label, icon: Icon }) => (
                <TabsTrigger
                  key={role}
                  value={role}
                  className="h-auto min-h-11 justify-center gap-2 rounded-xl border border-transparent bg-slate-50 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100 data-[state=active]:border-primary/20 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xs cursor-pointer"
                >
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
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

function ComplaintList({
  facility = false,
  sender,
  senderLabel,
}: {
  facility?: boolean;
  sender?: ComplaintSenderRole;
  senderLabel?: string;
}) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ComplaintStatus | ''>('');
  const [selected, setSelected] = useState<AdminComplaint | null>(null);

  const { data, error, loading, refresh } = useAdminQuery(
    useCallback(() => {
      const filters = { page, status: status || undefined };
      return facility
        ? adminApi.facilityComplaints(filters)
        : adminApi.complaints({ ...filters, complainantRole: sender });
    }, [facility, page, sender, status])
  );

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Trạng thái khiếu nại"
        value={status}
        className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-2xs"
        onChange={(event) => {
          setStatus(event.target.value as typeof status);
          setPage(1);
        }}
      >
        <option value="">Tất cả trạng thái</option>
        {Object.entries(complaintStatusLabel).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={refresh}
        disabled={loading}
        className="rounded-xl bg-white text-xs font-semibold shadow-2xs cursor-pointer"
      >
        <RefreshCw className={cn('h-3.5 w-3.5 text-slate-500', loading && 'animate-spin')} aria-hidden="true" />
        <span>Làm mới</span>
      </Button>
    </div>
  );

  const messages = (
    <>
      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-slate-500 text-sm">
          <RefreshCw className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          <span>Đang tải hồ sơ…</span>
        </div>
      )}
      {error && (
        <div role="alert" className="p-4 text-xs sm:text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl m-4">
          {error}
        </div>
      )}
      {data?.items.length === 0 && (
        <div
          className={cn(
            'text-sm text-slate-600',
            !facility && 'flex flex-col items-center gap-3 px-4 py-12 text-center'
          )}
        >
          <ClipboardList aria-hidden="true" className="h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-600">
            {status ? 'Không có khiếu nại ở trạng thái đã chọn.' : 'Chưa có khiếu nại.'}
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      {facility ? (
        <div className="space-y-4">
          <Card className="rounded-2xl border-slate-200/90 py-3 shadow-xs">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4">
              <h2 className="text-sm font-bold text-slate-900">Danh sách khiếu nại cần CSYT xác minh</h2>
              {controls}
            </CardContent>
          </Card>
          {messages}
          {data?.items.map((item) => (
            <Card key={item.id} className="rounded-2xl border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
                <div className="min-w-0 flex-1 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 tabular-nums">{item.complaintCode}</h2>
                    <Badge variant="outline" className={cn('text-xs font-semibold', statusStyles[item.status])}>
                      {complaintStatusLabel[item.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Người gửi: {item.complainantUser?.fullName} • CSYT: {item.contract?.facility?.facilityName}
                  </p>
                  <p className="line-clamp-2 text-xs sm:text-sm text-slate-800 leading-relaxed">{item.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(item)}
                  className="rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Mở hồ sơ
                </Button>
              </CardContent>
            </Card>
          ))}
          {data && <AdminPageNavigation page={page} total={data.total} limit={data.limit} onPage={setPage} />}
        </div>
      ) : (
        <Card className="overflow-hidden rounded-2xl border-slate-200/90 py-0 gap-0 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/60 p-4 sm:px-5">
            <div className="space-y-0.5">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Khiếu nại từ {senderLabel?.toLowerCase()}
              </h2>
              {data && (
                <p className="text-xs text-slate-500 font-medium tabular-nums">
                  Tổng số: <strong>{data.total}</strong> hồ sơ phản ánh
                </p>
              )}
            </div>
            {controls}
          </div>
          {messages}
          {!!data?.items.length && (
            <ul className="divide-y divide-slate-100">
              {data.items.map((item) => {
                const isAwaitingInvestigate = item.status === 'SUBMITTED';
                const isAwaitingFacility = item.status === 'INVESTIGATING' && !item.facilityReviewedAt;
                const isReadyToResolve = item.status === 'INVESTIGATING' && Boolean(item.facilityReviewedAt);
                const isResolved = item.status === 'RESOLVED';

                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-start justify-between gap-3 p-4 transition-colors hover:bg-slate-50/80 sm:items-center sm:px-5"
                  >
                    <div className="min-w-0 flex-1 basis-64 space-y-1.5 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 tabular-nums text-xs sm:text-sm">
                          {item.complaintCode}
                        </h3>

                        {/* Status Badge */}
                        <Badge variant="outline" className={cn('text-[11px] font-semibold', statusStyles[item.status])}>
                          {complaintStatusLabel[item.status]}
                        </Badge>

                        {/* Action hint badge cho Admin */}
                        {isAwaitingInvestigate && (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-[10px] font-bold gap-1 rounded-full px-2 py-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            Cần Admin Thụ lý
                          </Badge>
                        )}
                        {isAwaitingFacility && (
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 text-[10px] font-semibold gap-1 rounded-full px-2 py-0">
                            <Clock className="h-2.5 w-2.5 text-blue-600" aria-hidden="true" />
                            Chờ CSYT giải trình
                          </Badge>
                        )}
                        {isReadyToResolve && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[10px] font-bold gap-1 rounded-full px-2 py-0 animate-pulse">
                            <Gavel className="h-2.5 w-2.5" aria-hidden="true" />
                            Sẵn sàng ra Phán quyết
                          </Badge>
                        )}
                        {isResolved && (
                          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] font-semibold rounded-full px-2 py-0">
                            Chờ đóng hồ sơ
                          </Badge>
                        )}

                        {item.complaintCategory && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                            {categoryLabels[item.complaintCategory] || item.complaintCategory}
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-2 text-xs sm:text-sm text-slate-800 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        {item.complainantUser?.fullName && (
                          <span className="font-semibold text-slate-700">
                            Người gửi: {item.complainantUser.fullName}
                          </span>
                        )}
                        {item.contract?.facility?.facilityName && (
                          <span>CSYT: {item.contract.facility.facilityName}</span>
                        )}
                        {item.contract?.contractNumber && (
                          <span className="tabular-nums text-slate-400">HĐ: {item.contract.contractNumber}</span>
                        )}
                        <time dateTime={item.createdAt} className="tabular-nums text-slate-400">
                          {dateFormat.format(new Date(item.createdAt))}
                        </time>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant={isReadyToResolve || isAwaitingInvestigate ? 'default' : 'outline'}
                        aria-label={`Xem chi tiết ${item.complaintCode}`}
                        onClick={() => setSelected(item)}
                        className={cn(
                          'rounded-xl text-xs font-semibold cursor-pointer shadow-2xs',
                          isReadyToResolve && 'bg-emerald-600 hover:bg-emerald-700 text-white',
                          isAwaitingInvestigate && 'bg-primary text-white hover:bg-primary/90'
                        )}
                      >
                        {isAwaitingInvestigate ? (
                          <>
                            <PlayCircle className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                            <span>Thụ lý ngay</span>
                          </>
                        ) : isReadyToResolve ? (
                          <>
                            <Gavel className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                            <span>Ra phán quyết</span>
                          </>
                        ) : (
                          <span>Xem chi tiết</span>
                        )}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {data && (data.total > data.limit || page > 1) && (
            <div className="border-t border-slate-200 px-4 py-3">
              <AdminPageNavigation page={page} total={data.total} limit={data.limit} onPage={setPage} />
            </div>
          )}
        </Card>
      )}

      {selected && (
        <ComplaintDialog
          key={selected.id}
          item={selected}
          facility={facility}
          close={() => setSelected(null)}
          onChange={refresh}
        />
      )}
    </>
  );
}

function ComplaintDialog({
  item,
  facility,
  close,
  onChange,
}: {
  item: AdminComplaint;
  facility: boolean;
  close: () => void;
  onChange: () => void;
}) {
  const { data, error, loading, refresh } = useAdminQuery(
    useCallback(() => adminApi.complaint(item.id), [item.id])
  );
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
    const action = canRespond
      ? 'FACILITY_RESPONSE'
      : canInvestigate
        ? 'INVESTIGATE'
        : canClose
          ? 'CLOSE'
          : canResolve
            ? 'RESOLVE'
            : null;

    if (!action || ((canRespond || canResolve) && notes.trim().length < 10)) return;
    setBusy(true);
    setSubmitError('');
    try {
      await adminApi.updateComplaint(
        item.id,
        action === 'RESOLVE'
          ? { action, outcome, notes: notes.trim() }
          : action === 'FACILITY_RESPONSE'
            ? { action, notes: notes.trim() }
            : { action }
      );
      toast.success(
        action === 'INVESTIGATE'
          ? 'Đã thụ lý hồ sơ và gửi thông báo yêu cầu CSYT xác minh.'
          : action === 'RESOLVE'
            ? 'Đã ban hành phán quyết giải quyết khiếu nại thành công.'
            : action === 'CLOSE'
              ? 'Đã đóng hồ sơ khiếu nại và lưu trữ kiểm toán.'
              : 'Đã gửi biên bản xác minh chuyên môn thành công.'
      );
      setNotes('');
      onChange();
      refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không cập nhật được khiếu nại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
    >
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-3xl border-slate-200 p-0 sm:max-w-2xl [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:bg-white/15 [&>[data-slot=dialog-close]]:p-1.5 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:opacity-90 [&>[data-slot=dialog-close]]:hover:bg-white/25">
        {/* Header Gradient */}
        <DialogHeader className="bg-gradient-to-r from-[#09253b] to-[#0037c1] p-5 text-left text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-2 pr-8 text-xs font-medium text-blue-100">
            <span>Hồ sơ xử lý khiếu nại</span>
            <span aria-hidden="true">•</span>
            <span className="rounded bg-white/15 px-1.5 py-0.5 tabular-nums text-[11px] text-white">
              {item.complaintCode}
            </span>
          </div>
          <DialogTitle className="mt-1 text-lg font-bold leading-snug text-white sm:text-xl">
            {categoryLabels[item.complaintCategory] || 'Khiếu nại sự cố'}
          </DialogTitle>
          <DialogDescription className="text-xs text-blue-100/90">
            Hợp đồng: {item.contract?.contractNumber ?? item.contractId} • CSYT:{' '}
            {item.contract?.facility?.facilityName || 'Cơ sở Y tế'}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-2 p-10 text-slate-500 text-sm">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
            <span>Đang tải thông tin chi tiết hồ sơ…</span>
          </div>
        )}

        {error && (
          <div role="alert" className="m-6 p-4 text-xs sm:text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {data && (
          <form onSubmit={submit} className="flex flex-col flex-1 overflow-hidden">
            <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4 text-xs sm:p-6 sm:text-sm">
              {/* Stepper Timeline Visualizer */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 sm:p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Tiến trình giải quyết
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {/* Step 1: SUBMITTED */}
                  <div
                    className={cn(
                      'rounded-xl p-2 border transition-all',
                      data.status === 'SUBMITTED'
                        ? 'border-amber-300 bg-amber-50 text-amber-900 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-500'
                    )}
                  >
                    <div className="text-[10px] font-semibold text-slate-400">Bước 1</div>
                    <div>Chờ Admin thụ lý</div>
                  </div>

                  {/* Step 2: INVESTIGATING */}
                  <div
                    className={cn(
                      'rounded-xl p-2 border transition-all',
                      data.status === 'INVESTIGATING'
                        ? 'border-blue-300 bg-blue-50 text-blue-900 font-bold shadow-2xs'
                        : data.status === 'RESOLVED' || data.status === 'CLOSED'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-500'
                    )}
                  >
                    <div className="text-[10px] font-semibold text-slate-400">Bước 2</div>
                    <div>CSYT xác minh y khoa</div>
                  </div>

                  {/* Step 3: RESOLVED / CLOSED */}
                  <div
                    className={cn(
                      'rounded-xl p-2 border transition-all',
                      data.status === 'RESOLVED' || data.status === 'CLOSED'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-500'
                    )}
                  >
                    <div className="text-[10px] font-semibold text-slate-400">Bước 3</div>
                    <div>Admin Phán Quyết</div>
                  </div>
                </div>
              </div>

              {/* KHỐI 1: NỘI DUNG KHIẾU NẠI TỪ NGƯỜI GỬI */}
              <section className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="flex items-center gap-1.5 font-bold text-slate-900 text-xs sm:text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                    <span>Nội dung phản ánh từ {item.complainantUser?.fullName || 'Người gửi'}</span>
                  </h4>
                  <Badge variant="outline" className={cn('text-xs font-semibold', statusStyles[data.status])}>
                    {complaintStatusLabel[data.status]}
                  </Badge>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 sm:p-4 text-xs sm:text-sm">
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-800 break-words">
                    {data.description}
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span>
                      Thời điểm gửi:{' '}
                      <strong className="text-slate-700">{dateFormat.format(new Date(data.createdAt))}</strong>
                    </span>
                    <span>
                      Danh mục: <strong>{categoryLabels[data.complaintCategory] || data.complaintCategory}</strong>
                    </span>
                  </div>
                </div>
              </section>

              {/* KHỐI 2: BIÊN BẢN XÁC MINH CỦA CƠ SỞ Y TẾ */}
              <section className="space-y-2">
                <h4 className="flex items-center gap-1.5 font-bold text-slate-900 text-xs sm:text-sm border-b border-slate-100 pb-1.5">
                  <Building2 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                  <span>Biên bản xác minh chuyên môn từ Cơ sở Y tế</span>
                </h4>

                {data.facilityResponse ? (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-indigo-900">
                      <span className="font-bold flex items-center gap-1">
                        <FileCheck2 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                        Giải trình chuyên môn từ {data.contract?.facility?.facilityName || 'CSYT'}:
                      </span>
                      {data.facilityReviewedAt && (
                        <span className="text-[11px] text-indigo-700 tabular-nums">
                          {dateFormat.format(new Date(data.facilityReviewedAt))}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed text-slate-800 text-xs sm:text-sm break-words bg-white/80 p-3 rounded-xl border border-indigo-100">
                      {data.facilityResponse}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 leading-relaxed">
                    <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      {data.status === 'SUBMITTED' ? (
                        <span>
                          Hồ sơ đang ở trạng thái <strong>Chờ thụ lý</strong>. Quản trị viên vui lòng bấm nút{' '}
                          <em>&ldquo;Thụ lý hồ sơ&rdquo;</em> phía dưới để chính thức yêu cầu Cơ sở Y tế vào cuộc xác minh.
                        </span>
                      ) : (
                        <span>
                          Đang chờ Cơ sở Y tế <strong>{data.contract?.facility?.facilityName || 'bảo trợ'}</strong> kiểm tra bệnh án lâm sàng và gửi biên bản xác minh. Admin sẽ ra phán quyết ngay khi CSYT hoàn tất phản hồi.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* KHỐI 3: PHÁN QUYẾT & KẾT LUẬN CỦA ADMIN */}
              {(data.resolutionNotes || canResolve) && (
                <section className="space-y-3">
                  <h4 className="flex items-center gap-1.5 font-bold text-slate-900 text-xs sm:text-sm border-b border-slate-100 pb-1.5">
                    <Gavel className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    <span>Phán quyết &amp; Kết luận của Quản trị viên (Super Admin)</span>
                  </h4>

                  {/* Đã có kết luận */}
                  {data.resolutionNotes && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-emerald-600 text-white font-bold text-xs gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {data.resolutionOutcome ? outcomeDescriptions[data.resolutionOutcome]?.label : 'Kết luận chính thức'}
                        </Badge>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-slate-800 text-xs sm:text-sm break-words bg-white/90 p-3 rounded-xl border border-emerald-100">
                        {data.resolutionNotes}
                      </p>
                    </div>
                  )}

                  {/* Admin đang ra phán quyết */}
                  {canResolve && (
                    <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="complaint-outcome" className="text-xs font-bold text-slate-800">
                          Hình thức xử lý kết luận: <span className="text-rose-500">*</span>
                        </Label>
                        <select
                          id="complaint-outcome"
                          className="block h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs cursor-pointer focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          value={outcome}
                          onChange={(event) => setOutcome(event.target.value as ComplaintOutcome)}
                        >
                          {Object.entries(outcomeDescriptions).map(([value, { label }]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-500 italic">
                          {outcomeDescriptions[outcome]?.desc}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="complaint-notes" className="text-xs font-bold text-slate-800">
                          Nội dung phán quyết &amp; Hướng khắc phục: <span className="text-rose-500">*</span>
                        </Label>
                        <Textarea
                          id="complaint-notes"
                          required
                          minLength={10}
                          maxLength={4000}
                          rows={4}
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          placeholder="Ghi rõ căn cứ giải quyết, biện pháp chấn chỉnh, phân công bác sĩ thay thế hoặc bồi hoàn dịch vụ cho gia đình..."
                          className="rounded-xl bg-white text-xs sm:text-sm border-slate-200 focus-visible:ring-emerald-500"
                        />
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Tối thiểu 10 ký tự</span>
                          <span className="tabular-nums">{notes.length}/4000</span>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Form phản hồi của CSYT (khi role là CSYT) */}
              {canRespond && (
                <section className="space-y-2 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                  <Label htmlFor="complaint-notes" className="text-xs font-bold text-indigo-950">
                    Báo cáo kết quả xác minh lâm sàng: <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    id="complaint-notes"
                    required
                    minLength={10}
                    maxLength={4000}
                    rows={4}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Nhập chi tiết quá trình kiểm tra hồ sơ bệnh án, ý kiến giải trình của bác sĩ và phương án đề xuất của CSYT..."
                    className="rounded-xl bg-white text-xs sm:text-sm"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Tối thiểu 10 ký tự</span>
                    <span className="tabular-nums">{notes.length}/4000</span>
                  </div>
                </section>
              )}

              {submitError && (
                <div role="alert" className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                  {submitError}
                </div>
              )}
            </div>

            {/* Footer hành động */}
            <DialogFooter className="flex-row items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3.5 sm:px-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={close}
                disabled={busy}
                className="rounded-xl bg-white text-xs font-semibold cursor-pointer"
              >
                Đóng
              </Button>

              {(canInvestigate || canClose || canResolve || canRespond) && (
                <Button
                  type="submit"
                  size="sm"
                  disabled={busy || ((canResolve || canRespond) && notes.trim().length < 10)}
                  className={cn(
                    'rounded-xl text-xs font-bold shadow-xs cursor-pointer',
                    canInvestigate && 'bg-primary text-white hover:bg-primary/90',
                    canResolve && 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
                    canClose && 'bg-slate-700 hover:bg-slate-800 text-white',
                    canRespond && 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  )}
                >
                  {busy ? (
                    'Đang lưu…'
                  ) : canRespond ? (
                    'Gửi kết quả xác minh'
                  ) : canInvestigate ? (
                    <>
                      <PlayCircle className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      <span>Tiếp nhận &amp; Thụ lý hồ sơ</span>
                    </>
                  ) : canClose ? (
                    <>
                      <Archive className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      <span>Đóng &amp; Lưu trữ hồ sơ</span>
                    </>
                  ) : (
                    <>
                      <Gavel className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      <span>Ban hành Phán Quyết</span>
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

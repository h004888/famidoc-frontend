'use client';

import { useCallback, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  CalendarDays,
  Eye,
  House,
  PackageCheck,
  PackageOpen,
  Pencil,
  Plus,
  RefreshCw,
  Stethoscope,
  Users,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared';
import { AdminPageNavigation } from '@/components/shared/admin-page-navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminPackagesApi, type AdminCarePackageItem, type PackageStatus, type PackageTerms } from '@/lib/api/admin-packages.api';
import { useAdminQuery } from '@/hooks/use-admin-query';
import { cn, formatCurrencyVND } from '@/lib/utils';

const statuses: Record<PackageStatus, string> = { DRAFT: 'Bản nháp', ACTIVE: 'Đang bán', DEPRECATED: 'Ngừng bán' };
const statusStyles: Record<PackageStatus, string> = {
  DRAFT: 'border-amber-200 bg-amber-50 text-amber-900',
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  DEPRECATED: 'border-slate-200 bg-slate-100 text-slate-700',
};
type CatalogStatusFilter = '' | 'ACTIVE' | 'DEPRECATED';
const statusFilters: { value: CatalogStatusFilter; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: statuses.ACTIVE },
  { value: 'DEPRECATED', label: statuses.DEPRECATED },
];
const emptyTerms: PackageTerms = {
  name: '', description: '', durationMonths: 1, priceVnd: 0, includedMembers: 1, maxMembers: 1,
  additionalMemberMonthlyPriceVnd: 0, quotaPeriod: 'PER_TERM', videoQuotaPolicy: 'FIXED',
  quotas: { homeVisits: 0, videoConsultations: 0, facilityVisits: 0 },
};
const actionLabel = { publish: 'Xuất bản', retire: 'Ngừng bán' };
type PackageAction = keyof typeof actionLabel;
const pageSize = 6;
const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal focus-visible:outline-2 focus-visible:outline-ring';

export function AdminPackagesView() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<CatalogStatusFilter>('ACTIVE');
  const [viewing, setViewing] = useState<AdminCarePackageItem | null>(null);
  const [editing, setEditing] = useState<AdminCarePackageItem | null | undefined>(undefined);
  const [decision, setDecision] = useState<{ item: AdminCarePackageItem; action: PackageAction } | null>(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState('');
  const { data, loading, error, refresh } = useAdminQuery(useCallback(
    () => adminPackagesApi.listPackages({ page, limit: pageSize, status: status || undefined }), [page, status],
  ));

  async function runDecision() {
    if (!decision || acting) return;
    const { item, action } = decision;
    setActing(true);
    setActionError('');
    try {
      if (action === 'publish') {
        await adminPackagesApi.publishPackage(item.id);
      } else {
        await adminPackagesApi.retirePackage(item.id);
      }
      toast.success('Đã cập nhật danh mục gói.');
      setDecision(null);
      refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không cập nhật được gói dịch vụ.');
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Quản lý gói dịch vụ"
        description="Quản lý giá, quyền lợi và thông tin cấu hình của các gói chăm sóc gia đình."
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        actions={<Button onClick={() => setEditing(null)}><Plus aria-hidden="true" />Tạo gói</Button>}
      />

      <section aria-labelledby="package-catalog" className="space-y-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id="package-catalog" className="text-base font-semibold text-slate-900">Danh mục gói</h2>
              {data && <span className="text-sm text-slate-600">{data.total} kết quả</span>}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCw aria-hidden="true" /> Làm mới
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Trạng thái gói" className="grid w-full grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 min-[480px]:flex min-[480px]:w-fit">
              {statusFilters.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={status === value}
                  onClick={() => { setStatus(value); setPage(1); }}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:bg-white aria-pressed:text-primary aria-pressed:shadow-sm"
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <ArrowDownWideNarrow aria-hidden="true" className="size-4" /> Giá thấp đến cao
            </span>
          </div>
        </div>

        {loading && <p role="status" className="rounded-xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-600">Đang tải danh mục…</p>}
        {error && (
          <p role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle aria-hidden="true" className="size-5 shrink-0" /> {error}
          </p>
        )}
        {data?.items.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
            <PackageOpen aria-hidden="true" className="size-8 text-slate-500" />
            <p className="text-sm font-medium text-slate-700">Không có gói phù hợp.</p>
            {status && <Button size="sm" variant="outline" onClick={() => { setStatus(''); setPage(1); }}>Xem tất cả gói</Button>}
          </div>
        )}
        {data && data.items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {data.items.map((item) => (
              <PackageCard
                key={item.id}
                item={item}
                onView={() => setViewing(item)}
                onEdit={() => setEditing(item)}
                onAction={(action) => { setActionError(''); setDecision({ item, action }); }}
              />
            ))}
          </div>
        )}
        {data && (data.total > data.limit || page > 1) && (
          <div className="rounded-xl border border-slate-200 bg-white">
            <AdminPageNavigation page={page} limit={data.limit} total={data.total} onPage={setPage} />
          </div>
        )}
      </section>

      {viewing && (
        <PackageDetailDialog
          item={viewing}
          close={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
        />
      )}

      {editing !== undefined && (
        <PackageDialog
          key={editing?.id ?? 'create'}
          item={editing}
          close={() => setEditing(undefined)}
          onSaved={() => {
            if (status) {
              setStatus('');
              setPage(1);
            }
            refresh();
          }}
        />
      )}
      <Dialog open={decision !== null} onOpenChange={(open) => { if (!open && !acting) setDecision(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decision && actionLabel[decision.action]}</DialogTitle>
            <DialogDescription>{decision?.item.name} · v{decision?.item.version}</DialogDescription>
          </DialogHeader>
          {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={acting} onClick={() => setDecision(null)}>Hủy</Button>
            <Button type="button" variant={decision?.action === 'retire' ? 'destructive' : 'default'} disabled={acting} onClick={() => void runDecision()}>{acting ? 'Đang xử lý…' : 'Xác nhận'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PackageCard({ item, onView, onEdit, onAction }: {
  item: AdminCarePackageItem;
  onView: () => void;
  onEdit: () => void;
  onAction: (action: PackageAction) => void;
}) {
  const quotas = [
    { label: 'Khám tại nhà', value: item.quotas.homeVisits, icon: House },
    { label: 'Tư vấn video', value: item.videoQuotaPolicy === 'CONTRACT' ? 'Theo hợp đồng' : item.quotas.videoConsultations, icon: Video },
    { label: 'Bác sĩ phụ trách', value: 'Bác sĩ CCHN riêng', icon: Stethoscope },
  ];

  return (
    <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-slate-200 py-0 shadow-sm">
      <CardContent className="flex-1 space-y-3 p-2.5 sm:space-y-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 sm:min-h-16">
          <div className="min-w-0 flex-1 basis-36 space-y-1">
            <h3 className="wrap-break-word text-sm font-semibold leading-snug text-slate-900 sm:text-base">{item.name}</h3>
            <p className="wrap-break-word text-xs text-slate-600">{item.code} · Phiên bản {item.version}</p>
          </div>
          <Badge variant="outline" className={cn('gap-1.5', statusStyles[item.status])}>
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {statuses[item.status]}
          </Badge>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-2 sm:p-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="min-w-0 wrap-anywhere text-base font-bold tracking-tight text-primary tabular-nums sm:text-xl">{formatCurrencyVND(item.priceVnd)}</p>
            <span className="text-xs font-medium text-slate-600">/ trọn kỳ</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-700">
            <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-4 shrink-0 text-primary" />{item.durationMonths} tháng</span>
            <span className="inline-flex items-center gap-1.5"><Users aria-hidden="true" className="size-4 shrink-0 text-primary" />{item.includedMembers} người trong giá · Tối đa {item.maxMembers}</span>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold text-slate-600">Hạn mức {item.quotaPeriod === 'PER_MONTH' ? 'mỗi tháng' : 'toàn kỳ'}</p>
          <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
            {quotas.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
                <dt className="flex items-center gap-2 text-slate-600"><Icon aria-hidden="true" className="size-4 shrink-0 text-slate-500" />{label}</dt>
                <dd className="font-semibold text-slate-900 tabular-nums">{typeof value === 'number' ? `${value} lượt` : value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </CardContent>
      <CardFooter className="flex-wrap gap-2 border-t border-slate-200 bg-slate-50/60 px-2.5 py-3 [.border-t]:pt-3 sm:px-5 [&_button]:h-auto [&_button]:min-h-8 [&_button]:max-w-full [&_button]:whitespace-normal">
        <Button type="button" size="sm" variant="outline" onClick={onView}>
          <Eye aria-hidden="true" className="size-4" />Xem
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onEdit}>
          <Pencil aria-hidden="true" className="size-4" />Sửa
        </Button>
        {item.status === 'DRAFT' && (
          <Button type="button" size="sm" onClick={() => onAction('publish')}>
            <PackageCheck aria-hidden="true" className="size-4" />{actionLabel.publish}
          </Button>
        )}
        {item.status === 'ACTIVE' && (
          <Button type="button" size="sm" variant="ghost" className="text-destructive hover:bg-red-50 hover:text-destructive" onClick={() => onAction('retire')}>
            {actionLabel.retire}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function PackageDetailDialog({
  item,
  close,
  onEdit,
}: {
  item: AdminCarePackageItem;
  close: () => void;
  onEdit: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl max-h-[calc(100dvh-2rem)] flex flex-col">
        <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4 pr-12 text-left sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg font-bold text-slate-900">{item.name}</DialogTitle>
            <Badge variant="outline" className={cn('gap-1.5', statusStyles[item.status])}>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {statuses[item.status]}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-600">
            Mã gói: <span className="font-semibold text-slate-900">{item.code}</span> · Phiên bản: <span className="font-semibold text-slate-900">v{item.version}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {/* Mô tả gói */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mô tả gói dịch vụ</h4>
            <p className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm text-slate-700 leading-relaxed">
              {item.description || 'Gói chăm sóc sức khỏe gia đình toàn diện, đồng hành cùng bác sĩ gia đình riêng theo dõi liên tục.'}
            </p>
          </div>

          {/* Biểu giá & Thời hạn */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Biểu giá &amp; Thời hạn</h4>
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-primary tabular-nums">
                  {formatCurrencyVND(item.priceVnd)}
                </span>
                <span className="text-xs font-medium text-slate-600">/ trọn kỳ {item.durationMonths} tháng</span>
                <span className="text-xs font-medium text-slate-500">
                  (~ {formatCurrencyVND(Math.round(item.priceVnd / item.durationMonths))}/tháng)
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 border-t border-blue-200/60 pt-3">
                <div className="flex items-center gap-2">
                  <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  <span>Thời hạn: <strong>{item.durationMonths} tháng</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Users aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  <span>Quy mô: <strong>{item.includedMembers} người trong giá</strong> (tối đa {item.maxMembers} người)</span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <span className="inline-flex items-center gap-1.5 text-slate-700">
                    <span className="material-symbols-outlined text-[16px] text-primary">person_add</span>
                    Phụ phí thêm người: <strong>{item.additionalMemberMonthlyPriceVnd ? `${formatCurrencyVND(item.additionalMemberMonthlyPriceVnd)}/người/tháng` : 'Miễn phí'}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quyền lợi & Hạn mức chi tiết */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Hạn mức &amp; Quyền lợi chăm sóc
              </h4>
              <span className="text-xs font-medium text-slate-500">
                Áp dụng: {item.quotaPeriod === 'PER_MONTH' ? 'Mỗi tháng' : 'Toàn kỳ'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <House aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  <span>Khám định kỳ tại nhà</span>
                </div>
                <span className="font-bold text-slate-900 tabular-nums">
                  {item.quotas.homeVisits} lượt
                </span>
              </div>

              {item.homeVisitUnitPriceVnd !== undefined && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white">
                  <div className="flex items-center gap-2.5 text-slate-700">
                    <span className="material-symbols-outlined text-[18px] text-primary">payments</span>
                    <span>Đơn giá lượt tại nhà phát sinh</span>
                  </div>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatCurrencyVND(item.homeVisitUnitPriceVnd)} / lượt
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Video aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  <span>Tư vấn video Telehealth</span>
                </div>
                <span className="font-bold text-slate-900 tabular-nums">
                  {item.videoQuotaPolicy === 'CONTRACT' ? 'Theo hợp đồng' : `${item.quotas.videoConsultations} lượt`}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Stethoscope aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  <span>Bác sĩ gia đình phụ trách</span>
                </div>
                <span className="font-semibold text-emerald-700">
                  1 Bác sĩ CCHN riêng biệt
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <span className="material-symbols-outlined text-[18px] text-primary">medical_information</span>
                  <span>Hồ sơ sức khỏe gia đình (EHR)</span>
                </div>
                <span className="font-medium text-slate-700">
                  Lưu trữ &amp; theo dõi số hóa
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <span className="material-symbols-outlined text-[18px] text-primary">support_agent</span>
                  <span>Tư vấn &amp; Hỗ trợ y tế</span>
                </div>
                <span className="font-medium text-slate-700">
                  Trực tuyến 24/7 qua ứng dụng
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
          <Button type="button" variant="outline" onClick={close}>
            Đóng
          </Button>
          <Button type="button" onClick={onEdit}>
            <Pencil aria-hidden="true" className="size-4" />
            Sửa gói này
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PackageDialog({ item, close, onSaved }: { item: AdminCarePackageItem | null; close: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<PackageTerms>(() => item ? {
    name: item.name, description: item.description ?? '', durationMonths: item.durationMonths, priceVnd: item.priceVnd,
    includedMembers: item.includedMembers, maxMembers: item.maxMembers,
    additionalMemberMonthlyPriceVnd: item.additionalMemberMonthlyPriceVnd,
    quotaPeriod: item.quotaPeriod, videoQuotaPolicy: item.videoQuotaPolicy ?? 'FIXED',
    homeVisitUnitPriceVnd: item.homeVisitUnitPriceVnd, quotas: item.quotas,
  } : emptyTerms);
  const [code, setCode] = useState(item?.code ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof PackageTerms>(key: K, value: PackageTerms[K]) => setForm((previous) => ({ ...previous, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (item) {
        await adminPackagesApi.updatePackage(item.id, form);
        toast.success('Đã lưu thay đổi gói dịch vụ.');
      } else {
        await adminPackagesApi.createPackage({ ...form, code: code.trim() });
        toast.success('Đã tạo gói dịch vụ mới.');
      }
      onSaved();
      close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được gói dịch vụ.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) close(); }}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <form className="flex max-h-[calc(100dvh-2rem)] min-w-0 flex-col" onSubmit={submit}>
          <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4 pr-12 text-left sm:px-6">
            <DialogTitle>{item ? 'Sửa gói dịch vụ' : 'Tạo gói dịch vụ'}</DialogTitle>
            <DialogDescription>Giá gói tính cho toàn bộ kỳ hạn đã chọn.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
            <fieldset className="min-w-0">
              <legend className="mb-3 text-sm font-semibold text-slate-900">Thông tin gói</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Label className="grid gap-1.5">Mã gói<Input required minLength={2} maxLength={40} pattern="[A-Z][A-Z0-9_]*" disabled={Boolean(item)} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} /></Label>
                <Label className="grid gap-1.5">Tên gói<Input required maxLength={120} value={form.name} onChange={(event) => set('name', event.target.value)} /></Label>
                <Label className="grid gap-1.5 sm:col-span-2">Mô tả<Textarea maxLength={2000} value={form.description} onChange={(event) => set('description', event.target.value)} /></Label>
              </div>
            </fieldset>

            <fieldset className="min-w-0">
              <legend className="mb-3 text-sm font-semibold text-slate-900">Kỳ hạn, giá và thành viên</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Label className="grid gap-1.5">Kỳ hạn
                  <select className={selectClass} value={form.durationMonths} onChange={(event) => {
                    const months = Number(event.target.value);
                    setForm((value) => ({ ...value, durationMonths: months, videoQuotaPolicy: months === 12 ? value.videoQuotaPolicy : 'FIXED' }));
                  }}>{[1, 3, 6, 12].map((months) => <option key={months} value={months}>{months} tháng</option>)}</select>
                </Label>
                {([
                  ['priceVnd', 'Giá trọn kỳ (VND)', 1, 9999999999],
                  ['includedMembers', 'Số người trong giá', 1, 10],
                  ['maxMembers', 'Số người tối đa', 1, 10],
                  ['additionalMemberMonthlyPriceVnd', 'Phụ phí mỗi người thêm / tháng (VND)', 0, 9999999999],
                ] as const).map(([key, label, min, max]) => (
                  <Label key={key} className="grid content-start gap-1.5 leading-snug">{label}<Input required type="number" min={min} max={max} value={form[key]} onChange={(event) => set(key, Number(event.target.value))} /></Label>
                ))}
              </div>
            </fieldset>

            <fieldset className="min-w-0">
              <legend className="mb-3 text-sm font-semibold text-slate-900">Hạn mức khám và tư vấn</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="grid content-start gap-1.5 leading-snug">Áp dụng hạn mức
                    <select className={selectClass} aria-describedby={form.quotaPeriod === 'PER_TERM' ? 'package-quota-period-help' : undefined} value={form.quotaPeriod} onChange={(event) => set('quotaPeriod', event.target.value as PackageTerms['quotaPeriod'])}>
                      <option value="PER_TERM">Toàn kỳ</option><option value="PER_MONTH">Mỗi tháng</option>
                    </select>
                  </Label>
                  {form.quotaPeriod === 'PER_TERM' && (
                    <p id="package-quota-period-help" className="text-xs leading-snug text-slate-600">
                      Số lượt bên dưới là tổng hạn mức cho cả {form.durationMonths} tháng.
                    </p>
                  )}
                </div>
                <Label className="grid content-start gap-1.5 leading-snug">Đơn giá lượt tại nhà (tùy chọn)
                  <Input type="number" min={1} max={9999999999} value={form.homeVisitUnitPriceVnd ?? ''} disabled={item?.homeVisitUnitPriceVnd !== undefined && busy} required={item?.homeVisitUnitPriceVnd !== undefined} onChange={(event) => set('homeVisitUnitPriceVnd', event.target.value ? Number(event.target.value) : undefined)} />
                </Label>
                {form.durationMonths === 12 && <Label className="grid gap-1.5 sm:col-span-2">Hạn mức video
                  <select className={selectClass} value={form.videoQuotaPolicy ?? 'FIXED'} onChange={(event) => set('videoQuotaPolicy', event.target.value as PackageTerms['videoQuotaPolicy'])}>
                    <option value="FIXED">Cố định</option><option value="CONTRACT">Chốt khi ký hợp đồng</option>
                  </select>
                </Label>}
                {([['homeVisits', 'Lượt khám tại nhà'], ['videoConsultations', 'Lượt tư vấn video']] as const).map(([key, label]) => (
                  <Label key={key} className="grid gap-1.5">{label}<Input required type="number" min={0} max={100000} value={form.quotas[key]} onChange={(event) => set('quotas', { ...form.quotas, [key]: Number(event.target.value) })} /></Label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="shrink-0 space-y-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="min-[340px]:flex-row min-[340px]:justify-end">
              <Button type="button" variant="outline" disabled={busy} onClick={close}>Hủy</Button>
              <Button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : item ? 'Lưu thay đổi' : 'Lưu bản nháp'}</Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

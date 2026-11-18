'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Handshake, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { StaffingContractItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { formatShortDate } from './contract-status-helpers';
import { B2bDocumensoSignPanel } from './b2b-documenso-sign-panel';
import { buildB2bStandardArticles } from '@/features/facility-contracts/b2b-standard-terms';

export interface StaffingDetailSheetProps {
  item: StaffingContractItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signingStaffingId: string | null;
  onRequestSign: (item: StaffingContractItem) => void;
  onRequestTerminate?: (item: StaffingContractItem) => void;
}

export function StaffingDetailSheet({
  item,
  open,
  onOpenChange,
  signingStaffingId,
  onRequestSign,
  onRequestTerminate,
}: StaffingDetailSheetProps) {
  return (
    <Sheet open={open && Boolean(item)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {item && (
          <>
            <SheetHeader className="border-b border-slate-100 pb-4">
              <SheetTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Handshake className="h-5 w-5 text-primary" aria-hidden="true" />
                <span>Chi Tiết Hợp Đồng Cung Ứng Nhân Lực B2B</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500 tabular-nums">
                Mã HĐ: <strong className="text-primary">{item.contractNumber}</strong> · Đối tác:{' '}
                <strong>{item.facilityName}</strong>
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5">
                <div>
                  <span className="block text-[11px] text-slate-500">Phân chia doanh thu</span>
                  <span className="text-sm font-bold text-primary tabular-nums">
                    {item.facilitySharePercent}% CSYT / {item.platformSharePercent}% FamiDoc
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500">Thời hạn hiệu lực</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {formatShortDate(item.validFrom)} – {formatShortDate(item.validTo)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-[11px] sm:grid-cols-2">
                <div
                  className={cn(
                    'rounded-xl border p-3',
                    item.adminSigned
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {item.adminSigned ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>Ban Quản Trị Hệ Thống</span>
                  </div>
                  <p className="mt-1 text-[11px] opacity-90">
                    {item.adminSigned ? 'Đã ký số (Bước 2)' : item.facilitySigned ? 'Đến lượt Admin ký' : 'Chờ CSYT ký trước'}
                  </p>
                </div>

                <div
                  className={cn(
                    'rounded-xl border p-3',
                    item.facilitySigned
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {item.facilitySigned ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>Cơ Sở Y Tế Đối Tác</span>
                  </div>
                  <p className="mt-1 text-[11px] opacity-90">
                    {item.facilitySigned ? 'Đã ký số (Bước 1)' : 'Đang chờ CSYT ký'}
                  </p>
                </div>
              </div>

              {item.revisionReason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                  <strong className="block font-bold">Lý do CSYT yêu cầu chỉnh sửa:</strong>
                  <p className="mt-1">{item.revisionReason}</p>
                </div>
              )}

              {item.terminationRequestStatus === 'PENDING' && item.terminationRequestReason && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                  <strong className="block font-bold">CSYT đề nghị chấm dứt hợp đồng đang hiệu lực:</strong>
                  <p className="mt-1">{item.terminationRequestReason}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Khung điều khoản B2B chuẩn (10 Điều)
                  </p>
                  <span className="text-[10px] font-medium text-slate-500">
                    Luật GDĐT 20/2023/QH15
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 text-xs leading-relaxed text-slate-600">
                  {buildB2bStandardArticles({
                    facilitySharePercent: item.facilitySharePercent,
                    platformSharePercent: item.platformSharePercent,
                    endDateText: formatShortDate(item.validTo),
                  }).map((art) => (
                    <div key={art.title}>
                      <p className="font-semibold text-slate-800">{art.title}</p>
                      <p className="text-[11px] text-slate-600">{art.body}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Điều khoản bổ sung / Thỏa thuận đặc thù
                  </p>
                  <p className="whitespace-pre-wrap text-slate-600">
                    {item.contractTerms?.trim() || 'Không có thỏa thuận bổ sung nào khác.'}
                  </p>
                </div>
              </div>
            </div>

            <SheetFooter className="flex-row flex-wrap gap-2 border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </Button>
              {item.status === 'DRAFT' && !item.facilitySigned && (
                <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold">
                  <Link href={`/admin/contracts/${item.id}/edit?type=staffing`}>Chỉnh sửa điều khoản</Link>
                </Button>
              )}
              {item.status !== 'TERMINATED' && onRequestTerminate && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => onRequestTerminate(item)}
                  className="rounded-xl text-xs font-semibold cursor-pointer gap-1"
                >
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{item.status === 'DRAFT' ? 'Hủy dự thảo' : 'Chấm dứt hợp đồng'}</span>
                </Button>
              )}
              {(item.rawStatus === 'PENDING_ADMIN_SIGNATURE' ||
                (item.status === 'DRAFT' && item.facilitySigned && !item.adminSigned)) && (
                <Button
                  type="button"
                  size="sm"
                  disabled={signingStaffingId === item.id}
                  onClick={() => onRequestSign(item)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                >
                  {signingStaffingId === item.id ? 'Đang ký số...' : 'Ký Duyệt (Documenso)'}
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export interface StaffingSignConfirmDialogProps {
  item: StaffingContractItem | null;
  signerRole?: 'FACILITY' | 'ADMIN';
  isSigning?: boolean;
  onClose: () => void;
  onConfirm?: (contractId: string) => Promise<void>;
  onSynced?: () => void;
}

export function StaffingSignConfirmDialog({
  item,
  signerRole = 'ADMIN',
  onClose,
  onSynced,
}: StaffingSignConfirmDialogProps) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 sm:max-w-3xl">
        {item && (
          <>
            <DialogHeader className="border-b border-slate-100 pb-3">
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                <span>
                  {signerRole === 'FACILITY'
                    ? 'Ký Hợp Đồng B2B Trên Documenso — Cơ sở Y tế (Bước 1)'
                    : 'Ký Hợp Đồng B2B Trên Documenso — Quản trị viên Nền tảng (Bước 2)'}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 tabular-nums">
                Mã HĐ: <strong className="text-primary">{item.contractNumber}</strong> · Đối tác:{' '}
                <strong>{item.facilityName}</strong> ({item.facilitySharePercent}% CSYT /{' '}
                {item.platformSharePercent}% FamiDoc · {formatShortDate(item.validFrom)} –{' '}
                {formatShortDate(item.validTo)})
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div
                className={`rounded-xl border p-2.5 ${
                  item.facilitySigned
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                <strong className="block">Bước 1: Cơ sở Y tế đối tác</strong>
                <div className="mt-0.5">
                  {item.facilitySigned ? 'Đã ký số' : 'Chờ CSYT ký trước'}
                </div>
              </div>
              <div
                className={`rounded-xl border p-2.5 ${
                  item.adminSigned
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : item.facilitySigned
                      ? 'border-blue-200 bg-blue-50 text-blue-900'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <strong className="block">Bước 2: Quản trị viên FamiDoc</strong>
                <div className="mt-0.5">
                  {item.adminSigned ? 'Đã ký số' : item.facilitySigned ? 'Tới lượt Admin ký' : 'Chờ CSYT ký trước'}
                </div>
              </div>
            </div>

            <B2bDocumensoSignPanel
              contractId={item.id}
              onSyncCompleted={() => {
                onSynced?.();
                onClose();
              }}
            />

            <DialogFooter className="border-t border-slate-100 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Đóng
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

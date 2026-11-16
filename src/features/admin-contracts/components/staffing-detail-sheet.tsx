'use client';

import React from 'react';
import { CheckCircle2, Clock, Handshake, ShieldCheck } from 'lucide-react';
import type { StaffingContractItem } from '@/lib/api';
import { ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
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

export interface StaffingDetailSheetProps {
  item: StaffingContractItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signingStaffingId: string | null;
  onRequestSign: (item: StaffingContractItem) => void;
}

export function StaffingDetailSheet({
  item,
  open,
  onOpenChange,
  signingStaffingId,
  onRequestSign,
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
                    {item.adminSigned ? 'Đã ký số SmartCA (Bên D)' : 'Chưa hoàn tất ký số'}
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
                    {item.facilitySigned ? 'Đã ký số SmartCA' : 'Đang chờ CSYT ký'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Điều khoản pháp lý hợp tác
                </p>
                <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-3.5 text-xs leading-relaxed text-slate-600">
                  {item.contractTerms ||
                    'Điều khoản chuẩn theo Nghị định 130/2018/NĐ-CP và Thông tư 04/2022/TT-BYT.'}
                </div>
              </div>
            </div>

            <SheetFooter className="gap-2 border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </Button>
              {item.status === 'DRAFT' && !item.adminSigned && (
                <Button
                  type="button"
                  size="sm"
                  disabled={signingStaffingId === item.id}
                  onClick={() => onRequestSign(item)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                >
                  {signingStaffingId === item.id ? 'Đang ký số...' : 'Ký Duyệt (SmartCA)'}
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
  isSigning: boolean;
  onClose: () => void;
  onConfirm: (contractId: string) => Promise<void>;
}

export function StaffingSignConfirmDialog({
  item,
  isSigning,
  onClose,
  onConfirm,
}: StaffingSignConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={Boolean(item)}
      onOpenChange={(open) => !open && onClose()}
      title="Xác nhận ký số SmartCA Hợp đồng B2B"
      description="Hành động ký số điện tử có giá trị pháp lý và không thể hoàn tác. Vui lòng kiểm tra thông tin trước khi xác nhận."
      headerIcon={<ShieldCheck className="h-6 w-6 text-emerald-600" aria-hidden="true" />}
      confirmLabel="Xác nhận Ký SmartCA"
      cancelLabel="Hủy bỏ"
      isLoading={isSigning}
      onConfirm={() => {
        if (item) {
          void onConfirm(item.id);
        }
      }}
    >
      {item && (
        <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Mã hợp đồng:</span>
            <strong className="text-primary tabular-nums">{item.contractNumber}</strong>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Đối tác CSYT:</span>
            <strong className="text-slate-900 text-right">{item.facilityName}</strong>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Phân chia doanh thu:</span>
            <strong className="text-slate-900 tabular-nums">
              {item.facilitySharePercent}% CSYT / {item.platformSharePercent}% FamiDoc
            </strong>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Hiệu lực:</span>
            <strong className="text-slate-900 tabular-nums">
              {formatShortDate(item.validFrom)} – {formatShortDate(item.validTo)}
            </strong>
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}

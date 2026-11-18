'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import {
  contractsApi,
  extractErrorMessage,
  type StaffingContractItem,
  type StaffingTerminationImpactDto,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface StaffingTerminationDialogProps {
  contract: StaffingContractItem | null;
  onClose: () => void;
  onTerminated: () => void;
}

export function StaffingTerminationDialog({
  contract,
  onClose,
  onTerminated,
}: StaffingTerminationDialogProps) {
  const [impact, setImpact] = useState<StaffingTerminationImpactDto | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [reason, setReason] = useState('');
  const [force, setForce] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isPreActivation = contract ? contract.status === 'DRAFT' : false;

  useEffect(() => {
    if (!contract) {
      setImpact(null);
      setReason('');
      setForce(false);
      setHandoverNotes('');
      return;
    }
    if (contract.status === 'DRAFT') {
      setImpact(null);
      return;
    }

    let active = true;
    setLoadingImpact(true);
    contractsApi
      .getStaffingTerminationImpact(contract.id)
      .then((res) => {
        if (active) setImpact(res);
      })
      .catch((err) => {
        if (active) {
          toast.error(extractErrorMessage(err, 'Không thể kiểm tra mức độ ảnh hưởng vận hành.'));
        }
      })
      .finally(() => {
        if (active) setLoadingImpact(false);
      });

    return () => {
      active = false;
    };
  }, [contract]);

  const hasBlocking = Boolean(impact?.hasBlockingDependencies);
  const canSubmit =
    reason.trim().length >= 5 &&
    !loadingImpact &&
    (!hasBlocking || (force && handoverNotes.trim().length > 0));

  const handleConfirm = async () => {
    if (!contract || !canSubmit) return;
    setSubmitting(true);
    try {
      await contractsApi.terminateStaffingContract(contract.id, {
        reason: reason.trim(),
        ...(hasBlocking ? { force, handoverNotes: handoverNotes.trim() } : {}),
      });
      toast.success(
        isPreActivation
          ? `Đã hủy dự thảo hợp đồng B2B ${contract.contractNumber}.`
          : `Đã chấm dứt hợp đồng B2B ${contract.contractNumber} và lưu hồ sơ bàn giao.`
      );
      onTerminated();
      onClose();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể chấm dứt hợp đồng B2B.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={Boolean(contract)} onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 sm:max-w-lg">
        {contract && (
          <>
            <DialogHeader>
              <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {isPreActivation
                  ? `Hủy dự thảo Hợp đồng B2B (${contract.contractNumber})`
                  : `Chấm dứt Hợp đồng B2B đang hiệu lực (${contract.contractNumber})`}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Đối tác: <strong className="text-slate-800">{contract.facilityName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              {contract.terminationRequestStatus === 'PENDING' && contract.terminationRequestReason && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
                  <strong className="block font-semibold">Đề nghị chấm dứt từ phía CSYT:</strong>
                  <p className="mt-1">{contract.terminationRequestReason}</p>
                </div>
              )}

              {!isPreActivation && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="font-bold text-slate-800">Kiểm tra ràng buộc vận hành &amp; tài chính</div>
                  {loadingImpact ? (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang quét hợp đồng 4 bên, lịch khám, quyết toán &amp; bác sĩ...</span>
                    </div>
                  ) : impact ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 tabular-nums">
                        <div className="rounded-lg bg-white p-2 border border-slate-200">
                          <span className="text-slate-500 block">HĐ 4 bên ACTIVE</span>
                          <strong className={impact.activeMedicalContracts > 0 ? 'text-rose-700' : 'text-slate-800'}>
                            {impact.activeMedicalContracts}
                          </strong>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-slate-200">
                          <span className="text-slate-500 block">Lịch khám đang mở</span>
                          <strong className={impact.openEncounters > 0 ? 'text-rose-700' : 'text-slate-800'}>
                            {impact.openEncounters}
                          </strong>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-slate-200">
                          <span className="text-slate-500 block">Kỳ quyết toán chờ trả</span>
                          <strong>{impact.unsettledSettlements}</strong>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-slate-200">
                          <span className="text-slate-500 block">Bác sĩ trực thuộc</span>
                          <strong>{impact.activeOrOnboardingDoctors}</strong>
                        </div>
                      </div>

                      {impact.warnings.length > 0 ? (
                        <div className="space-y-1 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-900">
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                            <span>Cảnh báo phụ thuộc đang hoạt động:</span>
                          </div>
                          <ul className="list-disc pl-5 space-y-0.5">
                            {impact.warnings.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="font-medium text-emerald-700">
                          Không có hợp đồng 4 bên hay lịch khám ràng buộc. Có thể chấm dứt an toàn.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="terminate-b2b-reason" className="text-xs font-semibold">
                  Lý do {isPreActivation ? 'hủy dự thảo' : 'chấm dứt hợp đồng'} <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="terminate-b2b-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập tối thiểu 5 ký tự..."
                  className="text-xs"
                />
              </div>

              {hasBlocking && (
                <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={force}
                      onCheckedChange={(v) => setForce(Boolean(v))}
                    />
                    <span className="text-xs font-semibold text-rose-900">
                      Cưỡng chế chấm dứt khẩn cấp dù còn hợp đồng 4 bên / lịch khám đang mở
                    </span>
                  </label>

                  {force && (
                    <div className="space-y-1">
                      <Label htmlFor="terminate-handover-notes" className="text-xs font-semibold text-rose-900">
                        Phương án bàn giao bệnh nhân &amp; quyết toán <span className="text-rose-500">*</span>
                      </Label>
                      <Textarea
                        id="terminate-handover-notes"
                        rows={2}
                        value={handoverNotes}
                        onChange={(e) => setHandoverNotes(e.target.value)}
                        placeholder="Ghi rõ cơ sở y tế tiếp nhận bàn giao và kế hoạch chi trả phần quyết toán còn lại..."
                        className="bg-white text-xs"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={onClose}
              >
                Đóng
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={!canSubmit || submitting}
                onClick={() => void handleConfirm()}
                className="cursor-pointer font-bold"
              >
                {submitting
                  ? 'Đang xử lý...'
                  : isPreActivation
                    ? 'Xác nhận hủy dự thảo'
                    : 'Xác nhận chấm dứt hợp đồng'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

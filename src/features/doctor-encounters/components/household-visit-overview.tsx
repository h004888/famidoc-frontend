'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  Loader2,
  UserCheck,
  UserX,
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { EncounterItem, EncounterPatient } from '@/lib/api/encounters.api';
import { formatEncounterTime } from '@/lib/encounter-dual-lane';

export interface HouseholdVisitOverviewProps {
  encounter: EncounterItem;
  members: EncounterPatient[];
  isOverdue: boolean;
  isLocked?: boolean;
  beforeStartMessage?: string | null;
  completing?: boolean;
  onStartExam: (patientId: string) => void;
  onChangeAttendance: (
    patientId: string,
    next: 'PLANNED' | 'ABSENT',
    absenceReason?: string,
  ) => Promise<void>;
  onCompleteVisit: (lateCompletionReason?: string) => Promise<void>;
}

function formatAllergies(allergies: EncounterPatient['allergies']): string[] {
  if (!Array.isArray(allergies)) return [];
  return allergies
    .map((item) => (typeof item === 'string' ? item : item?.allergen))
    .filter((item): item is string => Boolean(item && item.trim()));
}

function formatChronicDiseases(chronic: EncounterPatient['chronicDiseases']): string[] {
  if (!chronic) return [];
  if (Array.isArray(chronic)) {
    return chronic.map((c) => String(c).trim()).filter(Boolean);
  }
  return String(chronic)
    .split(/[,;]/)
    .map((c) => c.trim())
    .filter(Boolean);
}

function attendanceLabel(
  status: 'PLANNED' | 'EXAMINED' | 'ABSENT',
  absenceReason?: string | null,
): string {
  if (status === 'ABSENT') {
    return absenceReason ? `Vắng — ${absenceReason}` : 'Vắng mặt';
  }
  if (status === 'EXAMINED') return 'Đã chốt hồ sơ';
  return 'Chờ khám';
}

export function HouseholdVisitOverview({
  encounter,
  members,
  isOverdue,
  isLocked = false,
  beforeStartMessage = null,
  completing = false,
  onStartExam,
  onChangeAttendance,
  onCompleteVisit,
}: HouseholdVisitOverviewProps) {
  const [validationAlert, setValidationAlert] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lateReason, setLateReason] = useState('');
  const [lateReasonError, setLateReasonError] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const [absentPatientId, setAbsentPatientId] = useState<string | null>(null);
  const [absenceReason, setAbsenceReason] = useState('');
  const [absenceError, setAbsenceError] = useState<string | null>(null);
  const [pendingAttendanceIds, setPendingAttendanceIds] = useState<Record<string, boolean>>({});
  const [attendanceErrors, setAttendanceErrors] = useState<Record<string, string>>({});

  const memberRows = useMemo(() => {
    const participants = encounter.participants ?? [];
    const emrs = encounter.clinicalEmrs ?? [];

    return members.map((member) => {
      const participant = participants.find((p) => p.patientId === member.id);
      const emr = emrs.find((e) => e.patientId === member.id);
      const attendanceStatus = participant?.attendanceStatus ?? 'PLANNED';
      const isFinalized = Boolean(emr?.isFinalized);
      const isDraft = Boolean(emr && !emr.isFinalized);
      const allergies = formatAllergies(member.allergies);
      const chronicDiseases = formatChronicDiseases(member.chronicDiseases);

      return {
        member,
        attendanceStatus,
        absenceReason: participant?.absenceReason ?? null,
        isFinalized,
        isDraft,
        allergies,
        chronicDiseases,
      };
    });
  }, [encounter.clinicalEmrs, encounter.participants, members]);

  const pendingAttendance = useMemo(
    () =>
      memberRows.filter(
        (row) => row.attendanceStatus === 'PLANNED' && !row.isFinalized,
      ),
    [memberRows],
  );

  const unfinalizedExamined = useMemo(() => {
    return memberRows.filter(
      (row) => row.attendanceStatus === 'EXAMINED' && !row.isFinalized,
    );
  }, [memberRows]);

  const examinedFinalizedCount = useMemo(() => {
    return memberRows.filter(
      (row) => row.attendanceStatus === 'EXAMINED' && row.isFinalized,
    ).length;
  }, [memberRows]);

  const runAttendanceChange = async (
    patientId: string,
    next: 'PLANNED' | 'ABSENT',
    reason?: string,
  ) => {
    if (pendingAttendanceIds[patientId]) return;
    setPendingAttendanceIds((prev) => ({ ...prev, [patientId]: true }));
    setAttendanceErrors((prev) => {
      const copy = { ...prev };
      delete copy[patientId];
      return copy;
    });
    try {
      if (reason !== undefined) {
        await onChangeAttendance(patientId, next, reason);
      } else {
        await onChangeAttendance(patientId, next);
      }
      setAbsenceReason('');
      setAbsenceError(null);
    } catch (err) {
      setAttendanceErrors((prev) => ({
        ...prev,
        [patientId]:
          err instanceof Error && err.message
            ? err.message
            : 'Không thể cập nhật điểm danh.',
      }));
    } finally {
      setAbsentPatientId(null);
      setPendingAttendanceIds((prev) => ({ ...prev, [patientId]: false }));
    }
  };

  const handleConfirmAbsent = async () => {
    if (!absentPatientId) return;
    const trimmed = absenceReason.trim();
    if (trimmed.length < 3) {
      setAbsenceError('Vui lòng nhập lý do vắng (ít nhất 3 ký tự).');
      return;
    }
    await runAttendanceChange(absentPatientId, 'ABSENT', trimmed);
  };

  const handleRequestComplete = () => {
    if (pendingAttendance.length > 0) {
      setValidationAlert(
        `Còn ${pendingAttendance.length} thành viên chưa điểm danh (khám hoặc vắng).`,
      );
      return;
    }
    if (examinedFinalizedCount === 0) {
      setValidationAlert(
        'Vẫn còn thành viên chưa chốt hồ sơ: Cần ít nhất 1 thành viên được khám và chốt hồ sơ trước khi hoàn tất.',
      );
      return;
    }
    if (unfinalizedExamined.length > 0) {
      const names = unfinalizedExamined.map((r) => r.member.fullName).join(', ');
      setValidationAlert(`Vẫn còn thành viên chưa chốt hồ sơ: ${names}.`);
      return;
    }
    setValidationAlert(null);
    setLateReasonError(null);
    setCompleteError(null);
    setConfirmOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (isOverdue && !lateReason.trim()) {
      setLateReasonError('Vui lòng nhập lý do nộp hồ sơ trễ.');
      return;
    }
    setLateReasonError(null);
    setCompleteError(null);
    try {
      await onCompleteVisit(isOverdue ? lateReason.trim() : undefined);
      setConfirmOpen(false);
    } catch (err) {
      setCompleteError(
        err instanceof Error && err.message
          ? err.message
          : 'Không thể hoàn tất ca khám.',
      );
    }
  };

  const familyName =
    encounter.contract?.familyUnit?.familyName ||
    encounter.contract?.familyRepresentativeName ||
    'Hộ gia đình';
  const homeAddress =
    encounter.contract?.familyUnit?.homeAddress ||
    encounter.contract?.familyUnit?.address ||
    'Tại nhà bệnh nhân';

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5 border border-slate-200 bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200">
                <Home className="w-3.5 h-3.5 mr-1" />
                Khám tại nhà
              </Badge>
              {encounter.familyConfirmedArrivalAt ? (
                <Badge className="bg-emerald-600 text-white">
                  Gia đình đã xác nhận có mặt
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                  Chờ gia đình xác nhận
                </Badge>
              )}
              {isOverdue && <Badge variant="destructive">Quá hạn hồ sơ</Badge>}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{familyName}</h2>
            <p className="text-xs text-slate-600">
              {homeAddress} · Giờ hẹn: {formatEncounterTime(encounter.scheduledTime) || 'Trong ca'}
            </p>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">
            <div className="font-semibold text-slate-900">Tiến độ hồ sơ hộ gia đình</div>
            <div className="tabular-nums">
              Đã chốt: <strong>{examinedFinalizedCount}</strong> / {memberRows.filter((r) => r.attendanceStatus !== 'ABSENT').length} thành viên
            </div>
          </div>
        </div>
      </Card>

      {validationAlert && (
        <div
          role="alert"
          className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>{validationAlert}</div>
        </div>
      )}

      <Card className="overflow-hidden border border-slate-200 bg-white">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Danh sách thành viên hộ gia đình ({memberRows.length})
          </h3>
          <span className="text-xs text-slate-500">
            Chọn từng thành viên để khám &amp; chốt hồ sơ
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40 text-slate-500">
                <th className="py-3 px-4 font-semibold">Thành viên</th>
                <th className="py-3 px-4 font-semibold">Dị ứng &amp; Bệnh nền</th>
                <th className="py-3 px-4 font-semibold">Tham gia</th>
                <th className="py-3 px-4 font-semibold">Trạng thái hồ sơ</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memberRows.map(
                ({
                  member,
                  attendanceStatus,
                  absenceReason: memberAbsenceReason,
                  isFinalized,
                  isDraft,
                  allergies,
                  chronicDiseases,
                }) => {
                  const isPending = Boolean(pendingAttendanceIds[member.id]);
                  const rowError = attendanceErrors[member.id];
                  const examDisabled =
                    Boolean(beforeStartMessage) && !isFinalized && !isLocked;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {member.fullName}
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        {allergies.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {allergies.map((a) => (
                              <Badge key={a} variant="destructive" className="text-[10px]">
                                Dị ứng: {a}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {chronicDiseases.length > 0 ? (
                          <div className="text-slate-600">{chronicDiseases.join(', ')}</div>
                        ) : allergies.length === 0 ? (
                          <span className="text-slate-400">Chưa ghi nhận tiền sử</span>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={
                                attendanceStatus === 'ABSENT'
                                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                                  : 'bg-sky-50 text-sky-800 border-sky-200'
                              }
                            >
                              {attendanceLabel(attendanceStatus, memberAbsenceReason)}
                            </Badge>
                            {!isFinalized && !isLocked && attendanceStatus !== 'EXAMINED' && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isPending}
                                className="h-6 px-2 text-[11px]"
                                onClick={() => {
                                  if (attendanceStatus === 'ABSENT') {
                                    void runAttendanceChange(member.id, 'PLANNED');
                                  } else {
                                    setAbsentPatientId(member.id);
                                    setAbsenceReason('');
                                    setAbsenceError(null);
                                  }
                                }}
                              >
                                {isPending && (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                )}
                                {attendanceStatus === 'ABSENT' ? (
                                  <>
                                    <UserCheck className="w-3 h-3 mr-1" /> Hoàn tác vắng
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3 h-3 mr-1" /> Đánh dấu vắng
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          {rowError && (
                            <p className="text-[11px] font-medium text-rose-600">{rowError}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isFinalized ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ✓ Đã chốt hồ sơ
                          </span>
                        ) : isDraft ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                            <Clock className="w-3.5 h-3.5" />
                            Đang ghi (Nháp)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <FileText className="w-3.5 h-3.5" />
                            Chưa ghi nhận
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {attendanceStatus !== 'ABSENT' && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={examDisabled}
                            variant={isFinalized ? 'outline' : 'default'}
                            onClick={() => onStartExam(member.id)}
                            className="h-8 text-xs rounded-lg"
                          >
                            {isFinalized || isLocked ? 'Xem hồ sơ' : 'Khám'}
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {memberRows.map(
            ({
              member,
              attendanceStatus,
              absenceReason: memberAbsenceReason,
              isFinalized,
              isDraft,
              allergies,
              chronicDiseases,
            }) => {
              const isPending = Boolean(pendingAttendanceIds[member.id]);
              const rowError = attendanceErrors[member.id];
              const examDisabled =
                Boolean(beforeStartMessage) && !isFinalized && !isLocked;

              return (
                <div key={`mobile-${member.id}`} className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-sm text-slate-900">{member.fullName}</div>
                    <Badge variant="outline" className="text-[10px]">
                      {attendanceLabel(attendanceStatus, memberAbsenceReason)}
                    </Badge>
                  </div>
                  <div className="font-semibold text-slate-700">
                    {isFinalized
                      ? '✓ Đã chốt hồ sơ'
                      : isDraft
                        ? 'Đang ghi (Nháp)'
                        : 'Chưa ghi nhận'}
                  </div>
                  {(allergies.length > 0 || chronicDiseases.length > 0) && (
                    <div className="text-slate-600 space-y-1">
                      {allergies.length > 0 && (
                        <div className="text-rose-700 font-semibold">
                          Dị ứng: {allergies.join(', ')}
                        </div>
                      )}
                      {chronicDiseases.length > 0 && (
                        <div>Bệnh nền: {chronicDiseases.join(', ')}</div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {!isFinalized && !isLocked && attendanceStatus !== 'EXAMINED' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        className="h-8 text-xs"
                        onClick={() => {
                          if (attendanceStatus === 'ABSENT') {
                            void runAttendanceChange(member.id, 'PLANNED');
                          } else {
                            setAbsentPatientId(member.id);
                            setAbsenceReason('');
                            setAbsenceError(null);
                          }
                        }}
                      >
                        {attendanceStatus === 'ABSENT'
                          ? 'Hoàn tác vắng'
                          : 'Đánh dấu vắng'}
                      </Button>
                    )}
                    {attendanceStatus !== 'ABSENT' && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={examDisabled}
                        onClick={() => onStartExam(member.id)}
                        className="h-8 text-xs ml-auto"
                      >
                        {isFinalized || isLocked ? 'Xem hồ sơ' : 'Khám'}
                      </Button>
                    )}
                  </div>
                  {rowError && (
                    <p className="text-[11px] font-medium text-rose-600">{rowError}</p>
                  )}
                </div>
              );
            },
          )}
        </div>
      </Card>

      {!isLocked && (
        <div className="flex flex-col items-end gap-2 pt-2">
          {pendingAttendance.length > 0 && (
            <p className="text-xs font-medium text-amber-800">
              Còn {pendingAttendance.length} thành viên chưa điểm danh
            </p>
          )}
          <Button
            type="button"
            size="lg"
            disabled={completing || pendingAttendance.length > 0}
            onClick={handleRequestComplete}
            className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            ✓ Hoàn tất ca khám cho cả gia đình
          </Button>
        </div>
      )}

      {/* Dialog nhập lý do vắng */}
      <Dialog
        open={Boolean(absentPatientId)}
        onOpenChange={(open) => {
          if (!open) setAbsentPatientId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đánh dấu thành viên vắng mặt</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do vắng mặt (tối thiểu 3 ký tự).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="absence-reason-input">Lý do vắng</Label>
            <Input
              id="absence-reason-input"
              value={absenceReason}
              onChange={(e) => {
                setAbsenceReason(e.target.value);
                if (absenceError) setAbsenceError(null);
              }}
              placeholder="Ví dụ: Đi công tác"
            />
            {absenceError && (
              <p className="text-xs font-semibold text-rose-600">{absenceError}</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAbsentPatientId(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={
                absentPatientId ? Boolean(pendingAttendanceIds[absentPatientId]) : false
              }
              onClick={handleConfirmAbsent}
            >
              Xác nhận vắng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog hoàn tất */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hoàn tất ca khám tại nhà</DialogTitle>
            <DialogDescription>
              Sau khi hoàn tất, bệnh án và đơn thuốc của {examinedFinalizedCount} thành viên sẽ được gửi tới gia đình.
            </DialogDescription>
          </DialogHeader>

          {isOverdue && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="late-completion-reason" className="text-xs font-bold text-rose-700">
                Lý do nộp hồ sơ trễ (bắt buộc do quá 23:59 ngày khám) *
              </Label>
              <Textarea
                id="late-completion-reason"
                value={lateReason}
                onChange={(e) => {
                  setLateReason(e.target.value);
                  if (lateReasonError) setLateReasonError(null);
                }}
                placeholder="Nhập lý do nộp hồ sơ trễ..."
                rows={3}
              />
              {lateReasonError && (
                <p className="text-xs font-semibold text-rose-600">{lateReasonError}</p>
              )}
            </div>
          )}

          {completeError && (
            <p role="alert" className="text-xs font-semibold text-rose-600">
              {completeError}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Hủy
            </Button>
            <Button type="button" disabled={completing} onClick={handleConfirmComplete}>
              Xác nhận hoàn tất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

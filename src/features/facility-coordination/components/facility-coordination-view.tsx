'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdminDisputesView } from '@/features/admin-disputes/components/admin-disputes-view';
import {
  doctorsApi,
  encountersApi,
  type DoctorProfileDto,
  type DoctorShiftItem,
  type EncounterItem,
} from '@/lib/api';
import {
  extractEncounterTimeHm,
  formatEncounterDateVi,
  getEncounterStatusLabel,
  getEncounterTypeLabel,
  getTodayIsoDate,
} from '@/lib/utils/encounter-format';

const SHIFT_TYPES = [
  { value: 'MORNING_CLINIC', label: 'Ca sáng nội viện (07:30 - 11:30)', start: '07:30', end: '11:30' },
  { value: 'AFTERNOON_CLINIC', label: 'Ca chiều nội viện (13:30 - 17:30)', start: '13:30', end: '17:30' },
  { value: 'NIGHT_DUTY', label: 'Trực đêm (18:00 - 22:00)', start: '18:00', end: '22:00' },
  { value: 'EMERGENCY', label: 'Trực cấp cứu', start: '08:00', end: '16:00' },
];

export function FacilityCoordinationView() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'complaints'>('schedule');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dutyShifts, setDutyShifts] = useState<DoctorShiftItem[]>([]);
  const [externalEncounters, setExternalEncounters] = useState<EncounterItem[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfileDto[]>([]);

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftError, setShiftError] = useState('');
  const [shiftForm, setShiftForm] = useState({
    doctorId: '',
    shiftDate: getTodayIsoDate(),
    shiftType: 'MORNING_CLINIC',
    startTime: '07:30',
    endTime: '11:30',
    notes: '',
  });

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [boardRes, doctorsRes] = await Promise.all([
        encountersApi.getFacilityScheduleBoard({
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        }),
        doctorsApi.getFacilityDoctors().catch(() => [] as DoctorProfileDto[]),
      ]);

      setDutyShifts(boardRes.dutyShifts || []);
      setExternalEncounters(boardRes.externalEncounters || []);
      setDoctors(doctorsRes || []);

      if (doctorsRes.length > 0) {
        setShiftForm((prev) => ({
          ...prev,
          doctorId: prev.doctorId || doctorsRes[0].id,
        }));
      }
    } catch (err: any) {
      setLoadError(err?.message || 'Không thể tải bảng điều phối ca trực và lịch khám.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const conflictEncounters = useMemo(
    () => externalEncounters.filter((e) => Boolean(e.conflictAlert)),
    [externalEncounters]
  );

  const handleShiftTypeChange = (value: string) => {
    const preset = SHIFT_TYPES.find((s) => s.value === value);
    setShiftForm((prev) => ({
      ...prev,
      shiftType: value,
      startTime: preset?.start || prev.startTime,
      endTime: preset?.end || prev.endTime,
    }));
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.doctorId) {
      setShiftError('Vui lòng chọn bác sĩ trực thuộc CSYT.');
      return;
    }
    if (shiftForm.startTime >= shiftForm.endTime) {
      setShiftError('Giờ bắt đầu ca trực phải trước giờ kết thúc.');
      return;
    }

    setSubmitting(true);
    setShiftError('');
    try {
      await encountersApi.createDoctorShift({
        doctorId: shiftForm.doctorId,
        shiftDate: shiftForm.shiftDate,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        shiftType: shiftForm.shiftType,
        notes: shiftForm.notes.trim() || undefined,
      });
      toast.success('Đã phân ca trực nội viện cho bác sĩ thành công.');
      setShowShiftModal(false);
      setShiftForm((prev) => ({ ...prev, notes: '' }));
      await loadBoard();
    } catch (err: any) {
      setShiftError(err?.message || 'Không thể tạo ca trực cho bác sĩ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Giám sát Ca trực Nội viện &amp; Lịch khám Ngoại viện
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Cập nhật lịch trực nội viện của bác sĩ và theo dõi đồng thời lịch khám gia đình ngoại viện để phát hiện sớm xung đột lịch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bảng ca trực &amp; Lịch khám
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('complaints')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'complaints'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khiếu nại SLA
            </button>
          </div>

          {activeTab === 'schedule' && (
            <Button
              type="button"
              onClick={() => {
                setShiftError('');
                setShowShiftModal(true);
              }}
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Phân ca trực nội viện</span>
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {loadError && (
            <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
              <span>{loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={loadBoard}>
                Thử lại
              </Button>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white p-5 rounded-2xl border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Ca trực nội viện</span>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">{dutyShifts.length}</div>
            </Card>
            <Card className="bg-white p-5 rounded-2xl border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Lịch khám ngoại viện</span>
              <div className="text-2xl font-bold text-primary tabular-nums">{externalEncounters.length}</div>
            </Card>
            <Card className="bg-white p-5 rounded-2xl border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Cảnh báo xung đột lịch</span>
              <div className="text-2xl font-bold text-rose-600 tabular-nums">{conflictEncounters.length}</div>
            </Card>
          </div>

          {/* Date Filter Bar */}
          <Card className="bg-white p-4 rounded-2xl border-slate-200 shadow-xs flex flex-wrap items-end gap-4">
            <div className="space-y-1 text-xs">
              <Label htmlFor="board-from" className="font-semibold text-slate-700">Từ ngày</Label>
              <Input
                id="board-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 rounded-xl tabular-nums"
              />
            </div>
            <div className="space-y-1 text-xs">
              <Label htmlFor="board-to" className="font-semibold text-slate-700">Đến ngày</Label>
              <Input
                id="board-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 rounded-xl tabular-nums"
              />
            </div>
            {(fromDate || toDate) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="rounded-xl text-xs"
              >
                Xóa bộ lọc ngày
              </Button>
            )}
          </Card>

          {/* Conflict Alert Banner */}
          {conflictEncounters.length > 0 && (
            <Card className="bg-rose-50/70 p-5 rounded-2xl border-2 border-rose-300 space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <span className="material-symbols-outlined text-rose-600">warning</span>
                <span>Phát hiện {conflictEncounters.length} lịch khám ngoại viện trùng với ca trực nội viện</span>
              </div>
              <div className="space-y-2">
                {conflictEncounters.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-white border border-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <strong className="text-slate-900">
                        {c.doctor?.user?.name || c.doctor?.doctorName || 'Bác sĩ'}
                      </strong>{' '}
                      — Bệnh nhân {c.patient?.fullName || 'Gia đình'} ({extractEncounterTimeHm(c.scheduledTime)} ·{' '}
                      {formatEncounterDateVi(c.scheduledDate)})
                      <div className="text-rose-700 mt-0.5">{c.conflictDetails}</div>
                    </div>
                    <Badge className="bg-rose-600 text-white shrink-0">CONFLICT_ALERT</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Grid: Duty Shifts & External Encounters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white rounded-2xl border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Ca trực nội viện ({dutyShifts.length})</h3>
              </div>
              <div className="p-4 space-y-3">
                {loading ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Đang tải ca trực...</p>
                ) : dutyShifts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Chưa có ca trực nội viện nào được phân công trong khoảng thời gian này.
                  </p>
                ) : (
                  dutyShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900">
                          {shift.doctor?.doctorName || shift.doctor?.user?.name || 'Bác sĩ trực thuộc'}
                        </div>
                        <div className="text-slate-600 tabular-nums">
                          {formatEncounterDateVi(shift.shiftDate)} · {extractEncounterTimeHm(shift.startTime)} -{' '}
                          {extractEncounterTimeHm(shift.endTime)}
                        </div>
                        {shift.notes && <div className="text-slate-500">{shift.notes}</div>}
                      </div>
                      <Badge variant="outline" className="bg-white shrink-0">
                        {shift.shiftType}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="bg-white rounded-2xl border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Lịch khám ngoại viện &amp; Telehealth ({externalEncounters.length})
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {loading ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Đang tải lịch khám...</p>
                ) : externalEncounters.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Chưa có lịch khám gia đình ngoại viện nào.
                  </p>
                ) : (
                  externalEncounters.map((enc) => {
                    const statusMeta = getEncounterStatusLabel(enc);
                    return (
                      <div
                        key={enc.id}
                        className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                          enc.conflictAlert
                            ? 'bg-rose-50/70 border-rose-200'
                            : 'bg-slate-50 border-slate-200/80'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900">
                            {enc.doctor?.user?.name || enc.doctor?.doctorName || 'Bác sĩ'} →{' '}
                            {enc.patient?.fullName || 'Bệnh nhân gia đình'}
                          </div>
                          <div className="text-slate-600 tabular-nums">
                            {formatEncounterDateVi(enc.scheduledDate)} · {extractEncounterTimeHm(enc.scheduledTime)} ·{' '}
                            {getEncounterTypeLabel(enc.encounterType)}
                          </div>
                          {enc.conflictAlert && enc.conflictDetails && (
                            <div className="text-rose-700 font-medium">{enc.conflictDetails}</div>
                          )}
                        </div>
                        <Badge variant="outline" className="bg-white shrink-0">
                          {statusMeta.label}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'complaints' && <AdminDisputesView />}

      {/* MODAL PHÂN CA TRỰC NỘI VIỆN */}
      <Dialog open={showShiftModal} onOpenChange={setShowShiftModal}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-slate-200 gap-0">
          <DialogHeader className="px-6 py-5 bg-primary text-primary-foreground text-left">
            <DialogTitle className="font-bold text-base text-white">
              Phân ca trực nội viện cho Bác sĩ
            </DialogTitle>
            <DialogDescription className="text-xs text-blue-100 mt-0.5">
              Hệ thống sẽ đối chiếu tự động với lịch khám gia đình ngoại viện để phát hiện trùng giờ.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateShift} className="p-6 space-y-4 text-xs">
            {shiftError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                {shiftError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="shift-doctor" className="font-semibold text-slate-700">
                Bác sĩ trực thuộc CSYT
              </Label>
              <select
                id="shift-doctor"
                value={shiftForm.doctorId}
                onChange={(e) => setShiftForm((prev) => ({ ...prev, doctorId: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-input bg-slate-50/50 font-semibold"
              >
                {doctors.length === 0 ? (
                  <option value="">Không tìm thấy bác sĩ trong cơ sở</option>
                ) : (
                  doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.doctorName || d.id}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shift-type" className="font-semibold text-slate-700">
                Loại ca trực
              </Label>
              <select
                id="shift-type"
                value={shiftForm.shiftType}
                onChange={(e) => handleShiftTypeChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-slate-50/50 font-semibold"
              >
                {SHIFT_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shift-date" className="font-semibold text-slate-700">
                Ngày trực
              </Label>
              <Input
                id="shift-date"
                type="date"
                required
                min={getTodayIsoDate()}
                value={shiftForm.shiftDate}
                onChange={(e) => setShiftForm((prev) => ({ ...prev, shiftDate: e.target.value }))}
                className="h-10 rounded-xl tabular-nums font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="shift-start" className="font-semibold text-slate-700">
                  Giờ bắt đầu
                </Label>
                <Input
                  id="shift-start"
                  type="time"
                  required
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  className="h-10 rounded-xl tabular-nums font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shift-end" className="font-semibold text-slate-700">
                  Giờ kết thúc
                </Label>
                <Input
                  id="shift-end"
                  type="time"
                  required
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  className="h-10 rounded-xl tabular-nums font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shift-notes" className="font-semibold text-slate-700">
                Ghi chú phân ca
              </Label>
              <Textarea
                id="shift-notes"
                rows={2}
                placeholder="Ví dụ: Trực phòng khám Nội tổng quát tầng 2..."
                value={shiftForm.notes}
                onChange={(e) => setShiftForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowShiftModal(false)}
                className="flex-1 rounded-xl font-semibold"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 rounded-xl font-semibold">
                {submitting ? 'Đang lưu...' : 'Xác nhận phân ca'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

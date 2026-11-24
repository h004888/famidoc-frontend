'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { contractsApi, encountersApi } from '@/lib/api';

type SlotWindow = 'MORNING' | 'AFTERNOON';

interface VideoDayAvailability {
  date: string;
  isDayOff: boolean;
  outOfRange: boolean;
  morning: { available: boolean; candidateTimes: string[]; reason?: string };
  afternoon: { available: boolean; candidateTimes: string[]; reason?: string };
}

const QUICK_TAGS = [
  'Hỏi thuốc',
  'Chỉ số bất thường',
  'Tái khám',
  'Triệu chứng mới',
  'Tư vấn dinh dưỡng',
];

function getMonthGridDays(anchorIso: string) {
  const base = new Date(`${anchorIso}T00:00:00`);
  const safe = Number.isNaN(base.getTime()) ? new Date() : base;
  const year = safe.getFullYear();
  const month = safe.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startOffset = firstOfMonth.getDay();
  const totalCells = Math.ceil((startOffset + lastOfMonth.getDate()) / 7) * 7;

  const cells: { iso: string; dayNumber: number; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(year, month, 1 - startOffset + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    cells.push({
      iso: `${yyyy}-${mm}-${dd}`,
      dayNumber: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
    });
  }
  return cells;
}

export default function BookVideoConsultationPage() {
  const router = useRouter();
  const todayIso = new Date().toISOString().slice(0, 10);

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [contractId, setContractId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('Bác sĩ phụ trách');
  const [remainingText, setRemainingText] = useState('');
  const [monthAnchor, setMonthAnchor] = useState(todayIso.slice(0, 7));
  const [days, setDays] = useState<VideoDayAvailability[]>([]);
  const [nearestSlot, setNearestSlot] = useState<{
    date: string;
    slotWindow: SlotWindow;
    suggestedTime: string;
  } | null>(null);

  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [selectedWindow, setSelectedWindow] = useState<SlotWindow>('MORNING');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const gate = await contractsApi.getFamilyGateStatus();
        const active = gate?.activeContract;
        if (!active) {
          if (!cancelled) setLoading(false);
          return;
        }
        const detail = await contractsApi.getMedicalContractDetail(active.id);
        if (cancelled) return;
        setContractId(active.id);
        setDoctorId(detail?.doctor?.id ?? '');
        setDoctorName(detail?.doctor?.doctorName ?? 'Bác sĩ phụ trách');
        const policy = detail?.servicePackage?.videoQuotaPolicy ?? 'FIXED';
        setRemainingText(
          policy === 'UNLIMITED'
            ? 'Không giới hạn'
            : policy === 'CONTRACT'
              ? 'Theo hợp đồng'
              : `Còn ${detail?.remainingTelehealth ?? 0} lượt`,
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!doctorId || !contractId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await (encountersApi as any).getDoctorVideoAvailability(
          doctorId,
          monthAnchor,
          contractId,
        );
        if (cancelled) return;
        setDays(Array.isArray(res?.days) ? res.days : []);
        setNearestSlot(res?.nearestAvailableSlot ?? null);
      } catch {
        if (!cancelled) setDays([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doctorId, contractId, monthAnchor]);

  const dayMap = useMemo(() => {
    const m = new Map<string, VideoDayAvailability>();
    for (const d of days) m.set(d.date, d);
    return m;
  }, [days]);

  const selectedDayInfo = dayMap.get(selectedDate);
  const gridCells = useMemo(() => getMonthGridDays(`${monthAnchor}-01`), [monthAnchor]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleConfirmBooking = async () => {
    if (!contractId) return;
    setSubmitting(true);
    try {
      await encountersApi.createAdHocEncounter({
        contractId,
        encounterType: 'TELEHEALTH',
        visitScope: 'FAMILY',
        desiredDate: selectedDate,
        slotWindow: selectedWindow,
        quickTags: selectedTags,
        reason: reason.trim() || undefined,
      } as any);
      toast.success('Đã gửi yêu cầu Tư vấn Video tới Bác sĩ phụ trách.');
      router.push('/family/appointments');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể đặt lịch Tư vấn Video.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Button asChild variant="ghost" size="sm" className="-ml-2 text-xs">
              <Link href="/family/appointments">← Quay lại Lịch hẹn</Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Đặt lịch Tư vấn Video</h1>
            <p className="text-xs text-slate-500">
              Đối tượng: <strong>Cả hộ gia đình (mặc định)</strong> · {doctorName}
              {remainingText ? ` · ${remainingText}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className={step === 1 ? 'text-primary' : 'text-slate-400'}>
              1. Chọn ngày & buổi
            </span>
            <span className="text-slate-300">──</span>
            <span className={step === 2 ? 'text-primary' : 'text-slate-400'}>2. Xác nhận</span>
          </div>
        </div>

        {loading ? (
          <Card className="p-10 text-center text-xs text-slate-500">
            Đang tải lịch trống của Bác sĩ...
          </Card>
        ) : step === 1 ? (
          <div className="space-y-4">
            {nearestSlot && (
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span>
                  ⚡ Buổi trống gần nhất: <strong>{nearestSlot.date}</strong> ·{' '}
                  <strong>
                    {nearestSlot.slotWindow === 'MORNING'
                      ? 'Khung Sáng (08:00–11:30)'
                      : 'Khung Chiều (13:30–17:30)'}
                  </strong>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedDate(nearestSlot.date);
                    setSelectedWindow(nearestSlot.slotWindow);
                    setStep(2);
                  }}
                >
                  Chọn nhanh ►
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <Card className="lg:col-span-7 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">Chọn ngày trên lịch</h2>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold tabular-nums">{monthAnchor}</span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-500">
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {gridCells.map((cell) => {
                    const info = dayMap.get(cell.iso);
                    const hasSlot = Boolean(info?.morning.available || info?.afternoon.available);
                    const isSelected = cell.iso === selectedDate;
                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        disabled={!cell.isCurrentMonth || !hasSlot}
                        onClick={() => setSelectedDate(cell.iso)}
                        className={`h-12 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : hasSlot && cell.isCurrentMonth
                              ? 'border-slate-200 bg-white hover:border-primary/50 cursor-pointer'
                              : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        <span>{cell.dayNumber}</span>
                        {cell.isCurrentMonth && (
                          <span className="text-[10px]">{hasSlot ? '●' : '○'}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="lg:col-span-5 p-4 space-y-4">
                <div>
                  <h2 className="text-sm font-bold">Chọn khung buổi ({selectedDate})</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Bác sĩ sẽ duyệt 1 chạm và báo giờ gọi cụ thể trong buổi đã chọn.
                  </p>
                </div>

                {(['MORNING', 'AFTERNOON'] as SlotWindow[]).map((win) => {
                  const slot = win === 'MORNING' ? selectedDayInfo?.morning : selectedDayInfo?.afternoon;
                  const available = Boolean(slot?.available);
                  const active = selectedWindow === win && available;
                  return (
                    <button
                      key={win}
                      type="button"
                      disabled={!available}
                      onClick={() => setSelectedWindow(win)}
                      className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                        active
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : available
                            ? 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                            : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span>
                          {win === 'MORNING' ? '☀ Khung Sáng (08:00 – 11:30)' : '🌤 Khung Chiều (13:30 – 17:30)'}
                        </span>
                        <span>{available ? '● Còn chỗ' : '○ Kín'}</span>
                      </div>
                      {!available && slot?.reason && (
                        <p className="text-[11px] mt-1">{slot.reason}</p>
                      )}
                    </button>
                  );
                })}

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    disabled={
                      !(
                        (selectedWindow === 'MORNING' && selectedDayInfo?.morning.available) ||
                        (selectedWindow === 'AFTERNOON' && selectedDayInfo?.afternoon.available)
                      )
                    }
                    onClick={() => setStep(2)}
                  >
                    Tiếp tục ►
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="p-6 max-w-xl mx-auto space-y-4">
            <h2 className="text-base font-bold">Xác nhận đặt Tư vấn Video</h2>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs space-y-1">
              <div>
                Đối tượng: <strong>Cả hộ gia đình (mặc định)</strong>
              </div>
              <div>
                Thời gian: <strong>{selectedDate}</strong> ·{' '}
                <strong>
                  {selectedWindow === 'MORNING'
                    ? 'Khung Sáng (08:00 – 11:30)'
                    : 'Khung Chiều (13:30 – 17:30)'}
                </strong>
              </div>
              <div>
                Bác sĩ: <strong>{doctorName}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold">Chủ đề hỏi nhanh (tùy chọn):</div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-xs border cursor-pointer ${
                        active
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="video-reason" className="text-xs font-semibold block">
                Ghi chú triệu chứng cho Bác sĩ (không bắt buộc)
              </label>
              <Textarea
                id="video-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Có thể bỏ trống để đặt lịch ngay..."
                className="text-xs"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                ← Đổi buổi
              </Button>
              <Button
                type="button"
                disabled={submitting}
                onClick={() => void handleConfirmBooking()}
                className="flex-1"
              >
                {submitting ? 'Đang gửi...' : '✓ Xác nhận đặt lịch'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  encountersApi,
  type EncounterItem,
  type MonthlyAvailabilityDay,
} from '@/lib/api/encounters.api';
import { FullMonthSlotCalendar } from '@/features/appointments/components/full-month-slot-calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function FamilyReschedulePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const encounterId = params?.id || '';

  const [encounter, setEncounter] = useState<EncounterItem | null>(null);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [days, setDays] = useState<MonthlyAvailabilityDay[]>([]);
  const [loadingCal, setLoadingCal] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<MonthlyAvailabilityDay | null>(null);
  const [slotWindow, setSlotWindow] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!encounterId) return;
    encountersApi
      .getEncounterDetail(encounterId)
      .then((item) => {
        setEncounter(item);
        if (item.scheduledDate) {
          setMonth(item.scheduledDate.slice(0, 7));
        }
      })
      .catch(() => toast.error('Không thể tải thông tin buổi khám.'));
  }, [encounterId]);

  const reloadAvailability = () => {
    if (!encounter?.doctorId) return;
    setLoadingCal(true);
    encountersApi
      .getDoctorMonthlyAvailability(encounter.doctorId, month, encounter.contractId, encounterId)
      .then((res) => setDays(res.days ?? []))
      .catch(() => setDays([]))
      .finally(() => setLoadingCal(false));
  };

  useEffect(() => {
    reloadAvailability();
  }, [encounter?.doctorId, encounter?.contractId, month]);

  const handleSelectSlot = (day: MonthlyAvailabilityDay, win: 'MORNING' | 'AFTERNOON') => {
    setAlertMessage(null);
    setSelectedDay(day);
    setSlotWindow(win);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay) {
      setAlertMessage('Vui lòng chọn một ngày còn trống trên lịch.');
      return;
    }
    setSubmitting(true);
    setAlertMessage(null);
    try {
      await encountersApi.requestReschedule(encounterId, {
        proposedDate: selectedDay.date,
        proposedTime: slotWindow === 'MORNING' ? '08:00' : '13:30',
        rescheduleReason: reason.trim() || 'Gia đình đề xuất đổi sang khung giờ thuận tiện hơn',
      });
      toast.success('Đã gửi đề xuất đổi lịch thành công.');
      router.push('/family/appointments');
    } catch (err: any) {
      const code = err?.code ?? err?.data?.code ?? err?.response?.data?.code;
      if (code === 'SLOT_TAKEN' || (err instanceof Error && err.message.includes('Ca này vừa có người đặt'))) {
        toast.error('Ca này vừa có người đặt, vui lòng chọn ca khác');
        setSelectedDay(null);
        reloadAvailability();
      } else {
        setAlertMessage(
          err instanceof Error ? err.message : 'Không thể gửi đề xuất đổi lịch. Vui lòng thử ngày khác.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] py-6 px-4 sm:px-6 lg:px-8">
      <main className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/family/appointments"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 mb-1"
            >
              ← Quay lại Lịch hẹn
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Đề xuất đổi lịch Khám tại nhà với Bác sĩ
            </h1>
            {encounter && (
              <p className="text-xs text-slate-500 mt-1">
                Lịch hiện tại: {encounter.scheduledDate?.slice(0, 10).split('-').reverse().join('/')} ·{' '}
                {(() => {
                  const t = encounter.scheduledTime?.includes('T')
                    ? encounter.scheduledTime.slice(11, 16)
                    : encounter.scheduledTime?.slice(0, 5) || '08:00';
                  return Number.parseInt(t.split(':')[0] || '8', 10) < 12
                    ? 'Khung Sáng (08:00 - 11:30)'
                    : 'Khung Chiều (13:30 - 17:30)';
                })()}{' '}
                · {encounter.doctor?.doctorName || 'Bác sĩ phụ trách'}
              </p>
            )}
          </div>
        </div>

        {alertMessage && (
          <div
            role="alert"
            className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-medium text-rose-800 flex items-center justify-between gap-3"
          >
            <span>{alertMessage}</span>
            <button
              type="button"
              onClick={() => setAlertMessage(null)}
              className="text-rose-600 font-bold text-xs cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
          <div className="space-y-3">
            <FullMonthSlotCalendar
              month={month}
              days={days}
              selectedDate={selectedDay?.date ?? null}
              selectedSlotWindow={slotWindow}
              isLoading={loadingCal}
              onMonthChange={setMonth}
              onSelectSlot={handleSelectSlot}
            />
            <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-[11px] text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
              <span>
                <strong>S:</strong> Khung Sáng (08:00 - 11:30)
              </span>
              <span>
                <strong>C:</strong> Khung Chiều (13:30 - 17:30)
              </span>
              <span>✓ Còn trống · ✗ Đã có gia đình khác</span>
              <span>Quy định: Báo trước 20:00 tối hôm trước · Khung mới tạm giữ tối đa 24 giờ</span>
            </div>
          </div>

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4 text-xs"
          >
            <h2 className="text-sm font-bold text-slate-900">Xác nhận đổi lịch</h2>
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3">
              <div className="text-slate-500">Ngày đã chọn:</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5 tabular-nums">
                {selectedDay
                  ? selectedDay.date.split('-').reverse().join('/')
                  : 'Chưa chọn (bấm vào ô trống trên lịch)'}
              </div>
            </div>

            {selectedDay && (
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Chọn khung còn trống</Label>
                <label
                  className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer ${
                    !selectedDay.morning.available
                      ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                      : slotWindow === 'MORNING'
                        ? 'border-[#2E37A4] bg-indigo-50/50'
                        : 'border-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="slotWindow"
                      disabled={!selectedDay.morning.available}
                      checked={slotWindow === 'MORNING'}
                      onChange={() => setSlotWindow('MORNING')}
                    />
                    <span className="font-semibold">Khung Sáng (08:00 - 11:30)</span>
                  </span>
                  <span>{selectedDay.morning.available ? 'Trống ✓' : 'Kín'}</span>
                </label>

                <label
                  className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer ${
                    !selectedDay.afternoon.available
                      ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                      : slotWindow === 'AFTERNOON'
                        ? 'border-[#2E37A4] bg-indigo-50/50'
                        : 'border-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="slotWindow"
                      disabled={!selectedDay.afternoon.available}
                      checked={slotWindow === 'AFTERNOON'}
                      onChange={() => setSlotWindow('AFTERNOON')}
                    />
                    <span className="font-semibold">Khung Chiều (13:30 - 17:30)</span>
                  </span>
                  <span>{selectedDay.afternoon.available ? 'Trống ✓' : 'Kín'}</span>
                </label>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Lý do đổi lịch (*)</Label>
              <Textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Sáng thứ 5 gia đình có việc bận, xin đổi sang thứ 7..."
                className="rounded-xl text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={!selectedDay || submitting}
              className="w-full rounded-xl font-semibold"
            >
              {submitting ? 'Đang gửi...' : 'Gửi đề xuất tới Bác sĩ'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

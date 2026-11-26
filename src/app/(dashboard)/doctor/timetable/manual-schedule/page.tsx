'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  encountersApi,
  type EncounterItem,
  type MonthlyAvailabilityDay,
} from '@/lib/api/encounters.api';
import { FullMonthSlotCalendar } from '@/features/appointments/components/full-month-slot-calendar';
import { Button } from '@/components/ui/button';

export default function DoctorManualSchedulePage() {
  const [manualItems, setManualItems] = useState<EncounterItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<EncounterItem | null>(null);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [days, setDays] = useState<MonthlyAvailabilityDay[]>([]);
  const [loadingCal, setLoadingCal] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<MonthlyAvailabilityDay | null>(null);
  const [slotWindow, setSlotWindow] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [submitting, setSubmitting] = useState(false);

  const loadManualQueue = useCallback(async () => {
    try {
      const res = await encountersApi.getDoctorTimetable({ pageSize: 100 });
      const pending = (res.data ?? []).filter(
        (e) =>
          e.encounterStatus === 'REQUESTED' &&
          (e.cancelReason?.includes('MANUAL_SLOT_REQUIRED') ||
            String(e.scheduleStage) === 'MANUAL_SLOT_REQUIRED'),
      );
      setManualItems(pending);
      if (pending[0]) {
        setSelectedItem(pending[0]);
        if (pending[0].scheduledDate) {
          setMonth(pending[0].scheduledDate.slice(0, 7));
        }
      } else {
        setSelectedItem(null);
      }
    } catch {
      toast.error('Không thể tải danh sách mốc chờ xếp tay.');
    }
  }, []);

  useEffect(() => {
    void loadManualQueue();
  }, [loadManualQueue]);

  const selectedDoctorId = selectedItem?.doctorId;
  const selectedContractId = selectedItem?.contractId;

  const reloadAvailability = useCallback(() => {
    if (!selectedDoctorId) return;
    setLoadingCal(true);
    encountersApi
      .getDoctorMonthlyAvailability(selectedDoctorId, month, selectedContractId)
      .then((res) => setDays(res.days ?? []))
      .catch(() => setDays([]))
      .finally(() => setLoadingCal(false));
  }, [selectedDoctorId, selectedContractId, month]);

  useEffect(() => {
    reloadAvailability();
  }, [reloadAvailability]);

  const handleConfirmManual = async () => {
    if (!selectedItem || !selectedDay) return;
    setSubmitting(true);
    setAlertMessage(null);
    try {
      await encountersApi.doctorManualSchedule(selectedItem.id, {
        proposedDate: selectedDay.date,
        slotWindow,
      });
      toast.success('Đã chốt lịch xếp tay thành công.');
      setSelectedDay(null);
      await loadManualQueue();
    } catch (err: any) {
      const code = err?.code ?? err?.data?.code ?? err?.response?.data?.code;
      if (code === 'SLOT_TAKEN' || (err instanceof Error && err.message.includes('Ca này vừa có người đặt'))) {
        toast.error('Ca này vừa có người đặt, vui lòng chọn ca khác');
        setSelectedDay(null);
        reloadAvailability();
      } else {
        setAlertMessage(
          err instanceof Error ? err.message : 'Không thể chốt lịch. Vui lòng kiểm tra lại.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] py-6 px-4 sm:px-6 lg:px-8">
      <main className="max-w-7xl mx-auto space-y-5">
        <div>
          <Link
            href="/doctor/timetable"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 mb-1"
          >
            ← Quay lại Lịch làm việc
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Bác sĩ tự xếp tay — Chọn trực tiếp trên lịch cả tháng (EF3)
          </h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mốc chờ xếp tay ({manualItems.length})
            </h2>
            {manualItems.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Không còn mốc nào cần xếp tay.
              </p>
            ) : (
              <div className="space-y-2">
                {manualItems.map((item) => {
                  const active = selectedItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedItem(item);
                        setSelectedDay(null);
                        setAlertMessage(null);
                      }}
                      className={`w-full text-left rounded-xl border p-3 text-xs transition-all cursor-pointer ${
                        active
                          ? 'border-[#2E37A4] bg-indigo-50/50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-slate-900">
                        {item.contract?.familyUnit?.representativeUser?.fullName || 'Hộ gia đình'}
                      </div>
                      <div className="text-slate-500 mt-0.5 tabular-nums">
                        Dự kiến gốc: {item.scheduledDate?.slice(0, 10).split('-').reverse().join('/')}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <FullMonthSlotCalendar
              month={month}
              days={days}
              selectedDate={selectedDay?.date ?? null}
              selectedSlotWindow={slotWindow}
              isLoading={loadingCal}
              onMonthChange={setMonth}
              onSelectSlot={(day, win) => {
                setAlertMessage(null);
                setSelectedDay(day);
                setSlotWindow(win);
              }}
            />

            {selectedItem && selectedDay && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">
                    Ngày chọn: {selectedDay.date.split('-').reverse().join('/')}
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="manualSlot"
                        disabled={!selectedDay.morning.available}
                        checked={slotWindow === 'MORNING'}
                        onChange={() => setSlotWindow('MORNING')}
                      />
                      <span>Khung Sáng {selectedDay.morning.available ? '✓' : '(Kín)'}</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="manualSlot"
                        disabled={!selectedDay.afternoon.available}
                        checked={slotWindow === 'AFTERNOON'}
                        onChange={() => setSlotWindow('AFTERNOON')}
                      />
                      <span>Khung Chiều {selectedDay.afternoon.available ? '✓' : '(Kín)'}</span>
                    </label>
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleConfirmManual()}
                  className="rounded-xl font-semibold"
                >
                  {submitting ? 'Đang chốt...' : 'Chốt lịch ngay'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

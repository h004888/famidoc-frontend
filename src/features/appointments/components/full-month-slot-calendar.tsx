'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import type { MonthlyAvailabilityDay } from '@/lib/api/encounters.api';

interface FullMonthSlotCalendarProps {
  month: string; // YYYY-MM
  days: MonthlyAvailabilityDay[];
  selectedDate: string | null;
  isLoading?: boolean;
  onMonthChange: (nextMonth: string) => void;
  onSelectValidDay: (day: MonthlyAvailabilityDay) => void;
  onUnavailableClick: (message: string, day: MonthlyAvailabilityDay) => void;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function FullMonthSlotCalendar({
  month,
  days,
  selectedDate,
  isLoading,
  onMonthChange,
  onSelectValidDay,
  onUnavailableClick,
}: FullMonthSlotCalendarProps) {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  const firstDayOfWeek = new Date(year, monthIdx, 1).getDay(); // 0=CN

  const leadingBlanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const weekdayHeaders = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const now = new Date();
  const toLocalIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayIso = toLocalIso(now);
  const todayMonth = todayIso.slice(0, 7);

  // BR-1 chuẩn hóa: Khóa hôm nay; nếu đã qua 20:00 thì khóa luôn ngày mai (T+1)
  const minSelectableDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  minSelectableDate.setDate(minSelectableDate.getDate() + (now.getHours() >= 20 ? 2 : 1));
  const minSelectableIso = toLocalIso(minSelectableDate);

  const handleCellClick = (day: MonthlyAvailabilityDay) => {
    if (day.date < minSelectableIso) {
      return;
    }
    if (day.isDayOff) {
      onUnavailableClick(
        `Ngày ${day.date.split('-').reverse().join('/')} là ${day.dayOffReason || 'ngày nghỉ'}. Vui lòng chọn ngày làm việc khác.`,
        day,
      );
      return;
    }
    if (day.familyHasVisit) {
      onUnavailableClick(
        `Ngày ${day.date.split('-').reverse().join('/')} gia đình đã có 1 lượt khám (quy tắc tối đa 1 lượt/ngày). Vui lòng chọn ngày khác!`,
        day,
      );
      return;
    }
    if (!day.morning.available && !day.afternoon.available) {
      onUnavailableClick(
        `Ngày ${day.date.split('-').reverse().join('/')} Bác sĩ đã kín lịch (đủ 2/2 khung Sáng & Chiều). Vui lòng chọn ngày khác còn trống!`,
        day,
      );
      return;
    }
    onSelectValidDay(day);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-900 tabular-nums">
          Tháng {Number(monthStr)}, {yearStr}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(todayMonth)}
            className="h-8 text-xs"
          >
            Hôm nay
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Tháng trước"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            className="h-8 w-8"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Tháng sau"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            className="h-8 w-8"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-xs text-slate-500">Đang tải lịch cả tháng...</div>
      ) : (
        <div className="p-3 sm:p-4 overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {weekdayHeaders.map((w) => (
                <div key={w} className="text-center text-xs font-semibold text-slate-500 py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {leadingBlanks.map((b) => (
                <div key={`blank-${b}`} className="h-[88px] rounded-xl bg-slate-50/40 border border-slate-100" />
              ))}

              {days.map((day) => {
                const dayNum = Number(day.date.slice(8, 10));
                const isLockedByCutoff = day.date < minSelectableIso;
                const isSelected = selectedDate === day.date;
                const isFull = !day.morning.available && !day.afternoon.available;
                const isBlocked = day.isDayOff || day.familyHasVisit || isFull;

                const cutoffLabel =
                  day.date < todayIso
                    ? 'Đã qua'
                    : day.date === todayIso
                      ? 'Hôm nay'
                      : 'Quá 20:00';

                return (
                  <button
                    key={day.date}
                    type="button"
                    disabled={isLockedByCutoff}
                    aria-disabled={isLockedByCutoff}
                    onClick={() => handleCellClick(day)}
                    className={`h-[88px] rounded-xl border p-2 text-left flex flex-col justify-between transition-all ${
                      isLockedByCutoff
                        ? 'border-slate-200/60 bg-slate-100/80 text-slate-400 opacity-55 cursor-not-allowed'
                        : isSelected
                          ? 'border-[#2E37A4] bg-indigo-50/50 ring-2 ring-[#2E37A4]/30 cursor-pointer'
                          : isBlocked
                            ? 'border-rose-200/70 bg-rose-50/30 hover:bg-rose-50/60 cursor-pointer'
                            : 'border-slate-200/80 bg-white hover:border-primary/50 hover:bg-slate-50/60 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      {isLockedByCutoff ? (
                        <span className="text-[10px] font-medium text-slate-400">
                          {cutoffLabel}
                        </span>
                      ) : day.isDayOff ? (
                        <span className="text-[10px] font-semibold text-slate-400">Nghỉ</span>
                      ) : day.familyHasVisit ? (
                        <span className="text-[10px] font-semibold text-amber-700">Đã có lịch</span>
                      ) : isFull ? (
                        <span className="text-[10px] font-bold text-rose-600">KÍN</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-700">Trống</span>
                      )}
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          isLockedByCutoff
                            ? 'text-slate-400'
                            : isSelected
                              ? 'text-[#2E37A4]'
                              : 'text-slate-800'
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>

                    {!isLockedByCutoff && !day.isDayOff && !day.familyHasVisit && (
                      <div className="space-y-0.5 text-[10px] font-medium tabular-nums">
                        <div className={day.morning.available ? 'text-emerald-700' : 'text-slate-400'}>
                          S: {day.morning.available ? '✓' : '✗'}
                        </div>
                        <div className={day.afternoon.available ? 'text-emerald-700' : 'text-slate-400'}>
                          C: {day.afternoon.available ? '✓' : '✗'}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

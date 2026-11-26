'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import type { MonthlyAvailabilityDay, MonthlySlotStatus } from '@/lib/api/encounters.api';

interface FullMonthSlotCalendarProps {
  month: string; // YYYY-MM
  days: MonthlyAvailabilityDay[];
  selectedDate: string | null;
  selectedSlotWindow?: 'MORNING' | 'AFTERNOON' | null;
  isLoading?: boolean;
  onMonthChange: (nextMonth: string) => void;
  onSelectSlot?: (day: MonthlyAvailabilityDay, slotWindow: 'MORNING' | 'AFTERNOON') => void;
  onSelectValidDay?: (day: MonthlyAvailabilityDay) => void;
  onUnavailableClick?: (message: string, day: MonthlyAvailabilityDay) => void;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getSlotVisual(
  slot: MonthlySlotStatus,
  isDayMuted: boolean,
  isSelected: boolean,
): { className: string; tooltip: string; subLabel?: string } {
  const tooltip = slot.label || slot.reason || (slot.available ? 'Còn trống' : 'Không khả dụng');
  if (isSelected && slot.available && !isDayMuted) {
    return {
      className: 'border-[#2E37A4] bg-[#2E37A4] text-white font-semibold',
      tooltip,
    };
  }
  if (isDayMuted || slot.reasonCode === 'DAY_OFF' || slot.reasonCode === 'PAST' || slot.reasonCode === 'OUT_OF_CONTRACT') {
    return {
      className: 'border-slate-200 bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed',
      tooltip,
    };
  }
  if (slot.reasonCode === 'OWN_VISIT') {
    return {
      className: 'border-sky-200 bg-sky-50 text-sky-800 opacity-90 cursor-not-allowed',
      tooltip,
      subLabel: 'Lịch của bạn',
    };
  }
  if (!slot.available) {
    return {
      className: 'border-rose-200 bg-rose-50 text-rose-700 opacity-85 cursor-not-allowed',
      tooltip,
    };
  }
  return {
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer',
    tooltip,
  };
}

export function FullMonthSlotCalendar({
  month,
  days,
  selectedDate,
  selectedSlotWindow,
  isLoading,
  onMonthChange,
  onSelectSlot,
  onSelectValidDay,
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

  const handleSlotClick = (
    day: MonthlyAvailabilityDay,
    slotWindow: 'MORNING' | 'AFTERNOON',
    isSlotDisabled: boolean,
  ) => {
    if (isSlotDisabled) return;
    onSelectSlot?.(day, slotWindow);
    onSelectValidDay?.(day);
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
        <div className="p-3 sm:p-4 overflow-x-auto space-y-3">
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
                <div
                  key={`blank-${b}`}
                  className="min-h-[96px] rounded-xl bg-slate-50/40 border border-slate-100"
                />
              ))}

              {days.map((day) => {
                const dayNum = Number(day.date.slice(8, 10));
                const isLockedByCutoff = day.date < minSelectableIso;
                const isOutOfContract = Boolean(day.isOutOfContract);
                const isDayMuted = isLockedByCutoff || isOutOfContract || day.isDayOff;
                const isDaySelected = selectedDate === day.date;

                const cutoffLabel =
                  day.date < todayIso
                    ? 'Đã qua'
                    : day.date === todayIso
                      ? 'Hôm nay'
                      : 'Quá 20:00';

                const slots: Array<{ win: 'MORNING' | 'AFTERNOON'; label: string; data: MonthlySlotStatus }> = [
                  { win: 'MORNING', label: 'Sáng', data: day.morning },
                  { win: 'AFTERNOON', label: 'Chiều', data: day.afternoon },
                ];

                return (
                  <div
                    key={day.date}
                    className={`min-h-[96px] rounded-xl border p-1.5 flex flex-col justify-between gap-1 transition-all ${
                      isDayMuted
                        ? 'border-slate-200/60 bg-slate-100/70 opacity-60'
                        : isDaySelected
                          ? 'border-[#2E37A4] bg-indigo-50/30 ring-1 ring-[#2E37A4]/30'
                          : 'border-slate-200/80 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[10px] font-medium text-slate-400 truncate">
                        {isLockedByCutoff
                          ? cutoffLabel
                          : isOutOfContract
                            ? 'Ngoài hạn'
                            : day.isDayOff
                              ? 'Nghỉ'
                              : ''}
                      </span>
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          isDayMuted
                            ? 'text-slate-400'
                            : isDaySelected
                              ? 'text-[#2E37A4]'
                              : 'text-slate-800'
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {slots.map(({ win, label, data }) => {
                        const isDisabled = isDayMuted || !data.available;
                        const isSelected = isDaySelected && selectedSlotWindow === win;
                        const visual = getSlotVisual(data, isDayMuted, isSelected);
                        return (
                          <button
                            key={win}
                            type="button"
                            disabled={isDisabled}
                            aria-disabled={isDisabled}
                            title={visual.tooltip}
                            onClick={() => handleSlotClick(day, win, isDisabled)}
                            className={`w-full rounded-md border px-1.5 py-0.5 text-[10px] font-medium flex items-center justify-between gap-1 transition-colors ${visual.className}`}
                          >
                            <span>{label}</span>
                            {visual.subLabel ? (
                              <span className="text-[9px] truncate">{visual.subLabel}</span>
                            ) : (
                              <span>{!isDisabled ? '✓' : '✗'}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-100 border border-emerald-300 inline-block" />
              <span>Còn trống</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-100 border border-rose-300 inline-block" />
              <span>Đã có lịch</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-200 border border-slate-300 inline-block opacity-60" />
              <span>Không khả dụng</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

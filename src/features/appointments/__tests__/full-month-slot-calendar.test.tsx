import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FullMonthSlotCalendar } from '../components/full-month-slot-calendar';
import type { MonthlyAvailabilityDay } from '@/lib/api/encounters.api';

describe('FullMonthSlotCalendar (per-slot selection)', () => {
  const days: MonthlyAvailabilityDay[] = [
    {
      date: '2099-05-04',
      isDayOff: false,
      familyHasVisit: false,
      morning: {
        available: false,
        reasonCode: 'TAKEN',
        label: 'Đã có lịch',
        reason: 'Đã có lịch',
      },
      afternoon: {
        available: true,
        reasonCode: 'AVAILABLE',
        label: 'Còn trống',
        reason: null,
      },
    },
    {
      date: '2099-05-05',
      isDayOff: false,
      familyHasVisit: true,
      morning: {
        available: false,
        reasonCode: 'OWN_VISIT',
        label: 'Lịch của bạn',
        reason: 'Lịch của bạn',
      },
      afternoon: {
        available: false,
        reasonCode: 'FAMILY_SAME_DAY',
        label: 'Gia đình đã có lượt trong ngày',
        reason: 'Gia đình đã có lượt trong ngày',
      },
    },
  ];

  it('hiển thị nút Sáng/Chiều theo trạng thái, disable ca kín, gọi onSelectSlot khi click ca trống, hiện OWN_VISIT và legend', () => {
    const onSelectSlot = vi.fn();

    render(
      <FullMonthSlotCalendar
        month="2099-05"
        days={days}
        selectedDate={null}
        onMonthChange={vi.fn()}
        onSelectSlot={onSelectSlot}
      />,
    );

    const morningBtns = screen.getAllByRole('button', { name: /Sáng/i });
    const afternoonBtns = screen.getAllByRole('button', { name: /Chiều/i });

    // (a) nút Sáng ngày 04 có disabled và title="Đã có lịch"
    expect(morningBtns[0]).toBeDisabled();
    expect(morningBtns[0]).toHaveAttribute('title', 'Đã có lịch');

    // (c) click Sáng không gọi onSelectSlot
    fireEvent.click(morningBtns[0]);
    expect(onSelectSlot).not.toHaveBeenCalled();

    // (b) click Chiều gọi onSelectSlot(day, 'AFTERNOON')
    fireEvent.click(afternoonBtns[0]);
    expect(onSelectSlot).toHaveBeenCalledTimes(1);
    expect(onSelectSlot).toHaveBeenCalledWith(days[0], 'AFTERNOON');

    // (d) ca OWN_VISIT hiển thị nhãn "Lịch của bạn"
    expect(screen.getByText(/Lịch của bạn/i)).toBeInTheDocument();

    // (e) legend hiển thị 3 mục "Còn trống", "Đã có lịch", "Không khả dụng"
    expect(screen.getByText('Còn trống')).toBeInTheDocument();
    expect(screen.getByText('Đã có lịch')).toBeInTheDocument();
    expect(screen.getByText('Không khả dụng')).toBeInTheDocument();
  });
});

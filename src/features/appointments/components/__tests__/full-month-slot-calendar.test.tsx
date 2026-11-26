import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FullMonthSlotCalendar } from '../full-month-slot-calendar';
import type { MonthlyAvailabilityDay } from '@/lib/api/encounters.api';

describe('FullMonthSlotCalendar', () => {
  it('khóa các ngày ngoài hạn hiệu lực hợp đồng (isOutOfContract=true) và không cho chọn', () => {
    const onSelectSlot = vi.fn();
    const days: MonthlyAvailabilityDay[] = [
      {
        date: '2099-05-20',
        isDayOff: false,
        familyHasVisit: false,
        isOutOfContract: false,
        morning: { available: true },
        afternoon: { available: true },
      },
      {
        date: '2099-05-21',
        isDayOff: false,
        familyHasVisit: false,
        isOutOfContract: true,
        outOfContractReason: 'Ngoài thời hạn hiệu lực gói chăm sóc',
        morning: { available: false, reason: 'Ngoài thời hạn hiệu lực gói chăm sóc' },
        afternoon: { available: false, reason: 'Ngoài thời hạn hiệu lực gói chăm sóc' },
      },
    ];

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

    expect(morningBtns[0]).not.toBeDisabled();
    expect(afternoonBtns[0]).not.toBeDisabled();
    expect(morningBtns[1]).toBeDisabled();
    expect(afternoonBtns[1]).toBeDisabled();
    expect(screen.getByText(/Ngoài hạn/i)).toBeInTheDocument();

    fireEvent.click(morningBtns[1]);
    expect(onSelectSlot).not.toHaveBeenCalled();
  });
});

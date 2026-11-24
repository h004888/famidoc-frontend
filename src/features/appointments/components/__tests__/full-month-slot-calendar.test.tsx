import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FullMonthSlotCalendar } from '../full-month-slot-calendar';
import type { MonthlyAvailabilityDay } from '@/lib/api/encounters.api';

describe('FullMonthSlotCalendar', () => {
  it('khóa các ngày ngoài hạn hiệu lực hợp đồng (isOutOfContract=true) và không cho chọn', () => {
    const onSelectValidDay = vi.fn();
    const onUnavailableClick = vi.fn();
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
        onSelectValidDay={onSelectValidDay}
        onUnavailableClick={onUnavailableClick}
      />,
    );

    const validBtn = screen.getByRole('button', { name: /20/ });
    const expiredBtn = screen.getByRole('button', { name: /21/ });

    expect(validBtn).not.toBeDisabled();
    expect(expiredBtn).toBeDisabled();
    expect(expiredBtn).toHaveTextContent(/Ngoài hạn gói/i);

    fireEvent.click(expiredBtn);
    expect(onSelectValidDay).not.toHaveBeenCalled();
  });
});

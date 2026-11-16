import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AdminDashboardView } from '../admin-dashboard-view';

describe('AdminDashboardView', () => {
  it('switches appointment statistics period tabs and updates summary counts', () => {
    const { container } = render(<AdminDashboardView />);

    expect(screen.getByText('6.314')).toBeInTheDocument();

    const weekTab = screen.getByRole('tab', { name: 'Tuần' });
    fireEvent.mouseDown(weekTab);
    fireEvent.click(weekTab);

    expect(screen.getByText('1.482')).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });

  it('filters arbitration queue by severity and opens quick inspection sheet', () => {
    render(<AdminDashboardView />);

    expect(screen.getAllByText('DISP-2026-004').length).toBeGreaterThan(0);
    expect(screen.getAllByText('DISP-2026-002').length).toBeGreaterThan(0);

    const highFilterTab = screen.getByRole('tab', { name: 'Khẩn' });
    fireEvent.mouseDown(highFilterTab);
    fireEvent.click(highFilterTab);

    expect(screen.getAllByText('DISP-2026-004').length).toBeGreaterThan(0);
    expect(screen.queryByText('DISP-2026-002')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Xem nhanh' }));
    expect(screen.getByText(/Chi tiết Tranh chấp DISP-2026-004/i)).toBeInTheDocument();
  });
});

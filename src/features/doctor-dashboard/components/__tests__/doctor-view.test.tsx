import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoctorDashboardView } from '../doctor-dashboard-view';

describe('UT-CMP-15: DoctorDashboardView Touch Target & Accessibility', () => {
  it('renders "Mở Phiếu khám" button with accessible touch target styling', () => {
    render(<DoctorDashboardView />);
    const openBtns = screen.getAllByRole('button', { name: /Mở Phiếu khám/i });
    expect(openBtns.length).toBeGreaterThan(0);
    // Button must have py-2 or min-h-[40px]
    expect(openBtns[0].className).toContain('py-2');
  });
});

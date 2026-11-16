import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiStatCard } from '../kpi-stat-card';

describe('KpiStatCard', () => {
  it('renders KPI title, tabular value, badge, and complies with Be Vietnam Pro typography rules', () => {
    const { container } = render(
      <KpiStatCard
        title="Hợp đồng Hiệu lực"
        value="3.250 Hộ"
        badgeText="+142 hộ"
        period="trong 7 ngày qua"
        subtitle="Đang hoạt động trên toàn quốc"
        icon="family_restroom"
      />
    );

    expect(screen.getByText('Hợp đồng Hiệu lực')).toBeInTheDocument();
    expect(screen.getByText('3.250 Hộ')).toHaveClass('tabular-nums');
    expect(screen.getByText('+142 hộ')).toBeInTheDocument();
    expect(screen.getByText('trong 7 ngày qua')).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });
});

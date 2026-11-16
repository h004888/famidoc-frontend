import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardPageShell } from '../dashboard-page-shell';
import { ResponsiveDataList } from '../responsive-data-list';

describe('DashboardPageShell', () => {
  it('renders children inside a div container without creating a nested main landmark', () => {
    const { container } = render(
      <DashboardPageShell>
        <h1>Tiêu đề trang</h1>
      </DashboardPageShell>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tiêu đề trang');
    expect(container.querySelector('main')).toBeNull();
    expect(container.innerHTML).toContain('max-w-7xl');
    expect(container.innerHTML).toContain('px-4');
  });
});

describe('ResponsiveDataList', () => {
  const items = [
    { id: '1', name: 'Bệnh viện A' },
    { id: '2', name: 'Phòng khám B' },
  ];

  it('renders both desktop table container and mobile card list', () => {
    render(
      <ResponsiveDataList
        items={items}
        keyExtractor={(item) => item.id}
        renderDesktopTable={() => <table><tbody><tr><td>Desktop Row</td></tr></tbody></table>}
        renderMobileCard={(item) => <div>Mobile: {item.name}</div>}
      />
    );

    expect(screen.getByText('Desktop Row')).toBeInTheDocument();
    expect(screen.getByText('Mobile: Bệnh viện A')).toBeInTheDocument();
    expect(screen.getByText('Mobile: Phòng khám B')).toBeInTheDocument();
  });

  it('renders EmptyState when items array is empty', () => {
    render(
      <ResponsiveDataList
        items={[]}
        keyExtractor={(item: { id: string }) => item.id}
        renderDesktopTable={() => null}
        renderMobileCard={() => null}
        emptyTitle="Chưa có dữ liệu"
      />
    );

    expect(screen.getByText('Chưa có dữ liệu')).toBeInTheDocument();
  });
});

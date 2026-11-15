import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContractTrackingPage from '@/app/(dashboard)/family/subscription/tracking/page';

vi.mock('@/features/subscription-contract', () => ({
  ContractSigningTrackerView: ({ contractId }: { contractId?: string }) => (
    <div data-testid="tracker" data-contract-id={contractId ?? ''} />
  ),
}));

describe('Trang theo dõi tiến độ ký hợp đồng 4 bên', () => {
  it('truyền contractId từ query param xuống view', async () => {
    const ui = await ContractTrackingPage({
      searchParams: Promise.resolve({ contractId: 'ctr-123' }),
    });
    render(ui);

    expect(screen.getByTestId('tracker')).toHaveAttribute(
      'data-contract-id',
      'ctr-123'
    );
  });

  it('không truyền mã hợp đồng khi đường dẫn không có tham số', async () => {
    const ui = await ContractTrackingPage({
      searchParams: Promise.resolve({}),
    });
    render(ui);

    expect(screen.getByTestId('tracker')).toHaveAttribute(
      'data-contract-id',
      ''
    );
  });

  it('bỏ qua contractId không phải chuỗi (ví dụ mảng tham số lặp)', async () => {
    const ui = await ContractTrackingPage({
      searchParams: Promise.resolve({ contractId: ['a', 'b'] }),
    });
    render(ui);

    expect(screen.getByTestId('tracker')).toHaveAttribute(
      'data-contract-id',
      ''
    );
  });
});

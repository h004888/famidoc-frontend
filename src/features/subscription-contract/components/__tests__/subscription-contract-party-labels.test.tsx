import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubscriptionContractView } from '../subscription-contract-view';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe('SubscriptionContractView - quy ước nhãn Bên A/B/C/D', () => {
  it('hiển thị bốn thẻ bên theo đúng thứ tự A/B/C/D', () => {
    render(<SubscriptionContractView />);

    expect(
      screen.getByText('BÊN A · ĐẠI DIỆN HỘ GIA ĐÌNH')
    ).toBeInTheDocument();
    expect(
      screen.getByText('BÊN B · CƠ SỞ Y TẾ ĐỐI TÁC')
    ).toBeInTheDocument();
    expect(screen.getByText('BÊN C · BÁC SĨ PHỤ TRÁCH')).toBeInTheDocument();
    expect(
      screen.getByText('BÊN D · NỀN TẢNG FAMIDOC')
    ).toBeInTheDocument();
  });

  it('không còn nhãn cũ gán nền tảng là Bên B hoặc bác sĩ là Bên D', () => {
    render(<SubscriptionContractView />);

    expect(
      screen.queryByText('BÊN B · NỀN TẢNG FAMIDOC')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('BÊN D · BÁC SĨ PHỤ TRÁCH')
    ).not.toBeInTheDocument();
  });
});

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContractSigningWizard } from '../contract-signing-wizard';

describe('ContractSigningWizard - quy ước nhãn Bên A/B/C/D', () => {
  it('dùng đúng nhãn bên trong nội dung hợp đồng điện tử', () => {
    render(<ContractSigningWizard />);

    fireEvent.click(screen.getByRole('button', { name: /Bước 4/i }));

    expect(screen.getByText(/Bên A \(Gia đình\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Bên B \(Cơ sở y tế bảo trợ\)/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Bên C \(Bác sĩ chuyên môn\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Bên D \(Vận hành nền tảng\)/)
    ).toBeInTheDocument();
  });

  it('không dùng nhãn cũ gán bác sĩ là Bên B', () => {
    render(<ContractSigningWizard />);

    fireEvent.click(screen.getByRole('button', { name: /Bước 4/i }));

    expect(
      screen.queryByText(/Bên B \(Bác sĩ chuyên môn\)/)
    ).not.toBeInTheDocument();
  });
});
